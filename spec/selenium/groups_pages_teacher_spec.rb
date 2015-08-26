require File.expand_path(File.dirname(__FILE__) + '/common')
require File.expand_path(File.dirname(__FILE__) + '/helpers/groups_common')
require File.expand_path(File.dirname(__FILE__) + '/helpers/announcements_common')
require File.expand_path(File.dirname(__FILE__) + '/helpers/discussions_common')
require File.expand_path(File.dirname(__FILE__) + '/helpers/wiki_and_tiny_common')
require File.expand_path(File.dirname(__FILE__) + '/helpers/files_common')
require File.expand_path(File.dirname(__FILE__) + '/helpers/conferences_common')

describe "groups" do
  include_context "in-process server selenium tests"

  setup_group_page_urls

  context "as a teacher" do
    before do
      course_with_teacher_logged_in(active_all: true)
      group_test_setup(4,1,1)
      # adds all students to the group
      add_users_to_group(@students,@testgroup.first)
    end

    describe "announcements page" do
      it "should allow teachers to see announcements", priority: "1", test_id: 287049 do
        @announcement = @testgroup.first.announcements.create!(title: 'Group Announcement', message: 'Group',user: @students.first)
        verify_member_sees_announcement
      end

      it "should allow teachers to create an announcement", priority: "1", test_id: 287050 do
        get announcements_page

        # Checks that initial user can create an announcement
        create_group_announcement_manually("Announcement by #{@teacher.name}",'sup')
        wait_for_ajaximations
        get announcements_page
        expect(ff('.discussion-topic').size).to eq 1
      end
    end

    describe "discussions page" do
      it "should allow teachers to create discussions within a group", priority: "1", test_id: 285586 do
        get discussions_page
        expect_new_page_load { f('#new-discussion-btn').click }
        # This creates the discussion and also tests its creation
        edit_topic('from a teacher', 'tell me a story')
      end

      it "should have three options when creating a discussion", priority: "1", test_id: 285584 do
        get discussions_page
        expect_new_page_load { f('#new-discussion-btn').click }
        expect(f('#threaded')).to be_displayed
        expect(f('#allow_rating')).to be_displayed
        expect(f('#podcast_enabled')).to be_displayed
      end

      it "should allow teachers to access a discussion", priority: "1", test_id: 285585 do
        dt = DiscussionTopic.create!(context: @testgroup.first, user: @students.first,
                                     title: 'Discussion Topic', message: 'hi dudes')
        get discussions_page
        # Verifies teacher can access the group discussion & that it's the correct discussion
        expect_new_page_load { f('.discussion-title').click }
        expect(f('.message.user_content')).to include_text(dt.message)
      end
    end

    describe "pages page" do
      it "should allow teachers to create a page", priority: "1", test_id: 289993 do
        get pages_page
        manually_create_wiki_page('stuff','it happens')
      end

      it "should allow teachers to access a page", priority: "1", test_id: 289992 do
        @page = @testgroup.first.wiki.wiki_pages.create!(title: "Page", user: @students.first)
        # Verifies teacher can access the group page & that it's the correct page
        verify_member_sees_group_page
      end
    end

    describe "Files page" do
      it_behaves_like 'files_page', 'teacher'

      it "should allow teacher to add a new folder", priority: "2", test_id: 303703 do
        get files_page
        add_folder
        expect(ff('.media-body').first.text).to eq 'new folder'
      end

      it "should allow teacher to delete a folder", priority: "2", test_id: 304184 do
        get files_page
        add_folder
        delete(0, :toolbar_menu)
        expect(get_all_files_folders.count).to eq 0
      end

      it "should allow a teacher to delete a file", priority: "2", test_id: 304183 do
        add_test_files
        get files_page
        delete(0, :toolbar_menu)
        wait_for_ajaximations
        expect(get_all_files_folders.count).to eq 0
      end

      it "should allow teachers to move a file", priority: "2", test_id: 304185 do
        add_test_files
        get files_page
        add_folder('destination_folder')
        move_file_to_folder('example.pdf','destination_folder')
      end

      it "should allow teachers to move a folder", priority: "2", test_id: 304667 do
        get files_page
        create_folder_structure
        move_folder(@inner_folder)
      end

      it "should allow teachers to publish and unpublish a file", priority: "2", test_id: 304673 do
        add_test_files
        get files_page
        set_item_permissions(:unpublish,:toolbar_menu)
        expect(f('.btn-link.published-status.unpublished')).to be_displayed
        set_item_permissions(:publish,:toolbar_menu)
        expect(f('.btn-link.published-status.published')).to be_displayed
      end

      it "should allow teachers to restrict access to a file", priority: "2", test_id: 304900 do
        add_test_files
        get files_page
        set_item_permissions(:restricted_access, :available_with_link, :cloud_icon)
        expect(f('.btn-link.published-status.hiddenState')).to be_displayed
      end
    end

    describe "conferences page" do
      before(:all) do
        PluginSetting.create!(name: "wimba", settings: {"domain" => "wimba.instructure.com"})
      end

      it_behaves_like 'conferences_page', 'teacher'
    end
  end
end
