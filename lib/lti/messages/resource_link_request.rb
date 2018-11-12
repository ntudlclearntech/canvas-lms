#
# Copyright (C) 2018 - present Instructure, Inc.
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

module Lti::Messages
  class ResourceLinkRequest < JwtMessage
    def initialize(tool:, context:, user:, expander:, return_url:, opts: {})
      super
      @message = LtiAdvantage::Messages::ResourceLinkRequest.new
    end

    def generate_post_payload_message
      add_resource_link_request_claims! if include_claims?(:rlid)
      super
    end

    def generate_post_payload_for_assignment(assignment, _outcome_service_url, _legacy_outcome_service_url, _lti_turnitin_outcomes_placement_url)
      add_assignment_substitutions!(assignment)
      generate_post_payload
    end

    def generate_post_payload_for_homework_submission(assignment)
      lti_assignment = Lti::LtiAssignmentCreator.new(assignment).convert
      add_extension('content_return_types', lti_assignment.return_types.join(','))
      add_extension('content_file_extensions', assignment.allowed_extensions&.join(','))
      add_assignment_substitutions!(assignment)
      generate_post_payload
    end

    private

    def add_resource_link_request_claims!
      @message.resource_link.id = @opts[:resource_link_id] || context_resource_link_id
    end

    def context_resource_link_id
      Lti::Asset.opaque_identifier_for(@context)
    end

    def assignment_resource_link_id(assignment)
      launch_error = Lti::Ims::AdvantageErrors::InvalidLaunchError
      unless assignment.external_tool?
        raise launch_error.new(nil, api_message: 'Assignment not configured for external tool launches')
      end
      unless assignment.external_tool_tag&.content == @tool
        raise launch_error.new(nil, api_message: 'Assignment not configured for launches with specified tool')
      end
      resource_link = assignment.line_items.find(&:assignment_line_item?)&.resource_link
      unless resource_link&.context_external_tool == @tool
        raise launch_error.new(nil, api_message: 'Mismatched assignment vs resource link tool configurations')
      end
      resource_link.resource_link_id
    end

    def add_assignment_substitutions!(assignment)
      add_extension('canvas_assignment_id', '$Canvas.assignment.id') if @tool.public?
      add_extension('canvas_assignment_title', '$Canvas.assignment.title')
      add_extension('canvas_assignment_points_possible', '$Canvas.assignment.pointsPossible')
      @opts[:resource_link_id] = assignment_resource_link_id(assignment)
    end
  end
end
