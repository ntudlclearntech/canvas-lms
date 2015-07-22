require_relative 'helpers/quiz_questions_common'

describe 'One Question at a Time Quizzes as a student' do

  include_examples 'quiz question selenium tests'

  before(:each) do
    create_oqaat_quiz(publish: true)
    user_session(@student)
  end

  it 'saves answers and grades the quiz', priority: "1", test_id: 209369 do
    take_the_quiz
    answers_flow
  end

  it 'displays one question at a time', priority: "1", test_id: 209370 do
    take_the_quiz
    back_and_forth_flow
  end

  it 'warns about submitting unanswered questions',
  priority: "1", test_id: 209371 do
    take_the_quiz
    submit_unfinished_quiz("You have 3 unanswered questions")
  end
end