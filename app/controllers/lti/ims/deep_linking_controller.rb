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

require "json/jwt"

module Lti
  module IMS
    class DeepLinkingController < ApplicationController
      protect_from_forgery except: [:deep_linking_response], with: :exception

      include Lti::IMS::Concerns::DeepLinkingServices
      include Lti::IMS::Concerns::DeepLinkingModules

      before_action :require_context
      before_action :validate_jwt
      before_action :require_context_update_rights
      before_action :require_tool

      def deep_linking_response
        # one single content item for an existing module should:
        # * not create a resource link
        # * not reload the page
        if add_item_to_existing_module? && lti_resource_links.length == 1
          render_content_items(reload_page: false)
          return
        end

        # to prepare for further UI processing, content items that don't need resources
        # like module items or assignments created now should:
        # * have resource links associated with them
        # * not reload the page
        unless create_resources_from_content_items?
          lti_resource_links.each do |content_item|
            resource_link = Lti::ResourceLink.create_with(context, tool, content_item[:custom])
            content_item[:lookup_uuid] = resource_link&.lookup_uuid
          end

          render_content_items(reload_page: false)
          return
        end

        # creating mixed content (module items and/or assignments) from the modules
        # or assignments pages should:
        # * create a new module or use existing one
        # * add all content items to this module
        # * reload the page
        context_module = if create_new_module?
                           @context.context_modules.create!(name: I18n.t("New Content From App"), workflow_state: "unpublished")
                         else
                           @context.context_modules.not_deleted.find(params[:context_module_id])
                         end

        lti_resource_links.each do |content_item|
          if allow_line_items? && content_item.key?(:lineItem)
            next unless validate_line_item!(content_item)

            assignment_id = create_assignment!(content_item)
            context_module.add_item({ type: "assignment", id: assignment_id })
          else
            context_module.add_item(build_module_item(content_item))
          end
        end

        render_content_items
      end

      private

      def render_content_items(items: content_items, reload_page: true)
        js_env({
                 deep_link_response: {
                   content_items: items,
                   msg: messaging_value("msg"),
                   log: messaging_value("log"),
                   errormsg: messaging_value("errormsg"),
                   errorlog: messaging_value("errorlog"),
                   ltiEndpoint: polymorphic_url([:retrieve, @context, :external_tools]),
                   reloadpage: reload_page
                 }.compact
               })

        render layout: "bare"
      end

      def require_context_update_rights
        return unless create_resources_from_content_items?

        authorized_action(@context, @current_user, %i[manage_content update])
      end

      def require_tool
        return unless create_resources_from_content_items?

        render_unauthorized_action if tool.blank?
      end
    end
  end
end
