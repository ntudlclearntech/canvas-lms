# frozen_string_literal: true

#
# Copyright (C) 2019 - present Instructure, Inc.
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

require File.expand_path(File.dirname(__FILE__) + '/../../spec_helper')

describe Loaders::DiscussionEntryLoader do
  before(:once) do
    @discussion = group_discussion_assignment
    student_in_course(active_all: true)
    @student.update(name: 'Student')
    @de1 = @discussion.discussion_entries.create!(message: 'peekaboo', user: @teacher, created_at: Time.zone.now)
    @de2 = @discussion.discussion_entries.create!(message: 'hello', user: @student, created_at: Time.zone.now - 1.day)
    @de3 = @discussion.discussion_entries.create!(message: 'goodbye', user: @teacher, created_at: Time.zone.now - 2.days)
    @de4 = @discussion.discussion_entries.create!(message: 'sub entry', user: @teacher, parent_id: @de2.id)
    @de3.destroy
  end

  it "works" do
    GraphQL::Batch.batch do
      discussion_entry_loader = Loaders::DiscussionEntryLoader.for(
        current_user: @teacher
      )
      discussion_entry_loader.load(@discussion).then { |discussion_entries|
        expect(discussion_entries).to match @discussion.discussion_entries.reorder(created_at: "desc")
      }
    end
  end

  it 'includes all entries where legacy=false for root_entries' do
    de5 = @de4.discussion_subentries.create!(discussion_topic: @discussion, message: 'grandchild but legacy false')
    de6 = @de4.discussion_subentries.create!(discussion_topic: @discussion, message: 'grandchild but legacy true')
    # legacy gets set based on the feature flag state so explicitly updating the entries.
    DiscussionEntry.where(id: de5).update_all(legacy: false, parent_id: @de4.id)
    DiscussionEntry.where(id: de6).update_all(legacy: true, parent_id: @de4.id)

    GraphQL::Batch.batch do
      Loaders::DiscussionEntryLoader.for(
        current_user: @teacher,
      ).load(@de2).then { |discussion_entries|
        expect(discussion_entries.map(&:id)).to match_array [@de4.id, de5.id]
      }
    end
  end

  it "allows querying root discussion entries only" do
    GraphQL::Batch.batch do
      Loaders::DiscussionEntryLoader.for(
        current_user: @teacher,
        root_entries: true
      ).load(@discussion).then { |discussion_entries|
        expect(discussion_entries.count).to match 3
      }
    end
  end

  context 'allows search discussion entries' do
    it 'by message body' do
      GraphQL::Batch.batch do
        Loaders::DiscussionEntryLoader.for(
          current_user: @teacher,
          search_term: 'eekabo'
        ).load(@discussion).then { |discussion_entries|
          expect(discussion_entries).to match [@de1]
        }
      end
    end

    it 'by author name' do
      GraphQL::Batch.batch do
        Loaders::DiscussionEntryLoader.for(
          current_user: @teacher,
          search_term: 'student'
        ).load(@discussion).then { |discussion_entries|
          expect(discussion_entries).to match [@de2]
        }
      end
    end

    it 'that are not deleted' do
      GraphQL::Batch.batch do
        Loaders::DiscussionEntryLoader.for(
          current_user: @teacher,
          search_term: 'goodbye'
        ).load(@discussion).then { |discussion_entries|
          expect(discussion_entries).to match []
        }
      end
    end
  end

  context 'allow fitering discussion entries' do

    it 'by any workflow state' do
      GraphQL::Batch.batch do
        Loaders::DiscussionEntryLoader.for(
          current_user: @teacher,
          filter: 'all'
        ).load(@discussion).then { |discussion_entries|
          expect(discussion_entries).to match @discussion.discussion_entries.reorder(created_at: "desc")
        }
      end
    end

    it 'by unread workflow state' do
      @de1.change_read_state('unread', @teacher)

      GraphQL::Batch.batch do
        Loaders::DiscussionEntryLoader.for(
          current_user: @teacher,
          filter: 'unread'
        ).load(@discussion).then { |discussion_entries|
          expect(discussion_entries).to match [@de1]
        }
      end
    end

    it 'by deleted workflow state' do
      GraphQL::Batch.batch do
        Loaders::DiscussionEntryLoader.for(
          current_user: @teacher,
          filter: 'deleted'
        ).load(@discussion).then { |discussion_entries|
          expect(discussion_entries[0].deleted?).to be true
        }
      end
    end
  end

  context 'allows ordering by created date' do
    it 'ascending' do
      GraphQL::Batch.batch do
        Loaders::DiscussionEntryLoader.for(
          current_user: @teacher,
          sort_order: :asc
        ).load(@discussion).then { |discussion_entries|
          expect(discussion_entries[0]).to match @de3
        }
      end
    end

    it 'descending' do
      GraphQL::Batch.batch do
        Loaders::DiscussionEntryLoader.for(
          current_user: @teacher,
          sort_order: :desc
        ).load(@discussion).then { |discussion_entries|
          expect(discussion_entries[0]).to match @de4
        }
      end
    end
  end
end
