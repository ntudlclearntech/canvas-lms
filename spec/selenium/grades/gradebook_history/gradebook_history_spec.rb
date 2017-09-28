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

require_relative '../pages/gradebook_history_page'
require_relative '../setup/gradebook_setup'

describe "Gradebook History Page" do
  include_context "in-process server selenium tests"
  include GradezillaCommon
  include GradebookSetup
  include CustomScreenActions


  before(:once) do
    # init_course_with_students(3)
    now = Time.zone.now

    # create course with teacher and student
    course_factory(active_all: true)
    student_in_course


    # create 1 assignments due in the past,
    # and 2 in future
    @assignment_past_due_day = @course.assignments.create!(
      title: 'assignment one',
      grading_type: 'points',
      points_possible: 100,
      due_at: 1.day.ago(now),
      submission_types: 'online_text_entry'
    )

    @assignment_due_one_day = @course.assignments.create!(
      title: 'assignment two',
      grading_type: 'points',
      points_possible: 100,
      due_at: 1.day.from_now(now),
      submission_types: 'online_text_entry'
    )

    @assignment_due_one_week = @course.assignments.create!(
      title: 'assignment three',
      grading_type: 'points',
      points_possible: 10,
      due_at: 1.week.from_now(now),
      submission_types: 'online_text_entry'
    )

    # as a student submit all assignments
    Timecop.freeze(now) do
      @assignment_past_due_day.submit_homework(@student, body: 'submitting my homework')
      @assignment_due_one_day.submit_homework(@student, body: 'submitting my homework')
      @assignment_due_one_week.submit_homework(@student, body: 'submitting my homework')
    end

    # as a teacher grade the assignments
    2.times do
      @assignment_past_due_day.grade_student(@student, grade: String(Random.rand(1...100)), grader: @teacher)
      @assignment_due_one_day.grade_student(@student, grade: String(Random.rand(1...100)), grader: @teacher)
      @assignment_due_one_week.grade_student(@student, grade: String(Random.rand(1...10)), grader: @teacher)
    end
  end

  before(:each) do
    user_session(@teacher)
    GradeBookHistory.visit(@course)
  end

  context "shows the results table for a valid search" do

    it "with all valid inputs", test_id: 3308073, priority: "1" do
      GradeBookHistory.click_filter_button
      wait_for_ajaximations
      expect(GradeBookHistory.results_table).to be_displayed
    end

    it "and the current column has the same grade as related grade history rows", test_id: 3308871, priority: "1" do
       GradeBookHistory.click_filter_button
       wait_for_ajaximations
       expect(GradeBookHistory.check_current_col_for_history('assignment two')).to be true
    end
  end
end
