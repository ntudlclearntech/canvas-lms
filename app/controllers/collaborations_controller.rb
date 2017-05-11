#
# Copyright (C) 2011 - present Instructure, Inc.
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

# @API Collaborations
# API for accessing course and group collaboration information.
#
# @model Collaboration
#     {
#       "id": "Collaboration",
#       "description": "",
#       "properties": {
#         "id": {
#           "description": "The unique identifier for the collaboration",
#           "example": 43,
#           "type": "integer"
#         },
#         "collaboration_type": {
#           "description": "A name for the type of collaboration",
#           "example": "Microsoft Office",
#           "type": "string"
#         },
#         "document_id": {
#           "description": "The collaboration document identifier for the collaboration provider",
#           "example": "oinwoenfe8w8ef_onweufe89fef",
#           "type": "string"
#         },
#         "user_id": {
#           "description": "The canvas id of the user who created the collaboration",
#           "example": 92,
#           "type": "integer"
#         },
#         "context_id": {
#           "description": "The canvas id of the course or group to which the collaboration belongs",
#           "example": 77,
#           "type": "integer"
#         },
#         "context_type": {
#           "description": "The canvas type of the course or group to which the collaboration belongs",
#           "example": "Course",
#           "type": "string"
#         },
#         "url": {
#           "description": "The LTI launch url to view collaboration.",
#           "type": "string"
#         },
#         "created_at": {
#           "description": "The timestamp when the collaboration was created",
#           "example": "2012-06-01T00:00:00-06:00",
#           "type": "datetime"
#         },
#         "updated_at": {
#           "description": "The timestamp when the collaboration was last modified",
#           "example": "2012-06-01T00:00:00-06:00",
#           "type": "datetime"
#         },
#         "description": {
#           "type": "string"
#         },
#         "title": {
#           "type": "string"
#         },
#         "type": {
#           "description": "Another representation of the collaboration type",
#           "example": "ExternalToolCollaboration",
#           "type": "string"
#         },
#         "update_url": {
#           "description": "The LTI launch url to edit the collaboration",
#           "type": "string"
#         },
#         "user_name": {
#           "description": "The name of the user who owns the collaboration",
#           "example": "John Danger",
#           "type": "string"
#         }
#       }
#     }
#
# @model Collaborator
#     {
#       "id": "Collaborator",
#       "description": "",
#       "required": ["id"],
#       "properties": {
#         "id": {
#           "description": "The unique user or group identifier for the collaborator.",
#           "example": 12345,
#           "type": "integer"
#         },
#         "type": {
#           "description": "The type of collaborator (e.g. 'user' or 'group').",
#           "example": "user",
#           "type": "string",
#           "allowableValues": {
#             "values": [
#               "user",
#               "group"
#             ]
#           }
#         },
#         "name": {
#           "description": "The name of the collaborator.",
#           "example": "Don Draper",
#           "type": "string"
#         }
#       }
#     }
#
class CollaborationsController < ApplicationController
  before_action :require_context, :except => [:members]
  before_action :require_collaboration_and_context, :only => [:members]
  before_action :require_collaborations_configured
  before_action :reject_student_view_student

  before_action { |c| c.active_tab = "collaborations" }

  include Api::V1::Collaborator
  include Api::V1::Collaboration
  include Api::V1::User

  def index
    return unless authorized_action(@context, @current_user, :read) &&
      tab_enabled?(@context.class::TAB_COLLABORATIONS)

    add_crumb(t('#crumbs.collaborations', "Collaborations"), polymorphic_path([@context, :collaborations]))
    @collaborations = @context.collaborations.active.select { |c| can_do(c, @current_user, :read) }
    log_asset_access([ "collaborations", @context ], "collaborations", "other")

    # this will set @user_has_google_drive
    user_has_google_drive

    @sunsetting_etherpad = EtherpadCollaboration.config.try(:[], :domain) == "etherpad.instructure.com/p"
    @has_etherpad_collaborations = @collaborations.any? {|c| c.collaboration_type == 'EtherPad'}
    @etherpad_only = Collaboration.collaboration_types.length == 1 &&
                     Collaboration.collaboration_types[0]['type'] == "etherpad"
    @hide_create_ui = @sunsetting_etherpad && @etherpad_only
    js_env :TITLE_MAX_LEN => Collaboration::TITLE_MAX_LENGTH,
           :CAN_MANAGE_GROUPS => @context.grants_right?(@current_user, session, :manage_groups),
           :collaboration_types => Collaboration.collaboration_types,
           :POTENTIAL_COLLABORATORS_URL => polymorphic_url([:api_v1, @context, :potential_collaborators])

    set_tutorial_js_env
  end

  # @API List collaborations
  # List collaborations the current user has access to in the context of the course
  # provided in the url. NOTE: this only returns ExternalToolCollaboration type
  # collaborations.
  #
  #   curl https://<canvas>/api/v1/courses/1/collaborations/
  #
  # @returns [Collaboration]
  def api_index
    return unless authorized_action(@context, @current_user, :read) &&
      (tab_enabled?(@context.class::TAB_COLLABORATIONS) || tab_enabled?(@context.class::TAB_COLLABORATIONS_NEW))

    url = @context.instance_of?(Course) ? api_v1_course_collaborations_index_url : api_v1_group_collaborations_index_url

    collaborations_query = @context.collaborations.active.
                             eager_load(:user).
                             where(type: 'ExternalToolCollaboration')

    unless @context.grants_right?(@current_user, session, :manage_content)
      where_collaborators = Collaboration.arel_table[:user_id].eq(@current_user.id).
                            or(Collaborator.arel_table[:user_id].eq(@current_user.id))
      if @context.instance_of?(Course)
        users_course_groups = @context.groups.joins(:users).where(User.arel_table[:id].eq(@current_user.id)).pluck(:id)
        where_collaborators = where_collaborators.or(Collaborator.arel_table[:group_id].in(users_course_groups))
      end

      collaborations_query = collaborations_query.
                                eager_load(:collaborators).
                                where(where_collaborators)
    end

    collaborations = Api.paginate(
      collaborations_query,
      self,
      url
    )

    render :json => collaborations.map { |c| collaboration_json(c, @current_user, session) }
  end

  def show
    @collaboration = @context.collaborations.find(params[:id])
    if authorized_action(@collaboration, @current_user, :read)
      @collaboration.touch
      begin
        if @collaboration.valid_user?(@current_user)
          @collaboration.authorize_user(@current_user)
          log_asset_access(@collaboration, "collaborations", "other", 'participate')
          if @collaboration.is_a? ExternalToolCollaboration
            url = external_tool_launch_url(@collaboration.url)
          else
            url = @collaboration.url
          end
          redirect_to url
        elsif @collaboration.is_a?(GoogleDocsCollaboration)
          redirect_to oauth_url(:service => :google_drive, :return_to => request.url)
        else
          flash[:error] = t 'errors.cannot_load_collaboration', "Cannot load collaboration"
          redirect_to named_context_url(@context, :context_collaborations_url)
        end
      rescue GoogleDrive::ConnectionException => drive_exception
        Canvas::Errors.capture(drive_exception)
        flash[:error] = t 'errors.cannot_load_collaboration', "Cannot load collaboration"
        redirect_to named_context_url(@context, :context_collaborations_url)
      end
    end
  end

  def lti_index
    return unless authorized_action(@context, @current_user, :read) &&
      tab_enabled?(@context.class::TAB_COLLABORATIONS)

    @page_title = t('lti_collaborations', 'LTICollaborations')
    @body_classes << 'full-width padless-content'
    js_bundle :react_collaborations
    css_bundle :react_collaborations

    add_crumb(t('#crumbs.collaborations', "Collaborations"),  polymorphic_path([@context, :lti_collaborations]))

    if @context.instance_of? Group
      parent_context = @context.context
      js_env :PARENT_CONTEXT => {
        :context_asset_string => parent_context.try(:asset_string)
      }
    end

    set_tutorial_js_env

    render :text => "".html_safe, :layout => true
  end

  def create
    return unless authorized_action(@context.collaborations.build, @current_user, :create)
    content_item = params['contentItems'] ? JSON.parse(params['contentItems']).first : nil
    if content_item
      @collaboration = collaboration_from_content_item(content_item)
      users, group_ids = content_item_visibility(content_item)
    else
      users     = User.where(:id => Array(params[:user])).to_a
      group_ids = Array(params[:group])
      collaboration_params = params.require(:collaboration).permit(:title, :description, :url)
      collaboration_params[:user] = @current_user
      @collaboration = Collaboration.typed_collaboration_instance(params[:collaboration].delete(:collaboration_type))
      collaboration_params.delete(:url) unless @collaboration.is_a?(ExternalToolCollaboration)
      @collaboration.attributes = collaboration_params
    end
    @collaboration.context = @context
    respond_to do |format|
      if @collaboration.save
        Lti::ContentItemUtil.new(content_item).success_callback if content_item
        # After saved, update the members
        @collaboration.update_members(users, group_ids)
        format.html { redirect_to @collaboration.url }
        format.json { render :json => @collaboration.as_json(:methods => [:collaborator_ids], :permissions => {:user => @current_user, :session => session}) }
      else
        Lti::ContentItemUtil.new(content_item).failure_callback if content_item
        flash[:error] = t 'errors.create_failed', "Collaboration creation failed"
        format.html { redirect_to named_context_url(@context, :context_collaborations_url) }
        format.json { render :json => @collaboration.errors, :status => :bad_request }
      end
    end
  end

  def update
    @collaboration = @context.collaborations.find(params[:id])
    return unless authorized_action(@collaboration, @current_user, :update)
    content_item = params['contentItems'] ? JSON.parse(params['contentItems']).first : nil
    begin
      if content_item
        @collaboration = collaboration_from_content_item(content_item, @collaboration)
        users, group_ids = content_item_visibility(content_item)
      else
        users     = User.where(:id => Array(params[:user])).to_a
        group_ids = Array(params[:group])
        @collaboration.attributes = params.require(:collaboration).permit(:title, :description, :url)
      end
      @collaboration.update_members(users, group_ids)
      respond_to do |format|
        if @collaboration.save
          Lti::ContentItemUtil.new(content_item).success_callback if content_item
          format.html { redirect_to named_context_url(@context, :context_collaborations_url) }
          format.json { render :json => @collaboration.as_json(
                                 :methods => [:collaborator_ids],
                                 :permissions => {
                                   :user => @current_user,
                                   :session => session
                                 }
                               )}
        else
          Lti::ContentItemUtil.new(content_item).failure_callback if content_item
          flash[:error] = t 'errors.update_failed', "Collaboration update failed"
          format.html { redirect_to named_context_url(@context, :context_collaborations_url) }
          format.json { render :json => @collaboration.errors, :status => :bad_request }
        end
      end
    rescue GoogleDrive::ConnectionException => error
      Rails.logger.warn error
      flash[:error] = t 'errors.update_failed', "Collaboration update failed" # generic failure message
      if error.message.include?('File not found')
        flash[:error] = t 'google_drive.file_not_found', "Collaboration file not found"
      end
      raise error unless error.message.include?('File not found')
      redirect_to named_context_url(@context, :context_collaborations_url)
    end
  end

  def destroy
    @collaboration = @context.collaborations.find(params[:id])
    if authorized_action(@collaboration, @current_user, :delete)
      @collaboration.delete_document if value_to_boolean(params[:delete_doc])
      @collaboration.destroy
      respond_to do |format|
        format.html { redirect_to named_context_url(@context, :collaborations_url) }
        format.json { render :json => @collaboration }
      end
    end
  end

  # @API List members of a collaboration.
  #
  # List the collaborators of a given collaboration
  #
  # @argument include[] [String, "collaborator_lti_id"|"avatar_image_url"]
  #   - "collaborator_lti_id": Optional information to include with each member.
  #     Represents an identifier to be used for the member in an LTI context.
  #   - "avatar_image_url": Optional information to include with each member.
  #     The url for the avatar of a collaborator with type 'user'.
  #
  # @example_request
  #
  #   curl https://<canvas>/api/v1/courses/1/collaborations/1/members
  #
  # @returns [Collaborator]
  def members
    return unless authorized_action(@collaboration, @current_user, :read)
    options = {:include => params[:include]}
    collaborators = @collaboration.collaborators.preload(:group, :user)
    collaborators = Api.paginate(collaborators,
                                 self,
                                 api_v1_collaboration_members_url)

    render :json => collaborators.map { |c| collaborator_json(c, @current_user, session, options) }
  end

  # @API List potential members
  #
  # List the users who can potentially be added to a collaboration in the given context.
  #
  # For courses, this consists of all enrolled users.  For groups, it is comprised of the
  # group members plus the admins of the course containing the group.
  #
  # @returns [User]
  def potential_collaborators
    return unless authorized_action(@context, @current_user, :read_roster)
    scope = @context.potential_collaborators.order(:sortable_name)
    users = Api.paginate(scope, self, polymorphic_url([:api_v1, @context, :potential_collaborators]))
    render :json => users.map { |u| user_json(u, @current_user, session) }
  end

  private
  def require_collaboration_and_context
    @collaboration = if @context.present?
                       @context.collaborations.find(params[:id])
                     else
                       Collaboration.find(params[:id])
                     end
    @context = @collaboration.context
  end

  def require_collaborations_configured
    unless Collaboration.any_collaborations_configured?(@context) || @domain_root_account.feature_enabled?(:new_collaborations)
      flash[:error] = t 'errors.not_enabled', "Collaborations have not been enabled for this Canvas site"
      redirect_to named_context_url(@context, :context_url)
      return false
    end
  end

  def collaboration_from_content_item(content_item, collaboration = ExternalToolCollaboration.new)
    collaboration.attributes = {
        title: content_item['title'],
        description: content_item['text'],
        user: @current_user
    }
    collaboration.data = content_item
    collaboration.url = content_item['url']
    collaboration
  end

  def external_tool_launch_url(url)
    polymorphic_url([:retrieve, @context, :external_tools], url: url, display: 'borderless')
  end

  def content_item_visibility(content_item)
    visibility = content_item['ext_canvas_visibility']
    lti_user_ids = visibility && visibility['users'] || []
    lti_group_ids = visibility && visibility['groups'] || []
    users = User.where(lti_context_id: lti_user_ids).to_a
    group_ids = Group.where(lti_context_id: lti_group_ids).map(&:id)
    [users, group_ids]
  end

end
