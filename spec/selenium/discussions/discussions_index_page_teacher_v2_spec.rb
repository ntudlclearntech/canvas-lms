#
# Copyright (C) 2014 - present Instructure, Inc.
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

require_relative './pages/discussions_index_page'

describe "discussions index" do
  include_context "in-process server selenium tests"

  context "as a teacher" do
    discussion1_title = 'Meaning of life'
    discussion2_title = 'Meaning of the universe'
    discussion3_title = 'Discussion about landon'
    discussion4_title = 'Discussion about aaron'
    discussion5_title = 'Pinned discussion i want to lock'
    discussion6_title = 'Unpinned discussion i want to unlock'

    before :once do
      @teacher = user_with_pseudonym(active_user: true)
      course_with_teacher(user: @teacher, active_course: true, active_enrollment: true)
      course_with_student(course: @course, active_enrollment: true)
      DiscussionsIndex.set_section_specific_discussions_flag(@course,'on')

      # Discussion attributes: title, message, delayed_post_at, user
      @discussion1 = @course.discussion_topics.create!(
        title: discussion1_title,
        message: 'Is it really 42?',
        user: @teacher,
        pinned: false
      )
      @discussion2 = @course.discussion_topics.create!(
        title: discussion2_title,
        message: 'Could it be 43?',
        delayed_post_at: 1.day.from_now,
        user: @teacher
      )
      @discussion3 = @course.discussion_topics.create!(
        title: discussion3_title,
        message: 'Could it be 43?',
        delayed_post_at: 1.day.from_now,
        user: @teacher,
        locked: false,
        pinned: true
      )
      @discussion4 = @course.discussion_topics.create!(
        title: discussion4_title,
        message: 'Could it be 43?',
        delayed_post_at: 1.day.from_now,
        user: @teacher,
        locked: true,
        pinned: true
      )
      @discussion5 = @course.discussion_topics.create!(
        title: discussion5_title,
        message: 'Could it be 43?',
        delayed_post_at: 1.day.from_now,
        user: @teacher,
        locked: false,
        pinned: true
      )
      @discussion6 = @course.discussion_topics.create!(
        title: discussion6_title,
        message: 'Could it be 43?',
        delayed_post_at: 1.day.from_now,
        user: @teacher,
        locked: true,
        pinned: false
      )
      @discussion1.discussion_entries.create!(user: @student, message: "I think I read that somewhere...")
      @discussion1.discussion_entries.create!(user: @student, message: ":eyeroll:")
    end

    before :each do
      user_session(@teacher)
      DiscussionsIndex.visit(@course)
    end

    it "discussions can be filtered" do
      skip("Add with COMMS-722")
      DiscussionsIndex.select_filter("Unread")
      expect(DiscussionsIndex.announcement(discussion1_title)).to be_displayed
      expect(f('#content')).not_to contain_jqcss(DiscussionsIndex.discussion_title_css(discussion1_title))
    end

    it "search by title works correctly" do
      skip("Add with COMMS-722")
      DiscussionsIndex.enter_search(discussion1_title)
      expect(DiscussionsIndex.announcement(discussion1_title)).to be_displayed
      expect(f('#content')).not_to contain_jqcss(DiscussionsIndex.discussion_title_css(discussion1_title))
    end

    it 'clicking the Add Discussion button redirects to new discussion page' do
      expect_new_page_load { DiscussionsIndex.click_add_discussion }
      expect(driver.current_url).to include(DiscussionsIndex.new_discussion_url)
    end

    it 'clicking the publish botton changes the published status' do
      # Cannot use @discussion[12] here because unpublish requires there to be no posts
      discussion1 = @course.discussion_topics.create!(title: 'foo', message: 'foo', user: @teacher)
      discussion1.save!
      expect(discussion1.published?).to be true

      DiscussionsIndex.visit(@course)
      DiscussionsIndex.click_publish_button('foo')
      wait_for_ajaximations
      discussion1.reload
      expect(discussion1.published?).to be false
    end

    it 'clicking the subscribe botton changes the subscribed status' do
      expect(@discussion1.subscribed? @teacher).to be true
      DiscussionsIndex.click_subscribe_button(discussion1_title)
      wait_for_ajaximations
      expect(@discussion1.subscribed? @teacher).to be false
    end

    it 'discussion can be moved between groups using Pin menu item' do
      DiscussionsIndex.click_pin_menu_option(discussion1_title)
      group = DiscussionsIndex.discussion_group("Pinned Discussions")
      expect(group).to include_text(discussion1_title)
      @discussion1.reload
      expect(@discussion1.pinned).to be true
    end

    it 'unpinning an unlocked discussion goes to the regular bin' do
      DiscussionsIndex.click_pin_menu_option(discussion3_title)
      group = DiscussionsIndex.discussion_group("Discussions")
      expect(group).to include_text(discussion3_title)
      @discussion3.reload
      expect(@discussion3.pinned).to be false
    end

    it 'unpinning a locked discussion goes to the locked bin' do
      DiscussionsIndex.click_pin_menu_option(discussion4_title)
      group = DiscussionsIndex.discussion_group("Closed for Comments")
      expect(group).to include_text(discussion4_title)
      @discussion4.reload
      expect(@discussion4.pinned).to be false
    end

    it 'discussion can be moved to Closed For Comments group using menu item' do
      DiscussionsIndex.click_close_for_comments_menu_option(discussion1_title)
      group = DiscussionsIndex.discussion_group("Closed for Comments")
      expect(group).to include_text(discussion1_title)
      @discussion1.reload
      expect(@discussion1.locked).to be true
    end

    it 'closing a pinned discussion stays pinned' do
      DiscussionsIndex.click_close_for_comments_menu_option(discussion5_title)
      group = DiscussionsIndex.discussion_group("Pinned Discussions")
      expect(group).to include_text(discussion1_title)
      @discussion5.reload
      expect(@discussion5.locked).to be true
    end

    it 'opening an unpinned discussion moves to "regular"' do
      DiscussionsIndex.click_close_for_comments_menu_option(discussion6_title)
      group = DiscussionsIndex.discussion_group("Discussions")
      expect(group).to include_text(discussion1_title)
      @discussion6.reload
      expect(@discussion6.locked).to be false
    end

    it 'clicking the discussion goes to the discussion page' do
      expect_new_page_load { DiscussionsIndex.click_on_discussion(discussion1_title) }
      expect(driver.current_url).to include(DiscussionsIndex.individual_discussion_url(@discussion1))
    end

    it 'a discussion can be deleted by using Delete menu item' do
      skip('Add with COMMS-925')
      DiscussionsIndex.click_delete_menu_option(discussion1_title)
      expect(f('#content')).not_to contain_jqcss(DiscussionsIndex.discussion_title_css(discussion1_title))
      expect(Announcement.where(title: announcement1_title).first.workflow_state).to eq 'deleted'
    end

    it 'a discussion can be duplicated by using Duplicate menu item' do
      DiscussionsIndex.click_duplicate_menu_option(discussion1_title)
      expect(DiscussionsIndex.discussion(discussion1_title + " Copy")).to be_displayed
    end

    it 'pill on announcement displays correct number of unread replies' do
      skip('Add with COMMS-693')
      expect(DiscussionsIndex.discussion_unread_pill(discussion1_title)).to eq "2"
    end

    it "should allow teachers to edit discussions settings" do
      DiscussionsIndex.click_discussion_settings_button
      DiscussionsIndex.click_create_discussions_checkbox
      DiscussionsIndex.submit_discussion_settings
      wait_for_stale_element(".discussion-settings-v2-spinner-container")
      @course.reload
      expect(@course.allow_student_discussion_topics).to eq false
    end
  end
end
