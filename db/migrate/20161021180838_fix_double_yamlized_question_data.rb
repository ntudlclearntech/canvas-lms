#
# Copyright (C) 2016 - present Instructure, Inc.
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

class FixDoubleYamlizedQuestionData < ActiveRecord::Migration[4.2]
  tag :postdeploy

  def up
    DataFixup::FixDoubleYamlizedQuestionData.send_later_if_production_enqueue_args(:run,
      :priority => Delayed::LOW_PRIORITY, :n_strand => 'long_datafixups')
  end

  def down
  end
end
