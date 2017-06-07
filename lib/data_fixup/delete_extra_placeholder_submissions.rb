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

module DataFixup::DeleteExtraPlaceholderSubmissions
  def self.run
    Course.find_in_batches do |courses|
      courses.each do |course|
        send_later_if_production_enqueue_args(
          :run_for_course,
          {
            n_strand: "DataFixup:DeleteExtraPlaceholderSubmissions:#{Shard.current.database_server.id}",
            priority: Delayed::LOW_PRIORITY
          },
          course
        )
      end
    end
  end

  def self.run_for_course(course)
    course_assignment_ids = course.assignment_ids
    StudentEnrollment.where(course: course).in_batches do |relation|
      batch_student_ids = relation.pluck(:user_id)
      edd = EffectiveDueDates.for_course(course).filter_students_to(batch_student_ids)
      course_assignment_ids.each do |assignment_id|
        deletable_student_ids = batch_student_ids - edd.find_effective_due_dates_for_assignment(assignment_id).keys
        unless deletable_student_ids.blank?
          Submission.active.
            where(assignment_id: assignment_id, user_id: deletable_student_ids).
            update_all(workflow_state: :deleted)
        end
      end
    end
  end
end
