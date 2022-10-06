# frozen_string_literal: true

#
# Copyright (C) 2022 - present Instructure, Inc.
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

require_relative "../spec_helper"
require_relative "../support/request_helper"

describe "Student Enrollment Paces API" do
  let(:teacher_enrollment) { course_with_teacher(active_all: true) }
  let(:course) { teacher_enrollment.course }
  let(:teacher) { teacher_enrollment.user }
  let(:student) { user_model(name: "Foo Bar") }
  let(:student_enrollment) { course.enroll_student(student, enrollment_state: "active") }

  before do
    Account.site_admin.enable_feature!(:course_paces_redesign)
    user_session(teacher)
  end

  def assert_grant_check
    user_session(student)
    yield
    expect(response.status).to eq 401
  end

  describe "index" do
    let!(:student_pace) { student_enrollment_pace_model(student_enrollment: student_enrollment) }

    before do
      course_pace_model(course: course)
    end

    it "returns relevant paces" do
      get api_v1_student_enrollment_paces_path(course.id), params: { format: :json }
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(
        json["paces"].map { |p| p["id"] }
      ).to match_array(
        [student_pace.id]
      )
      pace_json = json["paces"].first
      expect(pace_json["student"]["name"]).to eq student.name
    end

    it "returns a 401 if the user lacks permissions" do
      assert_grant_check { get api_v1_student_enrollment_paces_path(course.id), params: { format: :json } }
    end
  end

  describe "show" do
    it "returns the pace for the requested student enrollment" do
      student_pace = student_enrollment_pace_model(student_enrollment: student_enrollment)
      Progress.create!(context: student_pace, tag: "course_pace_publish")
      get api_v1_student_enrollment_pace_path(course.id, student_enrollment.id), params: { format: :json }
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["pace"]["id"]).to eq student_pace.id
    end

    context "the student enrollment belongs to a section" do
      let(:section) { add_section("Section One", course: course) }
      let(:student_enrollment) { multiple_student_enrollment(student, section, course: course) }

      context "the section has a pace" do
        before { section_pace_model(section: section, workflow_state: "published") }

        it "falls back to the section pace" do
          get api_v1_student_enrollment_pace_path(course.id, student_enrollment.id), params: { format: :json }
          expect(response.status).to eq 200
          json = JSON.parse(response.body)
          expect(json["pace"]["id"]).to eq nil
          expect(json["pace"]["workflow_state"]).to eq "unpublished"
        end
      end

      context "the section does not have a pace, but the course does" do
        before { course_pace_model(course: course, workflow_state: "published") }

        it "falls back to the course pace" do
          get api_v1_student_enrollment_pace_path(course.id, student_enrollment.id), params: { format: :json }
          expect(response.status).to eq 200
          json = JSON.parse(response.body)
          expect(json["pace"]["id"]).to eq nil
          expect(json["pace"]["workflow_state"]).to eq "unpublished"
        end
      end

      context "neither the section nor the course have a pace" do
        it "returns a 404" do
          get api_v1_student_enrollment_pace_path(course.id, student_enrollment.id), params: { format: :json }
          expect(response.status).to eq 404
        end
      end
    end

    context "the student enrollment does not belong to a section" do
      context "the course has a pace" do
        before { course_pace_model(course: course, workflow_state: "published") }

        it "falls back to the course pace" do
          get api_v1_student_enrollment_pace_path(course.id, student_enrollment.id), params: { format: :json }
          expect(response.status).to eq 200
          json = JSON.parse(response.body)
          expect(json["pace"]["id"]).to eq nil
          expect(json["pace"]["workflow_state"]).to eq "unpublished"
        end
      end

      context "the course does not have a pace" do
        it "returns a 404" do
          get api_v1_student_enrollment_pace_path(course.id, student_enrollment.id), params: { format: :json }
          expect(response.status).to eq 404
        end
      end
    end

    it "returns a 401 if the user lacks permissions" do
      assert_grant_check { get api_v1_student_enrollment_pace_path(course.id, student_enrollment.id), params: { format: :json } }
    end
  end

  describe "create" do
    it "creates a pace for the specified student enrollment" do
      expect do
        post api_v1_new_student_enrollment_pace_path(course, student_enrollment), params: { format: :json }
      end.to change {
        student_enrollment.course_paces.reload.count
      }.by(1)
        .and change { Progress.count }.by(1)
      expect(Progress.last.queued?).to be_truthy
      expect(response.status).to eq 201
      json = JSON.parse(response.body)
      expect(json["pace"]["student"]["name"]).to eq student.name
      expect(json["progress"]["context_id"]).to eq(CoursePace.last.id)
      expect(json["progress"]["tag"]).to eq("course_pace_publish")
    end

    context "when the student enrollment already has a pace" do
      let!(:student_pace) { student_enrollment_pace_model(student_enrollment: student_enrollment) }

      it "returns the existing pace" do
        expect do
          post api_v1_new_student_enrollment_pace_path(course, student_enrollment), params: { format: :json }
        end.to not_change {
          student_enrollment.course_paces.reload.count
        }
        expect(response.status).to eq 201
        json = JSON.parse(response.body)
        expect(json["pace"]["id"]).to eq student_pace.id
        expect(json["progress"]["context_id"]).to eq(CoursePace.last.id)
        expect(json["progress"]["tag"]).to eq("course_pace_publish")
      end
    end

    it "returns a 401 if the user lacks permissions" do
      assert_grant_check { post api_v1_new_student_enrollment_pace_path(course, student_enrollment), params: { format: :json } }
    end
  end

  describe "update" do
    let!(:student_pace) { student_enrollment_pace_model(student_enrollment: student_enrollment) }

    it "updates the pace" do
      expect do
        patch api_v1_patch_student_enrollment_pace_path(course, student_enrollment), params: {
          format: :json,
          pace: {
            exclude_weekends: false
          }
        }
      end.to change { student_pace.reload.exclude_weekends }
        .to(false)
        .and change { Progress.count }.by(1)
      expect(Progress.last.queued?).to be_truthy
      expect(response.status).to eq 200
    end

    it "handles invalid update parameters" do
      allow_any_instance_of(CoursePace).to receive(:update).and_return(false)
      patch api_v1_patch_student_enrollment_pace_path(course, student_enrollment), params: {
        format: :json,
        pace: {
          exclude_weekends: "foobar"
        }
      }
      expect(response.status).to eq 422
    end

    it "returns a 401 if the user lacks permissions" do
      assert_grant_check do
        patch api_v1_patch_student_enrollment_pace_path(course, student_enrollment), params: {
          format: :json,
          pace: {
            exclude_weekends: false
          }
        }
      end
    end
  end

  describe "delete" do
    it "marks the pace as deleted" do
      pace = student_enrollment_pace_model(student_enrollment: student_enrollment)

      expect do
        delete api_v1_delete_student_enrollment_pace_path(course, student_enrollment), params: { format: :json }
      end.to change {
        pace.reload.workflow_state
      }.from("active").to("deleted")
      expect(response.status).to eq 204
    end

    it "returns 404 if the student enrollment does not have a pace" do
      delete api_v1_delete_student_enrollment_pace_path(course, student_enrollment), params: { format: :json }
      expect(response.status).to eq 404
    end

    it "returns a 401 if the user lacks permissions" do
      assert_grant_check { delete api_v1_delete_student_enrollment_pace_path(course, student_enrollment), params: { format: :json } }
    end
  end

  context "course_paces_redesign flag is disabled" do
    before do
      Account.site_admin.disable_feature!(:course_paces_redesign)
    end

    describe "index" do
      before do
        student_enrollment_pace_model(student_enrollment: student_enrollment)
      end

      it "returns 404" do
        get api_v1_student_enrollment_paces_path(course), params: { format: :json }
        expect(response.status).to eq 404
      end
    end

    describe "show" do
      before do
        student_enrollment_pace_model(student_enrollment: student_enrollment)
      end

      it "returns 404" do
        get api_v1_student_enrollment_pace_path(course, student_enrollment), params: { format: :json }
        expect(response.status).to eq 404
      end
    end

    describe "create" do
      it "returns 404" do
        post api_v1_new_student_enrollment_pace_path(course, student_enrollment), params: { format: :json }
        expect(response.status).to eq 404
      end
    end

    describe "update" do
      before { student_enrollment_pace_model(student_enrollment: student_enrollment) }

      it "returns 404" do
        patch api_v1_patch_student_enrollment_pace_path(course, student_enrollment), params: {
          format: :json,
          pace: {
            exclude_weekends: false
          }
        }
        expect(response.status).to eq 404
      end
    end

    describe "delete" do
      before { student_enrollment_pace_model(student_enrollment: student_enrollment) }

      it "returns 404" do
        delete api_v1_delete_student_enrollment_pace_path(course, student_enrollment), params: { format: :json }
        expect(response.status).to eq 404
      end
    end
  end
end
