require File.expand_path(File.dirname(__FILE__) + '/common')
require File.expand_path(File.dirname(__FILE__) + '/helpers/wiki_and_tiny_common')

describe "Navigating to wiki pages" do
  include_examples "in-process server selenium tests"

  describe "Navigation" do
    before do
      account_model
      course_with_teacher_logged_in :account => @account
    end

    it "navigates to the wiki pages edit page from the show page" do
      wikiPage = @course.wiki.wiki_pages.create!(:title => "Foo")
      edit_url = edit_course_wiki_page_url(@course, wikiPage)
      get course_wiki_page_path(@course, wikiPage)

      f(".edit-wiki").click

      keep_trying_until { expect(driver.current_url).to eq edit_url }
    end
  end

  describe "Accessibility" do

    def check_header_focus(attribute)
      f("[data-sort-field='#{attribute}']").click()
      wait_for_ajaximations
      check_element_has_focus(f("[data-sort-field='#{attribute}']"))
    end

    before :once do
      account_model
      course_with_teacher :account => @account
      @course.wiki.wiki_pages.create!(:title => "Foo")
      @course.wiki.wiki_pages.create!(:title => "Bar")
      @course.wiki.wiki_pages.create!(:title => "Baz")
    end

    before :each do
      user_session(@user)
    end

    it "returns focus to the header item clicked while sorting" do
      get "/courses/#{@course.id}/pages"

      check_header_focus('title')
      check_header_focus('created_at')
      check_header_focus('updated_at')
    end

    describe "Add Course Button" do
      before :each do
        get "/courses/#{@course.id}/pages"

        driver.execute_script("$('.new_page').focus()")
        @active_element = driver.execute_script('return document.activeElement')
      end

      it "navigates to the add course view when enter is pressed" do
        @active_element.send_keys(:enter)
        wait_for_ajaximations
        check_element_has_focus(f('.edit-header #title'))
      end

      it "navigates to the add course view when spacebar is pressed" do
        @active_element.send_keys(:space)
        wait_for_ajaximations
        check_element_has_focus(f('.edit-header #title'))
      end
    end

    describe "Publish Cloud" do
      it "should set focus back to the publish cloud after unpublish" do
        get "/courses/#{@course.id}/pages"
        f('.publish-icon').click
        wait_for_ajaximations
        check_element_has_focus(f('.publish-icon'))
      end

      it "should set focus back to the publish cloud after publish" do
        get "/courses/#{@course.id}/pages"
        f('.publish-icon').click # unpublish it.
        wait_for_ajaximations
        f('.publish-icon').click # publish it.
        check_element_has_focus(f('.publish-icon'))
      end
    end

    describe "Delete Page" do

      before do
        get "/courses/#{@course.id}/pages"
      end

      it "returns focus back to the item cog if the item was not deleted" do
        f('.al-trigger').click
        f('.delete-menu-item').click
        f('.ui-dialog-buttonset .btn').click
        wait_for_ajaximations
        check_element_has_focus(f('.al-trigger'))
      end

      it "returns focus back to the item cog if escape was pressed" do
        f('.al-trigger').click
        f('.delete-menu-item').click
        f('.ui-dialog-buttonset .btn').send_keys(:escape)
        wait_for_ajaximations
        check_element_has_focus(f('.al-trigger'))
      end

      it "returns focus back to the item cog if the dialog close was pressed" do
        f('.al-trigger').click
        f('.delete-menu-item').click
        f('.ui-dialog-titlebar-close').click
        wait_for_ajaximations
        check_element_has_focus(f('.al-trigger'))
      end

      it "returns focus to the previous item cog if it was deleted" do
        triggers = ff('.al-trigger')
        triggers.last.click
        ff('.delete-menu-item').last.click
        f('.ui-dialog-buttonset .btn-danger').click
        wait_for_ajaximations
        check_element_has_focus(triggers[-2])
      end

      it "returns focus to the + Page button if there are no previous item cogs" do
        f('.al-trigger').click
        f('.delete-menu-item').click
        f('.ui-dialog-buttonset .btn-danger').click
        wait_for_ajaximations
        check_element_has_focus(f('.new_page'))
      end
    end

    describe "Use as Front Page Link" do
      before :each do
        get "/courses/#{@course.id}/pages"
        f('.al-trigger').click
      end

      it "should set focus back to the cog after setting" do
        f('.use-as-front-page-menu-item').click
        wait_for_ajaximations
        check_element_has_focus(f('.al-trigger'))
      end

      it "should set focus to the next focusable item if you press Tab" do
        f('.use-as-front-page-menu-item').send_keys(:tab)
        check_element_has_focus(ff('.wiki-page-link')[1])
      end
    end

    describe "Cog menu" do
      before :each do
        get "/courses/#{@course.id}/pages"
        f('.al-trigger').click
        f('.edit-menu-item').click
      end

      it "should set focus back to the cog menu if you cancel the dialog" do
        f('.ui-dialog-buttonset .btn').click
        check_element_has_focus(f('.al-trigger'))
      end

      it "sets focus back to the cog if you press escape" do
        f('.ui-dialog-buttonset .btn').send_keys(:escape)
        check_element_has_focus(f('.al-trigger'))
      end

      it "sets focus back to the cog if you click the dialog close button" do
        f('.ui-dialog-titlebar-close').click
        check_element_has_focus(f('.al-trigger'))
      end

      it "should return focus to the dialog if you cancel, then reopen the dialog" do
        f('.ui-dialog-titlebar-close').click
        check_element_has_focus(f('.al-trigger'))
        f('.al-trigger').click
        f('.edit-menu-item').click
        wait_for_ajaximations
        check_element_has_focus(ff('.page-edit-dialog .edit-control-text').last)
      end

      it "should set focus back to the cog menu if you edit the title and save" do
        f('.ui-dialog-buttonset .btn-primary').click
        wait_for_ajaximations
        check_element_has_focus(f('.al-trigger'))
      end
    end

    describe "Revisions Page" do
      before :once do
        account_model
        course_with_teacher :account => @account, :active_all => true
        @timestamps = %w(2015-01-01 2015-01-02 2015-01-03).map { |d| Time.zone.parse(d) }

        Timecop.freeze(@timestamps[0]) do      # rev 1
          @vpage = @course.wiki.wiki_pages.build :title => 'bar'
          @vpage.workflow_state = 'unpublished'
          @vpage.body = 'draft'
          @vpage.save!
        end

        Timecop.freeze(@timestamps[1]) do      # rev 2
          @vpage.workflow_state = 'active'
          @vpage.body = 'published by teacher'
          @vpage.user = @teacher
          @vpage.save!
        end

        Timecop.freeze(@timestamps[2]) do      # rev 3
          @vpage.body = 'revised by teacher'
          @vpage.user = @teacher
          @vpage.save!
        end
        @user = @teacher
      end

      before :each do
        user_session(@user)
        get "/courses/#{@course.id}/pages/#{@vpage.url}/revisions"
      end

      it "should let the revisions be focused" do
        driver.execute_script("$('.close-button').focus();")
        f('.close-button').send_keys(:tab)
        all_revisions = ff('.revision')
        all_revisions.each do |revision|
          check_element_has_focus(revision)
          revision.send_keys(:tab)
        end
      end

      it "should focus on the 'restore this revision link' after selecting a revision" do
        driver.execute_script("$('.revision:nth-child(2)').focus();")
        element = fj('.revision:nth-child(2)')
        element.send_keys(:enter)
        wait_for_ajaximations
        element.send_keys(:tab)
        check_element_has_focus(f('.restore-link'))
      end

    end

    describe "Edit Page" do
      before :each do
        get "/courses/#{@course.id}/pages/bar/edit"
        wait_for_ajaximations
      end

      it "should alert user if navigating away from page with unsaved RCE changes", priority: "1", test_id: 267612 do
        add_text_to_tiny("derp")
        f('.home').click()
        expect(driver.switch_to.alert.text).to be_present
        driver.switch_to.alert.accept
      end

      it "should alert user if navigating away from page with unsaved html changes", priority: "1", test_id: 126838 do
        fj('a.switch_views:visible').click()
        f('textarea').send_keys("derp")
        f('.home').click()
        expect(driver.switch_to.alert.text).to be_present
        driver.switch_to.alert.accept
      end

      it "should not save changes when navigating away and not saving", priority: "1", test_id: 267613 do
        fj('a.switch_views:visible').click()
        f('textarea').send_keys('derp')
        f('.home').click()
        expect(driver.switch_to.alert.text).to be_present
        driver.switch_to.alert.accept
        get "/courses/#{@course.id}/pages/bar/edit"
        expect(f('textarea')).not_to include_text('derp')
      end

      it "should alert user if navigating away from page after title change", priority: "1", test_id: 267832 do
        fj('a.switch_views:visible').click()
        f('.title').clear()
        f('.title').send_keys("derpy-title")
        f('.home').click()
        expect(driver.switch_to.alert.text).to be_present
        driver.switch_to.alert.accept
      end
    end

  end

  describe "Show Page" do
    it "shows lock information with prerequisites" do
      account_model
      course_with_student_logged_in account: @account
      foo = @course.wiki.wiki_pages.create! title: "foo"
      bar = @course.wiki.wiki_pages.create! title: "bar"
      mod = @course.context_modules.create! name: "teh_mod", require_sequential_progress: true
      foo_item = mod.add_item id: foo.id, type: 'wiki_page'
      bar_item = mod.add_item id: bar.id, type: 'wiki_page'
      mod.completion_requirements = {foo_item.id => {type: 'must_view'}, bar_item.id => {type: 'must_view'}}
      mod.save!

      get "/courses/#{@course.id}/pages/bar"
      wait_for_ajaximations

      lock_explanation = f('.lock_explanation').text
      expect(lock_explanation).to include "This page is part of the module teh_mod and hasn't been unlocked yet"
      expect(lock_explanation).to match /foo\s+must view the page/
    end
  end

  describe "Permissions" do
    before do
      course_with_teacher
    end

    it "displays public content to unregistered users" do
      Canvas::Plugin.register(:kaltura, nil, :settings => {'partner_id' => 1, 'subpartner_id' => 2, 'kaltura_sis' => '1'})

      @course.is_public = true
      @course.save!

      title = "foo"
      wikiPage = @course.wiki.wiki_pages.create!(:title => title, :body => "bar")

      get "/courses/#{@course.id}/pages/#{title}"
      expect(f('#wiki_page_show')).not_to be_nil
    end
  end

  context "menu tools" do
    before do
      course_with_teacher_logged_in
      Account.default.enable_feature!(:lor_for_account)

      @tool = Account.default.context_external_tools.new(:name => "a", :domain => "google.com", :consumer_key => '12345', :shared_secret => 'secret')
      @tool.wiki_page_menu = {:url => "http://www.example.com", :text => "Export Wiki Page"}
      @tool.save!

      @course.wiki.set_front_page_url!('front-page')
      @wiki_page = @course.wiki.front_page
      @wiki_page.workflow_state = 'active'; @wiki_page.save!
    end

    it "should show tool launch links in the gear for items on the index" do
      get "/courses/#{@course.id}/pages"
      wait_for_ajaximations

      gear = f(".collectionViewItems tr .al-trigger")
      gear.click
      link = f(".collectionViewItems tr li a.menu_tool_link")
      expect(link).to be_displayed
      expect(link.text).to match_ignoring_whitespace(@tool.label_for(:wiki_page_menu))
      expect(link['href']).to eq course_external_tool_url(@course, @tool) + "?launch_type=wiki_page_menu&pages[]=#{@wiki_page.id}"
    end

    it "should show tool launch links in the gear for items on the show page" do
      get "/courses/#{@course.id}/pages/#{@wiki_page.url}"
      wait_for_ajaximations

      gear = f("#wiki_page_show .al-trigger")
      gear.click
      link = f("#wiki_page_show .al-options li a.menu_tool_link")
      expect(link).to be_displayed
      expect(link.text).to match_ignoring_whitespace(@tool.label_for(:wiki_page_menu))
      expect(link['href']).to eq course_external_tool_url(@course, @tool) + "?launch_type=wiki_page_menu&pages[]=#{@wiki_page.id}"
    end
  end
end
