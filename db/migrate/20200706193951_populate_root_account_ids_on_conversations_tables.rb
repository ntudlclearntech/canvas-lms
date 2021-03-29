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

class PopulateRootAccountIdsOnConversationsTables < ActiveRecord::Migration[5.2]
  tag :postdeploy

  def up
    Conversation.find_ids_in_ranges(batch_size: 100_000) do |min, max|
      DataFixup::PopulateRootAccountIdsOnConversationsTables.delay_if_production(priority: Delayed::LOWER_PRIORITY,
        n_strand: ["root_account_id_backfill_strand", Shard.current.database_server.id]).run(min, max)
    end
  end

  def down; end
end
