# frozen_string_literal: true

#
# Copyright (C) 2020 - present Instructure, Inc.
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

module Types
  class ConversationType < ApplicationObjectType
    graphql_name "Conversation"

    implements GraphQL::Types::Relay::Node

    global_id_field :id
    field :_id, ID, "legacy canvas id", method: :id, null: false
    field :context_type, String, null: true
    field :context_id, ID, null: true
    field :subject, String, null: true
    field :updated_at, Types::DateTimeType, null: true

    field :conversation_messages_connection, Types::ConversationMessageType.connection_type, null: true do
      argument :participants, [ID], required: false, prepare: GraphQLHelpers.relay_or_legacy_ids_prepare_func("User")
      argument :created_before, DateTimeType, required: false
    end
    def conversation_messages_connection(participants: nil, created_before: nil)
      load_association(:conversation_messages).then do |messages|
        Loaders::AssociationLoader.for(ConversationMessage, :conversation_message_participants).load_many(messages).then do
          messages = messages.select { |message| message.conversation_message_participants.pluck(:user_id, :workflow_state).include?([current_user.id, "active"]) }
          if participants
            messages = messages.select { |message| (participants - message.conversation_message_participants.pluck(:user_id).map(&:to_s)).empty? }
          end
          if created_before
            # We are converting the created_at time to a string and then parsing it back to a time to do the
            # comparisson. We do this to get rid of the nanoseconds on the timestamp
            messages = messages.select { |message| Time.zone.parse(message.created_at.to_s) <= created_before }
          end
          messages
        end
      end
    end

    field :conversation_participants_connection, Types::ConversationParticipantType.connection_type, null: true
    def conversation_participants_connection
      load_association(:conversation_participants)
    end

    field :context_name, String, null: true
    def context_name
      # load_association(:context).then(&:name)
      load_association(:context).then do |context|
        context&.name
      end
    end
  end
end
