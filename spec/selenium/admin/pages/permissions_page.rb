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

require_relative '../../common'

class PermissionsIndex
  class << self
    include SeleniumDependencies

    def visit(account)
      set_permission_ui_flag(account, "on")
      get("/accounts/#{account.id}/permissions")
    end

    def set_permission_ui_flag(account, state)
      account.set_feature_flag! :permissions_v2_ui, state
    end

    # ---------------------- Controls ----------------------
    def permission_tab(tab_name)
      f(".#{tab_name}")
    end

    def search_box
      f('input[name="permission_search"]')
    end

    def filter_control
      f('.filter_control')
    end

    def filter_item(filter_item)
      f(".#{filter_item}")
    end

    def add_role_button
      f('#add_role')
    end

    def role_header
      f('.ic-permissions__top-header')
    end

    def role_link(role)
      f("#user_#{role.id}")
    end

    # this is the button/link that opens the tray
    def permission_link(permission)
      f("##{permission.permission_name}")
    end

    # this applies to parent permissions only
    def permission_cell(permission_name, role_id)
      f("##{permission_name}_role_#{role_id}")
    end

    def permission_edit_tray_button(permission_name, role_id)
      ff("##{permission_name}_#{role_id}").last
    end

    def permission_menu_item(item_name)
      f("#permission_table_#{item_name}_menu_item")
    end

    def new_role_name_input
      f('#new_role_name')
    end

    def edit_role_icon
      f("#edit_button")
    end

    def add_role_input
      f("#add_role_input")
    end

    def role_name(role)
      f("#role_#{role.id}")
    end

    def edit_tray_header
      f("#edit_tray_header")
    end

    def add_role_submit_button
      f("#permissions-add-tray-submit-button")
    end

    def edit_role_tray_permissoin_state(permission, role)
      icon = ff("##{permission}_#{role} svg").first.attribute('name')
      state = ""
      if icon == "IconTrouble"
        state = "Disabled"
      elsif icon == "IconPublish"
        state = "Enabled"
      end
      state
    end

    def permission_state(permission, role)
      state = ""
      icons = ff('svg', permission_cell(permission, role))
      icons.each do |icon|
        if icon.name == "IconPublish"
          state = "Enabled" + state
        elsif icon.name == "IconTrouble"
          state = "Disabled" + state
        elsif icon.name == "IconLock"
          state += " Locked"
        end
      end
    end


    # eventually add a section for the expanded permissions

    # ---------------------- Actions ----------------------
    def choose_tab(tab_name)
      permission_tab(tab_name).click
    end

    def disable_edit_tray_permission(permission_name, role_id)
      permission_edit_tray_button(permission_name, role_id).click()
      ff('[role="menuitemradio"]')[2].click()
    end

    def open_edit_role_tray(role)
      role_name(role).click
      edit_role_icon.click
    end

    def add_role(name)
      add_role_button.click()
      set_value(add_role_input, name)
      add_role_submit_button.click()
      wait_for_ajaximations
    end

    def edit_role(role, new_name)
      open_edit_role_tray(role)
      set_value(f('input[name="edit_name_box"]'), new_name)
      driver.action.send_keys(:tab).perform
    end

    def enter_search(search_term)
      set_value(search_box, search_term)
      driver.action.send_keys(:enter).perform
      wait_for_ajaximations
    end

    # this may need to be implemented differently depending
    # on which control is used
    def select_filter(filters)
      filter_control.click
      filters.each do |filter|
        filter_item(filter).click
      end
    end

    # setting in the same format as on the menu items
    def change_permission(permission, role_id, setting)
      permission_cell(permission, role_id).click
      permission_menu_item(setting).click
    end
  end
end
