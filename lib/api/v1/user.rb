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

# includes Enrollment json helpers
module Api::V1::User
  include Api::V1::Json
  include AvatarHelper

  API_USER_JSON_OPTS = {
    :only => %w(id name),
    :methods => %w(sortable_name short_name display_name)
  }

  def user_json_preloads(users, preload_email=false)
    # pseudonyms for User#sis_pseudoym_for and User#find_pseudonym_for_account
    # pseudonyms account for Pseudonym#works_for_account?
    ActiveRecord::Associations::Preloader.new(users, pseudonyms: :account).run if user_json_is_admin?
    if preload_email && (no_email_users = users.reject(&:email_cached?)).present?
      # communication_channels for User#email if it is not cached
      ActiveRecord::Associations::Preloader.new(no_email_users, :communication_channels).run
    end
  end

  def user_json(user, current_user, session, includes = [], context = @context, enrollments = nil, excludes = [])
    includes ||= []
    excludes ||= []
    api_json(user, current_user, session, API_USER_JSON_OPTS).tap do |json|
      if !excludes.include?('pseudonym') && user_json_is_admin?(context, current_user)
        include_root_account = @domain_root_account.trust_exists?
        if (sis_pseudonym = SisPseudonym.for(user, @domain_root_account, include_root_account))
          # the sis fields on pseudonym are poorly named -- sis_user_id is
          # the id in the SIS import data, where on every other table
          # that's called sis_source_id.
          json.merge! :sis_user_id => sis_pseudonym.sis_user_id,
                      :integration_id => sis_pseudonym.integration_id,
                      # TODO: don't send sis_login_id; it's garbage data
                      :sis_login_id => sis_pseudonym.unique_id if @domain_root_account.grants_any_right?(current_user, :read_sis, :manage_sis)
          json[:sis_import_id] = sis_pseudonym.sis_batch_id if @domain_root_account.grants_right?(current_user, session, :manage_sis)
          json[:root_account] = HostUrl.context_host(sis_pseudonym.account) if include_root_account
        end
        if pseudonym = (sis_pseudonym || user.find_pseudonym_for_account(@domain_root_account))
          json[:login_id] = pseudonym.unique_id
        end
      end
      if user.account.service_enabled?(:avatars) && includes.include?('avatar_url')
        json[:avatar_url] = avatar_url_for_user(user, blank_fallback)
      end
      if enrollments
        json[:enrollments] = enrollments.map { |e| enrollment_json(e, current_user, session, includes) }
      end
      # include a permissions check here to only allow teachers and admins
      # to see user email addresses.
      if includes.include?('email') && context.grants_right?(current_user, session, :read_roster)
        json[:email] = user.email
      end

      if includes.include?('bio') && @domain_root_account.enable_profiles? && user.profile
        json[:bio] = user.profile.bio
      end

      if includes.include?('sections')
        json[:sections] = user.enrollments.
          map(&:course_section).compact.uniq.
          map(&:name).join(", ")
      end

      json[:locale] = user.locale if includes.include?('locale')
      json[:confirmation_url] = user.communication_channels.email.first.try(:confirmation_url) if includes.include?('confirmation_url')

      if includes.include?('last_login')
        last_login = user.read_attribute(:last_login)
        if last_login.is_a?(String)
          Time.use_zone('UTC') { last_login = Time.zone.parse(last_login) }
        end
        json[:last_login] = last_login.try(:iso8601)
      end

      if includes.include?('permissions')
        json[:permissions] = {
          :can_update_name => user.user_can_edit_name?,
          :can_update_avatar => service_enabled?(:avatars)
        }
      end

      if includes.include?('terms_of_use')
        json[:terms_of_use] = !!user.preferences[:accepted_terms]
      end
    end
  end

  def users_json(users, current_user, session, includes = [], context = @context, enrollments = nil, excludes = [])

    if includes.include?('sections')
      ActiveRecord::Associations::Preloader.new(users, enrollments: :course_section).run
    end

    users.map{ |user| user_json(user, current_user, session, includes, context, enrollments, excludes) }
  end

  # this mini-object is used for secondary user responses, when we just want to
  # provide enough information to display a user.
  # for instance, discussion entries return this json as a sub-object.
  #
  # if parent_context is given, the html_url will be scoped to that context, so:
  #   /courses/X/users/Y
  # otherwise it'll just be:
  #   /users/Y
  # keep in mind the latter form is only accessible if the user has a public profile
  # (or if the api caller is an admin)
  #
  # if parent_context is :profile, the html_url will always be the user's
  # public profile url, regardless of @current_user permissions
  def user_display_json(user, parent_context = nil)
    return {} unless user
    participant_url = case parent_context
      when :profile
        user_profile_url(user)
      when nil, false
        user_url(user)
      else
        polymorphic_url([parent_context, user])
      end
    hash = {
      id: user.id,
      display_name: user.short_name,
      avatar_image_url: avatar_url_for_user(user, blank_fallback),
      html_url: participant_url
    }
    hash[:fake_student] = true if user.fake_student?
    hash
  end

  # optimization hint, currently user only needs to pull pseudonyms from the db
  # if a site admin is making the request or they can manage_students
  def user_json_is_admin?(context = @context, current_user = @current_user)
    return false if context.nil? || current_user.nil?
    @user_json_is_admin ||= {}
    @user_json_is_admin[[context.class.name, context.global_id, current_user.global_id]] ||= (
      if context.is_a?(::UserProfile)
        permissions_context = permissions_account = @domain_root_account
      else
        permissions_context = context
        permissions_account = context.is_a?(Account) ? context : context.account
      end
      !!(
        permissions_context.grants_right?(current_user, :manage_students) ||
        permissions_account.membership_for_user(current_user) ||
        permissions_account.root_account.grants_any_right?(current_user, :manage_sis, :read_sis)
      )
    )
  end

  API_ENROLLMENT_JSON_OPTS = [:id,
                              :root_account_id,
                              :user_id,
                              :course_id,
                              :course_section_id,
                              :associated_user_id,
                              :limit_privileges_to_course_section,
                              :workflow_state,
                              :updated_at,
                              :created_at,
                              :start_at,
                              :end_at,
                              :type]

  def enrollment_json(enrollment, user, session, includes = [], opts = {})
    api_json(enrollment, user, session, :only => API_ENROLLMENT_JSON_OPTS).tap do |json|
      json[:enrollment_state] = json.delete('workflow_state')
      json[:role] = enrollment.role.name
      json[:role_id] = enrollment.role_id
      json[:last_activity_at] = enrollment.last_activity_at
      json[:total_activity_time] = enrollment.total_activity_time
      if enrollment.root_account.grants_right?(user, session, :manage_sis)
        json[:sis_import_id] = enrollment.sis_batch_id
      end
      if enrollment.student?
        json[:grades] = {
          :html_url => course_student_grades_url(enrollment.course_id, enrollment.user_id),
        }

        if has_grade_permissions?(user, enrollment)
          if opts[:grading_period]
            student_id = user.id
            if enrollment.is_a? StudentEnrollment
              student_id = enrollment.student.id
            end

            course = enrollment.course
            gc = GradeCalculator.new(student_id, course,
                                     grading_period: opts[:grading_period])
            ((current, _), (final, _)) = gc.compute_scores.first
            json[:grades][:current_score] = current[:grade]
            json[:grades][:current_grade] = course.score_to_grade(current[:grade])
            json[:grades][:final_score] = final[:grade]
            json[:grades][:final_grade] = course.score_to_grade(final[:grade])
          else
            %w{current_score final_score current_grade final_grade}.each do |method|
              json[:grades][method.to_sym] = enrollment.send("computed_#{method}")
            end
          end
        end
      end
      if @domain_root_account.grants_any_right?(@current_user, :read_sis, :manage_sis)
        json[:sis_source_id] = enrollment.sis_source_id
        json[:sis_course_id] = enrollment.course.sis_source_id
        json[:course_integration_id] = enrollment.course.integration_id
        json[:sis_section_id] = enrollment.course_section.sis_source_id
        json[:section_integration_id] = enrollment.course_section.integration_id
      end
      json[:html_url] = course_user_url(enrollment.course_id, enrollment.user_id)
      user_includes = includes.include?('avatar_url') ? ['avatar_url'] : []
      json[:user] = user_json(enrollment.user, user, session, user_includes) if includes.include?(:user)
      if includes.include?('locked')
        lockedbysis = enrollment.defined_by_sis?
        lockedbysis &&= !enrollment.course.account.grants_right?(@current_user, session, :manage_account_settings)
        json[:locked] = lockedbysis
      end
      if includes.include?('observed_users') && enrollment.observer? && enrollment.associated_user && !enrollment.associated_user.deleted?
        json[:observed_user] = user_json(enrollment.associated_user, user, session, user_includes, @context, enrollment.associated_user.not_ended_enrollments.all_student.shard(enrollment).where(:course_id => enrollment.course_id))
      end
      if includes.include?('can_be_removed')
        json[:can_be_removed] = (!enrollment.defined_by_sis? || context.grants_right?(@current_user, session, :manage_account_settings)) &&
                                  enrollment.can_be_deleted_by(@current_user, @context, session)
      end
    end
  end

  protected
  def has_grade_permissions?(user, enrollment)
    course = enrollment.course

    (user.id == enrollment.user_id && !course.hide_final_grades?) ||
     course.grants_any_right?(user, :manage_grades, :view_all_grades)
  end
end
