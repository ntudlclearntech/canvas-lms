#
# Copyright (C) 2013 - present Instructure, Inc.
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

require File.expand_path(File.dirname(__FILE__) + '/../../../spec_helper.rb')

describe Quizzes::QuizQuestion::UserAnswer do

  let(:answer_data) do
    {:question_1 => ["1"]}
  end
  let(:question_id) { 1 }
  let(:points_possible) { 100 }
  let(:answer) do
    Quizzes::QuizQuestion::UserAnswer.new(question_id, points_possible, answer_data)
  end

  describe "#initialize" do
    it "saves question_ids" do
      expect(answer.question_id).to eq question_id
    end

    it "saves the points possible" do
      expect(answer.points_possible).to eq points_possible
    end
  end
end
