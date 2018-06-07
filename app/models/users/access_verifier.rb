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

require 'openssl'

module Users
  module AccessVerifier
    class InvalidVerifier < RuntimeError
    end

    def self.validate_legacy(fields)
      return {} if fields[:sf_verifier].blank?
      ts = fields[:ts]&.to_i
      raise InvalidVerifier unless ts > 5.minutes.ago.to_i && ts < 1.minute.from_now.to_i
      user = User.where(id: fields[:user_id]).first
      raise InvalidVerifier unless user && fields[:sf_verifier] == OpenSSL::HMAC.hexdigest(OpenSSL::Digest::MD5.new, user.uuid, ts.to_s)
      return { user: user }
    end

    def self.generate(claims)
      return {} unless claims[:user]
      user = claims[:user]
      jwt_claims = { user_id: user.global_id.to_s }
      expires = 5.minutes.from_now
      key = nil # use default key
      { sf_verifier: Canvas::Security.create_jwt(jwt_claims, expires, key, :HS512) }
    end

    def self.validate(fields)
      if fields[:user_id].present? && fields[:ts].present?
        # validate legacy verifiers
        return validate_legacy(fields)
      end

      return {} if fields[:sf_verifier].blank?
      claims = Canvas::Security.decode_jwt(fields[:sf_verifier])
      user = User.where(id: claims[:user_id]).first
      raise InvalidVerifier unless user
      return { user: user }

    rescue Canvas::Security::TokenExpired, Canvas::Security::InvalidToken
      raise InvalidVerifier
    end
  end
end
