#
# Copyright (C) 2015 - present Instructure, Inc.
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
#

module PactConfig
  EXTERNAL_BROKER_HOST = 'pact-broker.instructure.com'.freeze
  # These constants ensure we use the correct strings and thus help avoid our
  # accidentally breaking the contract tests
  module Providers
    CANVAS_LMS_API = 'Canvas LMS API'.freeze
    CANVAS_API_VERSION = '1.0'.freeze
    CANVAS_LMS_LIVE_EVENTS = 'Canvas LMS Live Events'.freeze
    OUTCOMES = 'Outcomes'.freeze
    ALL = Providers.constants.map { |c| Providers.const_get(c) }.freeze
  end

  # Add new API consumers to this module
  module Consumers
    my_broker_host = ENV.fetch('PACT_BROKER_HOST', 'pact-broker.docker')
    # common consumer
    GENERIC_CONSUMER = 'Generic Consumer'.freeze
    CANVAS_API_VERSION = '1.0'.freeze
    CANVAS_LMS_API = 'Canvas LMS API'.freeze
    if my_broker_host.include?(EXTERNAL_BROKER_HOST)
      # external consumers
      FIU = 'lmsAPI'.freeze
    else
      # internal consumers
      QUIZ_LTI = 'Quiz LTI'.freeze
      SISTEMIC = 'Sistemic'.freeze
      ANDROID = 'android'.freeze
      CANVAS_IOS = 'canvas-ios'.freeze
    end
    ALL = Consumers.constants.map { |c| Consumers.const_get(c) }.freeze
  end

  # Add new Live Events consumers to this module
  module LiveEventConsumers
    CATALOG = 'Catalog'.freeze
    OUTCOMES = 'Outcomes'.freeze
    QUIZ_LTI = 'Quiz LTI'.freeze
  end

  class << self
    def pact_uri(pact_path:)
      URI::HTTP.build(
        scheme: protocol,
        userinfo: "#{broker_username}:#{broker_password}",
        host: broker_host,
        path: "/#{pact_path}/#{consumer_tag}"
      ).to_s
    end

    def broker_uri
      URI::HTTP.build(
        scheme: protocol, userinfo: "#{broker_username}:#{broker_password}", host: broker_host
      ).to_s
    end

    def broker_host
      ENV.fetch('PACT_BROKER_HOST', 'pact-broker.docker')
    end

    def consumer_tag
      ENV.fetch('PACT_BROKER_TAG', 'latest')
    end

    def consumer_version
      sha = ENV['SHA']
      sha.blank? ? Consumers::CANVAS_API_VERSION : "#{Consumers::CANVAS_API_VERSION}+#{sha}"
    end

    def broker_password
      ENV.fetch('PACT_BROKER_PASSWORD', 'broker')
    end

    def broker_username
      ENV.fetch('PACT_BROKER_USERNAME', 'pact')
    end

    def jenkins_build?
      !ENV['JENKINS_URL'].nil?
    end

    private

    def protocol
      protocol = jenkins_build? ? 'https' : 'http'
      ENV.fetch('PACT_BROKER_PROTOCOL', protocol)
    end
  end
end
