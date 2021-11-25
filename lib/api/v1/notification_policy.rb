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

# includes Enrollment json helpers
module Api::V1::NotificationPolicy
  include Api::V1::Json

  JSON_OPTS = {
    only: %w[frequency]
  }.freeze

  def notification_policy_json(policy, user, session)
    api_json(policy, user, session, JSON_OPTS).tap do |json|
      json[:notification] = policy.notification && policy.notification.name.underscore.gsub(/\s/, '_')
      json[:category] = policy.notification && policy.notification.category.underscore.gsub(/\s/, '_')
    end
  end
end
