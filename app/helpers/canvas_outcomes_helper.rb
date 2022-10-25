# frozen_string_literal: true

#
# Copyright (C) 2020 - present Instructure, Inc.
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

module CanvasOutcomesHelper
  MAX_RETRIES = 3

  class OSFetchError < StandardError; end

  def get_outcome_alignments(context, outcome_ids, additional_params = nil)
    return if outcome_ids.blank? || context.blank? || !context.feature_enabled?(:outcome_service_results_to_canvas)

    params = {
      context_uuid: context.uuid,
      external_outcome_id_list: outcome_ids
    }

    domain, jwt = extract_domain_jwt(
      context.root_account,
      "lmgb_results.show",
      params
    )
    return if domain.nil? || jwt.nil?

    protocol = ENV.fetch("OUTCOMES_SERVICE_PROTOCOL", Rails.env.production? ? "https" : "http")
    params = params.merge(additional_params) unless additional_params.nil?
    response = CanvasHttp.get(
      build_request_url(protocol, domain, "api/outcomes/list", params),
      {
        "Authorization" => jwt
      }
    )

    if /^2/.match?(response.code.to_s)
      JSON.parse(response.body, symbolize_names: true)
    else
      raise "Error retrieving aligned assets from Outcomes Service: #{response.body}"
    end
  end

  def get_lmgb_results(context, assignment_ids, assignment_type, outcome_ids, user_uuids)
    return if assignment_ids.blank? || assignment_type.blank? || outcome_ids.blank? || user_uuids.blank? || !context.feature_enabled?(:outcome_service_results_to_canvas)

    params = {
      associated_asset_id_list: assignment_ids,
      associated_asset_type: assignment_type,
      external_outcome_id_list: outcome_ids,
      user_uuid_list: user_uuids
    }

    domain, jwt = extract_domain_jwt(
      context.root_account,
      "lmgb_results.show",
      params
    )
    return if domain.nil? || jwt.nil?

    protocol = ENV.fetch("OUTCOMES_SERVICE_PROTOCOL", Rails.env.production? ? "https" : "http")
    retry_count = 0
    begin
      response = CanvasHttp.get(
        build_request_url(protocol, domain, "api/authoritative_results", params),
        {
          "Authorization" => jwt
        }
      )
    rescue
      retry_count += 1
      retry if retry_count < MAX_RETRIES
      raise OSFetchError, "Failed to fetch results for context #{context.id} #{params}"
    end

    if /^2/.match?(response.code.to_s)
      begin
        results = JSON.parse(response.body).deep_symbolize_keys[:results]
        results.each do |result|
          next if result[:attempts].nil?

          result[:attempts].each do |attempt|
            attempt[:metadata] = JSON.parse(attempt[:metadata]).deep_symbolize_keys unless attempt[:metadata].nil?
          end
        end
        results
      rescue
        raise OSFetchError, "Error parsing JSON results from Outcomes Service: #{response.body}"
      end
    else
      raise OSFetchError, "Error retrieving results from Outcomes Service: #{response.body}"
    end
  end

  def set_outcomes_alignment_js_env(artifact, context, props)
    context =
      case context
      when Group then context.context
      else context
      end
    # don't show for contexts without alignmments
    return if context.learning_outcome_links.empty?

    # don't show for accounts without provisioned outcomes service
    artifact_type = artifact_type_lookup(artifact)
    domain, jwt = extract_domain_jwt(context.root_account, "outcome_alignment_sets.create")
    return if domain.nil? || jwt.nil?

    protocol = ENV.fetch("OUTCOMES_SERVICE_PROTOCOL", Rails.env.production? ? "https" : "http")
    host_url = "#{protocol}://#{domain}" if domain.present?

    js_env(
      canvas_outcomes: {
        artifact_type: artifact_type,
        artifact_id: artifact.id,
        context_uuid: context.uuid,
        host: host_url,
        jwt: jwt,
        **props
      }
    )
  end

  def extract_domain_jwt(account, scope, **props)
    settings = account.settings.dig(:provision, "outcomes") || {}
    domain = nil
    jwt = nil
    if settings.key?(:consumer_key) && settings.key?(:jwt_secret) && settings.key?(domain_key)
      consumer_key = settings[:consumer_key]
      jwt_secret = settings[:jwt_secret]
      domain = settings[domain_key]
      payload = {
        host: domain,
        consumer_key: consumer_key,
        scope: scope,
        exp: 1.day.from_now.to_i,
        **props
      }
      jwt = JWT.encode(payload, jwt_secret, "HS512")
    end

    [domain, jwt]
  end

  def domain_key
    # test_cluster? and test_cluster_name are true and not nil for nonprod environments,
    # like beta or test
    if ApplicationController.test_cluster?
      "#{ApplicationController.test_cluster_name}_domain".to_sym
    else
      :domain
    end
  end

  def build_request_url(protocol, domain, endpoint, params)
    url = "#{protocol}://#{domain}/#{endpoint}"
    if params.present?
      url += "?" + params.to_query
    end
    url
  end

  private

  def artifact_type_lookup(artifact)
    case artifact.class.to_s
    when "WikiPage"
      "canvas.page"
    else
      raise "Unsupported artifact type: #{artifact.class}"
    end
  end
end
