# frozen_string_literal: true

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

class Quizzes::QuizGroup < ActiveRecord::Base
  extend RootAccountResolver
  self.table_name = 'quiz_groups'

  attr_readonly :quiz_id

  belongs_to :quiz, class_name: 'Quizzes::Quiz'
  belongs_to :assessment_question_bank
  has_many :quiz_questions, class_name: 'Quizzes::QuizQuestion', dependent: :destroy

  validates :quiz_id, presence: true
  validates :name, length: { maximum: maximum_string_length, allow_nil: true }
  validates :pick_count, :question_points, numericality: { allow_nil: true }

  before_validation :set_default_pick_count
  before_save :infer_position
  before_destroy :update_quiz
  after_save :update_quiz

  resolves_root_account through: :quiz

  include MasterCourses::CollectionRestrictor
  self.collection_owner_association = :quiz
  restrict_columns :points, [:pick_count, :question_points]
  restrict_columns :content, [:name, :pick_count]

  def actual_pick_count
    count = if assessment_question_bank
              # don't do a valid question check because we don't want to instantiate all the bank's questions
              assessment_question_bank.assessment_question_count
            else
              quiz_questions.active.count
            end

    [pick_count.to_i, count].min
  end

  # QuizGroup.data is used when creating and editing a quiz, but
  # once the quiz is "saved" then the "rendered" version of the
  # quiz is stored in Quizzes::Quiz.quiz_data.  Hence, the teacher can
  # be futzing with questions and groups and not affect
  # the quiz, as students see it.
  def data
    {
      "id" => id,
      "name" => name,
      "pick_count" => pick_count,
      "question_points" => question_points,
      "questions" => assessment_question_bank_id ? [] : quiz_questions.active.map(&:data),
      "assessment_question_bank_id" => assessment_question_bank_id
    }.with_indifferent_access
  end

  def self.update_all_positions!(groups)
    return if groups.empty?

    updates = groups.map do |group|
      "WHEN id=#{group.id.to_i} THEN #{group.position.to_i}"
    end
    set = "position=CASE #{updates.join(" ")} ELSE NULL END"
    where(id: groups).update_all(set)
  end

  private

  def update_quiz
    Quizzes::Quiz.mark_quiz_edited(quiz_id)
  end

  def infer_position
    if !position && quiz
      self.position = quiz.root_entries_max_position + 1
    end
  end

  def set_default_pick_count
    self.pick_count ||= actual_pick_count
  end
end
