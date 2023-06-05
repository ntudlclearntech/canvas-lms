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

# A little note about QuizQuestions: they could be auto-generated by an
# AssessmentQuestion that belongs to a Bank. This happens when we're pulling
# out a certain question for the first time out of a bank (during submission
# generation, usually) in which case the callbacks that are normally necessary
# to do the wiring between the QQ and its source AQ are skipped entirely - keep
# this in mind if you're adding any new callbacks to the class.
#
# Also, generated QuizQuestions may not edit their source AssessmentQuestions.
#
# @see AssessmentQuestion#create_quiz_question()
# @see AssessmentQuestionBank#select_for_submission()
class Quizzes::QuizQuestion < ActiveRecord::Base
  extend RootAccountResolver
  self.table_name = "quiz_questions"

  include Workflow

  attr_readonly :quiz_id
  belongs_to :quiz, class_name: "Quizzes::Quiz", inverse_of: :quiz_questions
  belongs_to :assessment_question
  belongs_to :quiz_group, class_name: "Quizzes::QuizGroup"

  Q_TEXT_ONLY = "text_only_question"
  Q_FILL_IN_MULTIPLE_BLANKS = "fill_in_multiple_blanks_question"
  Q_MULTIPLE_DROPDOWNS = "multiple_dropdowns_question"
  Q_CALCULATED = "calculated_question"

  before_save :validate_blank_questions
  before_save :infer_defaults
  before_save :create_assessment_question, unless: :generated?
  before_destroy :delete_assessment_question, unless: :generated?
  before_destroy :update_quiz
  validates :quiz_id, presence: true
  serialize :question_data
  after_save :update_quiz

  resolves_root_account through: :quiz

  include MasterCourses::CollectionRestrictor
  self.collection_owner_association = :quiz
  restrict_columns :content, %i[question_data position quiz_group_id workflow_state]

  workflow do
    state :active
    state :deleted
    # generated from an AssessmentQuestion inside a question bank
    state :generated
  end

  scope :active, -> { where("workflow_state='active' OR workflow_state IS NULL") }
  scope :generated, -> { where(workflow_state: "generated") }
  scope :not_deleted, -> { where.not(workflow_state: "deleted").or(where(workflow_state: nil)) }

  def infer_defaults
    if !position && quiz
      self.position = if quiz_group
                        (quiz_group.quiz_questions.active.filter_map(&:position).max || 0) + 1
                      else
                        quiz.root_entries_max_position + 1
                      end
    end
  end

  protected :infer_defaults

  def update_quiz
    Quizzes::Quiz.mark_quiz_edited(quiz_id)
  end

  def check_restrictions?
    !generated? # allow updating through the bank even though it's technically locked... shhh don't tell anybody
  end

  # @param [Hash] data
  # @param [String] data[:regrade_option]
  #  If present, the question will be regraded.
  #  You must also pass in data[:regrade_user] if you pass this option.
  #
  #  See Quizzes::QuizRegrader::Answer::REGRADE_OPTIONS for a rundown of the
  #  possible values for this parameter.
  #
  # @param [User] data[:regrade_user]
  #  The user/teacher who's performing the regrade (e.g, updating the question).
  #  Note that this is NOT an id, but an actual instance of a User model.
  def question_data=(in_data)
    data = case in_data
           when String
             ActiveSupport::JSON.decode(in_data)
           when Hash
             in_data.with_indifferent_access
           else
             in_data
           end

    if valid_regrade_option?(data[:regrade_option])
      update_question_regrade(data[:regrade_option], data[:regrade_user])
    end

    return if data == question_data

    data = AssessmentQuestion.parse_question(data, assessment_question)
    data[:name] = data[:question_name]

    write_attribute(:question_data, data.to_hash)
  end

  def question_data
    if (data = read_attribute(:question_data)) && data.instance_of?(Hash)
      write_attribute(:question_data, data.with_indifferent_access)
      data = read_attribute(:question_data)
    end

    unless data.is_a?(Quizzes::QuizQuestion::QuestionData)
      data = Quizzes::QuizQuestion::QuestionData.new(data || ActiveSupport::HashWithIndifferentAccess.new)
    end

    unless data[:id].present? && !id
      data[:id] = id
    end

    data
  end

  def assessment_question=(aq)
    self.assessment_question_version = aq.version_number
    super aq
  end

  def delete_assessment_question
    if assessment_question&.editable_by?(self)
      assessment_question.destroy
    end
  end

  def create_assessment_question
    return if question_data&.is_type?(:text_only)

    aq = assessment_question || AssessmentQuestion.new

    if aq.editable_by?(self)
      aq.question_data = question_data
      aq.initial_context = quiz.context if quiz&.context
      aq.save! if aq.new_record?
    end

    self.assessment_question = aq

    true
  end

  def update_assessment_question!(aq, quiz_group_id, duplicate_index)
    if assessment_question_version.blank? || assessment_question_version < aq.version_number
      self.assessment_question = aq
      write_attribute(:question_data, aq.question_data)
    end
    self.quiz_group_id = quiz_group_id
    self.duplicate_index = duplicate_index
    save! if changed?

    self
  end

  def validate_blank_questions
    return if question_data && !(question_data.is_type?(:fill_in_multiple_blanks) || question_data.is_type?(:short_answer))

    qd = question_data
    qd.answers = qd.answers.reject { |answer| answer["text"].empty? }
    self.question_data = qd
    question_data_will_change!
    true
  end

  def clone_for(quiz, dup = nil, **)
    dup ||= Quizzes::QuizQuestion.new
    attributes.except("id", "quiz_id", "quiz_group_id", "question_data").each do |key, val|
      dup.send("#{key}=", val)
    end
    data = question_data || ActiveSupport::HashWithIndifferentAccess.new
    data.delete(:id)
    # if options[:old_context] && options[:new_context]
    #   data = Quizzes::QuizQuestion.migrate_question_hash(data, options)
    # end
    dup.write_attribute(:question_data, data)
    dup.quiz_id = quiz.id
    dup
  end

  # QuizQuestion.data is used when creating and editing a quiz, but
  # once the quiz is "saved" then the "rendered" version of the
  # quiz is stored in Quizzes::Quiz.quiz_data.  Hence, the teacher can
  # be futzing with questions and groups and not affect
  # the quiz, as students see it.
  def data
    res = (question_data || assessment_question.question_data) rescue Quizzes::QuizQuestion::QuestionData.new(ActiveSupport::HashWithIndifferentAccess.new)
    res[:assessment_question_id] = assessment_question_id
    res[:question_name] = t("#quizzes.quiz_question.defaults.question_name", "Question") if res[:question_name].blank?
    res[:id] = id

    res.to_hash
  end

  # All questions will be assigned to the given quiz_group, and will be
  # assigned as part of the root quiz if no group is given
  def self.update_all_positions!(questions, quiz_group = nil)
    return if questions.empty?

    group_id = quiz_group ? quiz_group.id : "NULL"
    updates = questions.map do |q|
      "WHEN id=#{q.id.to_i} THEN #{q.position.to_i}"
    end

    set = "quiz_group_id=#{group_id}, position=CASE #{updates.join(" ")} ELSE id END"
    where(id: questions).update_all(set)
  end

  alias_method :destroy_permanently!, :destroy

  def destroy
    self.workflow_state = "deleted"
    save
  end

  private

  def valid_regrade_option?(option)
    Quizzes::QuizRegrader::Answer::REGRADE_OPTIONS.include?(option)
  end

  def update_question_regrade(regrade_option, regrade_user)
    regrade = Quizzes::QuizRegrade.where(quiz_id: quiz.id, quiz_version: quiz.version_number).first_or_initialize
    if regrade.new_record?
      regrade.user = regrade_user
      regrade.save!
    end

    question_regrade = Quizzes::QuizQuestionRegrade.where(quiz_question_id: id, quiz_regrade_id: regrade.id).first_or_initialize
    question_regrade.quiz_regrade = regrade
    question_regrade.regrade_option = regrade_option
    question_regrade.save!
  end
end
