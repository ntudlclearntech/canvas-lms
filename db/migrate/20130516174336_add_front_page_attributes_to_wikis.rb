#
# Copyright (C) 2013 - present Instructure, Inc.
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

class AddFrontPageAttributesToWikis < ActiveRecord::Migration[4.2]
  tag :predeploy

  def self.up
    add_column :wikis, :front_page_url, :text
    add_column :wikis, :has_no_front_page, :boolean
  end

  def self.down
    remove_column :wikis, :front_page_url
    remove_column :wikis, :has_no_front_page
  end
end
