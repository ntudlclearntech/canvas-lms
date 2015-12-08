# -*- coding: utf-8 -*-
#
# Copyright (C) 2011 - 2013 Instructure, Inc.
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

require 'atom'

# Force loaded so that it will be in ActiveRecord::Base.descendants for switchman to use
require_dependency 'assignment_student_visibility'

class DiscussionTopic < ActiveRecord::Base

  include Workflow
  include SendToStream
  include HasContentTags
  include CopyAuthorizedLinks
  include TextHelper
  include HtmlTextHelper
  include ContextModuleItem
  include SearchTermHelper

  attr_accessible(
    :title, :message, :user, :delayed_post_at, :lock_at, :assignment,
    :plaintext_message, :podcast_enabled, :podcast_has_student_posts,
    :require_initial_post, :threaded, :discussion_type, :context, :pinned, :locked,
    :group_category, :allow_rating, :only_graders_can_rate, :sort_by_rating
  )
  attr_accessor :user_has_posted, :saved_by

  module DiscussionTypes
    SIDE_COMMENT = 'side_comment'
    THREADED     = 'threaded'
    FLAT         = 'flat'
    TYPES        = DiscussionTypes.constants.map { |c| DiscussionTypes.const_get(c) }
  end

  attr_readonly :context_id, :context_type, :user_id

  has_many :discussion_entries, -> { order(:created_at) }, dependent: :destroy
  has_many :rated_discussion_entries, -> { order(
    ['COALESCE(parent_id, 0)', 'COALESCE(rating_sum, 0) DESC', :created_at]) }, class_name: 'DiscussionEntry'
  has_many :root_discussion_entries, -> { preload(:user).where("discussion_entries.parent_id IS NULL AND discussion_entries.workflow_state<>'deleted'") }, class_name: 'DiscussionEntry'
  has_one :external_feed_entry, :as => :asset
  belongs_to :external_feed
  belongs_to :context, :polymorphic => true
  validates_inclusion_of :context_type, :allow_nil => true, :in => ['Course', 'Group']
  belongs_to :attachment
  belongs_to :assignment
  belongs_to :editor, :class_name => 'User'
  belongs_to :old_assignment, :class_name => 'Assignment'
  belongs_to :root_topic, :class_name => 'DiscussionTopic'
  belongs_to :group_category
  has_many :child_topics, :class_name => 'DiscussionTopic', :foreign_key => :root_topic_id, :dependent => :destroy
  has_many :discussion_topic_participants, :dependent => :destroy
  has_many :discussion_entry_participants, :through => :discussion_entries

  has_many :assignment_student_visibilities, :through => :assignment

  belongs_to :user

  EXPORTABLE_ATTRIBUTES = [
    :id, :title, :message, :context_id, :context_type, :type, :user_id, :workflow_state, :last_reply_at, :created_at, :updated_at, :delayed_post_at, :posted_at, :assignment_id,
    :attachment_id, :deleted_at, :root_topic_id, :could_be_locked, :cloned_item_id, :context_code, :position, :subtopics_refreshed_at, :last_assignment_id, :external_feed_id,
    :editor_id, :podcast_enabled, :podcast_has_student_posts, :require_initial_post, :discussion_type, :lock_at, :pinned, :locked
  ]

  EXPORTABLE_ASSOCIATIONS = [:discussion_entries, :external_feed_entry, :external_feed, :context, :assignment, :attachment, :editor, :root_topic, :child_topics, :discussion_entry_participants, :user]

  validates_presence_of :context_id, :context_type
  validates_inclusion_of :discussion_type, :in => DiscussionTypes::TYPES
  validates_length_of :message, :maximum => maximum_long_text_length, :allow_nil => true, :allow_blank => true
  validates_length_of :title, :maximum => maximum_string_length, :allow_nil => true
  validate :validate_draft_state_change, :if => :workflow_state_changed?

  sanitize_field :message, CanvasSanitize::SANITIZE
  copy_authorized_links(:message) { [self.context, nil] }
  acts_as_list scope: { context: self, pinned: true }

  before_create :initialize_last_reply_at
  before_save :default_values
  before_save :set_schedule_delayed_transitions
  after_save :update_assignment
  after_save :update_subtopics
  after_save :touch_context
  after_save :schedule_delayed_transitions
  after_save :update_materialized_view_if_changed
  after_update :clear_streams_if_not_published
  after_create :create_participant
  after_create :create_materialized_view

  def threaded=(v)
    self.discussion_type = Canvas::Plugin.value_to_boolean(v) ? DiscussionTypes::THREADED : DiscussionTypes::SIDE_COMMENT
  end

  def threaded?
    self.discussion_type == DiscussionTypes::THREADED
  end
  alias :threaded :threaded?

  def discussion_type
    read_attribute(:discussion_type) || DiscussionTypes::SIDE_COMMENT
  end

  def validate_draft_state_change
    old_draft_state, new_draft_state = self.changes['workflow_state']
    return if old_draft_state == new_draft_state
    if new_draft_state == 'unpublished' && !can_unpublish?
      self.errors.add :workflow_state, I18n.t('#discussion_topics.error_draft_state_with_posts',
                                              "This topic cannot be set to draft state because it contains posts.")
    end
  end

  def default_values
    self.context_code = "#{self.context_type.underscore}_#{self.context_id}"
    self.title ||= t '#discussion_topic.default_title', "No Title"
    self.discussion_type = DiscussionTypes::SIDE_COMMENT if !read_attribute(:discussion_type)
    @content_changed = self.message_changed? || self.title_changed?
    if self.assignment_id != self.assignment_id_was
      @old_assignment_id = self.assignment_id_was
    end
    if self.assignment_id
      self.assignment_id = nil unless (self.assignment && self.assignment.context == self.context) || (self.root_topic && self.root_topic.assignment_id == self.assignment_id)
      self.old_assignment_id = self.assignment_id if self.assignment_id
    end
    if self.has_group_category?
      self.subtopics_refreshed_at ||= Time.parse("Jan 1 2000")
    end
  end
  protected :default_values

  def has_group_category?
    !!self.group_category_id
  end

  def set_schedule_delayed_transitions
    if self.delayed_post_at? && self.delayed_post_at_changed?
      @should_schedule_delayed_post = true
      self.workflow_state = 'post_delayed' if [:migration, :after_migration].include?(self.saved_by) && self.delayed_post_at > Time.now
    end
    if self.lock_at && self.lock_at_changed?
      @should_schedule_lock_at = true
      self.locked = false if [:migration, :after_migration].include?(self.saved_by) && self.lock_at > Time.now
    end

    true
  end

  def update_materialized_view_if_changed
    if self.sort_by_rating_changed?
      update_materialized_view
    end
  end

  def schedule_delayed_transitions
    return if self.saved_by == :migration

    self.send_at(self.delayed_post_at, :update_based_on_date) if @should_schedule_delayed_post
    self.send_at(self.lock_at, :update_based_on_date) if @should_schedule_lock_at
    # need to clear these in case we do a save whilst saving (e.g.
    # Announcement#respect_context_lock_rules), so as to avoid the dreaded
    # double delayed job ಠ_ಠ
    @should_schedule_delayed_post = nil
    @should_schedule_lock_at = nil
  end

  def update_subtopics
    if !self.deleted? && (self.has_group_category? || !!self.group_category_id_was)
      send_later_if_production :refresh_subtopics
    end
  end

  def refresh_subtopics
    if self.root_topic_id.blank?
      # delete any lingering child topics
      self.shard.activate do
        DiscussionTopic.where(:root_topic_id => self).update_all(:workflow_state => "deleted")
      end
    end
    return if self.deleted?

    category = self.group_category
    return unless category && self.root_topic_id.blank?
    category.groups.active.each do |group|
      group.shard.activate do
        DiscussionTopic.unique_constraint_retry do
          topic = DiscussionTopic.where(:context_id => group, :context_type => 'Group', :root_topic_id => self).first
          topic ||= group.discussion_topics.build{ |dt| dt.root_topic = self }
          topic.message = self.message
          topic.title = "#{self.title} - #{group.name}"
          topic.assignment_id = self.assignment_id
          topic.attachment_id = self.attachment_id
          topic.group_category_id = self.group_category_id
          topic.user_id = self.user_id
          topic.discussion_type = self.discussion_type
          topic.workflow_state = self.workflow_state
          topic.allow_rating = self.allow_rating
          topic.only_graders_can_rate = self.only_graders_can_rate
          topic.sort_by_rating = self.sort_by_rating
          topic.save if topic.changed?
          topic
        end
      end
    end
  end

  attr_accessor :saved_by
  def update_assignment
    return if self.deleted?
    if !self.assignment_id && @old_assignment_id
      self.context_module_tags.each { |tag| tag.confirm_valid_module_requirements }
    end
    if @old_assignment_id
      Assignment.where(:id => @old_assignment_id, :context_id => self.context_id, :context_type => self.context_type, :submission_types => 'discussion_topic').update_all(:workflow_state => 'deleted', :updated_at => Time.now.utc)
      ContentTag.delete_for(Assignment.find(@old_assignment_id)) if @old_assignment_id
    elsif self.assignment && @saved_by != :assignment && !self.root_topic_id
      self.assignment.title = self.title
      self.assignment.description = self.message
      self.assignment.submission_types = "discussion_topic"
      self.assignment.saved_by = :discussion_topic
      self.assignment.workflow_state = 'published' if self.assignment.deleted?
      unless is_announcement
        self.assignment.workflow_state = published? ? 'published' : 'unpublished'
      end
      self.assignment.save
    end

    # make sure that if the topic has a new assignment (either by going from
    # ungraded to graded, or from one assignment to another; we ignore the
    # transition from graded to ungraded) we acknowledge that the users that
    # have posted have contributed to the topic
    if self.assignment_id && self.assignment_id_changed?
      posters.each{ |user| self.context_module_action(user, :contributed) }
    end
  end
  protected :update_assignment

  def restore_old_assignment
    return nil unless self.old_assignment && self.old_assignment.deleted?
    self.old_assignment.workflow_state = 'published'
    self.old_assignment.saved_by = :discussion_topic
    self.old_assignment.save(:validate => false)
    self.old_assignment
  end

  def is_announcement; false end

  def root_topic?
    !self.root_topic_id && self.has_group_category?
  end

  # only the root level entries
  def discussion_subentries
    self.root_discussion_entries
  end

  # count of all active discussion_entries
  def discussion_subentry_count
    discussion_entries.active.count
  end

  def for_assignment?
    self.assignment && self.assignment.submission_types =~ /discussion_topic/
  end

  def for_group_discussion?
    self.has_group_category? && self.root_topic?
  end

  def plaintext_message=(val)
    self.message = format_message(strip_tags(val)).first
  end

  def plaintext_message
    truncate_html(self.message, :max_length => 250)
  end

  def create_participant
    self.discussion_topic_participants.create(:user => self.user, :workflow_state => "read", :unread_entry_count => 0, :subscribed => !subscription_hold(self.user, nil, nil)) if self.user
  end

  def update_materialized_view
    # kick off building of the view
    DiscussionTopic::MaterializedView.for(self).update_materialized_view
  end

  def group_category_deleted_with_entries?
    self.group_category.try(:deleted_at?) && !can_group?
  end

  # If no join record exists, assume all discussion enrties are unread, and
  # that a join record will be created the first time one is marked as read.
  attr_accessor :current_user
  def read_state(current_user = nil)
    current_user ||= self.current_user
    return "read" unless current_user #default for logged out user
    uid = current_user.is_a?(User) ? current_user.id : current_user
    dtp = discussion_topic_participants.loaded? ?
      discussion_topic_participants.detect{ |dtp| dtp.user_id == uid } :
      discussion_topic_participants.where(user_id: uid).select(:workflow_state).first
    dtp.try(:workflow_state) || "unread"
  end

  def read?(current_user = nil)
    read_state(current_user) == "read"
  end

  def unread?(current_user = nil)
    !read?(current_user)
  end

  def change_read_state(new_state, current_user = nil)
    current_user ||= self.current_user
    return nil unless current_user
    self.context_module_action(current_user, :read) if new_state == 'read'

    return true if new_state == self.read_state(current_user)

    StreamItem.update_read_state_for_asset(self, new_state, current_user.id)
    self.update_or_create_participant(:current_user => current_user, :new_state => new_state)
  end

  def change_all_read_state(new_state, current_user = nil, opts = {})
    current_user ||= self.current_user
    return unless current_user

    update_fields = { workflow_state: new_state }
    update_fields[:forced_read_state] = opts[:forced] if opts.has_key?(:forced)

    transaction do
      update_stream_item_state(current_user, new_state)
      update_participants_read_state(current_user, new_state, update_fields)
    end
  end

  def update_stream_item_state(current_user, new_state)
    self.context_module_action(current_user, :read) if new_state == 'read'
    StreamItem.update_read_state_for_asset(self, new_state, current_user.id)
  end
  protected :update_stream_item_state

  def update_participants_read_state(current_user, new_state, update_fields)
    entry_ids = discussion_entries.pluck(:id)
    existing_entry_participants = DiscussionEntryParticipant.existing_participants(current_user, entry_ids).to_a
    update_or_create_participant(current_user: current_user,
      new_state: new_state,
      new_count: new_state == 'unread' ? self.default_unread_count : 0)

    if entry_ids.present? && existing_entry_participants.present?
      update_existing_participants_read_state(current_user, update_fields, existing_entry_participants)
    end

    if new_state == "read"
      new_entry_ids = entry_ids - existing_entry_participants.map(&:discussion_entry_id)
      bulk_insert_new_participants(new_entry_ids, current_user, update_fields)
    end
  end
  protected :update_participants_read_state

  def update_existing_participants_read_state(current_user, update_fields, existing_entry_participants)
    existing_ids = existing_entry_participants.map(&:id)
    DiscussionEntryParticipant.where(id: existing_ids).update_all(update_fields)
  end
  protected :update_existing_participants_read_state

  def bulk_insert_new_participants(new_entry_ids, current_user, update_fields)
    records = new_entry_ids.map do |entry_id|
      { discussion_entry_id: entry_id, user_id: current_user.id }.merge(update_fields)
    end
    DiscussionEntryParticipant.bulk_insert(records)
  end
  protected :bulk_insert_new_participants

  def default_unread_count
    self.discussion_entries.active.count
  end

  def unread_count(current_user = nil)
    current_user ||= self.current_user
    return 0 unless current_user # default for logged out users
    Shackles.activate(:master) do
      topic_participant = discussion_topic_participants.lock.where(user_id: current_user).select(:unread_entry_count).first
      topic_participant.try(:unread_entry_count) || self.default_unread_count
    end
  end

  # Cases where you CAN'T subscribe:
  #  - initial post is required and you haven't made one
  #  - it's an announcement
  #  - this is a root level graded group discussion and you aren't in any of the groups
  #  - this is group level discussion and you aren't in the group
  def subscription_hold(user, context_enrollment, session)
    return nil unless user
    case
    when initial_post_required?(user, context_enrollment, session)
      :initial_post_required
    when root_topic? && !child_topic_for(user)
      :not_in_group_set
    when context.is_a?(Group) && !context.has_member?(user)
      :not_in_group
    end
  end

  def subscribed?(current_user = nil)
    current_user ||= self.current_user
    return false unless current_user # default for logged out user

    if root_topic?
      participant = DiscussionTopicParticipant.where(user_id: current_user.id,
        discussion_topic_id: child_topics.pluck(:id)).first
    end
    participant ||= discussion_topic_participants.where(:user_id => current_user.id).first

    if participant
      if participant.subscribed.nil?
        # if there is no explicit subscription, assume the author and posters
        # are subscribed, everyone else is not subscribed
        (current_user == user || participant.discussion_topic.posters.include?(current_user)) && !participant.discussion_topic.subscription_hold(current_user, nil, nil)
      else
        participant.subscribed
      end
    else
      current_user == user && !subscription_hold(current_user, nil, nil)
    end
  end

  def subscribe(current_user = nil)
    change_subscribed_state(true, current_user)
  end

  def unsubscribe(current_user = nil)
    change_subscribed_state(false, current_user)
  end

  def change_subscribed_state(new_state, current_user = nil)
    current_user ||= self.current_user
    return unless current_user
    return true if subscribed?(current_user) == new_state

    if root_topic?
      change_child_topic_subscribed_state(new_state, current_user)
    else
      update_or_create_participant(:current_user => current_user, :subscribed => new_state)
    end
  end

  def child_topic_for(user)
    group_ids = user.group_memberships.active.pluck(:group_id) &
      context.groups.active.pluck(:id)
    child_topics.where(context_id: group_ids, context_type: 'Group').first
  end

  def change_child_topic_subscribed_state(new_state, current_user)
    topic = child_topic_for(current_user)
    topic.update_or_create_participant(current_user: current_user, subscribed: new_state)
  end
  protected :change_child_topic_subscribed_state

  def update_or_create_participant(opts={})
    current_user = opts[:current_user] || self.current_user
    return nil unless current_user

    topic_participant = nil
    Shackles.activate(:master) do
      DiscussionTopic.uncached do
        DiscussionTopic.unique_constraint_retry do
          topic_participant = self.discussion_topic_participants.where(:user_id => current_user).lock.first
          topic_participant ||= self.discussion_topic_participants.build(:user => current_user,
                                                                         :unread_entry_count => self.unread_count(current_user),
                                                                         :workflow_state => "unread",
                                                                         :subscribed => current_user == user && !subscription_hold(current_user, nil, nil))
          topic_participant.workflow_state = opts[:new_state] if opts[:new_state]
          topic_participant.unread_entry_count += opts[:offset] if opts[:offset] && opts[:offset] != 0
          topic_participant.unread_entry_count = opts[:new_count] if opts[:new_count]
          topic_participant.subscribed = opts[:subscribed] if opts.has_key?(:subscribed)
          topic_participant.save
        end
      end
    end
    topic_participant
  end

  scope :recent, -> { where("discussion_topics.last_reply_at>?", 2.weeks.ago).order("discussion_topics.last_reply_at DESC") }
  scope :only_discussion_topics, -> { where(:type => nil) }
  scope :for_subtopic_refreshing, -> { where("discussion_topics.subtopics_refreshed_at IS NOT NULL AND discussion_topics.subtopics_refreshed_at<discussion_topics.updated_at").order("discussion_topics.subtopics_refreshed_at") }
  scope :active, -> { where("discussion_topics.workflow_state<>'deleted'") }
  scope :for_context_codes, lambda { |codes| where(:context_code => codes) }

  scope :before, lambda { |date| where("discussion_topics.created_at<?", date) }

  scope :by_position, -> { order("discussion_topics.position ASC, discussion_topics.created_at DESC, discussion_topics.id DESC") }
  scope :by_position_legacy, -> { order("discussion_topics.position DESC, discussion_topics.created_at DESC, discussion_topics.id DESC") }
  scope :by_last_reply_at, -> { order("discussion_topics.last_reply_at DESC, discussion_topics.created_at DESC, discussion_topics.id DESC") }

  scope :by_posted_at, -> { order(<<-SQL)
      COALESCE(discussion_topics.delayed_post_at, discussion_topics.posted_at) DESC,
      discussion_topics.created_at DESC,
      discussion_topics.id DESC
    SQL
  }

  scope :visible_to_students_in_course_with_da, lambda { |user_ids, course_ids|
    without_assignment_in_course(course_ids).union(joins_assignment_student_visibilities(user_ids, course_ids))
  }

  scope :without_assignment_in_course, lambda { |course_ids|
    where(context_id: course_ids, context_type: "Course").where("discussion_topics.assignment_id IS NULL")
  }

  scope :joins_assignment_student_visibilities, lambda { |user_ids, course_ids|
    joins(:assignment_student_visibilities)
      .where(assignment_student_visibilities: { user_id: user_ids, course_id: course_ids })
  }

  alias_attribute :available_from, :delayed_post_at
  alias_attribute :unlock_at, :delayed_post_at
  alias_attribute :available_until, :lock_at

  def self.visible_ids_by_user(opts)
    # pluck id, assignment_id, and user_id from discussions joined with the SQL view
    plucked_visibilities = pluck_discussion_visibilities(opts).group_by{|r| r["user_id"]}
    # discussions without an assignment are visible to all, so add them into every students hash at the end
    ids_of_discussions_visible_to_all = self.without_assignment_in_course(opts[:course_id]).pluck(:id)
    # format to be hash of user_id's with array of discussion_ids: {1 => [2,3,4], 2 => [2,4]}
    opts[:user_id].reduce({}) do |vis_hash, student_id|
      vis_hash[student_id] = begin
        ids_from_pluck = (plucked_visibilities[student_id.to_s] || []).map{|r| r["id"]}
        ids_from_pluck.concat(ids_of_discussions_visible_to_all).map(&:to_i)
      end
      vis_hash
    end
  end

  def self.pluck_discussion_visibilities(opts)
    # once on Rails 4 change this to a multi-column pluck
    # and clean up reformatting in visible_ids_by_user
    connection.select_all(
      self.joins_assignment_student_visibilities(opts[:user_id],opts[:course_id]).
        select(["discussion_topics.id", "discussion_topics.assignment_id", "assignment_student_visibilities.user_id"])
    )
  end

  def should_lock_yet
    # not assignment or vdd aware! only use this to check the topic's own field!
    # you should be checking other lock statuses in addition to this one
    self.lock_at && self.lock_at < Time.now.utc
  end
  alias_method :not_available_anymore?, :should_lock_yet

  def should_not_post_yet
    # not assignment or vdd aware! only use this to check the topic's own field!
    # you should be checking other lock statuses in addition to this one
    self.delayed_post_at && self.delayed_post_at > Time.now.utc
  end
  alias_method :not_available_yet?, :should_not_post_yet

  # There may be delayed jobs that expect to call this to update the topic, so be sure to alias
  # the old method name if you change it
  def update_based_on_date
    transaction do
      reload lock: true # would call lock!, except, oops, workflow overwrote it :P
      lock if should_lock_yet
      delayed_post unless should_not_post_yet
    end
  end
  alias_method :try_posting_delayed, :update_based_on_date
  alias_method :auto_update_workflow, :update_based_on_date

  workflow do
    state :active
    state :unpublished
    state :post_delayed do
      event :delayed_post, :transitions_to => :active do
        self.last_reply_at = Time.now
        self.posted_at = Time.now
      end
      # with draft state, this means published. without, unpublished. so we really do support both events
    end
    state :deleted
  end

  def active?
    # using state instead of workflow_state so this works with new records
    self.state == :active || (!self.is_announcement && self.state == :post_delayed)
  end

  def publish
    self.workflow_state = 'active'
    self.last_reply_at = Time.now
    self.posted_at = Time.now
  end

  def publish!
    publish
    save!
  end

  def unpublish
    self.workflow_state = 'unpublished'
  end

  def unpublish!
    unpublish
    save!
  end

  def can_lock?
    !(self.assignment.try(:due_at) && self.assignment.due_at > Time.now)
  end

  def lock(opts = {})
    raise "cannot lock before due date" unless can_lock?
    self.locked = true
    save! unless opts[:without_save]
  end
  alias_method :lock!, :lock

  def unlock(opts = {})
    self.locked = false
    self.workflow_state = 'active' if self.workflow_state == 'locked'
    save! unless opts[:without_save]
  end
  alias_method :unlock!, :unlock

  # deprecated with draft state: use publish+available_[from|until] machinery instead
  # you probably want available?
  def locked?
    locked.nil? ? workflow_state == 'locked' : locked
  end

  def published?
    return false if workflow_state == 'unpublished'
    return false if workflow_state == 'post_delayed' && is_announcement
    true
  end

  def can_unpublish?(opts={})
    return @can_unpublish unless @can_unpublish.nil?

    @can_unpublish = begin
      if self.assignment
        !self.assignment.has_student_submissions?
      else
        student_ids = opts[:student_ids] || self.context.all_real_student_enrollments.select(:user_id)
        if self.for_group_discussion?
          !DiscussionEntry.active.where(user_id: student_ids, discussion_topic_id: child_topics).exists?
        else
          !self.discussion_entries.active.where(:user_id => student_ids).exists?
        end
      end
    end
  end
  attr_writer :can_unpublish

  def self.preload_can_unpublish(context, topics, assmnt_ids_with_subs=nil)
    return unless topics.any?
    assmnt_ids_with_subs ||= Assignment.assignment_ids_with_submissions(topics.map(&:assignment_id).compact)

    student_ids = context.all_real_student_enrollments.select(:user_id)
    topic_ids_with_entries = DiscussionEntry.active.where(discussion_topic_id: topics).
      where(:user_id => student_ids).uniq.pluck(:discussion_topic_id)
    topic_ids_with_entries += DiscussionTopic.where("root_topic_id IS NOT NULL").
      where(:id => topic_ids_with_entries).uniq.pluck(:root_topic_id)

    topics.each do |topic|
      if topic.assignment_id
        topic.can_unpublish = !(assmnt_ids_with_subs.include?(topic.assignment_id))
      else
        topic.can_unpublish = !(topic_ids_with_entries.include?(topic.id))
      end
    end
  end

  def can_group?(opts = {})
    can_unpublish?(opts)
  end

  def should_send_to_stream
    if !self.published?
      false
    elsif self.not_available_yet?
      false
    elsif self.cloned_item_id
      false
    elsif self.root_topic_id && self.has_group_category?
      false
    elsif self.assignment && self.assignment.submission_types == 'discussion_topic' && (!self.assignment.due_at || self.assignment.due_at > 1.week.from_now) # TODO: vdd
      false
    else
      true
    end
  end

  on_create_send_to_streams do
    if should_send_to_stream
      self.active_participants_with_visibility
    end
  end

  on_update_send_to_streams do
    check_state = !is_announcement ? 'unpublished' : 'post_delayed'
    became_active = workflow_state_was == check_state && workflow_state == 'active'
    if should_send_to_stream && (@content_changed || became_active)
      self.active_participants_with_visibility
    end
  end

  def clear_streams_if_not_published
    if !self.published?
      self.clear_stream_items
    end
  end

  def require_initial_post?
    self.require_initial_post || (self.root_topic && self.root_topic.require_initial_post)
  end

  def user_ids_who_have_posted_and_admins
    scope = DiscussionEntry.active.select(:user_id).uniq.where(:discussion_topic_id => self)
    ids = scope.pluck(:user_id)
    ids += self.context.admin_enrollments.active.pluck(:user_id) if self.context.respond_to?(:admin_enrollments)
    ids
  end

  def user_can_see_posts?(user, session=nil)
    return false unless user
    !self.require_initial_post? || self.grants_right?(user, session, :update) || user_ids_who_have_posted_and_admins.member?(user.id)
  end

  def reply_from(opts)
    raise IncomingMail::Errors::ReplyToDeletedDiscussion if self.deleted?
    raise IncomingMail::Errors::UnknownAddress if self.context.root_account.deleted?
    user = opts[:user]
    if opts[:html]
      message = opts[:html].strip
    else
      message = opts[:text].strip
      message = format_message(message).first
    end
    user = nil unless user && self.context.users.include?(user)
    if !user
      raise "Only context participants may reply to messages"
    elsif !message || message.empty?
      raise "Message body cannot be blank"
    elsif !self.grants_right?(user, :read)
      nil
    else
      entry = DiscussionEntry.new({
        :message => message,
        :discussion_topic => self,
        :user => user,
      })
      if !entry.grants_right?(user, :create)
        raise IncomingMail::Errors::ReplyToLockedTopic
      else
        entry.save!
        entry
      end
    end
  end

  alias_method :destroy!, :destroy
  def destroy
    ContentTag.delete_for(self)
    self.workflow_state = 'deleted'
    self.deleted_at = Time.now.utc
    self.save

    if self.for_assignment? && self.root_topic_id.blank?
      self.assignment.destroy unless self.assignment.deleted?
    end

    self.child_topics.each do |child|
      child.destroy
    end
  end

  def restore(from=nil)
    self.workflow_state = is_announcement ? 'active' : 'unpublished'
    self.save

    if from != :assignment && self.for_assignment? && self.root_topic_id.blank?
      self.assignment.restore(:discussion_topic)
    end

    self.child_topics.each do |child|
      child.restore
    end
  end

  def unlink_from(type)
    @saved_by = type
    if self.discussion_entries.empty?
      self.assignment = nil
      self.destroy
    else
      self.assignment = nil
      self.save
    end
    self.child_topics.each{|t| t.unlink_from(:assignment) }
  end

  def self.per_page
    10
  end

  def initialize_last_reply_at
    self.posted_at ||= Time.now.utc
    self.last_reply_at ||= Time.now.utc unless [:migration, :after_migration].include?(self.saved_by)
  end

  set_policy do
    given { |user| self.user && self.user == user }
    can :read

    given { |user| self.grants_right?(user, :read) }
    can :read_replies

    given { |user| self.user && self.user == user && self.visible_for?(user) && !self.locked_for?(user, :check_policies => true) && !context.concluded?}
    can :reply

    given { |user| self.user && self.user == user && self.available_for?(user) && context.user_can_manage_own_discussion_posts?(user) && context.grants_right?(user, :participate_as_student) }
    can :update

    given { |user| self.user && self.user == user and self.discussion_entries.active.empty? && self.available_for?(user) && !self.root_topic_id && context.user_can_manage_own_discussion_posts?(user) && context.grants_right?(user, :participate_as_student) }
    can :delete

    given { |user, session| self.active? && self.context.grants_right?(user, session, :read_forum) }
    can :read

    given { |user, session| !self.locked_for?(user, :check_policies => true) &&
        self.context.grants_right?(user, session, :post_to_forum) && self.visible_for?(user)}
    can :reply and can :read

    given { |user, session| self.context.grants_any_right?(user, session, :read_forum, :post_to_forum) && self.visible_for?(user)}
    can :read

    given { |user, session|
      !is_announcement &&
      context.grants_right?(user, session, :post_to_forum) &&
      context_allows_user_to_create?(user)
    }
    can :create

    given { |user, session| context.respond_to?(:allow_student_forum_attachments) && context.allow_student_forum_attachments && context.grants_right?(user, session, :post_to_forum) }
    can :attach

    given { |user, session| !self.root_topic_id && self.context.grants_right?(user, session, :moderate_forum) && self.available_for?(user) }
    can :update and can :delete and can :create and can :read and can :attach

    # Moderators can still modify content even in unavailable topics (*especially* unlocking them), but can't create new content
    given { |user, session| !self.root_topic_id && self.context.grants_right?(user, session, :moderate_forum) }
    can :update and can :delete and can :read and can :attach

    given { |user, session| self.root_topic && self.root_topic.grants_right?(user, session, :update) }
    can :update

    given { |user, session| self.root_topic && self.root_topic.grants_right?(user, session, :delete) }
    can :delete

    given { |user, session| self.root_topic && self.root_topic.grants_right?(user, session, :read) }
    can :read

    given do |user, session|
      self.allow_rating && (!self.only_graders_can_rate ||
                            self.context.grants_right?(user, session, :manage_grades))
    end
    can :rate
  end

  def self.context_allows_user_to_create?(context, user, session)
    new(context: context).grants_right?(user, session, :create)
  end

  def context_allows_user_to_create?(user)
    return true unless context.respond_to?(:allow_student_discussion_topics)
    return true unless context.user_is_student?(user)
    context.allow_student_discussion_topics
  end

  def discussion_topic_id
    self.id
  end

  def discussion_topic
    self
  end

  def to_atom(opts={})
    author_name = self.user.present? ? self.user.name : t('#discussion_topic.atom_no_author', "No Author")
    prefix = [self.is_announcement ? t('#titles.announcement', "Announcement") : t('#titles.discussion', "Discussion")]
    prefix << self.context.name if opts[:include_context]
    Atom::Entry.new do |entry|
      entry.title     = [before_label(prefix.to_sentence), self.title].join(" ")
      entry.authors  << Atom::Person.new(:name => author_name)
      entry.updated   = self.updated_at
      entry.published = self.created_at
      entry.id        = "tag:#{HostUrl.default_host},#{self.created_at.strftime("%Y-%m-%d")}:/discussion_topics/#{self.feed_code}"
      entry.links    << Atom::Link.new(:rel => 'alternate',
                                    :href => "http://#{HostUrl.context_host(self.context)}/#{context_url_prefix}/discussion_topics/#{self.id}")
      entry.content   = Atom::Content::Html.new(self.message || "")
    end
  end

  def context_prefix
    context_url_prefix
  end

  def context_module_action(user, action, points=nil)
    return self.root_topic.context_module_action(user, action, points) if self.root_topic
    tags_to_update = self.context_module_tags.to_a
    if self.for_assignment?
      tags_to_update += self.assignment.context_module_tags
      self.ensure_submission(user) if context.grants_right?(user, :participate_as_student) && assignment.visible_to_user?(user) && action == :contributed
    end
    tags_to_update.each { |tag| tag.context_module_action(user, action, points) }
  end

  def ensure_submission(user)
    submission = Submission.where(assignment_id: self.assignment_id, user_id: user).first
    return if submission && submission.submission_type == 'discussion_topic' && submission.workflow_state != 'unsubmitted'
    self.assignment.submit_homework(user, :submission_type => 'discussion_topic')
  end

  def send_notification_for_context?
    notification_context =
      if self.context.is_a?(Group) && self.context.context.is_a?(Course)
        self.context.context # we need to go deeper
      else
        self.context
      end
    notification_context.available? && !notification_context.concluded?
  end

  has_a_broadcast_policy

  set_broadcast_policy do |p|
    p.dispatch :new_discussion_topic
    p.to { active_participants_with_visibility - [user] }
    p.whenever { |record|
      record.send_notification_for_context? and
      ((record.just_created && record.active?) || record.changed_state(:active, !record.is_announcement ? :unpublished : :post_delayed))
    }
  end

  def delay_posting=(val); end

  def set_assignment=(val); end

  def participants(include_observers=false)
    participants = [ self.user ]
    participants += context.participants(include_observers)
    participants.compact.uniq
  end

  def active_participants(include_observers=false)
    if self.context.respond_to?(:available?) && !self.context.available? && self.context.respond_to?(:participating_admins)
      self.context.participating_admins
    else
      self.participants(include_observers)
    end
  end

  def course
    @course ||= context.is_a?(Group) ? context.context : context
  end

  def active_participants_with_visibility
    return active_participants if !self.for_assignment? || !course.feature_enabled?(:differentiated_assignments)
    users_with_visibility = AssignmentStudentVisibility.where(assignment_id: self.assignment_id, course_id: course.id).pluck(:user_id)

    admin_ids = course.participating_admins.pluck(:id)
    users_with_visibility.concat(admin_ids)

    # observers will not be returned, which is okay for the functions current use cases (but potentially not others)
    active_participants.select{|p| users_with_visibility.include?(p.id)}
  end

  def participating_users(user_ids)
    context.respond_to?(:participating_users) ? context.participating_users(user_ids) : User.find(user_ids)
  end

  def subscribers
    # this duplicates some logic from #subscribed? so we don't have to call
    # #posters for each legacy subscriber.
    sub_ids = discussion_topic_participants.where(:subscribed => true).pluck(:user_id)
    legacy_sub_ids = discussion_topic_participants.where(:subscribed => nil).pluck(:user_id)
    poster_ids = posters.map(&:id)
    legacy_sub_ids &= poster_ids
    sub_ids += legacy_sub_ids

    subscribed_users = participating_users(sub_ids)

    if course.feature_enabled?(:differentiated_assignments) && self.for_assignment?
      students_with_visibility = AssignmentStudentVisibility.where(course_id: course.id, assignment_id: assignment_id).pluck(:user_id)

      admin_ids = course.participating_admins.pluck(:id)
      observer_ids = course.participating_observers.pluck(:id)
      observed_students = ObserverEnrollment.observed_student_ids_by_observer_id(course, observer_ids)

      subscribed_users.select!{ |user|
        students_with_visibility.include?(user.id) || admin_ids.include?(user.id) ||
        # an observer with no students or one with students who have visibility
        (observed_students[user.id] && (observed_students[user.id] == [] || (observed_students[user.id] & students_with_visibility).any?))
      }
    end

    subscribed_users
  end

  def posters
    user_ids = discussion_entries.map(&:user_id).push(self.user_id).uniq
    participating_users(user_ids)
  end

  def user_name
    self.user ? self.user.name : nil
  end

  def available_from_for(user)
    if self.assignment
      self.assignment.overridden_for(user).unlock_at
    else
      self.available_from
    end
  end

  def available_for?(user, opts = {})
    return false if !published?
    return false if is_announcement && locked?
    !locked_for?(user, opts)
  end

  # Public: Determine if the given user can view this discussion topic.
  #
  # user - The user attempting to view the topic (default: nil).
  #
  # Returns a boolean.
  def visible_for?(user = nil)
    RequestCache.cache('discussion_visible_for', self, user) do
      # user is the topic's author
      return true if user == self.user

      # user is an admin in the context (teacher/ta/designer) OR
      # user is an account admin with appropriate permission
      return true if context.grants_any_right?(user, :manage, :read_course_content)

      # assignment exists and isnt assigned to user (differentiated assignments)
      if for_assignment? && !self.assignment.visible_to_user?(user)
        return false
      end

      # locked by context module
      if self.could_be_locked && locked_by_module_item?(user, true)
        return false
      end

      # topic is not published
      if !published?
        false
      elsif is_announcement && unlock_at = available_from_for(user)
      # unlock date exists and has passed
        unlock_at < Time.now.utc
      # everything else
      else
        true
      end
    end
  end

  # Public: Determine if the discussion topic is locked for a specific user. The topic is locked when the
  #         delayed_post_at is in the future or the group assignment is locked. This does not determine
  #         the visibility of the topic to the user, only that they are unable to reply.
  def locked_for?(user, opts={})
    return false if opts[:check_policies] && self.grants_right?(user, :update)
    return {:asset_string => self.asset_string} if self.locked?

    Rails.cache.fetch(locked_cache_key(user), :expires_in => 1.minute) do
      locked = false
      if (self.delayed_post_at && self.delayed_post_at > Time.now)
        locked = {:asset_string => self.asset_string, :unlock_at => self.delayed_post_at}
      elsif (self.lock_at && self.lock_at < Time.now)
        locked = {:asset_string => self.asset_string, :lock_at => self.lock_at, :can_view => true}
      elsif !opts[:skip_assignment] && (self.assignment && l = self.assignment.locked_for?(user, opts))
        locked = l
      elsif self.could_be_locked && item = locked_by_module_item?(user, opts[:deep_check_if_needed])
        locked = {:asset_string => self.asset_string, :context_module => item.context_module.attributes}
      elsif (self.root_topic && l = self.root_topic.locked_for?(user, opts))
        locked = l
      end
      locked
    end
  end

  def clear_locked_cache(user)
    super
    Rails.cache.delete(assignment.locked_cache_key(user)) if assignment
    Rails.cache.delete(root_topic.locked_cache_key(user)) if root_topic
  end

  def entries_for_feed(user, podcast_feed=false)
    return [] if !user_can_see_posts?(user)
    return [] if locked_for?(user, check_policies: true)

    entries = discussion_entries.active
    if podcast_feed && !podcast_has_student_posts && context.is_a?(Course)
      entries = entries.where(user_id: context.admins)
    end
    entries
  end

  def self.podcast_elements(messages, context)
    attachment_ids = []
    media_object_ids = []
    messages_hash = {}
    messages.each do |message|
      txt = (message.message || "")
      attachment_matches = txt.scan(/\/#{context.class.to_s.pluralize.underscore}\/#{context.id}\/files\/(\d+)\/download/)
      attachment_ids += (attachment_matches || []).map{|m| m[0] }
      media_object_matches = txt.scan(/media_comment_([\w\-]+)/)
      media_object_ids += (media_object_matches || []).map{|m| m[0] }
      (attachment_ids + media_object_ids).each do |id|
        messages_hash[id] ||= message
      end
    end

    media_object_ids = media_object_ids.uniq.compact
    attachment_ids = attachment_ids.uniq.compact
    attachments = attachment_ids.empty? ? [] : context.attachments.active.find_all_by_id(attachment_ids)
    attachments = attachments.select{|a| a.content_type && a.content_type.match(/(video|audio)/) }
    attachments.each do |attachment|
      attachment.podcast_associated_asset = messages_hash[attachment.id.to_s]
    end
    media_object_ids -= attachments.map{|a| a.media_entry_id}.compact # don't include media objects if the file is already included

    media_objects = media_object_ids.empty? ? [] : MediaObject.where(media_id: media_object_ids).to_a
    media_objects = media_objects.uniq(&:media_id)
    media_objects = media_objects.map do |media_object|
      if media_object.media_id == "maybe" || media_object.deleted? || media_object.context != context
        media_object = nil
      end
      if media_object && media_object.podcast_format_details
        media_object.podcast_associated_asset = messages_hash[media_object.media_id]
      end
      media_object
    end

    to_podcast(attachments + media_objects.compact)
  end

  def self.to_podcast(elements, opts={})
    require 'rss/2.0'
    elements.map do |elem|
      asset = elem.podcast_associated_asset
      next unless asset
      item = RSS::Rss::Channel::Item.new
      item.title = before_label((asset.title rescue "")) + elem.name
      link = nil
      if asset.is_a?(DiscussionTopic)
        link = "http://#{HostUrl.context_host(asset.context)}/#{asset.context_url_prefix}/discussion_topics/#{asset.id}"
      elsif asset.is_a?(DiscussionEntry)
        link = "http://#{HostUrl.context_host(asset.context)}/#{asset.context_url_prefix}/discussion_topics/#{asset.discussion_topic_id}"
      end

      item.link = link
      item.guid = RSS::Rss::Channel::Item::Guid.new
      item.pubDate = elem.updated_at.utc
      item.description = asset ? asset.message : elem.name
      item.enclosure
      if elem.is_a?(Attachment)
        item.guid.content = link + "/#{elem.uuid}"
        url = "http://#{HostUrl.context_host(elem.context)}/#{elem.context_url_prefix}"\
          "/files/#{elem.id}/download#{elem.extension}?verifier=#{elem.uuid}"
        item.enclosure = RSS::Rss::Channel::Item::Enclosure.new(url, elem.size, elem.content_type)
      elsif elem.is_a?(MediaObject)
        item.guid.content = link + "/#{elem.media_id}"
        details = elem.podcast_format_details
        content_type = 'video/mpeg'
        content_type = 'audio/mpeg' if elem.media_type == 'audio'
        size = details[:size].to_i.kilobytes
        ext = details[:extension] || details[:fileExt]
        url = "http://#{HostUrl.context_host(elem.context)}/#{elem.context_url_prefix}"\
          "/media_download.#{ext}?type=#{ext}&entryId=#{elem.media_id}&redirect=1"
        item.enclosure = RSS::Rss::Channel::Item::Enclosure.new(url, size, content_type)
      end
      item
    end.compact
  end

  def initial_post_required?(user, enrollment, session)
    if require_initial_post?
      # check if the user, or the user being observed can see the posts
      if enrollment && enrollment.respond_to?(:associated_user) && enrollment.associated_user
        return true if !user_can_see_posts?(enrollment.associated_user)
      elsif !user_can_see_posts?(user, session)
        return true
      end
    end
    false
  end

  # returns the materialized view of the discussion as structure, participant_ids, and entry_ids
  # the view is already converted to a json string, the other two arrays of ids are ruby arrays
  # see the description of the format in the discussion topics api documentation.
  #
  # returns nil if the view is not currently available, and kicks off a
  # background job to build the view. this typically only takes a couple seconds.
  #
  # if a new message is posted, it won't appear in this view until the job to
  # update it completes. so this view is eventually consistent.
  #
  # if the topic itself is not yet created, it will return blank data. this is for situations
  # where we're creating topics on the first write - until that first write, we need to return
  # blank data on reads.
  def materialized_view(opts = {})
    if self.new_record?
      return "[]", [], [], []
    else
      DiscussionTopic::MaterializedView.materialized_view_for(self, opts)
    end
  end

  # synchronously create/update the materialized view
  def create_materialized_view
    DiscussionTopic::MaterializedView.for(self).update_materialized_view_without_send_later
  end
end
