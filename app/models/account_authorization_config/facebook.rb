#
# Copyright (C) 2015 Instructure, Inc.
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

class AccountAuthorizationConfig::Facebook < AccountAuthorizationConfig::Oauth2
  include AccountAuthorizationConfig::PluginSettings
  self.plugin = :facebook

  SENSITIVE_PARAMS = [ :app_secret ].freeze

  alias_method :app_id=, :client_id=
  alias_method :app_id, :client_id

  alias_method :app_secret=, :client_secret=
  alias_method :app_secret, :client_secret

  plugin_settings :app_id, app_secret: :app_secret_dec

  def login_button?
    true
  end
  
  def client_id
    self.class.globally_configured? ? app_id : super
  end

  def client_secret
    self.class.globally_configured? ? app_secret : super
  end

  def unique_id(token)
    token.get('me').parsed['id']
  end

  protected

  def client_options
    {
      site: 'https://graph.facebook.com'.freeze,
      authorize_url: 'https://www.facebook.com/dialog/oauth'.freeze,
      token_url: 'oauth/access_token'.freeze
    }
  end

  def token_options
    {
      parse: :query
    }
  end
end
