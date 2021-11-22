# frozen_string_literal: true

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
require_relative '../spec_helper'

describe DiscussionTopicsController do
  before :once do
    course_with_teacher(active_all: true)
    course_with_observer(active_all: true, course: @course)
    @observer_enrollment = @enrollment
    ta_in_course(active_all: true, course: @course)
    student_in_course(active_all: true, course: @course)
  end

  let(:now) { Time.zone.now.change(usec: 0) }

  def course_topic(opts = {})
    @topic = @course.discussion_topics.build(:title => "some topic", :pinned => opts.fetch(:pinned, false))
    user = opts[:user] || @user
    if user && !opts[:skip_set_user]
      @topic.user = user
    end

    if opts[:with_assignment]
      @topic.assignment = @course.assignments.build(:submission_types => 'discussion_topic', :title => @topic.title)
      @topic.assignment.infer_times
      @topic.assignment.saved_by = :discussion_topic
    end

    @topic.save
    @topic.reload
    @topic
  end

  def topic_entry
    @entry = @topic.discussion_entries.create(:message => "some message", :user => @user)
  end

  describe "GET 'index'" do
    it "requires authorization" do
      get 'index', params: { :course_id => @course.id }
      assert_unauthorized
    end

    it "requires the course to be published for students" do
      @course.claim
      user_session(@student)
      get 'index', params: { :course_id => @course.id }
      assert_unauthorized
    end

    it 'does not show announcements without :read_announcements' do
      @course.account.role_overrides.create!(permission: 'read_announcements', role: student_role, enabled: false)
      get 'index', params: { course_id: @course.id }
      assert_unauthorized
    end

    it "loads for :view_group_pages students" do
      @course.account.role_overrides.create!(
        role: student_role,
        permission: 'view_group_pages',
        enabled: true
      )
      @group_category = @course.group_categories.create(:name => 'gc')
      @group = @course.groups.create!(:group_category => @group_category)
      user_session(@student)

      get 'index', params: { :group_id => @group.id }
      expect(response).to be_successful
    end

    context "graded group discussion" do
      before do
        @course.account.role_overrides.create!(
          role: student_role,
          permission: 'view_group_pages',
          enabled: true
        )

        group_discussion_assignment
        @child_topic = @topic.child_topics.first
        @child_topic.root_topic_id = @topic.id
        @group = @child_topic.context
        @group.add_user(@student)
        @assignment.only_visible_to_overrides = true
        @assignment.save!
      end

      it "returns graded and visible group discussions properly" do
        cs = @student.enrollments.first.course_section
        create_section_override_for_assignment(@assignment, { course_section: cs })

        user_session(@student)

        get 'index', params: { :group_id => @group.id }
        expect(response).to be_successful
        expect(assigns["topics"]).to include(@child_topic)
      end

      it "assigns the create permission if the term is concluded and course is open" do
        @course.update_attribute(:restrict_enrollments_to_course_dates, true)
        term = @course.account.enrollment_terms.create!(:name => 'mew', :end_at => Time.now.utc - 1.minute)
        @course.enrollment_term = term
        @course.update_attribute(:conclude_at, Time.now.utc + 1.hour)
        @course.save!
        user_session(@teacher)

        get 'index', params: { :course_id => @course.id }

        expect(assigns[:js_env][:permissions][:create]).to be_truthy
      end

      it "does not assign the create permission if the term and course are concluded" do
        term = @course.account.enrollment_terms.create!(
          :name => 'mew',
          :start_at => 6.months.ago(now),
          :end_at => 1.month.ago(now)
        )
        @course.enrollment_term = term
        @course.update!(start_at: 5.months.ago(now), conclude_at: 2.months.ago(now))
        user_session(@teacher)

        get 'index', params: { :course_id => @course.id }

        expect(assigns[:js_env][:permissions][:create]).to be_falsy
      end

      it "does not return graded group discussions if a student has no visibility" do
        user_session(@student)

        get 'index', params: { :group_id => @group.id }
        expect(response).to be_successful
        expect(assigns["topics"]).not_to include(@child_topic)
      end

      it 'redirects to correct mastery paths edit page' do
        user_session(@teacher)
        allow(ConditionalRelease::Service).to receive(:enabled_in_context?).and_return(true)
        allow(ConditionalRelease::Service).to receive(:env_for).and_return({ dummy: 'value' })
        get :edit, params: { group_id: @group.id, id: @child_topic.id }
        redirect_path = "/courses/#{@course.id}/discussion_topics/#{@topic.id}/edit"
        expect(response).to redirect_to(redirect_path)
      end
    end

    context "cross-sharding" do
      specs_require_sharding

      it "marks as read when viewed" do
        @shard1.activate do
          account = Account.create!(name: 'Shard2 account')
          @course = account.courses.create!(name: 'new_course', workflow_state: 'available')
          # @student is defined outside and lives on the default shard.
          @course.enroll_user(@student, 'StudentEnrollment', enrollment_state: 'active')
          user_session(@student)
          course_topic(:skip_set_user => true)
          @topic.publish!

          expect(@student.stream_item_instances.count).to eq 1
          sii = @student.stream_item_instances.take
          expect(sii.workflow_state).to eq 'unread'
          expect(@topic.read_state(@student)).to eq 'unread'

          get 'show', params: { course_id: @course.id, id: @topic.id }

          expect(sii.reload.workflow_state).to eq 'read'
          expect(@topic.reload.read_state(@student)).to eq 'read'
        end
      end

      it 'returns the topic across shards' do
        @topic = @course.discussion_topics.create!(title: 'student topic', message: 'Hello', user: @student)
        user_session(@student)
        @shard1.activate do
          get 'index', params: { course_id: @course.id }, format: :json
          expect(assigns[:topics]).to include(@topic)
        end

        @shard2.activate do
          get 'index', params: { course_id: @course.id }, format: :json
          expect(assigns[:topics]).to include(@topic)
        end
      end
    end

    it "returns non-graded group discussions properly" do
      @course.account.role_overrides.create!(
        role: student_role,
        permission: 'view_group_pages',
        enabled: true
      )

      group_category(context: @course)
      group_with_user(group_category: @group_category, user: @student, context: @course)
      @topic = @group.discussion_topics.create(:title => "group topic")
      @topic.context = @group
      @topic.save!

      user_session(@student)

      get 'index', params: { :group_id => @group.id }
      expect(response).to be_successful
      expect(assigns["topics"]).to include(@topic)
    end

    it "non-graded group discussions include root data if json request" do
      delayed_post_time = 1.day.from_now
      lock_at_time = 2.days.from_now
      user_session(@teacher)
      group_topic = group_discussion_topic_model(
        :context => @course, :delayed_post_at => delayed_post_time, :lock_at => lock_at_time
      )
      group_topic.save!
      group_id = group_topic.child_topics.first.group.id
      get 'index', params: { group_id: group_id }, :format => :json
      expect(response).to be_successful
      parsed_json = json_parse(response.body)
      expect(parsed_json.length).to eq 1
      parsed_topic = parsed_json.first
      # barf
      expect(parsed_topic["delayed_post_at"].to_json).to eq delayed_post_time.to_json
      expect(parsed_topic["lock_at"].to_json).to eq lock_at_time.to_json
    end

    it "sets DIRECT_SHARE_ENABLED when allowed" do
      user_session(@teacher)
      get 'index', params: { course_id: @course.id }
      expect(response).to be_successful
      expect(assigns[:js_env][:DIRECT_SHARE_ENABLED]).to be(true)
    end

    it "does not set DIRECT_SHARE_ENABLED if the user does not have manage_content" do
      user_session(@student)
      get 'index', params: { course_id: @course.id }
      expect(response).to be_successful
      expect(assigns[:js_env][:DIRECT_SHARE_ENABLED]).to be(false)
    end

    it "does not set DIRECT_SHARE_ENABLED when viewing a group" do
      user_session(@teacher)
      group = @course.groups.create!
      get 'index', params: { group_id: group.id }
      expect(response).to be_successful
      expect(assigns[:js_env][:DIRECT_SHARE_ENABLED]).to be(false)
    end

    it "sets discussions reporting and anonymity when their flags are enabled" do
      Account.site_admin.enable_feature! :react_discussions_post
      Account.site_admin.enable_feature! :discussions_reporting
      Account.site_admin.enable_feature! :discussion_anonymity

      user_session(@teacher)
      get 'index', params: { course_id: @course.id }
      expect(assigns[:js_env][:student_reporting_enabled]).to be(true)
      expect(assigns[:js_env][:discussion_anonymity_enabled]).to be(true)
    end
  end

  describe "GET 'show'" do
    it "requires authorization" do
      course_topic
      get 'show', params: { :course_id => @course.id, :id => @topic.id }
      assert_unauthorized
    end

    it "requires the course to be published for students" do
      course_topic
      @course.claim
      user_session(@student)
      get 'show', params: { :course_id => @course.id, :id => @topic.id }
      assert_unauthorized
    end

    it "returns unauthorized if a user does not have visibilities" do
      user_session(@teacher)
      section1 = @course.course_sections.create!(name: "Section 1")
      section2 = @course.course_sections.create!(name: "Section 2")
      @course.enroll_teacher(@teacher, section: section1, allow_multiple_enrollments: true).accept!
      Enrollment.limit_privileges_to_course_section!(@course, @teacher, true)
      ann = @course.announcements.create!(message: "testing", is_section_specific: true, course_sections: [section2])
      ann.save!
      get :show, params: { course_id: @course.id, id: ann.id }
      get :edit, params: { course_id: @course.id, id: ann.id }
      expect(response.status).to equal(401)
    end

    it "js_env TOTAL_USER_COUNT and IS_ANNOUNCEMENT are set correctly for section specific announcements" do
      user_session(@teacher)
      section1 = @course.course_sections.create!(name: "Section 1")
      @course.course_sections.create!(name: "Section 2")
      ann = @course.announcements.create!(message: "testing", is_section_specific: true, course_sections: [section1])
      ann.save!
      get 'show', params: { :course_id => @course.id, :id => ann }
      expect(assigns[:js_env][:TOTAL_USER_COUNT]).to eq(5)
    end

    it "js_env COURSE_SECTIONS is set correctly for section specific announcements" do
      user_session(@teacher)
      section1 = @course.course_sections.create!(name: "Section 1")
      ann = @course.announcements.create!(message: "testing", is_section_specific: true, course_sections: [section1])
      ann.save!
      get 'show', params: { :course_id => @course.id, :id => ann }
      expect(assigns[:js_env][:DISCUSSION][:TOPIC][:COURSE_SECTIONS].first["name"]).to eq(section1.name)
    end

    it "js_env COURSE_SECTIONS should have correct count" do
      user_session(@teacher)
      section1 = @course.course_sections.create!(name: "Section 1")

      student1, student2 = create_users(2, return_type: :record)
      student_in_section(section1, user: student1)
      student_in_section(section1, user: student2)
      ann = @course.announcements.create!(message: "testing", is_section_specific: true, course_sections: [section1])
      ann.save!
      student1.enrollments.first.conclude
      get 'show', params: { :course_id => @course.id, :id => ann }
      expect(assigns[:js_env][:DISCUSSION][:TOPIC][:COURSE_SECTIONS].first[:user_count]).to eq(1)
    end

    it "js_env requires user for apollo_caching" do
      Account.site_admin.enable_feature! :react_discussions_post
      Account.site_admin.enable_feature! :apollo_caching
      @course.update(is_public: true)

      @discussion = @course.discussion_topics.create!(user: @teacher, message: 'hello')
      get 'show', params: { course_id: @course.id, id: @discussion.id }
      expect(assigns[:js_env][:apollo_caching]).to be_nil
      user_session @student
      get 'show', params: { course_id: @course.id, id: @discussion.id }
      expect(assigns[:js_env][:apollo_caching]).to be_truthy
    end

    it "js_env disable_keyboard_shortcuts should follow feature flag" do
      @student.enable_feature! :disable_keyboard_shortcuts
      user_session @student
      @discussion = @course.discussion_topics.create!(:user => @teacher, message: 'hello')
      get 'show', params: { :course_id => @course.id, :id => @discussion.id }
      expect(assigns[:js_env][:disable_keyboard_shortcuts]).to be_truthy
    end

    it "logs an asset_user_access on show" do
      allow(@course).to receive(:feature_enabled?).with('react_discussions_post').and_return(true)
      user_session @student
      @discussion = @course.discussion_topics.create!(:user => @teacher, message: 'hello')
      get 'show', params: { course_id: @course.id, id: @discussion.id }
      accessed_asset = assigns[:accessed_asset]
      expect(accessed_asset[:category]).to eq 'topics'
    end

    it "js_bundles includes discussion_topics_post when ff is on" do
      commons_hash = {
        base_url: '/testing-url',
        canvas_icon_class: 'icon-commons',
        icon_url: 'http://example.com/icon.png',
        id: '1',
        title: 'Share to Commons'
      }
      allow(controller).to receive(:external_tools_display_hashes).and_return([commons_hash])
      @course.enable_feature!(:react_discussions_post)
      user_session(@teacher)
      @discussion = @course.discussion_topics.create!(:user => @teacher, title: 'Greetings', message: 'Hello, and good morning!')
      get 'show', params: { :course_id => @course.id, :id => @discussion.id }
      expect(assigns[:js_bundles].first).to include(:discussion_topics_post)
      expect(assigns[:_crumbs]).to include(['Discussions', "/courses/#{@course.id}/discussion_topics", {}])
      expect(controller.js_env[:discussion_topic_menu_tools].first).to eq commons_hash
    end

    it "does not work for announcements in a public course" do
      @course.update_attribute(:is_public, true)
      @announcement = @course.announcements.create!(
        :title => "some announcement",
        :message => "some message"
      )
      get 'show', params: { :course_id => @course.id, :id => @announcement.id }
      expect(response).to_not be_successful
    end

    it "does not display announcements in private courses to users who aren't logged in" do
      announcement = @course.announcements.create!(title: 'Test announcement', message: 'Message')
      get('show', params: { course_id: @course.id, id: announcement.id })
      assert_unauthorized
    end

    context 'with the "react_discussions_post" FF enabled' do
      subject { get 'show', params: { course_id: course.id, id: discussion.id } }

      let!(:discussion) do
        course.discussion_topics.create!(
          user: user,
          title: 'Lego',
          message: 'What upcoming set are you most excited for?'
        )
      end

      let(:course) { @course }
      let(:user) { @teacher }

      before do
        course.enable_feature! :react_discussions_post
        user_session(user)
      end

      context 'and "rce_mentions_in_discussions" enabled' do
        before { Account.site_admin.enable_feature! :rce_mentions_in_discussions }

        it 'sets "rce_mentions_in_discussions" to true in the JS ENV' do
          subject
          expect(assigns.dig(:js_env, :rce_mentions_in_discussions)).to be true
        end
      end

      context 'and "rce_mentions_in_discussions" disabled' do
        before { Account.site_admin.disable_feature! :rce_mentions_in_discussions }

        it 'sets "rce_mentions_in_discussions" to false in the JS ENV' do
          subject
          expect(assigns.dig(:js_env, :rce_mentions_in_discussions)).to be false
        end
      end

      context "podcast_enabled" do
        it "adds Discussion Podcast Feed to header" do
          discussion.podcast_enabled = true
          discussion.save

          subject
          expect(response.to_a.to_s).to match(/.+enrollment.+\.rss/)
          expect(response.to_a.to_s).to include("Discussion Podcast Feed")
        end
      end

      it "adds Discussion Atom Feed to header" do
        subject
        expect(response.to_a.to_s).to match(/.+enrollment.+\.atom/)
        expect(response.to_a.to_s).to include("Discussion Atom Feed")
      end
    end

    context 'section specific announcements' do
      before(:once) do
        course_with_teacher(active_course: true)
        @section = @course.course_sections.create!(name: 'test section')

        @announcement = @course.announcements.create!(:user => @teacher, message: 'hello my favorite section!')
        @announcement.is_section_specific = true
        @announcement.course_sections = [@section]
        @announcement.save!

        @student1, @student2 = create_users(2, return_type: :record)
        @course.enroll_student(@student1, :enrollment_state => 'active')
        @course.enroll_student(@student2, :enrollment_state => 'active')
        student_in_section(@section, user: @student1)
      end

      it "is visible to students in specific section" do
        user_session(@student1)
        get 'show', params: { :course_id => @course.id, :id => @announcement.id }
        expect(response).to be_successful
      end

      it "is not visible to students not in specific section announcements" do
        user_session(@student2)
        get('show', params: { course_id: @course.id, id: @announcement.id })
        expect(response).to be_redirect
        expect(response.location).to eq course_announcements_url @course
      end
    end

    context 'section specific discussions' do
      before(:once) do
        course_with_teacher(active_course: true)
        @section = @course.course_sections.create!(name: 'test section')

        @discussion = @course.discussion_topics.create!(:user => @teacher, message: 'hello my favorite section!')
        @discussion.is_section_specific = true
        @discussion.course_sections = [@section]
        @discussion.save!

        @student1, @student2 = create_users(2, return_type: :record)
        @course.enroll_student(@student1, :enrollment_state => 'active')
        @course.enroll_student(@student2, :enrollment_state => 'active')
        student_in_section(@section, user: @student1)
      end

      it "is visible to students in specific section" do
        user_session(@student1)
        get 'show', params: { :course_id => @course.id, :id => @discussion.id }
        expect(response).to be_successful
      end

      it "is not visible to students not in specific section discussions" do
        user_session(@student2)
        get('show', params: { course_id: @course.id, id: @discussion.id })
        expect(response).to be_redirect
        expect(response.location).to eq course_discussion_topics_url @course
      end
    end

    context "discussion topic with assignment with overrides" do
      render_views

      before :once do
        course_topic(user: @teacher, with_assignment: true)
        @section = @course.course_sections.create!(:name => "I <3 Discusions")
        @override = assignment_override_model(:assignment => @topic.assignment,
                                              :due_at => Time.now,
                                              :set => @section)
      end

      it "doesn't show the topic to unassigned students" do
        @topic.assignment.update_attribute(:only_visible_to_overrides, true)
        user_session(@student)
        get 'show', params: { :course_id => @course.id, :id => @topic.id }
        expect(response).to be_redirect
        expect(response.location).to eq course_discussion_topics_url @course
      end

      it "doesn't show overrides to students" do
        user_session(@student)
        get 'show', params: { :course_id => @course.id, :id => @topic.id }
        expect(response).to be_successful
        expect(response.body).not_to match 'discussion-topic-due-dates'
        due_date = OverrideListPresenter.new.due_at(@topic.assignment)
        expect(response.body).to match "due #{due_date}"
      end

      it "doesn't show overrides for observers" do
        user_session(@observer)
        get 'show', params: { :course_id => @course.id, :id => @topic.id }
        expect(response).to be_successful
        expect(response.body).not_to match 'discussion-topic-due-dates'
        due_date = OverrideListPresenter.new.due_at(@topic.assignment.overridden_for(@observer))
        expect(response.body).to match "due #{due_date}"
      end

      it "does show overrides to teachers" do
        user_session(@teacher)
        get 'show', params: { :course_id => @course.id, :id => @topic.id }
        expect(response).to be_successful
        expect(response.body).to match 'discussion-topic-due-dates'
      end
    end

    it "assigns variables" do
      user_session(@student)
      course_topic
      topic_entry
      @topic.reload
      expect(@topic.discussion_entries).not_to be_empty
      get 'show', params: { :course_id => @course.id, :id => @topic.id }
      expect(response).to be_successful
      expect(assigns[:topic]).not_to be_nil
      expect(assigns[:topic]).to eql(@topic)
    end

    it "displays speedgrader when not for a large course" do
      user_session(@teacher)
      course_topic(user: @teacher, with_assignment: true)
      get 'show', params: { :course_id => @course.id, :id => @topic.id }
      expect(assigns[:js_env][:DISCUSSION][:SPEEDGRADER_URL_TEMPLATE]).to be_truthy
    end

    it "hides speedgrader when for a large course" do
      user_session(@teacher)
      course_topic(user: @teacher, with_assignment: true)
      allow_any_instance_of(Course).to receive(:large_roster?).and_return(true)
      get 'show', params: { :course_id => @course.id, :id => @topic.id }
      expect(assigns[:js_env][:DISCUSSION][:SPEEDGRADER_URL_TEMPLATE]).to be_nil
    end

    it "shows speedgrader when user can view all grades but not manage grades" do
      @course.account.role_overrides.create!(permission: 'manage_grades', role: ta_role, enabled: false)
      user_session(@ta)
      course_topic(user: @teacher, with_assignment: true)
      get 'show', params: { course_id: @course.id, id: @topic.id }
      expect(assigns[:js_env][:DISCUSSION][:SPEEDGRADER_URL_TEMPLATE]).to be_truthy
    end

    it "shows speedgrader when user can manage grades but not view all grades" do
      @course.account.role_overrides.create!(permission: 'view_all_grades', role: ta_role, enabled: false)
      user_session(@ta)
      course_topic(user: @teacher, with_assignment: true)
      get 'show', params: { course_id: @course.id, id: @topic.id }
      expect(assigns[:js_env][:DISCUSSION][:SPEEDGRADER_URL_TEMPLATE]).to be_truthy
    end

    it "does not show speedgrader when user can neither view all grades nor manage grades" do
      @course.account.role_overrides.create!(permission: 'view_all_grades', role: ta_role, enabled: false)
      @course.account.role_overrides.create!(permission: 'manage_grades', role: ta_role, enabled: false)
      user_session(@ta)
      course_topic(user: @teacher, with_assignment: true)
      get 'show', params: { course_id: @course.id, id: @topic.id }
      expect(assigns[:js_env][:DISCUSSION][:SPEEDGRADER_URL_TEMPLATE]).to be_nil
    end

    it "shows speedgrader when course concluded and user can read as admin" do
      user_session(@teacher)
      course_topic(user: @teacher, with_assignment: true)
      @course.soft_conclude!
      expect(@course.grants_right?(@teacher, :read_as_admin)).to be true
      get 'show', params: { course_id: @course.id, id: @topic.id }
      expect(assigns[:js_env][:DISCUSSION][:SPEEDGRADER_URL_TEMPLATE]).to be_truthy
    end

    it "setups speedgrader template for variable substitution" do
      user_session(@teacher)
      course_topic(user: @teacher, with_assignment: true)
      get 'show', params: { :course_id => @course.id, :id => @topic.id }

      # this is essentially a unit test for ui/features/discussion_topic/backbone/models/Entry.coffee,
      # making sure that we get back the expected format for this url template
      template = assigns[:js_env][:DISCUSSION][:SPEEDGRADER_URL_TEMPLATE]
      url = template.gsub(/%3Astudent_id/, '123')
      expect(url).to match "student_id=123"
    end

    it "marks as read when viewed" do
      user_session(@student)
      course_topic(:skip_set_user => true)

      expect(@topic.read_state(@student)).to eq 'unread'
      get 'show', params: { :course_id => @course.id, :id => @topic.id }
      expect(@topic.reload.read_state(@student)).to eq 'read'
    end

    it "marks as read when topic is in the future as teacher" do
      course_topic(:skip_set_user => true)
      teacher2 = @course.shard.activate { user_factory }
      teacher2enrollment = @course.enroll_user(teacher2, "TeacherEnrollment")
      teacher2.save!
      teacher2enrollment.course = @course # set the reverse association
      teacher2enrollment.workflow_state = 'active'
      teacher2enrollment.save!
      @course.reload
      @topic.available_from = 1.day.from_now
      @topic.save!
      @topic.reload
      expect(@topic.read_state(teacher2)).to eq 'unread'
      user_session(teacher2)
      get 'show', params: { :course_id => @course.id, :id => @topic.id }
      expect(@topic.reload.read_state(teacher2)).to eq 'read'
    end

    it "does not mark as read if not visible" do
      user_session(@student)
      course_topic(:skip_set_user => true)
      mod = @course.context_modules.create! name: 'no soup for you', unlock_at: 1.year.from_now
      mod.add_item(type: 'discussion_topic', id: @topic.id)
      mod.save!
      expect(@topic.read_state(@student)).to eq 'unread'
      get 'show', params: { :course_id => @course.id, :id => @topic.id }
      expect(@topic.reload.read_state(@student)).to eq 'unread'
    end

    it "marks as read if visible but locked" do
      user_session(@student)
      course_topic(:skip_set_user => true)
      @announcement = @course.announcements.create!(
        :title => "some announcement",
        :message => "some message",
        :unlock_at => 1.week.ago,
        :lock_at => 1.day.ago
      )
      expect(@announcement.read_state(@student)).to eq 'unread'
      get 'show', params: { :course_id => @course.id, :id => @announcement.id }
      expect(@announcement.reload.read_state(@student)).to eq 'read'
    end

    it "allows concluded teachers to see discussions" do
      user_session(@teacher)
      course_topic
      @enrollment.conclude
      get 'show', params: { :course_id => @course.id, :id => @topic.id }
      expect(response).to be_successful
      get 'index', params: { :course_id => @course.id }
      expect(response).to be_successful
    end

    it "allows concluded students to see discussions" do
      user_session(@student)
      course_topic
      @enrollment.conclude
      get 'show', params: { :course_id => @course.id, :id => @topic.id }
      expect(response).to be_successful
      get 'index', params: { :course_id => @course.id }
      expect(response).to be_successful
    end

    context 'group discussions' do
      before(:once) do
        @group_category = @course.group_categories.create(:name => 'category 1')
        @group1 = @course.groups.create!(:group_category => @group_category)
        @group2 = @course.groups.create!(:group_category => @group_category)

        group_category2 = @course.group_categories.create(:name => 'category 2')
        @course.groups.create!(:group_category => group_category2)

        course_topic(user: @teacher, with_assignment: true)
        @topic.group_category = @group_category
        @topic.save!

        @group1.add_user(@student)
      end

      it "provides sequence in js_env when Discussions Redesign is ON" do
        Account.default.enable_feature! :react_discussions_post
        module1 = @course.context_modules.create!(:name => "module1")
        module1.add_item(:id => @topic.id, :type => 'discussion_topic')
        user_session(@teacher)

        get 'show', params: { :course_id => @course.id, :id => @topic.id }
        expect(assigns[:js_env][:SEQUENCE]).to be_truthy
      end

      it "sets correct URL env vars" do
        Account.default.enable_feature! :react_discussions_post
        outcome_with_rubric
        @rubric.associate_with(@topic.assignment, @course, :purpose => "grading")
        @topic.assignment.peer_reviews = true
        user_session(@teacher)
        get 'show', params: { :course_id => @course.id, :id => @topic.id }
        expect(assigns[:js_env][:EDIT_URL]).to eq "/courses/#{@course.id}/discussion_topics/#{@topic.id}/edit"
        expect(assigns[:js_env][:DISCUSSION][:GRADED_RUBRICS_URL]).to eq "/courses/#{@course.id}/assignments/#{@topic.assignment.id}/rubric"
        expect(assigns[:js_env][:DISCUSSION][:CONTEXT_RUBRICS_URL]).to eq "/courses/#{@course.id}/rubrics"
        expect(assigns[:js_env][:SPEEDGRADER_URL_TEMPLATE])
          .to eq "/courses/#{@course.id}/gradebook/speed_grader?assignment_id=#{@topic.assignment.id}&student_id=%3Astudent_id"
        expect(assigns[:js_env][:PEER_REVIEWS_URL]).to eq "/courses/#{@course.id}/assignments/#{@topic.assignment.id}/peer_reviews"
      end

      it "assigns groups from the topic's category" do
        user_session(@teacher)

        get 'show', params: { :course_id => @course.id, :id => @topic.id }
        expect(assigns[:groups].size).to eql(2)
      end

      it "only shows applicable groups if DA applies" do
        user_session(@teacher)

        asmt = @topic.assignment
        asmt.only_visible_to_overrides = true
        override = asmt.assignment_overrides.build
        override.set = @group2
        override.save!
        asmt.save!

        get 'show', params: { :course_id => @course.id, :id => @topic.id }
        expect(response).to be_successful
        expect(assigns[:groups]).to eq([@group2])
      end

      it "redirects to group for student if DA applies to section" do
        user_session(@student)

        asmt = @topic.assignment
        asmt.only_visible_to_overrides = true
        override = asmt.assignment_overrides.build
        override.set = @course.default_section
        override.save!
        asmt.save!

        get 'show', params: { :course_id => @course.id, :id => @topic.id }
        redirect_path = "/groups/#{@group1.id}/discussion_topics?root_discussion_topic_id=#{@topic.id}"
        expect(response).to redirect_to redirect_path
      end

      it "redirects to the student's group" do
        user_session(@student)

        get 'show', params: { :course_id => @course.id, :id => @topic.id }
        redirect_path = "/groups/#{@group1.id}/discussion_topics?root_discussion_topic_id=#{@topic.id}"
        expect(response).to redirect_to redirect_path
      end

      it "redirects to the student's group even if students can view all groups" do
        @course.account.role_overrides.create!(
          role: student_role,
          permission: 'view_group_pages',
          enabled: true
        )
        user_session(@student)

        get 'show', params: { :course_id => @course.id, :id => @topic.id }
        redirect_path = "/groups/#{@group1.id}/discussion_topics?root_discussion_topic_id=#{@topic.id}"
        expect(response).to redirect_to redirect_path
      end

      it "does not change the name of the child topic when navigating to it" do
        user_session(@student)

        child_topic = @topic.child_topic_for(@student)
        old_title = child_topic.title

        get 'index', params: { :group_id => @group1.id, :root_discussion_topic_id => @topic.id }

        expect(@topic.child_topic_for(@student).title).to eq old_title
      end

      it "plumbs the module_item_id through group discussion redirect" do
        user_session(@student)

        get 'show', params: { :course_id => @course.id, :id => @topic.id, :module_item_id => 789 }
        expect(response).to be_redirect
        expect(response.location).to include "/groups/#{@group1.id}/discussion_topics?"
        expect(response.location).to include "module_item_id=789"
      end

      it "plumbs the module_item_id through child discussion redirect" do
        user_session(@student)

        get 'index', params: { :group_id => @group1.id, :root_discussion_topic_id => @topic.id, :module_item_id => 789 }
        expect(response).to be_redirect
        expect(response.location).to include "/groups/#{@group1.id}/discussion_topics/#{@topic.child_topic_for(@student).id}?"
        expect(response.location).to include "module_item_id=789"
      end

      it "excludes locked modules" do
        user_session(@student)
        course_topic(skip_set_user: true)
        mod = @course.context_modules.create! name: 'no soup for you', unlock_at: 1.year.from_now
        mod.add_item(type: 'discussion_topic', id: @topic.id)
        mod.save!
        expect(@topic.read_state(@student)).to eq 'unread'
        get 'index', params: { course_id: @course.id, exclude_context_module_locked_topics: true }, format: 'json'
        expect(response.parsed_body.map { |t| t['id'] }).to_not include @topic.id
      end
    end

    context 'publishing' do
      render_views

      it "hides the publish icon for announcements" do
        user_session(@teacher)
        @context = @course
        @announcement = @course.announcements.create!(
          :title => "some announcement",
          :message => "some message"
        )
        get 'show', params: { :course_id => @course.id, :id => @announcement.id }
        expect(response.body).not_to match "topic_publish_button"
      end
    end

    context "posting first to view setting" do
      before(:once) do
        @observer_enrollment.associated_user = @student
        @observer_enrollment.save
        @observer.reload

        @context = @course
        discussion_topic_model
        @topic.require_initial_post = true
        @topic.save
      end

      it "allows admins to see posts without posting" do
        @topic.reply_from(:user => @student, :text => 'hai')
        user_session(@teacher)
        get 'show', params: { :course_id => @course.id, :id => @topic.id }
        expect(assigns[:initial_post_required]).to be_falsey
      end

      it "does not allow student who hasn't posted to see" do
        @topic.reply_from(:user => @teacher, :text => 'hai')
        user_session(@student)
        get 'show', params: { :course_id => @course.id, :id => @topic.id }
        expect(assigns[:initial_post_required]).to be_truthy
      end

      it "does not allow student's observer who hasn't posted to see" do
        @topic.reply_from(:user => @teacher, :text => 'hai')
        user_session(@observer)
        get 'show', params: { :course_id => @course.id, :id => @topic.id }
        expect(assigns[:initial_post_required]).to be_truthy
      end

      it "allows student who has posted to see" do
        @topic.reply_from(:user => @student, :text => 'hai')
        user_session(@student)
        get 'show', params: { :course_id => @course.id, :id => @topic.id }
        expect(assigns[:initial_post_required]).to be_falsey
      end

      it "allows student's observer who has posted to see" do
        @topic.reply_from(:user => @student, :text => 'hai')
        user_session(@observer)
        get 'show', params: { :course_id => @course.id, :id => @topic.id }
        expect(assigns[:initial_post_required]).to be_falsey
      end
    end

    context "student context cards" do
      before(:once) do
        course_topic user: @teacher
      end

      it "is disabed for students" do
        user_session(@student)
        get :show, params: { course_id: @course.id, id: @topic.id }
        expect(assigns[:js_env][:STUDENT_CONTEXT_CARDS_ENABLED]).to be_falsey
      end

      it "is enabled for teachers" do
        user_session(@teacher)
        get :show, params: { course_id: @course.id, id: @topic.id }
        expect(assigns[:js_env][:STUDENT_CONTEXT_CARDS_ENABLED]).to eq true
      end
    end

    it "successfully redirects no authorization for a public course" do
      @course.update(is_public: true)
      course_topic
      get 'show', params: { :course_id => @course.id, :id => @topic.id }
      expect(response.code).to eq "302"
      expect(ErrorReport.last).to be_nil
    end

    context "in a homeroom course" do
      before do
        @course.account.enable_as_k5_account!
      end

      it "does not permit replies to assignments" do
        @course.homeroom_course = true
        @course.save!
        user_session(@teacher)
        topic = Announcement.create!(context: @course, title: 'Test Announcement', message: 'hello world')

        get 'show', params: { :course_id => @course.id, :id => topic.id }
        expect(assigns[:js_env][:DISCUSSION][:PERMISSIONS][:CAN_REPLY]).to be_falsey
        expect(assigns[:js_env][:DISCUSSION][:PERMISSIONS][:CAN_READ_REPLIES]).to be_falsey
      end
    end
  end

  describe "GET 'new'" do
    it "maintains date and time when passed params" do
      user_session(@teacher)
      due_at = 1.day.from_now
      get 'new', params: { course_id: @course.id, due_at: due_at.iso8601 }
      expect(assigns[:js_env][:DISCUSSION_TOPIC][:ATTRIBUTES][:assignment][:due_at]).to eq due_at.iso8601
    end

    it "js_env DUE_DATE_REQUIRED_FOR_ACCOUNT is true when AssignmentUtil.due_date_required_for_account? == true" do
      user_session(@teacher)
      allow(AssignmentUtil).to receive(:due_date_required_for_account?).and_return(true)
      get 'new', params: { :course_id => @course.id }
      expect(assigns[:js_env][:DUE_DATE_REQUIRED_FOR_ACCOUNT]).to eq(true)
    end

    it "js_env DUE_DATE_REQUIRED_FOR_ACCOUNT is false when AssignmentUtil.due_date_required_for_account? == false" do
      user_session(@teacher)
      allow(AssignmentUtil).to receive(:due_date_required_for_account?).and_return(false)
      get 'new', params: { :course_id => @course.id }
      expect(assigns[:js_env][:DUE_DATE_REQUIRED_FOR_ACCOUNT]).to eq(false)
    end

    it "js_env MAX_NAME_LENGTH_REQUIRED_FOR_ACCOUNT is true when AssignmentUtil.name_length_required_for_account? == true" do
      user_session(@teacher)
      allow(AssignmentUtil).to receive(:name_length_required_for_account?).and_return(true)
      get 'new', params: { :course_id => @course.id }
      expect(assigns[:js_env][:MAX_NAME_LENGTH_REQUIRED_FOR_ACCOUNT]).to eq(true)
    end

    it "js_env MAX_NAME_LENGTH_REQUIRED_FOR_ACCOUNT is false when AssignmentUtil.name_length_required_for_account? == false" do
      user_session(@teacher)
      allow(AssignmentUtil).to receive(:name_length_required_for_account?).and_return(false)
      get 'new', params: { :course_id => @course.id }
      expect(assigns[:js_env][:MAX_NAME_LENGTH_REQUIRED_FOR_ACCOUNT]).to eq(false)
    end

    it "js_env MAX_NAME_LENGTH is a 15 when AssignmentUtil.assignment_max_name_length returns 15" do
      user_session(@teacher)
      allow(AssignmentUtil).to receive(:assignment_max_name_length).and_return(15)
      get 'new', params: { :course_id => @course.id }
      expect(assigns[:js_env][:MAX_NAME_LENGTH]).to eq(15)
    end

    it "js_env SIS_NAME is Foo Bar when AssignmentUtil.post_to_sis_friendly_name is Foo Bar" do
      user_session(@teacher)
      allow(AssignmentUtil).to receive(:post_to_sis_friendly_name).and_return('Foo Bar')
      get 'new', params: { :course_id => @course.id }
      expect(assigns[:js_env][:SIS_NAME]).to eq('Foo Bar')
    end

    it "js_env allow_student_anonymous_discussion_topics defaults to false" do
      user_session(@teacher)
      get 'new', params: { :course_id => @course.id }
      expect(assigns[:js_env][:allow_student_anonymous_discussion_topics]).to eq false
    end

    it "js_env allow_student_anonymous_discussion_topics is true when its only when course setting is true" do
      user_session(@teacher)
      @course.allow_student_anonymous_discussion_topics = true
      @course.save!
      get 'new', params: { :course_id => @course.id }
      expect(assigns[:js_env][:allow_student_anonymous_discussion_topics]).to eq true
    end
  end

  describe "GET 'new'" do
    it "creates a default assignment group if none exist" do
      user_session(@teacher)
      get :new, params: { course_id: @course.id }
      expect(@course.assignment_groups.count).not_to eq 0
    end

    it "announcement" do
      user_session(@teacher)
      @course.group_weighting_scheme = 'percent'
      @course.save!
      get :new, params: { course_id: @course.id, is_announcement: true }
      expect(assigns[:js_env][:CONTEXT_ID]).to eq(@course.id)
    end
  end

  describe "GET 'edit'" do
    before(:once) do
      course_topic
    end

    include_context "grading periods within controller" do
      let(:course) { @course }
      let(:teacher) { @teacher }
      let(:request_params) { [:edit, params: { course_id: course, id: @topic }] }
    end

    it "does not explode with mgp and group context" do
      group1 = Factories::GradingPeriodGroupHelper.new.create_for_account(@course.root_account)
      group1.enrollment_terms << @course.enrollment_term
      user_session(@teacher)
      group = group_model(:context => @course)
      group_topic = group.discussion_topics.create!(:title => "title")
      get(:edit, params: { group_id: group, id: group_topic })
      expect(response).to be_successful
      expect(assigns[:js_env]).to have_key(:active_grading_periods)
    end

    it "js_env SECTION_LIST is set correctly for section specific announcements on a limited privileges user" do
      user_session(@teacher)
      section1 = @course.course_sections.create!(name: "Section 1")
      @course.course_sections.create!(name: "Section 2")
      @course.enroll_teacher(@teacher, section: section1, allow_multiple_enrollments: true).accept!
      Enrollment.limit_privileges_to_course_section!(@course, @teacher, true)
      ann = @course.announcements.create!(message: "testing", is_section_specific: true, course_sections: [section1])
      ann.save!
      get :edit, params: { course_id: @course.id, id: ann.id }

      # 2 because there is a default course created in the course_with_teacher factory
      expect(assigns[:js_env]["SECTION_LIST"].length).to eq(2)
    end

    it "js_env SECTION_LIST is set correctly for section specific announcements on a not limited privileges user" do
      user_session(@teacher)
      section1 = @course.course_sections.create!(name: "Section 1")
      @course.course_sections.create!(name: "Section 2")
      @course.enroll_teacher(@teacher, section: section1, allow_multiple_enrollments: true).accept!
      Enrollment.limit_privileges_to_course_section!(@course, @teacher, false)
      ann = @course.announcements.create!(message: "testing", is_section_specific: true, course_sections: [section1])
      ann.save!
      get :edit, params: { course_id: @course.id, id: ann.id }

      # 3 because there is a default course created in the course_with_teacher factory
      expect(assigns[:js_env]["SECTION_LIST"].length).to eq(3)
    end

    it "returns unauthorized for a user that does not have visibilites to view thiss" do
      user_session(@teacher)
      section1 = @course.course_sections.create!(name: "Section 1")
      section2 = @course.course_sections.create!(name: "Section 2")
      @course.enroll_teacher(@teacher, section: section1, allow_multiple_enrollments: true).accept!
      Enrollment.limit_privileges_to_course_section!(@course, @teacher, true)
      ann = @course.announcements.create!(message: "testing", is_section_specific: true, course_sections: [section2])
      ann.save!
      get :edit, params: { course_id: @course.id, id: ann.id }
      assert_unauthorized
    end

    it "js_env SELECTED_SECTION_LIST is set correctly for section specific announcements" do
      user_session(@teacher)
      section1 = course.course_sections.create!(name: "Section 1")
      section2 = course.course_sections.create!(name: "Section 2")
      course.enroll_teacher(@teacher, section: section1, allow_multiple_enrollments: true).accept(true)
      course.enroll_teacher(@teacher, section: section2, allow_multiple_enrollments: true).accept(true)
      ann = @course.announcements.create!(message: "testing", is_section_specific: true, course_sections: [section1])
      ann.save!
      get :edit, params: { course_id: @course.id, id: ann.id }
      expect(assigns[:js_env]["SELECTED_SECTION_LIST"]).to eq([{ :id => section1.id, :name => section1.name }])
    end

    it "js_env DUE_DATE_REQUIRED_FOR_ACCOUNT is true when AssignmentUtil.due_date_required_for_account? == true" do
      user_session(@teacher)
      allow(AssignmentUtil).to receive(:due_date_required_for_account?).and_return(true)
      get :edit, params: { course_id: @course.id, id: @topic.id }
      expect(assigns[:js_env][:DUE_DATE_REQUIRED_FOR_ACCOUNT]).to eq(true)
    end

    it "js_env DUE_DATE_REQUIRED_FOR_ACCOUNT is false when AssignmentUtil.due_date_required_for_account? == false" do
      user_session(@teacher)
      allow(AssignmentUtil).to receive(:due_date_required_for_account?).and_return(false)
      get :edit, params: { course_id: @course.id, id: @topic.id }
      expect(assigns[:js_env][:DUE_DATE_REQUIRED_FOR_ACCOUNT]).to eq(false)
    end

    it "js_env MAX_NAME_LENGTH_REQUIRED_FOR_ACCOUNT is true when AssignmentUtil.name_length_required_for_account? == true" do
      user_session(@teacher)
      allow(AssignmentUtil).to receive(:name_length_required_for_account?).and_return(true)
      get :edit, params: { course_id: @course.id, id: @topic.id }
      expect(assigns[:js_env][:MAX_NAME_LENGTH_REQUIRED_FOR_ACCOUNT]).to eq(true)
    end

    it "js_env MAX_NAME_LENGTH_REQUIRED_FOR_ACCOUNT is false when AssignmentUtil.name_length_required_for_account? == false" do
      user_session(@teacher)
      allow(AssignmentUtil).to receive(:name_length_required_for_account?).and_return(false)
      get :edit, params: { course_id: @course.id, id: @topic.id }
      expect(assigns[:js_env][:MAX_NAME_LENGTH_REQUIRED_FOR_ACCOUNT]).to eq(false)
    end

    it "js_env MAX_NAME_LENGTH is a 15 when AssignmentUtil.assignment_max_name_length returns 15" do
      user_session(@teacher)
      allow(AssignmentUtil).to receive(:assignment_max_name_length).and_return(15)
      get :edit, params: { course_id: @course.id, id: @topic.id }
      expect(assigns[:js_env][:MAX_NAME_LENGTH]).to eq(15)
    end

    it "js_env SIS_NAME is Foo Bar when AssignmentUtil.post_to_sis_friendly_name is Foo Bar" do
      user_session(@teacher)
      allow(AssignmentUtil).to receive(:post_to_sis_friendly_name).and_return('Foo Bar')
      get :edit, params: { :course_id => @course.id, :id => @topic.id }
      expect(assigns[:js_env][:SIS_NAME]).to eq('Foo Bar')
    end

    it "js_env allow_student_anonymous_discussion_topics defaults to false" do
      user_session(@teacher)
      get :edit, params: { :course_id => @course.id, :id => @topic.id }
      expect(assigns[:js_env][:allow_student_anonymous_discussion_topics]).to eq false
    end

    it "js_env allow_student_anonymous_discussion_topics is true when its only when course setting is true" do
      user_session(@teacher)
      @course.allow_student_anonymous_discussion_topics = true
      @course.save!
      get :edit, params: { :course_id => @course.id, :id => @topic.id }
      expect(assigns[:js_env][:allow_student_anonymous_discussion_topics]).to eq true
    end

    context 'conditional-release' do
      before do
        user_session(@teacher)
      end

      it 'includes environment variables if enabled' do
        allow(ConditionalRelease::Service).to receive(:enabled_in_context?).and_return(true)
        allow(ConditionalRelease::Service).to receive(:env_for).and_return({ dummy: 'value' })
        get :edit, params: { course_id: @course.id, id: @topic.id }
        expect(response).to be_successful
        expect(controller.js_env[:dummy]).to eq 'value'
      end

      it 'does not include environment variables when disabled' do
        allow(ConditionalRelease::Service).to receive(:enabled_in_context?).and_return(false)
        allow(ConditionalRelease::Service).to receive(:env_for).and_return({ dummy: 'value' })
        get :edit, params: { course_id: @course.id, id: @topic.id }
        expect(response).to be_successful
        expect(controller.js_env).not_to have_key :dummy
      end
    end

    context 'usage rights - teacher' do
      before { user_session(@teacher) }

      before :once do
        attachment_model
        @topic_with_file = @course.discussion_topics.create!(title: "some topic", attachment: @attachment)
      end

      shared_examples_for 'no usage rights returned' do
        it 'does not return usage rights on discussion topic attachment' do
          get :edit, params: { course_id: @course.id, id: @topic_with_file.id }
          expect(assigns[:js_env][:DISCUSSION_TOPIC][:ATTRIBUTES]['attachments'][0]).not_to have_key('usage_rights')
        end
      end

      shared_examples_for 'usage rights returned' do
        it 'returns usage rights on discussion topic attachment' do
          get :edit, params: { course_id: @course.id, id: @topic_with_file.id }
          expect(assigns[:js_env][:DISCUSSION_TOPIC][:ATTRIBUTES]['attachments'][0]).to have_key('usage_rights')
        end
      end

      context 'with usage_rights_discussion_topics disabled' do
        before { @course.root_account.disable_feature!(:usage_rights_discussion_topics) }

        context 'enabled on course' do
          before { @course.update!(usage_rights_required: true) }

          include_examples 'no usage rights returned'
        end

        context 'disabled on course' do
          before { @course.update!(usage_rights_required: false) }

          include_examples 'no usage rights returned'
        end
      end

      context 'with usage_rights_discussion_topics enabled' do
        before { @course.root_account.enable_feature!(:usage_rights_discussion_topics) }

        context 'enabled on course' do
          before { @course.update!(usage_rights_required: true) }

          include_examples 'usage rights returned'
        end

        context 'disabled on course' do
          before { @course.update!(usage_rights_required: false) }

          include_examples 'no usage rights returned'
        end
      end
    end
  end

  context 'student planner' do
    before do
      course_topic
    end

    it 'creates a topic with a todo date' do
      user_session(@teacher)
      todo_date = 1.day.from_now.in_time_zone('America/New_York')
      post 'create', params: { course_id: @course.id, todo_date: todo_date, title: 'Discussion 1' }, format: 'json'
      expect(JSON.parse(response.body)['todo_date']).to eq todo_date.in_time_zone('UTC').iso8601
    end

    it 'updates a topic with a todo date' do
      user_session(@teacher)
      todo_date = 1.day.from_now.in_time_zone('America/New_York')
      put 'update', params: { course_id: @course.id, topic_id: @topic.id, todo_date: todo_date.iso8601(6) }, format: 'json'
      expect(@topic.reload.todo_date).to eq todo_date
    end

    it 'removes a todo date from a topic' do
      user_session(@teacher)
      @topic.update(todo_date: 1.day.from_now.in_time_zone('America/New_York'))
      put 'update', params: { course_id: @course.id, topic_id: @topic.id, todo_date: nil }, format: 'json'
      expect(@topic.reload.todo_date).to be nil
    end

    it 'does not allow a student to update the to-do date' do
      user_session(@student)
      put 'update', params: { course_id: @course.id, topic_id: @topic.id, todo_date: 1.day.from_now }, format: 'json'
      expect(@topic.reload.todo_date).to eq nil
    end

    it 'does not allow a todo date on a graded topic' do
      user_session(@teacher)
      assign = @course.assignments.create!(title: 'Graded Topic 1', submission_types: 'discussion_topic')
      topic = assign.discussion_topic
      put 'update', params: { course_id: @course.id, topic_id: topic.id, todo_date: 1.day.from_now }, format: 'json'
      expect(response.code).to eq '400'
    end

    it 'does not allow changing a topic to graded and adding a todo date' do
      user_session(@teacher)
      put 'update', params: { course_id: @course.id, topic_id: @topic.id, todo_date: 1.day.from_now,
                              assignment: { submission_types: ['discussion_topic'], name: 'Graded Topic 1' } }, format: 'json'
      expect(response.code).to eq '400'
    end

    it 'allows a todo date when changing a topic from graded to ungraded' do
      user_session(@teacher)
      todo_date = 1.day.from_now
      assign = @course.assignments.create!(title: 'Graded Topic 1', submission_types: 'discussion_topic')
      topic = assign.discussion_topic
      put 'update', params: { course_id: @course.id, topic_id: topic.id, todo_date: todo_date.iso8601(6),
                              assignment: { set_assignment: false, name: 'Graded Topic 1' } }, format: 'json'
      expect(response.code).to eq '200'
      expect(topic.reload.assignment).to be nil
      expect(topic.todo_date).to eq todo_date
    end

    it 'removes an existing todo date when changing a topic from ungraded to graded' do
      user_session(@teacher)
      @topic.update(todo_date: 1.day.from_now)
      put 'update', params: { course_id: @course.id, topic_id: @topic.id,
                              assignment: { submission_types: ['discussion_topic'], name: 'Graded Topic 1' } }, format: 'json'
      expect(response.code).to eq '200'
      expect(@topic.reload.assignment).to be_truthy
      expect(@topic.todo_date).to be nil
    end
  end

  describe "GET 'public_feed.atom'" do
    before(:once) do
      course_topic
    end

    it "requires authorization" do
      get 'public_feed', params: { :feed_code => @course.feed_code + 'x' }, :format => 'atom'
      expect(assigns[:problem]).to eql("The verification code is invalid.")
    end

    it "includes absolute path for rel='self' link" do
      get 'public_feed', params: { :feed_code => @course.feed_code }, :format => 'atom'
      feed = Atom::Feed.load_feed(response.body) rescue nil
      expect(feed).not_to be_nil
      expect(feed.links.first.rel).to match(/self/)
      expect(feed.links.first.href).to match(%r{http://})
    end

    it "does not include entries in an anonymous feed" do
      get 'public_feed', params: { :feed_code => @course.feed_code }, :format => 'atom'
      feed = Atom::Feed.load_feed(response.body) rescue nil
      expect(feed).not_to be_nil
      expect(feed.entries).to be_empty
    end

    it "includes an author for each entry with an enrollment feed" do
      get 'public_feed', params: { :feed_code => @course.teacher_enrollments.first.feed_code }, :format => 'atom'
      feed = Atom::Feed.load_feed(response.body) rescue nil
      expect(feed).not_to be_nil
      expect(feed.entries).not_to be_empty
      expect(feed.entries.all? { |e| e.authors.present? }).to be_truthy
    end
  end

  describe 'POST create:' do
    before(:once) do
      Setting.set('enable_page_views', 'db')
    end

    before do
      allow(controller).to receive_messages(:form_authenticity_token => 'abc', :form_authenticity_param => 'abc')
    end

    def topic_params(course, opts = {})
      {
        :course_id => course.id,
        :title => 'Topic Title',
        :is_announcement => false,
        :discussion_type => 'side_comment',
        :require_initial_post => true,
        :podcast_has_student_posts => false,
        :delayed_post_at => '',
        :locked => true,
        :lock_at => '',
        :message => 'Message',
        :delay_posting => false,
        :threaded => false,
        :specific_sections => 'all'
      }.merge(opts)
    end

    def group_topic_params(group, opts = {})
      params = topic_params(group, opts)
      params[:group_id] = group.id
      params.delete(:course_id)
      params
    end

    def assignment_params(course, opts = {})
      course.require_assignment_group
      {
        assignment: {
          points_possible: 1,
          grading_type: 'points',
          assignment_group_id: @course.assignment_groups.first.id,
        }.merge(opts)
      }
    end

    describe "create_announcements_unlocked preference" do
      before do
        @teacher.create_announcements_unlocked(false)
        user_session(@teacher)
      end

      it 'is updated when creating new announcements' do
        post_params = topic_params(@course, { is_announcement: true, locked: false })
        post('create', params: post_params, format: :json)
        @teacher.reload
        expect(@teacher.create_announcements_unlocked?).to be_truthy
      end

      it 'is not updated when creating new discussions' do
        post_params = topic_params(@course, { is_announcement: false, locked: false })
        post('create', params: post_params, format: :json)
        @teacher.reload
        expect(@teacher.create_announcements_unlocked?).to be_falsey
      end
    end

    describe 'the new topic' do
      let(:topic) { assigns[:topic] }

      before do
        user_session(@student)
        post 'create', params: topic_params(@course), :format => :json
      end

      specify { expect(topic).to be_a DiscussionTopic }
      specify { expect(topic.user).to eq @user }
      specify { expect(topic.delayed_post_at).to be_nil }
      specify { expect(topic.lock_at).to be_nil }
      specify { expect(topic.workflow_state).to eq 'active' }
      specify { expect(topic.id).not_to be_nil }
      specify { expect(topic.title).to eq 'Topic Title' }
      specify { expect(topic.is_announcement).to be_falsey }
      specify { expect(topic.discussion_type).to eq 'side_comment' }
      specify { expect(topic.message).to eq 'Message' }
      specify { expect(topic.threaded).to be_falsey }
    end

    # TODO: fix this terribleness
    describe 'section specific discussions' do
      before do
        user_session(@teacher)
        @section1 = @course.course_sections.create!(name: "Section 1")
        @section2 = @course.course_sections.create!(name: "Section 2")
        @section3 = @course.course_sections.create!(name: "Section 3")
        @section4 = @course.course_sections.create!(name: "Section 4")
        @course.enroll_teacher(@teacher, section: @section1, allow_multiple_enrollments: true).accept!
        @course.enroll_teacher(@teacher, section: @section2, allow_multiple_enrollments: true).accept!
        Enrollment.limit_privileges_to_course_section!(@course, @teacher, true)
      end

      it 'creates an announcement with sections' do
        post 'create',
             params: topic_params(@course, { is_announcement: true, specific_sections: @section1.id.to_s }),
             :format => :json
        expect(response).to be_successful
        expect(DiscussionTopic.last.course_sections.first).to eq @section1
        expect(DiscussionTopicSectionVisibility.count).to eq 1
      end

      it 'section-specific-teachers can create course-wide discussions' do
        old_count = DiscussionTopic.count
        post 'create',
             params: topic_params(@course, { is_announcement: true }),
             :format => :json
        expect(response).to be_successful
        expect(DiscussionTopic.count).to eq old_count + 1
        expect(DiscussionTopic.last.is_section_specific).to be_falsey
      end

      it 'section-specfic-teachers cannot create wrong-section discussions' do
        old_count = DiscussionTopic.count
        post 'create',
             params: topic_params(@course, { is_announcement: true, specific_sections: @section3.id.to_s }),
             :format => :json
        expect(response).to have_http_status 400
        expect(DiscussionTopic.count).to eq old_count
      end

      it 'admins can see section-specific discussions' do
        admin = account_admin_user(account: @course.root_account, role: admin_role, active_user: true)
        user_session(admin)
        topic = @course.discussion_topics.create!
        topic.is_section_specific = true
        topic.course_sections << @section1
        topic.save!
        get 'index', params: { :course_id => @course.id }, :format => :json
        expect(response).to be_successful
        expect(assigns[:topics].length).to eq(1)
      end

      it 'admins can create section-specific discussions' do
        admin = account_admin_user(account: @course.root_account, role: admin_role, active_user: true)
        user_session(admin)
        post 'create',
             params: topic_params(@course, { is_announcement: true, specific_sections: @section1.id.to_s }),
             :format => :json
        expect(response).to be_successful
        expect(DiscussionTopic.last.course_sections.first).to eq @section1
      end

      it 'creates a discussion with sections' do
        post 'create',
             params: topic_params(@course, { specific_sections: @section1.id.to_s }), :format => :json
        expect(response).to be_successful
        expect(DiscussionTopic.last.course_sections.first).to eq @section1
        expect(DiscussionTopicSectionVisibility.count).to eq 1
      end

      it 'does not allow creation of group discussions that are section specific' do
        @group_category = @course.group_categories.create(:name => 'gc')
        @group = @course.groups.create!(:group_category => @group_category)
        post 'create',
             params: group_topic_params(@group, { specific_sections: @section1.id.to_s }), :format => :json
        expect(response).to have_http_status 400
        expect(DiscussionTopic.count).to eq 0
        expect(DiscussionTopicSectionVisibility.count).to eq 0
      end

      # Note that this is different then group discussions. This is the
      # "This is a Group Discussion" checkbox on a course discussion edit page,
      # whereas that one is creating a discussion in a group page.
      it 'does not allow creation of discussions with groups that are section specific' do
        @group_category = @course.group_categories.create(:name => 'gc')
        @group = @course.groups.create!(:group_category => @group_category)
        param_overrides = {
          specific_sections: "#{@section1.id},#{@section2.id}",
          group_category_id: @group_category.id,
        }
        post('create', params: topic_params(@course, param_overrides), format: :json)
        expect(response).to have_http_status 400
        expect(DiscussionTopic.count).to eq 0
        expect(DiscussionTopicSectionVisibility.count).to eq 0
      end

      it 'does not allow creation of graded discussions that are section specific' do
        obj_params = topic_params(@course, { specific_sections: @section1.id.to_s })
                     .merge(assignment_params(@course))
        expect(DiscussionTopic.count).to eq 0
        post('create', params: obj_params, format: :json)
        expect(response).to have_http_status 422
        expect(DiscussionTopic.count).to eq 0
        expect(DiscussionTopicSectionVisibility.count).to eq 0
      end

      it 'does not allow creation of disuccions to sections that are not visible to the user' do
        # This teacher does not have permissino for section 3 and 4
        sections = [@section1.id, @section2.id, @section3.id, @section4.id].join(",")
        post 'create', params: topic_params(@course, { specific_sections: sections }), :format => :json
        expect(response).to have_http_status 400
        expect(DiscussionTopic.count).to eq 0
        expect(DiscussionTopicSectionVisibility.count).to eq 0
      end
    end

    it "requires authorization to create a discussion" do
      @course.update_attribute(:is_public, true)
      post 'create', params: topic_params(@course, { is_announcement: false }), :format => :json
      assert_unauthorized
    end

    it "requires authorization to create an announcement" do
      @course.update_attribute(:is_public, true)
      post 'create', params: topic_params(@course, { is_announcement: true }), :format => :json
      assert_unauthorized
    end

    it 'logs an asset access record for the discussion topic' do
      user_session(@student)
      post 'create', params: topic_params(@course), :format => :json
      accessed_asset = assigns[:accessed_asset]
      expect(accessed_asset[:category]).to eq 'topics'
      expect(accessed_asset[:level]).to eq 'participate'
    end

    it 'creates an announcement that is locked by default' do
      user_session(@teacher)
      params = topic_params(@course, { is_announcement: true })
      params.delete(:locked)
      post('create', params: params, format: :json)
      expect(response).to be_successful
      expect(DiscussionTopic.last.locked).to be_truthy
    end

    it 'creates a discussion topic that is not locked by default' do
      user_session(@teacher)
      params = topic_params(@course, { is_announcement: false })
      params.delete(:locked)
      post('create', params: params, format: :json)
      expect(response).to be_successful
      expect(DiscussionTopic.last.locked).to be_falsy
    end

    it 'registers a page view' do
      user_session(@student)
      post 'create', params: topic_params(@course), :format => :json
      page_view = assigns[:page_view]
      expect(page_view).not_to be_nil
      expect(page_view.http_method).to eq 'post'
      expect(page_view.url).to match %r{^http://test\.host/api/v1/courses/\d+/discussion_topics}
      expect(page_view.participated).to be_truthy
    end

    it 'does not dispatch assignment created notification for unpublished graded topics' do
      notification = Notification.create(:name => "Assignment Created")
      obj_params = topic_params(@course).merge(assignment_params(@course))
      user_session(@teacher)
      post 'create', params: obj_params, :format => :json
      json = JSON.parse response.body
      topic = DiscussionTopic.find(json['id'])
      expect(topic).to be_unpublished
      expect(topic.assignment).to be_unpublished
      expect(@student.recent_stream_items.map { |item| item.data['notification_id'] }).not_to include notification.id
    end

    it 'does not dispatch new topic notification when hidden by selective release' do
      Notification.create(name: 'New Discussion Topic', category: 'TestImmediately')
      @student.communication_channels.create!(path: 'student@example.com') { |cc| cc.workflow_state = 'active' }
      new_section = @course.course_sections.create!
      obj_params = topic_params(@course, published: true).merge(assignment_params(@course, only_visible_to_overrides: true, assignment_overrides: [{ course_section_id: new_section.id }]))
      user_session(@teacher)
      post 'create', params: obj_params, :format => :json
      json = JSON.parse response.body
      topic = DiscussionTopic.find(json['id'])
      expect(topic).to be_published
      expect(topic.assignment).to be_published
      expect(@student.email_channel.messages).to be_empty
      expect(@student.recent_stream_items.map(&:data)).not_to include topic
    end

    it 'does dispatch new topic notification when not hidden' do
      Notification.create(name: 'New Discussion Topic', category: 'TestImmediately')
      @student.communication_channels.create!(path: 'student@example.com') { |cc| cc.workflow_state = 'active' }
      obj_params = topic_params(@course, published: true)
      user_session(@teacher)
      post 'create', params: obj_params, :format => :json
      json = JSON.parse response.body
      topic = DiscussionTopic.find(json['id'])
      expect(topic).to be_published
      expect(@student.email_channel.messages.map(&:context)).to include(topic)
    end

    it 'does dispatch new topic notification when published' do
      Notification.create(name: 'New Discussion Topic', category: 'TestImmediately')
      @student.communication_channels.create!(path: 'student@example.com') { |cc| cc.workflow_state = 'active' }
      obj_params = topic_params(@course, published: false)
      user_session(@teacher)
      post 'create', params: obj_params, :format => :json

      json = JSON.parse response.body
      topic = DiscussionTopic.find(json['id'])
      expect(@student.email_channel.messages).to be_empty

      put 'update', params: { course_id: @course.id, topic_id: topic.id, title: 'Updated Topic', published: true }, format: 'json'
      expect(@student.email_channel.messages.map(&:context)).to include(topic)
    end

    it 'dispatches an assignment stream item with the correct title' do
      notification = Notification.create(:name => "Assignment Created")
      obj_params = topic_params(@course)
                   .merge(assignment_params(@course))
                   .merge({ published: true })
      user_session(@teacher)
      post 'create', params: obj_params, :format => :json
      si = @student.recent_stream_items.detect do |item|
        item.data['notification_id'] == notification.id
      end
      expect(si.data['subject']).to eq "Assignment Created - #{obj_params[:title]}, #{@course.name}"
    end

    it 'does not allow for anonymous peer review assignment' do
      obj_params = topic_params(@course).merge(assignment_params(@course))
      obj_params[:assignment][:anonymous_peer_reviews] = true
      user_session(@teacher)
      post 'create', params: obj_params, :format => :json
      json = JSON.parse response.body
      expect(json['assignment']['anonymous_peer_reviews']).to be_falsey
    end

    context 'usage rights - student' do
      let(:data) { fixture_file_upload("docs/txt.txt", "text/plain", true) }

      before { user_session(@student) }

      shared_examples_for 'no usage rights set' do
        it 'does not return usage rights on discussion topic attachment' do
          post 'create', params: topic_params(@course, attachment: data), :format => :json
          expect(Attachment.last.reload.usage_rights).to be_nil
        end
      end

      shared_examples_for 'usage rights set' do
        it 'returns usage rights on discussion topic attachment' do
          post 'create', params: topic_params(@course, attachment: data), :format => :json
          expect(Attachment.last.reload.usage_rights).not_to be_nil
        end
      end

      context 'with usage_rights_discussion_topics disabled' do
        before { @course.root_account.disable_feature!(:usage_rights_discussion_topics) }

        context 'enabled on course' do
          before { @course.update!(usage_rights_required: true) }

          include_examples 'no usage rights set'
        end

        context 'disabled on course' do
          before { @course.update!(usage_rights_required: false) }

          include_examples 'no usage rights set'
        end
      end

      context 'with usage_rights_discussion_topics enabled' do
        before { @course.root_account.enable_feature!(:usage_rights_discussion_topics) }

        context 'enabled on course' do
          before { @course.update!(usage_rights_required: true) }

          include_examples 'usage rights set'
        end

        context 'disabled on course' do
          before { @course.update!(usage_rights_required: false) }

          include_examples 'no usage rights set'
        end
      end
    end
  end

  describe "PUT: update" do
    before(:once) do
      @topic = DiscussionTopic.create!(context: @course, title: 'Test Topic',
                                       delayed_post_at: '2013-01-01T00:00:00UTC', lock_at: '2013-01-02T00:00:00UTC')
    end

    before do
      user_session(@teacher)
    end

    describe "create_announcements_unlocked preference" do
      before do
        @teacher.create_announcements_unlocked(false)
        user_session(@teacher)
      end

      it 'is not updated when updating an existing announcements' do
        topic = Announcement.create!(
          context: @course,
          title: 'Test Announcement',
          message: 'Foo',
          locked: 'true'
        )
        put_params = { course_id: @course.id, topic_id: topic.id, locked: false }
        put('update', params: put_params)
        @teacher.reload
        expect(@teacher.create_announcements_unlocked?).to be_falsey
      end

      it 'is not updated when creating an existing discussions' do
        topic = DiscussionTopic.create!(
          context: @course,
          title: 'Test Topic',
          message: 'Foo',
          locked: 'true'
        )
        put_params = { course_id: @course.id, topic_id: topic.id, locked: false }
        put('update', params: put_params)
        @teacher.reload
        expect(@teacher.create_announcements_unlocked?).to be_falsey
      end
    end

    it 'does not allow setting specific sections for group discussions' do
      user_session(@teacher)
      section1 = @course.course_sections.create!(name: "Section 1")
      section2 = @course.course_sections.create!(name: "Section 2")
      @course.enroll_teacher(@teacher, section: section1, allow_multiple_enrollments: true).accept(true)
      @course.enroll_teacher(@teacher, section: section2, allow_multiple_enrollments: true).accept(true)

      group_category = @course.group_categories.create(:name => 'gc')
      group = @course.groups.create!(:group_category => group_category)
      topic = DiscussionTopic.create!(context: group, title: 'Test Topic',
                                      delayed_post_at: '2013-01-01T00:00:00UTC', lock_at: '2013-01-02T00:00:00UTC')
      put('update', params: {
            id: topic.id,
            group_id: group.id,
            topic_id: topic.id,
            specific_sections: section2.id,
            title: 'Updated Topic',
          })
      expect(response).to have_http_status 422
      expect(DiscussionTopic.count).to eq 2
      expect(DiscussionTopicSectionVisibility.count).to eq 0
    end

    it "does not allow updating a section specific announcement you do not have visibilities for" do
      user_session(@teacher)
      section1 = @course.course_sections.create!(name: "Section 1")
      section2 = @course.course_sections.create!(name: "Section 2")
      @course.enroll_teacher(@teacher, section: section1, allow_multiple_enrollments: true).accept!
      Enrollment.limit_privileges_to_course_section!(@course, @teacher, true)
      ann = @course.announcements.create!(message: "testing", is_section_specific: true, course_sections: [section2])
      ann.save!

      put('update', params: {
            course_id: @course.id,
            topic_id: ann.id,
            specific_sections: section1.id,
            title: 'Updated Topic',
          })
      expect(response).to have_http_status 400
    end

    it "Allows an admin to update a section-specific discussion" do
      account = @course.root_account
      section = @course.course_sections.create!(name: "Section")
      admin = account_admin_user(account: account, role: admin_role, active_user: true)
      user_session(admin)
      topic = @course.discussion_topics.create!(title: "foo", message: "bar", user: @teacher)
      put('update', params: {
            course_id: @course.id,
            topic_id: topic.id,
            specific_sections: section.id,
            title: "foobers"
          })
      expect(response).to have_http_status 200
    end

    it "triggers module progression recalculation if needed after changing sections" do
      @course.course_sections.create!(name: "Section")
      section2 = @course.course_sections.create!(name: "Section2")
      topic = @course.discussion_topics.create!(title: "foo", message: "bar", user: @teacher)
      mod = @course.context_modules.create!
      tag = mod.add_item({ :id => topic.id, :type => 'discussion_topic' })
      mod.completion_requirements = { tag.id => { :type => 'must_view' } }
      mod.save!
      prog = mod.evaluate_for(@student)
      expect(prog).to be_unlocked

      user_session(@teacher)
      put 'update', params: { course_id: @course.id, topic_id: topic.id, specific_sections: section2.id }
      expect(response).to be_successful

      expect(prog.reload).to be_completed
    end

    it "triggers module progression recalculation if undoing section specificness" do
      @course.course_sections.create!(name: "Section")
      section2 = @course.course_sections.create!(name: "Section2")
      topic = @course.discussion_topics.create!(title: "foo", message: "bar", user: @teacher,
                                                is_section_specific: true, course_sections: [section2])
      mod = @course.context_modules.create!
      tag = mod.add_item({ :id => topic.id, :type => 'discussion_topic' })
      mod.completion_requirements = { tag.id => { :type => 'must_view' } }

      user_session(@teacher)
      expect_any_instantiation_of(mod).to receive(:invalidate_progressions)
      put 'update', params: { course_id: @course.id, topic_id: topic.id, specific_sections: 'all' }
      expect(response).to be_successful
    end

    it "can turn graded topic into ungraded section-specific topic in one edit" do
      user_session(@teacher)
      assign = @course.assignments.create!(title: 'Graded Topic 1', submission_types: 'discussion_topic')
      section1 = @course.course_sections.create!(name: "Section 1")
      @course.course_sections.create!(name: "Section 2")
      topic = assign.discussion_topic
      put('update', params: {
            course_id: @course.id,
            topic_id: topic.id,
            assignment: { set_assignment: "0" },
            specific_sections: section1.id
          })
      expect(response).to have_http_status 200
      topic.reload
      expect(topic.assignment).to be_nil
    end

    it "does not clear lock_at if locked is not changed" do
      put('update', params: { course_id: @course.id, topic_id: @topic.id,
                              title: 'Updated Topic',
                              lock_at: @topic.lock_at, delayed_post_at: @topic.delayed_post_at,
                              locked: false })
      expect(response).to have_http_status 200
      expect(@topic.reload).not_to be_locked
      expect(@topic.lock_at).not_to be_nil
    end

    it "is able to turn off locked and delayed_post_at date in same request" do
      @topic.delayed_post_at = '2013-01-02T00:00:00UTC'
      @topic.locked = true
      @topic.save!
      put('update', params: { course_id: @course.id, topic_id: @topic.id,
                              title: 'Updated Topic',
                              locked: false,
                              delayed_post_at: nil })
      expect(response).to have_http_status 200
      expect(assigns[:topic].title).to eq 'Updated Topic'
      expect(assigns[:topic].locked).to eq false
      expect(assigns[:topic].delayed_post_at).to be_nil
      expect(@topic.reload).not_to be_locked
      expect(@topic.delayed_post_at).to be_nil
    end

    it "is able to turn on locked and delayed_post_at date in same request" do
      @topic.delayed_post_at = nil
      @topic.locked = false
      @topic.save!
      delayed_post_time = Time.new(2018, 4, 15)
      put('update', params: { course_id: @course.id, topic_id: @topic.id,
                              title: 'Updated Topic',
                              locked: true,
                              delayed_post_at: delayed_post_time.to_s })
      expect(response).to have_http_status 200
      expect(assigns[:topic].title).to eq 'Updated Topic'
      expect(assigns[:topic].locked).to eq true
      expect(assigns[:topic].delayed_post_at.year).to eq 2018
      expect(assigns[:topic].delayed_post_at.month).to eq 4
      expect(@topic.reload).to be_locked
      expect(@topic.delayed_post_at.year).to eq 2018
      expect(@topic.delayed_post_at.month).to eq 4
    end

    it "does not change the editor if only pinned was changed" do
      put('update', params: { course_id: @course.id, topic_id: @topic.id, pinned: '1' }, format: 'json')
      @topic.reload
      expect(@topic.pinned).to be_truthy
      expect(@topic.editor).to_not eq @teacher
    end

    it "does not clear delayed_post_at if published is not changed" do
      @topic.workflow_state = 'post_delayed'
      @topic.save!
      put('update', params: { course_id: @course.id, topic_id: @topic.id,
                              title: 'Updated Topic',
                              lock_at: @topic.lock_at, delayed_post_at: @topic.delayed_post_at,
                              published: false })
      expect(@topic.reload).not_to be_published
      expect(@topic.delayed_post_at).not_to be_nil
    end

    it "unlocks discussions with a lock_at attribute if lock state changes" do
      @topic.lock!
      put('update', params: { course_id: @course.id, topic_id: @topic.id,
                              title: 'Updated Topic',
                              lock_at: @topic.lock_at, delayed_post_at: @topic.delayed_post_at,
                              locked: false })

      expect(@topic.reload).not_to be_locked
      expect(@topic.lock_at).to be_nil
    end

    it "sets workflow to post_delayed when delayed_post_at and lock_at are in the future" do
      put(:update, params: { course_id: @course.id, topic_id: @topic.id,
                             title: 'Updated topic', delayed_post_at: Time.zone.now + 5.days })
      expect(@topic.reload).to be_post_delayed
    end

    it "does not clear lock_at if lock state hasn't changed" do
      put('update', params: { course_id: @course.id, topic_id: @topic.id,
                              title: 'Updated Topic', lock_at: @topic.lock_at,
                              locked: true })
      expect(@topic.reload).to be_locked
      expect(@topic.lock_at).not_to be_nil
    end

    it "sets draft state on discussions with delayed_post_at" do
      put('update', params: { course_id: @course.id, topic_id: @topic.id,
                              title: 'Updated Topic',
                              lock_at: @topic.lock_at, delayed_post_at: @topic.delayed_post_at,
                              published: false })

      expect(@topic.reload).not_to be_published
    end

    it "attaches a file and handles duplicates" do
      data = fixture_file_upload("docs/txt.txt", "text/plain", true)
      attachment_model :context => @course, :uploaded_data => data, :folder => Folder.unfiled_folder(@course)
      put 'update', params: { course_id: @course.id, topic_id: @topic.id, attachment: data }, format: 'json'
      expect(response).to be_successful
      json = JSON.parse(response.body)
      new_file = Attachment.find(json['attachments'][0]['id'])
      expect(new_file.display_name).to match(/txt-[0-9]+\.txt/)
      expect(json['attachments'][0]['display_name']).to eq new_file.display_name
    end

    it "deletes attachments" do
      attachment = @topic.attachment = attachment_model(context: @course)
      @topic.lock_at = Time.now + 1.week
      @topic.unlock_at = Time.now - 1.week
      @topic.save!
      @topic.unlock!
      put('update', params: { course_id: @course.id, topic_id: @topic.id, remove_attachment: '1' }, format: 'json')
      expect(response).to be_successful

      expect(@topic.reload.attachment).to be_nil
      expect(attachment.reload).to be_deleted
    end

    it "uses inst-fs if it is enabled" do
      allow(InstFS).to receive(:enabled?).and_return(true)
      uuid = "1234-abcd"
      allow(InstFS).to receive(:direct_upload).and_return(uuid)

      data = fixture_file_upload("docs/txt.txt", "text/plain", true)
      attachment_model :context => @course, :uploaded_data => data, :folder => Folder.unfiled_folder(@course)
      put 'update', params: { course_id: @course.id, topic_id: @topic.id, attachment: data }, format: 'json'

      @topic.reload
      expect(@topic.attachment.instfs_uuid).to eq(uuid)
    end

    it "editing section-specific topic to not-specific should clear out visibilities" do
      @announcement = Announcement.create!(context: @course, title: 'Test Announcement',
                                           message: 'Foo', delayed_post_at: '2013-01-01T00:00:00UTC',
                                           lock_at: '2013-01-02T00:00:00UTC')
      section1 = @course.course_sections.create!(name: "Section 1")
      section2 = @course.course_sections.create!(name: "Section 2")
      @announcement.is_section_specific = true
      @announcement.course_sections = [section1, section2]
      @announcement.save!
      put('update', params: { course_id: @course.id, topic_id: @announcement.id, message: 'Foobar',
                              is_announcement: true, specific_sections: "all" })
      expect(response).to be_successful
      visibilities = DiscussionTopicSectionVisibility.active
                                                     .where(:discussion_topic_id => @announcement.id)
      expect(visibilities.empty?).to eq true
    end

    it 'does not remove specific sections if key is missing in PUT json' do
      @announcement = Announcement.create!(context: @course, title: 'Test Announcement',
                                           message: 'Foo', delayed_post_at: '2013-01-01T00:00:00UTC',
                                           lock_at: '2013-01-02T00:00:00UTC')
      section1 = @course.course_sections.create!(name: "Section 1")
      section2 = @course.course_sections.create!(name: "Section 2")
      @announcement.is_section_specific = true
      @announcement.course_sections = [section1, section2]
      @announcement.save!

      put('update', params: { course_id: @course.id, topic_id: @announcement.id, message: 'Foobar',
                              is_announcement: true })
      expect(response).to be_successful
      visibilities = DiscussionTopicSectionVisibility.active
                                                     .where(:discussion_topic_id => @announcement.id)
      expect(visibilities.count).to eq 2
    end
  end

  describe "POST 'reorder'" do
    it "reorders pinned topics" do
      user_session(@teacher)

      # add noise
      @course.announcements.create!(message: 'asdf')
      course_topic

      topics = Array.new(3) { course_topic(pinned: true) }
      expect(topics.map(&:position)).to eq [1, 2, 3]
      t1, t2, _ = topics
      post 'reorder', params: { :course_id => @course.id, :order => "#{t2.id},#{t1.id}" }, :format => 'json'
      expect(response).to be_successful
      topics.each(&:reload)
      expect(topics.map(&:position)).to eq [2, 1, 3]
    end
  end
end
