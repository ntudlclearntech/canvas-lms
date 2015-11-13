require File.expand_path(File.dirname(__FILE__) + '/../common')

module FilesCommon
  # This method adds the specified file to the course
  # Params:
  # - fixture: location of the file to be uploaded
  # - context: course in which file would be uploaded
  # - name: file name
  def add_file(fixture, context, name)
    context.attachments.create! do |attachment|
      attachment.uploaded_data = fixture
      attachment.filename = name
      attachment.folder = Folder.root_folders(context).first
    end
  end

  # This method downloads the file from top toolbar in New Files
  def download_from_toolbar(row_selected = 0)
    ff('.ef-item-row')[row_selected].click
    f('.btn-download').click
  end

  # This method downloads the file using the Download option on Cog menu button
  def download_from_cog_icon(row_selected = 0)
    ff('.al-trigger')[row_selected].click
    ff('.al-options .ui-menu-item')[0].click
  end

  def edit_name_from_cog_icon(file_name_new, row_selected = 0)
    ff('.al-trigger-gray')[row_selected].click
    fln("Rename").click
    expect(f(".ef-edit-name-cancel")).to be_displayed
    file_name_textbox_el = f('.input-block-level')
    replace_content(file_name_textbox_el, file_name_new)
    file_name_textbox_el.send_keys(:return)
  end

  # This method downloads the file from the file preview
  def download_from_preview
    fln("example.pdf").click
    f('.icon-download').click
  end

  def delete(row_selected = 0, delete_using = :cog_icon)
    if delete_using == :cog_icon
      ff('.al-trigger')[row_selected].click
      fln("Delete").click
    elsif delete_using == :toolbar_menu
      ff('.ef-item-row')[row_selected].click
      f('.btn-delete').click
    end
    confirm_delete_on_dialog
  end

  def move(file_name, row_selected = 0, move_using = :cog_icon, destination = nil)
    if move_using == :cog_icon
      ff('.al-trigger')[row_selected].click
      fln("Move").click
    elsif move_using == :toolbar_menu
      ff('.ef-item-row')[row_selected].click
      f('.btn-move').click
    end
    wait_for_ajaximations
    expect(f(".ReactModal__Header-Title h4").text).to eq "Where would you like to move #{file_name}?"
    if destination.present?
      folders = destination.split('/')
      folders.each do |folder|
        fj(".ReactModal__Body .treeLabel span:contains('#{folder}')").click
      end
    else
      ff(".treeLabel span")[3].click
    end
    driver.action.send_keys(:return).perform
    wait_for_ajaximations
    ff(".btn-primary")[1].click
  end

  def move_multiple_using_toolbar(files = [])
    files.each do |file_name|
      file = driver.find_element(xpath: "//span[contains(text(), '#{file_name}') and @class='media-body']")
                   .find_element(xpath: "../..")
      driver.action.key_down(:control).click(file).key_up(:control).perform
    end
    wait_for_ajaximations
    f('.btn-move').click
    wait_for_ajaximations
    expect(f(".ReactModal__Header-Title h4").text).to eq "Where would you like to move these #{files.count} items?"
    ff(".treeLabel span")[3].click
    driver.action.send_keys(:return).perform
    wait_for_ajaximations
    ff(".btn-primary")[1].click
  end

  # This method sets permissions on files/folders
  def set_item_permissions(permission_type = :publish, restricted_access_option = nil, set_permissions_from = :cloud_icon)
    if set_permissions_from == :cloud_icon
      f('.btn-link.published-status').click
    elsif set_permissions_from == :toolbar_menu
      ff('.ef-item-row')[0].click
      f('.btn-restrict').click
    end
    wait_for_ajaximations
    if permission_type == :publish
      driver.find_elements(:name, 'permissions')[0].click
    elsif permission_type == :unpublish
      driver.find_elements(:name, 'permissions')[1].click
    else
      driver.find_elements(:name, 'permissions')[2].click
      if restricted_access_option == :available_with_link
        driver.find_elements(:name, 'restrict_options')[0].click
      else
        driver.find_elements(:name, 'restrict_options')[1].click
        ff('.ui-datepicker-trigger.btn')[0].click
        fln("15").click
        ff('.ui-datepicker-trigger.btn')[1].click
        fln("25").click
      end
    end
    ff('.btn.btn-primary')[1].click
  end

  def should_make_folders_in_the_menu_droppable
    course_with_teacher_logged_in
    get "/files"
    wait_for_ajaximations
    keep_trying_until do
      f(".add_folder_link").click
      wait_for_ajaximations
      expect(f("#files_content .add_folder_form #folder_name")).to be_displayed
    end
    f("#files_content .add_folder_form #folder_name").send_keys("my folder\n")
    wait_for_ajaximations
    expect(f(".node.folder span")).to have_class('ui-droppable')

    # also make sure that it has a tooltip of the file name so that you can read really long names
    expect(f(".node.folder .name[title='my folder']")).not_to be_nil
  end

  def should_show_students_link_to_download_zip_of_folder
    course_with_student_logged_in
    get "/courses/#{@course.id}/files"
    link = keep_trying_until do
      link = f(".links a.download_zip_link")
      wait_for_ajaximations
      expect(link).to be_displayed
      link
    end
    expect(link.attribute('href')).to match(%r"/courses/#{@course.id}/folders/\d+/download")
  end

  def unzip_from_form_to_folder
      @folder = folder = Folder.root_folders(@context).first

      upload_file = lambda do |refresh|
        get @files_url
        if !refresh
          expect_new_page_load { f('a.upload_zip_link').click }
          expect(URI.parse(driver.current_url).path).to eq @files_import_url
        else
          refresh_page
        end
        _filename, path, _data, _file = get_file('attachments.zip')
        expect(first_selected_option(f('#upload_to select'))).to have_value(@folder.id.to_s)
        f('input#zip_file').send_keys(path)
        submit_form('#zip_file_import_form')
        zfi = keep_trying_until { ZipFileImport.order(:id).last }
        expect(zfi.context).to eq @context
        expect(zfi.folder).to eq @folder
        expect(f('.ui-dialog-title')).to include_text('Uploading, Please Wait.') # verify it's visible
        job = Delayed::Job.order(:id).last
        expect(job.tag).to eq 'ZipFileImport#process_without_send_later'
        run_job(job)
        upload_file.call(true) if refresh != true && flash_message_present?(:error)
        zfi
      end
      zfi = upload_file.call(false)
      keep_trying_until { URI.parse(driver.current_url).path == @files_url }
      expect(zfi.reload.state).to eq :imported
      expect(@folder.attachments.active.map(&:display_name)).to eq ["first_entry.txt"]
      expect(@folder.sub_folders.active.count).to eq 1
      sub = folder.sub_folders.active.first
      expect(sub.name).to eq "adir"
      expect(sub.attachments.active.map(&:display_name)).to eq ["second_entry.txt"]
  end

  def unzip_into_folder_drag_and_drop
      # we can't actually drag a file into the browser from selenium, so we have
      # to mock some of the process
      folder = Folder.root_folders(@context).first
      keep_trying_until { expect(f('#files_content .message.no_content')).to be_nil }
      filename, path, data, file = get_file('attachments.zip')
      # the drop event that we're mocking requires an actual JS File object,
      # which can't be created through javascript. so we add a file input field
      # to the page so we can enter the file path, and then pull the data from
      # that.
      driver.execute_script(%{$("<input/>").attr({type:'file',id:'mock-file-data'}).appendTo('body');})
      f('#mock-file-data').send_keys(path)
      driver.execute_script(%{$("#files_content").trigger($.Event("drop", { originalEvent: { dataTransfer: { files: $('#mock-file-data')[0].files } } }));})
      confirm_dialog = driver.switch_to.alert
      confirm_dialog.accept
      wait_for_ajax_requests
      zfi = keep_trying_until { ZipFileImport.order(:id).last }
      expect(zfi.context).to eq @context
      expect(zfi.folder).to eq folder
      expect(f('.ui-dialog-title')).to include_text('Extracting Files into Folder') # verify it's visible
      job = Delayed::Job.order(:id).last
      expect(job.tag).to eq 'ZipFileImport#process_without_send_later'
      run_job(job)
      keep_trying_until { expect(f('#uploading_please_wait_dialog')).to be_nil } # wait until it's no longer visible
      expect(zfi.reload.state).to eq :imported
      expect(folder.attachments.active.map(&:display_name)).to eq ["first_entry.txt"]
      expect(folder.sub_folders.active.count).to eq 1
      sub = folder.sub_folders.active.first
      expect(sub.name).to eq "adir"
      expect(sub.attachments.active.map(&:display_name)).to eq ["second_entry.txt"]
  end

  def confirm_delete_on_dialog
    driver.switch_to.alert.accept
    wait_for_ajaximations
  end

  def cancel_delete_on_dialog
    driver.switch_to.alert.dismiss
    wait_for_ajaximations
  end

  def add_folder(name = 'new folder')
    click_new_folder_button
    new_folder = f("input.input-block-level")
    new_folder.send_keys(name)
    new_folder.send_keys(:return)
    wait_for_ajaximations
  end

  def click_new_folder_button
    keep_trying_until do
      f(".btn-add-folder").click
      wait_for_ajaximations
    end
  end

  def create_new_folder
    f('.btn-add-folder').click
    f('.ef-edit-name-form').submit
    wait_for_ajaximations
    all_files_folders.first
  end

  def all_files_folders
    driver.find_elements(:class, 'ef-item-row')
  end

  def insert_file_from_rce(insert_into = nil)
    if insert_into == :quiz
      ff(".ui-tabs-anchor")[6].click
    else
      ff(".ui-tabs-anchor")[1].click
    end
    ff(".name.text")[0].click
    ff(".name.text")[1].click
    wait_for_ajaximations
    ff(".name.text")[2].click
    wait_for_ajaximations
    if insert_into == :quiz
      ff(".name.text")[3].click
      ff(".btn-primary")[3].click
    elsif insert_into == :discussion
      ff(".btn-primary")[2].click
    else
      f(".btn-primary").click
    end
    wait_for_ajaximations
    expect(fln("some test file")).to be_displayed
  end

  def notorious_set_values
    make_full_screen
    fln("Kaltura").click
    wait_for_ajaximations
    f('#plugin_setting_disabled').click
    wait_for_ajaximations
    f('#settings_domain').send_keys 'nv-beta.instructuremedia.com'
    f('#settings_resource_domain').send_keys 'nv-beta.instructuremedia.com'
    f('#settings_rtmp_domain').send_keys 'fms-beta.instructuremedia.com'
    f('#settings_partner_id').send_keys '2'
    f('#settings_subpartner_id').send_keys '0'
    f('#settings_secret_key').send_keys 'adminsekrit'
    f('#settings_user_secret_key').send_keys 'usersekrit'
    f('#settings_player_ui_conf').send_keys '0'
    f('#settings_kcw_ui_conf').send_keys '0'
    f('#settings_upload_ui_conf').send_keys '0'
    f('#settings_js_uploader').click
    f('.save_button').click
  end
end