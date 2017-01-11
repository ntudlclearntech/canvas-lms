require 'rubygems'
require_relative '../common'

describe "add_people" do
  include_context "in-process server selenium tests"
  let(:enrollee_count){0}

  before(:once) do
    # in the people table, the kyle menu can be off the screen
    # and uninteractable if the window is too small
    driver.manage.window.maximize
  end

  context "as a teacher" do
    before(:each) do
      course_with_teacher_logged_in
      4.times.with_index { |i| add_section("Section #{i}") }
      user_with_pseudonym(:name => "Foo Foo", :active_user => true, :username => "foo", :account => @account)
      user_with_pseudonym(:name => "Foo Bar", :active_user => true, :username => "bar", :account => @account)

    end

    # this is one giant test because it has to walk through the panels of a
    # modal dialog, and "it" tests throw an exception if they don't include
    # a get(url) call, which would break the flow of the test.
    it "should add a couple users" do
      get "/courses/#{@course.id}/users"

      # get the number of people in the class when we start, so we know
      # how many should be there when we've added some more
      enrollee_count = ff("tbody.collectionViewItems tr").length

      # open the add people modal dialog
      f('a#addUsers').click
      expect(f(".addpeople")).to be_displayed

      # can't click the 'login id' radio button directly, since it's covered
      # with inst-ui prettiness and selenium won't allow it.
      # Click on it's label instead
      f("[for='peoplesearch_radio_unique_id']").click

      # search for some logins
      replace_content(f(".addpeople__peoplesearch textarea"), "foo,bar,baz")

      # click next button
      f("#addpeople_next").click

      # the validation issues panel is displayed
      expect(f(".addpeople__peoplevalidationissues")).to be_displayed

      # there should be 1 row in the missing table (baz)
      expect(ff('.addpeople__peoplevalidationissues tbody tr')).to have_size(1)

      # force next button into view, then click it
      f("#addpeople_next").click

      # there should be 2 rows in the ready to add table (foo, bar)
      expect(ff('.addpeople__peoplereadylist tbody tr')).to have_size(2)

      # force next button into view, then click it
      f("#addpeople_next").click

      # the modal dialog should close
      expect(f("body")).not_to contain_css(".addpeople")

      # there should be 2 more people in this course
      expect(ff("tbody.collectionViewItems tr")).to have_size(enrollee_count + 2)
    end
  end
end
