# frozen_string_literal: true

#
# Copyright (C) 2021 - present Instructure, Inc.
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
class AddCourseTemplateColumns < ActiveRecord::Migration[6.0]
  tag :predeploy
  disable_ddl_transaction!

  def up
    add_column :courses, :template, :boolean, if_not_exists: true, default: false, null: false
    add_index :courses, :root_account_id, where: "template", algorithm: :concurrently, if_not_exists: true
    add_reference :accounts,
                  :course_template,
                  if_not_exists: true,
                  index: { where: "course_template_id IS NOT NULL", algorithm: :concurrently, if_not_exists: true },
                  foreign_key: { to_table: :courses }
  end

  def down
    remove_column :courses, :template
    remove_column :accounts, :course_template_id
  end
end
