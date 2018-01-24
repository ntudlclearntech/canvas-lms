#
# Copyright (C) 2011 - present Instructure, Inc.
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

require 'csv'

require_dependency 'sis/common'

module SIS
  module CSV
    class CSVBaseImporter
      PARSE_ARGS = {headers: :first_row,
                    skip_blanks: true,
                    header_converters: :downcase,
                    converters: lambda {|field| field ? field.strip : field}
      }

      def initialize(sis_csv)
        @sis = sis_csv
        @root_account = @sis.root_account
        @batch = @sis.batch
      end

      def process(csv)
        raise NotImplementedError
      end

      def logger
        @sis.logger
      end

      def add_error(csv, message)
        @sis.add_error(csv, message)
      end

      def add_warning(csv, message)
        @sis.add_warning(csv, message)
      end

      def update_progress
        @sis.update_progress
      end

      # This will skip rows unless they are bigger than or equal to the index
      # passed. It will return if the current row is bigger than the index+count
      def csv_rows(csv, index=nil, count=nil)
        # csv foreach does not track the line number, and we want increase the
        # counter first thing beacuse we skip if the line number is out of the
        # range. We have to start at -1 to have a 0 index work.
        lineno = -1
        ::CSV.foreach(csv[:fullpath], PARSE_ARGS) do |row|
          lineno += 1
          next if index && lineno < index
          return if index && lineno >= index + count
          next if row.to_hash.values.all?(&:nil?)
          yield row
        end
      end

      def importer_opts
        {batch: @batch,
         batch_user: @batch.try(:user),
         logger: @sis.logger,
         override_sis_stickiness: @sis.override_sis_stickiness,
         add_sis_stickiness: @sis.add_sis_stickiness,
         clear_sis_stickiness: @sis.clear_sis_stickiness}
      end
    end
  end
end
