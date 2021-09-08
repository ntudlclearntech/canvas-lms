# frozen_string_literal: true

#
# Copyright (C) 2014 - present Instructure, Inc.
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

# these gems are separate from test.rb so that we can treat it as a dedicated
# Gemfile for script/rlint, and it will run very quickly

group :test do
  dedicated_gemfile = ENV['BUNDLE_GEMFILE']&.end_with?('rubocop.rb')

  gem 'gergich', '1.2.3', require: false
    gem 'mime-types-data', '3.2021.0901', require: false

  gem 'rubocop', '1.19.1', require: false
  gem 'rubocop-canvas', require: false, path: "#{'../' if dedicated_gemfile}gems/rubocop-canvas"
      gem 'rainbow', '3.0.0', require: false
  gem 'rubocop-rails', '2.11.3', require: false
  gem 'rubocop-rspec', '2.4.0', require: false
  gem 'rubocop-performance', '1.11.5', require: false
end
