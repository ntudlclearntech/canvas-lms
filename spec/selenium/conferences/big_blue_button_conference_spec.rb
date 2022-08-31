# frozen_string_literal: true

#
# Copyright (C) 2018 - present Instructure, Inc.
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
require_relative "../helpers/conferences_common"
require_relative "../helpers/public_courses_context"

describe "BigBlueButton conferences" do
  include_context "in-process server selenium tests"
  include ConferencesCommon
  include WebMock::API

  bbb_endpoint = "bbb.blah.com"
  bbb_secret = "mock-secret"
  bbb_fixtures = {
    get_recordings: {
      "meetingID" => "instructure_web_conference_3Fn2k10wu0jK7diwJHs2FkDU0oXyX1ErUZCavikc",
      "checksum" => "9f41063382ab155ccf75fe2f212846e3bb103579"
    },
    delete_recordings: {
      "recordID" => "0225ccf234655ae60658ccac1e272d48781b491c-1511812307014",
      "checksum" => "4aefca80ba80ba3d540295ea3e88215df77cf5cf"
    }
  }

  before(:once) do
    initialize_big_blue_button_conference_plugin bbb_endpoint, bbb_secret
    course_with_teacher(name: "Teacher Bob", active_all: true)
    course_with_ta(name: "TA Alice", course: @course, active_all: true)
    course_with_student(name: "Student John", course: @course, active_all: true)
  end

  before do
    user_session(@teacher)
  end

  after { close_extra_windows }

  context "when bbb_modal_update is ON" do
    before(:once) do
      Account.site_admin.enable_feature! :bbb_modal_update
    end

    it "persists selected settings", ignore_js_errors: true do
      get conferences_index_page
      f("button[title='New Conference']").click

      f("input[placeholder='Conference Name']").send_keys "banana"
      # check it
      fj("label:contains('No time limit')").click

      f("div#tab-attendees").click

      # unchecks the following
      fj("label:contains('Share webcam')").click
      fj("label:contains('See other viewers webcams')").click
      fj("label:contains('Share microphone')").click
      fj("label:contains('Send public chat messages')").click
      fj("label:contains('Send private chat messages')").click
      fj("button:contains('Create')").click
      wait_for_ajaximations

      fj("li.conference a:contains('Settings')").click
      fj("a:contains('Edit')").click

      expect(f("input[value='no_time_limit']").attribute("checked")).to be_truthy

      f("div#tab-attendees").click
      expect(f("input[value='share_webcam']").attribute("checked")).to be_falsey
      expect(f("input[value='share_other_webcams']").attribute("checked")).to be_falsey
      expect(f("input[value='share_microphone']").attribute("checked")).to be_falsey
      expect(f("input[value='send_public_chat']").attribute("checked")).to be_falsey
      expect(f("input[value='send_private_chat']").attribute("checked")).to be_falsey
    end

    it "syncs in unadded context users on option select" do
      conf = create_big_blue_button_conference
      conf.add_invitee(@ta)
      expect(conf.invitees.pluck(:id)).to match_array [@ta.id]

      get conferences_index_page
      fj("li.conference a:contains('Settings')").click
      f(".sync_conference_link").click
      wait_for_ajaximations
      expect(conf.invitees.pluck(:id)).to include(@ta.id, @student.id)
    end
  end

  context "when bbb_modal_update is OFF" do
    before(:once) do
      Account.site_admin.disable_feature! :bbb_modal_update
    end

    before do
      get conferences_index_page
    end

    context "when a conference is open" do
      context "and the conference has no recordings" do
        before(:once) do
          stub_request(:get, /getRecordings/)
            .with(query: bbb_fixtures[:get_recordings])
            .to_return(body: big_blue_button_mock_response("get_recordings", "none"))
          @conference = create_big_blue_button_conference(bbb_fixtures[:get_recordings]["meetingID"])
        end

        it "does not include list with recordings", priority: "2" do
          verify_conference_does_not_include_recordings
        end
      end

      context "and the conference has recordings" do
        before(:once) do
          stub_request(:get, /getRecordings/)
            .with(query: bbb_fixtures[:get_recordings])
            .to_return(body: big_blue_button_mock_response("get_recordings", "two"))
          @conference = create_big_blue_button_conference(bbb_fixtures[:get_recordings]["meetingID"])
        end

        it "includes list with recordings", priority: "2" do
          verify_conference_includes_recordings
        end
      end

      context "and the conference has one recording and it is deleted" do
        before(:once) do
          stub_request(:get, /deleteRecordings/)
            .with(query: bbb_fixtures[:delete_recordings])
            .to_return(body: big_blue_button_mock_response("delete_recordings"))
          stub_request(:get, /getRecordings/)
            .with(query: bbb_fixtures[:get_recordings])
            .to_return(body: big_blue_button_mock_response("get_recordings", "one"))
          @conference = create_big_blue_button_conference(bbb_fixtures[:get_recordings]["meetingID"])
        end

        it "removes recording from the list", priority: "2" do
          show_recordings_in_first_conference_in_list
          delete_first_recording_in_first_conference_in_list
          verify_conference_does_not_include_recordings
        end
      end

      context "and the conference has one recording with statistics" do
        before(:once) do
          stub_request(:get, /getRecordings/)
            .with(query: bbb_fixtures[:get_recordings])
            .to_return(body: big_blue_button_mock_response("get_recordings", "one"))
          @conference = create_big_blue_button_conference(bbb_fixtures[:get_recordings]["meetingID"])
          @conference.add_user(@student, "attendee")
        end

        it "student should not see link for statistics", priority: "2" do
          user_session(@student)
          get conferences_index_page
          show_recordings_in_first_conference_in_list
          verify_conference_does_not_include_recordings_with_statistics
        end
      end
    end
  end
end
