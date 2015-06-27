#
# Copyright (C) 2011 - 2014 Instructure, Inc.
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

class Login::OauthController < Login::OauthBaseController
  def new
    super

    timeout_protection do
      request_token = @aac.consumer.get_request_token(oauth_callback: callback_uri)
      session[:oauth] = {
          callback_confirmed: request_token.callback_confirmed?,
          request_token: request_token.token,
          request_secret: request_token.secret
      }
      opts = {}
      opts[oauth_callback: callback_uri] unless request_token.callback_confirmed?
      redirect_to request_token.authorize_url(opts)
    end
  end

  def create
    reset_session_for_login

    @aac = @domain_root_account.authentication_providers.active.find(params[:id])
    raise ActiveRecord::RecordNotFound unless @aac.is_a?(AccountAuthorizationConfig::Oauth)

    oauth_state = session.delete(:oauth)
    request_token = OAuth::RequestToken.new(@aac.consumer,
                                            oauth_state[:request_token],
                                            oauth_state[:request_secret])
    opts = {}
    if oauth_state[:callback_confirmed]
      opts[:oauth_verifier] = params[:oauth_verifier]
    else
      opts[:oauth_callback] = callback_uri
    end

    unique_id = nil
    return unless timeout_protection do
      token = request_token.get_access_token(opts)
      unique_id = @aac.unique_id(token)
    end

    find_pseudonym(unique_id)
  end

  protected

  def callback_uri
    oauth_login_callback_url(id: @aac.global_id)
  end
end
