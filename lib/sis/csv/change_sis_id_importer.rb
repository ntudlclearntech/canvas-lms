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

module SIS
  module CSV
    class ChangeSisIdImporter < CSVBaseImporter

      def self.change_sis_id_csv?(row)
        row.include?('old_id')
      end

      def self.identifying_fields
        %w[old_id].freeze
      end

      # possible columns:
      # old_id, new_id, type
      def process(csv)
        @sis.counts[:change_sis_ids] += SIS::ChangeSisIdImporter.new(@root_account, importer_opts).process do |i|
          csv_rows(csv) do |row|
            update_progress

            begin
              i.process_change_sis_id(old_id: row['old_id'], new_id: row['new_id'], type: row['type'])
            rescue ImportError => e
              add_warning(csv, e.to_s)
            end
          end
        end
      end
    end
  end
end
