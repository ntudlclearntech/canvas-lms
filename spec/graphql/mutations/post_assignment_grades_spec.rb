# frozen_string_literal: true

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

require "spec_helper"
require_relative "../graphql_spec_helper"

describe Mutations::PostAssignmentGrades do
  include GraphQLSpecHelper

  let(:assignment) { course.assignments.create! }
  let(:course) { Course.create!(workflow_state: :available) }
  let(:student) { course.enroll_user(User.create!, "StudentEnrollment", enrollment_state: :active).user }
  let(:teacher) { course.enroll_user(User.create!, "TeacherEnrollment", enrollment_state: :active).user }

  def mutation_str(assignment_id: nil, **options)
    input_string = assignment_id ? "assignmentId: #{assignment_id}" : ""

    <<~GQL
      mutation {
        postAssignmentGrades(input: {
          #{gql_arguments(input_string, **options)}
        }) {
          assignment {
            _id
          }
          progress {
            _id
          }
          errors {
            attribute
            message
          }
        }
      }
    GQL
  end

  def execute_query(mutation_str, context)
    CanvasSchema.execute(mutation_str, context: context)
  end

  context "when user has grade permission" do
    let(:context) { { current_user: teacher } }

    it "requires that assignmentId be passed in the query" do
      result = execute_query(mutation_str, context)
      expected_error = "'assignmentId' on InputObject 'PostAssignmentGradesInput' is required"
      expect(result.dig("errors", 0, "message")).to include expected_error
    end

    it "returns an error when the assignment does not exist" do
      bad_id = (Assignment.last&.id || 0) + 1
      result = execute_query(mutation_str(assignment_id: bad_id), context)
      expect(result.dig("errors", 0, "message")).to eql "not found"
    end

    it "returns an error when assignment is moderated and grades have yet to be published" do
      assignment.update!(moderated_grading: true, grader_count: 2, final_grader: teacher)
      result = execute_query(mutation_str(assignment_id: assignment.id), context)
      expected_error = "Assignments under moderation cannot be posted before grades are published"
      expect(result.dig("errors", 0, "message")).to eql expected_error
    end

    it "does not return an error when assignment is moderated and grades have been published" do
      now = Time.zone.now
      assignment.update!(moderated_grading: true, grader_count: 2, final_grader: teacher, grades_published_at: now)
      result = execute_query(mutation_str(assignment_id: assignment.id), context)
      expect(result["errors"]).to be nil
    end

    describe "posting the grades" do
      let(:post_submissions_job) { Delayed::Job.where(tag: "Assignment#post_submissions").order(:id).last }

      before do
        @student_submission = assignment.submissions.find_by(user: student)
      end

      it "posts the assignment grades" do
        execute_query(mutation_str(assignment_id: assignment.id), context)
        post_submissions_job = Delayed::Job.where(tag: "Assignment#post_submissions").order(:id).last
        post_submissions_job.invoke_job
        expect(@student_submission.reload).to be_posted
      end

      it "returns the assignment" do
        result = execute_query(mutation_str(assignment_id: assignment.id), context)
        expect(result.dig("data", "postAssignmentGrades", "assignment", "_id").to_i).to be assignment.id
      end

      it "returns the progress" do
        result = execute_query(mutation_str(assignment_id: assignment.id), context)
        progress = Progress.find(result.dig("data", "postAssignmentGrades", "progress", "_id"))
        expect(result.dig("data", "postAssignmentGrades", "progress", "_id").to_i).to be progress.id
      end

      it "stores the assignment id of submissions hidden on the Progress object" do
        result = execute_query(mutation_str(assignment_id: assignment.id), context)
        post_submissions_job.invoke_job
        progress = Progress.find(result.dig("data", "postAssignmentGrades", "progress", "_id"))
        expect(progress.results[:assignment_id]).to eq assignment.id
      end

      it "stores the posted_at of submissions hidden on the Progress object" do
        result = execute_query(mutation_str(assignment_id: assignment.id), context)
        post_submissions_job.invoke_job
        progress = Progress.find(result.dig("data", "postAssignmentGrades", "progress", "_id"))
        expect(progress.results[:posted_at]).to eq @student_submission.reload.posted_at
      end

      it "stores the user ids of submissions hidden on the Progress object" do
        result = execute_query(mutation_str(assignment_id: assignment.id), context)
        post_submissions_job.invoke_job
        progress = Progress.find(result.dig("data", "postAssignmentGrades", "progress", "_id"))
        expect(progress.results[:user_ids]).to match_array [student.id]
      end

      describe "section_ids" do
        let(:section1) { course.course_sections.create! }
        let(:section2) { course.course_sections.create! }

        before do
          @section1_student = section1.enroll_user(User.create!, "StudentEnrollment", "active").user
          @section2_student = section2.enroll_user(User.create!, "StudentEnrollment", "active").user
          @student1_submission = assignment.submissions.find_by(user: @section1_student)
          @student2_submission = assignment.submissions.find_by(user: @section2_student)
        end

        it "posts submissions for listed sections" do
          execute_query(mutation_str(assignment_id: assignment.id, section_ids: [section2.id]), context)
          post_submissions_job.invoke_job
          expect(@student2_submission.reload).to be_posted
        end

        it "does not post submissions for unlisted sections" do
          execute_query(mutation_str(assignment_id: assignment.id, section_ids: [section2.id]), context)
          post_submissions_job.invoke_job
          expect(@student1_submission.reload).not_to be_posted
        end

        it "posts all the submissions if not present" do
          execute_query(mutation_str(assignment_id: assignment.id), context)
          post_submissions_job.invoke_job
          expect(assignment.submissions).to all(be_posted)
        end
      end

      describe "only_student_ids" do
        let(:student2) { course.enroll_user(User.create!, "StudentEnrollment", enrollment_state: "active").user }

        before do
          @student1_submission = assignment.submissions.find_by(user: student)
          @student2_submission = assignment.submissions.find_by(user: student2)
        end

        it "posts submissions for listed users" do
          execute_query(mutation_str(assignment_id: assignment.id, only_student_ids: [student2.id]), context)
          post_submissions_job.invoke_job
          expect(@student2_submission.reload).to be_posted
        end

        it "does not post submissions for unlisted users" do
          execute_query(mutation_str(assignment_id: assignment.id, only_student_ids: [student2.id]), context)
          post_submissions_job.invoke_job
          expect(@student1_submission.reload).not_to be_posted
        end

        it "posts all the submissions if not present" do
          execute_query(mutation_str(assignment_id: assignment.id), context)
          post_submissions_job.invoke_job
          expect(assignment.submissions).to all(be_posted)
        end
      end

      describe "skip_student_ids" do
        let(:student2) { course.enroll_user(User.create!, "StudentEnrollment", enrollment_state: "active").user }

        before do
          @student1_submission = assignment.submissions.find_by(user: student)
          @student2_submission = assignment.submissions.find_by(user: student2)
        end

        it "posts submissions for non-listed users" do
          execute_query(mutation_str(assignment_id: assignment.id, skip_student_ids: [student2.id]), context)
          post_submissions_job.invoke_job
          expect(@student1_submission.reload).to be_posted
        end

        it "does not post submissions for listed users" do
          execute_query(mutation_str(assignment_id: assignment.id, skip_student_ids: [student2.id]), context)
          post_submissions_job.invoke_job
          expect(@student2_submission.reload).not_to be_posted
        end

        it "posts all the submissions if empty" do
          execute_query(mutation_str(assignment_id: assignment.id, skip_student_ids: []), context)
          post_submissions_job.invoke_job
          expect(assignment.submissions).to all(be_posted)
        end

        it "posts all the submissions if not present" do
          execute_query(mutation_str(assignment_id: assignment.id), context)
          post_submissions_job.invoke_job
          expect(assignment.submissions).to all(be_posted)
        end
      end

      context "when the poster has limited visibility" do
        let(:secret_student) { User.create! }
        let(:secret_section) { course.course_sections.create! }

        before do
          Enrollment.limit_privileges_to_course_section!(course, teacher, true)
          course.enroll_student(secret_student, enrollment_state: "active", section: secret_section)
        end

        it "only posts grades for students that the user can see" do
          execute_query(mutation_str(assignment_id: assignment.id), context)
          post_submissions_job.invoke_job
          expect(assignment.submission_for_student(secret_student).posted_at).to be nil
        end

        it "stores only the user ids of affected students on the Progress object" do
          result = execute_query(mutation_str(assignment_id: assignment.id), context)
          post_submissions_job.invoke_job
          progress = Progress.find(result.dig("data", "postAssignmentGrades", "progress", "_id"))
          expect(progress.results[:user_ids]).to match_array [student.id]
        end
      end
    end
  end

  context "when user does not have grade permission" do
    let(:context) { { current_user: student } }

    it "returns an error" do
      result = execute_query(mutation_str(assignment_id: assignment.id), context)
      expect(result.dig("errors", 0, "message")).to eql "not found"
    end

    it "does not return data for the related submissions" do
      result = execute_query(mutation_str(assignment_id: assignment.id), context)
      expect(result.dig("data", "postAssignmentGrades")).to be nil
    end
  end

  describe "graded_only" do
    let(:context) { { current_user: teacher } }
    let(:post_submissions_job) { Delayed::Job.where(tag: "Assignment#post_submissions").order(:id).last }
    let(:student2) { course.enroll_user(User.create!, "StudentEnrollment", enrollment_state: "active").user }

    before do
      @student1_submission = assignment.submissions.find_by(user: student)
      @student2_submission = assignment.submissions.find_by(user: student2)
      assignment.ensure_post_policy(post_manually: true)
      assignment.grade_student(student, grader: teacher, score: 100)
    end

    it "returns an error when assignment is anonymous and posting by graded only" do
      assignment.update!(anonymous_grading: true)
      result = execute_query(mutation_str(assignment_id: assignment.id, graded_only: true), context)
      expected_error = "Anonymous assignments cannot be posted by graded only"
      expect(result.dig("errors", 0, "message")).to eql expected_error
    end

    it "posts the graded submissions if graded_only is true" do
      execute_query(mutation_str(assignment_id: assignment.id, graded_only: true), context)
      post_submissions_job.invoke_job
      expect(@student1_submission.reload).to be_posted
    end

    it "posts submissions with hidden comments if graded_only is true" do
      @student2_submission.add_comment(author: teacher, comment: "good work!", hidden: true)
      execute_query(mutation_str(assignment_id: assignment.id, graded_only: true), context)
      post_submissions_job.invoke_job
      expect(@student2_submission.reload).to be_posted
    end

    it "does not post submissions with no hidden comments if graded_only is true" do
      @student2_submission.add_comment(author: student, comment: "good work!", hidden: false)
      execute_query(mutation_str(assignment_id: assignment.id, graded_only: true), context)
      post_submissions_job.invoke_job
      expect(@student2_submission.reload).not_to be_posted
    end

    it "does not post the ungraded submissions if graded_only is true" do
      execute_query(mutation_str(assignment_id: assignment.id, graded_only: true), context)
      post_submissions_job.invoke_job
      expect(@student2_submission.reload).not_to be_posted
    end

    it "posts all the submissions if graded_only is false" do
      execute_query(mutation_str(assignment_id: assignment.id, graded_only: false), context)
      post_submissions_job.invoke_job
      expect(assignment.submissions).to all(be_posted)
    end

    it "posts all the submissions if graded_only is not present" do
      execute_query(mutation_str(assignment_id: assignment.id), context)
      post_submissions_job.invoke_job
      expect(assignment.submissions).to all(be_posted)
    end
  end

  describe "Submissions Posted notification" do
    let_once(:notification) { Notification.find_or_create_by!(category: "Grading", name: "Submissions Posted") }
    let(:context) { { current_user: teacher } }
    let(:post_submissions_job) { Delayed::Job.where(tag: "Assignment#post_submissions").order(:id).last }
    let(:teacher_enrollment) { course.teacher_enrollments.find_by!(user: teacher) }
    let(:section) { course.course_sections.create! }
    let(:student_in_section) { User.create! }
    let(:submissions_posted_messages) do
      Message.where(
        communication_channel: teacher.email_channel,
        notification: notification
      )
    end

    before do
      section.enroll_user(student_in_section, "StudentEnrollment", "active")
      teacher.update!(email: "fakeemail@example.com", workflow_state: :registered)
      teacher.email_channel.update!(workflow_state: :active)
    end

    it "broadcasts a notification when posting to everyone" do
      execute_query(mutation_str(assignment_id: assignment.id), context)
      expect do
        post_submissions_job.invoke_job
      end.to change {
        submissions_posted_messages.count
      }.by(1)
    end

    it "broadcasts a notification when posting to everyone graded" do
      assignment.grade_student(student, grader: teacher, score: 1)
      execute_query(mutation_str(assignment_id: assignment.id, graded_only: true), context)
      expect do
        post_submissions_job.invoke_job
      end.to change {
        submissions_posted_messages.count
      }.by(1)
    end

    it "broadcasts a notification when posting to everyone by sections" do
      execute_query(mutation_str(assignment_id: assignment.id, section_ids: [section.id]), context)
      expect do
        post_submissions_job.invoke_job
      end.to change {
        submissions_posted_messages.count
      }.by(1)
    end

    it "broadcasts a notification when posting to everyone graded by sections" do
      assignment.grade_student(student_in_section, grader: teacher, score: 1)
      execute_query(mutation_str(assignment_id: assignment.id, section_ids: [section.id], graded_only: true), context)
      expect do
        post_submissions_job.invoke_job
      end.to change {
        submissions_posted_messages.count
      }.by(1)
    end
  end
end
