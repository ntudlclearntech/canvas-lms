# frozen_string_literal: true

#
# Copyright (C) 2019 - present Instructure, Inc.
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
  class LearningOutcomeType < ApplicationObjectType
    class AssessedLoader < GraphQL::Batch::Loader
      def perform(outcomes)
        assessed_ids = LearningOutcomeResult.where(learning_outcome_id: outcomes).distinct.pluck(:learning_outcome_id)
        outcomes.each do |outcome|
          fulfill(outcome, assessed_ids.include?(outcome.id))
        end
      end
    end

    alias outcome object
    implements GraphQL::Types::Relay::Node
    implements Interfaces::LegacyIDInterface
    implements Interfaces::TimestampInterface

    global_id_field :id

    field :context_id, Integer, null: true
    field :context_type, String, null: true
    field :title, String, null: false
    field :description, String, null: true
    field :display_name, String, null: true
    field :vendor_guid, String, null: true

    field :can_edit, Boolean, null: false
    def can_edit
      if outcome.context_id
        return outcome_context_promise.then {|context|
          context.grants_right?(current_user, session, :manage_outcomes)
        }
      end

      Account.site_admin.grants_right?(current_user, session, :manage_global_outcomes)
    end

    field :assessed, Boolean, null: false
    def assessed
      AssessedLoader.load(outcome)
    end

    private

    def outcome_context_promise
      Loaders::AssociationLoader.for(LearningOutcome, :context).load(outcome)
    end
  end
end
