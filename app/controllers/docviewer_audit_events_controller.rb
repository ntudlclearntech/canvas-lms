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

class DocviewerAuditEventsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :check_params
  before_action :check_jwt_token

  def create
    submission = Submission.find(params[:submission_id])
    canvadoc = canvadoc_from_submission(submission, params[:document_id])
    assignment = submission.assignment
    user = User.find(params[:canvas_user_id])
    enrollment = user.enrollments.find_by!(course: assignment.course)

    unless assignment.moderated_grading? || assignment.anonymous_grading?
      return render json: {message: 'Assignment is neither anonymous nor moderated'}, status: :not_acceptable
    end

    if assignment.moderated_grading? && !assignment.grades_published? && !enrollment.student_or_fake_student?
      begin
        assignment.ensure_grader_can_adjudicate(grader: user, provisional: true, occupy_slot: true)
      rescue Assignment::MaxGradersReachedError
        return render json: {message: 'Reached maximum number of graders for assignment'}, status: :unauthorized
      end
    end

    event = AnonymousOrModerationEvent.new(
      assignment: assignment,
      canvadoc: canvadoc,
      event_type: 'docviewer_' + params[:event_type],
      payload: {
        annotation_body: params[:annotation_body].permit(:color, :content, :created_at, :modified_at, :page, :type),
        related_annotation_id: params[:related_annotation_id]
      },
      submission: submission,
      user: user
    )

    respond_to do |format|
      if event.save
        return render json: event.as_json, status: :ok
      else
        format.json do
          render json: event.errors.as_json.merge(message: 'Invalid param values'), status: :unprocessable_entity
        end
      end
    end
  end

  private

  def check_jwt_token
      Canvas::Security.decode_jwt(params[:token], [Canvadoc.jwt_secret])
  rescue
      return render json: {message: 'JWT signature invalid'}, status: :unauthorized
  end

  def check_params
    required_params = %i[annotation_body token canvas_user_id document_id event_type related_annotation_id submission_id]

    begin
      params.require(required_params)
    rescue ActionController::ParameterMissing => error
      return render json: {message: error.to_s}, status: :bad_request
    end
  end

  def canvadoc_from_submission(submission, document_id)
    submission.submission_history.reverse_each do |versioned_submission|
      attachments = versioned_submission.versioned_attachments

      attachments.each do |attachment|
        canvadoc = attachment.canvadoc
        return canvadoc if canvadoc&.document_id == document_id
      end
    end

    raise ActiveRecord::RecordNotFound.new('No canvadoc with given document id was found for this submission')
  end
end
