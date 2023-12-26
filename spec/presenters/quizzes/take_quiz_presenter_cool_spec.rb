# frozen_string_literal: true

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
#

describe Quizzes::TakeQuizPresenter do
  let(:quiz) { Quizzes::Quiz.new }
  let(:submission) { Quizzes::QuizSubmission.new }
  let(:params) { {} }
  let(:question1) { { id: 1, name: "Question 1" } }
  let(:question2) { { id: 2, name: "Question 2" } }
  let(:question3) { { id: 3, name: "Question 3" } }
  let(:all_questions) { [question1, question2, question3] }

  let(:presenter) { Quizzes::TakeQuizPresenter.new(quiz, submission, params) }

  def set_current_question(question)
    params[:question_id] = question[:id]
    allow(submission).to receive(:question).with(question[:id]).and_return(question)
  end

  before do
    allow(submission).to receive(:questions).and_return all_questions
  end

  describe "building the answer set" do
    it "accept zeroes for an answer" do
      allow(submission).to receive(:submission_data).and_return({
                                                                  "question_#{question1[:id]}" => "0"
                                                                })

      p = Quizzes::TakeQuizPresenter.new(quiz, submission, params)
      expect(p.answers).to have_key(question1[:id])
    end
  end
end
