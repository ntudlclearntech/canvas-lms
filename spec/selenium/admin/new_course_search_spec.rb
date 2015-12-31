require File.expand_path(File.dirname(__FILE__) + '/../common')

describe "new account course search" do
  include_context "in-process server selenium tests"

  before :once do
    account_model
    @account.enable_feature!(:course_user_search)
    account_admin_user(:account => @account, :active_all => true)
  end

  before do
    user_session(@user)
  end

  def get_rows
    ff('.courses-list [role=row]')
  end

  it "should not show the courses tab without permission" do
    @account.role_overrides.create! :role => admin_role, :permission => 'read_course_list', :enabled => false

    get "/accounts/#{@account.id}"

    expect(f(".react-tabs > ul")).to_not include_text("Courses")
  end

  it "should hide courses without enrollments if checked" do
    empty_course = course(:account => @account, :course_name => "no enrollments")
    not_empty_course = course(:account => @account, :course_name => "yess enrollments", :active_all => true)
    student_in_course(:course => not_empty_course, :active_all => true)

    get "/accounts/#{@account.id}"

    expect(get_rows.count).to eq 2

    f('.course_search_bar input[type=checkbox]').click # hide anymore
    f('.course_search_bar button').click
    wait_for_ajaximations

    rows = get_rows
    expect(rows.count).to eq 1
    expect(rows.first).to include_text(not_empty_course.name)
    expect(rows.first).to_not include_text(empty_course.name)
  end

  it "should paginate" do
    11.times do |x|
      course(:account => @account, :course_name => "course #{x + 1}")
    end

    get "/accounts/#{@account.id}"

    expect(get_rows.count).to eq 10

    f(".load_more").click
    wait_for_ajaximations

    expect(get_rows.count).to eq 11
    expect(f(".load_more")).to be_nil
  end

  it "should search by term" do

    term = @account.enrollment_terms.create!(:name => "some term")
    term_course = course(:account => @account, :course_name => "term course")
    term_course.enrollment_term = term
    term_course.save!

    other_course = course(:account => @account, :course_name => "other course")

    get "/accounts/#{@account.id}"

    click_option(".course_search_bar select", term.name)
    f('.course_search_bar button').click
    wait_for_ajaximations

    rows = get_rows
    expect(rows.count).to eq 1
    expect(rows.first).to include_text(term_course.name)
  end

  it "should search by name" do
    match_course = course(:account => @account, :course_name => "course with a search term")
    not_match_course = course(:account => @account, :course_name => "diffrient cuorse")

    get "/accounts/#{@account.id}"

    f('.course_search_bar input[type=text]').send_keys('search')
    f('.course_search_bar button').click
    wait_for_ajaximations

    rows = get_rows
    expect(rows.count).to eq 1
    expect(rows.first).to include_text(match_course.name)
  end

  it "should show teachers" do
    course(:account => @account)
    user(:name => "some teacher")
    teacher_in_course(:course => @course, :user => @user)

    get "/accounts/#{@account.id}"

    user_link = get_rows.first.find("a.user_link")
    expect(user_link).to include_text(@user.name)
    expect(user_link['href']).to eq user_url(@user)
  end

  it "should sort courses by name by defualt" do
    2.times do |x|
      course(:account => @account, :course_name => "course #{x + 1}")
    end
    get "/accounts/#{@account.id}"

    first = ff('.courses-list .courseName')[0].text
    second = ff('.courses-list .courseName')[1].text

    expect(first).to eq "course 1"
    expect(second).to eq "course 2"
  end

  it "should sort courses by name in DESC order when clicking the label" do
    2.times do |x|
      course(:account => @account, :course_name => "course #{x + 1}")
    end
    get "/accounts/#{@account.id}"

    f('.coursesHeaderLink').click
    first = ff('.courses-list .courseName')[0].text
    second = ff('.courses-list .courseName')[1].text

    expect(first).to eq "course 2"
    expect(second).to eq "course 1"
  end

  it "should sort sis_course_id by id in DESC order when clicking the label" do
    2.times do |x|
      c = course(:account => @account, :course_name => "course #{x + 1}")
      c.sis_source_id = (x + 1).to_s
      c.save!
    end
    get "/accounts/#{@account.id}"

    f('.courseSIS').click
    first = ff('.courses-list .courseSIS')[0].text
    second = ff('.courses-list .courseSIS')[1].text

    expect(first).to eq "1"
    expect(second).to eq "2"
  end

  it "should sorts sis_course_id by id in ASC order when clicking the label twice" do
    2.times do |x|
      c = course(:account => @account, :course_name => "course #{x + 1}")
      c.sis_source_id = (x + 1).to_s
      c.save!
    end
    get "/accounts/#{@account.id}"

    f('.courseSIS').click
    f('.courseSIS').click
    first = ff('.courses-list .courseSIS')[0].text
    second = ff('.courses-list .courseSIS')[1].text

    expect(first).to eq "2"
    expect(second).to eq "1"
  end

  it "should sort teacher by display_name in DESC order when clicking the label" do
    2.times do |x|
      c = course(:account => @account, :course_name => "course #{x + 1}")
      u = user(:name => "teacher #{x+1}")
      teacher_in_course(:course => c, :user => u)
    end
    get "/accounts/#{@account.id}"

    f('.sortTeacherName').click
    first = ff('.courses-list .user_link')[0].text
    second = ff('.courses-list .user_link')[1].text

    expect(first).to eq "teacher 1"
    expect(second).to eq "teacher 2"
  end

  it "should sorts teacher by display_name in ASC order when clicking the label twice" do
    2.times do |x|
      c = course(:account => @account, :course_name => "course #{x + 1}")
      u = user(:name => "teacher #{x+1}")
      teacher_in_course(:course => c, :user => u)
    end
    get "/accounts/#{@account.id}"

    f('.sortTeacherName').click
    f('.sortTeacherName').click
    first = ff('.courses-list .user_link')[0].text
    second = ff('.courses-list .user_link')[1].text

    expect(first).to eq "teacher 2"
    expect(second).to eq "teacher 1"
  end

  it "should sort enrollments by total_students in DESC order when clicking the label" do

      c = course(:account => @account, :course_name => "course 1")
      u = user(:name => "user1")
      u2 = user(:name => "user2")
      student_in_course(:course => c, :user => u)
      student_in_course(:course => c, :user => u2)

      c = course(:account => @account, :course_name => "course 2")
      u = user(:name => "user1")
      u2 = user(:name => "user2")
      student_in_course(:course => c, :user => u)

    get "/accounts/#{@account.id}"

    f('.sortEnrollments').click
    first = ff('.courses-list .totalStudents')[0].text
    second = ff('.courses-list .totalStudents')[1].text

    expect(first).to eq "1"
    expect(second).to eq "2"
  end

  it "should sorts enrollments by total_students in ASC order when clicking the label twice" do
      c = course(:account => @account, :course_name => "course 1")
      u = user(:name => "user1")
      u2 = user(:name => "user2")
      student_in_course(:course => c, :user => u)
      student_in_course(:course => c, :user => u2)

      c = course(:account => @account, :course_name => "course 2")
      u = user(:name => "user1")
      u2 = user(:name => "user2")
      student_in_course(:course => c, :user => u)
    get "/accounts/#{@account.id}"

    f('.sortEnrollments').click
    f('.sortEnrollments').click
    first = ff('.courses-list .totalStudents')[0].text
    second = ff('.courses-list .totalStudents')[1].text

    expect(first).to eq "2"
    expect(second).to eq "1"
  end
end
