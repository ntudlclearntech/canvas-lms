# frozen_string_literal: true

#
# Copyright (C) 2022 - present Instructure, Inc.
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
require_relative "../courses/pages/courses_home_page"

describe "course pace page" do
  include_context "in-process server selenium tests"
  include CoursePacesCommonPageObject
  include CoursePacesPageObject
  include CoursesHomePage

  before :once do
    teacher_setup
    course_with_student(
      active_all: true,
      name: "Jessi Jenkins",
      course: @course
    )
    enable_course_paces_in_course
  end

  before do
    user_session @teacher
  end

  context "course pacing blackout dates modal" do
    it "renders the blackout dates modal when link clicked" do
      visit_course_paces_page
      click_settings_button
      click_manage_blackout_dates

      expect(blackout_dates_modal).to be_displayed
    end

    it "adds blackout date with range of dates" do
      visit_course_paces_page
      click_settings_button
      click_manage_blackout_dates

      blackout_date_title_input.send_keys("Easter Break")
      blackout_date_start_date_input.send_keys("2022-04-15")
      blackout_date_end_date_input.send_keys("2022-04-18")
      click_blackout_dates_add_button

      table_text = blackout_dates_table_items[1].text
      expect(table_text).to include("Easter Break")
      expect(table_text).to include("Fri, Apr 15, 2022")
      expect(table_text).to include("Mon, Apr 18, 2022")
    end

    it "adds blackout date with one date" do
      visit_course_paces_page
      click_settings_button
      click_manage_blackout_dates

      blackout_date_title_input.send_keys("Easter Break")
      blackout_date_start_date_input.send_keys("2022-04-15")
      click_blackout_dates_add_button
      table_text = blackout_dates_table_items[1].text

      expect(table_text).to include("Easter Break")
      expect(table_text).to include("Fri, Apr 15, 2022 Fri, Apr 15, 2022")
    end

    it "deletes a just-added blackout date" do
      visit_course_paces_page
      click_settings_button
      click_manage_blackout_dates

      blackout_date_title_input.send_keys("Easter Break")
      blackout_date_start_date_input.send_keys("2022-04-15")
      click_blackout_dates_add_button

      blackout_date_delete(blackout_dates_table_items[1]).click
      expect(blackout_dates_table_items[1].text).to eq("No blackout dates")
    end

    it "displays and deletes calendar event blackout dates" do
      Account.site_admin.enable_feature! :account_level_blackout_dates
      CalendarEvent.create!({
                              title: "calendar event blackout event",
                              start_at: Time.zone.now.beginning_of_day,
                              end_at: Time.zone.now.beginning_of_day,
                              context: @course,
                              blackout_date: true
                            })
      expect(CalendarEvent.last.deleted_at).to be_nil
      visit_course_paces_page
      click_settings_button
      click_manage_blackout_dates
      table_text = blackout_dates_table_items[1].text
      expect(table_text).to include("calendar event blackout event")
      blackout_date_delete(blackout_dates_table_items[1]).click
      expect(blackout_dates_table_items[1].text).to eq("No blackout dates")
      click_blackout_dates_save_button
      publish_button.click
      wait_for_ajaximations
      expect(CalendarEvent.last.deleted_at).not_to be_nil
    end
  end

  context "just added blackout dates" do
    before :once do
      create_published_course_pace("Pace Module", "Assignment 1")
    end

    it "save a just-added blackout date" do
      visit_course_paces_page

      click_settings_button
      click_manage_blackout_dates

      blackout_date_title_input.send_keys("Easter Break")
      blackout_date_start_date_input.send_keys("2022-04-26")
      click_blackout_dates_add_button
      click_blackout_dates_save_button

      expect(blackout_dates_modal_exists?).to be_falsey
    end

    it "shows the blackout date in unpublished changes tray", ignore_js_errors: true do
      visit_course_paces_page

      click_settings_button
      click_manage_blackout_dates

      blackout_date_title_input.send_keys("Easter Break")
      blackout_date_start_date_input.send_keys("2022-04-15")
      click_blackout_dates_add_button

      blackout_date_title_input.send_keys("Me Time Break")
      blackout_date_start_date_input.send_keys("2022-04-30")
      click_blackout_dates_add_button
      click_blackout_dates_save_button

      expect(publish_status_button.text).to eq("2 unpublished changes")
      click_unpublished_changes_button
      expect(unpublished_changes_list[0].text).to include("Easter Break")
      expect(unpublished_changes_list[1].text).to include("Me Time Break")
    end

    it "adds the blackout date to the module items list" do
      @course.blackout_dates.create! event_title: "Blackout test", start_date: "2022-04-28", end_date: "2022-05-02"
      visit_course_paces_page

      expect(blackout_module_item).to be_displayed
    end

    it "moves the dates of the existing item to the correct new date" do
      @course.blackout_dates.create! event_title: "Blackout test", start_date: "2022-04-26", end_date: "2022-04-26"

      visit_course_paces_page

      expect(assignment_due_date.text).to eq("Thu, Apr 28, 2022")
    end
  end

  context "course with multiple modules" do
    before :once do
      create_published_course_pace("Pace Module 1", "Assignment 1")
      @assignment_1 = @course_pace_assignment
      create_assignment(@course, "Assignment 2", "Assignment 2", 10, "published")
      @assignment_2 = @course_pace_assignment
      @course_pace_module.add_item(id: @assignment_2.id, type: "assignment")
      @course_pace.course_pace_module_items.last.update! duration: 2
      create_course_pace_module_with_assignment("Pace Module 2", "Assignment 3")
      @assignment_3 = @course_pace_assignment
      run_jobs # Run the autopublish job
    end

    it "shows blackout dates in the correct range when assignments change modules" do
      visit_course_paces_page

      click_settings_button
      click_manage_blackout_dates

      blackout_date_title_input.send_keys("Course Break")
      blackout_date_start_date_input.send_keys("2022-04-27")
      click_blackout_dates_add_button

      blackout_date_title_input.send_keys("Course Rest")
      blackout_date_start_date_input.send_keys("2022-04-30")
      click_blackout_dates_add_button

      blackout_date_title_input.send_keys("Course Time Off")
      blackout_date_start_date_input.send_keys("2022-05-04")
      click_blackout_dates_add_button
      click_blackout_dates_save_button

      expect(blackout_module_items[0].text).to eq("Course Break\nBlackout Date\n1 Wed, Apr 27, 2022")
      expect(assignment_due_dates[0].text).to eq("Thu, Apr 28, 2022")
      expect(blackout_module_items[1].text).to eq("Course Rest\nBlackout Date\n1 Sat, Apr 30, 2022")
      expect(assignment_due_dates[1].text).to eq("Mon, May 2, 2022")
      expect(blackout_module_items[2].text).to eq("Course Time Off\nBlackout Date\n1 Wed, May 4, 2022")
      expect(assignment_due_dates[2].text).to eq("Thu, May 5, 2022")

      click_publish_button

      get "/courses/#{@course.id}/modules"
      wait_for_ajaximations
      selector_1 = ".Assignment_#{@assignment_1.id} .move_item_link"
      selector_2 = ".Assignment_#{@assignment_2.id} .move_item_link"
      selector_3 = ".Assignment_#{@assignment_3.id} .move_item_link"
      js_drag_and_drop(selector_3, selector_2)
      js_drag_and_drop(selector_3, selector_1)
      visit_course_paces_page
      refresh_page

      expect(blackout_module_items[0].text).to eq("Course Break\nBlackout Date\n1 Wed, Apr 27, 2022")
      expect(assignment_due_dates[0].text).to eq("Thu, Apr 28, 2022")
      expect(blackout_module_items[1].text).to eq("Course Rest\nBlackout Date\n1 Sat, Apr 30, 2022")
      expect(assignment_due_dates[1].text).to eq("Mon, May 2, 2022")
      expect(blackout_module_items[2].text).to eq("Course Time Off\nBlackout Date\n1 Wed, May 4, 2022")
      expect(assignment_due_dates[2].text).to eq("Thu, May 5, 2022")
    end
  end
end
