require File.expand_path(File.dirname(__FILE__) + '/common')
require File.expand_path(File.dirname(__FILE__) + '/helpers/files_common')
require File.expand_path(File.dirname(__FILE__) + '/helpers/announcements_common')
require File.expand_path(File.dirname(__FILE__) + '/helpers/color_common')


describe 'dashcards' do
  include_context 'in-process server selenium tests'

  context 'as a student' do

    before do
      @course = course(active_all: true)
      course_with_student_logged_in(active_all: true)
      Account.default.enable_feature! :use_new_styles
    end

    it 'should show the toggle button for dashcard in new UI', priority: "1", test_id: 222506 do
      get '/'
      # verify features of new UI
      expect(f('#application.ic-app')).to be_present
      expect(f('.ic-app-header__main-navigation')).to be_present
      # verify the toggle switch is present
      expect(f('.ic-Super-toggle__switch')).to be_present
    end

    it 'should toggle dashboard based on the toggle switch', priority: "1", test_id: 222507 do
      get '/'
      expect(f('.ic-Super-toggle__switch')).to be_present
      # toggle switch to right
      f('.ic-Super-toggle__option--RIGHT').click
      expect(f('#dashboard-activity').text).to include('Recent Activity')
      # toggle switch to left
      f('.ic-Super-toggle__option--LEFT').click
      expect(f('.ic-DashboardCard__link')).to be_displayed
    end

    it 'should redirect to announcements index', priority: "1", test_id: 222509 do
      # Icon will not display unless there is an announcement.
      create_announcement
      get '/'

      f('a.announcements').click
      expect(driver.current_url).to include("/courses/#{@course.id}/announcements")
    end

    it 'should redirect to assignments index', priority: "1", test_id: 238637 do
      # Icon will not display unless there is an assignment.
      @course.assignments.create!(title: 'assignment 1', name: 'assignment 1')
      get '/'

      f('a.assignments').click
      expect(driver.current_url).to include("/courses/#{@course.id}/assignments")
    end

    it 'should redirect to discussions index', priority: "1", test_id: 238638 do
      # Icon will not display unless there is a discussion.
      @course.discussion_topics.create!(title: 'discussion 1', message: 'This is a message.')
      get '/'

      f('a.discussions').click
      expect(driver.current_url).to include("/courses/#{@course.id}/discussion_topics")
    end

    it 'should redirect to files index', priority: "1", test_id: 238639 do
      # Icon will not display unless there is a file.
      add_file(fixture_file_upload('files/example.pdf', 'application/pdf'), @course, 'example.pdf')
      get '/'

      f('a.files').click
      expect(driver.current_url).to include("/courses/#{@course.id}/files")
    end

    it 'should display color picker', priority: "1", test_id: 249122 do
      get '/'
      f('.ic-DashboardCard__header-button').click
      expect(f('.ColorPicker__Container')).to be_displayed
    end

    it 'should display dashcard icons for course contents', priority: "1", test_id: 222508 do
      # create discussion, announcement, discussion and files as these 4 icons need to be displayed
      @course.discussion_topics.create!(title: 'discussion 1', message: 'This is a message.')
      @course.assignments.create!(title: 'assignment 1', name: 'assignment 1')
      create_announcement
      add_file(fixture_file_upload('files/example.pdf', 'application/pdf'), @course, 'example.pdf')
      get '/'

      expect(f('a.announcements')).to be_present
      expect(f('a.assignments')).to be_present
      expect(f('a.discussions')).to be_present
      expect(f('a.files')).to be_present
    end

    context "course name and code display" do
      before :each do
        @course1 = course_model
        @course1.name = 'Test Course Test Course Test Course Test Course Test Course Test Course Test Course Test' \
                        'Course Test Course Test Course Test Course Test Course Test Course Test Course Test Course'\
                        'Test Course Test Course Test Course Test Course Te'
        @course1.offer!
        @course1.save!
        enrollment = student_in_course(course: @course1, user: @student)
        enrollment.accept!
      end

      it 'should not display course code if the name is too long', priority: "1", test_id: 238191 do
        @course1.course_code = '001'
        @course1.save!
        get '/'
        expect(f('.ic-DashboardCard__header-subtitle').text).to be_blank
      end

      it 'should display special characters in a course title', priority: "1", test_id: 238192 do
        @course1.name = '(/*-+_@&$#%)"Course 1"æøåñó?äçíì[{c}]<strong>stuff</strong> )'
        @course1.save!
        get '/'
        expect(f('.ic-DashboardCard__header-title').text).to eq(@course1.name)
      end

      it 'should display special characters in course code', priority: "1", test_id: 240008 do
        # code is not displayed if the course name is too long
        @course1.name = 'test'
        @course1.course_code = '(/*-+_@&$#%)"Course 1"[{c}]<strong>stuff</strong> )'
        @course1.save!
        get '/'
        # as course codes are always displayed in upper case
        expect(f('.ic-DashboardCard__header-subtitle').text).to eq(@course1.course_code.upcase)
      end
    end

    context "dashcard custom color calendar" do
      before :each do
        # create another course to ensure the color matches to the right course
        @course1 = course_model
        @course1.name = 'Test Course'
        @course1.offer!
        @course1.save!
        enrollment = student_in_course(course: @course1, user: @student)
        enrollment.accept!
      end

      it 'should customize color by selecting from color palet in the calendar page', priority: "1", test_id: 239994 do
        select_color_pallet_from_calendar_page

        old_color = fj('.ColorPicker__CustomInputContainer .ColorPicker__ColorPreview').attribute(:title)

        expect(f('.ColorPicker__Container')).to be_displayed
        f('.ColorPicker__Container .ColorPicker__ColorBlock:nth-of-type(7)').click
        wait_for_ajaximations
        new_color =  fj('.ColorPicker__CustomInputContainer .ColorPicker__ColorPreview').attribute(:title)

        # make sure that we choose a new color for background
        if old_color == new_color
          f('.ColorPicker__Container .ColorPicker__ColorBlock:nth-of-type(8)').click
          wait_for_ajaximations
        end

        f('.ColorPicker__Container .Button--primary').click
        rgb = convert_hex_to_rgb_color(new_color)
        get '/'
        keep_trying_until(5) do
          expect(fj('.ic-DashboardCard__background').attribute(:style)).to include_text(rgb)
          refresh_page
          expect(fj('.ic-DashboardCard__background').attribute(:style)).to include_text(rgb)
          expect(f('.ic-DashboardCard__header-title').text).to include(@course1.name)
        end
      end

      it 'should customize color by using hex code in calendar page', priority: "1", test_id: 239993 do
        select_color_pallet_from_calendar_page

        hex = random_hex_color
        replace_content(fj('#ColorPickerCustomInput'), hex)
        f('.ColorPicker__Container .Button--primary').click
        wait_for_ajaximations
        get '/'
        keep_trying_until(5) do
          if fj('.ic-DashboardCard__background').attribute(:style).include?('rgb')
            rgb = convert_hex_to_rgb_color(hex)
            expect(fj('.ic-DashboardCard__background').attribute(:style)).to include_text(rgb)
          else
            expect(fj('.ic-DashboardCard__background').attribute(:style)).to include_text(hex)
          end
          expect(f('.ic-DashboardCard__header-title').text).to include(@course1.name)
        end
      end
    end

    context "dashcard color picker" do
      before :each do
        get '/'
        f('.ic-DashboardCard__header-button').click
        wait_for_ajaximations
      end

      it 'should customize dashcard color by selecting from color palet', priority: "1", test_id: 238196 do
        # gets the default background color
        old_color = fj('.ColorPicker__CustomInputContainer .ColorPicker__ColorPreview').attribute(:title)

        expect(f('.ColorPicker__Container')).to be_displayed
        f('.ColorPicker__Container .ColorPicker__ColorBlock:nth-of-type(7)').click
        wait_for_ajaximations
        new_color =  fj('.ColorPicker__CustomInputContainer .ColorPicker__ColorPreview').attribute(:title)

        # make sure that we choose a new color for background
        if old_color == new_color
          f('.ColorPicker__Container .ColorPicker__ColorBlock:nth-of-type(8)').click
          wait_for_ajaximations
        end

        f('.ColorPicker__Container .Button--primary').click
        rgb = convert_hex_to_rgb_color(new_color)
        keep_trying_until(5) do
          expect(fj('.ic-DashboardCard__background').attribute(:style)).to include_text(rgb)
          refresh_page
          expect(fj('.ic-DashboardCard__background').attribute(:style)).to include_text(rgb)
        end
      end

      it 'should customize dashcard color', priority: "1", test_id: 239991 do
        hex = random_hex_color
        expect(f('.ColorPicker__Container')).to be_displayed
        replace_content(fj('#ColorPickerCustomInput'), hex)
        f('.ColorPicker__Container .Button--primary').click
        keep_trying_until(5) do
          if fj('.ic-DashboardCard__background').attribute(:style).include?('rgb')
            rgb = convert_hex_to_rgb_color(hex)
            expect(fj('.ic-DashboardCard__background').attribute(:style)).to include_text(rgb)
          else
            expect(fj('.ic-DashboardCard__background').attribute(:style)).to include_text(hex)
          end
        end
      end

      it 'sets course nickname' do
        replace_content(fj('#NicknameInput'), 'course nickname!')
        f('.ColorPicker__Container .Button--primary').click
        wait_for_ajaximations
        expect(f('.ic-DashboardCard__header-title').text).to include 'course nickname!'
        expect(@student.reload.course_nickname(@course)).to eq 'course nickname!'
      end

      it 'sets both dashcard color and course nickname at once' do
        replace_content(fj('#NicknameInput'), 'course nickname frd!')
        replace_content(fj('#ColorPickerCustomInput'), '#000000')
        f('.ColorPicker__Container .Button--primary').click
        wait_for_ajaximations
        expect(@student.reload.course_nickname(@course)).to eq 'course nickname frd!'
        expect(@student.custom_colors[@course.asset_string]).to eq '#000000'
      end
    end
  end

  context "as a teacher and student" do
    before :each do
      @course = course(active_all: true)
      course_with_teacher_logged_in(active_all: true)
      Account.default.enable_feature! :use_new_styles
      @student = user_with_pseudonym(username: 'student@example.com', active_all: 1)
      enrollment = student_in_course(course: @course, user: @student)
      enrollment.accept!
    end

    it "should show/hide icons", priority: "1", test_id: 238416 do
      make_full_screen
      get '/'
      # check for discussion icon which will be visible by default in the dashcard
      # need not check for announcements, assignments and files as we have not created any
      expect(f(".ic-DashboardCard__action-container .discussions")).to be_present
      get "/courses/#{@course.id}/settings"
      f('#navigation_tab').click
      wait_for_ajaximations
      items_to_hide = ['announcements', 'assignments', 'discussions', 'files']
      4.times do |i|
        drag_and_drop_element(f("#nav_enabled_list .#{items_to_hide[i]}"), f('#nav_disabled_list'))
        expect(f("#nav_disabled_list .#{items_to_hide[i]}")).to be_present
      end
      submit_form('#nav_form')
      wait_for_ajaximations
      user_session(@student)
      get '/'
      # need not check for announcements, assignments and files as we have not created any
      expect(f(".ic-DashboardCard__action-container .discussions")).to be_nil
    end
  end

  def select_color_pallet_from_calendar_page
    get '/calendar'
    fail 'Not the right course' unless f('#context-list li:nth-of-type(2)').text.include? @course1.name
    f('#context-list li:nth-of-type(2) .ContextList__MoreBtn').click
    wait_for_ajaximations
    expect(f('.ColorPicker__Container')).to be_displayed
  end
end
