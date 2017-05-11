#
# Copyright (C) 2012 - present Instructure, Inc.
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

# This migration was auto-generated via `rake db:generate_trigger_migration'.
# While you can edit this file, any changes you make to the definitions here
# will be undone by the next auto-generated trigger migration.

class CreateTriggersEnrollmentsInsertAndEnrollmentsUpdateAndSubmissionsInsertAndSubmissionsUpdate1 < ActiveRecord::Migration[4.2]
  tag :predeploy
  def self.up
    drop_trigger("enrollments_after_insert_row_when_new_type_in_studentenrollm_tr", "enrollments", :generated => true)

    drop_trigger("enrollments_after_update_row_when_new_type_in_studentenrollm_tr", "enrollments", :generated => true)

    drop_trigger("submissions_after_insert_row_tr", "submissions", :generated => true)

    drop_trigger("submissions_after_insert_row_when_new_submission_type_is_not_tr", "submissions", :generated => true)

    drop_trigger("submissions_after_update_row_tr", "submissions", :generated => true)

    drop_trigger("submissions_after_update_row_when_new_submission_type_is_not_tr", "submissions", :generated => true)

    create_trigger("enrollments_after_insert_row_when_new_type_in_studentenrollm_tr", :generated => true, :compatibility => 1).
        on("enrollments").
        after(:insert).
        where("(NEW.type IN ('StudentEnrollment', 'StudentViewEnrollment') AND NEW.workflow_state = 'active')") do
      {:default=>"      UPDATE assignments SET needs_grading_count = needs_grading_count + 1, updated_at = now()\n      WHERE context_id = NEW.course_id\n      AND context_type = 'Course'\n      AND EXISTS (\n        SELECT 1\n        FROM submissions\n        WHERE user_id = NEW.user_id\n        AND assignment_id = assignments.id\n        AND ( submissions.submission_type IS NOT NULL AND (submissions.workflow_state = 'pending_review' OR (submissions.workflow_state = 'submitted' AND (submissions.score IS NULL OR NOT submissions.grade_matches_current_submission) ) ) )\n                LIMIT 1\n      )\n      AND NOT EXISTS (SELECT 1 FROM enrollments WHERE user_id = NEW.user_id AND course_id = NEW.course_id AND id <> NEW.id AND (enrollments.type IN ('StudentEnrollment', 'StudentViewEnrollment') AND enrollments.workflow_state = 'active') LIMIT 1);"}
    end

    create_trigger("enrollments_after_update_row_when_new_type_in_studentenrollm_tr", :generated => true, :compatibility => 1).
        on("enrollments").
        after(:update).
        where("(NEW.type IN ('StudentEnrollment', 'StudentViewEnrollment') AND NEW.workflow_state = 'active') <> (OLD.type IN ('StudentEnrollment', 'StudentViewEnrollment') AND OLD.workflow_state = 'active')") do
      {:default=>"      UPDATE assignments SET needs_grading_count = needs_grading_count + CASE WHEN NEW.workflow_state = 'active' THEN 1 ELSE -1 END, updated_at = now()\n      WHERE context_id = NEW.course_id\n      AND context_type = 'Course'\n      AND EXISTS (\n        SELECT 1\n        FROM submissions\n        WHERE user_id = NEW.user_id\n        AND assignment_id = assignments.id\n        AND ( submissions.submission_type IS NOT NULL AND (submissions.workflow_state = 'pending_review' OR (submissions.workflow_state = 'submitted' AND (submissions.score IS NULL OR NOT submissions.grade_matches_current_submission) ) ) )\n                LIMIT 1\n      )\n      AND NOT EXISTS (SELECT 1 FROM enrollments WHERE user_id = NEW.user_id AND course_id = NEW.course_id AND id <> NEW.id AND (enrollments.type IN ('StudentEnrollment', 'StudentViewEnrollment') AND enrollments.workflow_state = 'active') LIMIT 1);"}
    end

    create_trigger("submissions_after_insert_row_tr", :generated => true, :compatibility => 1).
        on("submissions").
        after(:insert) do |t|
      t.where(" NEW.submission_type IS NOT NULL AND (NEW.workflow_state = 'pending_review' OR (NEW.workflow_state = 'submitted' AND (NEW.score IS NULL OR NOT NEW.grade_matches_current_submission) ) ) ") do
        {:default=>"      UPDATE assignments\n      SET needs_grading_count = needs_grading_count + 1, updated_at = now()\n      WHERE id = NEW.assignment_id\n      AND context_type = 'Course'\n      AND EXISTS (SELECT 1 FROM enrollments WHERE user_id = NEW.user_id AND course_id = assignments.context_id AND (enrollments.type IN ('StudentEnrollment', 'StudentViewEnrollment') AND enrollments.workflow_state = 'active') LIMIT 1);"}
      end
    end

    create_trigger("submissions_after_update_row_tr", :generated => true, :compatibility => 1).
        on("submissions").
        after(:update) do |t|
      t.where("( NEW.submission_type IS NOT NULL AND (NEW.workflow_state = 'pending_review' OR (NEW.workflow_state = 'submitted' AND (NEW.score IS NULL OR NOT NEW.grade_matches_current_submission) ) ) ) <> ( OLD.submission_type IS NOT NULL AND (OLD.workflow_state = 'pending_review' OR (OLD.workflow_state = 'submitted' AND (OLD.score IS NULL OR NOT OLD.grade_matches_current_submission) ) ) )") do
        {:default=>"      UPDATE assignments\n      SET needs_grading_count = needs_grading_count + CASE WHEN ( NEW.submission_type IS NOT NULL AND (NEW.workflow_state = 'pending_review' OR (NEW.workflow_state = 'submitted' AND (NEW.score IS NULL OR NOT NEW.grade_matches_current_submission) ) ) ) THEN 1 ELSE -1 END, updated_at = now()\n      WHERE id = NEW.assignment_id\n      AND context_type = 'Course'\n      AND EXISTS (SELECT 1 FROM enrollments WHERE user_id = NEW.user_id AND course_id = assignments.context_id AND (enrollments.type IN ('StudentEnrollment', 'StudentViewEnrollment') AND enrollments.workflow_state = 'active') LIMIT 1);"}
      end
    end
  end

  def self.down
    drop_trigger("enrollments_after_insert_row_when_new_type_in_studentenrollm_tr", "enrollments", :generated => true)

    drop_trigger("enrollments_after_update_row_when_new_type_in_studentenrollm_tr", "enrollments", :generated => true)

    drop_trigger("submissions_after_insert_row_tr", "submissions", :generated => true)

    drop_trigger("submissions_after_insert_row_when_new_submission_type_is_not_tr", "submissions", :generated => true)

    drop_trigger("submissions_after_update_row_tr", "submissions", :generated => true)

    drop_trigger("submissions_after_update_row_when_new_submission_type_is_not_tr", "submissions", :generated => true)

    create_trigger("enrollments_after_insert_row_when_new_type_in_studentenrollm_tr", :generated => true, :compatibility => 1).
        on("enrollments").
        after(:insert).
        where("(NEW.type IN ('StudentEnrollment', 'StudentViewEnrollment') AND NEW.workflow_state = 'active')") do
      {:default=>"\n      UPDATE assignments SET needs_grading_count = needs_grading_count + 1, updated_at = now()\n      WHERE context_id = NEW.course_id\n        AND context_type = 'Course'\n        AND EXISTS (\n          SELECT 1\n          FROM submissions\n          WHERE user_id = NEW.user_id\n            AND assignment_id = assignments.id\n            AND ( submissions.submission_type IS NOT NULL AND (submissions.workflow_state = 'pending_review' OR (submissions.workflow_state = 'submitted' AND (submissions.score IS NULL OR NOT submissions.grade_matches_current_submission) ) ) )\n          LIMIT 1\n        )\n        AND NOT EXISTS (SELECT 1 FROM enrollments WHERE user_id = NEW.user_id AND course_id = NEW.course_id AND id <> NEW.id AND (enrollments.type IN ('StudentEnrollment', 'StudentViewEnrollment') AND enrollments.workflow_state = 'active') LIMIT 1);"}
    end

    create_trigger("enrollments_after_update_row_when_new_type_in_studentenrollm_tr", :generated => true, :compatibility => 1).
        on("enrollments").
        after(:update).
        where("(NEW.type IN ('StudentEnrollment', 'StudentViewEnrollment') AND NEW.workflow_state = 'active') <> (OLD.type IN ('StudentEnrollment', 'StudentViewEnrollment') AND OLD.workflow_state = 'active')") do
      {:default=>"\n      UPDATE assignments SET needs_grading_count = needs_grading_count + CASE WHEN NEW.workflow_state = 'active' THEN 1 ELSE -1 END, updated_at = now()\n      WHERE context_id = NEW.course_id\n        AND context_type = 'Course'\n        AND EXISTS (\n          SELECT 1\n          FROM submissions\n          WHERE user_id = NEW.user_id\n            AND assignment_id = assignments.id\n            AND ( submissions.submission_type IS NOT NULL AND (submissions.workflow_state = 'pending_review' OR (submissions.workflow_state = 'submitted' AND (submissions.score IS NULL OR NOT submissions.grade_matches_current_submission) ) ) )\n          LIMIT 1\n        )\n        AND NOT EXISTS (SELECT 1 FROM enrollments WHERE user_id = NEW.user_id AND course_id = NEW.course_id AND id <> NEW.id AND (enrollments.type IN ('StudentEnrollment', 'StudentViewEnrollment') AND enrollments.workflow_state = 'active') LIMIT 1);"}
    end

    create_trigger("submissions_after_insert_row_tr", :generated => true, :compatibility => 1).
        on("submissions").
        after(:insert) do |t|
      t.where(" NEW.submission_type IS NOT NULL AND (NEW.workflow_state = 'pending_review' OR (NEW.workflow_state = 'submitted' AND (NEW.score IS NULL OR NOT NEW.grade_matches_current_submission) ) ) ") do
        {:default=>"\n      UPDATE assignments\n      SET needs_grading_count = needs_grading_count + 1, updated_at = now()\n      WHERE id = NEW.assignment_id\n        AND context_type = 'Course'\n        AND EXISTS (SELECT 1 FROM enrollments WHERE user_id = NEW.user_id AND course_id = assignments.context_id AND (enrollments.type IN ('StudentEnrollment', 'StudentViewEnrollment') AND enrollments.workflow_state = 'active') LIMIT 1);"}
      end
    end

    create_trigger("submissions_after_update_row_tr", :generated => true, :compatibility => 1).
        on("submissions").
        after(:update) do |t|
      t.where("( NEW.submission_type IS NOT NULL AND (NEW.workflow_state = 'pending_review' OR (NEW.workflow_state = 'submitted' AND (NEW.score IS NULL OR NOT NEW.grade_matches_current_submission) ) ) ) <> ( OLD.submission_type IS NOT NULL AND (OLD.workflow_state = 'pending_review' OR (OLD.workflow_state = 'submitted' AND (OLD.score IS NULL OR NOT OLD.grade_matches_current_submission) ) ) )") do
        {:default=>"\n      UPDATE assignments\n      SET needs_grading_count = needs_grading_count + CASE WHEN ( NEW.submission_type IS NOT NULL AND (NEW.workflow_state = 'pending_review' OR (NEW.workflow_state = 'submitted' AND (NEW.score IS NULL OR NOT NEW.grade_matches_current_submission) ) ) ) THEN 1 ELSE -1 END, updated_at = now()\n      WHERE id = NEW.assignment_id\n        AND context_type = 'Course'\n        AND EXISTS (SELECT 1 FROM enrollments WHERE user_id = NEW.user_id AND course_id = assignments.context_id AND (enrollments.type IN ('StudentEnrollment', 'StudentViewEnrollment') AND enrollments.workflow_state = 'active') LIMIT 1);"}
      end
    end
  end
end
