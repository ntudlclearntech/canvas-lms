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

class HostUrlContainer
  mattr_accessor :host_url
  def self.===(host)
    # rubocop:disable Style/CaseEquality
    host_url === (host)
    # rubocop:enable Style/CaseEquality
  end
end

environment_configuration(defined?(config) && config) do |config|
  # Settings specified here will take precedence over those in config/application.rb

  # In the development environment your application's code is reloaded on
  # every request.  This slows down response time but is perfect for development
  # since you don't have to restart the webserver when you make code changes.
  config.cache_classes = false

  # Show full error reports and disable caching
  config.consider_all_requests_local = !ActiveModel::Type::Boolean.new.cast(ENV.fetch("SHOW_PRODUCTION_ERRORS", false))
  config.action_controller.perform_caching = ActiveModel::Type::Boolean.new.cast(ENV.fetch("ACTION_CONTROLLER_CACHING", false))

  # run rake js:build to build the optimized JS if set to true
  # ENV['USE_OPTIMIZED_JS']                            = 'true'

  # Really do care if the message wasn't sent.
  config.action_mailer.raise_delivery_errors = true

  # allow debugging only in development environment by default
  #
  # Option to DISABLE_RUBY_DEBUGGING is helpful IDE-based debugging.
  # The ruby debug gems conflict with the IDE-based debugger gem.
  # Set this option in your dev environment to disable.
  unless ENV["DISABLE_RUBY_DEBUGGING"] || RUBY_ENGINE != "ruby"
    require "byebug"
    if ENV["REMOTE_DEBUGGING_ENABLED"]
      require "byebug/core"
      Byebug.start_server("0.0.0.0", 0)
      puts "Byebug listening on 0.0.0.0:#{Byebug.actual_port}" # rubocop:disable Rails/Output
      byebug_port_file = File.join(Dir.tmpdir, "byebug.port")
      File.write(byebug_port_file, Byebug.actual_port)

      require "debase"
      require "ruby-debug-ide"
    end
  end

  # Print deprecation notices to the Rails logger
  config.active_support.deprecation = :log

  # Only use best-standards-support built into browsers
  config.action_dispatch.best_standards_support = :builtin

  # we use lots of db specific stuff - don't bother trying to dump to ruby
  # (it also takes forever)
  config.active_record.schema_format = :sql
  config.active_record.dump_schema_after_migration = false

  config.eager_load = false

  config.hosts << HostUrlContainer

  config.to_prepare do
    HostUrlContainer.host_url = HostUrl
  end

  # allow docker dev setup to use http proxy
  config.hosts << ENV["VIRTUAL_HOST"] if ENV["VIRTUAL_HOST"]

  # allow any additional hosts
  ENV["ADDITIONAL_ALLOWED_HOSTS"]&.split(",")&.each do |host|
    config.hosts << host
  end

  # eval <env>-local.rb if it exists
  Dir[File.dirname(__FILE__) + "/" + File.basename(__FILE__, ".rb") + "-*.rb"].each { |localfile| eval(File.new(localfile).read, nil, localfile, 1) } # rubocop:disable Security/Eval

  config.force_ssl = true
  config.ssl_options = { hsts: { preload: true, expires: 1.year, subdomains: true } }
end
