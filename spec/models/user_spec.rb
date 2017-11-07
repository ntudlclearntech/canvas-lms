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

require File.expand_path(File.dirname(__FILE__) + '/../sharding_spec_helper.rb')
require 'rotp'

describe User do

  context "validation" do
    it "should create a new instance given valid attributes" do
      expect(user_model).to be_valid
    end
  end

  it "should get the first email from communication_channel" do
    @user = User.create
    @cc1 = double('CommunicationChannel')
    allow(@cc1).to receive(:path).and_return('cc1')
    @cc2 = double('CommunicationChannel')
    allow(@cc2).to receive(:path).and_return('cc2')
    allow(@user).to receive(:communication_channels).and_return([@cc1, @cc2])
    allow(@user).to receive(:communication_channel).and_return(@cc1)
    expect(@user.communication_channel).to eql(@cc1)
  end

  it "should be able to assert a name" do
    @user = User.create
    @user.assert_name(nil)
    expect(@user.name).to eql('User')
    @user.assert_name('david')
    expect(@user.name).to eql('david')
    @user.assert_name('bill')
    expect(@user.name).to eql('bill')
    @user.assert_name(nil)
    expect(@user.name).to eql('bill')
    @user = User.find(@user.id)
    expect(@user.name).to eql('bill')
  end

  it "should update account associations when a course account changes" do
    account1 = account_model
    account2 = account_model
    course_with_student
    expect(@user.associated_accounts.length).to eql(1)
    expect(@user.associated_accounts.first).to eql(Account.default)

    @course.account = account1
    @course.save!
    @course.reload
    @user.reload

    expect(@user.associated_accounts.length).to eql(1)
    expect(@user.associated_accounts.first).to eql(account1)

    @course.account = account2
    @course.save!
    @user.reload

    expect(@user.associated_accounts.length).to eql(1)
    expect(@user.associated_accounts.first).to eql(account2)
  end

  it "should update account associations when a course account moves in the hierachy" do
    account1 = account_model

    @enrollment = course_with_student(:account => account1)
    @course.account = account1
    @course.save!
    @course.reload
    @user.reload

    expect(@user.associated_accounts.length).to eql(1)
    expect(@user.associated_accounts.first).to eql(account1)

    account2 = account_model
    account1.parent_account = account2
    account1.save!
    @course.reload
    @user.reload

    expect(@user.associated_accounts.length).to eql(2)
    expect(@user.associated_accounts[0]).to eql(account1)
    expect(@user.associated_accounts[1]).to eql(account2)
  end

  it "should update account associations when a user is associated to an account just by pseudonym" do
    account1 = account_model
    account2 = account_model
    user = user_with_pseudonym

    pseudonym = user.pseudonyms.first
    pseudonym.account = account1
    pseudonym.save

    user.reload
    expect(user.associated_accounts.length).to eql(1)
    expect(user.associated_accounts.first).to eql(account1)

    # Make sure that multiple sequential updates also work
    pseudonym.account = account2
    pseudonym.save
    pseudonym.account = account1
    pseudonym.save
    user.reload
    expect(user.associated_accounts.length).to eql(1)
    expect(user.associated_accounts.first).to eql(account1)

    account1.parent_account = account2
    account1.save!

    user.reload
    expect(user.associated_accounts.length).to eql(2)
    expect(user.associated_accounts[0]).to eql(account1)
    expect(user.associated_accounts[1]).to eql(account2)
  end

  it "should update account associations when a user is associated to an account just by account_users" do
    account = account_model
    @user = User.create
    account.account_users.create!(user: @user)

    @user.reload
    expect(@user.associated_accounts.length).to eql(1)
    expect(@user.associated_accounts.first).to eql(account)
  end

  it "should populate dashboard_messages" do
    Notification.create(:name => "Assignment Created")
    course_with_teacher(:active_all => true)
    expect(@user.stream_item_instances).to be_empty
    @a = @course.assignments.new(:title => "some assignment")
    @a.workflow_state = "available"
    @a.save
    expect(@user.stream_item_instances.reload).not_to be_empty
  end

  it "should ignore orphaned stream item instances" do
    course_with_student(:active_all => true)
    google_docs_collaboration_model(:user_id => @user.id)
    expect(@user.recent_stream_items.size).to eq 1
    StreamItem.delete_all
    expect(@user.recent_stream_items.size).to eq 0
  end

  it "should ignore stream item instances from concluded courses" do
    course_with_teacher(:active_all => true)
    google_docs_collaboration_model(:user_id => @user.id)
    expect(@user.recent_stream_items.size).to eq 1
    @course.soft_conclude!
    @course.save
    expect(@user.recent_stream_items.size).to eq 0
  end

  it "should ignore stream item instances from courses the user is no longer participating in" do
    course_with_student(:active_all => true)
    google_docs_collaboration_model(:user_id => @user.id)
    expect(@user.recent_stream_items.size).to eq 1
    @enrollment.end_at = @enrollment.start_at = Time.now - 1.day
    @enrollment.save!
    @user = User.find(@user.id)
    expect(@user.recent_stream_items.size).to eq 0
  end

  describe "#recent_stream_items" do
    it "should skip submission stream items" do
      course_with_teacher(:active_all => true)
      course_with_student(:active_all => true, :course => @course)
      assignment = @course.assignments.create!(:title => "some assignment", :submission_types => ['online_text_entry'])
      sub = assignment.submit_homework @student, body: "submission"
      sub.add_comment :author => @teacher, :comment => "lol"
      item = StreamItem.last
      expect(item.asset).to eq sub
      expect(@student.visible_stream_item_instances.map(&:stream_item)).to include item
      expect(@student.recent_stream_items).not_to include item
    end
  end

  describe "#cached_recent_stream_items" do
    before(:once) do
      @contexts = []
      # create stream item 1
      course_with_teacher(:active_all => true)
      @contexts << @course
      discussion_topic_model(:context => @course)
      # create stream item 2
      course_with_teacher(:active_all => true, :user => @teacher)
      @contexts << @course
      discussion_topic_model(:context => @course)

      @dashboard_key = StreamItemCache.recent_stream_items_key(@teacher)
    end

    let(:context_keys) do
      @contexts.map { |context|
        StreamItemCache.recent_stream_items_key(@teacher, context.class.base_class.name, context.id)
      }
    end

    it "creates cache keys for each context" do
      enable_cache do
        @teacher.cached_recent_stream_items(:contexts => @contexts)
        expect(Rails.cache.read(@dashboard_key)).to be_blank
        context_keys.each do |context_key|
          expect(Rails.cache.read(context_key)).not_to be_blank
        end
      end
    end

    it "creates one cache key when there are no contexts" do
      enable_cache do
        @teacher.cached_recent_stream_items # cache the dashboard items
        expect(Rails.cache.read(@dashboard_key)).not_to be_blank
        context_keys.each do |context_key|
          expect(Rails.cache.read(context_key)).to be_blank
        end
      end
    end
  end

  it "should be able to remove itself from a root account" do
    account1 = Account.create
    account2 = Account.create
    sub = account2.sub_accounts.create!

    user = User.create
    user.register!
    p1 = user.pseudonyms.create(:unique_id => "user1")
    p2 = user.pseudonyms.create(:unique_id => "user2")
    p1.account = account1
    p2.account = account2
    p1.save!
    p2.save!
    account1.account_users.create!(user: user)
    account2.account_users.create!(user: user)
    sub.account_users.create!(user: user)

    course1 = account1.courses.create
    course2 = account2.courses.create
    course1.offer!
    course2.offer!
    enrollment1 = course1.enroll_student(user)
    enrollment2 = course2.enroll_student(user)
    enrollment1.workflow_state = 'active'
    enrollment2.workflow_state = 'active'
    enrollment1.save!
    enrollment2.save!
    expect(user.associated_account_ids.include?(account1.id)).to be_truthy
    expect(user.associated_account_ids.include?(account2.id)).to be_truthy

    user.remove_from_root_account(account2)
    user.reload
    expect(user.associated_account_ids.include?(account1.id)).to be_truthy
    expect(user.associated_account_ids.include?(account2.id)).to be_falsey
    expect(user.account_users.active.where(account_id: [account2, sub])).to be_empty
  end

  it "should search by multiple fields" do
    @account = Account.create!
    user1 = User.create! :name => "longname1", :short_name => "shortname1"
    user1.register!
    user2 = User.create! :name => "longname2", :short_name => "shortname2"
    user2.register!

    expect(User.name_like("longname1").map(&:id)).to eq [user1.id]
    expect(User.name_like("shortname2").map(&:id)).to eq [user2.id]
    expect(User.name_like("sisid1").map(&:id)).to eq []
    expect(User.name_like("uniqueid2").map(&:id)).to eq []

    p1 = user1.pseudonyms.new :unique_id => "uniqueid1", :account => @account
    p1.sis_user_id = "sisid1"
    p1.save!
    p2 = user2.pseudonyms.new :unique_id => "uniqueid2", :account => @account
    p2.sis_user_id = "sisid2"
    p2.save!

    expect(User.name_like("longname1").map(&:id)).to eq [user1.id]
    expect(User.name_like("shortname2").map(&:id)).to eq [user2.id]
    expect(User.name_like("sisid1").map(&:id)).to eq [user1.id]
    expect(User.name_like("uniqueid2").map(&:id)).to eq [user2.id]

    p3 = user1.pseudonyms.new :unique_id => "uniqueid3", :account => @account
    p3.sis_user_id = "sisid3"
    p3.save!

    expect(User.name_like("longname1").map(&:id)).to eq [user1.id]
    expect(User.name_like("shortname2").map(&:id)).to eq [user2.id]
    expect(User.name_like("sisid1").map(&:id)).to eq [user1.id]
    expect(User.name_like("uniqueid2").map(&:id)).to eq [user2.id]
    expect(User.name_like("uniqueid3").map(&:id)).to eq [user1.id]

    p4 = user1.pseudonyms.new :unique_id => "uniqueid4", :account => @account
    p4.sis_user_id = "sisid3 2"
    p4.save!

    expect(User.name_like("longname1").map(&:id)).to eq [user1.id]
    expect(User.name_like("shortname2").map(&:id)).to eq [user2.id]
    expect(User.name_like("sisid1").map(&:id)).to eq [user1.id]
    expect(User.name_like("uniqueid2").map(&:id)).to eq [user2.id]
    expect(User.name_like("uniqueid3").map(&:id)).to eq [user1.id]
    expect(User.name_like("sisid3").map(&:id)).to eq [user1.id]

    user3 = User.create! :name => "longname1", :short_name => "shortname3"
    user3.register!

    expect(User.name_like("longname1").map(&:id).sort).to eq [user1.id, user3.id].sort
    expect(User.name_like("shortname2").map(&:id)).to eq [user2.id]
    expect(User.name_like("sisid1").map(&:id)).to eq [user1.id]
    expect(User.name_like("uniqueid2").map(&:id)).to eq [user2.id]
    expect(User.name_like("uniqueid3").map(&:id)).to eq [user1.id]
    expect(User.name_like("sisid3").map(&:id)).to eq [user1.id]

    expect(User.name_like("sisid3").map(&:id)).to eq [user1.id]
    expect(User.name_like("uniqueid4").map(&:id)).to eq [user1.id]
    p4.destroy
    expect(User.name_like("sisid3").map(&:id)).to eq [user1.id]
    expect(User.name_like("uniqueid4").map(&:id)).to eq []

  end

  it "should be able to be removed from a root account with non-Canvas auth" do
    account1 = account_with_cas
    account2 = Account.create!
    user = User.create!
    user.register!
    p1 = user.pseudonyms.new :unique_id => "id1", :account => account1
    p1.sis_user_id = 'sis_id1'
    p1.save!
    user.pseudonyms.create! :unique_id => "id2", :account => account2
    user.remove_from_root_account account1
    expect(user.associated_root_accounts.to_a).to eql [account2]
  end

  describe "update_account_associations" do
    it "should support incrementally adding to account associations" do
      user = User.create!
      expect(user.user_account_associations).to eq []
      account1, account2, account3 = Account.create!, Account.create!, Account.create!

      sort_account_associations = lambda { |a, b| a.keys.first <=> b.keys.first }

      User.update_account_associations([user], :incremental => true, :precalculated_associations => {account1.id => 0})
      expect(user.user_account_associations.reload.map { |aa| {aa.account_id => aa.depth} }).to eq [{account1.id => 0}]

      User.update_account_associations([user], :incremental => true, :precalculated_associations => {account2.id => 1})
      expect(user.user_account_associations.reload.map { |aa| {aa.account_id => aa.depth} }.sort(&sort_account_associations)).to eq [{account1.id => 0}, {account2.id => 1}].sort(&sort_account_associations)

      User.update_account_associations([user], :incremental => true, :precalculated_associations => {account3.id => 1, account1.id => 2, account2.id => 0})
      expect(user.user_account_associations.reload.map { |aa| {aa.account_id => aa.depth} }.sort(&sort_account_associations)).to eq [{account1.id => 0}, {account2.id => 0}, {account3.id => 1}].sort(&sort_account_associations)
    end

    it "should not have account associations for creation_pending or deleted" do
      user = User.create! { |u| u.workflow_state = 'creation_pending' }
      expect(user).to be_creation_pending
      course = Course.create!
      course.offer!
      enrollment = course.enroll_student(user)
      expect(enrollment).to be_invited
      expect(user.user_account_associations).to eq []
      Account.default.account_users.create!(user: user)
      expect(user.user_account_associations.reload).to eq []
      user.pseudonyms.create!(:unique_id => 'test@example.com')
      expect(user.user_account_associations.reload).to eq []
      user.update_account_associations
      expect(user.user_account_associations.reload).to eq []
      user.register!
      expect(user.user_account_associations.reload.map(&:account)).to eq [Account.default]
      user.destroy
      expect(user.user_account_associations.reload).to eq []
    end

    it "should not create/update account associations for student view student" do
      account1 = account_model
      account2 = account_model
      course_with_teacher(:active_all => true)
      @fake_student = @course.student_view_student
      expect(@fake_student.reload.user_account_associations).to be_empty

      @course.account_id = account1.id
      @course.save!
      expect(@fake_student.reload.user_account_associations).to be_empty

      account1.parent_account = account2
      account1.save!
      expect(@fake_student.reload.user_account_associations).to be_empty

      @course.complete!
      expect(@fake_student.reload.user_account_associations).to be_empty

      @fake_student = @course.reload.student_view_student
      expect(@fake_student.reload.user_account_associations).to be_empty

      @section2 = @course.course_sections.create!(:name => "Other Section")
      @fake_student = @course.reload.student_view_student
      expect(@fake_student.reload.user_account_associations).to be_empty
    end

    context "sharding" do
      specs_require_sharding

      it "should create associations for a user in multiple shards" do
        user_factory
        Account.site_admin.account_users.create!(user: @user)
        expect(@user.user_account_associations.map(&:account)).to eq [Account.site_admin]

        @shard1.activate do
          @account = Account.create!
          au = @account.account_users.create!(user: @user)
          expect(@user.user_account_associations.shard(@user).map(&:account).sort_by(&:id)).to eq(
              [Account.site_admin, @account].sort_by(&:id)
          )
          expect(@account.user_account_associations.map(&:user)).to eq [@user]

          au.destroy

          expect(@user.user_account_associations.shard(@user).map(&:account)).to eq [Account.site_admin]
          expect(@account.reload.user_account_associations.map(&:user)).to eq []

          @account.account_users.create!(user: @user)

          expect(@user.user_account_associations.shard(@user).map(&:account).sort_by(&:id)).to eq(
              [Account.site_admin, @account].sort_by(&:id)
          )
          expect(@account.reload.user_account_associations.map(&:user)).to eq [@user]

          UserAccountAssociation.delete_all
        end
        UserAccountAssociation.delete_all

        @shard2.activate do
          @user.update_account_associations

          expect(@user.user_account_associations.shard(@user).map(&:account).sort_by(&:id)).to eq(
              [Account.site_admin, @account].sort_by(&:id)
          )
          expect(@account.reload.user_account_associations.map(&:user)).to eq [@user]
        end
        UserAccountAssociation.delete_all

        @shard1.activate do
          # check sharding for when we pass user IDs into update_account_associations, rather than user objects themselves
          User.update_account_associations([@user.id], :all_shards => true)
          expect(@account.reload.all_users).to eq [@user]
        end
        @shard2.activate { expect(@account.reload.all_users).to eq [@user] }
      end
    end
  end

  def create_course_with_student_and_assignment
    @course = course_model
    @course.offer!
    @student = user_model
    @course.enroll_student @student
    @assignment = @course.assignments.create :title => "Test Assignment", :points_possible => 10
  end

  it "should not include recent feedback for muted assignments" do
    create_course_with_student_and_assignment
    @assignment.mute!
    @assignment.grade_student @student, grade: 9, grader: @teacher
    expect(@user.recent_feedback).to be_empty
  end

  it "should include recent feedback for unmuted assignments" do
    create_course_with_student_and_assignment
    @assignment.grade_student @user, grade: 9, grader: @teacher
    expect(@user.recent_feedback(:contexts => [@course])).not_to be_empty
  end

  it "should include recent feedback for student view users" do
    @course = course_model
    @course.offer!
    @assignment = @course.assignments.create :title => "Test Assignment", :points_possible => 10
    test_student = @course.student_view_student
    @assignment.grade_student test_student, grade: 9, grader: @teacher
    expect(test_student.recent_feedback).not_to be_empty
  end

  it "should not include recent feedback for unpublished assignments" do
    create_course_with_student_and_assignment
    @assignment.grade_student @user, grade: 9, grader: @teacher
    @assignment.unpublish
    expect(@user.recent_feedback(:contexts => [@course])).to be_empty
  end

  it "should not include recent feedback for other students in admin feedback" do
    create_course_with_student_and_assignment
    other_teacher = @teacher
    teacher = teacher_in_course(:active_all => true).user
    student = student_in_course(:active_all => true).user
    sub = @assignment.grade_student(student, grade: 9, grader: @teacher).first
    sub.submission_comments.create!(:comment => 'c1', :author => other_teacher)
    sub.save!
    expect(teacher.recent_feedback(:contexts => [@course])).to be_empty
  end

  it "should not include non-recent feedback via old submission comments" do
    create_course_with_student_and_assignment
    sub = @assignment.grade_student(@user, grade: 9, grader: @teacher).first
    sub.submission_comments.create!(:author => @teacher, :comment => 'good jorb')
    expect(@user.recent_feedback(:contexts => [@course])).to include sub
    Timecop.travel(1.year.from_now) do
      expect(@user.recent_feedback(:contexts => [@course])).not_to include sub
    end
  end

  describe '#courses_with_primary_enrollment' do

    it "should return appropriate courses with primary enrollment" do
      user_factory
      @course1 = course_factory(:course_name => "course_factory", :active_course => true)
      @course1.enroll_user(@user, 'StudentEnrollment', :enrollment_state => 'active')

      @course2 = course_factory(:course_name => "other course_factory", :active_course => true)
      @course2.enroll_user(@user, 'TeacherEnrollment', :enrollment_state => 'active')

      @course3 = course_factory(:course_name => "yet another course", :active_course => true)
      @course3.enroll_user(@user, 'StudentEnrollment', :enrollment_state => 'active')
      @course3.enroll_user(@user, 'TeacherEnrollment', :enrollment_state => 'active')

      @course4 = course_factory(:course_name => "not yet active")
      @course4.enroll_user(@user, 'StudentEnrollment')

      @course5 = course_factory(:course_name => "invited")
      @course5.enroll_user(@user, 'TeacherEnrollment')

      @course6 = course_factory(:course_name => "active but date restricted", :active_course => true)
      @course6.restrict_student_future_view = true
      @course6.save!
      e = @course6.enroll_user(@user, 'StudentEnrollment')
      e.accept!
      e.start_at = 1.day.from_now
      e.end_at = 2.days.from_now
      e.save!

      @course7 = course_factory(:course_name => "soft concluded", :active_course => true)
      e = @course7.enroll_user(@user, 'StudentEnrollment')
      e.accept!
      e.start_at = 2.days.ago
      e.end_at = 1.day.ago
      e.save!

      # only four, in the right order (type, then name), and with the top type per course
      expect(@user.courses_with_primary_enrollment.map{|c| [c.id, c.primary_enrollment_type]}).to eql [
        [@course5.id, 'TeacherEnrollment'],
        [@course2.id, 'TeacherEnrollment'],
        [@course3.id, 'TeacherEnrollment'],
        [@course1.id, 'StudentEnrollment']
      ]
    end

    it "includes invitations to temporary users" do
      user1 = user_factory
      user2 = user_factory
      c1 = course_factory(name: 'a', active_course: true)
      e = c1.enroll_teacher(user1)
      allow(user2).to receive(:temporary_invitations).and_return([e])
      c2 = course_factory(name: 'b', active_course: true)
      c2.enroll_user(user2)

      expect(user2.courses_with_primary_enrollment.map(&:id)).to eq [c1.id, c2.id]
    end

    it 'filters out enrollments for deleted courses' do
      student_in_course(active_course: true)
      expect(@user.current_and_invited_courses.count).to eq 1
      Course.where(id: @course).update_all(workflow_state: 'deleted')
      expect(@user.current_and_invited_courses.count).to eq 0
    end

    it 'excludes deleted courses in cached_invitations' do
      student_in_course(active_course: true)
      expect(@user.cached_invitations.count).to eq 1
      Course.where(id: @course).update_all(workflow_state: 'deleted')
      expect(@user.cached_invitations.count).to eq 0
    end

    describe 'with cross sharding' do
      specs_require_sharding

      it 'pulls the enrollments that are completed with global ids' do
        alice = bob = bobs_enrollment = alices_enrollment = nil

        duped_enrollment_id = 0

        @shard1.activate do
          alice = User.create!(:name => 'alice')
          bob = User.create!(:name => 'bob')
          account = Account.create!
          courseX = account.courses.build
          courseX.workflow_state = 'available'
          courseX.save!
          bobs_enrollment = StudentEnrollment.create!(:course => courseX, :user => bob, :workflow_state => 'completed')
          duped_enrollment_id = bobs_enrollment.id
        end

        @shard2.activate do
          account = Account.create!
          courseY = account.courses.build
          courseY.workflow_state = 'available'
          courseY.save!
          alices_enrollment = StudentEnrollment.new(:course => courseY, :user => alice, :workflow_state => 'active')
          alices_enrollment.id = duped_enrollment_id
          alices_enrollment.save!
        end

        expect(alice.courses_with_primary_enrollment.size).to eq 1
      end

      it 'still filters out completed enrollments for the correct user' do
        alice = nil
        @shard1.activate do
          alice = User.create!(:name => 'alice')
          account = Account.create!
          courseX = account.courses.build
          courseX.workflow_state = 'available'
          courseX.save!
          StudentEnrollment.create!(:course => courseX, :user => alice, :workflow_state => 'completed')
        end
        expect(alice.courses_with_primary_enrollment.size).to eq 0
      end

      it 'filters out completed-by-date enrollments for the correct user' do
        @shard1.activate do
          @user = User.create!(:name => 'user')
          account = Account.create!
          courseX = account.courses.build
          courseX.workflow_state = 'available'
          courseX.start_at = 7.days.ago
          courseX.conclude_at = 2.days.ago
          courseX.restrict_enrollments_to_course_dates = true
          courseX.save!
          StudentEnrollment.create!(:course => courseX, :user => @user, :workflow_state => 'active')
        end
        expect(@user.courses_with_primary_enrollment.count).to eq 0
        expect(@user.courses_with_primary_enrollment(:current_and_invited_courses, nil, :include_completed_courses => true).count).to eq 1
      end

      it 'works with favorite_courses' do
        @user = User.create!(:name => 'user')
        @shard1.activate do
          account = Account.create!
          @course = account.courses.build
          @course.workflow_state = 'available'
          @course.save!
          StudentEnrollment.create!(:course => @course, :user => @user, :workflow_state => 'active')
        end
        @user.favorites.create!(:context => @course)
        expect(@user.courses_with_primary_enrollment(:favorite_courses)).to eq [@course]
      end
    end
  end

  it "should delete system generated pseudonyms on delete" do
    user_with_managed_pseudonym
    expect(@pseudonym).to be_managed_password
    expect(@user.workflow_state).to eq "pre_registered"
    @user.destroy
    expect(@user.workflow_state).to eq "deleted"
    @user.reload
    expect(@user.workflow_state).to eq "deleted"
  end

  it "should record deleted_at" do
    user = User.create
    user.destroy
    expect(user.deleted_at).not_to be_nil
  end

  describe "can_masquerade?" do
    it "should allow self" do
      @user = user_with_pseudonym(:username => 'nobody1@example.com')
      expect(@user.can_masquerade?(@user, Account.default)).to be_truthy
    end

    it "should not allow other users" do
      @user1 = user_with_pseudonym(:username => 'nobody1@example.com')
      @user2 = user_with_pseudonym(:username => 'nobody2@example.com')

      expect(@user1.can_masquerade?(@user2, Account.default)).to be_falsey
      expect(@user2.can_masquerade?(@user1, Account.default)).to be_falsey
    end

    it "should allow site and account admins" do
      user = user_with_pseudonym(:username => 'nobody1@example.com')
      @admin = user_with_pseudonym(:username => 'nobody2@example.com')
      @site_admin = user_with_pseudonym(:username => 'nobody3@example.com', :account => Account.site_admin)
      Account.site_admin.account_users.create!(user: @site_admin)
      Account.default.account_users.create!(user: @admin)
      expect(user.can_masquerade?(@site_admin, Account.default)).to be_truthy
      expect(@admin.can_masquerade?(@site_admin, Account.default)).to be_truthy
      expect(user.can_masquerade?(@admin, Account.default)).to be_truthy
      expect(@admin.can_masquerade?(@admin, Account.default)).to be_truthy
      expect(@admin.can_masquerade?(user, Account.default)).to be_falsey
      expect(@site_admin.can_masquerade?(@site_admin, Account.default)).to be_truthy
      expect(@site_admin.can_masquerade?(user, Account.default)).to be_falsey
      expect(@site_admin.can_masquerade?(@admin, Account.default)).to be_falsey
    end

    it "should not allow restricted admins to become full admins" do
      user = user_with_pseudonym(:username => 'nobody1@example.com')
      @restricted_admin = user_with_pseudonym(:username => 'nobody3@example.com')
      role = custom_account_role('Restricted', :account => Account.default)
      account_admin_user_with_role_changes(:user => @restricted_admin, :role => role, :role_changes => { :become_user => true })
      @admin = user_with_pseudonym(:username => 'nobody2@example.com')
      Account.default.account_users.create!(user: @admin)
      expect(user.can_masquerade?(@restricted_admin, Account.default)).to be_truthy
      expect(@admin.can_masquerade?(@restricted_admin, Account.default)).to be_falsey
      expect(@restricted_admin.can_masquerade?(@admin, Account.default)).to be_truthy
    end

    it "should allow to admin even if user is in multiple accounts" do
      user = user_with_pseudonym(:username => 'nobody1@example.com')
      @account2 = Account.create!
      user.pseudonyms.create!(:unique_id => 'nobodyelse@example.com', :account => @account2)
      @admin = user_with_pseudonym(:username => 'nobody2@example.com')
      @site_admin = user_with_pseudonym(:username => 'nobody3@example.com')
      Account.default.account_users.create!(user: @admin)
      Account.site_admin.account_users.create!(user: @site_admin)
      expect(user.can_masquerade?(@admin, Account.default)).to be_truthy
      expect(user.can_masquerade?(@admin, @account2)).to be_falsey
      expect(user.can_masquerade?(@site_admin, Account.default)).to be_truthy
      expect(user.can_masquerade?(@site_admin, @account2)).to be_truthy
      @account2.account_users.create!(user: @admin)
    end

    it "should allow site admin when they don't otherwise qualify for :create_courses" do
      user = user_with_pseudonym(:username => 'nobody1@example.com')
      @admin = user_with_pseudonym(:username => 'nobody2@example.com')
      @site_admin = user_with_pseudonym(:username => 'nobody3@example.com', :account => Account.site_admin)
      Account.default.account_users.create!(user: @admin)
      Account.site_admin.account_users.create!(user: @site_admin)
      course_factory
      @course.enroll_teacher(@admin)
      Account.default.update_attribute(:settings, {:teachers_can_create_courses => true})
      expect(@admin.can_masquerade?(@site_admin, Account.default)).to be_truthy
    end

    it "should allow teacher to become student view student" do
      course_with_teacher(:active_all => true)
      @fake_student = @course.student_view_student
      expect(@fake_student.can_masquerade?(@teacher, Account.default)).to be_truthy
    end
  end

  describe '#has_subset_of_account_permissions?' do
    let(:user) { User.new }
    let(:other_user) { User.new }

    it 'returns true for self' do
      expect(user.has_subset_of_account_permissions?(user, nil)).to be_truthy
    end

    it 'is false if the account is not a root account' do
      expect(user.has_subset_of_account_permissions?(other_user, double(:root_account? => false))).to be_falsey
    end

    it 'is true if there are no account users for this root account' do
      account = double(:root_account? => true, :all_account_users_for => [])
      expect(user.has_subset_of_account_permissions?(other_user, account)).to be_truthy
    end

    it 'is true when all account_users for current user are subsets of target user' do
      account = double(:root_account? => true, :all_account_users_for => [double(:is_subset_of? => true)])
      expect(user.has_subset_of_account_permissions?(other_user, account)).to be_truthy
    end

    it 'is false when any account_user for current user is not a subset of target user' do
      account = double(:root_account? => true, :all_account_users_for => [double(:is_subset_of? => false)])
      expect(user.has_subset_of_account_permissions?(other_user, account)).to be_falsey
    end
  end

  context "check_courses_right?" do
    before :once do
      course_with_teacher(:active_all => true)
      @student = user_model
    end

    before :each do
      allow(@course).to receive(:grants_right?).and_return(true)
    end

    it "should require parameters" do
      expect(@student.check_courses_right?(nil, :some_right)).to be_falsey
      expect(@student.check_courses_right?(@teacher, nil)).to be_falsey
    end

    it "should check current courses" do
      expect(@student).to receive(:courses).once.and_return([@course])
      expect(@student).to receive(:concluded_courses).never
      expect(@student.check_courses_right?(@teacher, :some_right)).to be_truthy
    end

    it "should check concluded courses" do
      expect(@student).to receive(:courses).once.and_return([])
      expect(@student).to receive(:concluded_courses).once.and_return([@course])
      expect(@student.check_courses_right?(@teacher, :some_right)).to be_truthy
    end
  end

  context "search_messageable_users" do
    before(:once) do
      @admin = user_model
      @student = user_model
      tie_user_to_account(@admin, :role => admin_role)
      role = custom_account_role('CustomStudent', :account => Account.default)
      tie_user_to_account(@student, :role => role)
      set_up_course_with_users
    end

    def set_up_course_with_users
      @course = course_model(:name => 'the course')
      @this_section_teacher = @teacher
      @course.offer!

      @this_section_user = user_model
      @this_section_user_enrollment = @course.enroll_user(@this_section_user, 'StudentEnrollment', :enrollment_state => 'active')

      @other_section_user = user_model
      @other_section = @course.course_sections.create
      @course.enroll_user(@other_section_user, 'StudentEnrollment', :enrollment_state => 'active', :section => @other_section)
      @other_section_teacher = user_model
      @course.enroll_user(@other_section_teacher, 'TeacherEnrollment', :enrollment_state => 'active', :section => @other_section)

      @group = @course.groups.create(:name => 'the group')
      @group.users = [@this_section_user]

      @unrelated_user = user_model

      @deleted_user = user_model(:name => 'deleted')
      @course.enroll_user(@deleted_user, 'StudentEnrollment', :enrollment_state => 'active')
      @deleted_user.destroy
    end

    # convenience to search and then get the first page. none of these specs
    # should be putting more than a handful of users into the search results...
    # right?
    def search_messageable_users(viewing_user, *args)
      viewing_user.address_book.search_users(*args).paginate(:page => 1, :per_page => 20)
    end

    it "should include yourself even when not enrolled in courses" do
      @student = user_model
      expect(search_messageable_users(@student).map(&:id)).to include(@student.id)
    end

    it "should only return users from the specified context and type" do
      @course.enroll_user(@student, 'StudentEnrollment', :enrollment_state => 'active')

      expect(search_messageable_users(@student, :context => "course_#{@course.id}").map(&:id).sort).
        to eql [@student, @this_section_user, @this_section_teacher, @other_section_user, @other_section_teacher].map(&:id).sort
      expect(@student.count_messageable_users_in_course(@course)).to eql 5

      expect(search_messageable_users(@student, :context => "course_#{@course.id}_students").map(&:id).sort).
        to eql [@student, @this_section_user, @other_section_user].map(&:id).sort

      expect(search_messageable_users(@student, :context => "group_#{@group.id}").map(&:id).sort).
        to eql [@this_section_user].map(&:id).sort
      expect(@student.count_messageable_users_in_group(@group)).to eql 1

      expect(search_messageable_users(@student, :context => "section_#{@other_section.id}").map(&:id).sort).
        to eql [@other_section_user, @other_section_teacher].map(&:id).sort

      expect(search_messageable_users(@student, :context => "section_#{@other_section.id}_teachers").map(&:id).sort).
        to eql [@other_section_teacher].map(&:id).sort
    end

    it "should not include users from other sections if visibility is limited to sections" do
      @course.enroll_user(@student, 'StudentEnrollment', :enrollment_state => 'active', :limit_privileges_to_course_section => true)
      messageable_users = search_messageable_users(@student).map(&:id)
      expect(messageable_users).to include @this_section_user.id
      expect(messageable_users).not_to include @other_section_user.id

      messageable_users = search_messageable_users(@student, :context => "course_#{@course.id}").map(&:id)
      expect(messageable_users).to include @this_section_user.id
      expect(messageable_users).not_to include @other_section_user.id

      messageable_users = search_messageable_users(@student, :context => "section_#{@other_section.id}").map(&:id)
      expect(messageable_users).to be_empty
    end

    it "should let students message the entire class by default" do
      @course.enroll_user(@student, 'StudentEnrollment', :enrollment_state => 'active')

      expect(search_messageable_users(@student, :context => "course_#{@course.id}").map(&:id).sort).
        to eql [@student, @this_section_user, @this_section_teacher, @other_section_user, @other_section_teacher].map(&:id).sort
    end

    it "should not let users message the entire class if they cannot send_messages" do
      RoleOverride.create!(:context => @course.account, :permission => 'send_messages',
                           :role => student_role, :enabled => false)
      @course.enroll_user(@student, 'StudentEnrollment', :enrollment_state => 'active')

      # can only message self or the admins
      expect(search_messageable_users(@student, :context => "course_#{@course.id}").map(&:id).sort).
        to eql [@student, @this_section_teacher, @other_section_teacher].map(&:id).sort
    end

    it "should not include deleted users" do
      expect(search_messageable_users(@student).map(&:id)).not_to include(@deleted_user.id)
      expect(search_messageable_users(@student, :search => @deleted_user.name).map(&:id)).to be_empty
      expect(search_messageable_users(@student, :strict_checks => false).map(&:id)).not_to include(@deleted_user.id)
      expect(search_messageable_users(@student, :strict_checks => false, :search => @deleted_user.name).map(&:id)).to be_empty
    end

    it "should include deleted iff strict_checks=false" do
      expect(@student.load_messageable_user(@deleted_user.id, :strict_checks => false)).not_to be_nil
      expect(@student.load_messageable_user(@deleted_user.id)).to be_nil
    end

    it "should only include users from the specified section" do
      @course.enroll_user(@student, 'StudentEnrollment', :enrollment_state => 'active')
      messageable_users = search_messageable_users(@student, :context => "section_#{@course.default_section.id}").map(&:id)
      expect(messageable_users).to include @this_section_user.id
      expect(messageable_users).not_to include @other_section_user.id

      messageable_users = search_messageable_users(@student, :context => "section_#{@other_section.id}").map(&:id)
      expect(messageable_users).not_to include @this_section_user.id
      expect(messageable_users).to include @other_section_user.id
    end

    it "should include users from all sections if visibility is not limited to sections" do
      @course.enroll_user(@student, 'StudentEnrollment', :enrollment_state => 'active')
      messageable_users = search_messageable_users(@student).map(&:id)
      expect(messageable_users).to include @this_section_user.id
      expect(messageable_users).to include @other_section_user.id
    end

    it "should return users for a specified group if the receiver can access the group" do
      @course.enroll_user(@student, 'StudentEnrollment', :enrollment_state => 'active')

      expect(search_messageable_users(@this_section_user, :context => "group_#{@group.id}").map(&:id)).to eql [@this_section_user.id]
      # student can see it too, even though he's not in the group (since he can view the roster)
      expect(search_messageable_users(@student, :context => "group_#{@group.id}").map(&:id)).to eql [@this_section_user.id]
    end

    it "should respect section visibility when returning users for a specified group" do
      @course.enroll_user(@student, 'StudentEnrollment', :enrollment_state => 'active', :limit_privileges_to_course_section => true)

      @group.users << @other_section_user

      expect(search_messageable_users(@this_section_user, :context => "group_#{@group.id}").map(&:id).sort).to eql [@this_section_user.id, @other_section_user.id]
      expect(@this_section_user.count_messageable_users_in_group(@group)).to eql 2
      # student can only see people in his section
      expect(search_messageable_users(@student, :context => "group_#{@group.id}").map(&:id)).to eql [@this_section_user.id]
      expect(@student.count_messageable_users_in_group(@group)).to eql 1
    end

    it "should only show admins and the observed if the receiver is an observer" do
      @course.enroll_user(@admin, 'TeacherEnrollment', :enrollment_state => 'active')
      @course.enroll_user(@student, 'StudentEnrollment', :enrollment_state => 'active')

      observer = user_model

      enrollment = @course.enroll_user(observer, 'ObserverEnrollment', :enrollment_state => 'active')
      enrollment.associated_user_id = @student.id
      enrollment.save

      messageable_users = search_messageable_users(observer).map(&:id)
      expect(messageable_users).to include @admin.id
      expect(messageable_users).to include @student.id
      expect(messageable_users).not_to include @this_section_user.id
      expect(messageable_users).not_to include @other_section_user.id
    end

    it "should not show non-linked observers to students" do
      @course.enroll_user(@admin, 'TeacherEnrollment', :enrollment_state => 'active')
      student1, student2 = user_model, user_model
      @course.enroll_user(student1, 'StudentEnrollment', :enrollment_state => 'active')
      @course.enroll_user(student2, 'StudentEnrollment', :enrollment_state => 'active')

      observer = user_model
      enrollment = @course.enroll_user(observer, 'ObserverEnrollment', :enrollment_state => 'active')
      enrollment.associated_user_id = student1.id
      enrollment.save

      expect(search_messageable_users(student1).map(&:id)).to include observer.id
      expect(student1.count_messageable_users_in_course(@course)).to eql 8
      expect(search_messageable_users(student2).map(&:id)).not_to include observer.id
      expect(student2.count_messageable_users_in_course(@course)).to eql 7
    end

    it "should include all shared contexts and enrollment information" do
      @first_course = @course
      @first_course.enroll_user(@this_section_user, 'TaEnrollment', :enrollment_state => 'active')
      @first_course.enroll_user(@admin, 'TeacherEnrollment', :enrollment_state => 'active')

      @other_course = course_model
      @other_course.offer!
      @other_course.enroll_user(@admin, 'TeacherEnrollment', :enrollment_state => 'active')
      # other_section_user is a teacher in one course, student in another
      @other_course.enroll_user(@other_section_user, 'TeacherEnrollment', :enrollment_state => 'active')

      address_book = @admin.address_book
      search_messageable_users(@admin)
      common_courses = address_book.common_courses(@this_section_user)
      expect(common_courses.keys).to include @first_course.id
      expect(common_courses[@first_course.id].sort).to eql ['StudentEnrollment', 'TaEnrollment']

      common_courses = address_book.common_courses(@other_section_user)
      expect(common_courses.keys).to include @first_course.id
      expect(common_courses[@first_course.id].sort).to eql ['StudentEnrollment']
      expect(common_courses.keys).to include @other_course.id
      expect(common_courses[@other_course.id].sort).to eql ['TeacherEnrollment']
    end

    it "should include users with no shared contexts iff admin" do
      expect(search_messageable_users(@admin).map(&:id)).to include(@student.id)
      expect(search_messageable_users(@student).map(&:id)).not_to include(@admin.id)
    end

    it "should not do admin catch-all if specific contexts requested" do
      course1 = course_model
      course2 = course_model
      course2.offer!

      enrollment = course2.enroll_teacher(@admin)
      enrollment.workflow_state = 'active'
      enrollment.save
      @admin.reload

      enrollment = course2.enroll_student(@student)
      enrollment.workflow_state = 'active'
      enrollment.save

      expect(search_messageable_users(@admin, :context => "course_#{course1.id}").map(&:id)).not_to include(@student.id)
      expect(search_messageable_users(@admin, :context => "course_#{course2.id}").map(&:id)).to include(@student.id)
      expect(search_messageable_users(@student, :context => "course_#{course2.id}").map(&:id)).to include(@admin.id)
    end

    it "should not rank results by default" do
      @course.enroll_user(@student, 'StudentEnrollment', :enrollment_state => 'active')

      # ordered by name (all the same), then id
      expect(search_messageable_users(@student).map(&:id)).
        to eql [@student.id, @this_section_teacher.id, @this_section_user.id, @other_section_user.id, @other_section_teacher.id]
    end

    context "concluded enrollments" do
      it "should return concluded enrollments" do # i.e. you can do a bare search for people who used to be in your class
        @course.enroll_user(@student, 'StudentEnrollment', :enrollment_state => 'active')
        @this_section_user_enrollment.conclude

        expect(search_messageable_users(@this_section_user).map(&:id)).to include @this_section_user.id
        expect(search_messageable_users(@student).map(&:id)).to include @this_section_user.id
      end

      it "should not return concluded student enrollments in the course" do # when browsing a course you should not see concluded enrollments
        @course.enroll_user(@student, 'StudentEnrollment', :enrollment_state => 'active')
        @course.complete!

        expect(search_messageable_users(@this_section_user, :context => "course_#{@course.id}").map(&:id)).not_to include @this_section_user.id
        # if the course was a concluded, a student should be able to browse it and message an admin (if if the admin's enrollment concluded too)
        expect(search_messageable_users(@this_section_user, :context => "course_#{@course.id}").map(&:id)).to include @this_section_teacher.id
        expect(@this_section_user.count_messageable_users_in_course(@course)).to eql 2 # just the admins
        expect(search_messageable_users(@student, :context => "course_#{@course.id}").map(&:id)).not_to include @this_section_user.id
        expect(search_messageable_users(@student, :context => "course_#{@course.id}").map(&:id)).to include @this_section_teacher.id
        expect(@student.count_messageable_users_in_course(@course)).to eql 2
      end

      it "should return concluded enrollments in the group if they are still members" do
        @course.enroll_user(@student, 'StudentEnrollment', :enrollment_state => 'active')
        @this_section_user_enrollment.conclude

        expect(search_messageable_users(@this_section_user, :context => "group_#{@group.id}").map(&:id)).to eql [@this_section_user.id]
        expect(@this_section_user.count_messageable_users_in_group(@group)).to eql 1
        expect(search_messageable_users(@student, :context => "group_#{@group.id}").map(&:id)).to eql [@this_section_user.id]
        expect(@student.count_messageable_users_in_group(@group)).to eql 1
      end

      it "should return concluded enrollments in the group and section if they are still members" do
        enrollment = @course.enroll_user(@student, 'StudentEnrollment', :enrollment_state => 'active', :limit_privileges_to_course_section => true)
        # we currently force limit_privileges_to_course_section to be false for students; override it in the db
        Enrollment.where(:id => enrollment).update_all(:limit_privileges_to_course_section => true)

        @group.users << @other_section_user
        @this_section_user_enrollment.conclude

        expect(search_messageable_users(@this_section_user, :context => "group_#{@group.id}").map(&:id).sort).to eql [@this_section_user.id, @other_section_user.id]
        expect(@this_section_user.count_messageable_users_in_group(@group)).to eql 2
        # student can only see people in his section
        expect(search_messageable_users(@student, :context => "group_#{@group.id}").map(&:id)).to eql [@this_section_user.id]
        expect(@student.count_messageable_users_in_group(@group)).to eql 1
      end
    end

    context "weak_checks" do
      it "should optionally show invited enrollments" do
        course_factory(active_all: true)
        student_in_course(:user_state => 'creation_pending')
        expect(search_messageable_users(@teacher, weak_checks: true).map(&:id)).to include @student.id
      end

      it "should optionally show pending enrollments in unpublished courses" do
        course_factory()
        teacher_in_course(:active_all => true)
        student_in_course()
        expect(search_messageable_users(@teacher, weak_checks: true, context: @course.asset_string).map(&:id)).to include @student.id
      end
    end
  end

  context "tabs_available" do
    before(:once) { Account.default }
    it "should not include unconfigured external tools" do
      tool = Account.default.context_external_tools.new(:consumer_key => 'bob', :shared_secret => 'bob', :name => 'bob', :domain => "example.com")
      tool.course_navigation = {:url => "http://www.example.com", :text => "Example URL"}
      tool.save!
      expect(tool.has_placement?(:user_navigation)).to eq false
      user_model
      tabs = @user.profile.tabs_available(@user, :root_account => Account.default)
      expect(tabs.map{|t| t[:id] }).not_to be_include(tool.asset_string)
    end

    it "should include configured external tools" do
      tool = Account.default.context_external_tools.new(:consumer_key => 'bob', :shared_secret => 'bob', :name => 'bob', :domain => "example.com")
      tool.user_navigation = {:url => "http://www.example.com", :text => "Example URL"}
      tool.save!
      expect(tool.has_placement?(:user_navigation)).to eq true
      user_model
      tabs = @user.profile.tabs_available(@user, :root_account => Account.default)
      expect(tabs.map{|t| t[:id] }).to be_include(tool.asset_string)
      tab = tabs.detect{|t| t[:id] == tool.asset_string }
      expect(tab[:href]).to eq :user_external_tool_path
      expect(tab[:args]).to eq [@user.id, tool.id]
      expect(tab[:label]).to eq "Example URL"
    end
  end

  context "avatars" do
    before :once do
      user_model
    end

    it "should find only users with avatars set" do
      @user.avatar_state = 'submitted'
      @user.save!
      expect(User.with_avatar_state('submitted').count).to eq 0
      expect(User.with_avatar_state('any').count).to eq 0
      @user.avatar_image_url = 'http://www.example.com'
      @user.save!
      expect(User.with_avatar_state('submitted').count).to eq 1
      expect(User.with_avatar_state('any').count).to eq 1
    end

    it "should clear avatar state when assigning by service that no longer exists" do
      @user.avatar_image_url = 'http://www.example.com'
      @user.avatar_image = { 'type' => 'twitter' }
      expect(@user.avatar_image_url).to be_nil
    end

    it "should not allow external url's to be assigned" do
      @user.avatar_image = { 'type' => 'external', 'url' => 'http://www.example.com/image.jpg' }
      @user.save!
      expect(@user.reload.avatar_image_url).to eq nil
    end

    it "should allow external url's that match avatar_external_url_patterns to be assigned" do
      @user.avatar_image = { 'type' => 'external', 'url' => 'http://www.instructure.com/image.jpg' }
      @user.save!
      expect(@user.reload.avatar_image_url).to eq nil
    end

    it "should allow gravatar url's to be assigned" do
      @user.avatar_image = { 'type' => 'gravatar', 'url' => 'http://www.gravatar.com/image.jpg' }
      @user.save!
      expect(@user.reload.avatar_image_url).to eq 'http://www.gravatar.com/image.jpg'
    end

    it "should return a useful avatar_fallback_url" do
      allow(HostUrl).to receive(:protocol).and_return('https')

      expect(User.avatar_fallback_url).to eq(
        "https://#{HostUrl.default_host}/images/messages/avatar-50.png"
      )
      expect(User.avatar_fallback_url("/somepath")).to eq(
        "https://#{HostUrl.default_host}/somepath"
      )
      expect(HostUrl).to receive(:default_host).and_return('somedomain:3000')
      expect(User.avatar_fallback_url("/path")).to eq(
        "https://somedomain:3000/path"
      )
      expect(User.avatar_fallback_url("//somedomain/path")).to eq(
        "https://somedomain/path"
      )
      expect(User.avatar_fallback_url("http://somedomain/path")).to eq(
        "http://somedomain/path"
      )
      expect(User.avatar_fallback_url("http://somedomain:3000/path")).to eq(
        "http://somedomain:3000/path"
      )
      expect(User.avatar_fallback_url(nil, OpenObject.new(:host => "foo", :protocol => "http://"))).to eq(
        "http://foo/images/messages/avatar-50.png"
      )
      expect(User.avatar_fallback_url("/somepath", OpenObject.new(:host => "bar", :protocol => "https://"))).to eq(
        "https://bar/somepath"
      )
      expect(User.avatar_fallback_url("//somedomain/path", OpenObject.new(:host => "bar", :protocol => "https://"))).to eq(
        "https://somedomain/path"
      )
      expect(User.avatar_fallback_url("http://somedomain/path", OpenObject.new(:host => "bar", :protocol => "https://"))).to eq(
        "http://somedomain/path"
      )
      expect(User.avatar_fallback_url('%{fallback}')).to eq(
        '%{fallback}'
      )
    end

    describe "#clear_avatar_image_url_with_uuid" do
      before :once do
        @user.avatar_image_url = '1234567890ABCDEF'
        @user.save!
      end
      it "should raise ArgumentError when uuid nil or blank" do
        expect { @user.clear_avatar_image_url_with_uuid(nil) }.to  raise_error(ArgumentError, "'uuid' is required and cannot be blank")
        expect { @user.clear_avatar_image_url_with_uuid('') }.to raise_error(ArgumentError, "'uuid' is required and cannot be blank")
        expect { @user.clear_avatar_image_url_with_uuid('  ') }.to raise_error(ArgumentError, "'uuid' is required and cannot be blank")
      end
      it "should clear avatar_image_url when uuid matches" do
        @user.clear_avatar_image_url_with_uuid('1234567890ABCDEF')
        expect(@user.avatar_image_url).to be_nil
        expect(@user.changed?).to eq false   # should be saved
      end
      it "should not clear avatar_image_url when no match" do
        @user.clear_avatar_image_url_with_uuid('NonMatchingText')
        expect(@user.avatar_image_url).to eq '1234567890ABCDEF'
      end
      it "should not error when avatar_image_url is nil" do
        @user.avatar_image_url = nil
        @user.save!
        #
        expect { @user.clear_avatar_image_url_with_uuid('something') }.not_to raise_error
        expect(@user.avatar_image_url).to be_nil
      end
    end
  end

  it "should find sections for course" do
    course_with_student
    expect(@student.sections_for_course(@course)).to include @course.default_section
  end

  describe "name_parts" do
    it "should infer name parts" do
      expect(User.name_parts('Cody Cutrer')).to eq ['Cody', 'Cutrer', nil]
      expect(User.name_parts('  Cody  Cutrer   ')).to eq ['Cody', 'Cutrer', nil]
      expect(User.name_parts('Cutrer, Cody')).to eq ['Cody', 'Cutrer', nil]
      expect(User.name_parts('Cutrer, Cody',
                             likely_already_surname_first: true)).to eq ['Cody', 'Cutrer', nil]
      expect(User.name_parts('Cutrer, Cody Houston')).to eq ['Cody Houston', 'Cutrer', nil]
      expect(User.name_parts('Cutrer, Cody Houston',
                             likely_already_surname_first: true)).to eq ['Cody Houston', 'Cutrer', nil]
      expect(User.name_parts('St. Clair, John')).to eq ['John', 'St. Clair', nil]
      expect(User.name_parts('St. Clair, John',
                             likely_already_surname_first: true)).to eq ['John', 'St. Clair', nil]
      # sorry, can't figure this out
      expect(User.name_parts('John St. Clair')).to eq ['John St.', 'Clair', nil]
      expect(User.name_parts('Jefferson Thomas Cutrer IV')).to eq ['Jefferson Thomas', 'Cutrer', 'IV']
      expect(User.name_parts('Jefferson Thomas Cutrer, IV')).to eq ['Jefferson Thomas', 'Cutrer', 'IV']
      expect(User.name_parts('Cutrer, Jefferson, IV')).to eq ['Jefferson', 'Cutrer', 'IV']
      expect(User.name_parts('Cutrer, Jefferson, IV',
                             likely_already_surname_first: true)).to eq ['Jefferson', 'Cutrer', 'IV']
      expect(User.name_parts('Cutrer, Jefferson IV')).to eq ['Jefferson', 'Cutrer', 'IV']
      expect(User.name_parts('Cutrer, Jefferson IV',
                             likely_already_surname_first: true)).to eq ['Jefferson', 'Cutrer', 'IV']
      expect(User.name_parts(nil)).to eq [nil, nil, nil]
      expect(User.name_parts('Bob')).to eq ['Bob', nil, nil]
      expect(User.name_parts('Ho, Chi, Min')).to eq ['Chi Min', 'Ho', nil]
      expect(User.name_parts('Ho, Chi, Min')).to eq ['Chi Min', 'Ho', nil]
      # sorry, don't understand cultures that put the surname first
      # they should just manually specify their sort name
      expect(User.name_parts('Ho Chi Min')).to eq ['Ho Chi', 'Min', nil]
      expect(User.name_parts('')).to eq [nil, nil, nil]
      expect(User.name_parts('John Doe')).to eq ['John', 'Doe', nil]
      expect(User.name_parts('Junior')).to eq ['Junior', nil, nil]
      expect(User.name_parts('John St. Clair', prior_surname: 'St. Clair')).to eq ['John', 'St. Clair', nil]
      expect(User.name_parts('John St. Clair', prior_surname: 'Cutrer')).to eq ['John St.', 'Clair', nil]
      expect(User.name_parts('St. Clair', prior_surname: 'St. Clair')).to eq [nil, 'St. Clair', nil]
      expect(User.name_parts('St. Clair,')).to eq [nil, 'St. Clair', nil]
      # don't get confused by given names that look like suffixes
      expect(User.name_parts('Duing, Vi')).to eq ['Vi', 'Duing', nil]
      # we can't be perfect. don't know what to do with this
      expect(User.name_parts('Duing Chi Min, Vi')).to eq ['Duing Chi', 'Min', 'Vi']
      # unless we thought it was already last name first
      expect(User.name_parts('Duing Chi Min, Vi',
                             likely_already_surname_first: true)).to eq ['Vi', 'Duing Chi Min', nil]
    end

    it "should keep the sortable_name up to date if all that changed is the name" do
      u = User.new
      u.name = 'Cody Cutrer'
      u.save!
      expect(u.sortable_name).to eq 'Cutrer, Cody'

      u.name = 'Bracken Mosbacker'
      u.save!
      expect(u.sortable_name).to eq 'Mosbacker, Bracken'

      u.name = 'John St. Clair'
      u.sortable_name = 'St. Clair, John'
      u.save!
      expect(u.sortable_name).to eq 'St. Clair, John'

      u.name = 'Matthew St. Clair'
      u.save!
      expect(u.sortable_name).to eq "St. Clair, Matthew"

      u.name = 'St. Clair'
      u.save!
      expect(u.sortable_name).to eq "St. Clair,"
    end
  end

  context "group_member_json" do
    before :once do
      @account = Account.default
      @enrollment = course_with_student(:active_all => true)
      @section = @enrollment.course_section
      @student.sortable_name = 'Doe, John'
      @student.short_name = 'Johnny'
      @student.save
    end

    it "should include user_id, name, and display_name" do
      expect(@student.group_member_json(@account)).to eq({
        :user_id => @student.id,
        :name => 'Doe, John',
        :display_name => 'Johnny'
      })
    end

    it "should include course section (section_id and section_code) if appropriate" do
      expect(@student.group_member_json(@account)).to eq({
        :user_id => @student.id,
        :name => 'Doe, John',
        :display_name => 'Johnny'
      })

      expect(@student.group_member_json(@course)).to eq({
        :user_id => @student.id,
        :name => 'Doe, John',
        :display_name => 'Johnny',
        :sections => [ {
          :section_id => @section.id,
          :section_code => @section.section_code
        } ]
      })
    end
  end

  describe "menu_courses" do
    it "should include temporary invitations" do
      user_with_pseudonym(:active_all => 1)
      @user1 = @user
      user_factory
      @user2 = @user
      @user2.update_attribute(:workflow_state, 'creation_pending')
      @user2.communication_channels.create!(:path => @cc.path)
      course_factory(active_all: true)
      @course.enroll_user(@user2)

      expect(@user1.menu_courses).to eq [@course]
    end
  end

  describe "favorites" do
    before :once do
      @user = User.create!

      @courses = []
      (1..3).each do |x|
        course = course_with_student(:course_name => "Course #{x}", :user => @user, :active_all => true).course
        @courses << course
        @user.favorites.first_or_create!(:context_type => "Course", :context_id => course)
      end

      @user.save!
    end

    it "should default favorites to enrolled courses when favorite courses do not exist" do
      @user.favorites.by("Course").destroy_all
      expect(@user.menu_courses.to_set).to eq @courses.to_set
    end

    it "should only include favorite courses when set" do
      course = @courses.shift
      @user.favorites.where(context_type: "Course", context_id: course).first.destroy
      expect(@user.menu_courses.to_set).to eq @courses.to_set
    end

    context "sharding" do
      specs_require_sharding

      before :each do
        account2 = @shard1.activate { account_model }
        (4..6).each do |x|
          course = course_with_student(:course_name => "Course #{x}", :user => @user, :active_all => true, :account => account2).course
          @courses << course
          @user.favorites.first_or_create!(:context_type => "Course", :context_id => course)
        end
      end

      it "should include cross shard favorite courses" do
        @user.favorites.by("Course").where("id % 2 = 0").destroy_all
        expect(@user.menu_courses.size).to eql(@courses.length / 2)
      end
    end
  end

  describe "adding to favorites on enrollment" do
    it "doesn't add a favorite if no course favorites already exist" do
      course_with_student(:active_all => true)
      expect(@student.favorites.count).to eq 0
    end

    it "adds a favorite if any course favorites already exist" do
      u = User.create!

      c1 = course_with_student(:active_all => true, :user => u).course
      u.favorites.create!(:context_type => "Course", :context_id => c1)

      c2 = course_with_student(:active_all => true, :user => u).course
      expect(u.favorites.where(:context_type => "Course", :context_id => c2).exists?).to eq true
    end
  end

  describe "cached_current_enrollments" do
    it "should include temporary invitations" do
      user_with_pseudonym(:active_all => 1)
      @user1 = @user
      user_factory
      @user2 = @user
      @user2.update_attribute(:workflow_state, 'creation_pending')
      @user2.communication_channels.create!(:path => @cc.path)
      course_factory(active_all: true)
      @enrollment = @course.enroll_user(@user2)

      expect(@user1.cached_current_enrollments).to eq [@enrollment]
    end

    context "sharding" do
      specs_require_sharding

      it "should include enrollments from all shards" do
        user = User.create!
        course1 = Account.default.courses.create!
        course1.offer!
        e1 = course1.enroll_student(user)
        e2 = @shard1.activate do
          account2 = Account.create!
          course2 = account2.courses.create!
          course2.offer!
          course2.enroll_student(user)
        end
        expect(user.cached_current_enrollments).to eq [e1, e2]
      end
    end
  end

  describe "#find_or_initialize_pseudonym_for_account" do
    before :once do
      @account1 = Account.create!
      @account2 = Account.create!
      @account3 = Account.create!
    end

    it "should create a copy of an existing pseudonym" do
      # from unrelated account
      user_with_pseudonym(:active_all => 1, :account => @account2, :username => 'unrelated@example.com', :password => 'abcdefgh')
      new_pseudonym = @user.find_or_initialize_pseudonym_for_account(@account1)
      expect(new_pseudonym).not_to be_nil
      expect(new_pseudonym).to be_new_record
      expect(new_pseudonym.unique_id).to eq 'unrelated@example.com'

      # from default account
      @user.pseudonyms.create!(:unique_id => 'default@example.com', :password => 'abcdefgh', :password_confirmation => 'abcdefgh')
      @user.pseudonyms.create!(:account => @account3, :unique_id => 'preferred@example.com', :password => 'abcdefgh', :password_confirmation => 'abcdefgh')
      new_pseudonym = @user.find_or_initialize_pseudonym_for_account(@account1)
      expect(new_pseudonym).not_to be_nil
      expect(new_pseudonym).to be_new_record
      expect(new_pseudonym.unique_id).to eq 'default@example.com'

      # from site admin account
      site_admin_pseudo = @user.pseudonyms.create!(:account => Account.site_admin, :unique_id => 'siteadmin@example.com', :password => 'abcdefgh', :password_confirmation => 'abcdefgh')
      new_pseudonym = @user.find_or_initialize_pseudonym_for_account(@account1)
      expect(new_pseudonym).not_to be_nil
      expect(new_pseudonym).to be_new_record
      expect(new_pseudonym.unique_id).to eq 'siteadmin@example.com'

      site_admin_pseudo.destroy
      @user.reload
      # from preferred account
      new_pseudonym = @user.find_or_initialize_pseudonym_for_account(@account1, @account3)
      expect(new_pseudonym).not_to be_nil
      expect(new_pseudonym).to be_new_record
      expect(new_pseudonym.unique_id).to eq 'preferred@example.com'

      # from unrelated account, if other options are not viable
      user2 = User.create!
      @account1.pseudonyms.create!(:user => user2, :unique_id => 'preferred@example.com', :password => 'abcdefgh', :password_confirmation => 'abcdefgh')
      @user.pseudonyms.detect { |p| p.account == Account.site_admin }.update_attribute(:password_auto_generated, true)
      Account.default.authentication_providers.create!(:auth_type => 'cas')
      Account.default.authentication_providers.first.move_to_bottom
      new_pseudonym = @user.find_or_initialize_pseudonym_for_account(@account1, @account3)
      expect(new_pseudonym).not_to be_nil
      expect(new_pseudonym).to be_new_record
      expect(new_pseudonym.unique_id).to eq 'unrelated@example.com'
      new_pseudonym.save!
      expect(new_pseudonym.valid_password?('abcdefgh')).to be_truthy
    end

    it "should not create a new one when there are no viable candidates" do
      # no pseudonyms
      user_factory
      expect(@user.find_or_initialize_pseudonym_for_account(@account1)).to be_nil

      # auto-generated password
      @user.pseudonyms.create!(:account => @account2, :unique_id => 'bracken@instructure.com')
      expect(@user.find_or_initialize_pseudonym_for_account(@account1)).to be_nil

      # delegated auth
      @account3.authentication_providers.create!(:auth_type => 'cas')
      @account3.authentication_providers.first.move_to_bottom
      expect(@account3).to be_delegated_authentication
      @user.pseudonyms.create!(:account => @account3, :unique_id => 'jacob@instructure.com', :password => 'abcdefgh', :password_confirmation => 'abcdefgh')
      expect(@user.find_or_initialize_pseudonym_for_account(@account1)).to be_nil

      # conflict
      @user2 = User.create! { |u| u.workflow_state = 'registered' }
      @user2.pseudonyms.create!(:account => @account1, :unique_id => 'jt@instructure.com', :password => 'abcdefgh', :password_confirmation => 'abcdefgh')
      @user.pseudonyms.create!(:unique_id => 'jt@instructure.com', :password => 'ghijklmn', :password_confirmation => 'ghijklmn')
      expect(@user.find_or_initialize_pseudonym_for_account(@account1)).to be_nil
    end

    context "sharding" do
      specs_require_sharding

      before :once do
        @shard1.activate do
          account = Account.create!
          user_with_pseudonym(:active_all => 1, :account => account, :password => 'qwertyuiop')
        end
      end

      it "should copy a pseudonym from another shard" do
        p = @user.find_or_initialize_pseudonym_for_account(Account.site_admin)
        expect(p).to be_new_record
        p.save!
        expect(p.valid_password?('qwertyuiop')).to be_truthy
      end
    end
  end

  describe "can_be_enrolled_in_course?" do
    before :once do
      course_factory active_all: true
    end

    it "should allow a user with a pseudonym in the course's root account" do
      user_with_pseudonym account: @course.root_account, active_all: true
      expect(@user.can_be_enrolled_in_course?(@course)).to be_truthy
    end

    it "should allow a temporary user with an existing enrollment but no pseudonym" do
      @user = User.create! { |u| u.workflow_state = 'creation_pending' }
      @course.enroll_student(@user)
      expect(@user.can_be_enrolled_in_course?(@course)).to be_truthy
    end

    it "should not allow a registered user with an existing enrollment but no pseudonym" do
      user_factory active_all: true
      @course.enroll_student(@user)
      expect(@user.can_be_enrolled_in_course?(@course)).to be_falsey
    end

    it "should not allow a user with neither an enrollment nor a pseudonym" do
      user_factory active_all: true
      expect(@user.can_be_enrolled_in_course?(@course)).to be_falsey
    end
  end

  describe "email_channel" do
    it "should not return retired channels" do
      u = User.create!
      retired = u.communication_channels.create!(:path => 'retired@example.com', :path_type => 'email') { |cc| cc.workflow_state = 'retired'}
      expect(u.email_channel).to be_nil
      active = u.communication_channels.create!(:path => 'active@example.com', :path_type => 'email') { |cc| cc.workflow_state = 'active'}
      expect(u.email_channel).to eq active
    end
  end

  describe "email=" do
    it "should work" do
      @user = User.create!
      @user.email = 'john@example.com'
      expect(@user.communication_channels.map(&:path)).to eq ['john@example.com']
      expect(@user.email).to eq 'john@example.com'
    end

    it "doesn't create channels with empty paths" do
      @user = User.create!
      expect(-> {@user.email = ''}).to raise_error("Validation failed: Path can't be blank, Email is invalid")
      expect(@user.communication_channels.any?).to be_falsey
    end
  end

  describe "event methods" do
    describe "calendar_events_for_calendar" do
      before(:once) { course_with_student(:active_all => true) }
      it "should include own scheduled appointments" do
        ag = AppointmentGroup.create!(:title => 'test appointment', :contexts => [@course], :new_appointments => [[Time.now, Time.now + 1.hour], [Time.now + 1.hour, Time.now + 2.hour]])
        ag.appointments.first.reserve_for(@user, @user)
        events = @user.calendar_events_for_calendar
        expect(events.size).to eql 1
        expect(events.first.title).to eql 'test appointment'
      end

      it "should include manageable appointments" do
        @user = @course.instructors.first
        ag = AppointmentGroup.create!(:title => 'test appointment', :contexts => [@course], :new_appointments => [[Time.now, Time.now + 1.hour]])
        events = @user.calendar_events_for_calendar
        expect(events.size).to eql 1
        expect(events.first.title).to eql 'test appointment'
      end

      it "should not include unpublished assignments" do
        as = @course.assignments.create!({:title => "Published", :due_at => 2.days.from_now})
        as.publish
        as2 = @course.assignments.create!({:title => "Unpublished", :due_at => 2.days.from_now})
        as2.unpublish
        events = @user.calendar_events_for_calendar(:contexts => [@course])
        expect(events.size).to eql 1
        expect(events.first.title).to eql 'Published'
      end
    end

    describe "upcoming_events" do
      before(:once) { course_with_teacher(:active_all => true) }
      it "handles assignments where the applied due_at is nil" do
        assignment = @course.assignments.create!(:title => "Should not throw",
                                                 :due_at => 1.days.from_now)
        assignment2 = @course.assignments.create!(:title => "Should not throw2",
                                                  :due_at => 1.days.from_now)
        section = @course.course_sections.create!(:name => "VDD Section")
        override = assignment.assignment_overrides.build
        override.set = section
        override.due_at = nil
        override.due_at_overridden = true
        override.save!

        events = []
        # handles comparison of nil due dates if that is what applies to the
        # user instead of failing.
        expect do
          events = @user.upcoming_events(:end_at => 1.week.from_now)
        end.to_not raise_error

        expect(events.first).to eq assignment2
        expect(events.second).to eq assignment
      end

      it "doesn't show unpublished assignments" do
        assignment = @course.assignments.create!(:title => "not published", :due_at => 1.days.from_now)
        assignment.unpublish
        assignment2 = @course.assignments.create!(:title => "published", :due_at => 1.days.from_now)
        assignment2.publish
        events = []
        events = @user.upcoming_events(:end_at => 1.week.from_now)
        expect(events.first).to eq assignment2
      end

      it "doesn't include events for enrollments that are inactive due to date" do
        @enrollment.start_at = 1.day.ago
        @enrollment.end_at = 2.days.from_now
        @enrollment.save!
        event = @course.calendar_events.create!(title: 'published', start_at: 4.days.from_now)
        expect(@user.upcoming_events).to include(event)
        Timecop.freeze(3.days.from_now) do
          EnrollmentState.recalculate_expired_states # runs periodically in background
          expect(User.find(@user.id).upcoming_events).not_to include(event) # re-find user to clear cached_contexts
        end
      end

      context "after db section context_code filtering" do
        before do
          course_with_teacher(:active_all => true)
          @student = user_factory(active_user: true)
          @sections = []
          @events = []
          3.times { @sections << @course.course_sections.create! }
          start_at = 1.day.from_now
          # create three sections and three child events that will be retrieved in the same order
          data = {}
          @sections.each_with_index do |section, i|
            data[i] = {:start_at => start_at, :end_at => start_at + 1.day, :context_code => section.asset_string}
            start_at += 1.day
          end
          event = @course.calendar_events.build(:title => 'event', :child_event_data => data)
          event.updating_user = @teacher
          event.save!
          @events = event.child_events.sort_by(&:context_code)
        end

        it "should be able to filter section events after fetching" do
          # trigger the after db filtering
          allow(Setting).to receive(:get).with(anything, anything).and_return('')
          allow(Setting).to receive(:get).with('filter_events_by_section_code_threshold', anything).and_return(0)
          @course.enroll_student(@student, :section => @sections[1], :enrollment_state => 'active', :allow_multiple_enrollments => true)
          expect(@student.upcoming_events(:limit => 2)).to eq [@events[1]]
        end

        it "should use the old behavior as a fallback" do
          allow(Setting).to receive(:get).with(anything, anything).and_return('')
          allow(Setting).to receive(:get).with('filter_events_by_section_code_threshold', anything).and_return(0)
          # the optimized call will retrieve the first two events, and then filter them out
          # since it didn't retrieve enough events it will use the old code as a fallback
          @course.enroll_student(@student, :section => @sections[2], :enrollment_state => 'active', :allow_multiple_enrollments => true)
          expect(@student.upcoming_events(:limit => 2)).to eq [@events[2]]
        end
      end
    end
  end

  describe "select_upcoming_assignments" do
    it "filters based on assignment date for asignments the user cannot delete" do
      time = Time.now + 1.day
      assignments = [double, double, double]
      user = User.new
      assignments.each do |assignment|
        allow(assignment).to receive_messages(:due_at => time)
        expect(assignment).to receive(:grants_right?).with(user, :delete).and_return false
      end
      expect(user.select_upcoming_assignments(assignments,{:end_at => time})).to eq assignments
    end

    it "returns assignments that have an override between now and end_at opt" do
      assignments = [double, double, double, double]
      Timecop.freeze(Time.utc(2013,3,13,0,0)) do
        user = User.new
        due_date1 = {:due_at => Time.now + 1.day}
        due_date2 = {:due_at => Time.now + 1.week}
        due_date3 = {:due_at => 2.weeks.from_now }
        due_date4 = {:due_at => nil }
        assignments.each do |assignment|
          expect(assignment).to receive(:grants_right?).with(user, :delete).and_return true
        end
        expect(assignments.first).to receive(:dates_hash_visible_to).with(user).
          and_return [due_date1]
        expect(assignments.second).to receive(:dates_hash_visible_to).with(user).
          and_return [due_date2]
        expect(assignments.third).to receive(:dates_hash_visible_to).with(user).
          and_return [due_date3]
        expect(assignments[3]).to receive(:dates_hash_visible_to).with(user).
          and_return [due_date4]
        upcoming_assignments = user.select_upcoming_assignments(assignments,{
          :end_at => 1.week.from_now
        })
        expect(upcoming_assignments).to include assignments.first
        expect(upcoming_assignments).to include assignments.second
        expect(upcoming_assignments).not_to include assignments.third
        expect(upcoming_assignments).not_to include assignments[3]
      end
    end
  end

  describe "assignments_visible_in_course" do
    before do
      @teacher_enrollment = course_with_teacher(:active_course => true)
      @course_section = @course.course_sections.create
      @student1 = User.create
      @student2 = User.create
      @student3 = User.create
      @assignment = Assignment.create!(title: "title", context: @course, only_visible_to_overrides: true)
      @unpublished_assignment = Assignment.create!(title: "title", context: @course, only_visible_to_overrides: false)
      @unpublished_assignment.unpublish
      @course.enroll_student(@student2, :enrollment_state => 'active')
      @section = @course.course_sections.create!(name: "test section")
      student_in_section(@section, user: @student1)
      create_section_override_for_assignment(@assignment, {course_section: @section})
      @course.reload
    end

    context "as student" do
      it "should return assignments only when a student has overrides" do
        expect(@student1.assignments_visible_in_course(@course).include?(@assignment)).to be_truthy
        expect(@student2.assignments_visible_in_course(@course).include?(@assignment)).to be_falsey
        expect(@student1.assignments_visible_in_course(@course).include?(@unpublished_assignment)).to be_falsey
      end
    end

    context "as teacher" do
      it "should return all assignments" do
        expect(@teacher_enrollment.user.assignments_visible_in_course(@course).include?(@assignment)).to be_truthy
        expect(@teacher_enrollment.user.assignments_visible_in_course(@course).include?(@unpublished_assignment)).to be_truthy
      end
    end

    context "as observer" do
      before do
        @observer = User.create
        @observer_enrollment = @course.enroll_user(@observer, 'ObserverEnrollment', :section => @section2, :enrollment_state => 'active', :allow_multiple_enrollments => true)
      end
      context "observer watching student with visibility" do
        before{ @observer_enrollment.update_attribute(:associated_user_id, @student1.id) }
        it "should be true" do
          expect(@observer.assignments_visible_in_course(@course).include?(@assignment)).to be_truthy
        end
      end
      context "observer watching student without visibility" do
        before{ @observer_enrollment.update_attribute(:associated_user_id, @student2.id) }
        it "should be false" do
          expect(@observer.assignments_visible_in_course(@course).include?(@assignment)).to be_falsey
        end
      end
      context "observer watching a only section" do
        it "should be true" do
          expect(@observer.assignments_visible_in_course(@course).include?(@assignment)).to be_truthy
        end
      end
    end
  end

  describe "assignments_needing_submitting" do
    # NOTE: More thorough testing of the Assignment#not_locked named scope is in assignment_spec.rb
    context "locked assignments" do
      before :once do
        course_with_student(:active_all => true)
        assignment_quiz([], :course => @course, :user => @user)
      end

      before :each do
        user_session(@user)
        # Setup default values for tests (leave unsaved for easy changes)
        @quiz.unlock_at = nil
        @quiz.lock_at = nil
        @quiz.due_at = 2.days.from_now
      end

      it "includes assignments with no due date but have overrides that are due" do
        @quiz.due_at = nil
        @quiz.save!
        section = @course.course_sections.create! :name => "Test"
        @student = student_in_section section
        override = @quiz.assignment.assignment_overrides.build
        override.title = "Shows up in todos"
        override.set_type = 'CourseSection'
        override.set = section
        override.due_at = 1.weeks.from_now - 1.day
        override.due_at_overridden = true
        override.save!
        expect(@student.assignments_needing_submitting(:contexts => [@course])).
          to include @quiz.assignment
      end
      it "should include assignments with no locks" do
        @quiz.save!
        list = @student.assignments_needing_submitting(:contexts => [@course])
        expect(list.size).to eql 1
        expect(list.first.title).to eql 'Test Assignment'
      end
      it "should include assignments with unlock_at in the past" do
        @quiz.unlock_at = 1.hour.ago
        @quiz.save!
        list = @student.assignments_needing_submitting(:contexts => [@course])
        expect(list.size).to eql 1
        expect(list.first.title).to eql 'Test Assignment'
      end
      it "should include assignments with lock_at in the future" do
        @quiz.lock_at = 1.hour.from_now
        @quiz.save!
        list = @student.assignments_needing_submitting(:contexts => [@course])
        expect(list.size).to eql 1
        expect(list.first.title).to eql 'Test Assignment'
      end
      it "should not include assignments where unlock_at is in future" do
        @quiz.unlock_at = 1.hour.from_now
        @quiz.save!
        expect(@student.assignments_needing_submitting(:contexts => [@course]).count).to eq 0
      end
      it "should not include assignments where lock_at is in past" do
        @quiz.lock_at = 1.hour.ago
        @quiz.save!
        expect(@student.assignments_needing_submitting(:contexts => [@course]).count).to eq 0
      end

      context "include_locked" do
        it "should include assignments where unlock_at is in future" do
          @quiz.unlock_at = 1.hour.from_now
          @quiz.save!
          expect(@student.assignments_needing_submitting(:include_locked => true, :contexts => [@course]).count).to eq 1
        end
        it "should include assignments where lock_at is in past" do
          @quiz.lock_at = 1.hour.ago
          @quiz.save!
          expect(@student.assignments_needing_submitting(:include_locked => true, :contexts => [@course]).count).to eq 1
        end
      end

      context "include_concluded" do
        before :once do
          @u = User.create!

          @c1 = course_with_student(:active_all => true, :user => @u).course
          @q1 = assignment_quiz([], :course => @c1, :user => @user)

          @e2 = course_with_student(:active_all => true, :user => @u)
          @c2 = @e2.course
          @q2 = assignment_quiz([], :course => @c2, :user => @user)
          @e2.conclude
        end

        it "should not include assignments from concluded enrollments by default" do
          expect(@u.assignments_needing_submitting().count).to eq 1
        end

        it "should include assignments from concluded enrollments if requested" do
          expect(@u.assignments_needing_submitting(include_concluded: true).count).to eq 2
          expect(@u.assignments_needing_submitting(include_concluded: true).map(&:id).sort).to eq [@q1.assignment.id, @q2.assignment.id].sort
        end
      end

      context "only_favorites" do
        before :once do
          @u = User.create!

          @c1 = course_with_student(:active_all => true, :user => @u).course
          @u.favorites.create!(:context_type => "Course", :context_id => @c1)
          @q1 = assignment_quiz([], :course => @c1, :user => @user)

          @c2 = course_with_student(:active_all => true, :user => @u).course
          @u.favorites.where(:context_type => "Course", :context_id => @c2).first.destroy
          @q2 = assignment_quiz([], :course => @c2, :user => @user)
        end

        it "should include assignments from all courses by default" do
          expect(@u.assignments_needing_submitting().count).to eq 2
        end

        it "should not include assignments from unfavorited courses if requested" do
          expect(@u.assignments_needing_submitting(only_favorites: true).count).to eq 1
          expect(@u.assignments_needing_submitting(only_favorites: true).map(&:id)).to be_include @q1.assignment.id
        end
      end
    end

    it "should not include unpublished assignments" do
      course_with_student(:active_all => true)
      assignment_quiz([], :course => @course, :user => @user)
      @assignment.unpublish
      @quiz.unlock_at = 1.hour.ago
      @quiz.lock_at = nil
      @quiz.due_at = 2.days.from_now
      @quiz.save!
      assignment_quiz([], :course => @course, :user => @user)
      @quiz.unlock_at = 1.hour.ago
      @quiz.lock_at = nil
      @quiz.due_at = 2.days.from_now
      @quiz.save!

      expect(@student.assignments_needing_submitting(:contexts => [@course]).count).to eq 1
    end

    it "should not include assignments from soft concluded courses" do
      course_with_student(:active_all => true)
      @course.enrollment_term.update_attribute(:end_at, 1.day.from_now)
      assignment_quiz([], :course => @course, :user => @user)
      @quiz.unlock_at = nil
      @quiz.lock_at = nil
      @quiz.due_at = 3.days.from_now
      @quiz.save!
      Timecop.travel(2.days) do
        EnrollmentState.recalculate_expired_states # runs periodically in background
        expect(@student.assignments_needing_submitting(:contexts => [@course]).count).to eq 0
      end
    end

    it "should always have the only_visible_to_overrides attribute" do
      course_with_student(:active_all => true)
      assignment_quiz([], :course => @course, :user => @user)
      @quiz.unlock_at = nil
      @quiz.lock_at = nil
      @quiz.due_at = 2.days.from_now
      @quiz.save!
      assignments = @student.assignments_needing_submitting(:contexts => [@course])
      expect(assignments[0].has_attribute?(:only_visible_to_overrides)).to be_truthy
    end

    def create_course_with_assignment_needing_submitting(opts={})
      student = opts[:student]
      course_with_student(:active_all => true, :user => student)
      @course.enrollments.each(&:destroy_permanently!) #student removed from default section
      section = @course.course_sections.create!
      student_in_section(section, user: student)
      assignment_quiz([], :course => @course, :user => student)
      @assignment.only_visible_to_overrides = true
      @assignment.publish
      @quiz.due_at = 2.days.from_now
      @quiz.save!
      if opts[:override]
        create_section_override_for_assignment(@assignment, {course_section: section})
      end
      @assignment
    end

    context "differentiated_assignments" do
      before {@student = User.create!(name: "Test Student")}
      it "should not return the assignments without an override" do
        assignment = create_course_with_assignment_needing_submitting({override: false, student: @student})
        expect(@student.assignments_needing_submitting(contexts: Course.all).include?(assignment)).to be_falsey
      end

      it "should return the assignments with an override" do
        assignment = create_course_with_assignment_needing_submitting({override: true, student: @student})
        expect(@student.assignments_needing_submitting(contexts: Course.all).include?(assignment)).to be_truthy
      end
    end

    context "sharding" do
      specs_require_sharding

      it "includes assignments from other shards" do
        student = @shard1.activate { user_factory }
        assignment = create_course_with_assignment_needing_submitting(student: student, override: true)
        expect(student.assignments_needing_submitting).to eq [assignment]
      end
    end

    context "ungraded assignments" do
      before :once do
        course_with_student :active_all => true
        @assignment = @course.assignments.create! title: 'blah!', due_at: 1.day.from_now, submission_types: 'not_graded'
        @past_assignment = @course.assignments.create! title: 'blah!', due_at: 1.day.ago, submission_types: 'not_graded'
      end

      it "excludes ungraded assignments by default" do
        expect(@student.assignments_needing_submitting).not_to include @assignment
        expect(@student.assignments_needing_submitting).not_to include @past_assignment
      end

      it "includes future ungraded assignments if requested" do
        expect(@student.assignments_needing_submitting(include_ungraded: true)).to include @assignment
        expect(@student.assignments_needing_submitting(include_ungraded: true)).not_to include @past_assignment
      end
    end
  end

  describe "ungraded_quizzes" do
    before(:once) do
      course_with_student :active_all => true
      @quiz = @course.quizzes.create!(:title => "some quiz", :quiz_type => "survey", :due_at => 1.day.from_now)
      @quiz.publish!
    end

    it "includes ungraded quizzes" do
      expect(@student.ungraded_quizzes(:needing_submitting => true)).to include @quiz
    end

    it "excludes graded quizzes" do
      other_quiz = @course.quizzes.create!(:title => "some quiz", :quiz_type => "assignment", :due_at => 1.day.from_now)
      other_quiz.publish!
      expect(@student.ungraded_quizzes(:needing_submitting => true)).not_to include other_quiz
    end

    it "excludes unpublished quizzes" do
      other_quiz = @course.quizzes.create!(:title => "some quiz", :quiz_type => "survey", :due_at => 1.day.from_now)
      expect(@student.ungraded_quizzes(:needing_submitting => true)).not_to include other_quiz
    end

    it "excludes locked quizzes" do
      @quiz.unlock_at = 1.day.from_now
      @quiz.save!
      expect(@student.ungraded_quizzes(:needing_submitting => true)).not_to include @quiz
    end

    it "includes locked quizzes if requested" do
      @quiz.unlock_at = 1.day.from_now
      @quiz.save!
      expect(@student.ungraded_quizzes(include_locked: true, needing_submitting: true)).to include @quiz
    end

    it "filters by due date" do
      expect(@student.ungraded_quizzes(:due_after => 2.days.from_now, :needing_submitting => true)).not_to include @quiz
    end

    it "excludes submitted quizzes unless requested" do
      qs = @quiz.quiz_submissions.build :user => @student
      qs.workflow_state = 'complete'
      qs.save!
      expect(@student.ungraded_quizzes(:needing_submitting => true)).not_to include @quiz
      expect(@student.ungraded_quizzes(:needing_submitting => false)).to include @quiz
    end

    it "filters by enrollment state" do
      @student.enrollments.where(course: @course).first.complete!
      expect(@student.ungraded_quizzes(:needing_submitting => true)).not_to include @quiz
    end

    context "sharding" do
      specs_require_sharding
      it "includes quizzes from other shards" do
        other_user = @shard1.activate { user_factory }
        student_in_course :course => @course, :user => other_user, :active_all => true
        expect(other_user.ungraded_quizzes(:needing_submitting => true)).to include @quiz
      end
    end
  end

  describe "submissions_needing_peer_review" do
    before(:each) do
      @reviewer = course_with_student(active_all: true).user
      @reviewee = course_with_student(course: @course, active_all: true).user
      assignment_model(course: @course, peer_reviews: true)

      @reviewer_submission = submission_model(assignment: @assignment, user: @reviewer)
      @reviewee_submission = submission_model(assignment: @assignment, user: @reviewee)
      @assessment_request = @assignment.assign_peer_review(@reviewer, @reviewee)
    end

    it "should included assessment requests where the user is the assessor" do
      expect(@reviewer.submissions_needing_peer_review.length).to eq 1
    end

    it "should not include assessment requests that have been ignored" do
      Ignore.create!(asset: @assessment_request, user: @reviewer, purpose: 'reviewing')
      expect(@reviewer.submissions_needing_peer_review.length).to eq 0
    end

    it "should not include assessment requests the user does not have permission to perform" do
      @assignment.peer_reviews = false
      @assignment.save!
      expect(@reviewer.submissions_needing_peer_review.length).to eq 0
    end
  end

  describe "wiki_pages_needing_viewing" do
    before(:each) do
      course_with_student(active_all: true)
      @course_page = wiki_page_model(course: @course)
      @group_category = @course.group_categories.create(name: 'Project Group')
      @group1 = group_model(name: 'Project Group 1', group_category: @group_category, context: @course)
      group_membership_model(group: @group1, user: @student)
      @group_page = wiki_page_model(course: @group1)
      account = @course.account
      @group_category = account.group_categories.create(name: 'Project Group')
      @group2 = group_model(name: 'Project Group 1', group_category: @group_category, context: account)
      group_membership_model(group: @group2, user: @student)
      @account_page = wiki_page_model(course: @group2)
    end

    let(:opts) { {due_after: 1.day.ago, due_before: 2.days.from_now} }

    it 'should show for wiki pages with todo dates within the opts date range' do
      @course_page.todo_date = 1.day.from_now
      @group_page.todo_date = 1.day.from_now
      @account_page.todo_date = 1.day.from_now
      pages = [@course_page, @group_page, @account_page]
      pages.each(&:save!)
      expect(@student.wiki_pages_needing_viewing(opts).sort_by(&:id)).to eq pages
    end

    it 'should not show for wiki pages with todo dates outside the range' do
      @course_page.todo_date = 3.days.ago
      @group_page.todo_date = 3.days.ago
      @account_page.todo_date = 3.days.ago
      pages = [@course_page, @group_page, @account_page]
      pages.each(&:save!)
      expect(@student.wiki_pages_needing_viewing(opts)).to eq []
    end

    it 'should not show for wiki pages without todo dates' do
      expect(@student.wiki_pages_needing_viewing(opts)).to eq []
    end

    it 'should not show unpublished pages' do
      teacher_in_course(course: @course)
      @course_page.workflow_state = 'unpublished'
      @course_page.todo_date = 1.day.from_now
      @course_page.save!
      @group_page.workflow_state = 'unpublished'
      @group_page.todo_date = 1.day.from_now
      @account_page.workflow_state = 'unpublished'
      @account_page.todo_date = 1.day.from_now
      pages = [@course_page, @group_page, @account_page]
      pages.each(&:save!)
      expect(@student.wiki_pages_needing_viewing(opts)).to eq []
      expect(@teacher.wiki_pages_needing_viewing(opts)).to eq []
    end

    it 'should not show for users not enrolled in course' do
      @course_page.todo_date = 1.day.from_now
      @group_page.todo_date = 1.day.from_now
      @account_page.todo_date = 1.day.from_now
      pages = [@course_page, @group_page, @account_page]
      pages.each(&:save!)
      user1 = @student
      course_with_student(active_all: true)
      expect(user1.wiki_pages_needing_viewing(opts).sort_by(&:id)).to eq pages
      expect(@student.wiki_pages_needing_viewing(opts)).to eq []
    end

    it 'should not show wiki pages that are not released to the user' do
      @course.enable_feature!(:conditional_release)
      @course_page.todo_date = 1.day.from_now
      @course_page.save!
      add_section('Section 2')
      student2 = student_in_section(@course_section)
      wiki_page_assignment_model(wiki_page: @course_page)
      differentiated_assignment(assignment: @assignment, course_section: @course_section)
      expect(@student.wiki_pages_needing_viewing(opts)).to eq []
      expect(student2.wiki_pages_needing_viewing(opts)).to eq [@course_page]
    end

    context "include_concluded" do
      before :once do
        @u = User.create!

        @c1 = course_with_student(:active_all => true, :user => @u).course
        @wp1 = wiki_page_model(:course => @c1)
        @wp1.todo_date = Time.zone.now
        @wp1.save!

        @e2 = course_with_student(:active_all => true, :user => @u)
        @c2 = @e2.course
        @wp2 = wiki_page_model(:course => @c2)
        @wp2.todo_date = Time.zone.now
        @wp2.save!
        @e2.conclude
      end

      it "should not include pages from concluded enrollments by default" do
        expect(@u.wiki_pages_needing_viewing(opts).count).to eq 1
      end

      it "should include pages from concluded enrollments if requested" do
        expect(@u.wiki_pages_needing_viewing(opts.merge(include_concluded: true)).count).to eq 2
        expect(@u.wiki_pages_needing_viewing(opts.merge(include_concluded: true)).map(&:id).sort).to eq [@wp1.id, @wp2.id].sort
      end
    end

    context "only_favorites" do
      before :once do
        @u = User.create!

        @c1 = course_with_student(:active_all => true, :user => @u).course
        @u.favorites.create!(:context_type => "Course", :context_id => @c1)
        @wp1 = wiki_page_model(:course => @c1)
        @wp1.todo_date = Time.zone.now
        @wp1.save!

        @c2 = course_with_student(:active_all => true, :user => @u).course
        @u.favorites.where(:context_type => "Course", :context_id => @c2).first.destroy
        @wp2 = wiki_page_model(:course => @c2)
        @wp2.todo_date = Time.zone.now
        @wp2.save!
      end

      it "should include pages from all courses by default" do
        expect(@u.wiki_pages_needing_viewing(opts).count).to eq 2
      end

      it "should not include pages from unfavorited courses if requested" do
        expect(@u.wiki_pages_needing_viewing(opts.merge(only_favorites: true)).count).to eq 1
        expect(@u.wiki_pages_needing_viewing(opts.merge(only_favorites: true)).map(&:id)).to be_include @wp1.id
      end
    end
  end

  describe "discussion_topics_needing_viewing" do
    let(:opts) { {due_after: 1.day.ago, due_before: 2.days.from_now} }

    context 'course discussions' do
      before(:each) do
        course_with_student(active_all: true)
        discussion_topic_model(context: @course)
        group_discussion_topic_model(context: @course)
        announcement_model(context: @course)
        @topic.publish!
        @group_topic.publish!
        @a.publish!
      end

      it 'should show for ungraded discussion topics with todo dates within the opts date range' do
        @topic.todo_date = 1.day.from_now
        @topic.save!
        @group_topic.todo_date = 1.day.from_now
        @group_topic.save!
        expect(@student.discussion_topics_needing_viewing(opts).sort_by(&:id)).to eq [@topic, @group_topic, @a]
      end

      it 'should not show for ungraded discussion topics with todo dates outside the range' do
        @topic.todo_date = 3.days.ago
        @topic.save!
        @group_topic.todo_date = 3.days.ago
        @group_topic.save!
        @a.posted_at = 3.days.ago
        @a.save!
        expect(@student.discussion_topics_needing_viewing(opts)).to eq []
      end

      it 'should not show for ungraded discussion topics without todo dates' do
        expect(@student.discussion_topics_needing_viewing(opts)).to eq [@a]
      end

      it 'should not show unpublished discussion topics' do
        teacher_in_course(course: @course)
        @topic.workflow_state = 'unpublished'
        @topic.todo_date = 1.day.from_now
        @topic.save!
        @group_topic.workflow_state = 'unpublished'
        @group_topic.todo_date = 1.day.from_now
        @group_topic.save!
        @a.delayed_post_at = 1.day.from_now
        @a.workflow_state = 'post_delayed'
        @a.save!
        expect(@student.discussion_topics_needing_viewing(opts)).to eq []
        expect(@teacher.discussion_topics_needing_viewing(opts)).to eq []
      end

      it 'should not show for users not enrolled in course' do
        @topic.todo_date = 1.day.from_now
        @topic.save!
        @group_topic.todo_date = 1.day.from_now
        @group_topic.save!
        user1 = @student
        course_with_student(active_all: true)
        expect(user1.discussion_topics_needing_viewing(opts).sort_by(&:id)).to eq [@topic, @group_topic, @a]
        expect(@student.discussion_topics_needing_viewing(opts)).to eq []
      end

      it 'should not show discussions that are graded unless new_activity is true' do
        a = @course.assignments.create!(title: "some assignment", points_possible: 5, due_at: 1.day.from_now)
        t = @course.discussion_topics.build(assignment: a, title: "some topic", message: "a little bit of content")
        t.save
        expect(t.assignment_id).to eql(a.id)
        expect(t.assignment).to eql(a)
        expect(@student.discussion_topics_needing_viewing(opts)).not_to include t
      end

      it 'should show graded discussion if new activity is true' do
        a = @course.assignments.create!(title: "some assignment", points_possible: 5, due_at: 1.day.from_now)
        t = @course.discussion_topics.build(assignment: a, title: "some topic", message: "a little bit of content")
        t.save
        expect(t.assignment_id).to eql(a.id)
        expect(t.assignment).to eql(a)
        expect(@student.discussion_topics_needing_viewing(opts.merge({new_activity: true}))).to include t
      end

      context "locked discussion topics" do
        it 'should show for ungraded discussion topics with unlock dates and todo dates within the opts date range' do
          @topic.unlock_at = 1.day.from_now
          @topic.todo_date = 1.day.from_now
          @topic.save!
          @group_topic.unlock_at = 1.day.from_now
          @group_topic.todo_date = 1.day.from_now
          @group_topic.save!
          expect(@student.discussion_topics_needing_viewing(opts).sort_by(&:id)).to eq [@topic, @group_topic, @a]
        end

        it 'should show for ungraded discussion topics with lock dates and todo dates within the opts date range' do
          @topic.lock_at = 1.day.ago
          @topic.todo_date = 1.day.from_now
          @topic.save!
          @group_topic.lock_at = 1.day.ago
          @group_topic.todo_date = 1.day.from_now
          @group_topic.save!
          expect(@student.discussion_topics_needing_viewing(opts).sort_by(&:id)).to eq [@topic, @group_topic, @a]
        end
      end

      context "include_concluded" do
        before :once do
          @u = User.create!

          @c1 = course_with_student(:active_all => true, :user => @u).course
          @dt1 = discussion_topic_model(:context => @c1)
          @dt1.todo_date = Time.zone.now
          @dt1.save!
          @dt1.publish!

          @e2 = course_with_student(:active_all => true, :user => @u)
          @c2 = @e2.course
          @dt2 = discussion_topic_model(:context => @c2)
          @dt2.todo_date = Time.zone.now
          @dt2.save!
          @dt2.publish!
          @e2.conclude
        end

        it "should not include topics from concluded enrollments by default" do
          expect(@u.discussion_topics_needing_viewing(opts).count).to eq 1
        end

        it "should include topics from concluded enrollments if requested" do
          expect(@u.discussion_topics_needing_viewing(opts.merge(include_concluded: true)).count).to eq 2
          expect(@u.discussion_topics_needing_viewing(opts.merge(include_concluded: true)).map(&:id).sort).to eq [@dt1.id, @dt2.id].sort
        end
      end

      context "only_favorites" do
        before :once do
          @u = User.create!

          @c1 = course_with_student(:active_all => true, :user => @u).course
          @u.favorites.create!(:context_type => "Course", :context_id => @c1)
          @dt1 = discussion_topic_model(:context => @c1)
          @dt1.todo_date = Time.zone.now
          @dt1.save!
          @dt1.publish!

          @c2 = course_with_student(:active_all => true, :user => @u).course
          @u.favorites.where(:context_type => "Course", :context_id => @c2).first.destroy
          @dt2 = discussion_topic_model(:context => @c2)
          @dt2.todo_date = Time.zone.now
          @dt2.save!
          @dt2.publish!
        end

        it "should include topics from all courses by default" do
          expect(@u.discussion_topics_needing_viewing(opts).count).to eq 2
        end

        it "should not include topics from unfavorited courses if requested" do
          expect(@u.discussion_topics_needing_viewing(opts.merge(only_favorites: true)).count).to eq 1
          expect(@u.discussion_topics_needing_viewing(opts.merge(only_favorites: true)).map(&:id)).to be_include @dt1.id
        end
      end
    end

    context 'discussions made within groups' do
      before(:each) do
        course_with_student(active_all: true)
        @group_category = @course.group_categories.create(name: 'Project Group')
        @group1 = group_model(name: 'Project Group 1', group_category: @group_category, context: @course)
        group_membership_model(group: @group1, user: @student)
        @course_topic = discussion_topic_model(context: @group1)
        @course_announcement = announcement_model(context: @group1)
        @account = @course.account
        @group_category = @account.group_categories.create(name: 'Project Group')
        @group2 = group_model(name: 'Project Group 1', group_category: @group_category, context: @account)
        group_membership_model(group: @group2, user: @student)
        @account_topic = discussion_topic_model(context: @group2)
        @account_announcement = announcement_model(context: @group2)
      end

      it 'should show discussions with dates in the range' do
        @course_topic.todo_date = 1.day.from_now
        @course_topic.save!
        @account_topic.todo_date = 1.day.from_now
        @account_topic.save!
        topics = [@course_topic, @course_announcement, @account_topic, @account_announcement]
        expect(@student.discussion_topics_needing_viewing(opts).sort_by(&:id)).to eq topics
      end

      it 'should not show for ungraded discussion topics with todo dates outside the range' do
        @course_topic.todo_date = 3.days.ago
        @course_topic.save!
        @course_announcement.posted_at = 3.days.ago
        @course_announcement.save!
        @account_topic.todo_date = 3.days.ago
        @account_topic.save!
        @account_announcement.posted_at = 3.days.ago
        @account_announcement.save!
        expect(@student.discussion_topics_needing_viewing(opts)).to eq []
      end

      it 'should not show for ungraded discussion topics without todo dates' do
        topics = [@course_announcement, @account_announcement]
        expect(@student.discussion_topics_needing_viewing(opts).sort_by(&:id)).to eq topics
      end

      it 'should not show unpublished discussion topics' do
        teacher_in_course(course: @course)
        group_membership_model(group: @group1, user: @teacher)
        group_membership_model(group: @group2, user: @teacher)
        @course_topic.workflow_state = 'unpublished'
        @course_topic.todo_date = 1.day.from_now
        @account_topic.workflow_state = 'unpublished'
        @account_topic.todo_date = 1.day.from_now
        @course_announcement.delayed_post_at = 1.day.from_now
        @course_announcement.workflow_state = 'post_delayed'
        @account_announcement.delayed_post_at = 1.day.from_now
        @account_announcement.workflow_state = 'post_delayed'
        topics = [@course_topic, @account_topic, @course_announcement, @account_announcement]
        topics.each(&:save!)
        expect(@student.discussion_topics_needing_viewing(opts)).to eq []
        expect(@teacher.discussion_topics_needing_viewing(opts)).to eq []
      end

      it 'should not show for users not in group' do
        @course_topic.todo_date = 1.day.from_now
        @course_topic.save!
        @account_topic.todo_date = 1.day.from_now
        @account_topic.save!
        user1 = @student
        course_with_student(active_all: true)
        topics = [@course_topic, @course_announcement, @account_topic, @account_announcement]
        expect(user1.discussion_topics_needing_viewing(opts).sort_by(&:id)).to eq topics
        expect(@student.discussion_topics_needing_viewing(opts)).to eq []
      end
    end
  end

  describe "submission_statuses" do
    before :once do
      course_factory active_all: true
      student_in_course active_all: true
      assignment_model(course: @course, submission_types: 'online_text_entry')
      @assignment.workflow_state = "published"
      @assignment.save!
    end

    it 'should indicate that an assignment is submitted' do
      @assignment.submit_homework(@student, body: "/shrug")

      expect(@student.submission_statuses[:submitted]).to match_array([@assignment.id])
    end

    it 'should indicate that an assignment is missing' do
      @assignment.update!(due_at: 1.week.ago)

      expect(@student.submission_statuses[:missing]).to match_array([@assignment.id])
    end

    it 'should indicate that an assignment is excused' do
      submission = @assignment.submit_homework(@student, body: "b")
      submission.excused = true
      submission.save!

      expect(@student.submission_statuses[:excused]).to match_array([@assignment.id])
    end

    it 'should indicate that an assignment is graded' do
      submission = @assignment.submit_homework(@student, body: "o")
      submission.update(score: 10)
      submission.grade_it!

      expect(@student.submission_statuses[:graded]).to match_array([@assignment.id])
      expect(@student.submission_statuses[:has_feedback]).to match_array([])
    end

    it 'should indicate that an assignment is late' do
      @assignment.update!(due_at: 1.week.ago)
      submission = @assignment.submit_homework(@student, body: "d")

      expect(@student.submission_statuses[:late]).to match_array([@assignment.id])
    end

    it 'should indicate that an assignment needs grading' do
      submission = @assignment.submit_homework(@student, body: "y")

      expect(@student.submission_statuses[:needs_grading]).to match_array([@assignment.id])
    end

    it 'should indicate that an assignment has feedback' do
      submission = @assignment.submit_homework(@student, body: "the stuff")
      submission.add_comment(user: @teacher, comment: "nice work, fam")
      submission.grade_it!

      expect(@student.submission_statuses[:has_feedback]).to match_array([@assignment.id])
    end
  end

  describe "avatar_key" do
    it "should return a valid avatar key for a valid user id" do
      expect(User.avatar_key(1)).to eq "1-#{Canvas::Security.hmac_sha1('1')[0,10]}"
      expect(User.avatar_key("1")).to eq "1-#{Canvas::Security.hmac_sha1('1')[0,10]}"
      expect(User.avatar_key("2")).to eq "2-#{Canvas::Security.hmac_sha1('2')[0,10]}"
      expect(User.avatar_key("161612461246")).to eq "161612461246-#{Canvas::Security.hmac_sha1('161612461246')[0,10]}"
    end
    it" should return '0' for an invalid user id" do
      expect(User.avatar_key(nil)).to eq "0"
      expect(User.avatar_key("")).to eq "0"
      expect(User.avatar_key(0)).to eq "0"
    end
  end
  describe "user_id_from_avatar_key" do
    it "should return a valid user id for a valid avatar key" do
      expect(User.user_id_from_avatar_key("1-#{Canvas::Security.hmac_sha1('1')[0,10]}")).to eq '1'
      expect(User.user_id_from_avatar_key("2-#{Canvas::Security.hmac_sha1('2')[0,10]}")).to eq '2'
      expect(User.user_id_from_avatar_key("1536394658-#{Canvas::Security.hmac_sha1('1536394658')[0,10]}")).to eq '1536394658'
    end
    it "should return nil for an invalid avatar key" do
      expect(User.user_id_from_avatar_key("1-#{Canvas::Security.hmac_sha1('1')}")).to eq nil
      expect(User.user_id_from_avatar_key("1")).to eq nil
      expect(User.user_id_from_avatar_key("2-123456")).to eq nil
      expect(User.user_id_from_avatar_key("a")).to eq nil
      expect(User.user_id_from_avatar_key(nil)).to eq nil
      expect(User.user_id_from_avatar_key("")).to eq nil
      expect(User.user_id_from_avatar_key("-")).to eq nil
      expect(User.user_id_from_avatar_key("-159135")).to eq nil
    end
  end

  describe "order_by_sortable_name" do
    let_once :ids do
      ids = []
      ids << User.create!(:name => "John Johnson")
      ids << User.create!(:name => "John John")
      ids << User.create!(:name => "john john")
    end

    let_once :has_pg_collkey do
      status = if User.connection.extension_installed?(:pg_collkey)
        begin
          Bundler.require 'icu'
          true
        rescue LoadError
          skip 'requires icu locally SD-2747'
          false
        end
      end

      status || false
    end

    context 'when pg_collkey is installed' do
      before do
        skip 'requires pg_collkey installed SD-2747' unless has_pg_collkey
      end

      it "should sort lexicographically" do
        ascending_sortable_names = User.order_by_sortable_name.where(id: ids).map(&:sortable_name)
        expect(ascending_sortable_names).to eq(["john, john", "John, John", "Johnson, John"])
      end

      it "should sort support direction toggle" do
        descending_sortable_names = User.order_by_sortable_name(:direction => :descending).
          where(id: ids).map(&:sortable_name)
        expect(descending_sortable_names).to eq(["Johnson, John", "John, John", "john, john"])
      end

      it "should sort support direction toggle with a prior select" do
        descending_sortable_names = User.select([:id, :sortable_name]).order_by_sortable_name(:direction => :descending).
          where(id: ids).map(&:sortable_name)
        expect(descending_sortable_names).to eq ["Johnson, John", "John, John", "john, john"]
      end

      it "should sort by the current locale with pg_collkey if possible" do
        I18n.locale = :es
        expect(User.sortable_name_order_by_clause).to match(/'es'/)
        expect(User.sortable_name_order_by_clause).not_to match(/'root'/)
        # english has no specific sorting rules, so use root
        I18n.locale = :en
        expect(User.sortable_name_order_by_clause).not_to match(/'es'/)
        expect(User.sortable_name_order_by_clause).to match(/'root'/)
      end
    end

    context 'when pg_collkey is not installed' do
      before do
        skip 'requires pg_collkey to not be installed SD-2747' if has_pg_collkey
      end

      it "should sort lexicographically" do
        ascending_sortable_names = User.order_by_sortable_name.where(id: ids).map(&:sortable_name)
        expect(ascending_sortable_names).to eq(["John, John", "john, john", "Johnson, John"])
      end

      it "should sort support direction toggle" do
        descending_sortable_names = User.order_by_sortable_name(:direction => :descending).
          where(id: ids).map(&:sortable_name)
        expect(descending_sortable_names).to eq(["Johnson, John", "john, john", "John, John"])
      end

      it "should sort support direction toggle with a prior select" do
        descending_sortable_names = User.select([:id, :sortable_name]).order_by_sortable_name(:direction => :descending).
          where(id: ids).map(&:sortable_name)
        expect(descending_sortable_names).to eq ["Johnson, John", "john, john", "John, John"]
      end
    end

    it "breaks ties with user id" do
      ids = 5.times.map { User.create!(:name => "Abcde").id }.sort
      expect(User.order_by_sortable_name.where(id: ids).map(&:id)).to eq(ids)
    end

    it "breaks ties in the direction of the order" do
      users = [
        User.create!(:name => "Gary"),
        User.create!(:name => "Gary")
      ]
      ids = users.map(&:id)

      descending_user_ids = User.where(id: ids).order_by_sortable_name(direction: :descending).map(&:id)
      expect(descending_user_ids).to eq(ids.reverse)
    end
  end

  describe "quota" do
    before(:once) { user_factory }
    it "should default to User.default_storage_quota" do
      expect(@user.quota).to eql User.default_storage_quota
    end

    it "should sum up associated root account quotas" do
      @user.associated_root_accounts << Account.create! << (a = Account.create!)
      a.update_attribute :default_user_storage_quota_mb, a.default_user_storage_quota_mb + 10
      expect(@user.quota).to eql(2 * User.default_storage_quota + 10.megabytes)
    end
  end

  it "should build a profile if one doesn't already exist" do
    user = User.create! :name => "John Johnson"
    profile = user.profile
    expect(profile.id).to be_nil
    profile.bio = "bio!"
    profile.save!
    expect(user.profile).to eq profile
  end

  describe "common_account_chain" do
    before :once do
      user_with_pseudonym
    end
    let_once(:root_acct1) { Account.create! }
    let_once(:root_acct2) { Account.create! }

    it "work for just root accounts" do
      @user.user_account_associations.create!(:account_id => root_acct2.id)
      @user.reload
      expect(@user.common_account_chain(root_acct1)).to eq []
      expect(@user.common_account_chain(root_acct2)).to eql [root_acct2]
    end

    it "should work for one level of sub accounts" do
      root_acct = root_acct1
      sub_acct1 = Account.create!(:parent_account => root_acct)
      sub_acct2 = Account.create!(:parent_account => root_acct)

      @user.user_account_associations.create!(:account_id => root_acct.id)
      expect(@user.reload.common_account_chain(root_acct)).to eql [root_acct]

      @user.user_account_associations.create!(:account_id => sub_acct1.id)
      expect(@user.reload.common_account_chain(root_acct)).to eql [root_acct, sub_acct1]

      @user.user_account_associations.create!(:account_id => sub_acct2.id)
      expect(@user.reload.common_account_chain(root_acct)).to eql [root_acct]
    end

    context "two levels of sub accounts" do
      let_once(:root_acct) { root_acct1 }
      let_once(:sub_acct1) { Account.create!(:parent_account => root_acct) }
      let_once(:sub_sub_acct1) { Account.create!(:parent_account => sub_acct1) }
      let_once(:sub_sub_acct2) { Account.create!(:parent_account => sub_acct1) }
      let_once(:sub_acct2) { Account.create!(:parent_account => root_acct) }

      it "finds the correct branch point" do
        @user.user_account_associations.create!(:account_id => root_acct.id)
        expect(@user.reload.common_account_chain(root_acct)).to eql [root_acct]

        @user.user_account_associations.create!(:account_id => sub_acct1.id)
        expect(@user.reload.common_account_chain(root_acct)).to eql [root_acct, sub_acct1]

        @user.user_account_associations.create!(:account_id => sub_sub_acct1.id)
        expect(@user.reload.common_account_chain(root_acct)).to eql [root_acct, sub_acct1, sub_sub_acct1]

        @user.user_account_associations.create!(:account_id => sub_sub_acct2.id)
        expect(@user.reload.common_account_chain(root_acct)).to eql [root_acct, sub_acct1]

        @user.user_account_associations.create!(:account_id => sub_acct2.id)
        expect(@user.reload.common_account_chain(root_acct)).to eql [root_acct]
      end

      it "breaks early if a user has an enrollment partway down the chain" do
        course_with_student(user: @user, account: sub_acct1, active_all: true)
        @user.user_account_associations.create!(:account_id => sub_sub_acct1.id)
        @user.reload

        full_chain = [root_acct, sub_acct1, sub_sub_acct1]
        overlap = @user.user_account_associations.map(&:account_id) & full_chain.map(&:id)
        expect(overlap.sort).to eql full_chain.map(&:id)
        expect(@user.common_account_chain(root_acct)).to(
          eql([root_acct, sub_acct1])
        )
      end
    end
  end

  describe "mfa_settings" do
    let_once(:user) { User.create! }

    it "should be :disabled for unassociated users" do
      user = User.new
      expect(user.mfa_settings).to eq :disabled
    end

    it "should inherit from the account" do
      user.pseudonyms.create!(:account => Account.default, :unique_id => 'user')
      Account.default.settings[:mfa_settings] = :required
      Account.default.save!

      expect(user.mfa_settings).to eq :required

      Account.default.settings[:mfa_settings] = :optional
      Account.default.save!
      user = User.find(user().id)
      expect(user.mfa_settings).to eq :optional
    end

    it "should be the most-restrictive if associated with multiple accounts" do
      disabled_account = Account.create!(:settings => { :mfa_settings => :disabled })
      optional_account = Account.create!(:settings => { :mfa_settings => :optional })
      required_account = Account.create!(:settings => { :mfa_settings => :required })

      p1 = user.pseudonyms.create!(:account => disabled_account, :unique_id => 'user')
      user = User.find(user().id)
      expect(user.mfa_settings).to eq :disabled

      p2 = user.pseudonyms.create!(:account => optional_account, :unique_id => 'user')
      user = User.find(user.id)
      expect(user.mfa_settings).to eq :optional

      p3 = user.pseudonyms.create!(:account => required_account, :unique_id => 'user')
      user = User.find(user.id)
      expect(user.mfa_settings).to eq :required

      p1.destroy
      user = User.find(user.id)
      expect(user.mfa_settings).to eq :required

      p2.destroy
      user = User.find(user.id)
      expect(user.mfa_settings).to eq :required
    end

    it "should be required if admin and required_for_admins" do
      account = Account.create!(:settings => { :mfa_settings => :required_for_admins })
      user.pseudonyms.create!(:account => account, :unique_id => 'user')

      expect(user.mfa_settings).to eq :optional
      account.account_users.create!(user: user)
      user.reload
      expect(user.mfa_settings).to eq :required
    end

    it "required_for_admins shouldn't get confused by admins in other accounts" do
      account = Account.create!(:settings => { :mfa_settings => :required_for_admins })
      user.pseudonyms.create!(:account => account, :unique_id => 'user')
      user.pseudonyms.create!(:account => Account.default, :unique_id => 'user')

      Account.default.account_users.create!(user: user)

      expect(user.mfa_settings).to eq :optional
    end

    it "short circuits when a hint is provided" do
      account = Account.create!(:settings => { :mfa_settings => :required_for_admins })
      p = user.pseudonyms.create!(:account => account, :unique_id => 'user')
      account.account_users.create!(user: user)

      expect(user).to receive(:pseudonyms).never
      expect(user.mfa_settings(pseudonym_hint: p)).to eq :required
    end
  end

  context "crocodoc attributes" do
    before :once do
      Setting.set 'crocodoc_counter', 998
      @user = User.create! :short_name => "Bob"
    end

    it "should generate a unique crocodoc_id" do
      expect(@user.crocodoc_id).to be_nil
      expect(@user.crocodoc_id!).to eql 999
      expect(@user.crocodoc_user).to eql '999,Bob'
    end

    it "should scrub commas from the user name" do
      @user.short_name = "Smith, Bob"
      @user.save!
      expect(@user.crocodoc_user).to eql '999,Smith Bob'
    end

    it "should not change a user's crocodoc_id" do
      @user.update_attribute :crocodoc_id, 2
      expect(@user.crocodoc_id!).to eql 2
      expect(Setting.get('crocodoc_counter', 0).to_i).to eql 998
    end
  end

  context "assignments_needing_grading" do
    before :once do
      # create courses and sections
      @course1 = course_with_teacher(:active_all => true).course
      @course2 = course_with_teacher(:active_all => true, :user => @teacher).course
      @section1b = @course1.course_sections.create!(:name => 'section B')
      @section2b = @course2.course_sections.create!(:name => 'section B')

      # put a student in each section
      @studentA = user_with_pseudonym(:active_all => true, :name => 'StudentA', :username => 'studentA@instructure.com')
      @studentB = user_with_pseudonym(:active_all => true, :name => 'StudentB', :username => 'studentB@instructure.com')
      @course1.enroll_student(@studentA).update_attribute(:workflow_state, 'active')
      @section1b.enroll_user(@studentB, 'StudentEnrollment', 'active')
      @course2.enroll_student(@studentA).update_attribute(:workflow_state, 'active')
      @section2b.enroll_user(@studentB, 'StudentEnrollment', 'active')

      # set up a TA, section-limited in one course and not the other
      @ta = user_with_pseudonym(:active_all => true, :name => 'TA', :username => 'ta@instructure.com')
      @course1.enroll_user(@ta, 'TaEnrollment', :enrollment_state => 'active', :limit_privileges_to_course_section => true)
      @course2.enroll_user(@ta, 'TaEnrollment', :enrollment_state => 'active', :limit_privileges_to_course_section => false)

      # make some assignments and submissions
      [@course1, @course2].each do |course|
        assignment = course.assignments.create!(:title => "some assignment", :submission_types => ['online_text_entry'])
        [@studentA, @studentB].each do |student|
          assignment.submit_homework student, body: "submission for #{student.name}"
        end
      end
    end

    it "should not count assignments in soft concluded courses" do
      @course.enrollment_term.update_attribute(:end_at, 1.day.from_now)
      Timecop.travel(1.week) do
        EnrollmentState.recalculate_expired_states # runs periodically in background
        expect(@teacher.reload.assignments_needing_grading.size).to eql(0)
      end
    end

    it "should count assignments with ungraded submissions across multiple courses" do
      expect(@teacher.assignments_needing_grading.size).to eql(2)
      expect(@teacher.assignments_needing_grading).to be_include(@course1.assignments.first)
      expect(@teacher.assignments_needing_grading).to be_include(@course2.assignments.first)

      # grade one submission for one assignment; these numbers don't change
      @course1.assignments.first.grade_student(@studentA, grade: "1", grader: @teacher)
      expect(@teacher.assignments_needing_grading.size).to eql(2)
      expect(@teacher.assignments_needing_grading).to be_include(@course1.assignments.first)
      expect(@teacher.assignments_needing_grading).to be_include(@course2.assignments.first)

      # grade the other submission; now course1's assignment no longer needs grading
      @course1.assignments.first.grade_student(@studentB, grade: "1", grader: @teacher)
      @teacher = User.find(@teacher.id)
      expect(@teacher.assignments_needing_grading.size).to eql(1)
      expect(@teacher.assignments_needing_grading).to be_include(@course2.assignments.first)
    end

    it "should only count submissions in accessible course sections" do
      expect(@ta.assignments_needing_grading.size).to eql(2)
      expect(@ta.assignments_needing_grading).to be_include(@course1.assignments.first)
      expect(@ta.assignments_needing_grading).to be_include(@course2.assignments.first)

      # grade student A's submissions in both courses; now course1's assignment
      # should not show up because the TA doesn't have access to studentB's submission
      @course1.assignments.first.grade_student(@studentA, grade: "1", grader: @teacher)
      @course2.assignments.first.grade_student(@studentA, grade: "1", grader: @teacher)
      @ta = User.find(@ta.id)
      expect(@ta.assignments_needing_grading.size).to eql(1)
      expect(@ta.assignments_needing_grading).to be_include(@course2.assignments.first)

      # but if we enroll the TA in both sections of course1, it should be accessible
      @course1.enroll_user(@ta, 'TaEnrollment', :enrollment_state => 'active', :section => @section1b,
                          :allow_multiple_enrollments => true, :limit_privileges_to_course_section => true)
      @ta = User.find(@ta.id)
      expect(@ta.assignments_needing_grading.size).to eql(2)
      expect(@ta.assignments_needing_grading).to be_include(@course1.assignments.first)
      expect(@ta.assignments_needing_grading).to be_include(@course2.assignments.first)
    end

    it "should limit the number of returned assignments" do
      assignment_ids = create_records(Assignment, Array.new(20) do |x|
        {
          title: "excess assignment #{x}",
          submission_types: 'online_text_entry',
          workflow_state: "available",
          context_type: "Course",
          context_id: @course1.id
        }
      end)
      create_records(Submission, assignment_ids.map do |id|
        {
          assignment_id: id,
          user_id: @studentB.id,
          body: "hello",
          workflow_state: "submitted",
          submission_type: 'online_text_entry'
        }
      end)
      expect(@teacher.assignments_needing_grading.size).to eq 15
    end

    it "should always have the only_visible_to_overrides attribute" do
      @teacher.assignments_needing_grading.each {|a| expect(a.has_attribute?(:only_visible_to_overrides)).to be_truthy }
    end

    context "sharding" do
      specs_require_sharding

      before :once do
        @shard1.activate do
          @account = Account.create!
          @course3 = @account.courses.create!
          @course3.offer!
          @course3.enroll_teacher(@teacher).accept!
          @course3.enroll_student(@studentA).accept!
          @course3.enroll_student(@studentB).accept!
          @assignment3 = @course3.assignments.create!(:title => "some assignment", :submission_types => ['online_text_entry'])
          @assignment3.submit_homework @studentA, body: "submission for A"
        end
      end

      it "should find assignments from all shards" do
        [Shard.default, @shard1, @shard2].each do |shard|
          shard.activate do
            expect(@teacher.assignments_needing_grading.sort_by(&:id)).to eq(
                [@course1.assignments.first, @course2.assignments.first, @assignment3].sort_by(&:id)
            )
          end
        end
      end

      it "should honor ignores for a separate shard" do
        @teacher.ignore_item!(@assignment3, 'grading')
        expect(@teacher.assignments_needing_grading.sort_by(&:id)).to eq(
            [@course1.assignments.first, @course2.assignments.first].sort_by(&:id)
        )

        @shard1.activate do
          @assignment3.submit_homework @studentB, :submission_type => "online_text_entry", :body => "submission for B"
        end
        @teacher = User.find(@teacher.id)
        expect(@teacher.assignments_needing_grading.size).to eq 3
      end

      it "should apply a global limit" do
        expect(@teacher.assignments_needing_grading(:limit => 1).length).to eq 1
      end
    end

    context "differentiated assignments" do
      before :once do
        @a2 = @course1.assignments.create!(:title => "some assignment 2", :submission_types => ['online_text_entry'])
        [@studentA, @studentB].each do |student|
          @a2.submit_homework student, body: "submission for #{student.name}"
        end

        @section1a = @course1.course_sections.create!(name: 'Section One')
        student_in_section(@section1a, user: @studentB)

        assignments = @course1.assignments
        differentiated_assignment(assignment: assignments[0], course_section: @section1b)
        differentiated_assignment(assignment: assignments[1], course_section: @section1a)
      end

      it "should not include submissions from students without visibility" do
        expect(@teacher.assignments_needing_grading.length).to eq 2
      end
    end

    context "#assignments_needing_moderation" do
      before :once do
        @course2.assignments.first.update_attribute(:moderated_grading, true)
      end

      it "should not count assignments with no provisional grades" do
        expect(@teacher.assignments_needing_moderation.length).to eq 0
      end

      it "should count assignments needing moderation" do
        assmt = @course2.assignments.first
        assmt.grade_student(@studentA, :grade => "1", :grader => @teacher, :provisional => true)
        expect(@teacher.assignments_needing_moderation.length).to eq 1

        assmt.update_attribute(:grades_published_at, Time.now.utc)
        expect(@teacher.assignments_needing_moderation.length).to eq 0 # should not count anymore once grades are published
      end

      it "should not return duplicates" do
        assmt = @course2.assignments.first
        assmt.grade_student(@studentA, :grade => "1", :grader => @teacher, :provisional => true)
        assmt.grade_student(@studentB, :grade => "2", :grader => @teacher, :provisional => true)
        expect(@teacher.assignments_needing_moderation.length).to eq 1
        expect(@teacher.assignments_needing_moderation.first).to eq assmt
      end

      it "should not give a count for non-moderators" do
        assmt = @course2.assignments.first
        assmt.grade_student(@studentA, :grade => "1", :grader => @teacher, :provisional => true)
        ta = ta_in_course(:course => @course, :active_all => true).user
        expect(ta.assignments_needing_moderation.length).to eq 0
      end
    end
  end

  describe "#submitted_assignments" do
    context "assignment locking" do
      before :once do
        course_with_student(:active_all => true)
        assignment_quiz([], :course => @course, :user => @user)
      end

      before :each do
        user_session(@student)
        # Setup default values for tests (leave unsaved for easy changes)
        @quiz.unlock_at = nil
        @quiz.lock_at = nil
        @quiz.due_at = 2.days.from_now
      end

      it "includes assignments with no due date but have overrides that are due" do
        @quiz.due_at = nil
        @quiz.save!
        section = @course.course_sections.create! :name => "Test"
        @student = student_in_section section
        create_section_override_for_assignment @quiz.assignment, course_section: section
        @quiz.assignment.submit_homework(@student, body: 'pineapple')
        expect(@student.submitted_assignments(:contexts => [@course]).map(&:id)).
          to be_include @quiz.assignment.id
      end

      it "should include assignments with no locks" do
        @quiz.save!
        @quiz.assignment.submit_homework(@student, body: 'ello')
        list = @student.submitted_assignments(:contexts => [@course])
        expect(list.size).to eql 1
        expect(list.first.title).to eql 'Test Assignment'
      end

      it "should include assignments with unlock_at in the past" do
        @quiz.unlock_at = 1.hour.ago
        @quiz.save!
        @quiz.assignment.submit_homework(@student, body: 'pink floyd')
        list = @student.submitted_assignments(:contexts => [@course])
        expect(list.size).to eql 1
        expect(list.first.title).to eql 'Test Assignment'
      end

      it "should include assignments with lock_at in the future" do
        @quiz.lock_at = 1.hour.from_now
        @quiz.save!
        @quiz.assignment.submit_homework(@student, body: 'quizzy mcquizzertons')
        list = @student.submitted_assignments(:contexts => [@course])
        expect(list.size).to eql 1
        expect(list.first.title).to eql 'Test Assignment'
      end

      it "should not include assignments where unlock_at is in future" do
        @quiz.unlock_at = 1.hour.from_now
        @quiz.save!
        @quiz.assignment.submit_homework(@student, body: 'peter pan')
        expect(@student.submitted_assignments(:contexts => [@course]).count).to eq 0
      end

      it "should not include assignments where lock_at is in past" do
        @quiz.lock_at = 1.hour.ago
        @quiz.save!
        @quiz.assignment.submit_homework(@student, body: 'peanut butter')
        expect(@student.submitted_assignments(:contexts => [@course]).count).to eq 0
      end

      context "include_locked" do
        it "should include assignments where unlock_at is in future" do
          @quiz.unlock_at = 1.hour.from_now
          @quiz.save!
          @quiz.assignment.submit_homework(@student, body: 'jelly')
          expect(@student.submitted_assignments(:include_locked => true, :contexts => [@course]).count).to eq 1
        end

        it "should include assignments where lock_at is in past" do
          @quiz.lock_at = 1.hour.ago
          @quiz.save!
          @quiz.assignment.submit_homework(@student, body: 'time')
          expect(@student.submitted_assignments(:include_locked => true, :contexts => [@course]).count).to eq 1
        end
      end
    end

    context "soft concluded courses" do
      before :once do
        course_with_student(:active_all => true)
        @course.enrollment_term.update_attribute(:end_at, 1.day.from_now)
        assignment_quiz([], :course => @course, :user => @user)
        @assignment.submit_homework(@student, body: 'content')
        @quiz.unlock_at = nil
        @quiz.lock_at = nil
        @quiz.due_at = 3.days.from_now
        @quiz.save!
      end

      it "should not include assignments from soft concluded courses by default" do
        Timecop.travel(2.days) do
          EnrollmentState.recalculate_expired_states
          expect(@student.submitted_assignments.count).to eq 0
        end
      end

      it "should include assignments from soft concluded courses if specified" do
        Timecop.travel(2.days) do
          EnrollmentState.recalculate_expired_states
          expect(@student.submitted_assignments(:include_concluded => true).count).to eq 1
        end
      end
    end


    def assignment_with_submissions(with_override: true, student: nil)
      course_with_student(:active_all => true)
      student ||= @student
      @course.enrollments.each(&:destroy_permanently!) #student removed from default section
      section = @course.course_sections.create!
      student_in_section(section, user: student)
      assignment_quiz([], :course => @course, :user => student)
      @assignment.only_visible_to_overrides = true
      @assignment.publish
      @assignment.submit_homework(student, body: 'jefferson airplane')
      @quiz.due_at = 2.days.from_now
      @quiz.save!
      if with_override
        create_section_override_for_assignment(@assignment, {course_section: section})
      end
      @assignment
    end

    context "differentiated_assignments" do
      it "should not return assignments without an override present for the student" do
        assignment = assignment_with_submissions(with_override: false)
        expect(@student.submitted_assignments(contexts: Course.all).map(&:id)).not_to be_include assignment.id
      end

      it "should return the assignments with an override" do
        assignment = assignment_with_submissions
        expect(@student.submitted_assignments(contexts: Course.all).map(&:id)).to be_include assignment.id
      end
    end

    context "sharding" do
      specs_require_sharding

      it "includes assignments from other shards" do
        student = @shard1.activate { user_factory }
        assignment = assignment_with_submissions(student: student)
        expect(student.submitted_assignments.map(&:id)).to be_include assignment.id
      end
    end

    context "ungraded assignments" do
      before :once do
        course_with_student :active_all => true
        @assignment = @course.assignments.create! title: 'blah!', due_at: 1.day.from_now, submission_types: 'not_graded'
        @past_assignment = @course.assignments.create! title: 'blah!', due_at: 1.day.ago, submission_types: 'not_graded'
        @assignment.submit_homework(@student, body: 'content')
        @past_assignment.submit_homework(@student, body: 'content')
      end

      it "doesn't include ungraded assignments by default" do
        expect(@student.submitted_assignments.map(&:id)).not_to be_include @assignment.id
        expect(@student.submitted_assignments.map(&:id)).not_to be_include @past_assignment.id
      end

      it "includes ungraded assignments when specified" do
        expect(@student.submitted_assignments(include_ungraded: true).map(&:id)).to be_include @assignment.id
        expect(@student.submitted_assignments(include_ungraded: true).map(&:id)).to be_include @past_assignment.id
      end
    end
  end

  describe "select_available_assignments" do
    before :once do
      course_with_student :active_all => true
      @assignment = @course.assignments.create! title: 'blah!', due_at: 1.day.from_now, submission_types: 'not_graded'
    end

    it "should not include concluded enrollments by default" do
      expect(@student.select_available_assignments([@assignment]).count).to eq 1
      @course.enrollment_term.update_attribute(:end_at, 1.day.from_now)

      Timecop.travel(2.days) do
        EnrollmentState.recalculate_expired_states
        expect(@student.select_available_assignments([@assignment]).count).to eq 0
      end
    end

    it "should included concluded enrollments if specified" do
      @course.enrollment_term.update_attribute(:end_at, 1.day.from_now)

      Timecop.travel(2.days) do
        EnrollmentState.recalculate_expired_states
        expect(@student.select_available_assignments([@assignment], :include_concluded => true).count).to eq 1
      end
    end

  end

  describe ".initial_enrollment_type_from_type" do
    it "should return supported initial_enrollment_type values" do
      expect(User.initial_enrollment_type_from_text('StudentEnrollment')).to eq 'student'
      expect(User.initial_enrollment_type_from_text('StudentViewEnrollment')).to eq 'student'
      expect(User.initial_enrollment_type_from_text('TeacherEnrollment')).to eq 'teacher'
      expect(User.initial_enrollment_type_from_text('TaEnrollment')).to eq 'ta'
      expect(User.initial_enrollment_type_from_text('ObserverEnrollment')).to eq 'observer'
      expect(User.initial_enrollment_type_from_text('DesignerEnrollment')).to be_nil
      expect(User.initial_enrollment_type_from_text('UnknownThing')).to be_nil
      expect(User.initial_enrollment_type_from_text(nil)).to be_nil
      # Non-enrollment type strings
      expect(User.initial_enrollment_type_from_text('student')).to eq 'student'
      expect(User.initial_enrollment_type_from_text('teacher')).to eq 'teacher'
      expect(User.initial_enrollment_type_from_text('ta')).to eq 'ta'
      expect(User.initial_enrollment_type_from_text('observer')).to eq 'observer'
    end
  end

  describe "adminable_accounts" do
    specs_require_sharding

    it "should include accounts from multiple shards" do
      user_factory
      Account.site_admin.account_users.create!(user: @user)
      @shard1.activate do
        @account2 = Account.create!
        @account2.account_users.create!(user: @user)
      end

      expect(@user.adminable_accounts.map(&:id).sort).to eq [Account.site_admin, @account2].map(&:id).sort
    end

    it "should exclude deleted accounts" do
      user_factory
      Account.site_admin.account_users.create!(user: @user)
      @shard1.activate do
        @account2 = Account.create!
        @account2.account_users.create!(user: @user)
        @account2.destroy
      end

      expect(@user.adminable_accounts.map(&:id).sort).to eq [Account.site_admin].map(&:id).sort
    end
  end

  describe "all_pseudonyms" do
    specs_require_sharding

    it "should include pseudonyms from multiple shards" do
      user_with_pseudonym(:active_all => 1)
      @p1 = @pseudonym
      @shard1.activate do
        account = Account.create!
        @p2 = account.pseudonyms.create!(:user => @user, :unique_id => 'abcd')
      end

      expect(@user.all_pseudonyms).to eq [@p1, @p2]
    end
  end

  describe "active_pseudonyms" do
    before :once do
      user_with_pseudonym(:active_all => 1)
    end

    it "should include active pseudonyms" do
      expect(@user.active_pseudonyms).to eq [@pseudonym]
    end

    it "should not include deleted pseudonyms" do
      @pseudonym.destroy
      expect(@user.active_pseudonyms).to be_empty
    end
  end

  describe "preferred_gradebook_version" do
    subject { user.preferred_gradebook_version }

    let(:user) { User.new }

    it "returns default gradebook when preferred" do
      user.preferences[:gradebook_version] = 'default'
      is_expected.to eq 'default'
    end

    it "returns individual gradebook when preferred" do
      user.preferences[:gradebook_version] = 'individual'
      is_expected.to eq 'individual'
    end

    it "returns default gradebook when not set" do
      is_expected.to eq 'default'
    end
  end

  describe "manual_mark_as_read" do
    let(:user) { User.new }
    subject { user.manual_mark_as_read? }

    context 'default' do
      it { is_expected.to be_falsey }
    end

    context 'after being set to true' do
      before { allow(user).to receive_messages(preferences: { manual_mark_as_read: true }) }
      it     { is_expected.to be_truthy }
    end

    context 'after being set to false' do
      before { allow(user).to receive_messages(preferences: { manual_mark_as_read: false }) }
      it     { is_expected.to be_falsey }
    end
  end

  describe "things excluded from json serialization" do
    it "excludes collkey" do
      # Ruby 1.9 does not like html that includes the collkey, so
      # don't ship it to the page (even as json).
      User.create!
      users = User.order_by_sortable_name
      expect(users.first.as_json['user'].keys).not_to include('collkey')
    end
  end

  describe 'permissions' do
    it "should not allow account admin to modify admin privileges of other account admins" do
      expect(RoleOverride.readonly_for(Account.default, :manage_role_overrides, admin_role)).to be_truthy
      expect(RoleOverride.readonly_for(Account.default, :manage_account_memberships, admin_role)).to be_truthy
      expect(RoleOverride.readonly_for(Account.default, :manage_account_settings, admin_role)).to be_truthy
    end

    describe ":reset_mfa" do
      let(:account1) {
        a = Account.default
        a.settings[:admins_can_view_notifications] = true
        a.save!
        a
      }
      let(:account2) { Account.create! }

      let(:sally) { account_admin_user(
        user: student_in_course(account: account2).user,
        account: account1) }

      let(:bob) { student_in_course(
        user: student_in_course(account: account2).user,
        course: course_factory(account: account1)).user }

      let(:charlie) { student_in_course(account: account1).user }

      let(:alice) { account_admin_user_with_role_changes(
        account: account1,
        role: custom_account_role('StrongerAdmin', account: account1),
        role_changes: { view_notifications: true }) }

      it "should grant non-admins :reset_mfa on themselves" do
        pseudonym(charlie, account: account1)
        expect(charlie).to be_grants_right(charlie, :reset_mfa)
      end

      it "should grant admins :reset_mfa on themselves" do
        pseudonym(sally, account: account1)
        expect(sally).to be_grants_right(sally, :reset_mfa)
      end

      it "should grant admins :reset_mfa on fully admined users" do
        pseudonym(charlie, account: account1)
        expect(charlie).to be_grants_right(sally, :reset_mfa)
      end

      it "should not grant admins :reset_mfa on partially admined users" do
        account1.settings[:mfa_settings] = :required
        account1.save!
        account2.settings[:mfa_settings] = :required
        account2.save!
        pseudonym(bob, account: account1)
        pseudonym(bob, account: account2)
        expect(bob).not_to be_grants_right(sally, :reset_mfa)
      end

      it "should not grant subadmins :reset_mfa on stronger admins" do
        account1.settings[:mfa_settings] = :required
        account1.save!
        sub = Account.create(root_account_id: account1)
        AccountUser.create(account: sub, user: bob)
        pseudonym(alice, account: account1)
        expect(alice).not_to be_grants_right(bob, :reset_mfa)
      end

      context "MFA is required on the account" do
        before do
          account1.settings[:mfa_settings] = :required
          account1.save!
        end

        it "should no longer grant non-admins :reset_mfa on themselves" do
          pseudonym(charlie, account: account1)
          expect(charlie).not_to be_grants_right(charlie, :reset_mfa)
        end

        it "should no longer grant admins :reset_mfa on themselves" do
          pseudonym(sally, account: account1)
          expect(sally).not_to be_grants_right(sally, :reset_mfa)
        end

        it "should still grant admins :reset_mfa on other fully admined users" do
          pseudonym(charlie, account: account1)
          expect(charlie).to be_grants_right(sally, :reset_mfa)
        end
      end
    end

    describe ":merge" do
      let(:account1) {
        a = Account.default
        a.settings[:admins_can_view_notifications] = true
        a.save!
        a
      }
      let(:account2) { Account.create! }

      let(:sally) { account_admin_user(
        user: student_in_course(account: account2).user,
        account: account1) }

      let(:bob) { student_in_course(
        user: student_in_course(account: account2).user,
        course: course_factory(account: account1)).user }

      let(:charlie) { student_in_course(account: account2).user }

      let(:alice) { account_admin_user_with_role_changes(
        account: account1,
        role: custom_account_role('StrongerAdmin', account: account1),
        role_changes: { view_notifications: true }) }

      it "should grant admins :merge on themselves" do
        pseudonym(sally, account: account1)
        expect(sally).to be_grants_right(sally, :merge)
      end

      it "should not grant non-admins :merge on themselves" do
        pseudonym(bob, account: account1)
        expect(bob).not_to be_grants_right(bob, :merge)
      end

      it "should not grant non-admins :merge on other users" do
        pseudonym(sally, account: account1)
        expect(sally).not_to be_grants_right(bob, :merge)
      end

      it "should grant admins :merge on partially admined users" do
        pseudonym(bob, account: account1)
        pseudonym(bob, account: account2)
        expect(bob).to be_grants_right(sally, :merge)
      end

      it "should not grant admins :merge on users from other accounts" do
        pseudonym(charlie, account: account2)
        expect(charlie).not_to be_grants_right(sally, :merge)
      end

      it "should not grant subadmins :merge on stronger admins" do
        pseudonym(alice, account: account1)
        expect(alice).not_to be_grants_right(sally, :merge)
      end
    end
  end

  describe "check_accounts_right?" do
    describe "sharding" do
      specs_require_sharding

      it "should check for associated accounts on shards the user shares with the seeker" do
        # create target user on defualt shard
        target = user_factory()
        # create account on another shard
        account = @shard1.activate{ Account.create! }
        # associate target user with that account
        account_admin_user(user: target, account: account, role: Role.get_built_in_role('AccountMembership'))
        # create seeking user as admin on that account
        seeker = account_admin_user(account: account, role: Role.get_built_in_role('AccountAdmin'))
        # ensure seeking user gets permissions it should on target user
        expect(target.grants_right?(seeker, :view_statistics)).to be_truthy
      end

      it 'checks all shards, even if not actually associated' do
        target = user_factory()
        # create account on another shard
        account = @shard1.activate{ Account.create! }
        # associate target user with that account
        account_admin_user(user: target, account: account, role: Role.get_built_in_role('AccountMembership'))
        # create seeking user as admin on that account
        seeker = account_admin_user(account: account, role: Role.get_built_in_role('AccountAdmin'))
        allow(seeker).to receive(:associated_shards).and_return([])
        # ensure seeking user gets permissions it should on target user
        expect(target.grants_right?(seeker, :view_statistics)).to eq true
      end
    end
  end

  describe "#conversation_context_codes" do
    before :once do
      @user = user_factory(active_all: true)
      course_with_student(:user => @user, :active_all => true)
      group_with_user(:user => @user, :active_all => true)
    end

    it "should include courses" do
      expect(@user.conversation_context_codes).to include(@course.asset_string)
    end

    it "should include concluded courses" do
      @enrollment.workflow_state = 'completed'
      @enrollment.save!
      expect(@user.conversation_context_codes).to include(@course.asset_string)
    end

    it "should optionally not include concluded courses" do
      @enrollment.update_attribute(:workflow_state, 'completed')
      expect(@user.conversation_context_codes(false)).not_to include(@course.asset_string)
    end

    it "should include groups" do
      expect(@user.conversation_context_codes).to include(@group.asset_string)
    end

    describe "sharding" do
      specs_require_sharding

      before :once do
        @shard1_account = @shard1.activate{ Account.create! }
      end

      it "should include courses on other shards" do
        course_with_student(:account => @shard1_account, :user => @user, :active_all => true)
        expect(@user.conversation_context_codes).to include(@course.asset_string)
      end

      it "should include concluded courses on other shards" do
        course_with_student(:account => @shard1_account, :user => @user, :active_all => true)
        @enrollment.workflow_state = 'completed'
        @enrollment.save!
        expect(@user.conversation_context_codes).to include(@course.asset_string)
      end

      it "should optionally not include concluded courses on other shards" do
        course_with_student(:account => @shard1_account, :user => @user, :active_all => true)
        @enrollment.update_attribute(:workflow_state, 'completed')
        expect(@user.conversation_context_codes(false)).not_to include(@course.asset_string)
      end

      it "should include groups on other shards" do
        # course is just to associate the get shard1 in @user's associated shards
        course_with_student(:account => @shard1_account, :user => @user, :active_all => true)
        @shard1.activate{ group_with_user(:user => @user, :active_all => true) }
        expect(@user.conversation_context_codes).to include(@group.asset_string)
      end

      it "should include the default shard version of the asset string" do
        course_with_student(:account => @shard1_account, :user => @user, :active_all => true)
        default_asset_string = @course.asset_string
        @shard1.activate{ expect(@user.conversation_context_codes).to include(default_asset_string) }
      end
    end
  end

  describe "#stamp_logout_time!" do
    before :once do
      user_model
    end

    it "should update last_logged_out" do
      now = Time.zone.now
      Timecop.freeze(now) { @user.stamp_logout_time! }
      expect(@user.reload.last_logged_out.to_i).to eq now.to_i
    end

    context "sharding" do
      specs_require_sharding

      it "should update regardless of current shard" do
        @shard1.activate{ @user.stamp_logout_time! }
        expect(@user.reload.last_logged_out).not_to be_nil
      end
    end
  end

  describe "delete_enrollments" do
    before do
      course_factory
      2.times { @course.course_sections.create! }
      2.times { @course.assignments.create! }
    end

    it "should batch DueDateCacher jobs" do
      expect(DueDateCacher).to receive(:recompute).never
      expect(DueDateCacher).to receive(:recompute_course).twice # sync_enrollments and destroy_enrollments
      test_student = @course.student_view_student
      test_student.destroy
      test_student.reload.enrollments.each { |e| expect(e).to be_deleted }
    end
  end

  describe "otp remember me cookie" do
    before do
      @user = User.new
      @user.otp_secret_key = ROTP::Base32.random_base32
    end

    it "should add an ip to an existing cookie" do
      cookie1 = @user.otp_secret_key_remember_me_cookie(Time.now.utc, nil, 'ip1')
      cookie2 = @user.otp_secret_key_remember_me_cookie(Time.now.utc, cookie1, 'ip2')
      expect(@user.validate_otp_secret_key_remember_me_cookie(cookie1, 'ip1')).to be_truthy
      expect(@user.validate_otp_secret_key_remember_me_cookie(cookie1, 'ip2')).to be_falsey
      expect(@user.validate_otp_secret_key_remember_me_cookie(cookie2, 'ip1')).to be_truthy
      expect(@user.validate_otp_secret_key_remember_me_cookie(cookie2, 'ip2')).to be_truthy
    end
  end

  it "should reset its conversation counter when told to" do
    user = user_model
    allow(user).to receive(:conversations).and_return Struct.new(:unread).new(Array.new(5))
    user.reset_unread_conversations_counter
    expect(user.reload.unread_conversations_count).to eq 5
  end

  describe 'group_memberships' do
    before :once do
      course_with_student active_all: true
      @group = Group.create! context: @course, name: "group"
      @group.users << @student
      @group.save!
    end

    it "doesn't include deleted groups in current_group_memberships" do
      expect(@student.current_group_memberships.size).to eq 1
      @group.destroy
      expect(@student.current_group_memberships.size).to eq 0
    end

    it "doesn't include deleted groups in group_memberships_for" do
      expect(@student.group_memberships_for(@course).size).to eq 1
      @group.destroy
      expect(@student.group_memberships_for(@course).size).to eq 0
    end

    it 'should show if user has group_membership' do
      expect(@student.current_groups_in_region?).to eq true
    end

  end

  describe 'visible_groups' do
    it "should include groups in published courses" do
      course_with_student active_all:true
      @group = Group.create! context: @course, name: "GroupOne"
      @group.users << @student
      @group.save!
      expect(@student.visible_groups.size).to eq 1
    end

    it "should not include groups that belong to unpublished courses" do
      course_with_student
      @group = Group.create! context: @course, name: "GroupOne"
      @group.users << @student
      @group.save!
      expect(@student.visible_groups.size).to eq 0
    end

    it 'excludes groups in courses with concluded enrollments' do
      course_with_student
      @course.conclude_at = Time.zone.now - 2.days
      @course.restrict_enrollments_to_course_dates = true
      @course.save!
      @group = Group.create! context: @course, name: 'GroupOne'
      @group.users << @student
      @group.save!
      expect(@student.visible_groups.size).to eq 0
    end

    it "should include account groups" do
      account = account_model(:parent_account => Account.default)
      student = user_factory active_all: true
      @group = Group.create! context: account, name: "GroupOne"
      @group.users << student
      @group.save!
      expect(student.visible_groups.size).to eq 1
    end
  end

  describe 'roles' do
    before(:once) do
      user_factory(active_all: true)
      course_factory(active_course: true)
      @account = Account.default
    end

    it "always includes 'user'" do
      expect(@user.roles(@account)).to eq %w[user]
    end

    it "includes 'student' if the user has a student enrollment" do
      @enrollment = @course.enroll_user(@user, 'StudentEnrollment', enrollment_state: 'active')
      expect(@user.roles(@account)).to eq %w[user student]
    end

    it "includes 'student' if the user has a student view student enrollment" do
      @user = @course.student_view_student
      expect(@user.roles(@account)).to eq %w[user student]
    end

    it "includes 'teacher' if the user has a teacher enrollment" do
      @enrollment = @course.enroll_user(@user, 'TeacherEnrollment', enrollment_state: 'active')
      expect(@user.roles(@account)).to eq %w[user teacher]
    end

    it "includes 'teacher' if the user has a ta enrollment" do
      @enrollment = @course.enroll_user(@user, 'TaEnrollment', enrollment_state: 'active')
      expect(@user.roles(@account)).to eq %w[user teacher]
    end

    it "includes 'teacher' if the user has a designer enrollment" do
      @enrollment = @course.enroll_user(@user, 'DesignerEnrollment', enrollment_state: 'active')
      expect(@user.roles(@account)).to eq %w[user teacher]
    end

    it "includes 'observer' if the user has an observer enrollment" do
      @enrollment = @course.enroll_user(@user, 'ObserverEnrollment', enrollment_state: 'active')
      expect(@user.roles(@account)).to eq %w[user observer]
    end

    it "includes 'admin' if the user has a sub-account admin user record" do
      sub_account = @account.sub_accounts.create!
      sub_account.account_users.create!(:user => @user, :role => admin_role)
      expect(@user.roles(@account)).to eq %w[user admin]
    end

    it "includes 'root_admin' if the user has a root account admin user record" do
      @account.account_users.create!(:user => @user, :role => admin_role)
      expect(@user.roles(@account)).to eq %w[user admin root_admin]
    end

    it 'caches results' do
      sub_account = @account.sub_accounts.create!
      sub_account.account_users.create!(:user => @user, :role => admin_role)
      result = @user.roles(@account)
      sub_account.destroy!
      expect(@user.roles(@account)).to eq result
    end

    context 'exclude_deleted_accounts' do
      it 'does not include admin if user has a sub-account admin user record in deleted account' do
        sub_account = @account.sub_accounts.create!
        sub_account.account_users.create!(:user => @user, :role => admin_role)
        @user.roles(@account)
        sub_account.destroy!
        expect(@user.roles(@account, true)).to eq %w[user]
      end

      it 'does not cache results when exclude_deleted_accounts is true' do
        sub_account = @account.sub_accounts.create!
        sub_account.account_users.create!(:user => @user, :role => admin_role)
        @user.roles(@account, true)
        expect(@user.roles(@account)).to eq %w[user admin]
      end
    end
  end

  it "should not grant user_notes rights to restricted users" do
    course_with_ta(:active_all => true)
    student_in_course(:course => @course, :active_all => true)
    @course.account.role_overrides.create!(role: ta_role, enabled: false, permission: :manage_user_notes)

    expect(@student.grants_right?(@ta, :create_user_notes)).to be_falsey
    expect(@student.grants_right?(@ta, :read_user_notes)).to be_falsey
  end

  it "should change avatar state on reporting" do
    user_factory
    @user.report_avatar_image!
    @user.reload
    expect(@user.avatar_state).to eq :reported
  end

  describe "submissions_folder" do
    before(:once) do
      student_in_course
    end

    it "creates the root submissions folder on demand" do
      f = @user.submissions_folder
      expect(@user.submissions_folders.where(parent_folder_id: Folder.root_folders(@user).first, name: 'Submissions').first).to eq f
    end

    it "finds the existing root submissions folder" do
      f = @user.folders.build
      f.parent_folder_id = Folder.root_folders(@user).first
      f.name = 'blah'
      f.submission_context_code = 'root'
      f.save!
      expect(@user.submissions_folder).to eq f
    end

    it "creates a submissions folder for a course" do
      f = @user.submissions_folder(@course)
      expect(@user.submissions_folders.where(submission_context_code: @course.asset_string, parent_folder_id: @user.submissions_folder, name: @course.name).first).to eq f
    end

    it "finds an existing submissions folder for a course" do
      f = @user.folders.build
      f.parent_folder_id = @user.submissions_folder
      f.name = 'bleh'
      f.submission_context_code = @course.asset_string
      f.save!
      expect(@user.submissions_folder(@course)).to eq f
    end
  end

  describe "after_create" do
    it "sets the new_user_tutorial_on_off feature flag to true" do
      u = User.create!
      expect(u.feature_enabled?(:new_user_tutorial_on_off)).to be true
    end
  end

  describe "#authenticate_one_time_password" do
    let(:user) { User.create! }
    let(:otp) { user.one_time_passwords.create! }

    it "marks it as used" do
      expect(user.authenticate_one_time_password(otp.code)).to eq otp
      expect(otp.reload).to be_used
    end

    it "doesn't allow using a used code" do
      otp.update_attribute(:used, true)
      expect(user.authenticate_one_time_password(otp.code)).to be_nil
    end
  end

  describe "#generate_one_time_passwords" do
    let(:user) { User.create! }

    it "generates them" do
      user.generate_one_time_passwords
      expect(user.one_time_passwords.count).to eq 10
    end

    it "doesn't clobber them if they already exist" do
      user.generate_one_time_passwords
      otps = user.one_time_passwords.order(:id).to_a
      user.reload
      user.generate_one_time_passwords
      expect(user.one_time_passwords.order(:id).to_a).to eq otps
    end

    it "does clobber them if you want it to" do
      user.generate_one_time_passwords
      otps = user.one_time_passwords.order(:id).to_a
      user.generate_one_time_passwords(regenerate: true)
      otps.each do |otp|
        expect { otp.reload }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end

  describe "#has_student_enrollment" do
    let(:user) { User.create! }

    it "returns false by default" do
        expect(user.has_student_enrollment?).to eq false
    end

    it "returns true when user is student and a course is active" do
        course_with_student(:user => user, :active_all => true)
        expect(user.has_student_enrollment?).to eq true
    end

    it "returns true when user is student and no courses are active" do
        course_with_student(:user => user, :active_all => false)
        expect(user.has_student_enrollment?).to eq true
    end

    it "returns false when user is teacher" do
        course_with_teacher(:user => user)
        expect(user.has_student_enrollment?).to eq false
    end

    it "returns false when user is TA" do
        course_with_ta(:user => user)
        expect(user.has_student_enrollment?).to eq false
    end

    it "returns false when user is designer" do
        course_with_designer(:user => user)
        expect(user.has_student_enrollment?).to eq false
    end
  end

  describe "#participating_student_current_and_concluded_course_ids" do
    let(:user) { User.create! }

    before :each do
      course_with_student(user: user, active_all: true)
    end

    it "includes courses for current enrollments" do
      expect(user.participating_student_current_and_concluded_course_ids).to include(@course.id)
    end

    it "includes concluded courses" do
      @course.soft_conclude!
      @course.save
      expect(user.participating_student_current_and_concluded_course_ids).to include(@course.id)
    end

    it "includes courses for concluded enrollments" do
      user.enrollments.last.conclude
      expect(user.participating_student_current_and_concluded_course_ids).to include(@course.id)
    end
  end

  describe "from_tokens" do
    specs_require_sharding

    let(:users) { [User.create!, @shard1.activate { User.create! }] }
    let(:tokens) { users.map(&:token) }

    it "generates tokens made of id/md5(uuid) pairs" do
      tokens.each_with_index do |token, i|
        expect(token).to eq "#{users[i].id}_#{Digest::MD5.hexdigest(users[i].uuid)}"
      end
    end

    it "instantiates users by token" do
      expect(User.from_tokens(tokens)).to match_array(users)
    end

    it "excludes bad tokens" do
      broken_tokens = tokens.map { |token| token + 'ff' }
      expect(User.from_tokens(broken_tokens)).to be_empty
    end
  end
end
