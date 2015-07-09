require File.expand_path(File.dirname(__FILE__) + '/helpers/assignments_common')
require File.expand_path(File.dirname(__FILE__) + '/helpers/discussions_common')

describe "discussion assignments" do
  include_examples "in-process server selenium tests"


  before (:each) do
    @domain_root_account = Account.default
    course_with_teacher_logged_in
  end

  context "created on the index page" do
    it "should create a discussion topic when created", priority: "1", test_id: 209964 do
      ag = @course.assignment_groups.create!(:name => "Stuff")
      get "/courses/#{@course.id}/assignments"
      build_assignment_with_type("Discussion", :assignment_group_id => ag.id, :name => "This discussion was created on the assignments page", :submit => true)
      expect_new_page_load { f("#section-tabs .discussions").click }
      expect(f('#open-discussions')).to include_text("This discussion was created on the assignments page")
    end
  end

  context "created with 'more options'" do
    it "should redirect to the discussion new page and maintain parameters", priority: "1", test_id: 209966 do
      ag = @course.assignment_groups.create!(:name => "Stuff")
      get "/courses/#{@course.id}/assignments"
      expect_new_page_load { build_assignment_with_type("Discussion", :assignment_group_id => ag.id, :name => "More options created discussion", :points => '30', :more_options => true)}
      #check the content of the discussion page for our set point value and name and the URL to make sure were in /discussions
      expect(driver.current_url).to include_text("discussion_topics/new?assignment_group_id=#{ag.id}&due_at=null&points_possible=30&title=More+options+created+discussion")
      expect(f('#discussion-title').attribute(:value)).to eq "More options created discussion"
      expect(f('#discussion_topic_assignment_points_possible').attribute(:value)).to eq "30"
    end
  end

  context "edited from the index page" do
    it "should update discussion when updated", priority: "2", test_id: 209967 do
      assign = @course.assignments.create!(:name => "Discuss!", :points_possible => "5", :submission_types => "discussion_topic")
      get "/courses/#{@course.id}/assignments"
      edit_assignment(assign.id, :name => 'Rediscuss!', :submit => true)
      expect(assign.reload.discussion_topic.title).to eq "Rediscuss!"
    end
  end

  context "edited with 'more options'" do
    it "should redirect to the discussion edit page and maintain parameters", priority: "2", test_id: 209968 do
      assign = @course.assignments.create!(:name => "Discuss!", :points_possible => "5", :submission_types => "discussion_topic")
      get "/courses/#{@course.id}/assignments"
      expect_new_page_load{ edit_assignment(assign.id, :name => "Rediscuss!", :points => "10", :more_options => true) }
      expect(f('#discussion-title').attribute(:value)).to eq "Rediscuss!"
      expect(f('#discussion_topic_assignment_points_possible').attribute(:value)).to eq "10"
    end
  end

  context "created with html in title" do
    it "should not render html in flash notice", priority: "2", test_id: 132616 do
      discussion_title = '<s>broken</s>'
      topic = create_discussion(discussion_title, 'threaded')
      get "/courses/#{@course.id}/discussion_topics/#{topic.id}"
      wait_for_ajaximations
      f('.announcement_cog').click
      fln('Delete').click
      driver.switch_to.alert.accept
      assert_flash_notice_message("#{discussion_title} deleted successfully")
    end
  end
end
