# frozen_string_literal: true

#
# Copyright (C) 2011 - present Instructure, Inc.
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

require_relative "messages_helper"

describe "new_context_group_membership" do
  before :once do
    course_model(reusable: true)
    group = @course.groups.create!(name: "some group")
    user_model
    @membership = group.add_user(@user)
  end

  let(:asset) { @membership }
  let(:notification_name) { :new_context_group_membership }

  include_examples "a message"
end
