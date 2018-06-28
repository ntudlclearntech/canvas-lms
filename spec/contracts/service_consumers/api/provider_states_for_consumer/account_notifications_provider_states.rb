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

PactConfig::Consumers::ALL.each do |consumer|
  Pact.provider_states_for consumer do

    # Creates a user with many different test notifications
    # Possible API endpoints: get, delete, post and put
    # Used by every spec in account_notifications
    provider_state 'a user with many notifications' do
      set_up do
        @user = user_factory(active_all: true, name: 'Account_User')
        @account = @user.account
        @account_user = AccountUser.create(account: @account, user: @user)
        @notification1 = AccountNotification.create!(
          account: @account, subject: 'test subj1', message: 'test msg', start_at: Time.zone.now, end_at: 3.days.from_now
        )
        @notification2 = AccountNotification.create!(
          account: @account, subject: 'test subj2', message: 'test msg', start_at: Time.zone.now, end_at: 3.days.from_now
        )
        @notification3 = AccountNotification.create!(
          account: @account, subject: 'test subj3', message: 'test msg', start_at: Time.zone.now, end_at: 3.days.from_now
        )
      end
    end
  end
end