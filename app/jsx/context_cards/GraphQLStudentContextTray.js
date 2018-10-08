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

import $ from 'jquery'
import _ from 'underscore'
import React from 'react'
import StudentContextTray from './StudentContextTray'
import {client, ApolloProvider, Query, gql} from '../canvas-apollo'


const SCC_QUERY = gql`
  query StudentContextCard($courseId: ID!, $studentId: ID!) {
    course(id: $courseId) {
      _id
      name
      permissions {
        become_user: becomeUser
        manage_grades: manageGrades
        send_messages: sendMessages
        view_all_grades: viewAllGrades
        view_analytics: viewAnalytics
      }
      submissionsConnection(
        first: 10
        orderBy: [{field: gradedAt, direction: descending}]
        studentIds: [$studentId]
      ) {
        edges {
          submission: node {
            id
            score
            grade
            excused
            user {
              _id
            }
            assignment {
              name
              html_url: htmlUrl
              points_possible: pointsPossible
            }
          }
        }
      }
    }
    user: legacyNode(type: User, _id: $studentId) {
      ... on User {
        _id
        short_name: shortName
        avatar_url: avatarUrl
        enrollments(courseId: $courseId) {
          last_activity_at: lastActivityAt
          section {
            name
          }
          grades {
            current_grade: currentGrade
            current_score: currentScore
          }
        }
        analytics: summaryAnalytics(courseId: $courseId) {
          page_views: pageViews {
            total
            max
            level
          }
          participations {
            total
            max
            level
          }
          tardiness_breakdown: tardinessBreakdown {
            late
            missing
            on_time: onTime
          }
        }
      }
    }
  }
`

export default props => {
  return (
    <ApolloProvider client={client}>
      <Query query={SCC_QUERY} variables={{courseId: props.courseId, studentId: props.studentId}}>
        {({data, loading}) => {
          const {course, user} = data
          return <StudentContextTray data={{loading, course, user}} {...props} />
        }}
      </Query>
    </ApolloProvider>
  )
}
