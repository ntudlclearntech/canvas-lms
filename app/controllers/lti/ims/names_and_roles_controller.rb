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

module Lti::Ims
  class NamesAndRolesController < ApplicationController

    skip_before_action :load_user
    before_action(
      :require_context,
      :verify_nrps_v2_allowed
    )

    MIME_TYPE = 'application/vnd.ims.lis.v2.membershipcontainer+json'.freeze

    def course_index
      render_memberships
    end

    def group_index
      render_memberships
    end

    private

    def render_memberships
      page = find_memberships_page
      render json: Lti::Ims::NamesAndRolesSerializer.new(page).as_json, content_type: MIME_TYPE
    end

    def find_memberships_page
      finder = new_finder
      {
        memberships: finder.find,
        url: request.url,
        context: finder.context
      }
    end

    def new_finder
      Helpers.const_get("#{context.class}MembershipsFinder").new(context)
    end

    def verify_nrps_v2_allowed
      # TODO: Add 'real' 1.3 security checks. See same hack in Lti::Ims::Concerns::GradebookServices.
      render_unauthorized_action if Rails.env.production?
      true
    end

  end
end
