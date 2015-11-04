require File.expand_path(File.dirname(__FILE__) + '/../helpers/conversations_common')
require File.expand_path(File.dirname(__FILE__) + '/../helpers/assignment_overrides')

describe "conversations new" do
  include AssignmentOverridesSeleniumHelper
  include_context "in-process server selenium tests"
  let(:account) { Account.default }
  let(:account_settings_url) { "/accounts/#{account.id}/settings" }
  let(:user_notes_url) { "/courses/#{@course.id}/user_notes"}
  let(:student_user_notes_url) {"/users/#{@s1.id}/user_notes"}

  before do
    conversation_setup
    @s1 = user(name: "first student")
    @s2 = user(name: "second student")
    [@s1, @s2].each { |s| @course.enroll_student(s).update_attribute(:workflow_state, 'active') }
    cat = @course.group_categories.create(:name => "the groups")
    @group = cat.groups.create(:name => "the group", :context => @course)
    @group.users = [@s1, @s2]
  end

  context "Course with Faculty Journal not enabled" do
    before(:each) do
      site_admin_logged_in
    end

    it "should allow a site admin to enable faculty journal", priority: "2", test_id: 75005 do
      get account_settings_url
      f('#account_enable_user_notes').click
      f('.btn.btn-primary[type="submit"]').click
      wait_for_ajaximations
      expect(is_checked('#account_enable_user_notes')).to be_truthy
    end

    it "should allow a new entry by an admin", priority: "1", test_id: 75702 do
      @course.account.update_attribute(:enable_user_notes, true)
      get student_user_notes_url
      f('#new_user_note_button').click
      replace_content(f('#user_note_title'),'FJ Title 2')
      replace_content(f('textarea'),'FJ Body text 2')
      f('.send_button').click
      time = format_time_for_view(Time.zone.now)
      get student_user_notes_url
      expect(f('.subject').text).to eq 'FJ Title 2'
      expect(f('.user_content').text).to eq 'FJ Body text 2'
      expect(f('.creator_name').text).to include_text(time)
    end

    it "should clear the subject and body when cancel is clicked", priority: "1", test_id: 458518 do
      skip # This is currently broken CNVS-12522
      @course.account.update_attribute(:enable_user_notes, true)
      get student_user_notes_url
      f('#new_user_note_button').click
      replace_content(f('#user_note_title'),'FJ Title')
      replace_content(f('textarea'),'FJ Body text')
      f('.cancel_button').click
      f('#new_user_note_button').click
      expect(f('#user_note_title').text).to eq ''
      expect(f('textarea').text).to eq ''
    end
  end

  context "Faculty Journal" do
    before(:each) do
      @course.account.update_attribute(:enable_user_notes, true)
      user_session(@teacher)
      get_conversations
    end

    it "should go to the user_notes page", priority: "1", test_id: 133090 do
      get user_notes_url
      expect(f('#breadcrumbs')).to include_text('Faculty Journal')
    end

    it "should be allowed on new private conversations with students", priority: "1", test_id: 207094 do
      compose course: @course, to: [@s1, @s2], body: 'hallo!', send: false

      checkbox = f(".user_note")
      expect(checkbox).to be_displayed
      checkbox.click

      count1 = @s1.user_notes.count
      count2 = @s2.user_notes.count
      click_send
      expect(@s1.user_notes.reload.count).to eq count1 + 1
      expect(@s2.user_notes.reload.count).to eq count2 + 1
    end

    it "should be allowed with student groups", priority: "1", test_id: 207093 do
      compose course: @course, to: [@group], body: 'hallo!', send: false

      checkbox = f(".user_note")
      expect(checkbox).to be_displayed
      checkbox.click

      count1 = @s1.user_notes.count
      click_send
      expect(@s1.user_notes.reload.count).to eq count1 + 1
    end

    it "should not be allowed if disabled", priority: "1", test_id: 207092 do
      @course.account.update_attribute(:enable_user_notes, false)
      get_conversations
      compose course: @course, to: [@s1], body: 'hallo!', send: false
      expect(f(".user_note")).not_to be_displayed
    end

    it "should not be allowed for students", priority: "1", test_id: 138686 do
      user_session(@s1)
      get_conversations
      compose course: @course, to: [@s2], body: 'hallo!', send: false
      expect(f(".user_note")).not_to be_displayed
    end

    it "should not be allowed with non-student recipient", priority: "1", test_id: 138687 do
      compose course: @course, to: [@teacher], body: 'hallo!', send: false
      expect(f(".user_note")).not_to be_displayed
    end

    it "should send a message with faculty journal checked", priority: "1", test_id: 75433 do
      get_conversations
      # First verify teacher can send a message with faculty journal entry checked to one student
      compose course: @course, to: [@s1], body: 'hallo!', send: false
      f('.user_note').click
      click_send
      expect(flash_message_present?(:success, /Message sent!/)).to be_truthy
      # Now verify adding another user while the faculty journal entry checkbox is checked doesn't uncheck it and
      #   still lets teacher know it was sent successfully.
      compose course: @course, to: [@s1], body: 'hallo!', send: false
      f('.user_note').click
      add_message_recipient(@s2)
      expect(is_checked('.user_note')).to be_truthy
      click_send
      expect(flash_message_present?(:success, /Message sent!/)).to be_truthy
    end
  end
end


