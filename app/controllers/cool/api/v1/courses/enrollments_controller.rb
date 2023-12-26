module Cool::Api::V1
  class Courses::EnrollmentsController < ApplicationController
    def set_override_score
      course = Course.find(params[:course_id])
      requested_enrollment = course.all_enrollments.find(params[:id])
      current_enrollments = StudentEnrollment
                              .active
                              .where(
                                course: requested_enrollment.course_id,
                                user: requested_enrollment.user_id
                              )

      return_value = nil

      if current_enrollments.empty?
        render json: { error: 'enrollment not found' }, status: :not_found
        return
      end

      Enrollment.transaction do
        current_enrollments.each do |enrollment|
          if !enrollment.course.grants_right?(@current_user, session, :manage_grades)
            render json: { error: 'user is not allowed to manage grades of this course' }, status: :forbidden
            return
          end

          score = enrollment.update_override_score(
            grading_period_id: params[:grading_period_id],
            override_score: params[:override_score],
            updating_user: @current_user,
            record_grade_change: enrollment == requested_enrollment
          )

          next unless enrollment == requested_enrollment

          return_value = score.valid? ? grades_json(enrollment, @current_user, session) : errors_for(score)
        end

        render json: return_value
      end
    end
  end
end
