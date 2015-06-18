#
# Copyright (C) 2011 Instructure, Inc.
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

# @API Assignment Groups
#
# API for accessing Assignment Group and Assignment information.
#
# @model GradingRules
#     {
#       "id": "GradingRules",
#       "description": "",
#       "properties": {
#         "drop_lowest": {
#           "description": "Number of lowest scores to be dropped for each user.",
#           "example": 1,
#           "type": "integer"
#         },
#         "drop_highest": {
#           "description": "Number of highest scores to be dropped for each user.",
#           "example": 1,
#           "type": "integer"
#         },
#         "never_drop": {
#           "description": "Assignment IDs that should never be dropped.",
#           "example": "[33, 17, 24]",
#           "type": "array",
#           "items": {"type": "integer"}
#         }
#       }
#     }
# @model AssignmentGroup
#     {
#       "id": "AssignmentGroup",
#       "description": "",
#       "properties": {
#         "id": {
#           "description": "the id of the Assignment Group",
#           "example": 1,
#           "type": "integer"
#         },
#         "name": {
#           "description": "the name of the Assignment Group",
#           "example": "group2",
#           "type": "string"
#         },
#         "position": {
#           "description": "the position of the Assignment Group",
#           "example": 7,
#           "type": "integer"
#         },
#         "group_weight": {
#           "description": "the weight of the Assignment Group",
#           "example": 20,
#           "type": "integer"
#         },
#         "assignments": {
#           "description": "the assignments in this Assignment Group (see the Assignment API for a detailed list of fields)",
#           "example": "[]",
#           "type": "array",
#           "items": {"type": "integer"}
#         },
#         "rules": {
#           "description": "the grading rules that this Assignment Group has",
#           "$ref": "GradingRules"
#         }
#       }
#     }
#
class AssignmentGroupsController < ApplicationController
  before_filter :require_context

  include Api::V1::AssignmentGroup

  # @API List assignment groups
  #
  # Returns the list of assignment groups for the current context. The returned
  # groups are sorted by their position field.
  #
  # @argument include[] [String, "assignments"|"discussion_topic"|"all_dates"|"assignment_visibility"|"overrides"]
  #  Associations to include with the group. "discussion_topic", "all_dates"
  #  "assignment_visibility" are only valid are only valid if "assignments" is also included.
  #  The "assignment_visibility" option additionally requires that the Differentiated Assignments course feature be turned on.
  #
  # @argument override_assignment_dates [Boolean]
  #   Apply assignment overrides for each assignment, defaults to true.
  #
  # @argument grading_period_id [Integer]
  #   The id of the grading period in which assignment groups are being requested
  #   (Requires the Multiple Grading Periods account feature turned on)
  #
  # @returns [AssignmentGroup]
  def index
    if authorized_action(@context.assignment_groups.scoped.new, @current_user, :read)
      @groups = @context.assignment_groups.active

      params[:include] = Array(params[:include])
      assignments_by_group = {}
      if params[:include].include? 'assignments'
        assignment_includes = [:rubric, :quiz, :external_tool_tag, :rubric_association]
        assignment_includes.concat(params[:include] & ["discussion_topic"])
        assignment_includes.concat([:assignment_overrides]) if params[:include].include?("all_dates")

        all_visible_assignments = AssignmentGroup.visible_assignments(@current_user, @context, @groups, assignment_includes)
        .with_student_submission_count

        if params[:grading_period_id].present? && multiple_grading_periods?
          all_visible_assignments = GradingPeriod
            .active
            .find(params[:grading_period_id])
            .assignments(all_visible_assignments)
        end

        da_enabled = @context.feature_enabled?(:differentiated_assignments)
        include_visibility = Array(params[:include]).include?('assignment_visibility') && @context.grants_any_right?(@current_user, :read_as_admin, :manage_grades, :manage_assignments)
        if include_visibility && da_enabled
          assignment_visibilities = AssignmentStudentVisibility.users_with_visibility_by_assignment(course_id: @context.id, assignment_id: all_visible_assignments.map(&:id))
        else
          params[:include].delete('assignment_visibility')
        end

        # because of a bug with including content_tags, we are preloading here rather than in
        # visible_assignments with multiple associations referencing content_tags table and therefore
        # aliased table names the conditons on has_many :context_module_tags will break
        if params[:include].include? "module_ids"
          module_includes = [:context_module_tags,{:discussion_topic => :context_module_tags},{:quiz => :context_module_tags}]
          ActiveRecord::Associations::Preloader.new(all_visible_assignments, module_includes).run
        end

        assignments_by_group = all_visible_assignments.group_by(&:assignment_group_id)

        unless params[:exclude_descriptions]
          assignment_descriptions = all_visible_assignments.map(&:description)
          user_content_attachments = api_bulk_load_user_content_attachments(
            assignment_descriptions, @context, @current_user
          )
        end

        override_param = params[:override_assignment_dates] || true
        override_dates = value_to_boolean(override_param)
        if override_dates
          assignments_with_overrides = @context.assignments.active.except(:order)
                                       .joins(:assignment_overrides)
                                       .select("assignments.id")
                                       .uniq
          assignments_without_overrides = all_visible_assignments - assignments_with_overrides
          assignments_without_overrides.each { |a| a.has_no_overrides = true }
        end
      end

      include_overrides = params[:include].include? 'overrides'

      respond_to do |format|
        format.json {
          json = @groups.map { |g|
            g.context = @context
            assignments = assignments_by_group[g.id] || []
            overrides = []
            if include_overrides
              ActiveRecord::Associations::Preloader.new(assignments, :assignment_overrides).run
              assignments.select{ |a| a.assignment_overrides.size == 0 }.
                  each { |a| a.has_no_overrides = true }
              overrides = assignments.map{|assignment| assignment.assignment_overrides.active}
            end
            assignment_group_json(g, @current_user, session, params[:include],
                                  stringify_json_ids: stringify_json_ids?,
                                  override_assignment_dates: override_dates,
                                  preloaded_user_content_attachments: user_content_attachments,
                                  assignments: assignments,
                                  assignment_visibilities: assignment_visibilities,
                                  differentiated_assignments_enabled: da_enabled,
                                  exclude_descriptions: !!params[:exclude_descriptions],
                                  overrides: overrides.flatten
                                  )
          }
          render :json => json
        }
      end
    end
  end

  def reorder
    if authorized_action(@context.assignment_groups.scoped.new, @current_user, :update)
      order = params[:order].split(',')
      @context.assignment_groups.first.update_order(order)
      new_order = @context.assignment_groups.pluck(:id)
      render :json => {:reorder => true, :order => new_order}, :status => :ok
    end
  end

  def reorder_assignments
    @group = @context.assignment_groups.find(params[:assignment_group_id])
    if authorized_action(@group, @current_user, :update)
      order = params[:order].split(',').map{|id| id.to_i }
      group_ids = ([@group.id] + (order.empty? ? [] : @context.assignments.where(id: order).uniq.except(:order).pluck(:assignment_group_id)))
      Assignment.where(:id => order, :context_id => @context, :context_type => @context.class.to_s).update_all(:assignment_group_id => @group)
      @group.assignments.first.update_order(order) unless @group.assignments.empty?
      groups = AssignmentGroup.where(:id => group_ids)
      groups.update_all(:updated_at => Time.now.utc)
      groups.each{|assignment_group| AssignmentGroup.notify_observers(:assignments_changed, assignment_group)}
      ids = @group.active_assignments.map(&:id)
      @context.recompute_student_scores rescue nil
      respond_to do |format|
        format.json { render :json => {:reorder => true, :order => ids}, :status => :ok }
      end
    end
  end

  def show
    @assignment_group = @context.assignment_groups.find(params[:id])
    if @assignment_group.deleted?
      respond_to do |format|
        flash[:notice] = t 'notices.deleted', "This group has been deleted"
        format.html { redirect_to named_context_url(@context, :assignments_url) }
      end
      return
    end
    if authorized_action(@assignment_group, @current_user, :read)
      respond_to do |format|
        format.html { redirect_to(named_context_url(@context, :context_assignments_url, @assignment_group.context_id)) }
        format.json { render :json => @assignment_group.as_json(:permissions => {:user => @current_user, :session => session}) }
      end
    end
  end

  def create
    @assignment_group = @context.assignment_groups.scoped.new(params[:assignment_group])
    if authorized_action(@assignment_group, @current_user, :create)
      respond_to do |format|
        if @assignment_group.save
          @assignment_group.insert_at(1)
          flash[:notice] = t 'notices.created', 'Assignment Group was successfully created.'
          format.html { redirect_to named_context_url(@context, :context_assignments_url) }
          format.json { render :json => @assignment_group.as_json(:permissions => {:user => @current_user, :session => session}), :status => :created}
        else
          format.json { render :json => @assignment_group.errors, :status => :bad_request }
        end
      end
    end
  end

  def update
    @assignment_group = @context.assignment_groups.find(params[:id])
    if authorized_action(@assignment_group, @current_user, :update)
      respond_to do |format|
        if @assignment_group.update_attributes(params[:assignment_group])
          flash[:notice] = t 'notices.updated', 'Assignment Group was successfully updated.'
          format.html { redirect_to named_context_url(@context, :context_assignments_url) }
          format.json { render :json => @assignment_group.as_json(:permissions => {:user => @current_user, :session => session}), :status => :ok }
        else
          format.json { render :json => @assignment_group.errors, :status => :bad_request }
        end
      end
    end
  end

  def destroy
    @assignment_group = AssignmentGroup.find(params[:id])
    if authorized_action(@assignment_group, @current_user, :delete)
      if @assignment_group.has_frozen_assignments?(@current_user)
        @assignment_group.errors.add('workflow_state', t('errors.cannot_delete_group', "You can not delete a group with a locked assignment.", :att_name => 'workflow_state'))
        respond_to do |format|
          format.html { redirect_to named_context_url(@context, :context_assignments_url) }
          format.json { render :json => @assignment_group.errors, :status => :bad_request }
        end
        return
      end

      if params[:move_assignments_to]
        @assignment_group.move_assignments_to params[:move_assignments_to]
      end
      @assignment_group.destroy

      respond_to do |format|
        format.html { redirect_to(named_context_url(@context, :context_assignments_url)) }
        format.json { render :json => {
          assignment_group: @assignment_group.as_json(include_root: false, include: :active_assignments),
          new_assignment_group: @new_group.as_json(include_root: false, include: :active_assignments)
        }}
      end
    end
  end
end
