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
#

require_relative '../spec_helper'
require_relative '../support/request_helper'

describe GradebooksController, type: :request do
  before :once do
    course_with_teacher active_all: true
    @teacher_enrollment = @enrollment
    student_in_course active_all: true
    @student_enrollment = @enrollment
    @assignment = @course.assignments.create!(
      title: 'A Title', submission_types: 'online_url', grading_type: 'percent'
    )
  end

  describe 'GET #speed_grader' do
    before :each do
      user_session(@teacher)
    end

    describe 'js_env' do
      describe 'can_comment_on_submission' do
        it 'is false if the course is concluded' do
          @course.complete
          get speed_grader_course_gradebook_path(course_id: @course.id), params: { assignment_id: @assignment.id }
          js_env = js_env_from_response(response)

          expect(js_env.fetch('can_comment_on_submission')).to eq(false)
        end

        it 'is false if the teacher enrollment is concluded' do
          @teacher_enrollment = @course.teacher_enrollments.find_by(user: @teacher)
          @teacher_enrollment.conclude
          get speed_grader_course_gradebook_path(course_id: @course.id), params: { assignment_id: @assignment.id }
          js_env = js_env_from_response(response)

          expect(js_env.fetch('can_comment_on_submission')).to eq(false)
        end

        it 'is true otherwise' do
          get speed_grader_course_gradebook_path(course_id: @course.id), params: { assignment_id: @assignment.id }
          js_env = js_env_from_response(response)

          expect(js_env.fetch('can_comment_on_submission')).to eq(true)
        end
      end
    end
  end

  describe 'GET #grade_summary' do
    context 'when logged in as a student' do
      before :each do
        user_session(@student)
        @course_id = @course.id.to_s
      end

      describe 'js_env' do
        describe 'courses_with_grades' do
          it 'sets grading_period_set_id to null when the course has no grading periods' do
            get course_student_grades_path(course_id: @course.id, id: @student.id)
            js_env = js_env_from_response(response)
            course_details = js_env.fetch('courses_with_grades').detect { |c| c.fetch('id') == @course_id }

            expect(course_details.fetch('grading_period_set_id')).to be_nil
          end

          it 'sets grading_period_set_id when the course has grading periods' do
            Factories::GradingPeriodGroupHelper.new.create_for_enrollment_term_and_account!(
              @course.enrollment_term, @course.account
            )
            grading_period_group_id = @course.enrollment_term.grading_period_group_id
            get course_student_grades_path(course_id: @course.id, id: @student.id)
            js_env = js_env_from_response(response)
            course_details = js_env.fetch('courses_with_grades').detect { |c| c.fetch('id') == @course_id }

            expect(course_details.fetch('grading_period_set_id')).to eq(grading_period_group_id.to_s)
          end

          it 'sets grading_period_set_id when the course has legacy grading periods' do
            Factories::GradingPeriodGroupHelper.new.legacy_create_for_course(@course)
            grading_period_group_id = @course.grading_period_group_ids.first
            get course_student_grades_path(course_id: @course.id, id: @student.id)
            js_env = js_env_from_response(response)
            course_details = js_env.fetch('courses_with_grades').detect { |c| c.fetch('id') == @course_id }

            expect(course_details.fetch('grading_period_set_id')).to eq(grading_period_group_id.to_s)
          end
        end
      end
    end
  end
end
