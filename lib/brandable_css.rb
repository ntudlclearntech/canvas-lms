require 'pathname'
require 'yaml'

module BrandableCSS
  APP_ROOT = defined?(Rails) && Rails.root || Pathname.pwd
  CONFIG = YAML.load_file(APP_ROOT.join('config/brandable_css.yml')).freeze
  BRANDABLE_VARIABLES = JSON.parse(File.read(APP_ROOT.join(CONFIG['paths']['brandable_variables_json']))).freeze
  SASS_STYLE = (ENV['SASS_STYLE'] || ((defined?(Rails) && Rails.env.production?) ? 'compressed' : 'nested')).freeze

  class << self
    def variables_map
      @variables_map ||= BRANDABLE_VARIABLES.each_with_object({}) do |variable_group, memo|
        variable_group['variables'].each { |variable| memo[variable['variable_name']] = variable }
      end.freeze
    end

    # gets the *effective* value for a brandable variable
    def brand_variable_value(variable_name, active_brand_config=nil)
      explicit_value = active_brand_config && active_brand_config.get_value(variable_name).presence
      return explicit_value if explicit_value
      config = variables_map[variable_name]
      default = config['default']
      return brand_variable_value(default[1..-1], active_brand_config) if default && default.starts_with?('$')

      # while in our sass, we want `url(/images/foo.png)`,
      # the Rails Asset Helpers expect us to not have the '/images/', eg: <%= image_tag('foo.png') %>
      default.sub!(/^\/images\//, '') if config['type'] == 'image'
      default
    end

    def variants
      @variants ||= CONFIG['variants'].map{|(k)| k }.freeze
    end

    def brandable_variants
      @brandable_variants ||= CONFIG['variants'].select{|_, v| v['brandable']}.map{ |k,_| k }.freeze
    end

    def combined_checksums
      if defined?(ActionController) && ActionController::Base.perform_caching && defined?(@combined_checksums)
        return @combined_checksums
      end
      file = APP_ROOT.join(CONFIG['paths']['bundles_with_deps'] + SASS_STYLE)
      if file.exist?
        @combined_checksums = JSON.parse(file.read).each_with_object({}) do |(k, v), memo|
          memo[k] = v['combinedChecksum']
        end.freeze
      elsif defined?(Rails) && Rails.env.production?
        raise "you need to run #{cli} before you can serve css."
      else
        # for dev/test there might be cases where you don't want it to raise an exception
        # if you haven't ran `brandable_css` and the manifest file doesn't exist yet.
        # eg: you want to test a controller action and you don't care that it links
        # to a css file that hasn't been created yet.
        default_value = "Error: unknown css checksum. you need to run #{cli}"
        @combined_checksums = Hash.new(default_value).freeze
      end
    end

    # bundle path should be something like "bundles/speedgrader" or "plugins/analytics/something"
    def fingerprint_for(bundle_path, variant)
      key = ["#{bundle_path}.scss", variant].join(CONFIG['manifest_key_seperator'])
      fingerprint = combined_checksums[key]
      raise "Fingerprint not found. #{bundle_path} #{variant}" unless fingerprint
      fingerprint
    end

    def all_fingerprints_for(bundle_path)
      variants.each_with_object({}) do |variant, object|
        object[variant] = fingerprint_for(bundle_path, variant)
      end
    end

    def cli
      './node_modules/.bin/brandable_css'
    end

    def compile_all!
      run_cli!
    end

    def compile_brand!(brand_id)
      run_cli!('--brand-id', brand_id)
    end

    private

    def run_cli!(*args)
      # this makes sure the symlinks to app/stylesheets/plugins/analytics, etc exist
      # so their scss files can be picked up and compiled with everything else
      require 'config/initializers/plugin_symlinks'

      command = [cli].push(*args).shelljoin + ' 2>&1'
      msg = "running BrandableCSS CLI: #{command}"
      Rails.logger.try(:debug, msg) if defined?(Rails)
      raise "Error: #{msg}" unless system(command)
    end
  end

end
