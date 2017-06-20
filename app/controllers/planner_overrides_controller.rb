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
#

# @API Planner override
#
# API for creating, accessing and updating planner override. PlannerOverrides are used
# to control the visibility of objects displayed on the Planner.
#
# @model PlannerOverride
#     {
#       "id": "PlannerOverride",
#       "description": "User-controlled setting for whether an item should be displayed on the planner or not",
#       "properties": {
#         "id": {
#           "description": "The ID of the planner override",
#           "example": 234,
#           "type": "integer"
#         },
#         "plannable_type": {
#           "description": "The type of the associated object for the planner override",
#           "example": "Assignment",
#           "type": "string"
#         },
#         "plannable_id": {
#           "description": "The id of the associated object for the planner override",
#           "example": 1578941,
#           "type": "integer"
#         },
#         "user_id": {
#           "description": "The id of the associated user for the planner override",
#           "example": 1578941,
#           "type": "integer"
#         },
#         "workflow_state": {
#           "description": "The current published state of the item, synced with the associated object",
#           "example": "published",
#           "type": "string"
#         },
#         "marked_complete": {
#           "description": "Controls whether or not the associated plannable item is marked complete on the planner",
#           "example": false,
#           "type": "boolean"
#         },
#         "created_at": {
#           "description": "The datetime of when the planner override was created",
#           "example": "2017-05-09T10:12:00Z",
#           "type": "datetime"
#         },
#         "updated_at": {
#           "description": "The datetime of when the planner override was updated",
#           "example": "2017-05-09T10:12:00Z",
#           "type": "datetime"
#         },
#         "deleted_at": {
#           "description": "The datetime of when the planner override was deleted, if applicable",
#           "example": "2017-05-15T12:12:00Z",
#           "type": "datetime"
#         }
#       }
#     }
#

