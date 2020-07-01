#
# Copyright (C) 2016 - present Instructure, Inc.
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

module ConditionalRelease
  class ServiceError < StandardError; end

  class Service
    private_class_method :new

    DEFAULT_PATHS = {
      base_path: '',
      stats_path: "stats",
      create_account_path: 'api/accounts',
      content_exports_path: 'api/content_exports',
      content_imports_path: 'api/content_imports',
      rules_path: 'api/rules?include[]=all&active=true',
      rules_summary_path: 'api/rules/summary',
      select_assignment_set_path: 'api/rules/select_assignment_set',
      editor_path: 'javascripts/generated/conditional_release_editor.bundle.js',
      start_export_path: 'api/start_export',
      export_status_path: 'api/export_status',
      download_export_path: 'api/download_export',
    }.freeze

    DEFAULT_CONFIG = {
      enabled: false, # required
      host: nil,      # required
      protocol: nil,  # defaults to Canvas
    }.merge(DEFAULT_PATHS).freeze

    def self.env_for(context, user = nil, session: nil, assignment: nil, domain: nil,
                  real_user: nil, includes: [])
      includes = Array.wrap(includes)
      enabled = self.enabled_in_context?(context)
      env = {
        CONDITIONAL_RELEASE_SERVICE_ENABLED: enabled
      }
      return env unless enabled && user

      if self.natively_enabled_for_account?(context.root_account)
        cyoe_env = {native: true}
        cyoe_env[:assignment] = assignment_attributes(assignment) if assignment
        if context.is_a?(Course)
          cyoe_env[:course_id] = context.id
          cyoe_env[:stats_url] = "/api/v1/courses/#{context.id}/mastery_paths/stats"
        end
      else
        cyoe_env = {
          jwt: jwt_for(context, user, domain, session: session, real_user: real_user),
          disable_editing: !!ConditionalRelease::Assimilator.assimilation_in_progress?(context.root_account),
          assignment: assignment_attributes(assignment),
          stats_url: stats_url,
          locale: I18n.locale.to_s,
          editor_url: editor_url,
          base_url: base_url,
          context_id: context.id
        }
      end

      cyoe_env[:rule] = rule_triggered_by(assignment, user, session) if includes.include? :rule
      cyoe_env[:active_rules] = active_rules(context, user, session) if includes.include? :active_rules
      env.merge(CONDITIONAL_RELEASE_ENV: cyoe_env)
    end

    def self.jwt_for(context, user, domain, claims: {}, session: nil, real_user: nil)
      Canvas::Security::ServicesJwt.generate(
        claims.merge({
          sub: user.id.to_s,
          domain: domain,
          account_id: Context.get_account(context).root_account.lti_guid.to_s,
          context_type: context.class.name,
          context_id: context.id.to_s,
          role: find_role(user, session, context),
          workflows: ['conditonal-release-api'],
          canvas_token: Canvas::Security::ServicesJwt.for_user(domain, user, real_user: real_user, workflows: ['conditional-release'])
        })
      )
    end

    def self.rules_for(context, student, session)
      return unless enabled_in_context?(context)
      rules_data(context, student, session)
    end

    def self.clear_active_rules_cache(course)
      return unless course.present?
      clear_cache_with_key(active_rules_cache_key(course))
      clear_cache_with_key(active_rules_reverse_cache_key(course))
    end

    def self.clear_applied_rules_cache(course)
      return unless course.present?
      clear_cache_with_key(assignments_cache_key(course))
    end

    def self.clear_submissions_cache_for(user)
      return unless user.present?
      clear_cache_with_key(submissions_cache_key(user))
    end

    def self.clear_rules_cache_for(context, student)
      return if context.blank? || student.blank?
      clear_cache_with_key(rules_cache_key(context, student))
    end

    def self.reset_config_cache
      @config = nil
    end

    def self.config
      @config ||= DEFAULT_CONFIG.merge(config_file)
    end

    # whether new accounts will use the ported canvas db and UI instead of provisioning onto the service
    # can flip this setting on when canvas-side is code-complete but the migration is still pending
    def self.prefer_native?
      Setting.get("conditional_release_prefer_native", "false") == "true"
    end

    # TODO: can remove when all accounts are migrated
    def self.natively_enabled_for_account?(root_account)
      !!root_account&.settings&.[](:use_native_conditional_release)
    end

    def self.service_configured?
      !!(config[:enabled] && config[:host])
    end

    def self.enabled_in_context?(context)
      !!((service_configured? || natively_enabled_for_account?(context&.root_account)) && context&.feature_enabled?(:conditional_release))
    end

    def self.protocol
      config[:protocol] || HostUrl.protocol
    end

    def self.host
      config[:host]
    end

    def self.unique_id
      config[:unique_id] || "conditional-release-service@instructure.auth"
    end

    DEFAULT_PATHS.each do |path_name, _path|
      method_name = path_name.to_s.sub(/_path$/, '_url')
      Service.define_singleton_method method_name do
        build_url config[path_name]
      end
    end

    # Returns an http response-like hash { code: string, body: string or object }
    def self.select_mastery_path(context, current_user, student, trigger_assignment, assignment_set_id, session)
      return unless enabled_in_context?(context)
      if context.blank? || student.blank? || trigger_assignment.blank? || assignment_set_id.blank?
        return { code: '400', body: { message: 'invalid request' } }
      end

      trigger_submission = trigger_assignment.submission_for_student(student)
      submission_hidden = context.post_policies_enabled? ? !trigger_submission&.posted? : trigger_assignment.muted?
      if trigger_submission.blank? || !trigger_submission.graded? || submission_hidden
        return { code: '400', body: { message: 'invalid submission state' } }
      end

      request_data = {
        trigger_assignment: trigger_assignment.id,
        trigger_assignment_score: trigger_submission.score,
        trigger_assignment_points_possible: trigger_assignment.points_possible,
        student_id: student.id,
        assignment_set_id: assignment_set_id
      }
      headers = headers_for(context, current_user, domain_for(context), session)
      request = CanvasHttp.post(select_assignment_set_url, headers, form_data: request_data.to_param)

      # either assignments have changed (req success) or unknown state (req error)
      clear_rules_cache_for(context, student)

      { code: request.code, body: JSON.parse(request.body) }
    end

    def self.triggers_mastery_paths?(assignment, current_user, session = nil)
      rule_triggered_by(assignment, current_user, session).present?
    end

    def self.rule_triggered_by(assignment, current_user, session = nil)
      return unless assignment.present?
      return unless enabled_in_context?(assignment.context)

      rules = active_rules(assignment.context, current_user, session)
      return nil unless rules

      rules.find {|r| r['trigger_assignment'] == assignment.id.to_s || r['trigger_assignment_id'] == assignment.id}
    end

    def self.active_rules(course, current_user, session)
      return unless enabled_in_context?(course)
      return unless course.grants_any_right?(current_user, session, :read, :manage_assignments)
      return native_active_rules(course) if natively_enabled_for_account?(course.root_account)

      Rails.cache.fetch(active_rules_cache_key(course)) do
        headers = headers_for(course, current_user, domain_for(course), session)
        request = CanvasHttp.get(rules_url, headers)
        unless request && request.code == '200'
          InstStatsd::Statsd.increment("conditional_release_service_error",
                                       short_stat: 'conditional_release_service_error',
                                       tags: { type: 'active_rules' })
          raise ServiceError, "error fetching active rules #{request}"
        end
        rules = JSON.parse(request.body)

        trigger_ids = rules.map { |rule| rule['trigger_assignment'] }
        trigger_assgs = Assignment.preload(:grading_standard).where(id: trigger_ids).each_with_object({}) do |a, assgs|
          assgs[a.id.to_s] = {
            points_possible: a.points_possible,
            grading_type: a.grading_type,
            grading_scheme: a.uses_grading_standard ? a.grading_scheme : nil,
          }
        end

        rules.each do |rule|
          rule['trigger_assignment_model'] = trigger_assgs[rule['trigger_assignment']]
        end

        rules
      end
    rescue => e
      Canvas::Errors.capture(e, course_id: course.global_id, user_id: current_user.global_id)
      []
    end

    def self.native_active_rules(course)
      rules_data = Rails.cache.fetch_with_batched_keys('conditional_release_active_rules', batch_object: course, batched_keys: :conditional_release) do
        rules = course.conditional_release_rules.active.with_assignments.to_a
        rules.as_json(include: Rule.includes_for_json, include_root: false, except: [:root_account_id, :deleted_at])
      end
      trigger_ids = rules_data.map { |rule| rule['trigger_assignment_id'] }
      trigger_assgs = course.assignments.preload(:grading_standard).where(id: trigger_ids).each_with_object({}) do |a, assgs|
        assgs[a.id] = {
          points_possible: a.points_possible,
          grading_type: a.grading_type,
          grading_scheme: a.uses_grading_standard ? a.grading_scheme : nil,
        }
      end
      rules_data.each do |rule|
        rule['trigger_assignment_model'] = trigger_assgs[rule['trigger_assignment_id']]
      end
      rules_data
    end

    class << self
      private
      def config_file
        ConfigFile.load('conditional_release').try(:symbolize_keys) || {}
      end

      def build_url(path)
        "#{protocol}://#{host}/#{path}"
      end

      def find_role(user, session, context)
        if Context.get_account(context).grants_right? user, session, :manage
          'admin'
        elsif context.is_a?(Course) && context.grants_right?(user, session, :manage_assignments)
          'teacher'
        elsif context.grants_right? user, session, :read
          'student'
        end
      end

      def assignment_attributes(assignment)
        return nil unless assignment.present?
        {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          points_possible: assignment.points_possible,
          grading_type: assignment.grading_type,
          submission_types: assignment.submission_types,
          grading_scheme: (assignment.grading_scheme if assignment.uses_grading_standard)
        }
      end

      def headers_for(context, user, domain, session)
        jwt = jwt_for(context, user, domain, session: session)
        {"Authorization" => "Bearer #{jwt}"}
      end

      def domain_for(context)
        Context.get_account(context).root_account.domain
      end

      def submissions_for(student, context, force: false)
        return [] unless student.present?
        Rails.cache.fetch(submissions_cache_key(student), force: force) do
          keys = [:id, :assignment_id, :score, "assignments.points_possible"]
          submissions = context.submissions.
            for_user(student).
            in_workflow_state(:graded).
            eager_load(:assignment)

          submissions = if context.post_policies_enabled?
            submissions.posted
          else
            submissions.where(assignments: {muted: false})
          end

          submissions.pluck(*keys).map do |values|
            submission = Hash[keys.zip(values)]
            submission[:points_possible] = submission.delete("assignments.points_possible")
            submission
          end
        end
      end

      def rules_data(context, student, session = {})
        return [] if context.blank? || student.blank?
        if natively_enabled_for_account?(context.root_account)
          return native_rules_data_for_student(context, student)
        end

        cached = rules_cache(context, student)
        assignments = assignments_for(cached[:rules]) if cached
        force_cache = rules_cache_expired?(context, cached)
        rules_data = rules_cache(context, student, force: force_cache) do
          data = { submissions: submissions_for(student, context, force: force_cache) }
          headers = headers_for(context, student, domain_for(context), session)
          req = request_rules(headers, data)
          {rules: req, updated_at: Time.zone.now}
        end
        rules_data[:rules] = merge_assignment_data(rules_data[:rules], assignments)
        rules_data[:rules]
      rescue ConditionalRelease::ServiceError => e
        InstStatsd::Statsd.increment("conditional_release_service_error",
                                     short_stat: 'conditional_release_service_error',
                                     tags: { type: 'rules_data' })
        Canvas::Errors.capture(e, course_id: context.global_id, user_id: student.global_id)
        []
      end

      def native_rules_data_for_student(course, student)
        rules_data =
          ::Rails.cache.fetch(['conditional_release_rules_for_student', student.cache_key(:submissions), course.cache_key(:conditional_release)].cache_key) do
            rules = course.conditional_release_rules.active.preload(Rule.preload_associations).to_a

            trigger_assignments = course.assignments.where(:id => rules.map(&:trigger_assignment_id)).to_a.index_by(&:id)
            trigger_submissions = course.submissions.where(:assignment_id => trigger_assignments.keys).
              for_user(student).in_workflow_state(:graded).posted.to_a.index_by(&:assignment_id)

            assigned_set_ids = ConditionalRelease::AssignmentSetAction.current_assignments(
              student, rules.flat_map(&:scoring_ranges).flat_map(&:assignment_sets)).pluck(:assignment_set_id)
            rules.map do |rule|
              trigger_assignment = trigger_assignments[rule.trigger_assignment_id]
              trigger_sub = trigger_submissions[trigger_assignment.id]
              if trigger_sub&.score
                relative_score = ConditionalRelease::Stats.percent_from_points(trigger_sub.score, trigger_assignment.points_possible)
                assignment_sets = rule.scoring_ranges.select{|sr| sr.contains_score(relative_score)}.flat_map(&:assignment_sets)
                selected_set_id =
                  if assignment_sets.length == 1
                    assignment_sets.first.id
                  else
                    (assignment_sets.map(&:id) & assigned_set_ids).first
                  end
              end
              assignment_sets_data = (assignment_sets || []).as_json(
                include_root: false, except: [:root_account_id, :deleted_at],
                include: {assignment_set_associations: {except: [:root_account_id, :deleted_at]}}
              ).map(&:deep_symbolize_keys)
              rule.as_json(include_root: false, except: [:root_account_id, :deleted_at]).merge(
                locked: relative_score.blank?,
                selected_set_id: selected_set_id,
                assignment_sets: assignment_sets_data
              )
            end
          end
        # TODO: do something less weird than mixing AR records into json
        # to get the assignment data in when we're not maintaining back compat
        referenced_assignment_ids = rules_data.map do |rule_hash|
          rule_hash[:assignment_sets].map do |set_hash|
            set_hash[:assignment_set_associations].map{|assoc_hash| assoc_hash[:assignment_id]}
          end
        end.flatten
        referenced_assignments = course.assignments.where(:id => referenced_assignment_ids).to_a.index_by(&:id)
        rules_data.each do |rule_hash|
          rule_hash[:assignment_sets].each do |set_hash|
            set_hash[:assignment_set_associations].each do |assoc_hash|
              assoc_hash[:model] = referenced_assignments[assoc_hash[:assignment_id]]
            end
          end
        end
        rules_data
      end

      def rules_cache(context, student, force: false, &block)
        Rails.cache.fetch(rules_cache_key(context, student), force: force, &block)
      end

      def rules_cache_expired?(context, cache)
        assignment_timestamp = Rails.cache.fetch(assignments_cache_key(context)) do
          Time.zone.now
        end
        if cache && cache.key?(:updated_at)
          assignment_timestamp > cache[:updated_at]
        else
          true
        end
      end

      def request_rules(headers, data)
        req = CanvasHttp.post(rules_summary_url, headers, form_data: data.to_param)

        if req && req.code == '200'
          JSON.parse(req.body)
        else
          InstStatsd::Statsd.increment("conditional_release_service_error",
                                       short_stat: 'conditional_release_service_error',
                                       tags: { type: 'applied_rules' })
          message = "error fetching applied rules #{req}"
          raise ServiceError, message
        end
      rescue => e
        raise if e.is_a? ServiceError
        raise ServiceError, e.inspect
      end

      def assignments_for(response)
        rules = response.map(&:deep_symbolize_keys)

        # Fetch all the nested assignment_ids for the associated
        # CYOE content from the Rules provided
        ids = rules.flat_map do |rule|
                rule[:assignment_sets].flat_map do |a|
                  a[:assignments].flat_map do |asg|
                    asg[:assignment_id]
                  end
                end
              end

        # Get all the related Assignment models in Canvas
        Assignment.active.where(id: ids)
      end

      def merge_assignment_data(response, assignments = nil)
        return response if response.blank? || (response.is_a?(Hash) && response.key?(:error))
        assignments = assignments_for(response) if assignments.blank?

        # Merge the Assignment models into the response for the given module item
        rules = response.map(&:deep_symbolize_keys)
        rules.map! do |rule|
          rule[:assignment_sets].map! do |set|
            set[:assignments].map! do |asg|
              assignment = assignments.find { |a| a[:id].to_s == asg[:assignment_id].to_s }
              asg[:model] = assignment
              asg if asg[:model].present?
            end.compact!
            set if set[:assignments].present?
          end.compact!
          rule
        end.compact!
        rules.compact
      end

      def assignment_keys
        %i(id title name description due_at unlock_at lock_at
          points_possible min_score max_score grading_type
          submission_types workflow_state context_id
          context_type updated_at context_code)
      end

      def rules_cache_key(context, student)
        context_id = context.is_a?(ActiveRecord::Base) ? context.global_id : context
        student_id = student.is_a?(User) ? student.global_id : student
        ['conditional_release_rules:2', context_id, student_id].cache_key
      end

      def assignments_cache_key(context)
        ['conditional_release_rules:assignments:2', context.global_id].cache_key
      end

      def submissions_cache_key(student)
        id = student.is_a?(User) ? student.global_id : student
        ['conditional_release_submissions:2', id].cache_key
      end

      def active_rules_cache_key(course)
        ['conditional_release', 'active_rules', course.global_id].cache_key
      end

      def active_rules_reverse_cache_key(course)
        ['conditional_release', 'active_rules_reverse', course.global_id].cache_key
      end

      def clear_cache_with_key(key)
        return if key.blank?
        Rails.cache.delete(key)
      end
    end
  end
end
