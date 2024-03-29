# frozen_string_literal: true

#
# Copyright (C) 2022 - present Instructure, Inc.
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

class CoursePacing::SectionPacesApiController < CoursePacing::PacesApiController
  include GranularPermissionEnforcement

  private

  def pacing_service
    CoursePacing::SectionPaceService
  end

  def pacing_presenter
    CoursePacing::SectionPacePresenter
  end

  attr_reader :course

  def context
    @section
  end

  def authorize_action
    enforce_granular_permissions(action_name.to_sym == :index ? course : @section,
                                 overrides: [],
                                 actions: {
                                   index: [:manage_content], show: [:read], create: [:create], update: [:update], delete: [:delete]
                                 })
  end

  def load_contexts
    @course = api_find(Course.active, params[:course_id])
    @section = api_find(@course.active_course_sections, params[:course_section_id]) if params[:course_section_id]
  end
end
