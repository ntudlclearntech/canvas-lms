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

require_relative 'helper'
require_relative '../pact_helper'

describe 'Discussions', :pact do
  subject(:discussions_api) { Helper::ApiClient::Discussions.new }

  it 'should List Discussions' do
    canvas_lms_api.given('a student in a course with a discussion').
      upon_receiving('List Discussions').
      with(
        method: :get,
        headers: {
          'Authorization': 'Bearer some_token',
          'Auth-User': 'Teacher1',
          'Connection': 'close',
          'Host': PactConfig.mock_provider_service_base_uri,
          'Version': 'HTTP/1.1'
        },
        'path' => '/api/v1/courses/1/discussion_topics',
        query: ''
      ).
      will_respond_with(
        status: 200,
        body: Pact.each_like(
          "id": 1,
          "title": "No Title",
          "last_reply_at": "2018-05-29T22:36:43Z",
          "delayed_post_at": nil,
          "posted_at": "2018-05-29T22:36:43Z",
          "assignment_id": nil,
          "root_topic_id": nil,
          "position": nil,
          "podcast_has_student_posts": false,
          "discussion_type": "side_comment",
          "lock_at": nil,
          "allow_rating": false,
          "only_graders_can_rate": false,
          "sort_by_rating": false,
          "is_section_specific": false,
          "user_name": "test@test.com",
          "discussion_subentry_count": 0,
          "permissions": {
            "attach": true,
            "update": true,
            "reply": true,
            "delete": true
          },
          "require_initial_post": nil,
          "user_can_see_posts": true,
          "podcast_url": nil,
          "read_state": "read",
          "unread_count": 0,
          "subscribed": true,
          "topic_children": [],
          "group_topic_children": [],
          "attachments": [],
          "published": false,
          "can_unpublish": true,
          "locked": false,
          "can_lock": true,
          "comments_disabled": false,
          "author": {
            "id": 2,
            "display_name": "test@test.com",
            "avatar_image_url": "http://canvas.instructure.com/images/messages/avatar-50.png",
            "html_url": "http://localhost:3000/courses/1/users/2"
          },
          "html_url": "http://localhost:3000/courses/1/discussion_topics/4",
          "url": "http://localhost:3000/courses/1/discussion_topics/4",
          "pinned": false,
          "group_category_id": nil,
          "can_group": true,
          "locked_for_user": false,
          "message": nil,
        )
      )
    discussions_api.authenticate_as_user('Teacher1')
    response = discussions_api.list_discussions(1)
    expect(response[0]['id']).to eq 1
    expect(response[0]['title']).to eq 'No Title'
  end
end

