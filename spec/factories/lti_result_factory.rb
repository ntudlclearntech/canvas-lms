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
#

module Factories
  def lti_result_model(overrides: {})
    submission = submission_model
    options = {
      activity_progress: 'Completed',
      grading_progress: 'FullyGraded',
      submission: submission,
      line_item: overrides[:line_item] || line_item_model(overrides: {assignment: @assignment}),
      user: @user
    }
    Lti::Result.create!(options.merge(overrides))
  end
end