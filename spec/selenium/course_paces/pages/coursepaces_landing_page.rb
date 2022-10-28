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

require_relative "../../common"

module CoursePacesLandingPageObject
  #------------------------- Selectors -------------------------------
  def context_link_selector(context_name)
    "//td[@data-testid = 'course-pace-item']/button//*[text() = '#{context_name}']"
  end

  def course_paces_navigation_selector
    ".course_paces"
  end

  def create_default_pace_button_selector
    "[data-testid='go-to-default-pace']"
  end

  def default_duration_selector
    "[data-testid='default-pace-duration']"
  end

  def get_started_button_selector
    "[data-testid='get-started-button']"
  end

  def number_of_sections_selector
    "[data-testid='number-of-sections']"
  end

  def number_of_students_selector
    "[data-testid='number-of-students']"
  end

  def section_tab_selector
    "#tab-tab-section"
  end

  def student_tab_selector
    "#tab-tab-student_enrollment"
  end

  #------------------------- Elements --------------------------------

  def context_link(context_name)
    fxpath(context_link_selector(context_name))
  end

  def course_paces_navigation
    f(course_paces_navigation_selector)
  end

  def create_default_pace_button
    f(create_default_pace_button_selector)
  end

  def default_duration
    f(default_duration_selector)
  end

  def get_started_button
    f(get_started_button_selector)
  end

  def number_of_sections
    f(number_of_sections_selector)
  end

  def number_of_students
    f(number_of_students_selector)
  end

  def section_tab
    f(section_tab_selector)
  end

  def student_tab
    f(student_tab_selector)
  end

  #----------------------- Actions & Methods -------------------------
  #----------------------- Click Items -------------------------------

  def click_context_link(context_name)
    context_link(context_name).click
  end

  def click_get_started_button
    get_started_button.click
  end

  def click_course_paces_navigation
    course_paces_navigation.click
  end

  def click_create_default_pace_button
    create_default_pace_button.click
  end

  def click_section_tab
    section_tab.click
  end

  def click_student_tab
    student_tab.click
  end

  #------------------------Retrieve Text -----------------------------
  #------------------------Element Management ------------------------
end
