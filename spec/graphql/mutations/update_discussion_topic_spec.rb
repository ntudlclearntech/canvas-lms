# frozen_string_literal: true

#
# Copyright (C) 2021 - present Instructure, Inc.
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

require_relative "../graphql_spec_helper"

RSpec.describe Mutations::UpdateDiscussionTopic do
  before(:once) do
    course_with_teacher(active_all: true)
    @attachment = attachment_with_context(@teacher)
    discussion_topic_model({ context: @course, attachment: @attachment })
  end

  def mutation_str(
    id: nil,
    published: nil,
    locked: nil,
    title: nil,
    message: nil,
    require_initial_post: nil,
    specific_sections: nil,
    delayed_post_at: nil,
    lock_at: nil,
    file_id: nil,
    remove_attachment: nil,
    assignment: nil
  )
    <<~GQL
      mutation {
        updateDiscussionTopic(input: {
          discussionTopicId: #{id}
          #{"published: #{published}" unless published.nil?}
          #{"locked: #{locked}" unless locked.nil?}
          #{"title: \"#{title}\"" unless title.nil?}
          #{"message: \"#{message}\"" unless message.nil?}
          #{"requireInitialPost: #{require_initial_post}" unless require_initial_post.nil?}
          #{"specificSections: \"#{specific_sections}\"" unless specific_sections.nil?}
          #{"delayedPostAt: \"#{delayed_post_at}\"" unless delayed_post_at.nil?}
          #{"lockAt: \"#{lock_at}\"" unless lock_at.nil?}
          #{"removeAttachment: #{remove_attachment}" unless remove_attachment.nil?}
          #{"fileId: #{file_id}" unless file_id.nil?}
          #{assignment_str(assignment)}
        }) {
          discussionTopic {
            _id
            published
            locked
            assignment {
              _id
              pointsPossible
              postToSis
              dueAt
              state
              gradingType
              peerReviews {
                anonymousReviews
                automaticReviews
                count
                dueAt
                enabled
                intraReviews
              }
              assignmentOverrides {
                nodes {
                  _id
                  createdAt
                  dueAt
                  id
                  lockAt
                  title
                  unlockAt
                  updatedAt
                }
              }
            }
          }
        }
      }
    GQL
  end

  new_peer_reviews = {
    enabled: true,
    count: 2,
    dueAt: "2023-01-01T01:00:00Z",
    intraReviews: true,
    anonymousReviews: true,
    automaticReviews: true
  }

  def assignment_str(assignment)
    return "" unless assignment

    args = []
    args << "pointsPossible: #{assignment[:pointsPossible]}" if assignment[:pointsPossible]
    args << "postToSis: #{assignment[:postToSis]}" if assignment.key?(:postToSis)
    args << "assignmentGroupId: \"#{assignment[:assignmentGroupId]}\"" if assignment[:assignmentGroupId]
    args << "dueAt: \"#{assignment[:dueAt]}\"" if assignment[:dueAt]
    args << "state: #{assignment[:state]}" if assignment[:state]
    args << "onlyVisibleToOverrides: #{assignment[:onlyVisibleToOverrides]}" if assignment.key?(:onlyVisibleToOverrides)
    args << "setAssignment: #{assignment[:setAssignment]}" if assignment.key?(:setAssignment)
    args << "gradingType: #{assignment[:gradingType]}" if assignment[:gradingType]
    args << peer_reviews_str(assignment[:peerReviews]) if assignment[:peerReviews]
    args << assignment_overrides_str(assignment[:assignmentOverrides]) if assignment[:assignmentOverrides]

    "assignment: { #{args.join(", ")} }"
  end

  def peer_reviews_str(peer_reviews)
    return "" unless peer_reviews

    args = []
    args << "enabled: #{peer_reviews[:enabled]}" if peer_reviews.key?(:enabled)
    args << "count: #{peer_reviews[:count]}" if peer_reviews[:count]
    args << "dueAt: \"#{peer_reviews[:dueAt]}\"" if peer_reviews[:dueAt]
    args << "intraReviews: #{peer_reviews[:intraReviews]}" if peer_reviews.key?(:intraReviews)
    args << "anonymousReviews: #{peer_reviews[:anonymousReviews]}" if peer_reviews.key?(:anonymousReviews)
    args << "automaticReviews: #{peer_reviews[:automaticReviews]}" if peer_reviews.key?(:automaticReviews)

    "peerReviews: { #{args.join(", ")} }"
  end

  def assignment_overrides_str(overrides)
    return "" unless overrides

    args = []
    args << "sectionId: \"#{overrides[:sectionId]}\"" if overrides[:sectionId]
    args << "studentIds: [\"#{overrides[:studentIds].join('", "')}\"]" if overrides[:studentIds]
    # Add other override input fields if you want to test them

    "assignmentOverrides: { #{args.join(", ")} }"
  end

  def run_mutation(opts = {}, current_user = @teacher)
    result = CanvasSchema.execute(
      mutation_str(**opts),
      context: {
        current_user:,
        domain_root_account: @course.account.root_account,
        request: ActionDispatch::TestRequest.create
      }
    )
    result.to_h.with_indifferent_access
  end

  it "updates the discussion topic" do
    delayed_post_at = 5.days.from_now.iso8601
    lock_at = 10.days.from_now.iso8601

    updated_params = {
      id: @topic.id,
      title: "Updated Title",
      message: "Updated Message",
      require_initial_post: true,
      specific_sections: "all",
      delayed_post_at: delayed_post_at.to_s,
      lock_at: lock_at.to_s
    }
    result = run_mutation(updated_params)

    expect(result["errors"]).to be_nil
    @topic.reload
    expect(@topic.title).to eq "Updated Title"
    expect(@topic.message).to eq "Updated Message"
    expect(@topic.require_initial_post).to be true
    expect(@topic.is_section_specific).to be false
    expect(@topic.delayed_post_at).to eq delayed_post_at
    expect(@topic.lock_at).to eq lock_at
  end

  context "attachments" do
    it "removes a discussion topic attachment" do
      expect(@topic.attachment).to eq(@attachment)
      result = run_mutation({ id: @topic.id, remove_attachment: true })

      expect(result["errors"]).to be_nil
      expect(@topic.reload.attachment).to be_nil
    end

    it "replaces a discussion topic attachment" do
      attachment = attachment_with_context(@teacher)
      attachment.update!(user: @teacher)
      result = run_mutation({ id: @topic.id, file_id: attachment.id })

      expect(result["errors"]).to be_nil
      expect(@topic.reload.attachment_id).to eq attachment.id
    end
  end

  it "publishes the discussion topic" do
    @topic.unpublish!
    expect(@topic.published?).to be false
    expected_title = @topic.title

    result = run_mutation({ id: @topic.id, published: true })
    expect(result["errors"]).to be_nil
    expect(result.dig("data", "updateDiscussionTopic", "discussionTopic", "published")).to be true
    @topic.reload
    expect(@topic.published?).to be true
    expect(@topic.title).to eq expected_title
  end

  it "unpublishes the discussion topic" do
    @topic.publish!
    expect(@topic.published?).to be true

    result = run_mutation({ id: @topic.id, published: false })
    expect(result["errors"]).to be_nil
    expect(result.dig("data", "updateDiscussionTopic", "discussionTopic", "published")).to be false
    @topic.reload
    expect(@topic.published?).to be false
  end

  it "locks the discussion topic" do
    expect(@topic.locked).to be false

    result = run_mutation(id: @topic.id, locked: true)
    expect(result["errors"]).to be_nil
    expect(result.dig("data", "updateDiscussionTopic", "discussionTopic", "locked")).to be true
    expect(@topic.reload.locked).to be true
  end

  it "unlocks the discussion topic" do
    @topic.lock!
    expect(@topic.locked).to be true

    result = run_mutation(id: @topic.id, locked: false)
    expect(result["errors"]).to be_nil
    expect(result.dig("data", "updateDiscussionTopic", "discussionTopic", "locked")).to be false
    expect(@topic.reload.locked).to be false
  end

  context "discussion assignment" do
    before do
      @discussion_assignment = @course.assignments.create!(
        title: "Graded Topic 1",
        submission_types: "discussion_topic",
        post_to_sis: false,
        grading_type: "points",
        points_possible: 5,
        due_at: 3.months.from_now,
        peer_reviews: false
      )
      @topic = @discussion_assignment.discussion_topic
    end

    it "can set all new inputs at once" do
      new_points_possible = 100
      new_post_to_sis = true
      new_grading_type = "pass_fail"
      new_due_date = Time.now.utc.iso8601

      assignment_group = @course.assignment_groups.create!(name: "Test Group")
      new_assignment_group_id = assignment_group.id

      new_peer_reviews = {
        enabled: true,
        count: 2,
        dueAt: "2023-01-01T01:00:00Z",
        intraReviews: true,
        anonymousReviews: true,
        automaticReviews: true
      }

      result = run_mutation(id: @topic.id, assignment: { pointsPossible: new_points_possible,
                                                         postToSis: new_post_to_sis,
                                                         assignmentGroupId: new_assignment_group_id,
                                                         gradingType: new_grading_type,
                                                         peerReviews: new_peer_reviews,
                                                         dueAt: new_due_date, })

      expect(result["errors"]).to be_nil

      # Check response from graphql
      new_assignment = result["data"]["updateDiscussionTopic"]["discussionTopic"]["assignment"]

      expect(new_assignment["pointsPossible"]).to eq(new_points_possible)
      expect(new_assignment["postToSis"]).to eq(new_post_to_sis)
      expect(new_assignment["gradingType"]).to eq(new_grading_type)
      expect(new_assignment["state"]).to eq(@discussion_assignment.state.to_s)
      expect(new_assignment["dueAt"]).to eq(new_due_date)

      expect(new_assignment["peerReviews"]["enabled"]).to eq(new_peer_reviews[:enabled])
      expect(new_assignment["peerReviews"]["count"]).to eq(new_peer_reviews[:count])
      expect(new_assignment["peerReviews"]["dueAt"]).to eq(new_peer_reviews[:dueAt])
      expect(new_assignment["peerReviews"]["intraReviews"]).to eq(new_peer_reviews[:intraReviews])
      expect(new_assignment["peerReviews"]["anonymousReviews"]).to eq(new_peer_reviews[:anonymousReviews])
      expect(new_assignment["peerReviews"]["automaticReviews"]).to eq(new_peer_reviews[:automaticReviews])

      # Check updated object
      new_assignment = Assignment.find(@discussion_assignment.id)
      expect(new_assignment.points_possible).to eq(new_points_possible)
      expect(new_assignment.post_to_sis).to eq(new_post_to_sis)
      expect(new_assignment.grading_type).to eq(new_grading_type)
      expect(new_assignment.state).to eq(@discussion_assignment.state)

      expect(new_assignment.peer_reviews).to eq(new_peer_reviews[:enabled])
      expect(new_assignment.peer_review_count).to eq(new_peer_reviews[:count])
      expect(new_assignment.peer_reviews_due_at.utc.strftime("%FT%TZ")).to eq(new_peer_reviews[:dueAt])
      expect(new_assignment.automatic_peer_reviews).to eq(new_peer_reviews[:automaticReviews])
      expect(new_assignment.anonymous_peer_reviews).to eq(new_peer_reviews[:anonymousReviews])
      expect(new_assignment.intra_group_peer_reviews).to eq(new_peer_reviews[:intraReviews])
    end

    it "sets just the due date" do
      new_due_date = Time.now.utc.iso8601
      result = run_mutation(id: @topic.id, assignment: { dueAt: new_due_date })
      expect(result["errors"]).to be_nil

      updated_assignment = Assignment.find(@discussion_assignment.id)
      expect(updated_assignment.due_at.iso8601).to eq(new_due_date)
      expect(updated_assignment.points_possible).to eq(@discussion_assignment.points_possible)
    end

    it "sets due date overrides" do
      student1 = @course.enroll_student(User.create!, enrollment_state: "active").user
      student2 = @course.enroll_student(User.create!, enrollment_state: "active").user
      @course.enroll_student(User.create!, enrollment_state: "active").user

      overrides = {
        studentIds: [student1.id, student2.id]
      }

      result = run_mutation(id: @topic.id, assignment: { assignmentOverrides: overrides, onlyVisibleToOverrides: true })
      expect(result["errors"]).to be_nil

      updated_assignment = Assignment.find(@discussion_assignment.id)

      new_override = updated_assignment.assignment_overrides.first
      expect(updated_assignment.only_visible_to_overrides).to be(true)

      expect(new_override.set_type).to eq("ADHOC")
      expect(new_override.set_id).to be_nil
      expect(new_override.set.map(&:id)).to eq([student1.id, student2.id])
    end

    it "doesn't make a new assignment if set_assignment is false" do
      topic = @course.discussion_topics.create!(title: "Discussion Topic Title", user: @teacher)
      result = run_mutation(id: topic.id, assignment: { setAssignment: false })
      expect(result["errors"]).to be_nil
      expect(topic.reload.assignment).to be_nil
    end

    it "can create a new assignment if one didn't exist before" do
      topic = @course.discussion_topics.create!(title: "Discussion Topic Title", user: @teacher)
      new_points_possible = 100
      new_post_to_sis = true
      new_grading_type = "pass_fail"

      result = run_mutation(id: topic.id, assignment: { pointsPossible: new_points_possible, postToSis: new_post_to_sis, gradingType: new_grading_type })
      expect(result["errors"]).to be_nil

      # Verify that the response from graphql is correct
      new_assignment = result["data"]["updateDiscussionTopic"]["discussionTopic"]["assignment"]
      expect(new_assignment["pointsPossible"]).to eq(new_points_possible)
      expect(new_assignment["postToSis"]).to eq(new_post_to_sis)
      expect(new_assignment["gradingType"]).to eq(new_grading_type)

      # Verify that the saved object is correct
      topic.reload
      expect(topic.assignment).to be_present
      updated_assignment = Assignment.find(topic.assignment.id)

      expect(updated_assignment.points_possible).to eq(new_points_possible)
      expect(updated_assignment.post_to_sis).to eq(new_post_to_sis)
      expect(updated_assignment.grading_type.to_s).to eq(new_grading_type)

      # Verify that a new DiscussionTopic wasn't created
      expect(DiscussionTopic.last.id).to eq(topic.id)
    end

    it "can delete and then restore" do
      result = run_mutation(id: @topic.id, assignment: { setAssignment: false })
      expect(result["errors"]).to be_nil

      expect(Assignment.find(@discussion_assignment.id).workflow_state).to eq "deleted"
      expect(@topic.reload.assignment).to be_nil

      result = run_mutation(id: @topic.id, assignment: { setAssignment: true })
      expect(result["errors"]).to be_nil

      expect(Assignment.find(@discussion_assignment.id).workflow_state).to eq "published"
      expect(@topic.reload.assignment).to eq @discussion_assignment.reload

      # Verify that a new DiscussionTopic wasn't created
      expect(DiscussionTopic.last.id).to eq(@topic.id)
    end

    it "can turn graded topic into ungraded section-specific topic in one edit" do
      section1 = @course.course_sections.create!(name: "Section 1")
      @course.course_sections.create!(name: "Section 2")

      result = run_mutation(id: @topic.id, specific_sections: section1.id, assignment: { setAssignment: false })

      expect(result["errors"]).to be_nil
      expect(Assignment.find(@discussion_assignment.id).workflow_state).to eq "deleted"
      expect(@topic.reload.assignment).to be_nil
      expect(@topic.is_section_specific).to be_truthy
    end
  end
end
