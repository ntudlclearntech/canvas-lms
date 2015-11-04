class AddHiddenToSubmissionComments < ActiveRecord::Migration
  tag :predeploy

  def self.up
    add_column :submission_comments, :hidden, :boolean, :default => false
    SubmissionComment.update_all :hidden => false
  end

  def self.down
    drop_column :submission_comments
  end
end
