# frozen_string_literal: true

#
# Copyright (C) 2012 - present Instructure, Inc.
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

require 'csv'

# @API Group Categories
#
# Group Categories allow grouping of groups together in canvas. There are a few
# different built-in group categories used, or custom ones can be created. The
# built in group categories are:  "communities", "student_organized", and "imported".
#
# @model GroupCategory
#     {
#       "id": "GroupCategory",
#       "description": "",
#       "properties": {
#         "id": {
#           "description": "The ID of the group category.",
#           "example": 17,
#           "type": "integer"
#         },
#         "name": {
#           "description": "The display name of the group category.",
#           "example": "Math Groups",
#           "type": "string"
#         },
#         "role": {
#           "description": "Certain types of group categories have special role designations. Currently, these include: 'communities', 'student_organized', and 'imported'. Regular course/account group categories have a role of null.",
#           "example": "communities",
#           "type": "string"
#         },
#         "self_signup": {
#           "description": "If the group category allows users to join a group themselves, thought they may only be a member of one group per group category at a time. Values include 'restricted', 'enabled', and null 'enabled' allows students to assign themselves to a group 'restricted' restricts them to only joining a group in their section null disallows students from joining groups",
#           "type": "string",
#           "allowableValues": {
#             "values": [
#               "restricted",
#               "enabled"
#             ]
#           }
#         },
#         "auto_leader": {
#           "description": "Gives instructors the ability to automatically have group leaders assigned.  Values include 'random', 'first', and null; 'random' picks a student from the group at random as the leader, 'first' sets the first student to be assigned to the group as the leader",
#           "type": "string",
#           "allowableValues": {
#             "values": [
#               "first",
#               "random"
#             ]
#           }
#         },
#         "context_type": {
#           "description": "The course or account that the category group belongs to. The pattern here is that whatever the context_type is, there will be an _id field named after that type. So if instead context_type was 'Course', the course_id field would be replaced by an course_id field.",
#           "example": "Account",
#           "type": "string"
#         },
#         "account_id": {
#           "example": 3,
#           "type": "integer"
#         },
#         "group_limit": {
#           "description": "If self-signup is enabled, group_limit can be set to cap the number of users in each group. If null, there is no limit.",
#           "type": "integer"
#         },
#         "sis_group_category_id": {
#           "description": "The SIS identifier for the group category. This field is only included if the user has permission to manage or view SIS information.",
#           "type": "string"
#         },
#         "sis_import_id": {
#           "description": "The unique identifier for the SIS import. This field is only included if the user has permission to manage SIS information.",
#           "type": "integer"
#         },
#         "progress": {
#           "description": "If the group category has not yet finished a randomly student assignment request, a progress object will be attached, which will contain information related to the progress of the assignment request. Refer to the Progress API for more information",
#           "$ref": "Progress"
#         }
#       }
#     }
#
class GroupCategoriesController < ApplicationController
  before_action :require_context, :only => [:create, :index]
  before_action :get_category_context, :only => [:show, :update, :destroy, :groups, :users, :assign_unassigned_members, :import, :export]

  include Api::V1::Attachment
  include Api::V1::GroupCategory
  include Api::V1::Group
  include Api::V1::Progress

  SETTABLE_GROUP_ATTRIBUTES = %w(name description join_level is_public group_category avatar_attachment).freeze

  include TextHelper

  # @API List group categories for a context
  #
  # Returns a paginated list of group categories in a context
  #
  # @example_request
  #     curl https://<canvas>/api/v1/accounts/<account_id>/group_categories \
  #          -H 'Authorization: Bearer <token>'
  #
  # @returns [GroupCategory]
  def index
    @categories = @context.group_categories.preload(:root_account, :progresses)
    respond_to do |format|
      format.json do
        if authorized_action(@context, @current_user, [:manage_groups, *RoleOverride::GRANULAR_MANAGE_GROUPS_PERMISSIONS])
          path = send("api_v1_#{@context.class.to_s.downcase}_group_categories_url")
          paginated_categories = Api.paginate(@categories, self, path)
          includes = ['progress_url']
          includes.concat(params[:includes]) if params[:includes]
          render :json => paginated_categories.map { |c| group_category_json(c, @current_user, session, :include => includes) }
        end
      end
    end
  end

  # @API Get a single group category
  #
  # Returns the data for a single group category, or a 401 if the caller doesn't have
  # the rights to see it.
  #
  # @example_request
  #     curl https://<canvas>/api/v1/group_categories/<group_category_id> \
  #          -H 'Authorization: Bearer <token>'
  #
  # @returns GroupCategory
  def show
    respond_to do |format|
      format.json do
        if authorized_action(@group_category.context, @current_user, [:manage_groups, *RoleOverride::GRANULAR_MANAGE_GROUPS_PERMISSIONS])
          includes = ['progress_url']
          includes.concat(params[:includes]) if params[:includes]
          render :json => group_category_json(@group_category, @current_user, session, :include => includes)
        end
      end
    end
  end

  # @API Create a Group Category
  # Create a new group category
  #
  # @argument name [Required, String]
  #   Name of the group category
  #
  # @argument self_signup [String, "enabled"|"restricted"]
  #   Allow students to sign up for a group themselves (Course Only).
  #   valid values are:
  #   "enabled":: allows students to self sign up for any group in course
  #   "restricted":: allows students to self sign up only for groups in the
  #                  same section null disallows self sign up
  #
  # @argument auto_leader [String, "first"|"random"]
  #   Assigns group leaders automatically when generating and allocating students to groups
  #   Valid values are:
  #   "first":: the first student to be allocated to a group is the leader
  #   "random":: a random student from all members is chosen as the leader
  #
  # @argument group_limit [Integer]
  #   Limit the maximum number of users in each group (Course Only). Requires
  #   self signup.
  #
  # @argument sis_group_category_id [String]
  #   The unique SIS identifier.
  #
  # @argument create_group_count [Integer]
  #   Create this number of groups (Course Only).
  #
  # @argument split_group_count (Deprecated)
  #   Create this number of groups, and evenly distribute students
  #   among them. not allowed with "enable_self_signup". because
  #   the group assignment happens synchronously, it's recommended
  #   that you instead use the assign_unassigned_members endpoint.
  #   (Course Only)
  #
  # @example_request
  #     curl htps://<canvas>/api/v1/courses/<course_id>/group_categories \
  #         -F 'name=Project Groups' \
  #         -H 'Authorization: Bearer <token>'
  #
  # @returns GroupCategory
  def create
    if authorized_action(@context, @current_user, [:manage_groups, :manage_groups_add])
      @group_category = @context.group_categories.build
      if populate_group_category_from_params
        if api_request?
          includes = ["unassigned_users_count", "groups_count"]
          includes.concat(params[:includes]) if params[:includes]
          if (sis_id = params[:sis_group_category_id])
            if @group_category.root_account.grants_right?(@current_user, :manage_sis)
              @group_category.sis_source_id = sis_id
              @group_category.save!
            else
              return render json: { message: "You must have manage_sis permission to set sis attributes" }, status: :unauthorized
            end
          end
          render :json => group_category_json(@group_category, @current_user, session, include: includes)
        else
          flash[:notice] = t('notices.create_category_success', 'Category was successfully created.')
          render :json => [@group_category.as_json, @group_category.groups.map { |g| g.as_json(:include => :users) }]
        end
      end
    end
  end

  # @API Import category groups
  #
  # Create Groups in a Group Category through a CSV import
  #
  # For more information on the format that's expected here, please see the
  # "Group Category CSV" section in the API docs.
  #
  # @argument attachment
  #   There are two ways to post group category import data - either via a
  #   multipart/form-data form-field-style attachment, or via a non-multipart
  #   raw post request.
  #
  #   'attachment' is required for multipart/form-data style posts. Assumed to
  #   be outcome data from a file upload form field named 'attachment'.
  #
  #   Examples:
  #     curl -F attachment=@<filename> -H "Authorization: Bearer <token>" \
  #         'https://<canvas>/api/v1/group_categories/<category_id>/import'
  #
  #   If you decide to do a raw post, you can skip the 'attachment' argument,
  #   but you will then be required to provide a suitable Content-Type header.
  #   You are encouraged to also provide the 'extension' argument.
  #
  #   Examples:
  #     curl -H 'Content-Type: text/csv' --data-binary @<filename>.csv \
  #         -H "Authorization: Bearer <token>" \
  #         'https://<canvas>/api/v1/group_categories/<category_id>/import'
  #
  # @example_response
  #    # Progress (default)
  #    {
  #        "completion": 0,
  #        "context_id": 20,
  #        "context_type": "GroupCategory",
  #        "created_at": "2013-07-05T10:57:48-06:00",
  #        "id": 2,
  #        "message": null,
  #        "tag": "course_group_import",
  #        "updated_at": "2013-07-05T10:57:48-06:00",
  #        "user_id": null,
  #        "workflow_state": "running",
  #        "url": "http://localhost:3000/api/v1/progress/2"
  #    }
  #
  # @returns Progress
  def import
    if authorized_action(@context, @current_user, [:manage_groups, :manage_groups_add])
      return render(:json => { 'status' => 'unauthorized' }, :status => :unauthorized) if @group_category.protected?

      file_obj = if params.key?(:attachment)
                   params[:attachment]
                 else
                   body_file
                 end

      progress = GroupAndMembershipImporter.create_import_with_attachment(@group_category, file_obj)
      render(:json => progress_json(progress, @current_user, session))
    end
  end

  # @API Update a Group Category
  # Modifies an existing group category.
  #
  # @argument name [String]
  #   Name of the group category
  #
  # @argument self_signup [String, "enabled"|"restricted"]
  #   Allow students to sign up for a group themselves (Course Only).
  #   Valid values are:
  #   "enabled":: allows students to self sign up for any group in course
  #   "restricted":: allows students to self sign up only for groups in the
  #                  same section null disallows self sign up
  #
  # @argument auto_leader [String, "first"|"random"]
  #   Assigns group leaders automatically when generating and allocating students to groups
  #   Valid values are:
  #   "first":: the first student to be allocated to a group is the leader
  #   "random":: a random student from all members is chosen as the leader
  #
  # @argument group_limit [Integer]
  #   Limit the maximum number of users in each group (Course Only). Requires
  #   self signup.
  #
  # @argument sis_group_category_id [String]
  #   The unique SIS identifier.
  #
  # @argument create_group_count [Integer]
  #   Create this number of groups (Course Only).
  #
  # @argument split_group_count (Deprecated)
  #   Create this number of groups, and evenly distribute students
  #   among them. not allowed with "enable_self_signup". because
  #   the group assignment happens synchronously, it's recommended
  #   that you instead use the assign_unassigned_members endpoint.
  #   (Course Only)
  #
  # @example_request
  #     curl https://<canvas>/api/v1/group_categories/<group_category_id> \
  #         -X PUT \
  #         -F 'name=Project Groups' \
  #         -H 'Authorization: Bearer <token>'
  #
  # @returns GroupCategory
  def update
    if authorized_action(@context, @current_user, [:manage_groups, :manage_groups_manage])
      @group_category ||= @context.group_categories.where(id: params[:category_id]).first
      if api_request?
        if populate_group_category_from_params
          includes = ['progress_url']
          includes.concat(params[:includes]) if params[:includes]
          render :json => group_category_json(@group_category, @current_user, session, :include => includes)
        end
        if (sis_id = params[:sis_group_category_id])
          if @group_category.root_account.grants_right?(@current_user, :manage_sis)
            @group_category.sis_source_id = sis_id

            DueDateCacher.with_executing_user(@current_user) do
              @group_category.save!
            end
          else
            render json: { message: "You must have manage_sis permission to set sis attributes" }, status: :unauthorized
          end
        end
      else
        return render(:json => { 'status' => 'not found' }, :status => :not_found) unless @group_category
        return render(:json => { 'status' => 'unauthorized' }, :status => :unauthorized) if @group_category.protected?

        if populate_group_category_from_params
          flash[:notice] = t('notices.update_category_success', 'Category was successfully updated.')
          render :json => @group_category
        end
      end
    end
  end

  # @API Delete a Group Category
  # Deletes a group category and all groups under it. Protected group
  # categories can not be deleted, i.e. "communities" and "student_organized".
  #
  # @example_request
  #     curl https://<canvas>/api/v1/group_categories/<group_category_id> \
  #           -X DELETE \
  #           -H 'Authorization: Bearer <token>'
  #
  def destroy
    if authorized_action(@context, @current_user, [:manage_groups, :manage_groups_delete])
      @group_category ||= @context.group_categories.where(id: params[:category_id]).first
      return render(:json => { 'status' => 'not found' }, :status => :not_found) unless @group_category
      return render(:json => { 'status' => 'unauthorized' }, :status => :unauthorized) if @group_category.protected?

      if @group_category.destroy
        if api_request?
          render :json => group_category_json(@group_category, @current_user, session)
        else
          flash[:notice] = t('notices.delete_category_success', "Category successfully deleted")
          render :json => { :deleted => true }
        end
      else
        if api_request?
          render :json => @group_category.errors, :status => :bad_request
        else
          render :json => { :deleted => false }
        end
      end
    end
  end

  # @API List groups in group category
  #
  # Returns a paginated list of groups in a group category
  #
  # @example_request
  #     curl https://<canvas>/api/v1/group_categories/<group_cateogry_id>/groups \
  #          -H 'Authorization: Bearer <token>'
  #
  # @returns [Group]
  def groups
    if authorized_action(@context, @current_user, [:manage_groups, *RoleOverride::GRANULAR_MANAGE_GROUPS_PERMISSIONS])
      @groups = @group_category.groups.active.by_name.preload(:root_account)
      @groups = Api.paginate(@groups, self, api_v1_group_category_groups_url)
      render :json => @groups.map { |g| group_json(g, @current_user, session) }
    end
  end

  # @API export groups in and users in category
  # @beta
  #
  # Returns a csv file of users in format ready to import.
  #
  # @example_request
  #     curl https://<canvas>/api/v1/group_categories/<group_category_id>/export \
  #          -H 'Authorization: Bearer <token>'
  def export
    GuardRail.activate(:secondary) do
      if authorized_action(@context, @current_user, [:manage_groups, :manage_groups_manage])
        include_sis_id = @context.grants_any_right?(@current_user, session, :read_sis, :manage_sis)
        csv_string = CSV.generate do |csv|
          section_names = @context.course_sections.select(:id, :name).index_by(&:id)
          users = @context.participating_students
                          .select(<<~SQL.squish)
                            users.id, users.sortable_name,
                            /* we just want any that have an sis_pseudonym_id populated */
                            MAX (enrollments.sis_pseudonym_id) AS sis_pseudonym_id,
                            /* grab all the section_ids to get the section names */
                            ARRAY_AGG (enrollments.course_section_id) AS course_section_ids
                          SQL
                          .where("enrollments.type='StudentEnrollment'")
                          .order("users.sortable_name").group(:id)
          gms_by_user_id = GroupMembership.active.where(group_id: @group_category.groups.active.select(:id))
                                          .joins(:group).select(:user_id, :name, :sis_source_id, :group_id).index_by(&:user_id)
          csv << export_headers(include_sis_id, gms_by_user_id.any?)
          users.preload(:pseudonyms).find_each { |u| csv << build_row(u, section_names, gms_by_user_id, include_sis_id) }
        end
        # keep inside authorized_action block to avoid
        # double render error if user is not authorized
        respond_to do |format|
          format.csv { send_data csv_string, type: 'text/csv', filename: "#{@group_category.name}.csv", disposition: 'attachment' }
        end
      end
    end
  end

  def build_row(user, section_names, gms_by_user_id, include_sis_id)
    row = []
    row << user.sortable_name
    row << user.id
    e = Enrollment.new(user_id: user.id,
                       root_account_id: @context.root_account_id,
                       sis_pseudonym_id: user.sis_pseudonym_id,
                       course_id: @context.id)
    p = SisPseudonym.for(user, e, type: :trusted, require_sis: false, root_account: @context.root_account)
    row << p&.sis_user_id if include_sis_id
    row << p&.unique_id
    row << section_names.values_at(*user.course_section_ids).map(&:name).to_sentence
    row << gms_by_user_id[user.id]&.name
    if gms_by_user_id.any?
      row << gms_by_user_id[user.id]&.group_id
      row << gms_by_user_id[user.id]&.sis_source_id if include_sis_id
    end
    row
  end

  def export_headers(include_sis_id, groups_exist = true)
    headers = []
    headers << I18n.t("name")
    headers << "canvas_user_id"
    headers << "user_id" if include_sis_id
    headers << "login_id"
    headers << I18n.t("sections")
    headers << "group_name"
    if groups_exist
      headers << "canvas_group_id"
      headers << "group_id" if include_sis_id
    end
    headers
  end

  include Api::V1::User
  # @API List users in group category
  #
  # Returns a paginated list of users in the group category.
  #
  # @argument search_term [String]
  #   The partial name or full ID of the users to match and return in the results
  #   list. Must be at least 3 characters.
  #
  # @argument unassigned [Boolean]
  #   Set this value to true if you wish only to search unassigned users in the
  #   group category.
  #
  # @example_request
  #     curl https://<canvas>/api/v1/group_categories/1/users \
  #          -H 'Authorization: Bearer <token>'
  #
  # @returns [User]
  def users
    if @context.is_a? Course
      return unless authorized_action(@context, @current_user, :read_roster)
    else
      return unless authorized_action(@context, @current_user, :read)
    end

    search_term = params[:search_term].presence
    search_params = params.slice(:search_term)
    search_params[:enrollment_type] = "student" if @context.is_a? Course

    @group_category ||= @context.group_categories.where(id: params[:group_category_id]).first
    exclude_groups = value_to_boolean(params[:unassigned]) ? @group_category.groups.active.pluck(:id) : []
    search_params[:exclude_groups] = exclude_groups

    users = if search_term
              UserSearch.for_user_in_context(search_term, @context, @current_user, session, search_params)
            else
              UserSearch.scope_for(@context, @current_user, search_params)
            end

    includes = Array(params[:include])
    users = Api.paginate(users, self, api_v1_group_category_users_url)
    UserPastLtiId.manual_preload_past_lti_ids(users, @group_category.groups) if ['uuid', 'lti_id'].any? { |id| includes.include? id }
    user_json_preloads(users, false, { profile: true })
    json_users = users_json(users, @current_user, session, includes, @context, nil, Array(params[:exclude]))

    if includes.include?('group_submissions') && @group_category.context_type == "Course"
      submissions_by_user = @group_category.submission_ids_by_user_id(users.map(&:id))
      json_users.each do |user|
        user[:group_submissions] = submissions_by_user[user[:id]]
      end
    end

    render :json => json_users
  end

  # @API Assign unassigned members
  #
  # Assign all unassigned members as evenly as possible among the existing
  # student groups.
  #
  # @argument sync [Boolean]
  #   The assigning is done asynchronously by default. If you would like to
  #   override this and have the assigning done synchronously, set this value
  #   to true.
  #
  # @example_request
  #     curl https://<canvas>/api/v1/group_categories/1/assign_unassigned_members \
  #          -H 'Authorization: Bearer <token>'
  #
  # @example_response
  #    # Progress (default)
  #    {
  #        "completion": 0,
  #        "context_id": 20,
  #        "context_type": "GroupCategory",
  #        "created_at": "2013-07-05T10:57:48-06:00",
  #        "id": 2,
  #        "message": null,
  #        "tag": "assign_unassigned_members",
  #        "updated_at": "2013-07-05T10:57:48-06:00",
  #        "user_id": null,
  #        "workflow_state": "running",
  #        "url": "http://localhost:3000/api/v1/progress/2"
  #    }
  #
  # @example_response
  #    # New Group Memberships (when sync = true)
  #    [
  #      {
  #        "id": 65,
  #        "new_members": [
  #          {
  #            "user_id": 2,
  #            "name": "Sam",
  #            "display_name": "Sam",
  #            "sections": [
  #              {
  #                "section_id": 1,
  #                "section_code": "Section 1"
  #              }
  #            ]
  #          },
  #          {
  #            "user_id": 3,
  #            "name": "Sue",
  #            "display_name": "Sue",
  #            "sections": [
  #              {
  #                "section_id": 2,
  #                "section_code": "Section 2"
  #              }
  #            ]
  #          }
  #        ]
  #      },
  #      {
  #        "id": 66,
  #        "new_members": [
  #          {
  #            "user_id": 5,
  #            "name": "Joe",
  #            "display_name": "Joe",
  #            "sections": [
  #              {
  #                "section_id": 2,
  #                "section_code": "Section 2"
  #              }
  #            ]
  #          },
  #          {
  #            "user_id": 11,
  #            "name": "Cecil",
  #            "display_name": "Cecil",
  #            "sections": [
  #              {
  #                "section_id": 3,
  #                "section_code": "Section 3"
  #              }
  #            ]
  #          }
  #        ]
  #      }
  #    ]
  #
  # @returns GroupMembership | Progress
  def assign_unassigned_members
    return unless authorized_action(@context, @current_user, [:manage_groups, :manage_groups_manage])

    # option disabled for student organized groups or section-restricted
    # self-signup groups. (but self-signup is ignored for non-Course groups)
    return render(:json => {}, :status => :bad_request) if @group_category.student_organized?
    return render(:json => {}, :status => :bad_request) if @context.is_a?(Course) && @group_category.restricted_self_signup?

    by_section = value_to_boolean(params[:group_by_section])

    if value_to_boolean(params[:sync])
      # do the distribution and note the changes
      memberships = @group_category.assign_unassigned_members(by_section, updating_user: @current_user)

      # render the changes
      json = memberships.group_by(&:group_id).map do |group_id, new_members|
        { :id => group_id, :new_members => new_members.map { |m| m.user.group_member_json(@context) } }
      end
      render :json => json
    else
      @group_category.assign_unassigned_members_in_background(by_section, updating_user: @current_user)
      render :json => progress_json(@group_category.current_progress, @current_user, session)
    end
  end

  def populate_group_category_from_params
    args = api_request? ? params : (params[:category] || {})
    @group_category = GroupCategories::ParamsPolicy.new(@group_category, @context).populate_with(args)

    DueDateCacher.with_executing_user(@current_user) do
      unless @group_category.save
        render :json => @group_category.errors, :status => :bad_request
        return false
      end
    end
    true
  end

  def clone_with_name
    if authorized_action(get_category_context, @current_user, [:manage_groups, :manage_groups_add])
      GroupCategory.transaction do
        group_category = GroupCategory.active.find(params[:id])
        new_group_category = group_category.dup
        new_group_category.sis_source_id = nil
        new_group_category.name = params[:name]
        begin
          DueDateCacher.with_executing_user(@current_user) do
            new_group_category.save!
            group_category.clone_groups_and_memberships(new_group_category)
          end
          render :json => new_group_category
        rescue ActiveRecord::RecordInvalid
          render :json => new_group_category.errors, :status => :bad_request
        end
      end
    end
  end

  protected

  def get_category_context
    begin
      id = api_request? ? params[:group_category_id] : params[:id]
      @group_category = api_find(GroupCategory.active, id)
    rescue ActiveRecord::RecordNotFound
      return render(:json => { 'status' => 'not found' }, :status => :not_found) unless @group_category
    end
    @context = @group_category.context
  end

  private

  def body_file
    file_obj = request.body

    file_obj.instance_exec do
      def set_file_attributes(filename, content_type)
        @original_filename = filename
        @content_type = content_type
      end

      def content_type
        @content_type
      end

      def original_filename
        @original_filename
      end
    end

    if params[:extension]
      file_obj.set_file_attributes("course_group_import.#{params[:extension]}",
                                   Attachment.mimetype("course_group_import.#{params[:extension]}"))
    else
      env = request.env.dup
      env['CONTENT_TYPE'] = env["ORIGINAL_CONTENT_TYPE"]
      # copy of request with original content type restored
      request2 = Rack::Request.new(env)
      charset = request2.media_type_params['charset']
      if charset.present? && charset.casecmp('utf-8') != 0
        raise InvalidContentType
      end

      params[:extension] ||= { "text/plain" => "csv",
                               "text/csv" => "csv" }[request2.media_type] || "csv"
      file_obj.set_file_attributes("course_group_import.#{params[:extension]}",
                                   request2.media_type)
      file_obj
    end
  end
end
