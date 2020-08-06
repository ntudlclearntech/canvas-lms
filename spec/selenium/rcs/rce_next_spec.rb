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

#
# some if the specs in here include "ignore_js_errors: true". This is because
# console errors are emitted for things that aren't really errors, like react
# jsx attribute type warnings
#

require_relative '../helpers/wiki_and_tiny_common'
require_relative 'pages/rce_next_page'

describe 'RCE next tests' do
  include_context 'in-process server selenium tests'
  include WikiAndTinyCommon
  include RCENextPage

  context 'WYSIWYG generic as a teacher' do
    before(:each) do
      course_with_teacher_logged_in
      Account.default.enable_feature!(:rce_enhancements)
      stub_rcs_config
    end

    def create_wiki_page_with_embedded_image(page_title)
      @root_folder = Folder.root_folders(@course).first
      @image = @root_folder.attachments.build(context: @course)
      path = File.expand_path(File.dirname(__FILE__) + '/../../../public/images/email.png')
      @image.uploaded_data = Rack::Test::UploadedFile.new(path, Attachment.mimetype(path))
      @image.save!
      @course.wiki_pages.create!(
        title: page_title, body: "<p><img src=\"/courses/#{@course.id}/files/#{@image.id}"
      )
    end

    def click_embedded_image_for_options
      in_frame tiny_rce_ifr_id do
        f('img').click
      end
    end

    def create_wiki_page_with_content(page_title)
      @root_folder = Folder.root_folders(@course).first
      content = <<-HTML
      <p>
        <table style="border-collapse: collapse; width: 100%;" border="1">
          <tbody>
          <tr>
          <td style="width: 50%;">cell 1</td>
          <td style="width: 50%;">cell 2</td>
          </tr>
          </tbody>
        </table>
      </p><p>
        <a class="instructure_file_link" title="Link"
        href="/files/719/download"
        target="_blank" rel="noopener noreferrer">a.html</a>
      </p>
      HTML
      @course.wiki_pages.create!(title: page_title, body: content)
    end

    it 'should click on sidebar wiki page to create link in body', ignore_js_errors: true do
      title = 'test_page'
      unpublished = false
      edit_roles = 'public'

      create_wiki_page(title, unpublished, edit_roles)

      visit_front_page_edit(@course)
      wait_for_tiny(edit_wiki_css)

      click_links_toolbar_button
      click_course_links

      click_pages_accordion
      click_course_item_link(title)

      in_frame rce_page_body_ifr_id do
        expect(wiki_body_anchor.attribute('title')).to include title
        expect(wiki_body_anchor.text).to eq title
      end
    end

    context 'links' do
      it 'should respect selected text when creating a course link in body',
         ignore_js_errors: true do
        title = 'test_page'
        unpublished = false
        edit_roles = 'public'

        create_wiki_page(title, unpublished, edit_roles)

        visit_front_page_edit(@course)
        wait_for_tiny(edit_wiki_css)
        insert_tiny_text('select me')

        select_all_in_tiny(f('#wiki_page_body'))

        click_links_toolbar_button
        click_course_links

        click_pages_accordion
        click_course_item_link(title)

        in_frame rce_page_body_ifr_id do
          expect(wiki_body_anchor.attribute('title')).to include title
          expect(wiki_body_anchor.text).to eq 'select me'
        end
      end

      it 'should respect selected text when creating an external link in body',
         ignore_js_errors: true do
        title = 'test_page'
        unpublished = false
        edit_roles = 'public'

        create_wiki_page(title, unpublished, edit_roles)

        visit_front_page_edit(@course)
        wait_for_tiny(edit_wiki_css)
        insert_tiny_text('select me')

        select_all_in_tiny(f('#wiki_page_body'))

        create_external_link(nil, 'http://example.com/')

        in_frame rce_page_body_ifr_id do
          expect(wiki_body_anchor.attribute('href')).to eq 'http://example.com/'
          expect(wiki_body_anchor.text).to eq 'select me'
        end
      end

      it 'should update selected text when creating an external link in body',
         ignore_js_errors: true do
        title = 'test_page'
        unpublished = false
        edit_roles = 'public'

        create_wiki_page(title, unpublished, edit_roles)

        visit_front_page_edit(@course)
        wait_for_tiny(edit_wiki_css)
        insert_tiny_text('select me')

        select_all_in_tiny(f('#wiki_page_body'))

        create_external_link('click me', 'http://example.com/')

        in_frame rce_page_body_ifr_id do
          expect(wiki_body_anchor.attribute('href')).to eq 'http://example.com/'
          expect(wiki_body_anchor.text).to eq 'click me'
        end
      end

      it 'should update the text when editing a link' do
        title = 'test_page'
        unpublished = false
        edit_roles = 'public'

        create_wiki_page(title, unpublished, edit_roles)

        visit_front_page_edit(@course)
        wait_for_tiny(edit_wiki_css)

        switch_to_html_view
        html_view = f('textarea#wiki_page_body')
        html_view.send_keys('<a href="http://example.com">edit me</a>')
        switch_to_editor_view

        click_link_for_options
        click_link_options_button

        expect(link_options_tray).to be_displayed

        link_text_textbox = f('input[type="text"][value="edit me"]')
        link_text_textbox.send_keys(' please')
        click_link_options_done_button

        in_frame rce_page_body_ifr_id do
          expect(wiki_body_anchor.text).to eq 'edit me please'
        end
      end

      it "deletes the <a> when it's text is deleted" do
        skip('Nothing I do with webdriver deletes the link, it just unseleccts the text')
        @course.wiki_pages.create!(
          title: 'title',
          body: "<p id='para'><a id='lnk' href='http://example.com'>delete me</a></p>"
        )
        visit_existing_wiki_edit(@course, 'title')
        wait_for_tiny(edit_wiki_css)

        f("##{rce_page_body_ifr_id}").click
        driver.execute_script <<-JS
          window.selectLink = function() {
            const win = document.querySelector('iframe.tox-edit-area__iframe').contentWindow
            const rng = win.document.createRange()
            rng.setStart(win.document.getElementById('lnk').firstChild, 0)
            rng.setEnd(win.document.getElementById('lnk').firstChild, 9)
            const sel = win.getSelection()
            sel.removeAllRanges()
            sel.addRange(rng)
          }
          selectLink()
        JS

        # f("##{rce_page_body_ifr_id}").send_keys(:delete) --> didn't work
        in_frame rce_page_body_ifr_id do
          # f('body').send_keys(:delete) --> didn't work
          f('#lnk').send_keys(:delete)
          expect(f('#para').text).to eql ''
        end
      end

      it 'should not magically create youtube video preview on a link', ignore_js_errors: true do
        title = 'test_page'
        unpublished = false
        edit_roles = 'public'

        create_wiki_page(title, unpublished, edit_roles)

        visit_front_page_edit(@course)
        wait_for_tiny(edit_wiki_css)

        create_external_link('youtube', 'https://youtu.be/17oCQakzIl8')

        in_frame rce_page_body_ifr_id do
          expect(wiki_body_anchor.attribute('class')).not_to include 'youtube_link_to_box'
          expect(wiki_body_anchor.attribute('class')).to include 'inline_disabled'
        end
      end
    end

    it 'should click on sidebar assignment page to create link in body' do
      title = 'Assignment-Title'
      @assignment = @course.assignments.create!(name: title)

      visit_front_page_edit(@course)

      click_links_toolbar_button
      click_course_links

      click_assignments_accordion
      click_course_item_link(title)

      in_frame rce_page_body_ifr_id do
        expect(wiki_body_anchor.attribute('href')).to include assignment_id_path(
                  @course,
                  @assignment
                )
      end
    end

    it 'should click on sidebar quizzes page to create link in body' do
      title = 'Quiz-Title'
      @quiz = @course.quizzes.create!(workflow_state: 'available', title: title)

      visit_front_page_edit(@course)

      click_links_toolbar_button
      click_course_links

      click_quizzes_accordion
      click_course_item_link(title)

      in_frame rce_page_body_ifr_id do
        expect(wiki_body_anchor.attribute('href')).to include quiz_id_path(@course, @quiz)
      end
    end

    it 'should click on sidebar announcements page to create link in body' do
      title = 'Announcement-Title'
      message = 'Announcement 1 detail'
      @announcement = @course.announcements.create!(title: title, message: message)

      visit_front_page_edit(@course)

      click_links_toolbar_button
      click_course_links

      click_announcements_accordion
      click_course_item_link(title)

      in_frame rce_page_body_ifr_id do
        expect(wiki_body_anchor.attribute('href')).to include announcement_id_path(
                  @course,
                  @announcement
                )
      end
    end

    it 'should click on sidebar discussions page to create link in body' do
      title = 'Discussion-Title'
      @discussion = @course.discussion_topics.create!(title: title)

      visit_front_page_edit(@course)

      click_links_toolbar_button
      click_course_links

      click_discussions_accordion
      click_course_item_link(title)

      in_frame rce_page_body_ifr_id do
        expect(wiki_body_anchor.attribute('href')).to include discussion_id_path(
                  @course,
                  @discussion
                )
      end
    end

    it 'should click on sidebar modules page to create link in body', ignore_js_errors: true do
      title = 'Module-Title'
      @module = @course.context_modules.create!(name: title)

      visit_front_page_edit(@course)

      click_links_toolbar_button
      click_course_links

      click_modules_accordion
      click_course_item_link(title)

      in_frame rce_page_body_ifr_id do
        expect(wiki_body_anchor.attribute('href')).to include module_id_path(@course, @module)
      end
    end

    it 'should click on sidebar course navigation page to create link in body',
       ignore_js_errors: true do
      title = 'Files'
      visit_front_page_edit(@course)

      click_links_toolbar_button
      click_course_links

      click_navigation_accordion
      click_course_item_link(title)

      in_frame rce_page_body_ifr_id do
        expect(wiki_body_anchor.attribute('href')).to include course_file_path(@course)
      end
    end

    it 'should click on assignment in sidebar to create link to it in announcement page',
       ignore_js_errors: true do
      title = 'Assignment-Title'
      @assignment = @course.assignments.create!(name: title)

      visit_new_announcement_page(@course)

      click_links_toolbar_button
      click_course_links

      click_assignments_accordion
      click_course_item_link(title)

      in_frame rce_page_body_ifr_id do
        expect(wiki_body_anchor.attribute('href')).to include assignment_id_path(
                  @course,
                  @assignment
                )
      end
    end

    it 'should click on module in sidebar to create link to it in assignment page',
       ignore_js_errors: true do
      title = 'Module-Title'
      @module = @course.context_modules.create!(name: title)

      visit_new_assignment_page(@course)

      click_links_toolbar_button
      click_course_links

      click_modules_accordion
      click_course_item_link(title)

      in_frame rce_page_body_ifr_id do
        expect(wiki_body_anchor.attribute('href')).to include module_id_path(@course, @module)
      end
    end

    it 'should click on assignment in sidebar to create link to it in discussion page' do
      title = 'Assignment-Title'
      @assignment = @course.assignments.create!(name: title)

      visit_new_discussion_page(@course)

      click_links_toolbar_button
      click_course_links

      click_assignments_accordion
      click_course_item_link(title)

      in_frame rce_page_body_ifr_id do
        expect(wiki_body_anchor.attribute('href')).to include assignment_id_path(
                  @course,
                  @assignment
                )
      end
    end

    it 'should click on assignment in sidebar to create link to it in quiz page' do
      title = 'Assignment-Title'
      @assignment = @course.assignments.create!(name: title)
      @quiz = @course.quizzes.create!

      visit_new_quiz_page(@course, @quiz)

      click_links_toolbar_button
      click_course_links

      click_assignments_accordion
      click_course_item_link(title)

      in_frame rce_page_body_ifr_id do
        expect(wiki_body_anchor.attribute('href')).to include assignment_id_path(
                  @course,
                  @assignment
                )
      end
    end

    it 'should click on assignment in sidebar to create link to it in syllabus page' do
      title = 'Assignment-Title'
      @assignment = @course.assignments.create!(name: title)

      visit_syllabus(@course)
      click_edit_syllabus

      click_links_toolbar_button
      click_course_links

      click_assignments_accordion
      click_course_item_link(title)

      in_frame rce_page_body_ifr_id do
        expect(wiki_body_anchor.attribute('href')).to include assignment_id_path(
                  @course,
                  @assignment
                )
      end
    end

    it 'should click on sidebar images tab' do
      skip('Unskip in CORE-2629')
      visit_front_page_edit(@course)

      click_images_toolbar_button
      click_course_images

      expect(upload_new_image).to be_displayed
    end

    it 'should click on an image in sidebar to display in body', ignore_js_errors: true do
      title = 'email.png'
      @root_folder = Folder.root_folders(@course).first
      @image = @root_folder.attachments.build(context: @course)
      path = File.expand_path(File.dirname(__FILE__) + '/../../../public/images/email.png')
      @image.uploaded_data = Rack::Test::UploadedFile.new(path, Attachment.mimetype(path))
      @image.save!

      visit_front_page_edit(@course)

      click_images_toolbar_button
      click_course_images

      click_image_link(title)

      in_frame tiny_rce_ifr_id do
        expect(wiki_body_image.attribute('src')).to include course_file_id_path(@image)
      end
    end

    it 'should open tray when clicking options button on existing image' do
      page_title = 'Page1'
      create_wiki_page_with_embedded_image(page_title)

      visit_existing_wiki_edit(@course, page_title)

      click_embedded_image_for_options
      click_image_options_button

      expect(image_options_tray).to be_displayed
    end

    it 'should change embedded image to link when selecting option' do
      page_title = 'Page1'
      create_wiki_page_with_embedded_image(page_title)

      visit_existing_wiki_edit(@course, page_title)

      click_embedded_image_for_options
      click_image_options_button

      click_display_text_link_option
      click_image_options_done_button

      in_frame tiny_rce_ifr_id do
        expect(wiki_body_anchor).not_to contain_css('src')
      end
    end

    it 'should add alt text to image using options tray' do
      alt_text = 'fear is the mindkiller'
      page_title = 'Page1'
      create_wiki_page_with_embedded_image(page_title)

      visit_existing_wiki_edit(@course, page_title)

      click_embedded_image_for_options
      click_image_options_button

      alt_text_textbox.send_keys(alt_text)
      click_image_options_done_button

      in_frame rce_page_body_ifr_id do
        expect(wiki_body_image.attribute('alt')).to include alt_text
      end
    end

    it 'should guarantees an alt text when selecting decorative' do
      page_title = 'Page1'
      create_wiki_page_with_embedded_image(page_title)

      visit_existing_wiki_edit(@course, page_title)

      click_embedded_image_for_options
      click_image_options_button

      click_decorative_options_checkbox
      click_image_options_done_button

      in_frame rce_page_body_ifr_id do
        expect(wiki_body_image.attribute('alt')).to eq(' ')
        expect(wiki_body_image.attribute('role')).to eq('presentation')
      end
    end

    it 'should display assignment publish status in links accordion' do
      skip('Unskip in CORE-2619')
      title = 'Assignment-Title'
      @assignment = @course.assignments.create!(name: title, status: published)

      visit_new_announcement_page(@course)

      click_links_toolbar_button
      click_course_links
      click_assignments_accordion

      expect(assignment_published_status).to be_displayed

      @assignment.save!(status: unpublished)
      visit_new_announcement_page(@course)

      click_links_toolbar_button
      click_course_links
      click_assignments_accordion

      expect(assignment_unpublished_status).to be_displayed
    end

    it 'should click on a document in sidebar to display in body' do
      title = 'text_file.txt'
      @root_folder = Folder.root_folders(@course).first
      @text_file =
        @root_folder.attachments.create!(filename: 'text_file.txt', context: @course) do |a|
          a.content_type = 'text/plain'
        end

      visit_front_page_edit(@course)

      click_document_toolbar_button
      click_course_documents

      click_document_link(title)

      in_frame tiny_rce_ifr_id do
        expect(wiki_body_anchor.attribute('href')).to include course_file_id_path(@text_file)
      end
    end

    it 'should display assignment due date in links accordion' do
      skip('Unskip in CORE-2619')
      title = 'Assignment-Title'
      due_at = 3.days.from_now
      @assignment = @course.assignments.create!(name: title, status: published, due_at: @due_at)

      visit_new_announcement_page

      click_links_toolbar_button
      click_course_links
      click_assignments_accordion

      expect(assignment_due_date).to eq date_string(due_at, :no_words)
    end

    it 'should open a11y checker when clicking button in status bar' do
      visit_front_page_edit(@course)

      click_a11y_checker_button

      expect(a11y_checker_tray).to be_displayed
    end

    it 'should open keyboard shortcut modal when clicking button in status bar' do
      visit_front_page_edit(@course)

      click_visible_keyboard_shortcut_button

      expect(keyboard_shortcut_modal).to be_displayed
    end

    it 'should close the course links tray when pressing esc', ignore_js_errors: true do
      skip('Unskip in CORE-2878')
      visit_front_page_edit(@course)

      click_links_toolbar_button
      click_course_links
      wait_for_tiny(edit_wiki_css)

      driver.action.send_keys(:escape).perform

      expect(tray_container).not_to be_displayed # Press esc key
    end

    it 'should close the course images tray when pressing esc', ignore_js_errors: true do
      skip('Unskip in CORE-2878')
      visit_front_page_edit(@course)

      click_images_toolbar_button
      click_course_images
      wait_for_tiny(edit_wiki_css)

      driver.action.send_keys(:escape).perform

      expect(tray_container).not_to be_displayed # Press esc key
    end

    it 'should open upload image modal when clicking upload option' do
      visit_front_page_edit(@course)

      click_images_toolbar_button
      click_upload_image

      expect(upload_image_modal).to be_displayed
    end

    it 'should open upload media modal when clicking upload option' do
      skip('Unskip after adding upload option back COREFE-268')
      visit_front_page_edit(@course)

      click_media_toolbar_button
      click_upload_media

      expect(upload_media_modal).to be_displayed
    end

    it 'should open upload document modal when clicking upload option' do
      visit_front_page_edit(@course)

      click_document_toolbar_button
      click_upload_document

      expect(upload_document_modal).to be_displayed
    end

    it 'should include media upload option if kaltura is enabled' do
      double('CanvasKaltura::ClientV3')
      allow(CanvasKaltura::ClientV3).to receive(:config).and_return({})
      visit_front_page_edit(@course)
      media_button = media_toolbar_button
      media_button.click
      wait_for_animations
      menu_id = media_button.attribute('aria-owns')
      expect(menu_item_by_menu_id(menu_id, 'Upload/Record Media')).to be_displayed
      expect(menu_item_by_menu_id(menu_id, 'Course Media')).to be_displayed
      expect(menu_item_by_menu_id(menu_id, 'User Media')).to be_displayed
      expect(menu_items_by_menu_id(menu_id).length).to be(3)
    end

    it 'should not include media upload option if kaltura is disabled' do
      double('CanvasKaltura::ClientV3')
      allow(CanvasKaltura::ClientV3).to receive(:config).and_return(nil)
      visit_front_page_edit(@course)
      media_button = media_toolbar_button
      media_button.click
      wait_for_animations
      menu_id = media_button.attribute('aria-owns')
      expect(menu_item_by_menu_id(menu_id, 'Course Media')).to be_displayed
      expect(menu_item_by_menu_id(menu_id, 'User Media')).to be_displayed
      expect(menu_items_by_menu_id(menu_id).length).to be(2)
    end

    it 'should not include media upload option if button is disabled' do
      double('CanvasKaltura::ClientV3')
      allow(CanvasKaltura::ClientV3).to receive(:config).and_return({ 'hide_rte_button' => true })
      visit_front_page_edit(@course)
      media_button = media_toolbar_button
      media_button.click
      wait_for_animations
      menu_id = media_button.attribute('aria-owns')
      expect(menu_item_by_menu_id(menu_id, 'Course Media')).to be_displayed
      expect(menu_item_by_menu_id(menu_id, 'User Media')).to be_displayed
      expect(menu_items_by_menu_id(menu_id).length).to be(2)
    end

    it 'should close sidebar after drag and drop' do
      skip('kills many selenium tests. Address in CORE-3147')
      title = 'Assignment-Title'
      @assignment = @course.assignments.create!(name: title)

      visit_front_page_edit(@course)

      click_links_toolbar_button
      click_course_links
      click_assignments_accordion

      source = course_item_link(title)
      dest = f('iframe.tox-edit-area__iframe')
      driver.action.drag_and_drop(source, dest).perform

      expect(f('body')).not_to contain_css('[data-testid="CanvasContentTray"]')
    end

    it 'should add a title attribute to an inserted iframe' do
      # as typically happens when embedding media, like a youtube video
      double('CanvasKaltura::ClientV3')
      allow(CanvasKaltura::ClientV3).to receive(:config).and_return({})
      visit_front_page_edit(@course)

      click_media_toolbar_button
      click_upload_media
      click_embed_media_tab
      code_box = embed_code_textarea
      code_box.click
      code_box.send_keys('<iframe src="https://example.com/"></iframe>')
      click_upload_media_submit_button
      wait_for_animations

      fj('button:contains("Save")').click
      wait_for_ajaximations

      expect(f('iframe[title="embedded content"][src="https://example.com/"]')).to be_displayed # save the page
    end

    describe 'keyboard shortcuts' do
      it 'should open keyboard shortcut modal with alt-f8' do
        visit_front_page_edit(@course)
        rce = f('.tox-edit-area__iframe')
        rce.send_keys %i[alt f8]

        expect(keyboard_shortcut_modal).to be_displayed
      end

      it 'should focus the menubar with alt-f9' do
        visit_front_page_edit(@course)
        rce = f('.tox-edit-area__iframe')
        expect(f('.tox-menubar')).to be_displayed # always show menubar now
        rce.send_keys %i[alt f9]

        expect(f('.tox-menubar')).to be_displayed
        expect(fj('.tox-menubar button:contains("Edit")')).to eq(driver.switch_to.active_element)
      end

      it 'should focus the toolbar with alt-f10' do
        visit_front_page_edit(@course)
        rce = f('.tox-edit-area__iframe')
        rce.send_keys %i[alt f10]

        expect(fj('.tox-toolbar__primary button:contains("12pt")')).to eq(
          driver.switch_to.active_element
        )
      end

      it 'should focus table context toolbar with ctrl-f9' do
        page_title = 'Page-with-table'
        create_wiki_page_with_content(page_title)

        visit_existing_wiki_edit(@course, page_title)
        driver.switch_to.frame('wiki_page_body_ifr')
        f('table td').click
        driver.action.key_down(:control).send_keys(:f9).key_up(:control).perform

        driver.switch_to.default_content
        expect(f('.tox-pop__dialog button[title="Table properties"]')).to eq(
          driver.switch_to.active_element
        ) # put the cursor in the table
      end

      it 'should focus course file link context toolbar with ctrl-f9' do
        page_title = 'Page-with-link'
        create_wiki_page_with_content(page_title)

        visit_existing_wiki_edit(@course, page_title)
        driver.switch_to.frame('wiki_page_body_ifr')
        f('a').click
        driver.action.key_down(:control).send_keys(:f9).key_up(:control).perform

        driver.switch_to.default_content
        expect(f('.tox-pop__dialog button[title="Show link options"]')).to eq(
          driver.switch_to.active_element
        ) # put the cursor in the table
      end
    end

    describe 'lti tool integration' do
      before(:each) do
        # set up the lti tool
        @tool =
          Account.default.context_external_tools.new(
            {
              name: 'Commons',
              domain: 'canvaslms.com',
              consumer_key: '12345',
              shared_secret: 'secret',
              is_rce_favorite: 'true'
            }
          )
        @tool.set_extension_setting(
          :editor_button,
          {
            message_type: 'ContentItemSelectionRequest',
            url: 'http://www.example.com',
            icon_url: 'https://lor.instructure.com/img/icon_commons.png',
            text: 'Commons Favorites',
            enabled: 'true',
            use_tray: 'true',
            favorite: 'true'
          }
        )
        @tool.save!
      end

      it 'should display lti icon with a tool enabled for the course', ignore_js_errors: true do
        page_title = 'Page1'
        create_wiki_page_with_embedded_image(page_title)

        visit_existing_wiki_edit(@course, page_title)

        expect(lti_tools_button).to be_displayed
      end

      it 'should display the lti tool modal', ignore_js_errors: true do
        page_title = 'Page1'
        create_wiki_page_with_embedded_image(page_title)

        visit_existing_wiki_edit(@course, page_title)
        lti_tools_button.click

        expect(lti_tools_modal).to be_displayed
      end

      it 'should show favorited LTI tool icon when a tool is favorited', ignore_js_errors: true do
        page_title = 'Page1'
        create_wiki_page_with_embedded_image(page_title)

        visit_existing_wiki_edit(@course, page_title)

        expect(lti_favorite_button).to be_displayed
      end

      it 'should display the favorited lti tool modal', ignore_js_errors: true do
        page_title = 'Page1'
        create_wiki_page_with_embedded_image(page_title)

        visit_existing_wiki_edit(@course, page_title)
        lti_favorite_button.click

        expect(lti_favorite_modal).to be_displayed
      end
    end
  end
end
