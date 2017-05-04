require 'yaml'

module TatlTael
  module Linters
    class BaseLinter
      class << self
        def inherited(subclass)
          Linters.linters << subclass unless subclass.name =~ /SimpleLinter/
        end
      end

      attr_reader :changes
      attr_reader :config
      def initialize(config:, changes:)
        @changes = changes
        @config = config
      end

      ### core
      def changes_matching(statuses: %w[added modified], # excludes "deleted",
                           include: ["*"], # include everything
                           whitelist: []) # don't whitelist anything
        changes.select do |change|
          statuses.include?(change.status) &&
            include.any? { |pattern| File.fnmatch(pattern, change.path) } &&
            whitelist.all? { |pattern| !File.fnmatch(pattern, change.path) }
        end
      end

      # convenience
      def changes_exist?(query)
        !changes_matching(query).empty?
      end
    end

    class << self
      def linters
        @linters ||= []
      end

      DEFAULT_CONFIG_PATH = File.join(File.dirname(__FILE__), "../../config/default.yml")
      def config
        @config ||= YAML.load_file(DEFAULT_CONFIG_PATH)
      end

      def config_for_linter(linter_class)
        # example linter_class.to_s: "TatlTael::Linters::Simple::CoffeeSpecsLinter"
        # example resulting base_config_key: "Simple/CoffeeSpecsLinter"
        base_config_key = linter_class.to_s
          .sub(self.to_s, "") # rm "TatlTael::Linters"
          .sub("::", "")
          .gsub("::", "/")
        underscore_and_symbolize_keys(config[base_config_key])
      end

      def comments(changes:)
        @comments ||= linters.map do |linter_class|
          linter_class.new(config: config_for_linter(linter_class), changes: changes).run
        end.flatten.compact
      end

      def underscore_and_symbolize_keys(hash)
        if hash.is_a? Hash
          return hash.reduce({}) do |memo, (k, v)|
            memo.tap { |m| m[underscore(k).to_sym] = underscore_and_symbolize_keys(v) }
          end
        end

        if hash.is_a? Array
          return hash.each_with_object([]) do |v, memo|
            memo << underscore_and_symbolize_keys(v)
          end
        end

        hash
      end

      def underscore(string)
        # borrowed from AS underscore, since we may not have it
        string.gsub(/([A-Z\d]+)([A-Z][a-z])/, "\\1_\\2")
          .gsub(/([a-z\d])([A-Z])/, "\\1_\\2")
          .tr("-", "_")
          .downcase
      end
    end
  end
end

Dir[File.dirname(__FILE__) + "/linters/**/*_linter.rb"].each { |file| require file }
