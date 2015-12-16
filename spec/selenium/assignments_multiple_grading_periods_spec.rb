require File.expand_path(File.dirname(__FILE__) + '/common')
require File.expand_path(File.dirname(__FILE__) + '/helpers/assignments_common')

describe "assignments index grading period filter" do
  include_context "in-process server selenium tests"

  before(:once) do
    course_with_teacher(:active_all => true, :account => @account, :mgp_flag_enabled => true,
                        :grading_periods => [:old, :current, :future])
    @assignments = []
    GradingPeriod.for(@course).sort_by(&:start_date).each do |grading_period|
      @assignments << @course.assignments.create!(:name => grading_period.title, :due_at => grading_period.start_date + 1.second)
    end
    @undated_assignment = @course.assignments.create!(:name => "Undated")
  end

  def select_grading_period(index)
    f("#grading_period_selector option[value=\"#{index}\"]").click
    wait_for_animations
  end

  it "filters assignments by grading period" do
    user_session @teacher
    get "/courses/#{@course.id}/assignments"

    select_grading_period "0"
    expect(ff("li.assignment:not(.hidden)").count).to eq 1
    expect(f("#assignment_#{@assignments[0].id}")).to be_displayed

    select_grading_period "1"
    expect(ff("li.assignment:not(.hidden)").count).to eq 1
    expect(f("#assignment_#{@assignments[1].id}")).to be_displayed

    select_grading_period "2"
    expect(ff("li.assignment:not(.hidden)").count).to eq 2
    expect(f("#assignment_#{@assignments[2].id}")).to be_displayed
    expect(f("#assignment_#{@undated_assignment.id}")).to be_displayed

    select_grading_period "all"
    expect(ff("li.assignment:not(.hidden)").count).to eq 4
  end

  it "retains the selected grading period in local storage" do
    user_session @teacher
    get "/courses/#{@course.id}/assignments"
    select_grading_period "1"

    get "/courses/#{@course.id}/assignments"
    expect(f("#grading_period_selector").attribute("value")).to eq "1"
    expect(f("#assignment_#{@assignments[0].id}")).not_to be_displayed
    expect(f("#assignment_#{@assignments[1].id}")).to be_displayed
  end

  context "VDD" do
    before(:once) do
      @vdd_assignment = @course.assignments.create! :name => "VDD", :due_at => 3.months.ago

      @other_section = @course.course_sections.create! :name => "other section"
      override = @vdd_assignment.assignment_overrides.build
      override.set = @other_section
      override.due_at_overridden = true
      override.due_at = 3.months.from_now
      override.save!
    end

    it "filters an assignment into all applicable grading periods for teachers" do
      user_session @teacher
      get "/courses/#{@course.id}/assignments"
      assignment_element = f("#assignment_#{@vdd_assignment.id}")
      select_grading_period "0"
      expect(assignment_element).to be_displayed
      select_grading_period "1"
      expect(assignment_element).not_to be_displayed
      select_grading_period "2"
      expect(assignment_element).to be_displayed
    end

    it "uses the applicable due date for students" do
      student_in_course :course => @course, :section => @other_section, :active_all => true
      user_session(@student)
      get "/courses/#{@course.id}/assignments"
      assignment_element = f("#assignment_#{@vdd_assignment.id}")
      select_grading_period "0"
      expect(assignment_element).not_to be_displayed
      select_grading_period "1"
      expect(assignment_element).not_to be_displayed
      select_grading_period "2"
      expect(assignment_element).to be_displayed
    end
  end
end
