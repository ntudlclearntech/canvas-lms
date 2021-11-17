# frozen_string_literal: true

#
# Copyright (C) 2011 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.

module Canvas
  # defines the behavior when a protected attribute is assigned to in mass
  # assignment. The default, and Rails' normal behavior, is to just :log. Set
  # this to :raise to raise an exception.
  mattr_accessor :protected_attribute_error

  def self.active_record_foreign_key_check(name, type, options)
    if name.to_s.end_with?('_id') && type.to_s == 'integer' && options[:limit].to_i < 8
      raise ArgumentError, <<~TEXT
        All foreign keys need to be at least 8-byte integers. #{name}
        looks like a foreign key, please add this option: `:limit => 8`
      TEXT
    end
  end

  def self.redis
    CanvasCache::Redis.redis
  end

  def self.redis_config
    CanvasCache::Redis.config
  end

  def self.redis_enabled?
    CanvasCache::Redis.enabled?
  end

  def self.reconnect_redis
    Canvas::Redis.reconnect_redis
  end

  def self.cache_store_config_for(cluster)
    yaml_config = ConfigFile.load("cache_store", cluster)
    consul_config = YAML.load(Canvas::DynamicSettings.find(tree: :private, cluster: cluster)["cache_store.yml"] || "{}") || {}
    consul_config = consul_config.with_indifferent_access if consul_config.is_a?(Hash)

    consul_config.presence || yaml_config
  end

  def self.lookup_cache_store(config, cluster)
    config = { 'cache_store' => 'nil_store' }.merge(config)
    if config['cache_store'] == 'redis_store'
      ActiveSupport::Deprecation.warn("`redis_store` is no longer supported. Please change to `redis_cache_store`, and change `servers` to `url`.")
      config['cache_store'] = 'redis_cache_store'
      config['url'] = config['servers'] if config['servers']
    end

    case config.delete('cache_store')
    when 'redis_cache_store'
      Canvas::Redis.patch
      # if cache and redis data are configured identically, we want to share connections
      if config.except('expires_in') == {} && cluster == Rails.env && Canvas.redis_enabled?
        ActiveSupport::Cache.lookup_store(:redis_cache_store, redis: Canvas.redis)
      else
        # merge in redis.yml, but give precedence to cache_store.yml
        redis_config = (ConfigFile.load('redis', cluster) || {})
        config = redis_config.merge(config) if redis_config.is_a?(Hash)
        # back compat
        config[:url] = config[:servers] if config[:servers]
        # config has to be a vanilla hash, with symbol keys, to auto-convert to kwargs
        ActiveSupport::Cache.lookup_store(:redis_cache_store, config.to_h.symbolize_keys)
      end
    when 'memory_store'
      ActiveSupport::Cache.lookup_store(:memory_store)
    when 'nil_store', 'null_store'
      ActiveSupport::Cache.lookup_store(:null_store)
    end
  end

  # `sample` reports KB, not B
  if File.directory?("/proc")
    # linux w/ proc fs
    LINUX_PAGE_SIZE = (size = `getconf PAGESIZE`.to_i
                       size > 0 ? size : 4096)
    def self.sample_memory
      s = File.read("/proc/#{Process.pid}/statm").to_i rescue 0
      s * LINUX_PAGE_SIZE / 1024
    end
  else
    # generic unix solution
    def self.sample_memory
      if Rails.env.test?
        0
      else
        # hmm this is actually resident set size, doesn't include swapped-to-disk
        # memory.
        `ps -o rss= -p #{Process.pid}`.to_i
      end
    end
  end

  # can be called by plugins to allow reloading of that plugin in dev mode
  # pass in the path to the plugin directory
  # e.g., in the vendor/plugins/<plugin_name>/init.rb or
  # gems/plugins/<plugin_name>/lib/<plugin_name>/engine.rb:
  #     Canvas.reloadable_plugin(File.dirname(__FILE__))
  def self.reloadable_plugin(dirname)
    return unless Rails.env.development?

    base_path = File.expand_path(dirname)
    base_path.gsub(%r{/lib/[^/]*$}, '')
    ActiveSupport::Dependencies.autoload_once_paths.reject! { |p|
      p[0, base_path.length] == base_path
    }
  end

  def self.revision
    return @revision if defined?(@revision)

    @revision = if Rails.root.join("VERSION").file?
                  Rails.root.join("VERSION").readlines.first.try(:strip)
                else
                  nil
                end
  end

  DEFAULT_RETRY_CALLBACK = ->(ex, tries) {
    Rails.logger.debug do
      {
        error_class: ex.class,
        error_message: ex.message,
        error_backtrace: ex.backtrace,
        tries: tries,
        message: "Retrying service call!"
      }.to_json
    end
  }

  DEFAULT_RETRIABLE_OPTIONS = {
    interval: ->(attempts) { 0.5 + (4**(attempts - 1)) }, # Sleeps: 0.5, 4.5, 16.5
    on_retry: DEFAULT_RETRY_CALLBACK,
    tries: 3,
  }.freeze
  def self.retriable(opts = {}, &block)
    if opts[:on_retry]
      original_callback = opts[:on_retry]
      opts[:on_retry] = ->(ex, tries) {
        original_callback.call(ex, tries)
        DEFAULT_RETRY_CALLBACK.call(ex, tries)
      }
    end
    options = DEFAULT_RETRIABLE_OPTIONS.merge(opts)
    Retriable.retriable(options, &block)
  end

  def self.installation_uuid
    installation_uuid = Setting.get("installation_uuid", "")
    if installation_uuid == ""
      installation_uuid = SecureRandom.uuid
      Setting.set("installation_uuid", installation_uuid)
    end
    installation_uuid
  end

  def self.timeout_protection_error_ttl(service_name)
    (Setting.get("service_#{service_name}_error_ttl", nil) ||
     Setting.get("service_generic_error_ttl", 1.minute.to_s)).to_i
  end

  def self.timeout_protection_method(service_name)
    Setting.get("service_#{service_name}_timeout_protection_method", nil)
  end

  # protection against calling external services that could timeout or misbehave.
  # we keep track of timeouts in redis, and if a given service times out more
  # than X times before the redis key expires in Y seconds (reset on each
  # failure), we stop even trying to contact the service until the Y seconds
  # passes.
  #
  # if redis isn't enabled, we'll still apply the timeout, but we won't track failures.
  #
  # all the configurable params have service-specific Settings with fallback to
  # generic Settings.
  def self.timeout_protection(service_name, options = {}, &block)
    timeout = (Setting.get("service_#{service_name}_timeout", nil) || options[:fallback_timeout_length] || Setting.get("service_generic_timeout", 15.seconds.to_s)).to_f

    if Canvas.redis_enabled?
      if timeout_protection_method(service_name) == "percentage"
        percent_short_circuit_timeout(Canvas.redis, service_name, timeout, &block)
      else
        short_circuit_timeout(Canvas.redis, service_name, timeout, &block)
      end
    else
      Timeout.timeout(timeout, &block)
    end
  rescue TimeoutCutoff, Timeout::Error => e
    log_message = if e.is_a?(TimeoutCutoff)
                    "Skipping service call due to error count: #{service_name} #{e.error_count}"
                  else
                    "Timeout during service call: #{service_name}"
                  end
    Rails.logger.error(log_message)
    Canvas::Errors.capture_exception(:service_timeout, e, :warn)
    raise if options[:raise_on_timeout]

    nil
  end

  def self.timeout_protection_cutoff(service_name)
    (Setting.get("service_#{service_name}_cutoff", nil) ||
     Setting.get("service_generic_cutoff", 3.to_s)).to_i
  end

  def self.short_circuit_timeout(redis, service_name, timeout, &block)
    redis_key = "service:timeouts:#{service_name}:error_count"
    cutoff = timeout_protection_cutoff(service_name)

    error_count = redis.get(redis_key)
    if error_count.to_i >= cutoff
      raise TimeoutCutoff, error_count
    end

    begin
      Timeout.timeout(timeout, &block)
    rescue Timeout::Error
      error_ttl = timeout_protection_error_ttl(service_name)
      redis.incrby(redis_key, 1)
      redis.expire(redis_key, error_ttl)
      raise
    end
  end

  def self.timeout_protection_failure_rate_cutoff(service_name)
    (Setting.get("service_#{service_name}_failure_rate_cutoff", nil) ||
     Setting.get("service_generic_failure_rate_cutoff", ".2")).to_f
  end

  def self.timeout_protection_failure_counter_window(service_name)
    (Setting.get("service_#{service_name}_counter_window", nil) ||
     Setting.get("service_generic_counter_window", 60.to_s)).to_i
  end

  def self.timeout_protection_failure_min_samples(service_name)
    (Setting.get("service_#{service_name}_min_samples", nil) ||
     Setting.get("service_generic_min_samples", 100.to_s)).to_i
  end

  def self.percent_short_circuit_timeout(redis, service_name, timeout, &block)
    redis_key = "service:timeouts:#{service_name}:percent_counter"
    cutoff = timeout_protection_failure_rate_cutoff(service_name)

    protection_activated_key = "#{redis_key}:protection_activated"
    protection_activated = redis.get(protection_activated_key)
    raise TimeoutCutoff, cutoff if protection_activated

    counter_window = timeout_protection_failure_counter_window(service_name)
    min_samples = timeout_protection_failure_min_samples(service_name)
    counter = FailurePercentCounter.new(redis, redis_key, counter_window, min_samples)

    failure_rate = counter.failure_rate
    if failure_rate >= cutoff
      # We add the key for timeout protection here, instead of in the
      # error block below, because in a previous run, we could go over
      # the minimum number of samples with a non-timedout call.  This
      # has the added benefit of making the error block below much
      # smaller.
      error_ttl = timeout_protection_error_ttl(service_name)
      redis.set(protection_activated_key, "true")
      redis.expire(protection_activated_key, error_ttl)
      raise TimeoutCutoff, failure_rate
    end

    begin
      counter.increment_count
      Timeout.timeout(timeout, &block)
    rescue Timeout::Error
      counter.increment_failure
      raise
    end
  end

  class TimeoutCutoff < Timeout::Error
    attr_accessor :error_count

    def initialize(error_count)
      super()
      @error_count = error_count
    end
  end

  # these methods are expected to be empty
  # for open source canvas, but are useful
  # hooks for overriding in very large deployments
  # of the lms.
  def self.cluster
    nil
  end

  def self.region
    nil
  end

  def self.region_code
    nil
  end

  def self.environment
    Rails.env
  end

  # for use in cases where you want to tie an action
  # to the "current" user in situations like console invocation.
  # As long as all authorized console users are provisioned with siteadmin
  # pseudonyms that share their username, this will look up their associated user record.
  # Otherwise it's still safe, it will just return a nil user.
  def self.infer_user(username = nil)
    unix_user = username || ENV['SUDO_USER'] || ENV['USER']
    Account.site_admin.pseudonyms.active.by_unique_id(unix_user).first&.user
  end
end
