/*
 * Copyright (C) 2021 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import gql from 'graphql-tag'
import {Error} from '../../shared/graphql/Error'
import {DiscussionEntry} from './DiscussionEntry'

export const DELETE_DISCUSSION_TOPIC = gql`
  mutation DeleteDiscussionTopic($id: ID!) {
    deleteDiscussionTopic(input: {id: $id}) {
      discussionTopicId
      errors {
        ...Error
      }
    }
  }
  ${Error.fragment}
`

// TODO: support read state
export const UPDATE_DISCUSSION_TOPIC_ENTRY_PARTICIPANT = gql`
  mutation UpdateDiscussionTopicEntryParticipantRating($id: ID!, $rating: RatingInputType) {
    updateDiscussionEntryParticipant(input: {discussionEntryId: $id, rating: $rating}) {
      discussionEntry {
        ...DiscussionEntry
      }
    }
  }
  ${DiscussionEntry.fragment}
`
