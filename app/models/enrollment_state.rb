# frozen_string_literal: true

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

class EnrollmentState < ActiveRecord::Base
  # a 1-1 table with enrollments
  # that was really only a separate table because enrollments had a billion columns already
  # and the data here was going to have a lot of churn too

  # anyways, determining whether an enrollment actually grants any useful permissions
  # depends on a complicated chain of dates and states stored on other models
  # (and how those dates compare to _now_)
  # e.g. an enrollment can have an "active" workflow_state but if the term was set to end last week
  # the user won't be considered active in the course anymore (i.e. "soft"-concluded)

  # TL;DR: this table acts as a fairly-reliable cache
  # (date triggers are resolved within ~5 minutes typically)
  # so we can quickly determine frd permissions
  # and build simple queries (e.g. use course.enrollments.active_by_date
  # instead of pulling all potentially active enrollments and filtering in-app)

  extend RootAccountResolver

  belongs_to :enrollment, inverse_of: :enrollment_state

  attr_accessor :skip_touch_user, :user_needs_touch, :is_direct_recalculation
  validates_presence_of :enrollment_id

  resolves_root_account through: :enrollment

  self.primary_key = 'enrollment_id'

  def hash
    global_enrollment_id.hash
  end

  # check if we've manually marked the enrollment state as potentially out of date (or if the stored date trigger has past)
  def state_needs_recalculation?
    !self.state_is_current? || self.state_valid_until && self.state_valid_until < Time.now
  end

  def ensure_current_state
    GuardRail.activate(:primary) do
      retry_count = 0
      begin
        self.recalculate_state if self.state_needs_recalculation? || retry_count > 0 # force double-checking on lock conflict
        self.recalculate_access if !self.access_is_current? || retry_count > 0
        self.save! if self.changed?
      rescue ActiveRecord::StaleObjectError
        # retry up to five times, otherwise return current (stale) data

        self.enrollment.association(:enrollment_state).target = nil # don't cache an old enrollment state, just in case
        self.reload

        retry_count += 1
        retry if retry_count < 5

        logger.error { "Failed to evaluate stale enrollment state: #{self.inspect}" }
      end
    end
  end

  # tweak the new state (in a handful of cases) into a symbol compatible with older enrollment state checks
  # - a locked down enrollment is basically the same as a inactive one
  # - an invitation in a course yet to start is functionally identical to an invitation in a started course
  # - :accepted is kind of silly, but it's how the old code signified an active enrollment in a course that hadn't started
  def get_effective_state
    self.ensure_current_state

    if restricted_access?
      :inactive
    elsif self.state == 'pending_invited'
      :invited
    elsif self.state == 'pending_active'
      :accepted
    else
      self.state.to_sym
    end
  end

  def get_display_state
    self.ensure_current_state

    if pending?
      :pending
    else
      self.state.to_sym
    end
  end

  def pending?
    %w{pending_active pending_invited creation_pending}.include?(self.state)
  end

  def recalculate_state
    self.state_valid_until = nil
    self.state_started_at = nil

    wf_state = self.enrollment.workflow_state
    invited_or_active = %w{invited active}.include?(wf_state)

    if invited_or_active
      if self.enrollment.course.completed?
        self.state = 'completed'
      else
        self.calculate_state_based_on_dates
      end
    else
      self.state = wf_state
    end
    self.state_is_current = true

    if self.state_changed? && self.enrollment.view_restrictable?
      self.access_is_current = false
    end

    if self.state_changed?
      self.user_needs_touch = true
      unless self.skip_touch_user
        self.class.connection.after_transaction_commit do
          self.enrollment.user.touch unless User.skip_touch_for_type?(:enrollments)
          self.enrollment.user.clear_cache_key(:enrollments)
        end
      end
    end
  end

  # TL;DR an enrollment can have its start and end dates determined in a variety of places
  # (see Canvas::Builders::EnrollmentDateBuilder for more details)
  # so this translates the current enrollment's workflow_state depending
  # whether we're currently before the start, after the end, or between the two
  def calculate_state_based_on_dates
    wf_state = self.enrollment.workflow_state
    ranges = self.enrollment.enrollment_dates
    now = Time.now

    # start_at <= now <= end_at, allowing for open ranges on either end
    if range = ranges.detect{|start_at, end_at| (start_at || now) <= now && now <= (end_at || now) }
      # we're in the middle of the start-end so the state is just the same as the workflow state
      self.state = wf_state
      start_at, end_at = range
      self.state_started_at = start_at
      self.state_valid_until = end_at # stores the next date trigger
    else
      global_start_at = ranges.map(&:compact).map(&:min).compact.min

      if !global_start_at
        # Not strictly within any range so no translation needed
        self.state = wf_state
      elsif global_start_at < now
        # we've past the end date so no matter what the state was, we're "completed" now
        self.state_started_at = ranges.map(&:last).compact.min
        self.state = 'completed'
      elsif self.enrollment.fake_student? # Allow student view students to use the course before the term starts
        self.state = wf_state
      else
        # the course has yet to begin for the enrollment
        self.state_valid_until = global_start_at # store the date when that will change
        if self.enrollment.view_restrictable?
          # these enrollment states mean they still can't participate yet even if they've accepted it,
          # but should be able to view just like an invited enrollment
          if wf_state == 'active'
            self.state = 'pending_active'
          else
            self.state = 'pending_invited'
          end
        else
          # admin user restricted by term dates
          self.state = 'inactive'
        end
      end
    end
  end

  # normally if you're part of a course that hasn't started yet or has already finished
  # you can still access the course in a "view-only" mode
  # but courses/accounts can disable this
  def recalculate_access
    if self.enrollment.view_restrictable?
      self.restricted_access =
        if self.pending?
          self.enrollment.restrict_future_view?
        elsif self.state == 'completed'
          self.enrollment.restrict_past_view?
        else
          false
        end
    else
      self.restricted_access = false
    end
    self.access_is_current = true
  end

  # ********************
  # The rest of these class-level methods keep the database state up to date when dates and access settings are changed elsewhere

  def self.enrollments_needing_calculation(scope=Enrollment.all)
    scope.joins(:enrollment_state).
      where("enrollment_states.state_is_current = ? OR enrollment_states.access_is_current = ?", false, false)
  end

  def self.process_states_in_ranges(start_at, end_at, enrollment_scope=Enrollment.all)
    Enrollment.find_ids_in_ranges(:start_at => start_at, :end_at => end_at, :batch_size => 250) do |min_id, max_id|
      process_states_for(enrollments_needing_calculation(enrollment_scope).where(:id => min_id..max_id))
    end
  end

  def self.process_term_states_in_ranges(start_at, end_at, term, enrollment_type=nil)
    scope = term.enrollments
    scope = scope.where(:type => enrollment_type) if enrollment_type
    process_states_in_ranges(start_at, end_at, scope)
  end

  def self.process_account_states_in_ranges(start_at, end_at, account_ids)
    process_states_in_ranges(start_at, end_at, enrollments_for_account_ids(account_ids))
  end

  def self.process_states_for_ids(enrollment_ids)
    process_states_for(Enrollment.where(:id => enrollment_ids).to_a)
  end

  def self.process_states_for(enrollments)
    enrollments = Array(enrollments)
    Canvas::Builders::EnrollmentDateBuilder.preload(enrollments, false)

    enrollments.each do |enrollment|
      enrollment.enrollment_state.skip_touch_user = true
      update_enrollment(enrollment)
    end

    user_ids_to_touch = enrollments.select{|e| e.enrollment_state.user_needs_touch}.map(&:user_id)
    if user_ids_to_touch.any?
      User.touch_and_clear_cache_keys(user_ids_to_touch, :enrollments)
    end
  end

  def self.update_enrollment(enrollment)
    enrollment.enrollment_state.ensure_current_state
  end

  INVALIDATEABLE_STATES = %w{pending_invited pending_active invited active completed inactive}.freeze # don't worry about creation_pending or rejected, etc
  def self.invalidate_states(enrollment_scope)
    EnrollmentState.where(:enrollment_id => enrollment_scope, :state => INVALIDATEABLE_STATES).
      update_all(["lock_version = COALESCE(lock_version, 0) + 1, state_is_current = ?", false])
  end

  def self.invalidate_states_and_access(enrollment_scope)
    EnrollmentState.where(:enrollment_id => enrollment_scope, :state => INVALIDATEABLE_STATES).
      update_all(["lock_version = COALESCE(lock_version, 0) + 1, state_is_current = ?, access_is_current = ?", false, false])
  end

  def self.force_recalculation(enrollment_ids, strand: nil)
    if enrollment_ids.any?
      EnrollmentState.where(:enrollment_id => enrollment_ids).
        update_all(["lock_version = COALESCE(lock_version, 0) + 1, state_is_current = ?", false])
      args = strand ? {n_strand: strand} : {}
      EnrollmentState.send_later_if_production_enqueue_args(:process_states_for_ids, args, enrollment_ids)
    end
  end

  def self.invalidate_access(enrollment_scope, states_to_update)
    EnrollmentState.where(:enrollment_id => enrollment_scope, :state => states_to_update).
      update_all(["lock_version = COALESCE(lock_version, 0) + 1, access_is_current = ?", false])
  end

  def self.enrollments_for_account_ids(account_ids)
    Enrollment.joins(:course).where(:courses => {:account_id => account_ids}).where(:type => %w{StudentEnrollment ObserverEnrollment})
  end

  ENROLLMENT_BATCH_SIZE = 1_000

  def self.invalidate_states_for_term(term, enrollment_type=nil)
    # invalidate and re-queue individual jobs for reprocessing because it might be too big to do all at once
    scope = term.enrollments
    scope = scope.where(:type => enrollment_type) if enrollment_type
    scope.find_ids_in_ranges(:batch_size => ENROLLMENT_BATCH_SIZE) do |min_id, max_id|
      if invalidate_states(scope.where(:id => min_id..max_id)) > 0
        EnrollmentState.send_later_if_production_enqueue_args(:process_term_states_in_ranges, {
          :priority => Delayed::LOW_PRIORITY,
          :n_strand => ['invalidate_states_for_term', term.global_root_account_id]
        }, min_id, max_id, term, enrollment_type)
      end
    end
  end

  def self.invalidate_states_for_course_or_section(course_or_section, invalidate_access: false)
    scope = course_or_section.enrollments
    if (invalidate_access ? invalidate_states_and_access(scope) : invalidate_states(scope)) > 0
      process_states_for(enrollments_needing_calculation(scope))
    end
  end

  def self.access_states_to_update(changed_keys)
    states_to_update = []
    # only need to invalidate access for future students if future access changed, etc
    states_to_update += ['pending_invited', 'pending_active'] if changed_keys.include?(:restrict_student_future_view)
    states_to_update += ['completed'] if changed_keys.include?(:restrict_student_past_view)
    states_to_update
  end

  def self.invalidate_access_for_accounts(account_ids, changed_keys)
    states_to_update = access_states_to_update(changed_keys)
    enrollments_for_account_ids(account_ids).find_ids_in_ranges(:batch_size => ENROLLMENT_BATCH_SIZE) do |min_id, max_id|
      scope = enrollments_for_account_ids(account_ids).where(:id => min_id..max_id)
      if invalidate_access(scope, states_to_update) > 0
        EnrollmentState.send_later_if_production_enqueue_args(:process_account_states_in_ranges, {
          priority: Delayed::LOW_PRIORITY,
          n_strand: ['invalidate_access_for_accounts', Shard.current.id]
        }, min_id, max_id, account_ids)
      end
    end
  end

  def self.invalidate_access_for_course(course, changed_keys)
    states_to_update = access_states_to_update(changed_keys)
    scope = course.enrollments.where(:type => %w{StudentEnrollment ObserverEnrollment})
    if invalidate_access(scope, states_to_update) > 0
      process_states_for(enrollments_needing_calculation(scope))
    end
  end

  # called every ~5 minutes by a periodic delayed job
  def self.recalculate_expired_states
    while (enrollments = Enrollment.joins(:enrollment_state).where("enrollment_states.state_valid_until IS NOT NULL AND
           enrollment_states.state_valid_until < ?", Time.now.utc).limit(250).to_a) && enrollments.any?
      process_states_for(enrollments)
    end
  end
end
