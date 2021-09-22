# frozen_string_literal: true

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
#

require File.expand_path(File.dirname(__FILE__) + '/../spec_helper')

describe MessagesController do
  describe "create" do
    context "an admin user" do
      before(:once) { site_admin_user }
      before(:each) { user_session(@user) }

      it "should be able to access the page" do
        post 'create', params: { :user_id => @user.to_param }
        expect(response.code).to eq '200'
      end

      it "should be able to send messages" do
        secure_id, message_id = ['secure_id', 42]
        expect_any_instance_of(IncomingMailProcessor::IncomingMessageProcessor).to receive(:process_single)
          .with(anything, "#{secure_id}-#{message_id}")
        post 'create', params: { :secure_id => secure_id,
                                 :message_id => message_id,
                                 :subject => 'subject',
                                 :message => 'message',
                                 :from => 'test@example.com',
                                 :user_id => @user.to_param }
      end
    end

    context "an unauthorized user" do
      before do
        account_admin_user
        user_session(@user)
      end

      it "should receive a redirect" do
        post 'create', params: { :user_id => @user.to_param }
        expect(response.code).to eq '302'
      end
    end
  end
end
