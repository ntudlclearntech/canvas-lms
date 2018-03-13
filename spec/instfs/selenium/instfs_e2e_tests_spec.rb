#
# Copyright (C) 2012 - present Instructure, Inc.
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

require File.expand_path(File.dirname(__FILE__) + '/../../selenium/common')
require_relative '../../selenium/helpers/files_common'
require_relative '../../apis/api_spec_helper'
require_relative '../../selenium/helpers/eportfolios_common'
require_relative '../../../gems/canvas_http/lib/canvas_http'

describe "instfs file uploads" do
  include_context "in-process server selenium tests"
  include FilesCommon
  include Helpers
  include EportfoliosCommon
  include CanvasHttp
  let(:admin_guy) {account_admin_user(account: Account.site_admin)}
  let(:folder) { Folder.root_folders(admin_guy).first }
  let(:token) {Canvas::Security.create_jwt({}, nil, InstFS.jwt_secret)}

  def enable_instfs
    setting = PluginSetting.find_by(name: 'inst_fs') || PluginSetting.new(name: 'inst_fs')
    setting.disabled = false
    setting.settings = {}
    setting.save
    allow(InstFS).to receive(:enabled?).and_return true
  end

  def get_instfs_url(context_var, user, folder_location, filename, file_type)
    instfs_stuff = InstFS.upload_preflight_json(
      context: context_var,
      user: user,
      acting_as: user,
      folder: folder_location,
      filename: filename,
      content_type: file_type,
      on_duplicate: "overwrite",
      quota_exempt: true,
      capture_url: "http://#{HostUrl.default_host}/api/v1/files/capture",
      domain_root_account: Account.default
    )
    URI(instfs_stuff[:upload_url])
  end

  def get_request(url, filename, file_path, file_type)
    request = Net::HTTP::Post.new(url)
    boundary = "socool"
    post_body = []
    post_body << "--#{boundary}\r\n"
    post_body << "Content-Disposition: form-data; name=\"#{filename}\"; filename=\"#{file_path}\"\r\n"
    post_body << "Content-Type: #{file_type}\r\n\r\n"
    post_body << File.read(file_path)
    post_body << "\r\n--#{boundary}--\r\n"
    request.body = post_body.join
    request["content-type"] = "multipart/form-data; boundary=#{boundary}"
    request
  end

  def upload_file_to_instfs(file_path, context_var, user, folder_location)
    filename = File.basename(file_path)
    file_type = Attachment.mimetype(filename)
    url = get_instfs_url(context_var, user, folder_location, filename, file_type)
    request = get_request(url, filename, file_path, file_type)
    http = Net::HTTP.new(url.host, url.port)
    http.request(request)
  end

  def compare_md5s(image_element_src, original_file_path)
    # if a file is less than 10K, it will return a StringIO, not a file object.
    # in that case it needs to stream to a temp file
    downloaded_data = open(image_element_src)
    if downloaded_data.class == StringIO
      temp_file = Tempfile.new("cool")
      IO.copy_stream(downloaded_data, temp_file.path)
    else
      temp_file = downloaded_data
    end
    if temp_file.size > 0
      temp_md5 = Digest::MD5.hexdigest File.read(temp_file)
      original_md5 = Digest::MD5.hexdigest File.read(original_file_path)
      return temp_md5 == original_md5
    else
      return false
    end
  end

  def get_file_id_from_response(response)
    response_json = json_parse(response.body)
    file_location = response_json["location"].split("?").first
    file_location.split("/").last
  end

  def get_file_link_from_bg_image(image_link)
    file_link = image_link.split('background-image: url("').last
    file_link.split('"').first
  end

  def get_id_from_canvas_link(file_link)
    # http://172.18.0.18:34175/files/146/download?download_frd=1"
    file_id = file_link.split("/download?").first
    file_id.split("/files/").last
  end


  context 'when uploading to instfs as an admin' do
    before do
      user_session(admin_guy)
      course_with_teacher(account: @root_account, active_all: true, password: 'lolwut12')
      enable_instfs
    end

    it "should upload a file to instfs on the files page", priority: "1", test_id: 3399288 do
      filename = "test_image.jpg"
      file_path = File.join(ActionController::TestCase.fixture_path, filename)
      upload_file_to_instfs(file_path, admin_guy, admin_guy, folder)
      get "/files"
      wait_for_ajaximations
      file_element = f(".ef-name-col__link")
      image_element_source = file_element.attribute("href")
      expect(compare_md5s(image_element_source, file_path)).to be true
    end

    it "should display a thumbnail from instfs", priority: "1", test_id: 3399295 do
      filename = "files/instructure.png"
      file_path = File.join(ActionController::TestCase.fixture_path, filename)
      upload_file_to_instfs(file_path, admin_guy, admin_guy, folder)
      get "/files"
      wait_for_ajaximations
      thumbnail_link = f(".media-object")["style"]
      expect(thumbnail_link).to include("instfs.docker/thumbnails")
      file_link = get_file_link_from_bg_image(thumbnail_link)
      downloaded_file = open(file_link)
      expect(downloaded_file.size).to be > 0
    end
  end

  context 'when using instfs as a teacher' do
    before do
      course_with_teacher_logged_in
      enable_instfs
      enrollment = student_in_course(:workflow_state => 'active',:name => "coolguy", :course_section => @section)
      enrollment.accept!
      @student_folder = Folder.root_folders(@student).first
      @ass = @course.assignments.create!({title: "some assignment", submission_types: "online_upload"})
    end

    it 'should allow the teacher to see the uploaded file on speedgrader', priority: "1", test_id: 3399286 do
      filename = "files/instructure.png"
      file_path = File.join(ActionController::TestCase.fixture_path, filename)
      response = upload_file_to_instfs(file_path, @student, @student, @student_folder)
      student_file_id = get_file_id_from_response(response)
      attachment = Attachment.find(student_file_id)
      @ass.submit_homework(@student, attachments: [attachment], submission_type: 'online_upload')
      get "/courses/#{@course.id}/gradebook/speed_grader?assignment_id=#{@ass.id}"
      wait_for_ajaximations
      fln("instructure.png").click
      image_element = f('#iframe_holder img')
      image_element_source = image_element.attribute("src")
      expect(compare_md5s(image_element_source, file_path)).to be true
    end

    it "should allow Rich Content Editor to access InstFS files", priority: "1", test_id: 3399287 do
      course_folder = Folder.root_folders(@course).first
      filename = "test_image.jpg"
      file_path = File.join(ActionController::TestCase.fixture_path, filename)
      upload_file_to_instfs(file_path, @course, @teacher, course_folder)
      get "/courses/#{@course.id}/assignments/#{@ass.id}/edit"
      wait_for_ajaximations
      f('a[href="#editor_tabs_3"]').click
      fxpath("//span[.='course files ']").click
      f('li[title="test_image.jpg"]').click
      f(".btn-primary").click
      image_element = f('a[title="test_image.jpg"]')
      image_element_source = image_element.attribute("href")
      expect(compare_md5s(image_element_source, file_path)).to be true
    end

    it "should upload course image cards to instfs", priority: "1", test_id: 3455114 do
      Account.default.enable_feature!(:course_card_images)
      file_path = File.join(ActionController::TestCase.fixture_path, "test_image.jpg")
      get "/courses/#{@course.id}/settings"
      wait_for_ajaximations
      f(".CourseImageSelector").click
      f(".UploadArea__Content input").send_keys(file_path)
      wait_for_new_page_load
      image_link = f(".CourseImageSelector")["style"]
      # get link to canvas location of file
      file_link = get_file_link_from_bg_image(image_link)
      # get the attachment object using the canvas id
      attachment = Attachment.find(get_id_from_canvas_link(file_link))
      # verify that the attachment has an instfs uuid and that it's identical to the original file
      expect(attachment.instfs_uuid).not_to be_nil
      expect(compare_md5s(file_link, file_path)).to be true
    end

    it 'should allow the teacher to see the uploaded file on submissions page', priority: "1", test_id: 3399291 do
      filename = "test_image.jpg"
      file_path = File.join(ActionController::TestCase.fixture_path, filename)
      response = upload_file_to_instfs(file_path, @student, @student, @student_folder)
      student_file_id = get_file_id_from_response(response)
      attachment = Attachment.find(student_file_id)
      @ass.submit_homework(@student, attachments: [attachment], submission_type: 'online_upload')
      get "/courses/#{@course.id}/assignments/#{@ass.id}/submissions/#{@student.id}"
      wait_for_ajaximations
      saved_window_handle = driver.window_handle
      # switch driver to preview area so it can find the right element
      driver.switch_to.frame('preview_frame')
      image_element = f("div .file-upload-submission-info a")
      image_element_source = image_element.attribute("href")
      expect(compare_md5s(image_element_source, file_path)).to be true
      driver.switch_to.window saved_window_handle
    end

    it "should display an attached instfs file in a discussion for the student", priority: "1", test_id: 3455116 do
      filename = "files/instructure.png"
      file_path = File.join(ActionController::TestCase.fixture_path, filename)
      discussion = @course.discussion_topics.create!(user: @teacher, title: 'cool stuff', message: 'cool message')
      get "/courses/#{@course.id}/discussion_topics/#{discussion.id}"
      wait_for_ajaximations
      f(".discussion-reply-action").click
      wait_for_ajaximations
      scroll_to(f(".discussion-reply-add-attachment"))
      f(".discussion-reply-add-attachment").click
      wait_for_ajaximations
      f(".discussion-reply-attachments input").send_keys(file_path)
      wait_for_ajaximations
      type_in_tiny("textarea", "cool reply")
      f(".btn-primary").click
      wait_for_ajaximations
      get "/logout"
      f('#Button--logout-confirm').click
      wait_for_new_page_load
      user_logged_in(:user => @student)
      get "/courses/#{@course.id}/discussion_topics/#{discussion.id}"
      wait_for_ajaximations
      file_link = f(".comment_attachments a").attribute("href")
      attachment = Attachment.find(get_id_from_canvas_link(file_link))
      expect(attachment.instfs_uuid).not_to be_nil
      expect(compare_md5s(file_link, file_path)).to be true
    end

    it 'should upload submission discussion files to instfs', priority: "1", test_id: 3399302 do
      ass = @course.assignments.create!({title: "some assignment", submission_types: "online_text_entry"})
      ass.submit_homework(@student, submission_type: 'online_text_entry', body: "so cool")
      user_logged_in(:user => @student)
      get "/courses/#{@course.id}/assignments/#{ass.id}/submissions/#{@student.id}"
      wait_for_ajaximations
      filename = "file_mail.txt"
      file_path = File.join(ActionController::TestCase.fixture_path, filename)
      f(".attach_comment_file_link").click
      wait_for_ajaximations
      f(".comment_attachments input").send_keys(file_path)
      wait_for_ajaximations
      f(".ic-Input").send_keys("cool")
      f(".save_comment_button").click
      wait_for_ajaximations

      # log in as teacher and verify file shows up in assignment comment
      user_session(@teacher)
      get "/courses/#{@course.id}/gradebook/speed_grader?assignment_id=#{ass.id}"
      wait_for_ajaximations
      file_link = f(".comment_attachment a").attribute("href")
      file_id = file_link.split("download=").last
      attachment = Attachment.find(get_id_from_canvas_link(file_id))
      # verify that the attachment has an instfs uuid and that it's identical to the original file
      expect(attachment.instfs_uuid).not_to be_nil
      expect(compare_md5s(file_link, file_path)).to be true
    end
  end

  context 'when interacting with instfs as a student' do
    before do
      course_with_student_logged_in
      enable_instfs
    end

    it "should upload a file to instfs with eportfolios", priority: "1", test_id: 3399289 do
      filename = "files/instructure.png"
      file_path = File.join(ActionController::TestCase.fixture_path, filename)
      response = upload_file_to_instfs(file_path, @student, @student, @student_folder)
      student_file_id = get_file_id_from_response(response)
      sub_file = Attachment.find(student_file_id)
      eportfolio_model({:user => @student, :name => "student content"})
      get "/eportfolios/#{@eportfolio.id}?view=preview"
      wait_for_ajaximations
      f("#right-side .edit_content_link").click
      wait_for_ajaximations
      f('.add_file_link').click
      wait_for_ajaximations
      fj('.file_list:visible .sign:visible').click
      wait_for_ajaximations
      fj('.folder:visible .sign:visible').click
      wait_for_ajaximations
      file = fj('li.file .text:visible')
      expect(file).to include_text sub_file.filename
      wait_for_ajaximations
      file.click
      wait_for_ajaximations
      f('.upload_file_button').click
      wait_for_ajaximations
      download = fj('.eportfolio_download:visible')
      expect(download).to be_present
      submit_form('.form_content')
      wait_for_ajaximations
      refresh_page
      image_element = f(".attachment a")
      image_element_source = image_element.attribute("href")
      expect(compare_md5s(image_element_source, file_path)).to be true
    end
  end
end
