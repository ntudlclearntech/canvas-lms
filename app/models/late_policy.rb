#
# Copyright (C) 2011 - present Instructure, Inc.
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

class LatePolicy < ActiveRecord::Base
  belongs_to :course, inverse_of: :late_policy

  validates :course_id,
    presence: true
  validates :late_submission_minimum_percent, :missing_submission_deduction, :late_submission_deduction,
    presence: true,
    numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :late_submission_interval,
    presence: true,
    inclusion: { in: %w(day hour) }

  def points_deducted(score: nil, possible: 0.0, late_for: 0.0)
    return 0.0 unless late_submission_deduction_enabled && score && possible&.positive? && late_for&.positive?

    intervals_late = (late_for / interval_seconds).ceil
    minimum_percent = late_submission_minimum_percent_enabled ? late_submission_minimum_percent : 0.0
    raw_score_percent = score * 100.0 / possible
    maximum_deduct = [raw_score_percent - minimum_percent, 0.0].max
    late_percent_deduct = late_submission_deduction * intervals_late
    possible * [late_percent_deduct, maximum_deduct].min / 100
  end

  private

  def interval_seconds
    { 'hour' => 1.hour, 'day' => 1.day }[late_submission_interval].to_f
  end
end
