#
# Copyright (C) 2020 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify
# the terms of the GNU Affero General Public License as publishe
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but 
# WARRANTY; without even the implied warranty of MERCHANTABILITY
# A PARTICULAR PURPOSE. See the GNU Affero General Public Licens
# details.
#
# You should have received a copy of the GNU Affero General Publ
# with this program. If not, see <http://www.gnu.org/licenses/>.

class AddRootAccountIdToContentParticipations < ActiveRecord::Migration[5.2]
  tag :predeploy
  disable_ddl_transaction!

  def change
    add_column :content_participations, :root_account_id, :integer, limit: 8, if_not_exists: true
    add_foreign_key :content_participations, :accounts, column: :root_account_id
    add_index :content_participations, :root_account_id, algorithm: :concurrently, if_not_exists: true
  end
end
