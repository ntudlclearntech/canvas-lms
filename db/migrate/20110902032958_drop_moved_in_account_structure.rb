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

class DropMovedInAccountStructure < ActiveRecord::Migration[4.2]
  tag :predeploy

  def self.up
    remove_index :users, :moved_in_account_structure
    remove_column :users, :moved_in_account_structure
    remove_index :courses, [:moved_in_account_structure, :updated_at]
    remove_column :courses, :moved_in_account_structure
    remove_column :accounts, :moved_in_account_structure
  end

  def self.down
    add_column :accounts, :moved_in_account_structure, :boolean, :default => true
    add_column :courses, :moved_in_account_structure, :boolean, :default => true
    add_index :courses, [:moved_in_account_structure, :updated_at]
    add_column :users, :moved_in_account_structure, :boolean, :default => true
    add_index :users, :moved_in_account_structure
  end
end
