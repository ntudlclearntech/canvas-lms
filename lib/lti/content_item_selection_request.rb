#
# Copyright (C) 2017 Instructure, Inc.
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

module Lti
  class ContentItemSelectionRequest
    include ActionDispatch::Routing::PolymorphicRoutes
    include Rails.application.routes.url_helpers

    def initialize(context:, domain_root_account:, host:, user: nil)
      @context = context
      @domain_root_account = domain_root_account
      @user = user
      @host = host
    end

    def generate_lti_launch(placement, opts = {})
      lti_launch = Lti::Launch.new(opts)
      lti_launch.resource_url = opts[:launch_url]

      default_params = ContentItemSelectionRequest.default_lti_params(@context, @domain_root_account, @user)
      lti_launch.params = default_params.merge({
        # required params
        lti_message_type: 'ContentItemSelectionRequest',
        lti_version: 'LTI-1p0',
        content_item_return_url: return_url(opts[:content_item_id])
      }).merge(placement_params(placement, assignment: opts[:assignment]))

      lti_launch
    end

    def self.default_lti_params(context, domain_root_account, user = nil)
      lti_helper = Lti::SubstitutionsHelper.new(context, domain_root_account, user)

      params = {
        context_id: Lti::Asset.opaque_identifier_for(context),
        tool_consumer_instance_guid: domain_root_account.lti_guid,
        roles: lti_helper.current_lis_roles,
        launch_presentation_locale: I18n.locale || I18n.default_locale.to_s,
        launch_presentation_document_target: 'iframe',
        ext_roles: lti_helper.all_roles,
      }

      params[:user_id] = Lti::Asset.opaque_identifier_for(user) if user
      params
    end

    private

    def return_url(content_item_id)
      return_url_opts = {
        service: 'external_tool_dialog',
        host: @host
      }

      if content_item_id
        return_url_opts[:id] = content_item_id
        polymorphic_url([@context, :external_content_update], return_url_opts)
      else
        polymorphic_url([@context, :external_content_success], return_url_opts)
      end
    end

    def placement_params(placement, assignment: nil)
      case placement
      when 'migration_selection'
        migration_selection_params
      when 'editor_button'
        editor_button_params
      when 'resource_selection', 'link_selection', 'assignment_selection'
        lti_launch_selection_params
      when 'collaboration'
        collaboration_params
        # collaboration = ExternalToolCollaboration.find(opts[:content_item_id]) if opts[:content_item_id]
      when 'homework_submission'
        homework_submission_params(assignment)
      else
        # TODO: we _could_, if configured, have any other placements return to the content migration page...
        raise "Content-Item not supported at this placement"
      end
    end

    def migration_selection_params
      accept_media_types = %w(
        application/vnd.ims.imsccv1p1
        application/vnd.ims.imsccv1p2
        application/vnd.ims.imsccv1p3
        application/zip
        application/xml
      )

      {
        accept_media_types: accept_media_types.join(','),
        accept_presentation_document_targets: 'download',
        accept_copy_advice: true,
        ext_content_file_extensions: %w(zip imscc mbz xml).join(','),
      }
    end

    def editor_button_params
      {
        accept_media_types: %w(image/* text/html application/vnd.ims.lti.v1.ltilink */*).join(','),
        accept_presentation_document_targets: %w(embed frame iframe window).join(','),
      }
    end

    def lti_launch_selection_params
      {
        accept_media_types: 'application/vnd.ims.lti.v1.ltilink',
        accept_presentation_document_targets: %w(frame window).join(','),
      }
    end

    def collaboration_params
      {
        accept_media_types: 'application/vnd.ims.lti.v1.ltilink',
        accept_presentation_document_targets: 'window',
        accept_unsigned: false,
        auto_create: true,
      }
    end

    def homework_submission_params(assignment)
      params = {}
      params[:accept_media_types] = '*/*'
      accept_presentation_document_targets = []
      accept_presentation_document_targets << 'window' if assignment.submission_types.include?('online_url')
      accept_presentation_document_targets << 'none' if assignment.submission_types.include?('online_upload')
      params[:accept_presentation_document_targets] = accept_presentation_document_targets.join(',')
      params[:accept_copy_advice] = !!assignment.submission_types.include?('online_upload')
      if assignment.submission_types.strip == 'online_upload' && assignment.allowed_extensions.present?
        params[:ext_content_file_extensions] = assignment.allowed_extensions.compact.join(',')
        params[:accept_media_types] = assignment.allowed_extensions.map do |ext|
          MimetypeFu::EXTENSIONS[ext]
        end.compact.join(',')
      end
      params
    end
  end
end
