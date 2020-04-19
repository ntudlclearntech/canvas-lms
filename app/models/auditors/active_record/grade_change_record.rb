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
module Auditors::ActiveRecord
  class GradeChangeRecord < ActiveRecord::Base
    include CanvasPartman::Concerns::Partitioned
    self.partitioning_strategy = :by_date
    self.partitioning_interval = :months
    self.partitioning_field = 'created_at'
    self.table_name = 'auditor_grade_change_records'

    class << self
      include Auditors::ActiveRecord::Model

      def ar_attributes_from_event_stream(record)
        attrs_hash = record.attributes.except('id', 'version_number')
        attrs_hash['request_id'] ||= "MISSING"
        attrs_hash['uuid'] = record.id
        attrs_hash['account_id'] = record.account.id
        attrs_hash['root_account_id'] = record.root_account.id
        attrs_hash['assignment_id'] = record.assignment.id
        attrs_hash['context_id'] = record.context.id
        attrs_hash['grader_id'] = record.grader&.id
        attrs_hash['graded_anonymously'] ||= false
        attrs_hash['student_id'] = record.student.id
        attrs_hash['submission_id'] = record.submission.id
        attrs_hash['submission_version_number'] = record.submission.version_number
        attrs_hash
      end
    end
  end
end