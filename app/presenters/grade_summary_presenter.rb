#
# Copyright (C) 2012 - 2014 Instructure, Inc.
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

class GradeSummaryPresenter

  attr_reader :groups_assignments

  def initialize(context, current_user, id_param)
    @context = context
    @current_user = current_user
    @id_param = id_param
    @groups_assignments = []
  end

  def user_has_elevated_permissions?
    @context.grants_any_right?(@current_user, :manage_grades, :view_all_grades)
  end

  def user_needs_redirection?
    user_has_elevated_permissions? && !@id_param
  end

  def user_an_observer_of_student?
    observed_students.key? student
  end

  def student_is_user?
    student == @current_user
  end

  def multiple_observed_students?
    observed_students && observed_students.keys.length > 1
  end

  def has_courses_with_grades?
    courses_with_grades && courses_with_grades.length > 1
  end

  def editable?
    student_is_user? && !no_calculations?
  end

  def turnitin_enabled?
    @context.turnitin_enabled? && assignments.any?(&:turnitin_enabled)
  end

  def observed_students
    @observed_students ||= ObserverEnrollment.observed_students(@context, @current_user)
  end

  def observed_student
    # be consistent about which student we return by default
    (observed_students.to_a.sort_by {|e| e[0].sortable_name}.first)[1].first
  end

  def linkable_observed_students
    observed_students.keys.select{ |student| observed_students[student].all? { |e| e.grants_right?(@current_user, :read_grades) } }
  end

  def selectable_courses
    courses_with_grades.to_a.select do |course|
      student_enrollment = course.all_student_enrollments.where(user_id: student).first
      student_enrollment.grants_right?(@current_user, :read_grades)
    end
  end

  def student_enrollment
    @student_enrollment ||= begin
      if @id_param # always use id if given
        validate_id
        user_id = Shard.relative_id_for(@id_param, @context.shard, @context.shard)
        @context.shard.activate { @context.all_student_enrollments.where(user_id: user_id).first }
      elsif observed_students.present? # otherwise try to find an observed student
        observed_student
      else # or just fall back to @current_user
        @context.shard.activate { @context.all_student_enrollments.where(user_id: @current_user).first }
      end
    end
  end

  def validate_id
    raise ActiveRecord::RecordNotFound if ( !@id_param.is_a?(User) && (@id_param.to_s =~ Api::ID_REGEX).nil? )
    true
  end

  def student
    @student ||= (student_enrollment && student_enrollment.user)
  end

  def student_name
    student ? student.name : nil
  end

  def student_id
    student ? student.id : nil
  end

  def groups
    @groups ||= @context.assignment_groups.active.to_a
  end

  def assignments(gp_id = nil)
    @assignments ||= begin
      visible_assignments = AssignmentGroup.visible_assignments(student, @context, groups, [:assignment_overrides])
      if gp_id
        visible_assignments = GradingPeriod.active.find(gp_id).assignments(visible_assignments)
      end
      group_index = groups.index_by(&:id)
      visible_assignments.select { |a| a.submission_types != 'not_graded'}.map { |a|
        # prevent extra loads
        a.context = @context
        a.assignment_group = group_index[a.assignment_group_id]

        a.overridden_for(student)
      }.sort
    end
  end

  def submissions
    @submissions ||= begin
      ss = @context.submissions
      .includes(:visible_submission_comments,
                {:rubric_assessments => [:rubric, :rubric_association]},
                :content_participations)
      .where("assignments.workflow_state != 'deleted'")
      .where(user_id: student).to_a

      if @context.feature_enabled?(:differentiated_assignments)
        visible_assignment_ids = AssignmentStudentVisibility.visible_assignment_ids_for_user(student_id, @context.id)
        ss.select!{ |submission| visible_assignment_ids.include?(submission.assignment_id) }
      end

      assignments_index = assignments.index_by(&:id)

      # preload submission comment stuff
      comments = ss.map { |s|
        assign = assignments_index[s.assignment_id]
        s.assignment = assign if assign.present?

        s.visible_submission_comments.map { |c|
          c.submission = s
          c
        }
      }.flatten
      SubmissionComment.preload_attachments comments

      ss
    end
  end

  def submission_counts
    @submission_counts ||= @context.assignments.active
      .except(:order)
      .joins(:submissions)
      .where("submissions.user_id in (?)", real_and_active_student_ids)
      .group("assignments.id")
      .count("submissions.id")
  end

  def assignment_stats
    @stats ||= begin
      chain = @context.assignments.active.except(:order)
      # note: because a score is needed for max/min/ave we are not filtering
      # by assignment_student_visibilities, if a stat is added that doesn't
      # require score then add a filter when the DA feature is on
      chain.joins(:submissions)
        .where("submissions.user_id in (?)", real_and_active_student_ids)
        .where("NOT submissions.excused OR submissions.excused IS NULL")
        .group("assignments.id")
        .select("assignments.id, max(score) max, min(score) min, avg(score) avg")
        .index_by(&:id)
    end
  end

  def real_and_active_student_ids
    @context.all_real_student_enrollments.active_or_pending.pluck(:user_id).uniq
  end

  def assignment_presenters
    submission_index = submissions.index_by(&:assignment_id)
    assignments.map{ |a|
      GradeSummaryAssignmentPresenter.new(self, @current_user, a, submission_index[a.id])
    }
  end

  def has_muted_assignments?
    assignments.any?(&:muted?)
  end

  def courses_with_grades
    @courses_with_grades ||= begin
      if student_is_user? || user_an_observer_of_student?
        student.courses_with_grades
      else
        nil
      end
    end
  end

  def unread_submission_ids
    @unread_submission_ids ||= begin
      if student_is_user?
        # remember unread submissions and then mark all as read
        subs = submissions.select{ |s| s.unread?(@current_user) }
        subs.each{ |s| s.change_read_state("read", @current_user) }
        subs.map(&:id)
      else
        []
      end
    end
  end

  def no_calculations?
    @groups_assignments.empty?
  end

  def total_weight
    @total_weight ||= begin
      if @context.group_weighting_scheme == "percent"
        groups.sum(&:group_weight)
      else
        0
      end
    end
  end

  def groups_assignments=(value)
    @groups_assignments = value
    assignments.concat(value)
  end
end
