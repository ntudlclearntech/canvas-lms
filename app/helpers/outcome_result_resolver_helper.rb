# frozen_string_literal: true

#
# Copyright (C) 2022 - present Instructure, Inc.
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

module OutcomeResultResolverHelper
  include OutcomesServiceAuthoritativeResultsHelper

  def resolve_outcome_results(authoritative_results)
    # TODO: Since get_lmgb_results returns a parsed JSON object
    # we will need to update json_to_outcome_results to handle an already parsed object
    # this will be done in a separate PS as it is not just a simple fix since this helper
    # module is heavily dependent on the data to be in JSON. See OUT-5283
    results = json_to_outcome_results({ results: authoritative_results }.to_json)
    rubric_results = LearningOutcomeResult.preload(:learning_outcome).active.where(association_type: "RubricAssociation")
    results.reject { |res| rubric_result?(res, rubric_results) }
  end

  private

  def rubric_result?(result, rubric_results)
    filter_rubric_results = rubric_results.where(user_uuid: result.user_uuid, learning_outcome_id: result.learning_outcome.id)
    filter_rubric_results = filter_rubric_results.select { |r| r.assignment.id == result.associated_asset_id }
    !filter_rubric_results.empty?
  end
end
