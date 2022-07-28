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

require_relative "../common"
require_relative "pages/coursepaces_common_page"
require_relative "pages/coursepaces_page"
require_relative "../helpers/blueprint_common"

describe "blueprinted course pace page" do
  include_context "in-process server selenium tests"
  include CoursePacesCommonPageObject
  include CoursePacesPageObject
  include BlueprintCourseCommon

  before :once do
    # Set up blueprint relations
    @master = course_factory(active_all: true)
    @master.update(enable_course_paces: true)
    @section_name = "Section #1"
    @master.course_sections.create!(name: @section_name)

    @template = MasterCourses::MasterTemplate.set_as_master_course(@master)
    @minion = @template.add_child_course!(course_factory(name: "Minion", active_all: true)).child_course

    # Set up would-be-paced data
    @assignment = @master.assignments.create!(title: "Blah", workflow_state: "published")
    @course_module = @master.context_modules.create!(name: "Module #1", workflow_state: "active")
    @module_item = @course_module.add_item(id: @assignment.id, type: "assignment")

    account_admin_user(active_all: true)
  end

  before do
    user_session @admin
  end

  context "blueprint course" do
    context "with an unpublished pace" do
      before do
        visit_course_paces_page course_id_override: @master.id
        wait_for_ajaximations
      end

      it "loads the lock manager" do
        expect(blueprint_lock_icon_button).to be_displayed
      end

      it "allows no locking while the pace is unpublished" do
        expect(blueprint_container_for_pacing).to be_inactive
      end
    end

    context "with a published pace" do
      before :once do
        @course_pace = CoursePace.create! course: @master, workflow_state: "active"
        @course_pace.course_pace_module_items.create! module_item: @module_item
      end

      before do
        visit_course_paces_page course_id_override: @master.id
      end

      it "allows pace locking" do
        expect(blueprint_container_for_pacing).not_to be_inactive
      end

      it "disables the lock button for section paces" do
        click_main_course_pace_menu
        click_section_menu_item
        click_section_course_pace(@section_name)
        expect(blueprint_container_for_pacing).to be_inactive
      end
    end
  end

  context "child course" do
    before do
      @course_pace = CoursePace.create! course: @master, workflow_state: "active"
      @course_pace.course_pace_module_items.create! module_item: @module_item
      run_master_course_migration(@master)
    end

    context "unlocked" do
      before do
        visit_course_paces_page course_id_override: @minion.id
        wait_for_ajaximations
      end

      it "loads the lock manager no-toggle label" do
        expect(blueprint_child_course_label).to be_displayed
        expect(settings_button).not_to be_disabled
        expect(publish_button).not_to be_disabled
        expect(duration_field[0]).not_to be_disabled
      end
    end

    context "locking" do
      before do
        visit_course_paces_page course_id_override: @master.id
        blueprint_lock_icon_button.click
        visit_course_paces_page course_id_override: @minion.id
      end

      it "disables all editing and publishing elements" do
        expect(settings_button).to be_disabled
        expect(publish_button).to be_disabled
        expect(duration_field[0]).to be_disabled
      end
    end
  end
end
