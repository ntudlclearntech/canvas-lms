/*
 * Copyright (C) 2018 - present Instructure, Inc.
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

import React from 'react'
import StudentContainer from './components/StudentContainer'
import {string} from 'prop-types'
import {Query} from 'react-apollo'
import gql from 'graphql-tag'

// Fields I'm not sure if we are using:
//   - state
//   - course
//   - various lids
export const STUDENT_VIEW_QUERY = gql`
  query GetAssignment($assignmentLid: ID!) {
    assignment: legacyNode(type: Assignment, _id: $assignmentLid) {
      ... on Assignment {
        lid: _id
        gid: id
        name
        description
        dueAt
        pointsPossible
        lockAt
        unlockAt
        state
        course {
          lid: _id
        }
        modules {
          name
          lid: _id
        }
        assignmentGroup {
          name
          lid: _id
        }
        lockInfo {
          isLocked
        }
      }
    }
  }
`

const StudentView = props => (
  <Query query={STUDENT_VIEW_QUERY} variables={{assignmentLid: props.assignmentLid}}>
    {({loading, error, data}) => {
      // TODO HANDLE ERROR AND LOADING
      if (loading) return null
      if (error) return `Error!: ${error}`
      return <StudentContainer assignment={data.assignment} />
    }}
  </Query>
)

StudentView.propTypes = {
  assignmentLid: string.isRequired
}

export default React.memo(StudentView)
