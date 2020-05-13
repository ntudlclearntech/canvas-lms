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

class ChangeDelayedMessageIndexToIgnoreNullValues < ActiveRecord::Migration[5.2]
  tag :predeploy
  disable_ddl_transaction!

  def up
    # I'm sorry...
    # added index initially in 20200420211742, then added again with condition
    # in 20200511170158 which is deleted in favor of this migration.
    # it's relatively short window, so most people will just get add_index below.
    if index_name_exists?(:delayed_messages, 'index_delayed_messages_on_notification_policy_override_id') ||
      index_name_exists?(:delayed_messages, 'index_delayed_messages_with_notification_policy_override_id')
      remove_index :delayed_messages, :notification_policy_override_id
    end

    add_index :delayed_messages, :notification_policy_override_id,
              algorithm: :concurrently,
              where: "notification_policy_override_id IS NOT NULL"
  end

  def down
    remove_index :delayed_messages, :notification_policy_override_id
  end
end
