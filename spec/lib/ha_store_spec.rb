#
# Copyright (C) 2017 - present Instructure, Inc.
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

require_relative "../spec_helper.rb"

describe ActiveSupport::Cache::HaStore do
  before do
    skip unless Canvas.redis_enabled?
  end

  let(:store) { ActiveSupport::Cache::HaStore.new(Canvas.redis.id, expires_in: 5.minutes, race_condition_ttl: 7.days) }

  describe "#fetch" do
    it "locks for a new key" do
      expect(store).to receive(:read_entry).and_return(nil)
      expect(store).to receive(:lock).and_return("nonce")
      expect(store).to receive(:write_entry)
      expect(store).to receive(:unlock)
      expect(store.fetch('bob') { 42 }).to eq 42
    end

    it "doesn't lock for an existing key" do
      store.write("bob", 42)
      expect(store).to receive(:lock).never
      expect(store).to receive(:unlock).never
      expect(store.fetch('bob') { raise "not reached" }).to eq 42
    end

    it "doesn't populate for a stale key that someone else is populating" do
      store.write("bob", 42, expires_in: -1)
      expect(store).to receive(:lock).and_return(false)
      expect(store).to receive(:unlock).never

      expect(store.fetch('bob') { raise "not reached" }).to eq 42
    end

    it "waits to get a lock for a non-existent key" do
      expect(store).to receive(:read_entry).and_return(nil).ordered
      expect(store).to receive(:lock).and_return(false).ordered
      expect(store).to receive(:read_entry).and_return(nil).ordered
      expect(store).to receive(:lock).and_return('nonce').ordered
      expect(store).to receive(:write_entry)
      expect(store).to receive(:unlock)
      expect(store.fetch('bob') { 42 }).to eq 42
    end

    it "waits and then reads fresh data for a non-existent key" do
      store.write("bob", 42)
      expect(store).to receive(:read_entry).and_return(nil).ordered
      expect(store).to receive(:lock).and_return(false).ordered
      expect(store).to receive(:read_entry).and_call_original.ordered
      expect(store).to receive(:unlock).never
      expect(store.fetch('bob') { raise "not reached" }).to eq 42
    end
  end
end
