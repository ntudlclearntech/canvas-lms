#
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

require_relative '../../helpers/gradezilla_common'
require_relative '../page_objects/student_grades_page'

describe 'Late Policy statuses:' do
  include_context "in-process server selenium tests"
  include_context "late_policy_course_setup"
  include GradezillaCommon

  let(:student_grades_page) { StudentGradesPage.new }

  context "grade display late policy pills" do

    before(:once) do
      # create course with students, assignments, submissions and grades
      init_course_with_students(1)
      create_course_late_policy
      create_assignments
      make_submissions
      grade_assignments
    end

    before(:each) do
      ENV["GRADEBOOK_DEVELOPMENT"] = "true"
      user_session(@teacher)
      student_grades_page.visit_as_teacher(@course, @course.students.first)
    end

    after(:each) { ENV.delete("GRADEBOOK_DEVELOPMENT") }

    it 'missing submission has missing pill' do
      expect(student_grades_page.status_pill(@a2.id, 'missing')).to be_displayed
    end

    it 'late submission has late pill' do
      expect(student_grades_page.status_pill(@a1.id, 'late')).to be_displayed
    end

    it 'late submission has late penalty' do
      student_grades_page.show_details_button.click
      late_penalty_value = "-" + @course.students.first.submissions.find_by(assignment_id:@a1.id).points_deducted.to_s

      # the data from rails and data from ui are not in the same format
      expect(student_grades_page.submission_late_penalty_text(@a1.id).to_f.to_s).to eq late_penalty_value
    end

    it 'late submission has final grade' do
      student_grades_page.show_details_button.click
      final_grade_value = @course.students.first.submissions.find_by(assignment_id:@a1.id).published_grade

      expect(student_grades_page.late_submission_final_score_text(@a1.id)).to eq final_grade_value
    end
  end
end
