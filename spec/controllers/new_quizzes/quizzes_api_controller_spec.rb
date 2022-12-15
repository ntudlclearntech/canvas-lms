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
#

describe NewQuizzes::QuizzesApiController do
  before :once do
    Account.site_admin.enable_feature! :new_quiz_public_api
    course_with_teacher(active_all: true)
    student_in_course(active_all: true)
    @assignment = @course.assignments.create!(title: "Assignment 1")
  end

  describe "show" do
    it "returns 200 with empty body" do
      user_session(@teacher)
      get :show, params: { course_id: @course.id, assignment_id: @assignment.id }
      expect(response).to be_successful
    end

    it "returns 401 if the user can't read the assignment" do
      @assignment.unpublish!
      user_session(@student)
      get :show, params: { course_id: @course.id, assignment_id: @assignment.id }
      expect(response).to be_unauthorized
    end

    it "returns 401 if the assignment is not assigned to the user" do
      section2 = @course.course_sections.create!
      create_section_override_for_assignment(@assignment, course_section: section2)
      @assignment.update_attribute(:only_visible_to_overrides, true)
      user_session(@student)
      get :show, params: { course_id: @course.id, assignment_id: @assignment.id }
      expect(response).to be_unauthorized
    end

    it "returns 404 if the new_quiz_public_api flag is disabled" do
      Account.site_admin.disable_feature! :new_quiz_public_api
      user_session(@teacher)
      get :show, params: { course_id: @course.id, assignment_id: @assignment.id }
      expect(response).to be_not_found
    end
  end
end
