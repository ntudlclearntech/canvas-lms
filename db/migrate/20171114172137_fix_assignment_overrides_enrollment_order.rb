#
# Copyright (C) 2017 - present Instructure, Inc.
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

class FixAssignmentOverridesEnrollmentOrder < ActiveRecord::Migration[5.0]
  tag :postdeploy

  def up
    self.connection.execute "DROP VIEW IF EXISTS #{connection.quote_table_name('assignment_student_visibilities')}"

    # update the view so it looks at overrides first before it looks at enrollments
    # this fixes some edge cases where adhoc overrides did not work as intended because
    # they were returning all students in the course instead of just the adhoc students
    # if the assignment was only visible to overrides and only had adhoc overrides
    self.connection.execute %(CREATE VIEW #{connection.quote_table_name('assignment_student_visibilities')} AS
    SELECT DISTINCT
      a.id as assignment_id,
      e.user_id as user_id,
      c.id as course_id

    FROM #{Assignment.quoted_table_name} a

    JOIN #{Course.quoted_table_name} c
      ON a.context_id = c.id
      AND a.context_type = 'Course'

    LEFT JOIN #{AssignmentOverride.quoted_table_name} ao
      ON ao.assignment_id = a.id
      AND ao.workflow_state = 'active'

    LEFT JOIN #{AssignmentOverrideStudent.quoted_table_name} aos
      ON aos.assignment_id = a.id

    LEFT JOIN #{Group.quoted_table_name} g
      ON g.context_type = 'Course'
      AND g.context_id = c.id
      AND g.workflow_state = 'available'
      AND (
        ao.set_type::text = 'Group'::text AND g.id = ao.set_id
      )

    LEFT JOIN #{GroupMembership.quoted_table_name} gm
      ON gm.group_id = g.id
      AND gm.workflow_state = 'accepted'

    LEFT JOIN #{Submission.quoted_table_name} s
      ON s.assignment_id = a.id
      AND s.workflow_state != 'deleted'

    JOIN #{Enrollment.quoted_table_name} e
      ON e.course_id = c.id
      AND e.type IN ('StudentEnrollment', 'StudentViewEnrollment')
      AND e.workflow_state != 'deleted'
      AND (
        a.only_visible_to_overrides = false
        OR s.user_id = e.user_id
        OR (ao.set_type::text = 'CourseSection'::text AND e.course_section_id = ao.set_id)
        OR (ao.set_type::text = 'ADHOC'::text AND e.user_id = aos.user_id)
        OR (ao.set_type::text = 'Group'::text AND e.user_id = gm.user_id)
      )

    WHERE a.workflow_state NOT IN ('deleted','unpublished')
      AND(
        ( a.only_visible_to_overrides = 'true' AND (ao.id IS NOT NULL OR s.id IS NOT NULL))
        OR (COALESCE(a.only_visible_to_overrides, 'false') = 'false')
      )
    )
  end

  def down
    self.connection.execute "DROP VIEW IF EXISTS #{connection.quote_table_name('assignment_student_visibilities')}"

    # Recreate the old view so that this migration is reversible
    self.connection.execute %(CREATE VIEW #{connection.quote_table_name('assignment_student_visibilities')} AS
      SELECT DISTINCT a.id as assignment_id,
      e.user_id as user_id,
      c.id as course_id

      FROM #{Assignment.quoted_table_name} a

      JOIN #{Course.quoted_table_name} c
        ON a.context_id = c.id
        AND a.context_type = 'Course'

      JOIN #{Enrollment.quoted_table_name} e
        ON e.course_id = c.id
        AND e.type IN ('StudentEnrollment', 'StudentViewEnrollment')
        AND e.workflow_state != 'deleted'

      JOIN #{CourseSection.quoted_table_name} cs
        ON cs.course_id = c.id
        AND e.course_section_id = cs.id

      LEFT JOIN #{GroupMembership.quoted_table_name} gm
        ON gm.user_id = e.user_id
        AND gm.workflow_state = 'accepted'

      LEFT JOIN #{Group.quoted_table_name} g
        ON g.context_type = 'Course'
        AND g.context_id = c.id
        AND g.workflow_state = 'available'
        AND gm.group_id = g.id

      LEFT JOIN #{AssignmentOverrideStudent.quoted_table_name} aos
        ON aos.assignment_id = a.id
        AND aos.user_id = e.user_id

      LEFT JOIN #{AssignmentOverride.quoted_table_name} ao
        ON ao.assignment_id = a.id
        AND ao.workflow_state = 'active'
        AND (
          (ao.set_type = 'CourseSection' AND ao.set_id = cs.id)
          OR (ao.set_type = 'ADHOC' AND ao.set_id IS NULL AND ao.id = aos.assignment_override_id)
          OR (ao.set_type = 'Group' AND ao.set_id = g.id)
        )

      LEFT JOIN #{Submission.quoted_table_name} s
        ON s.user_id = e.user_id
        AND s.assignment_id = a.id
        AND s.workflow_state != 'deleted'

      WHERE a.workflow_state NOT IN ('deleted','unpublished')
        AND(
          ( a.only_visible_to_overrides = 'true' AND (ao.id IS NOT NULL OR s.id IS NOT NULL))
          OR (COALESCE(a.only_visible_to_overrides, 'false') = 'false')
        )
    )
  end
end
