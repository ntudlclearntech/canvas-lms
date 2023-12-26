module Quizzes::TakeQuizPresenterCool
  ZEROABLE_QUESTION_TYPES = %w[
    short_answer_question
    fill_in_multiple_blanks_question
    numerical_question
    calculated_question
    essay_question
  ].freeze

  def self.included base

    base.class_eval do
      # Build an optimized set of the so-far answered questions for quick access.
      #
      # The output set will filter out the following:
      #   - any entry that does not contain a "question" phrase
      #   - entries like 'question_x_marked'
      #   - entries like '_question_x_read'
      #   - entries with a value 0
      #   - entries with no value (entry#present? returns false)
      #
      # The output set keys will be the question id (in integer format) and the value
      # is meaningless; if the key exists, then the question is answered.
      def resolve_answers(dataset = submission_data)
        # get all the question status-entries and group them by the question id
        answers = dataset.keys.group_by do |k|
          (k =~ /question_(\d+)/) ? $1.to_i : :irrelevant
        end

        # remove any non-question keys we've collected
        answers.delete(:irrelevant)

        # discard "marked" or "read" entries
        answers.each_pair do |_, status_entries|
          status_entries.reject! { |status| status =~ /_(marked|read)$/ }
        end

        answers.reject! do |_, status_entries|
          # an answer must not be falsy/empty
          question_not_blank?(status_entries, dataset) ||
            # for non-zeroable question types, all zeroes for an answer is a no-answer
            non_zeroable_question_not_answered?(status_entries, dataset)

        end

        answers
      end

      private

      def question_not_blank?(status_entries, dataset)
        status_entries.all? do |status|
          answer = dataset[status]
          answer.is_a?(Array) ? (answer.all? { _1.blank? }) : (answer.blank?)
        end
      end

      def non_zeroable_question_not_answered?(status_entries, dataset)
        status_entries.all? do |status|
          answer = dataset[status]
          ZEROABLE_QUESTION_TYPES.exclude?(question_type(status, dataset)) && answer == "0"
        end
      end

      def question_type(status, dataset)
        if question_types = dataset["question_types"]
          question_type_key = status.match(/question_\d+/)&.send("[]", 0)
          question_types[question_type_key]
        end
      end
    end
  end
end
