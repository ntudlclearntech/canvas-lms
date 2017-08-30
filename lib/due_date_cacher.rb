#
# Copyright (C) 2013 - present Instructure, Inc.
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

class DueDateCacher
  def self.recompute(assignment)
    return unless assignment.active?
    recompute_course(assignment.context, [assignment.id],
      singleton: "cached_due_date:calculator:Assignment:#{assignment.global_id}")
  end

  def self.recompute_course(course, assignments = nil, inst_jobs_opts = {})
    course = Course.find(course) unless course.is_a?(Course)
    inst_jobs_opts[:singleton] ||= "cached_due_date:calculator:Course:#{course.global_id}" if assignments.nil?
    assignments ||= Assignment.active.where(context: course).pluck(:id)
    return if assignments.empty?
    new(course, assignments).send_later_if_production_enqueue_args(:recompute, inst_jobs_opts)
  end

  def initialize(course, assignments)
    @course = course
    @assignment_ids = Array(assignments).map { |a| a.is_a?(Assignment) ? a.id : a }
    @accepted_students_ids = accepted_students.pluck(:id)
  end

  def recompute
    # in a transaction on the correct shard:
    @course.shard.activate do
      values = []
      effective_due_dates.to_hash.each do |assignment_id, students|
        students.each do |student_id, submission_info|
          due_date = submission_info[:due_at] ? "'#{submission_info[:due_at].iso8601}'::timestamptz" : 'NULL'
          grading_period_id = submission_info[:grading_period_id] || 'NULL'
          values << [assignment_id, student_id, due_date, grading_period_id]
        end
      end
      # Delete submissions for students who don't have visibility to this assignment anymore
      @assignment_ids.each do |assignment_id|
        assigned_student_ids = effective_due_dates.find_effective_due_dates_for_assignment(assignment_id).keys
        submission_scope = Submission.active.where(assignment_id: assignment_id)

        if assigned_student_ids.blank?
          submission_scope.in_batches.update_all(workflow_state: :deleted)
        else
          # Delete the users we KNOW we need to delete in batches (it makes the database happier this way)
          deletable_student_ids = @accepted_students_ids - assigned_student_ids
          deletable_student_ids.each_slice(1000) do |deletable_student_ids_chunk|
            # using this approach instead of using .in_batches because we want to limit the IDs in the IN clause to 1k
            submission_scope.where(user_id: deletable_student_ids_chunk).update_all(workflow_state: :deleted)
          end

        end
      end

      # Get any stragglers that might have had their enrollment removed from the course
      Submission.active.
        where(assignment_id: @assignment_ids).
        where.not(user_id: accepted_students).
        in_batches.
        update_all(workflow_state: :deleted)

      return if values.empty?

      values = values.sort_by(&:first).map { |v| "(#{v.join(',')})" }
      values.each_slice(1000) do |batch|
        # Construct upsert statement to update existing Submissions or create them if needed.
        query = <<-SQL
          UPDATE #{Submission.quoted_table_name}
            SET
              cached_due_date = vals.due_date::timestamptz,
              grading_period_id = vals.grading_period_id::integer,
              workflow_state = COALESCE(NULLIF(workflow_state, 'deleted'), (
                -- infer actual workflow state
                CASE
                WHEN grade IS NOT NULL OR excused THEN
                  'graded'
                WHEN submission_type = 'online_quiz' AND quiz_submission_id IS NOT NULL THEN
                  'pending_review'
                WHEN submission_type IS NOT NULL AND submitted_at IS NOT NULL THEN
                  'submitted'
                ELSE
                  'unsubmitted'
                END
              ))
            FROM (
              VALUES
                #{batch.join(',')}
             )
             AS vals(assignment_id, student_id, due_date, grading_period_id)
            WHERE submissions.user_id = vals.student_id AND
                  submissions.assignment_id = vals.assignment_id;
          INSERT INTO #{Submission.quoted_table_name}
           (assignment_id, user_id, workflow_state, created_at, updated_at, context_code, process_attempts,
            cached_due_date, grading_period_id)
            SELECT
              assignments.id, vals.student_id, 'unsubmitted',
              now() AT TIME ZONE 'UTC', now() AT TIME ZONE 'UTC',
              assignments.context_code, 0, vals.due_date::timestamptz, vals.grading_period_id::integer
            FROM (
              VALUES
                #{batch.join(',')}
             )
             AS vals(assignment_id, student_id, due_date, grading_period_id)
            INNER JOIN #{Assignment.quoted_table_name} assignments
              ON assignments.id = vals.assignment_id
            LEFT OUTER JOIN #{Submission.quoted_table_name} submissions
              ON submissions.assignment_id = assignments.id
              AND submissions.user_id = vals.student_id
            WHERE submissions.id IS NULL;
        SQL

        Assignment.connection.execute(query)
      end
    end

    if @assignment_ids.size == 1
      # Only changes to LatePolicy or (sometimes) Assignment records can result in a re-calculation
      # of student scores.  No changes to the Course record can trigger such re-calculations so
      # let's ensure this is triggered only when DueDateCacher is called for a Assignment-level
      # changes and not for Course-level changes
      assignment = Assignment.find(@assignment_ids.first)

      LatePolicyApplicator.for_assignment(assignment)
    end
  end

  private

  def accepted_students
    @accepted_students ||= @course.all_accepted_students
  end

  def effective_due_dates
    @effective_due_dates ||= EffectiveDueDates.for_course(@course, @assignment_ids)
  end
end
