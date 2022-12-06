module Quizzes::TakeQuizPresenterCool
  def self.included base
    base.class_eval do
      def resolve_answers(dataset = submission_data)
        # get all the question status-entries and group them by the question id
        answers = dataset.keys.group_by do |k|
          k =~ /question_(\d+)/ ? $1.to_i : :irrelevant
        end

        # remove any non-question keys we've collected
        answers.delete(:irrelevant)

        # discard "marked" or "read" entries
        answers.each_pair do |_, status_entries|
          status_entries.reject! { |status| status =~ /_(marked|read)$/ }
        end

        answers.reject! do |_, status_entries|
          # an answer must not be falsy/empty
          status_entries.any? { |status| dataset[status].blank? }
        end

        answers
      end
    end
  end
end
