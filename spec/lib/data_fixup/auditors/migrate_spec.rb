#
# Copyright (C) 2020 - present Instructure, Inc.
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

require 'spec_helper'
require File.expand_path(File.dirname(__FILE__) + '/../../../cassandra_spec_helper')

describe 'DataFixup::Auditors::Migrate' do
  before(:each) do
    allow(Auditors).to receive(:config).and_return({'write_paths' => ['cassandra'], 'read_path' => 'cassandra'})
  end

  let(:account){ Account.default }

  it "writes authentication data to postgres that's in cassandra" do
    Auditors::ActiveRecord::AuthenticationRecord.delete_all
    user_with_pseudonym(active_all: true)
    20.times { Auditors::Authentication.record(@pseudonym, 'login') }
    date = Time.zone.today
    expect(Auditors::ActiveRecord::AuthenticationRecord.count).to eq(0)
    worker = DataFixup::Auditors::Migrate::AuthenticationWorker.new(account.id, date)
    worker.perform
    expect(Auditors::ActiveRecord::AuthenticationRecord.count).to eq(20)
  end

  it "writes course data to postgres that's in cassandra" do
    Auditors::ActiveRecord::CourseRecord.delete_all
    user_with_pseudonym(active_all: true)
    sub_account = Account.create!(parent_account: account)
    sub_sub_account = Account.create!(parent_account: sub_account)
    course_with_teacher(course_name: "Course 1", account: sub_sub_account)
    @course.name = "Course 2"
    @course.start_at = Time.zone.today
    @course.conclude_at = Time.zone.today + 7.days
    10.times { Auditors::Course.record_updated(@course, @teacher, @course.changes) }
    date = Time.zone.today
    expect(Auditors::ActiveRecord::CourseRecord.count).to eq(0)
    worker = DataFixup::Auditors::Migrate::CourseWorker.new(sub_sub_account.id, date)
    worker.perform
    expect(Auditors::ActiveRecord::CourseRecord.count).to eq(10)
  end

  it "writes grade change data to postgres that's in cassandra" do
    Auditors::ActiveRecord::GradeChangeRecord.delete_all
    sub_account = Account.create!(parent_account: account)
    sub_sub_account = Account.create!(parent_account: sub_account)
    course_with_teacher(account: sub_sub_account)
    student_in_course
    assignment = @course.assignments.create!(title: 'Assignment', points_possible: 10)
    assignment.grade_student(@student, grade: 8, grader: @teacher).first
    # no need to call anything, THIS invokes an auditor record^
    date = Time.zone.today
    expect(Auditors::ActiveRecord::GradeChangeRecord.count).to eq(0)
    expect(Auditors::GradeChange.for_assignment(assignment).paginate(per_page: 10).size).to eq(1)
    worker = DataFixup::Auditors::Migrate::GradeChangeWorker.new(sub_sub_account.id, date)
    worker.perform
    expect(Auditors::ActiveRecord::GradeChangeRecord.count).to eq(1)
  end

  describe "record keeping" do
    let(:date){ Time.zone.today }

    before(:each) do
      Auditors::ActiveRecord::AuthenticationRecord.delete_all
      Auditors::ActiveRecord::MigrationCell.delete_all
      user_with_pseudonym(active_all: true)
      10.times { Auditors::Authentication.record(@pseudonym, 'login') }
    end

    it "keeps a record of the migration" do
      worker = DataFixup::Auditors::Migrate::AuthenticationWorker.new(account.id, date)
      cell = worker.migration_cell
      expect(cell).to be_nil
      worker.perform
      cell = worker.migration_cell
      expect(cell.id).to_not be_nil
      expect(cell.auditor_type).to eq("authentication")
      expect(cell.completed).to eq(true)
      expect(cell.failed).to eq(false)
      expect(Auditors::ActiveRecord::AuthenticationRecord.count).to eq(10)
    end

    it "will not run if the migration is already flagged as complete" do
      worker = DataFixup::Auditors::Migrate::AuthenticationWorker.new(account.id, date)
      cell = worker.create_cell!
      cell.update_attribute(:completed, true)
      worker.perform
      # no records get transfered because it's already "complete"
      expect(Auditors::ActiveRecord::AuthenticationRecord.count).to eq(0)
    end

    it "reconciles partial successes" do
      worker = DataFixup::Auditors::Migrate::AuthenticationWorker.new(account.id, date)
      worker.perform
      expect(Auditors::ActiveRecord::AuthenticationRecord.count).to eq(10)
      # kill the cell so we can run again
      worker.migration_cell.destroy
      3.times { Auditors::Authentication.record(@pseudonym, 'login') }
      # worker reconciles which ones are already in the table and which are not
      worker.perform
      expect(Auditors::ActiveRecord::AuthenticationRecord.count).to eq(13)
    end
  end

  describe "BackfillEngine" do
    around(:each) do |example|
      Delayed::Job.delete_all
      example.run
      Delayed::Job.delete_all
    end

    it "stops enqueueing after one day with a low threshold" do
      start_date = Time.zone.today
      end_date = start_date - 1.year
      engine = DataFixup::Auditors::Migrate::BackfillEngine.new(start_date, end_date)
      Setting.set(engine.class.queue_setting_key, 1)
      expect(Delayed::Job.count).to eq(0)
      account = Account.default
      expect(account.workflow_state).to eq('active')
      expect(Account.active.count).to eq(1)
      engine.perform
      # one each per table for the day, and one as the future
      # scheduler thread.
      expect(Delayed::Job.count).to eq(4)
    end

    it "succeeds in all summary queries" do
      output = DataFixup::Auditors::Migrate::BackfillEngine.summary
      expect(output).to_not be_empty
    end
  end
end