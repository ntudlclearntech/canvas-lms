require 'spec_helper'

describe MasterCourses::MasterMigration do
  before :once do
    course
    @template = MasterCourses::MasterTemplate.set_as_master_course(@course)
  end

  describe "start_new_migration!" do
    it "should queue a migration" do
      user
      MasterCourses::MasterMigration.any_instance.expects(:queue_export_job).once
      mig = MasterCourses::MasterMigration.start_new_migration!(@template, @user)
      expect(mig.id).to be_present
      expect(mig.master_template).to eq @template
      expect(mig.user).to eq @user
      expect(@template.active_migration).to eq mig
    end

    it "should raise an error if there's already a migration running" do
      running = @template.master_migrations.create!(:workflow_state => "exporting")
      @template.active_migration = running
      @template.save!

      MasterCourses::MasterMigration.any_instance.expects(:queue_export_job).never
      expect {
        MasterCourses::MasterMigration.start_new_migration!(@template)
      }.to raise_error("cannot start new migration while another one is running")
    end

    it "should still allow if the 'active' migration has been running for a while (and is probably ded)" do
      running = @template.master_migrations.create!(:workflow_state => "exporting")
      @template.active_migration = running
      @template.save!

      Timecop.freeze(2.days.from_now) do
        MasterCourses::MasterMigration.any_instance.expects(:queue_export_job).once
        MasterCourses::MasterMigration.start_new_migration!(@template)
      end
    end

    it "should queue a job" do
      expect { MasterCourses::MasterMigration.start_new_migration!(@template) }.to change(Delayed::Job, :count).by(1)
      MasterCourses::MasterMigration.any_instance.expects(:perform_exports).once
      run_jobs
    end
  end

  describe "perform_exports" do
    before :once do
      @migration = @template.master_migrations.create!
    end

    it "shouldn't do anything if there aren't any child courses to push to" do
      @migration.expects(:create_export).never
      @migration.perform_exports
      @migration.reload
      expect(@migration).to be_completed
      expect(@migration.export_results[:message]).to eq "No child courses to export to"
    end

    it "shouldn't count deleted subscriptions" do
      other_course = course
      sub = @template.add_child_course!(other_course)
      sub.destroy!

      @migration.expects(:create_export).never
      @migration.perform_exports
    end

    it "should record errors" do
      other_course = course
      @template.add_child_course!(other_course)
      @migration.stubs(:create_export).raises "oh neos"
      expect { @migration.perform_exports }.to raise_error("oh neos")

      @migration.reload
      expect(@migration).to be_exports_failed
      expect(ErrorReport.find(@migration.export_results[:error_report_id]).message).to eq "oh neos"
    end

    it "should do a full export by default" do
      new_course = course
      new_sub = @template.add_child_course!(new_course)

      @migration.expects(:export_to_child_courses).with(:full, [new_sub], true)
      @migration.perform_exports
    end

    it "should do a selective export based on subscriptions" do
      old_course = course
      sel_sub = @template.add_child_course!(old_course)
      sel_sub.update_attribute(:use_selective_copy, true)

      @migration.expects(:export_to_child_courses).with(:selective, [sel_sub], true)
      @migration.perform_exports
    end

    it "should do two exports if needed" do
      new_course = course
      new_sub = @template.add_child_course!(new_course)
      old_course = course
      sel_sub = @template.add_child_course!(old_course)
      sel_sub.update_attribute(:use_selective_copy, true)

      @migration.expects(:export_to_child_courses).twice
      @migration.perform_exports
    end
  end

  describe "all the copying" do
    before :once do
      account_admin_user(:active_all => true)
      @copy_from = @course
    end

    def mig_id(obj)
      CC::CCHelper.create_key(obj)
    end

    def run_master_migration
      @migration = MasterCourses::MasterMigration.start_new_migration!(@template, @admin)
      run_jobs
      @migration.reload
    end

    it "should create an export once and import in each child course" do
      @copy_to1 = course
      @sub1 = @template.add_child_course!(@copy_to1)
      @copy_to2 = course
      @sub2 = @template.add_child_course!(@copy_to2)

      assmt = @copy_from.assignments.create!(:name => "some assignment")
      att = Attachment.create!(:filename => '1.txt', :uploaded_data => StringIO.new('1'), :folder => Folder.root_folders(@copy_from).first, :context => @copy_from)

      run_master_migration

      expect(@migration).to be_completed

      [@sub1, @sub2].each do |sub|
        sub.reload
        expect(sub.use_selective_copy?).to be_truthy # should have been marked as up-to-date now
      end

      [@copy_to1, @copy_to2].each do |copy_to|
        assmt_to = copy_to.assignments.where(:migration_id => mig_id(assmt)).first
        expect(assmt_to).to be_present
        att_to = copy_to.attachments.where(:migration_id => mig_id(att)).first
        expect(att_to).to be_present
      end
    end

    it "should copy selectively on second time" do
      @copy_to = course
      @sub = @template.add_child_course!(@copy_to)

      topic = @copy_from.discussion_topics.create!(:title => "some title")
      DiscussionTopic.where(:id => topic).update_all(:updated_at => 5.seconds.ago) # just in case, to fool the selective export

      run_master_migration
      expect(@migration.export_results.keys).to eq [:full]

      topic_to = @copy_to.discussion_topics.where(:migration_id => mig_id(topic)).first
      expect(topic_to).to be_present
      cm1 = ContentMigration.find(@migration.import_results.keys.first)
      expect(cm1.migration_settings[:imported_assets]["DiscussionTopic"]).to eq topic_to.id.to_s

      page = @copy_from.wiki.wiki_pages.create!(:title => "another title")

      run_master_migration
      expect(@migration.export_results.keys).to eq [:selective]

      page_to = @copy_to.wiki.wiki_pages.where(:migration_id => mig_id(page)).first
      expect(page_to).to be_present

      cm2 = ContentMigration.find(@migration.import_results.keys.first)
      expect(cm2.migration_settings[:imported_assets]["DiscussionTopic"]).to be_blank # should have excluded it from the selective export
      expect(cm2.migration_settings[:imported_assets]["WikiPage"]).to eq page_to.id.to_s
    end

    it "should create two exports (one selective and one full) if needed" do
      @copy_to1 = course
      @template.add_child_course!(@copy_to1)

      topic = @copy_from.discussion_topics.create!(:title => "some title")

      run_master_migration
      expect(@migration.export_results.keys).to eq [:full]
      topic_to1 = @copy_to1.discussion_topics.where(:migration_id => mig_id(topic)).first
      expect(topic_to1).to be_present
      new_title = "new title"
      topic_to1.update_attribute(:title, new_title)

      page = @copy_from.wiki.wiki_pages.create!(:title => "another title")

      @copy_to2 = course
      @template.add_child_course!(@copy_to2) # new child course - needs full update

      run_master_migration
      expect(@migration.export_results.keys).to match_array([:selective, :full]) # should create both

      expect(@copy_to1.wiki.wiki_pages.where(:migration_id => mig_id(page)).first).to be_present # should bring the wiki page in the selective
      expect(topic_to1.reload.title).to eq new_title # should not have have overwritten the new change in the child course

      expect(@copy_to2.discussion_topics.where(:migration_id => mig_id(topic)).first).to be_present # should bring both in the full
      expect(@copy_to2.wiki.wiki_pages.where(:migration_id => mig_id(page)).first).to be_present
    end
  end
end
