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

describe "Pace Contexts API" do
  let(:teacher_enrollment) { course_with_teacher(active_all: true) }
  let(:course) do
    course = teacher_enrollment.course
    course.enable_course_paces = true
    course.save!
    course
  end
  let(:teacher) { teacher_enrollment.user }
  let!(:default_pace) { course_pace_model(course: course) }

  before do
    Account.site_admin.enable_feature!(:course_paces_redesign)
    user_session(teacher)
  end

  describe "index" do
    context "when the course type is specified" do
      it "returns an array containing only the course" do
        get api_v1_pace_contexts_path(course.id), params: { type: "course", format: :json }
        expect(response.status).to eq 200
        json = JSON.parse(response.body)
        expect(json["pace_contexts"].length).to eq 1

        course_json = json["pace_contexts"][0]
        expect(course_json["name"]).to eq course.name
        expect(course_json["type"]).to eq "Course"
        expect(course_json["item_id"]).to eq course.id
        expect(course_json["associated_section_count"]).to eq 1
        expect(course_json["associated_student_count"]).to eq 0

        applied_pace_json = course_json["applied_pace"]
        expect(applied_pace_json["name"]).to eq course.name
        expect(applied_pace_json["type"]).to eq "Course"
        expect(applied_pace_json["duration"]).to eq 0
        expect(Time.parse(applied_pace_json["last_modified"])).to be_within(1.second).of(default_pace.published_at)
      end

      context "when the course does not have a default pace" do
        before { default_pace.destroy! }

        it "returns nil for the applied_pace" do
          get api_v1_pace_contexts_path(course.id), params: { type: "course", format: :json }
          expect(response.status).to eq 200
          json = JSON.parse(response.body)
          expect(json["pace_contexts"][0]["applied_pace"]).to eq nil
        end
      end
    end

    context "when the section type is specified" do
      let!(:section_one) { add_section("Section One", course: course) }

      it "returns an array containing the sections" do
        get api_v1_pace_contexts_path(course.id), params: { type: "section", format: :json }
        expect(response.status).to eq 200
        json = JSON.parse(response.body)
        course.course_sections.each do |section|
          context_json = json["pace_contexts"].detect { |pc| pc["item_id"] == section.id }
          expect(context_json["name"]).to eq section.name
          expect(context_json["applied_pace"]["type"]).to eq "Course"
        end
      end

      it "paginates results" do
        get api_v1_pace_contexts_path(course.id), params: { type: "section", per_page: 1, format: :json }
        expect(response.status).to eq 200
        json = JSON.parse(response.body)
        expect(json["pace_contexts"].count).to eq 1
        expect(json["pace_contexts"][0]["item_id"]).to eq course.default_section.id

        get api_v1_pace_contexts_path(course.id), params: { type: "section", per_page: 1, page: 2, format: :json }
        expect(response.status).to eq 200
        json = JSON.parse(response.body)
        expect(json["pace_contexts"].count).to eq 1
        expect(json["pace_contexts"][0]["item_id"]).to eq section_one.id
      end

      context "when a section has its own pace" do
        before { section_pace_model(section: section_one) }

        it "specifies the correct applied_pace" do
          get api_v1_pace_contexts_path(course.id), params: { type: "section", format: :json }
          expect(response.status).to eq 200
          json = JSON.parse(response.body)
          course.course_sections.each do |section|
            context_json = json["pace_contexts"].detect { |pc| pc["item_id"] == section.id }
            expected_pace_type = section.course_paces.count > 0 ? "Section" : "Course"
            expect(context_json["applied_pace"]["type"]).to eq expected_pace_type
          end
        end
      end

      context "when the default pace doesn't exist" do
        before { default_pace.destroy! }

        it "returns nil for the applied_pace" do
          get api_v1_pace_contexts_path(course.id), params: { type: "section", format: :json }
          expect(response.status).to eq 200
          json = JSON.parse(response.body)
          expect(json["pace_contexts"].map { |pc| pc["applied_pace"] }).to match_array [nil, nil]
        end
      end
    end

    context "when the student_enrollment type is specified" do
      it "returns an empty array" do
        get api_v1_pace_contexts_path(course.id), params: { type: "student_enrollment", format: :json }
        expect(response.status).to eq 200
        json = JSON.parse(response.body)
        expect(json["pace_contexts"]).to match_array([])
      end
    end

    context "when an invalid type is specified" do
      it "returns a 400" do
        get api_v1_pace_contexts_path(course.id), params: { type: "foobar", format: :json }
        expect(response.status).to eq 400
      end
    end

    context "when no type is specified" do
      it "returns a 400" do
        get api_v1_pace_contexts_path(course.id), params: { format: :json }
        expect(response.status).to eq 400
      end
    end

    context "when the user does not have permission to manage the course" do
      let(:teacher) { user_model }

      it "returns a 401" do
        get api_v1_pace_contexts_path(course.id), params: { format: :json }
        expect(response.status).to eq 401
      end
    end

    context "when the course_paces_redesign flag is disabled" do
      before do
        Account.site_admin.disable_feature!(:course_paces_redesign)
      end

      it "returns a 404" do
        get api_v1_pace_contexts_path(course.id), params: { format: :json }
        expect(response.status).to eq 404
      end
    end

    context "when the specified course does not exist" do
      it "returns a 404" do
        get api_v1_pace_contexts_path(Course.maximum(:id).next), params: { format: :json }
        expect(response.status).to eq 404
      end
    end

    context "when the specified course does not have pacing enabled" do
      let(:course) { teacher_enrollment.course }

      it "returns a 404" do
        get api_v1_pace_contexts_path(course.id), params: { format: :json }
        expect(response.status).to eq 404
      end
    end
  end
end
