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

class AddBlueprintNotifications < ActiveRecord::Migration[4.2]
  tag :predeploy

  def up
    return unless Shard.current == Shard.default
    Canvas::MessageHelper.create_notification({
      name: 'Blueprint Content Added',
      delay_for: 0,
      category: 'Blueprint'
    })
    Canvas::MessageHelper.create_notification({
      name: 'Blueprint Sync Complete',
      delay_for: 0,
      category: 'Blueprint'
    })
  end

  def down
    return unless Shard.current == Shard.default
    Notification.where(name: 'Blueprint Content Added').delete_all
    Notification.where(name: 'Blueprint Sync Complete').delete_all
  end
end
