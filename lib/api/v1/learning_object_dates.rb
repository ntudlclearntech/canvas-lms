# frozen_string_literal: true

#
# Copyright (C) 2023 - present Instructure, Inc.
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

module Api::V1::LearningObjectDates
  include Api::V1::Json

  BASE_FIELDS = %w[id].freeze
  LEARNING_OBJECT_DATES_FIELDS = %w[
    due_at
    unlock_at
    lock_at
    only_visible_to_overrides
  ].freeze

  def learning_object_dates_json(learning_object, overridable)
    hash = learning_object.slice(BASE_FIELDS)
    LEARNING_OBJECT_DATES_FIELDS.each do |field|
      hash[field] = overridable.send(field) if overridable.respond_to?(field)
    end
    hash
  end
end
