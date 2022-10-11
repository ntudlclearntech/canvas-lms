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

class CoursePacing::CoursePaceService < CoursePacing::PaceServiceInterface
  def self.paces_in_course(course)
    course.course_paces.primary
  end

  def self.pace_in_context(course)
    paces_in_course(course).first!
  end

  def self.template_pace_for(_)
    nil
  end

  def self.course_for(course)
    course
  end
end
