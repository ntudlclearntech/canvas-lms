#
# Copyright (C) 2020 - present Instructure, Inc.
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

require 'spec_helper'

describe Auditors do

  after(:each) do
    Canvas::DynamicSettings.config = nil
    Canvas::DynamicSettings.reset_cache!
    Canvas::DynamicSettings.fallback_data = nil
  end

  def inject_auditors_settings(yaml_string)
    Canvas::DynamicSettings.fallback_data = {
        "private": {
          "canvas": {
            "auditors.yml": yaml_string
          }
        }
      }
  end

  describe "settings parsing" do
    it "parses pre-change write paths" do
      inject_auditors_settings("write_paths:\n  - cassandra\nread_path: cassandra")
      expect(Auditors.write_to_cassandra?).to eq(true)
      expect(Auditors.write_to_postgres?).to eq(false)
      expect(Auditors.read_from_cassandra?).to eq(true)
      expect(Auditors.read_from_postgres?).to eq(false)
    end

    it "understands dual write path" do
      inject_auditors_settings("write_paths:\n  - cassandra\n  - active_record\nread_path: cassandra")
      expect(Auditors.write_to_cassandra?).to eq(true)
      expect(Auditors.write_to_postgres?).to eq(true)
      expect(Auditors.read_from_cassandra?).to eq(true)
      expect(Auditors.read_from_postgres?).to eq(false)
    end

    it "understands postgres reading path" do
      inject_auditors_settings("write_paths:\n  - cassandra\n  - active_record\nread_path: active_record")
      expect(Auditors.write_to_cassandra?).to eq(true)
      expect(Auditors.write_to_postgres?).to eq(true)
      expect(Auditors.read_from_cassandra?).to eq(false)
      expect(Auditors.read_from_postgres?).to eq(true)
    end

    it "understands full cutover" do
      inject_auditors_settings("write_paths:\n  - active_record\nread_path: active_record")
      expect(Auditors.write_to_cassandra?).to eq(false)
      expect(Auditors.write_to_postgres?).to eq(true)
      expect(Auditors.read_from_cassandra?).to eq(false)
      expect(Auditors.read_from_postgres?).to eq(true)
    end

    it "defaults to cassandra read/write" do
      expect(Auditors.write_to_cassandra?).to eq(true)
      expect(Auditors.write_to_postgres?).to eq(false)
      expect(Auditors.read_from_cassandra?).to eq(true)
      expect(Auditors.read_from_postgres?).to eq(false)
    end
  end

end