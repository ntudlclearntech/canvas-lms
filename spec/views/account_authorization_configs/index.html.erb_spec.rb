#
# Copyright (C) 2011 Instructure, Inc.
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

require File.expand_path(File.dirname(__FILE__) + '/../../spec_helper')
require File.expand_path(File.dirname(__FILE__) + '/../views_helper')

describe "account_authorization_configs/index" do
  let(:account){ Account.default }

  before do
    assigns[:context] = assigns[:account] = account
    assigns[:current_user] = user_model
    assigns[:saml_identifiers] = []
    assigns[:saml_authn_contexts] = []
    assigns[:saml_login_attributes] = {}
  end

  it "should list the auth ips" do
    Setting.set('account_authorization_config_ip_addresses', "192.168.0.1,192.168.0.2")
    presenter = AccountAuthorizationConfigsPresenter.new(account)
    account.account_authorization_configs = [
      presenter.new_config(auth_type: 'saml'),
      presenter.new_config(auth_type: 'saml')
    ]
    assigns[:presenter] = presenter
    render 'account_authorization_configs/index'
    expect(response.body).to match("192.168.0.1\n192.168.0.2")
  end

  it "should display the last_timeout_failure" do
    account.account_authorization_configs = [
      account.account_authorization_configs.create!(auth_type: 'ldap'),
      account.account_authorization_configs.create!(auth_type: 'ldap')
    ]
    account.account_authorization_configs.first.last_timeout_failure = 1.minute.ago
    assigns[:presenter] = AccountAuthorizationConfigsPresenter.new(account)
    render 'account_authorization_configs/index'
    doc = Nokogiri::HTML(response.body)
    expect(doc.css('form.edit_account_authorization_config_ldap tr.last_timeout_failure').length).to eq 1
  end

  it "should display more than 2 LDAP configs" do
    account.account_authorization_configs.each(&:destroy)
    4.times do
      account.account_authorization_configs.create!(auth_type: 'ldap')
    end
    assigns[:presenter] = AccountAuthorizationConfigsPresenter.new(account)
    render 'account_authorization_configs/index'
    doc = Nokogiri::HTML(response.body)
    expect(doc.css('form.edit_account_authorization_config_ldap').length).to eq(4)
  end
end
