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

require_relative '../common'
require_relative '../helpers/blueprint_common'

shared_context "blueprint courses assignment context" do

  def assignment_options
    f('.assignment')
  end

  def assignment_header
    f('#edit_assignment_header')
  end

  let(:delete_assignment){'a.delete_assignment'}

end

describe "master courses - child courses - assignment locking" do
  include_context "in-process server selenium tests"
  include_context "blueprint courses files context"
  include_context "blueprint courses assignment context"

  context "in the child course" do
    before :once do
      Account.default.enable_feature!(:master_courses)

      due_date = format_date_for_view(Time.zone.now - 1.month)
      @copy_from = course_factory(:active_all => true)
      @template = MasterCourses::MasterTemplate.set_as_master_course(@copy_from)
      @original_assmt = @copy_from.assignments.create!(
        title: "blah", description: "bloo", points_possible: 27, due_at: due_date
      )
      @tag = @template.create_content_tag_for!(@original_assmt)

      course_with_teacher(:active_all => true)
      @copy_to = @course
      @template.add_child_course!(@copy_to)
      # just create a copy directly instead of doing a real migration
      @assmt_copy = @copy_to.assignments.new(
        title: "blah", description: "bloo", points_possible: 27, due_at: due_date
      )
      @assmt_copy.migration_id = @tag.migration_id
      @assmt_copy.save!
    end

    before :each do
      user_session(@teacher)
    end

    it "should contain the delete cog-menu option on the index when unlocked" do
      get "/courses/#{@copy_to.id}/assignments"

      expect(f("#assignment_#{@assmt_copy.id}")).to contain_css('.icon-blueprint')

      options_button.click
      expect(assignment_options).to contain_css(delete_assignment)
    end

    it "should not contain the delete cog-menu option on the index when locked" do
      @tag.update(restrictions: {content: true})

      get "/courses/#{@copy_to.id}/assignments"

      expect(f("#assignment_#{@assmt_copy.id}")).to contain_css('.icon-blueprint-lock')

      options_button.click
      expect(assignment_options).not_to contain_css(delete_assignment)
    end

    it "should show the delete cog-menu option on the index when not locked" do
      get "/courses/#{@copy_to.id}/assignments"

      expect(f("#assignment_#{@assmt_copy.id}")).to contain_css('.icon-blueprint')

      options_button.click
      expect(assignment_options).not_to contain_css('a.delete_assignment.disabled')
      expect(assignment_options).to contain_css(delete_assignment)
    end

    it "should not allow the delete options on the edit page when locked" do
      @tag.update(restrictions: {content: true})

      get "/courses/#{@copy_to.id}/assignments/#{@assmt_copy.id}/edit"

      # when locked, the whole menu is removed
      expect(assignment_header).not_to contain_css('.al-trigger')
    end

    it "should show the delete cog-menu options on the edit when not locked" do
      get "/courses/#{@copy_to.id}/assignments/#{@assmt_copy.id}/edit"

      options_button.click
      expect(assignment_header).not_to contain_css('a.delete_assignment_link.disabled')
      expect(assignment_header).to contain_css('a.delete_assignment_link')
    end

    it "should not allow editing of restricted items" do
      # restrict everything
      @tag.update(restrictions: {content: true, points: true, due_dates: true, availability_dates: true})

      get "/courses/#{@copy_to.id}/assignments/#{@assmt_copy.id}/edit"

      expect(f("#assignment_name").tag_name).to eq 'h1'
      expect(f("#assignment_description").tag_name).to eq 'div'
      expect(f("#assignment_points_possible").attribute("readonly")).to eq "true"
      expect(f("#due_at").attribute("readonly")).to eq "true"
      expect(f("#unlock_at").attribute("readonly")).to eq "true"
      expect(f("#lock_at").attribute("readonly")).to eq "true"
    end

    it "should not allow popup editing of restricted items" do
      # restrict everything
      @tag.update(restrictions: {content: true, points: true, due_dates: true, availability_dates: true})

      get "/courses/#{@copy_to.id}/assignments"

      hover_and_click(".edit_assignment")
      expect(f('.ui-dialog-titlebar .ui-dialog-title').text).to eq "Edit Assignment"
      expect(f("#assign_#{@assmt_copy.id}_assignment_name").tag_name).to eq "h3"
      expect(f("#assign_#{@assmt_copy.id}_assignment_due_at").attribute("readonly")).to eq "true"
      expect(f("#assign_#{@assmt_copy.id}_assignment_points").attribute("readonly")).to eq "true"
    end
  end

  context "in the master course" do
    before :once do
      Account.default.enable_feature!(:master_courses)

      @course = course_factory(active_all: true)
      @template = MasterCourses::MasterTemplate.set_as_master_course(@course)
      @assignment = @course.assignments.create!(title: "blah", description: "bloo")
      @tag = @template.create_content_tag_for!(@assignment)
    end

    before :each do
      user_session(@teacher)
    end

    it "should show unlocked button on index page for unlocked assignment" do
      get "/courses/#{@course.id}/assignments"
      expect(f('[data-view="lock-icon"] i.icon-blueprint')).to be_displayed
    end

    it "should show locked button on index page for locked assignment" do
      # restrict something
      @tag.update(restrictions: {content: true})
      get "/courses/#{@course.id}/assignments"
      expect(f('[data-view="lock-icon"] i.icon-blueprint-lock')).to be_displayed
    end

  end
end
