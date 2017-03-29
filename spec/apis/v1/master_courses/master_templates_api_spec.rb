require_relative '../../api_spec_helper'

describe MasterCourses::MasterTemplatesController, type: :request do
  def setup_template
    Account.default.enable_feature!(:master_courses)
    course_factory
    @template = MasterCourses::MasterTemplate.set_as_master_course(@course)
    account_admin_user(:active_all => true)
    @base_params = {:controller => 'master_courses/master_templates', :format => 'json',
      :course_id => @course.id.to_s, :template_id => 'default'}
  end

  describe "#show" do
    before :once do
      setup_template
      @url = "/api/v1/courses/#{@course.id}/blueprint_templates/default"
      @params = @base_params.merge(:action => 'show')
    end

    it "should require the feature flag" do
      Account.default.disable_feature!(:master_courses)
      api_call(:get, @url, @params, {}, {}, {:expected_status => 401})
    end

    it "should require authorization" do
      Account.default.role_overrides.create!(:role => admin_role, :permission => "manage_courses", :enabled => false)
      api_call(:get, @url, @params, {}, {}, {:expected_status => 401})
    end

    it "should let teachers in the master course view details" do
      course_with_teacher(:course => @course, :active_all => true)
      json = api_call(:get, @url, @params)
      expect(json['id']).to eq @template.id
    end

    it "should require am active template" do
      @template.destroy!
      api_call(:get, @url, @params, {}, {}, {:expected_status => 404})
    end

    it "should return stuff" do
      time = 2.days.ago
      @template.master_migrations.create!(:imports_completed_at => time, :workflow_state => 'completed')
      json = api_call(:get, @url, @params)
      expect(json['id']).to eq @template.id
      expect(json['course_id']).to eq @course.id
      expect(json['last_export_completed_at']).to eq time.iso8601
    end
  end

  describe "#associated_courses" do
    before :once do
      setup_template
      @url = "/api/v1/courses/#{@course.id}/blueprint_templates/default/associated_courses"
      @params = @base_params.merge(:action => 'associated_courses')
    end

    it "should get some data for associated courses" do
      term = Account.default.enrollment_terms.create!(:name => "termname")
      child_course1 = course_factory(:course_name => "immachildcourse1", :active_all => true)
      @teacher.update_attribute(:short_name, "displayname")
      child_course1.update_attributes(:sis_source_id => "sisid", :course_code => "shortname", :enrollment_term => term)
      child_course2 = course_factory(:course_name => "immachildcourse2")
      [child_course1, child_course2].each{|c| @template.add_child_course!(c)}

      json = api_call(:get, @url, @params)
      expect(json.count).to eq 2
      expect(json.map{|c| c['id']}).to match_array([child_course1.id, child_course2.id])
      course1_json = json.detect{|c| c['id'] == child_course1.id}
      expect(course1_json['name']).to eq child_course1.name
      expect(course1_json['course_code']).to eq child_course1.course_code
      expect(course1_json['term_name']).to eq term.name
      expect(course1_json['teachers'].first['display_name']).to eq @teacher.short_name
    end
  end

  describe "#update_associations" do
    before :once do
      setup_template
      @url = "/api/v1/courses/#{@course.id}/blueprint_templates/default/update_associations"
      @params = @base_params.merge(:action => 'update_associations')
    end

    it "should only add courses in the blueprint courses' account (or sub-accounts)" do
      sub1 = Account.default.sub_accounts.create!
      sub2 = Account.default.sub_accounts.create!
      @course.update_attribute(:account, sub1)

      other_course = course_factory(:account => sub2)

      json = api_call(:put, @url, @params, {:course_ids_to_add => [other_course.id]}, {}, {:expected_status => 400})
      expect(json['message']).to include("invalid courses")
    end

    it "should require account-level authorization" do
      course_with_teacher(:course => @course, :active_all => true)
      json = api_call(:put, @url, @params, {}, {}, {:expected_status => 401})
    end

    it "should require account-level blueprint permissions" do
      Account.default.role_overrides.create!(:role => admin_role, :permission => "manage_master_courses", :enabled => false)
      json = api_call(:put, @url, @params, {}, {}, {:expected_status => 401})
    end

    it "should not try to add other blueprint courses" do
      other_course = course_factory
      MasterCourses::MasterTemplate.set_as_master_course(other_course)

      json = api_call(:put, @url, @params, {:course_ids_to_add => [other_course.id]}, {}, {:expected_status => 400})
      expect(json['message']).to include("invalid courses")
    end

    it "should not try to add other blueprint-associated courses" do
      other_master_course = course_factory
      other_template = MasterCourses::MasterTemplate.set_as_master_course(other_master_course)
      other_course = course_factory
      other_template.add_child_course!(other_course)

      json = api_call(:put, @url, @params, {:course_ids_to_add => [other_course.id]}, {}, {:expected_status => 400})
      expect(json['message']).to include("cannot add courses already associated")
    end

    it "should skip existing associations" do
      other_course = course_factory
      @template.add_child_course!(other_course)

      @template.any_instantiation.expects(:add_child_course!).never
      api_call(:put, @url, @params, {:course_ids_to_add => [other_course.id]})
    end

    it "should be able to add and remove courses" do
      existing_child = course_factory
      existing_sub = @template.add_child_course!(existing_child)

      subaccount1 = Account.default.sub_accounts.create!
      subaccount2 = subaccount1.sub_accounts.create!
      c1 = course_factory(:account => subaccount1)
      c2 = course_factory(:account => subaccount2)

      api_call(:put, @url, @params, {:course_ids_to_add => [c1.id, c2.id], :course_ids_to_remove => existing_child.id})

      @template.reload
      expect(@template.child_subscriptions.active.pluck(:child_course_id)).to match_array([c1.id, c2.id])
    end
  end

  describe "#queue_migration" do
    before :once do
      setup_template
      @url = "/api/v1/courses/#{@course.id}/blueprint_templates/default/migrations"
      @params = @base_params.merge(:action => 'queue_migration')
      @child_course = course_factory
      @sub = @template.add_child_course!(@child_course)
    end

    it "should require some associated courses" do
      @sub.destroy! # deleted ones shouldn't count
      json = api_call(:post, @url, @params, {}, {}, {:expected_status => 400})
      expect(json['message']).to include("No associated courses")
    end

    it "should not allow double-queueing" do
      MasterCourses::MasterMigration.start_new_migration!(@template, @user)

      json = api_call(:post, @url, @params, {}, {}, {:expected_status => 400})
      expect(json['message']).to include("currently running")
    end

    it "should queue a master migration" do
      json = api_call(:post, @url, @params)
      migration = @template.master_migrations.find(json['id'])
      expect(migration).to be_queued
    end
  end

  describe "migrations show/index" do
    before :once do
      setup_template
      @child_course = Account.default.courses.create!
      @sub = @template.add_child_course!(@child_course)
      @migration = MasterCourses::MasterMigration.start_new_migration!(@template, @user)
    end

    it "should show a migration" do
      json = api_call(:get, "/api/v1/courses/#{@course.id}/blueprint_templates/default/migrations/#{@migration.id}",
        @base_params.merge(:action => 'migrations_show', :id => @migration.to_param))
      expect(json['workflow_state']).to eq 'queued'
    end

    it "should show migrations" do
      run_jobs
      expect(@migration.reload).to be_completed
      migration2 = MasterCourses::MasterMigration.start_new_migration!(@template, @user)

      json = api_call(:get, "/api/v1/courses/#{@course.id}/blueprint_templates/default/migrations", @base_params.merge(:action => 'migrations_index'))
      pairs = json.map{|hash| [hash['id'], hash['workflow_state']]}
      expect(pairs).to eq [[migration2.id, 'queued'], [@migration.id, 'completed']]
    end
  end

  describe "#restrict_item" do
    before :once do
      setup_template
      @url = "/api/v1/courses/#{@course.id}/blueprint_templates/default/restrict_item"
      @params = @base_params.merge(:action => 'restrict_item')
    end

    it "should be able to find all the (currently) supported types" do
      expect(@template.default_restrictions[:content]).to be_truthy

      assmt = @course.assignments.create!
      topic = @course.discussion_topics.create!(:message => "hi", :title => "discussion title")
      page = @course.wiki.wiki_pages.create!(:title => "wiki", :body => "ohai")
      quiz = @course.quizzes.create!
      file = @course.attachments.create!(:filename => 'blah', :uploaded_data => default_uploaded_data)
      tool = @course.context_external_tools.create!(:name => "new tool", :consumer_key => "key",
        :shared_secret => "secret", :custom_fields => {'a' => '1', 'b' => '2'}, :url => "http://www.example.com")

      type_pairs = {'assignment' => assmt, 'attachment' => file, 'discussion_topic' => topic,
        'external_tool' => tool, 'quiz' => quiz, 'wiki_page' => page}
      type_pairs.each do |content_type, obj|
        api_call(:put, @url, @params, {:content_type => content_type, :content_id => obj.id, :restricted => '1'}, {}, {:expected_status => 200})
        mc_tag = @template.content_tag_for(obj)
        expect(mc_tag.restrictions).to eq @template.default_restrictions
        expect(mc_tag.use_default_restrictions).to be_truthy
      end
    end

    it "should be able to set custom restrictions" do
      assmt = @course.assignments.create!
      api_call(:put, @url, @params, {:content_type => 'assignment', :content_id => assmt.id,
        :restricted => '1', :restrictions => {'content' => '1', 'points' => '1'}}, {}, {:expected_status => 200})

      mc_tag = @template.content_tag_for(assmt)
      expect(mc_tag.restrictions).to eq({:content => true, :points => true})
      expect(mc_tag.use_default_restrictions).to be_falsey
    end

    it "should validate custom restrictions" do
      assmt = @course.assignments.create!
      api_call(:put, @url, @params, {:content_type => 'assignment', :content_id => assmt.id,
        :restricted => '1', :restrictions => {'content' => '1', 'not_a_real_thing' => '1'}}, {}, {:expected_status => 400})
    end

    it "should be able to unset restrictions" do
      assmt = @course.assignments.create!
      mc_tag = @template.content_tag_for(assmt, {:restrictions => @template.default_restrictions, :use_default_restrictions => true})
      api_call(:put, @url, @params, {:content_type => 'assignment', :content_id => assmt.id,
        :restricted => '0'}, {}, {:expected_status => 200})
      mc_tag.reload
      expect(mc_tag.restrictions).to be_blank
      expect(mc_tag.use_default_restrictions).to be_falsey
    end
  end
end
