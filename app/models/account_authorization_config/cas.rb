#
# Copyright (C) 2013 Instructure, Inc.
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

class AccountAuthorizationConfig::CAS < AccountAuthorizationConfig::Delegated
  def self.sti_name
    'cas'
  end

  def self.recognized_params
    [ :auth_type, :auth_base, :log_in_url, :login_handle_name, :unknown_user_url ]
  end

  def validate_multiple_auth_configs
    return true unless account
    other_configs = account.account_authorization_configs - [self]
    unless other_configs.empty?
      return errors.add(:auth_type, :multiple_cas_configs)
    end
    super
  end
end
