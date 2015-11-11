require File.expand_path(File.dirname(__FILE__) + '/../helpers/conversations_common')

describe "conversations new" do
  include_context "in-process server selenium tests"

  before do
    conversation_setup
    @s1 = user(name: "first student")
    @s2 = user(name: "second student")
    [@s1, @s2].each { |s| @course.enroll_student(s).update_attribute(:workflow_state, 'active') }
    cat = @course.group_categories.create(:name => "the groups")
    @group = cat.groups.create(:name => "the group", :context => @course)
    @group.users = [@s1, @s2]
  end

  describe "message sending" do
    it "should show error messages when no recipient is entered", priority: "1", test_id: 351236 do
      get '/conversations'
      f('.icon-compose').click
      click_send
      errors = ff('.error_text')
      expect(errors[2].text).to include('Invalid recipient name.')
      expect(errors[1].text).to include('Required field')
    end

    it "should not show courses that are date restricted" do
      user = @s1
      user_logged_in({:user => user})

      get '/conversations'
      f('.icon-compose').click
      expect(element_exists("#compose-message-course option[data-code='Unnamed']"))

      @course.conclude_at = 2.weeks.ago
      @course.restrict_enrollments_to_course_dates = true
      @course.restrict_student_past_view = true
      @course.save!

      get '/conversations'
      f('.icon-compose').click
      expect(!element_exists("#compose-message-course option[data-code='Unnamed']"))
    end

    it "should start a group conversation when there is only one recipient", priority: "2", test_id: 201499 do
      get_conversations
      compose course: @course, to: [@s1], subject: 'single recipient', body: 'hallo!'
      c = @s1.conversations.last.conversation
      expect(c.subject).to eq('single recipient')
      expect(c.private?).to be_falsey
    end

    it "should start a group conversation when there is more than one recipient", priority: "2", test_id: 201500 do
      get_conversations
      compose course: @course, to: [@s1, @s2], subject: 'multiple recipients', body: 'hallo!'
      c = @s1.conversations.last.conversation
      expect(c.subject).to eq('multiple recipients')
      expect(c.private?).to be_falsey
      expect(c.conversation_participants.collect(&:user_id).sort).to eq([@teacher, @s1, @s2].collect(&:id).sort)
    end

    it "should allow admins with read_roster permission to send a message without picking a context", priority: "1", test_id: 138677 do
      user = account_admin_user
      user_logged_in({:user => user})
      get_conversations
      compose to: [@s1], subject: 'context-free', body: 'hallo!'
      c = @s1.conversations.last.conversation
      expect(c.subject).to eq 'context-free'
      expect(c.context).to eq Account.default
    end

    it "should not allow admins without read_roster permission to send a message without picking a context", priority: "1" do
      user = account_admin_user
      RoleOverride.manage_role_override(Account.default, Role.get_built_in_role('AccountAdmin'), 'read_roster', override: false, locked: false)
      user_logged_in({:user => user})
      get_conversations
      fj('#compose-btn').click
      wait_for_animations
      expect(fj('#recipient-row')).to have_attribute(:style, 'display: none;')
    end

    it "should not allow non-admins to send a message without picking a context", priority: "1", test_id: 138678 do
      get_conversations
      fj('#compose-btn').click
      wait_for_animations
      expect(fj('#recipient-row')).to have_attribute(:style, 'display: none;')
    end

    it "should allow non-admins to send a message to an account-level group", priority: "2", test_id: 201506 do
      @group = Account.default.groups.create(:name => "the group")
      @group.add_user(@s1)
      @group.add_user(@s2)
      @group.save
      user_logged_in({:user => @s1})
      get_conversations
      fj('#compose-btn').click
      wait_for_ajaximations
      select_message_course(@group, true)
      add_message_recipient @s2
    end

    it "should allow admins to message users from their profiles", priority: "2", test_id: 201940 do
      user = account_admin_user
      user_logged_in({:user => user})
      get "/accounts/#{Account.default.id}/users"
      wait_for_ajaximations
      f('li.user a').click
      wait_for_ajaximations
      f('.icon-email').click
      wait_for_ajaximations
      expect(f('.ac-token')).not_to be_nil
    end

    it "should allow selecting multiple recipients in one search", priority: "2", test_id: 201941 do
      get_conversations
      fj('#compose-btn').click
      wait_for_ajaximations
      select_message_course(@course)
      get_message_recipients_input.send_keys('student')
      driver.action.key_down(modifier).perform
      keep_trying_until { fj(".ac-result:contains('first student')") }.click
      driver.action.key_up(modifier).perform
      fj(".ac-result:contains('second student')").click
      expect(ff('.ac-token').count).to eq 2
    end

    it "should not send the message on shift-enter", priority: "1", test_id: 206019 do
      get_conversations
      compose course: @course, to: [@s1], subject: 'context-free', body: 'hallo!', send: false
      driver.action.key_down(:shift).perform
      get_message_body_input.send_keys(:enter)
      driver.action.key_up(:shift).perform
      expect(fj('#compose-new-message:visible')).not_to be_nil
    end

    #
    context "bulk_message locking" do
      before do
        # because i'm too lazy to create more users
        Conversation.stubs(:max_group_conversation_size).returns(1)
      end

      it "should check and lock the bulk_message checkbox when over the max size", priority: "2", test_id: 206022 do
        get_conversations
        compose course: @course, subject: 'lockme', body: 'hallo!', send: false

        f("#recipient-search-btn").click
        wait_for_ajaximations
        f("li.everyone").click # send to everybody in the course
        wait_for_ajaximations

        selector = "#bulk_message"
        bulk_cb = f(selector)
        
        expect(bulk_cb.attribute('disabled')).to be_present
        expect(is_checked(selector)).to be_truthy

        hover_and_click('.ac-token-remove-btn') # remove the token
        wait_for_ajaximations

        expect(bulk_cb.attribute('disabled')).to be_blank
        expect(is_checked(selector)).to be_falsey # should be unchecked
      end

      it "should leave the value the same as before after unlocking", priority: "2", test_id: 206023 do
        get_conversations
        compose course: @course, subject: 'lockme', body: 'hallo!', send: false

        selector = "#bulk_message"
        bulk_cb = f(selector)
        bulk_cb.click # check the box

        f("#recipient-search-btn").click
        wait_for_ajaximations
        f("li.everyone").click # send to everybody in the course
        wait_for_ajaximations
        hover_and_click('.ac-token-remove-btn') # remove the token
        wait_for_ajaximations

        expect(bulk_cb.attribute('disabled')).to be_blank
        expect(is_checked(selector)).to be_truthy # should still be checked
      end

      it "can compose a message to a single user", priority: "1", test_id: 117958 do
        get_conversations
        fln('Inbox').click

        find('.icon-compose').click
        fj('.btn.dropdown-toggle :contains("Select course")').click
        wait_for_ajaximations

        expect(find('.dropdown-menu.open')).to be_truthy

        fj('.message-header-input .text:contains("Unnamed Course")').click
        wait_for_ajaximations

        # check for auto complete to fill in 'first student'
        find('.ac-input-cell .ac-input').send_keys('first st')
        wait_for_ajaximations
        keep_trying_until(5) do
          expect(find('.result-name')).to include_text('first student')
        end

        find('.result-name').click
        wait_for_ajaximations

        expect(find('.ac-token')).to include_text('first student')

        find('#compose-message-subject').send_keys('Hello out there all you happy people')
        find('.message-body textarea').send_keys("I'll pay you Tuesday for a hamburger today")
        click_send

        expect(flash_message_present?(:success, /Message sent!/)).to be_truthy
      end

      context "Message Address Book" do
        before(:each) do
          @t1_name = 'teacher1'
          @t2_name = 'teacher2'
          @t1 = user(name: @t1_name, active_user: true)
          @t2 = user(name: @t2_name, active_user: true)
          [@t1, @t2].each { |s| @course.enroll_teacher(s) }

          get_conversations
          fln('Inbox').click

          find('.icon-compose').click
          fj('.btn.dropdown-toggle :contains("Select course")').click
          wait_for_ajaximations

          expect(find('.dropdown-menu.open')).to be_truthy

          fj('.message-header-input .text:contains("Unnamed Course")').click
          wait_for_ajaximations

          find('.message-header-input .icon-address-book').click
          wait_for_ajaximations
        end

        it "contains categories for teachers, students, and groups", priority: "1", test_id: 138899 do
          assert_result_names(true, ['Teachers', 'Students', 'Student Groups'])
        end

        it "categorizes enrolled teachers", priority: "1", test_id: 476933 do
          assert_categories('Teachers')
          assert_result_names(true, [@t1_name, @t2_name])
          assert_result_names(false, [@s1.name, @s2.name])
        end

        it "categorizes enrolled students", priority: "1", test_id: 476934 do
          assert_categories('Students')
          assert_result_names(false, [@t1_name, @t2_name])
          assert_result_names(true, [@s1.name, @s2.name])
        end

        it "categorizes enrolled students in groups", priority: "1", test_id: 476935 do
          assert_categories('Student Groups')
          assert_categories('the group')
          assert_result_names(false, [@t1_name, @t2_name])
          assert_result_names(true, [@s1.name, @s2.name])
        end
      end
    end
  end

  def assert_result_names(tf, names)
    names.each do |name|
      keep_trying_until(9) do
        if tf
          expect(fj(".ac-result-container .result-name:contains(#{name})")).to be_truthy
        else
          expect(fj(".ac-result-container .result-name:contains(#{name})")).to be_falsey
        end
      end
    end
  end

  def assert_categories(container)
    keep_trying_until(9) { fj(".ac-result-container .result-name:contains(#{container})").click }
  end

end
