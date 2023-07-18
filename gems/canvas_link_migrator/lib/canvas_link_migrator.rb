# frozen_string_literal: true

#
# Copyright (C) 2023 - present Instructure, Inc.
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

require "canvas_link_migrator/resource_map_service"
require "canvas_link_migrator/imported_html_converter"
require "canvas_link_migrator/link_parser"
require "canvas_link_migrator/link_replacer"
require "canvas_link_migrator/link_resolver"

module CanvasLinkMigrator
  def self.relative_url?(url)
    URI.parse(url).relative? && !url.to_s.start_with?("//")
  rescue URI::Error
    # leave the url as it was
    false
  end
end
