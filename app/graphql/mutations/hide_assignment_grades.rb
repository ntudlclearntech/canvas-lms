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

class Mutations::HideAssignmentGrades < Mutations::BaseMutation
  graphql_name "HideAssignmentGrades"

  argument :assignment_id, ID, required: true, prepare: GraphQLHelpers.relay_or_legacy_id_prepare_func("Assignment")
  argument :section_ids, [ID], required: false, prepare: GraphQLHelpers.relay_or_legacy_ids_prepare_func("Section")
  argument :only_student_ids, [ID], required: false, prepare: GraphQLHelpers.relay_or_legacy_ids_prepare_func("User")
  argument :skip_student_ids, [ID], required: false, prepare: GraphQLHelpers.relay_or_legacy_ids_prepare_func("User")

  field :assignment, Types::AssignmentType, null: true
  field :progress, Types::ProgressType, null: true
  field :sections, [Types::SectionType], null: true

  def resolve(input:)
    begin
      assignment = Assignment.find(input[:assignment_id])
      course = assignment.context
      sections = input[:section_ids] ? course.course_sections.where(id: input[:section_ids]) : nil
    rescue ActiveRecord::RecordNotFound
      raise GraphQL::ExecutionError, "not found"
    end

    verify_authorized_action!(assignment, :grade)

    unless assignment.grades_published?
      raise GraphQL::ExecutionError, "Assignments under moderation cannot be hidden before grades are published"
    end
    raise GraphQL::ExecutionError, "Anonymous assignments cannot be posted by section" if sections && assignment.anonymous_grading?

    if input[:only_student_ids] && input[:skip_student_ids]
      raise GraphQL::ExecutionError, I18n.t("{a} and {b} cannot be used together", a: 'only_student_ids', b: 'skip_student_ids')
    end

    visible_enrollments = course.apply_enrollment_visibility(course.student_enrollments, current_user, sections)
    visible_enrollments = visible_enrollments.where(user_id: input[:only_student_ids]) if input[:only_student_ids]
    visible_enrollments = visible_enrollments.where.not(user_id: input[:skip_student_ids]) if input[:skip_student_ids]

    submissions_scope = assignment.submissions.active.joins(user: :enrollments)
    submissions_scope = course.apply_enrollment_visibility(submissions_scope, current_user).merge(visible_enrollments)
    progress = course.progresses.new(tag: "hide_assignment_grades")

    if progress.save
      progress.process_job(
        assignment,
        :hide_submissions,
        { preserve_method_args: true },
        progress: progress,
        submission_ids: submissions_scope.pluck(:id)
      )
      return { assignment: assignment, progress: progress, sections: sections }
    else
      raise GraphQL::ExecutionError, "Error hiding assignment grades"
    end
  end
end
