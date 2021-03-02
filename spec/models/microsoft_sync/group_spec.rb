# frozen_string_literal: true

#
# Copyright (C) 2015 - present Instructure, Inc.
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

require 'spec_helper'

describe MicrosoftSync::Group do
  subject { described_class.create(course: course_model) }

  it { is_expected.to be_a(described_class) }
  it { is_expected.to be_valid }
  it { is_expected.to belong_to(:course).required }
  it { is_expected.to validate_presence_of(:course) }

  it 'defaults to workflow_state=pending' do
    expect(subject.workflow_state).to eq('pending')
  end
end
