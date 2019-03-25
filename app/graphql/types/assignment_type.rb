#
# Copyright (C) 2018 - present Instructure, Inc.
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

module Types
  class AssignmentType < ApplicationObjectType
    graphql_name "Assignment"

    implements GraphQL::Types::Relay::Node
    implements Interfaces::TimestampInterface
    implements Interfaces::ModuleItemInterface

    alias :assignment :object

    class AssignmentStateType < Types::BaseEnum
      graphql_name "AssignmentState"
      description "States that an Assignment can be in"
      value "unpublished"
      value "published"
      value "deleted"
    end

    GRADING_TYPES = Hash[
      Assignment::ALLOWED_GRADING_TYPES.zip(Assignment::ALLOWED_GRADING_TYPES)
    ]

    SUBMISSION_TYPES = %w[
      attendance
      discussion_topic
      external_tool
      media_recording
      none
      not_graded
      on_paper
      online_quiz
      online_text_entry
      online_upload
      online_url
      wiki_page
    ].to_set

    class AssignmentSubmissionType < Types::BaseEnum
      graphql_name "SubmissionType"
      description "Types of submissions an assignment accepts"
      SUBMISSION_TYPES.each { |submission_type|
        value(submission_type)
      }
    end

    class AssignmentGradingType < Types::BaseEnum
      graphql_name "GradingType"
      Assignment::ALLOWED_GRADING_TYPES.each { |type| value(type) }
    end

    class AssignmentPeerReviews < ApplicationObjectType
      graphql_name "PeerReviews"
      description "Settings for Peer Reviews on an Assignment"

      field :enabled, Boolean,
        "Boolean indicating if peer reviews are required for this assignment",
        method: :peer_reviews, null: true
      field :count, Int,
        "Integer representing the amount of reviews each user is assigned.",
        method: :peer_review_count, null: true
      field :due_at, DateTimeType,
        "Date and Time representing when the peer reviews are due",
        method: :peer_reviews_due_at, null: true
      field :intra_reviews, Boolean,
        "Boolean representing whether or not members from within the same group on a group assignment can be assigned to peer review their own group's work",
        method: :intra_group_peer_reviews, null: true
      field :anonymous_reviews, Boolean,
        "Boolean representing whether or not peer reviews are anonymous",
        method: :anonymous_peer_reviews, null: true
      field :automatic_reviews, Boolean,
        "Boolean indicating peer reviews are assigned automatically. If false, the teacher is expected to manually assign peer reviews.",
        method: :automatic_peer_reviews, null: true
    end

    class AssignmentModeratedGrading < ApplicationObjectType
      graphql_name "ModeratedGrading"
      description "Settings for Moderated Grading on an Assignment"

      field :enabled, Boolean,
        "Boolean indicating if the assignment is moderated.",
        method: :moderated_grading, null: true
      field :grader_count, Int,
        "The maximum number of provisional graders who may issue grades for this assignment.",
        null: true
      field :grader_comments_visible_to_graders, Boolean,
        "Boolean indicating if provisional graders' comments are visible to other provisional graders.",
        null: true
      field :grader_names_visible_to_final_grader, Boolean,
        "Boolean indicating if provisional graders' identities are hidden from other provisional graders.",
        null: true
      field :graders_anonymous_to_graders, Boolean,
        "Boolean indicating if provisional grader identities are visible to the final grader.",
        null: true

      field :final_grader, UserType,
        "The user of the grader responsible for choosing final grades for this assignment.",
        null: true
      def final_grader
        Loaders::IDLoader.for(User).load(object.final_grader_id)
      end
    end

    global_id_field :id
    field :_id, ID, "legacy canvas id", null: false, method: :id

    field :name, String, null: true

    field :position, Int,
      "determines the order this assignment is displayed in in its assignment group",
      null: true
    field :points_possible, Float, "the assignment is out of this many points",
      null: true
    field :due_at, DateTimeType,
      "when this assignment is due",
      null: true
    def due_at
      overridden_field(:due_at)
    end

    field :lock_at, DateTimeType,
      "the lock date (assignment is locked after this date).",
      null: true
    def lock_at
      overridden_field(:lock_at)
    end

    field :unlock_at, DateTimeType,
      "the unlock date (assignment is unlocked after this date)",
      null: true
    def unlock_at
      overridden_field(:unlock_at)
    end

    ##
    # use this method to get overridden dates
    # (all_day_date/all_day  should use this if/when we add them to gql)
    def overridden_field(field)
      load_association(:assignment_overrides).then do
        OverrideAssignmentLoader.for(current_user).load(assignment).then &field
      end
    end

    class OverrideAssignmentLoader < GraphQL::Batch::Loader
      def initialize(current_user)
        @current_user = current_user
      end

      def perform(assignments)
        assignments.each do |assignment|
          fulfill(assignment, assignment.overridden_for(@current_user))
        end
      end
    end

    field :lock_info, LockInfoType, null: true

    field :post_to_sis, Boolean,
      "present if Sync Grades to SIS feature is enabled",
      null: true

    field :peer_reviews, AssignmentPeerReviews, null: true
    def peer_reviews
      assignment
    end

    field :moderated_grading, AssignmentModeratedGrading, null: true
    def moderated_grading
      assignment
    end

    field :anonymous_grading, Boolean,
      null: true
    field :omit_from_final_grade, Boolean,
      "If true, the assignment will be omitted from the student's final grade",
      null: true
    field :anonymous_instructor_annotations, Boolean, null: true
    field :has_submitted_submissions, Boolean,
      "If true, the assignment has been submitted to by at least one student",
      method: :has_submitted_submissions?, null: true
    field :can_duplicate, Boolean, method: :can_duplicate?, null: true

    field :grade_group_students_individually, Boolean,
      "If this is a group assignment, boolean flag indicating whether or not students will be graded individually.",
      null: true

    field :time_zone_edited, String, null: true
    field :in_closed_grading_period, Boolean, method: :in_closed_grading_period?, null: true
    field :anonymize_students, Boolean, method: :anonymize_students?, null: true
    field :submissions_downloads, Int, null: true
    field :expects_submission, Boolean, method: :expects_submission?, null: true
    field :expects_external_submission, Boolean, method: :expects_external_submission?, null: true
    field :non_digital_submission, Boolean, method: :non_digital_submission?, null: true
    field :allow_google_docs_submission, Boolean, method: :allow_google_docs_submission?, null: true

    field :due_date_required, Boolean, method: :due_date_required?, null: true
    field :can_unpublish, Boolean, method: :can_unpublish?, null: true

    field :rubric, RubricType, null: true

    def lock_info
      load_locked_for { |lock_info| lock_info || {} }
    end

    def load_locked_for
      Promise.all([
        load_association(:context),
        load_association(:discussion_topic),
        load_association(:quiz),
        load_association(:wiki_page),
      ]).then do
        yield assignment.low_level_locked_for?(current_user,
                                               check_policies: true,
                                               context: assignment.context)
      end
    end

    field :allowed_attempts, Int,
      "The number of submission attempts a student can make for this assignment. null implies unlimited.",
      null: true

    def allowed_attempts
      return nil if assignment.allowed_attempts.nil? || assignment.allowed_attempts <= 0
      assignment.allowed_attempts
    end

    field :allowed_extensions, [String],
      "permitted uploaded file extensions (e.g. ['doc', 'xls', 'txt'])",
      null: true

    field :muted, Boolean, method: :muted?, null: false

    field :state, AssignmentStateType, method: :workflow_state, null: false

    field :quiz, Types::QuizType, null: true
    def quiz
      load_association(:quiz)
    end

    field :discussion, Types::DiscussionType, null: true
    def discussion
      load_association(:discussion_topic)
    end

    field :html_url, UrlType, null: true
    def html_url
      GraphQLHelpers::UrlHelpers.course_assignment_url(
        course_id: assignment.context_id,
        id: assignment.id,
        host: context[:request].host_with_port
      )
    end

    class AttachmentPreloader < GraphQL::Batch::Loader
      def initialize(context)
        @context = context
      end

      def perform(htmls)
        as = Api.api_bulk_load_user_content_attachments(htmls, @context)
        htmls.each { |html| fulfill(html, as) }
      end
    end

    field :description, String, null: true
    def description
      return nil if assignment.description.blank?

      load_locked_for do |lock_info|
        # some (but not all) locked assignments allow viewing the description
        next nil if lock_info && !assignment.include_description?(current_user, lock_info)
        AttachmentPreloader.for(assignment.context).load(assignment.description).then do |preloaded_attachments|

            GraphQLHelpers::UserContent.process(assignment.description,
                                                request: context[:request],
                                                context: assignment.context,
                                                user: current_user,
                                                in_app: context[:in_app],
                                                preloaded_attachments: preloaded_attachments)
        end
      end
    end

    field :needs_grading_count, Int, null: true
    def needs_grading_count
      return unless assignment.context.grants_right?(current_user, :manage_grades)
      # NOTE: this query (as it exists right now) is not batch-able.
      # make this really expensive cost-wise?
      Assignments::NeedsGradingCountQuery.new(
        assignment,
        current_user
        # TODO course proxy stuff
        # (actually for some reason not passing along a course proxy doesn't
        # seem to matter)
      ).count
    end

    field :grading_type, AssignmentGradingType, null: true
    def grading_type
      GRADING_TYPES[assignment.grading_type]
    end

    field :submission_types, [AssignmentSubmissionType],
      null: true
    def submission_types
      # there's some weird data in the db so we'll just ignore anything that
      # doesn't match a value that is expected
      (SUBMISSION_TYPES & assignment.submission_types_array).to_a
    end

    field :course, Types::CourseType, null: true
    def course
      load_association(:context)
    end

    field :assignment_group, AssignmentGroupType, null: true
    def assignment_group
      load_association(:assignment_group)
    end

    field :only_visible_to_overrides, Boolean,
      "specifies that this assignment is only assigned to students for whom an
       `AssignmentOverride` applies.",
      null: false

    field :assignment_overrides, AssignmentOverrideType.connection_type,
      null: true
    def assignment_overrides
        # this is the assignment overrides index method of loading
        # overrides... there's also the totally different method found in
        # assignment_overrides_json. they may not return the same results?
        # ¯\_(ツ)_/¯
        AssignmentOverrideApplicator.overrides_for_assignment_and_user(assignment, current_user)
    end

    field :group_set, GroupSetType, null: true
    def group_set
      load_association(:group_category)
    end

    field :submissions_connection, SubmissionType.connection_type, null: true do
      description "submissions for this assignment"
      argument :filter, SubmissionFilterInputType, required: false
    end
    def submissions_connection(filter: nil)
      filter ||= {}
      course = assignment.context

      submissions = assignment.submissions.where(
        workflow_state: filter[:states] || DEFAULT_SUBMISSION_STATES
      )

      if filter[:section_ids].present?
        sections = course.course_sections.where(id: filter[:section_ids])
        student_ids = course.student_enrollments.where(course_section: sections).pluck(:user_id)
        submissions = submissions.where(user_id: student_ids)
      end

      if course.grants_any_right?(current_user, session, :manage_grades, :view_all_grades)
        submissions
      elsif course.grants_right?(current_user, session, :read_grades)
        # a user can see their own submission
        submissions.where(user_id: current_user.id)
      end
    end

    field :post_policy, PostPolicyType, null: true
    def post_policy
      load_association(:context).then do |course|
        if course.grants_right?(current_user, :manage_grades)
          load_association(:post_policy)
        end
      end
    end
  end
end
