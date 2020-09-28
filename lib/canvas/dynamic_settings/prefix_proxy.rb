# Copyright (C) 2017 - present Instructure, Inc.
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
  class DynamicSettings
    class UnexpectedConsulResponse < StandardError; end
    # A class for reading values from Consul
    #
    # @attr prefix [String] The prefix to be prepended to keys for querying.
    class PrefixProxy
      DEFAULT_TTL = 5.minutes
      # The TTL for cached values if none is specified in the constructor

      attr_reader :prefix, :tree, :service, :environment, :cluster
      attr_accessor :query_logging

      # Build a new prefix proxy
      #
      # @param prefix [String] The prefix to be prepended to keys for querying.
      # @param tree [String] Which tree to use (config, private, store)
      # @param service [String] The service name to use (i.e. who owns the configuration). Defaults to canvas
      # @param environment [String] An optional environment to look for so that multiple Canvas environments can share Consul
      # @param cluster [String] An optional cluster to override region or global settings
      # @param default_ttl [ActiveSupport::Duration] The TTL to use for cached
      #   values when not specified to the fetch methods.
      # @param kv_client [Imperium::KV] The client to use for connecting to
      #   Consul, defaults to Imperium::KV.default_client
      # @param data_center [String] Which regional datacenter to address for queries
      # @param query_logging [Boolean] when enabled (true), will output query logs and timing for each request
      def initialize(prefix = nil,
                     tree: :config,
                     service: :canvas,
                     environment: nil,
                     cluster: nil,
                     default_ttl: DEFAULT_TTL,
                     kv_client: Imperium::KV.default_client,
                     data_center: nil,
                     query_logging: true)
        @prefix = prefix
        @tree = tree
        @service = service
        @environment = environment
        @cluster = cluster
        @default_ttl = default_ttl
        @kv_client = kv_client
        @data_center = data_center
        @query_logging = query_logging
      end

      # Fetch the value at the requested key using the prefix passed to the
      # initializer.
      #
      # This method is intended to retreive a single key from the keyspace and
      # will not work for getting multiple values in a hash from the store. If
      # you need to access values nested deeper in the keyspace use #for_prefix
      # to move deeper in the nesting.
      #
      # @param key [String, Symbol] The key to fetch
      # @param ttl [ActiveSupport::Duration] The TTL for the value in the cache,
      #   defaults to value supplied to the constructor.
      # @return [String]
      # @return [nil] When no value was found
      def fetch(key, ttl: @default_ttl)
        keys = [
          full_key(key),
          [tree, service, environment, prefix, key].compact.join("/"),
        ].uniq

        fallback_keys = [
          [tree, service, prefix, key].compact.join("/"),
          full_key(key, global: true),
          ["global", tree, service, prefix, key].compact.join("/"),
        ].uniq - keys

        # try to get the local cache first right away
        keys.each do |full_key|
          result = LocalCache.fetch(CACHE_KEY_PREFIX + full_key)
          return result if result
        end

        # okay now pre-cache an entire tree
        tree_key = [tree, service, environment].compact.join("/")
        # This longer TTL is important for race condition for now.
        # if the tree JUST expired, we don't want to find
        # a valid tree, and then no valid subkeys, that makes
        # nils start popping up in the cache.  Subkeys should
        # last much longer than it takes to notice the tree key is
        # expired and trying to replace it.  When the tree writes
        # are fully atomic, this is much less of a concern,
        # we could have one ttl again
        subtree_ttl = ttl * 2
        LocalCache.fetch(CACHE_KEY_PREFIX + tree_key + '/', expires_in: ttl) do
          values = unpackaged_kv_fetch(tree_key, :recurse, :stale)
          if values.nil?
            # no sense trying to populate the subkeys
            # when there's no tree
            nil
          else
            populate_cache(tree_key, values, subtree_ttl)
            values
          end
        end

        keys.each do |full_key|
          # these keys will have been populated (or not!) above
          cache_result = LocalCache.fetch(CACHE_KEY_PREFIX + full_key, expires_in: subtree_ttl) do
            # this should rarely happen.  If we JUST populated the parent tree,
            # the value will already by in the cache.  If it's NOT in the tree, we'll cache
            # a nil (intentionally) and not hit this fetch over and over.  This protects us
            # from the race condition where we just expired and filled out the whole tree,
            # then the cache gets cleared, then we try to fetch one of the things we "know"
            # is in the cache now.  It's better to fall back to asking consul in those cases.
            # these values will still get overwritten the next time the parent tree expires,
            # and they'll still go away eventually if we REMOVE a key from a subtree in consul.
            unpackaged_kv_fetch(full_key, :stale)
          end
          return cache_result if cache_result
        end

        fallback_keys.each do |full_key|
          result = LocalCache.fetch(CACHE_KEY_PREFIX + full_key, expires_in: ttl) do
            unpackaged_kv_fetch(full_key, :stale)
          end
          return result if result
        end
        Rails.logger.warn("[DYNAMIC_SETTINGS] config requested which was found no-where (#{key})")
        nil
      rescue Imperium::TimeoutError, UnexpectedConsulResponse => exception
        LocalCache.fetch_without_expiration(CACHE_KEY_PREFIX + keys.first).tap do |val|
          if val
            Canvas::Errors.capture_exception(:consul, exception)
            val
          else
            raise
          end
        end
      end
      alias [] fetch

      # Extend the prefix from this instance returning a new one.
      #
      # @param prefix_extension [String]
      # @param default_ttl [ActiveSupport::Duration] The default TTL to use when
      #  fetching keys from the extended keyspace, defaults to the same value as
      #  the receiver
      # @return [ProxyPrefix]
      def for_prefix(prefix_extension, default_ttl: @default_ttl)
        self.class.new(
          "#{@prefix}/#{prefix_extension}",
          tree: tree,
          service: service,
          environment: environment,
          cluster: cluster,
          default_ttl: default_ttl,
          kv_client: @kv_client,
          data_center: @data_center
        )
      end

      # Set multiple key value pairs
      #
      # @param kvs [Hash] Key value pairs where the hash key is the key
      #   and the hash value is the value
      # @param global [boolean] Is it a global key?
      # @return [Imperium::TransactionResponse]
      def set_keys(kvs, global: false)
        opts = @data_center.present? && global ? { dc: @data_center } : {}
        @kv_client.transaction(opts) do |tx|
          kvs.each { |k, v| tx.set(full_key(k, global: global), v) }
        end
      end

      private

      # useful for making sure the outcome from consul
      # was one of the expected outcomes (200 or 404) and pulling off the
      # actual payload so we don't have to repeat
      # this kind of guard clause on every fetch
      def unpackaged_kv_fetch(full_key, *options)
        result = kv_fetch(full_key, *options)
        # result should always be a KVGetResponse, nil is a problem
        # because it SHOULD be a 404 with a nil
        if result&.status == 200 || result&.status == 404
          # if 404, this just means the value doesn't exist in the consul store
          # and the values will be nil, so caching nil in that case is safe
          result.values
        else
          # we don't want to store "nil" in the cache if something bad happened
          # when talking to consul
          raise(UnexpectedConsulResponse, "Unexpected consul result: #{result}-#{result&.status}")
        end
      end

      # bit of helper indirection
      # so that we can log actual
      # QUERIES (vs things fetched from the cache)
      # in one place, and process error states as actual
      # errors
      def kv_fetch(full_key, *options)
        result = nil
        ms = 1000 * Benchmark.realtime do
          result = @kv_client.get(full_key, *options)
        end
        Rails.logger.debug("  #{"CONSUL (%.2fms)" % [ms]} get (#{full_key}) -> status:#{result&.status}") if @query_logging
        result
      end

      # Returns the full key
      #
      # @param key [String, Symbol] The key
      # @param global [boolean] Is it a global key?
      # @return [String] Full key
      def full_key(key, global: false)
        key_array = [tree, service, environment]
        if global
          key_array.prepend('global')
        else
          key_array << cluster
        end
        key_array.concat([prefix, key]).compact.join("/")
      end

      def populate_cache(prefix, subtree, ttl)
        pop_set = construct_population_set(prefix, subtree)
        LocalCache.write_set(pop_set, ttl: ttl)
      end

      def construct_population_set(prefix, subtree, accumulator={})
        if subtree.is_a?(Hash)
          subtree.each do |(k, v)|
            accumulator = construct_population_set("#{prefix}/#{k}", v, accumulator)
          end
        else
          accumulator[CACHE_KEY_PREFIX + prefix] = subtree
        end
        accumulator
      end
    end
  end
end