class PlannerOverridesController < ApplicationController
  include Api::V1::PlannerItem

  before_action :require_user
  before_action :set_date_range
  before_action :set_pagination, only: [:items_index]

  attr_reader :start_date, :end_date, :page, :per_page
  # @API List planner items
  #
  # Retrieve the list of objects to be shown on the planner for the current user
  # with the associated planner override to override an item's visibility if set.
  #
  # @argument start_date [Date]
  #   Only return items starting from the given date.
  #   The value should be formatted as: yyyy-mm-dd or ISO 8601 YYYY-MM-DDTHH:MM:SSZ.
  #
  # @argument end_date [Date]
  #   Only return items up to the given date.
  #   The value should be formatted as: yyyy-mm-dd or ISO 8601 YYYY-MM-DDTHH:MM:SSZ.
  #
  # @argument filter [String, "new_activity"]
  #   Only return items that have new or unread activity
  #
  # @example_response
  # [
  #   {
  #     "context_type": "Course",
  #     "course_id": 1,
  #     "type": "viewing", // Whether it has been or needs to be graded, submitted, viewed (e.g. ungraded)
  #     "ignore": "http://canvas.instructure.com/api/v1/users/self/todo/discussion_topic_8/viewing?permanent=0", // For hiding on the todo list
  #     "ignore_permanently": "http://canvas.instructure.com/api/v1/users/self/todo/discussion_topic_8/viewing?permanent=1",
  #     "visible_in_planner": true, // Whether or not it is displayed on the student planner
  #     "planner_override": { ... planner override object ... }, // Associated PlannerOverride object if user has toggled visibility for the object on the planner
  #     "submissions": false, // The statuses of the user's submissions for this object
  #     "plannable_type": "discussion_topic",
  #     "plannable": { ... discussion topic object },
  #     "html_url": "/courses/1/discussion_topics/8"
  #   },
  #   {
  #     "context_type": "Course",
  #     "course_id": 1,
  #     "type": "submitting",
  #     "ignore": "http://canvas.instructure.com/api/v1/users/self/todo/assignment_1/submitting?permanent=0",
  #     "ignore_permanently": "http://canvas.instructure.com/api/v1/users/self/todo/assignment_1/submitting?permanent=1",
  #     "visible_in_planner": true,
  #     "planner_override": {
  #         "id": 3,
  #         "plannable_type": "Assignment",
  #         "plannable_id": 1,
  #         "user_id": 2,
  #         "workflow_state": "active",
  #         "visible": true, // A user-defined setting for minimizing/hiding objects on the planner
  #         "deleted_at": null,
  #         "created_at": "2017-05-18T18:35:55Z",
  #         "updated_at": "2017-05-18T18:35:55Z"
  #     },
  #     "submissions": { // The status as it pertains to the current user
  #       "excused": false,
  #       "graded": false,
  #       "late": false,
  #       "missing": true,
  #       "needs_grading": false,
  #       "with_feedback": false
  #     },
  #     "plannable_type": "assignment",
  #     "plannable": { ... assignment object ...  },
  #     "html_url": "http://canvas.instructure.com/courses/1/assignments/1#submit"
  #   },
  #   {
  #     "type": "viewing",
  #     "ignore": "http://canvas.instructure.com/api/v1/users/self/todo/planner_note_1/viewing?permanent=0",
  #     "ignore_permanently": "http://canvas.instructure.com/api/v1/users/self/todo/planner_note_1/viewing?permanent=1",
  #     "visible_in_planner": true,
  #     "planner_override": null,
  #     "submissions": false, // false if no associated assignment exists for the plannable item
  #     "plannable_type": "planner_note",
  #     "plannable": {
  #       "id": 1,
  #       "todo_date": "2017-05-30T06:00:00Z",
  #       "title": "hello",
  #       "details": "world",
  #       "user_id": 2,
  #       "course_id": null,
  #       "workflow_state": "active",
  #       "created_at": "2017-05-30T16:29:04Z",
  #       "updated_at": "2017-05-30T16:29:15Z"
  #     },
  #     "html_url": "http://canvas.instructure.com/api/v1/planner_notes.1"
  #   }
  # ]
  def items_index
    ensure_valid_params or return

    items_json = Rails.cache.fetch(['planner_items', @current_user, page, params[:filter], default_opts].cache_key, raw: true, expires_in: 120.minutes) do
      items = params[:filter] == 'new_activity' ? unread_items : planner_items
      items = Api.paginate(items, self, api_v1_planner_items_url)
      planner_items_json(items, @current_user, session, {start_at: start_date})
    end

    render json: items_json
  end

  # @API List planner overrides
  #
  # Retrieve a planner override for the current user
  #
  # @returns [PlannerOverride]
  def index
    render :json => PlannerOverride.for_user(@current_user)
  end

  # @API Show a planner override
  #
  # Retrieve a planner override for the current user
  #
  # @returns PlannerOverride
  def show
    planner_override = PlannerOverride.find(params[:id])

    if planner_override.present?
      render json: planner_override
    else
      not_found
    end
  end

  # @API Update a planner override
  #
  # Update a planner override's visibilty for the current user
  #
  # @argument marked_complete
  #   determines whether the planner item is marked as completed
  #
  # @returns PlannerOverride
  def update
    planner_override = PlannerOverride.find(params[:id])
    planner_override.marked_complete = value_to_boolean(params[:marked_complete])

    if planner_override.save
      render json: planner_override, status: :ok
    else
      render json: planner_override.errors, status: :bad_request
    end
  end

  # @API Create a planner override
  #
  # Create a planner override for the current user
  #
  # @argument plannable_type [String, "announcement"|"assignment"|"discussion_topic"|"quiz"|"wiki_page"|"planner_note"]
  #   Type of the item that you are overriding in the planner
  #
  # @argument plannable_id [Integer]
  #   ID of the item that you are overriding in the planner
  #
  # @argument marked_complete [Boolean]
  #   If this is true, the item will show in the planner as completed
  #
  #
  # @returns PlannerOverride
  def create
    plannable_type = params[:plannable_type] == 'quiz' ? Quizzes::Quiz : params[:plannable_type]&.camelize
    planner_override = PlannerOverride.new(plannable_type: plannable_type,
      plannable_id: params[:plannable_id], marked_complete: value_to_boolean(params[:marked_complete]),
      user: @current_user)

    if planner_override.save
      render json: planner_override, status: :created
    else
      render json: planner_override.errors, status: :bad_request
    end
  end

  # @API Delete a planner override
  #
  # Delete a planner override for the current user
  #
  # @returns PlannerOverride
  def destroy
    planner_override = PlannerOverride.find(params[:id])

    if planner_override.destroy
      render json: planner_override, status: :ok
    else
      render json: planner_override.errors, status: :bad_request
    end
  end

  private

  def planner_items
    collections = [*assignment_collections,
                    planner_note_collection,
                    page_collection,
                    ungraded_discussion_collection]

    BookmarkedCollection.concat(*collections)
  end

  def unread_items
    collections = [unread_discussion_topic_collection,
                   unread_submission_collection]
    BookmarkedCollection.concat(*collections)
  end

  def assignment_collections
    grading = @current_user.assignments_needing_grading(default_opts) if @domain_root_account.grants_right?(@current_user, :manage_grades)
    submitting = @current_user.assignments_needing_submitting(default_opts)
    # TODO: Check moderation rights...
    moderation = @current_user.assignments_needing_moderation(default_opts)
    ungraded_quiz = @current_user.ungraded_quizzes_needing_submitting(default_opts)
    submitted = @current_user.submitted_assignments(default_opts)
    scopes = {submitted: submitted, ungraded_quiz: ungraded_quiz,
              submitting: submitting, moderation: moderation}
    scopes[:grading] = grading if grading
    scopes = scopes.
             each_with_object([]) do |(scope_name, scope), all_scopes|
               base_model = scope_name == :ungraded_quiz ? Quizzes::Quiz : Assignment
               collection = item_collection(scope_name.to_s, scope, base_model, :id)
               all_scopes << collection if collection
             end
    scopes
  end

  def unread_discussion_topic_collection
    item_collection('unread_discussion_topics',
                    DiscussionTopic.active.todo_date_between(start_date, end_date).
                    unread_for(@current_user),
                    DiscussionTopic, :id)
  end

  def unread_submission_collection
    item_collection('unread_assignment_submissions',
                    Assignment.active.joins(:submissions).
                    where(submissions: {id: Submission.unread_for(@current_user).pluck(:id)}).
                    due_between_with_overrides(start_date, end_date),
                    Assignment, :id)
  end

  def planner_note_collection
    item_collection('planner_notes',
                    PlannerNote.where(user: @current_user, todo_date: @start_date...@end_date),
                    PlannerNote, :id)
  end

  def page_collection
    item_collection('pages',
                    @current_user.wiki_pages_needing_viewing(default_opts),
                    WikiPage, :id)
  end

  def ungraded_discussion_collection
    item_collection('ungraded_discussions',
                    @current_user.discussion_topics_needing_viewing(default_opts),
                    DiscussionTopic, :id)
  end

  def item_collection(label, scope, base_model, *order_by)
    bookmark = BookmarkedCollection::SimpleBookmarker.new(base_model, *order_by)
    return nil unless bookmark.present?
    [
      label,
      BookmarkedCollection.wrap(
        bookmark,
        scope
      )
    ]
  end

  def set_date_range
    @start_date, @end_date = if [params[:start_date], params[:end_date]].all?(&:blank?)
                                [2.weeks.ago.beginning_of_day,
                                 2.weeks.from_now.beginning_of_day]
                              else
                                [params[:start_date], params[:end_date]]
                              end
    # Since a range is needed, set values that weren't passed to a date
    # in the far past/future as to get all values before or after whichever
    # date was passed
    @start_date = formatted_date('start_date', @start_date, 10.years.ago)
    @end_date   = formatted_date('end_date', @end_date, 10.years.from_now)
  end

  def formatted_date(input, val, default)
    @errors ||= {}
    if val.present? && val.is_a?(String)
      if val =~ Api::DATE_REGEX
        Time.zone.parse(val).beginning_of_day
      elsif val =~ Api::ISO8601_REGEX
        Time.zone.parse(val)
      else
        @errors[input] = t('Invalid date or invalid datetime for %{attr}', attr: input)
      end
    else
      default
    end
  end

  def set_pagination
    @per_page = params[:per_page] || 50
    @page = params[:page] || 'first'
  end

  def require_user
    render_unauthorized_action if !@current_user || !@domain_root_account.feature_enabled?(:student_planner)
  end

  def ensure_valid_params
    if @errors.empty?
      true
    else
      render json: {errors: @errors.as_json}, status: :bad_request
      false
    end
  end

  def default_opts
    {
      include_ignored: true,
      include_ungraded: true,
      include_concluded: true,
      include_locked: true,
      due_before: end_date,
      due_after: start_date,
      scope_only: true,
      limit: per_page
    }
  end
end
