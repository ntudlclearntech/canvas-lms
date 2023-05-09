/*
 * Copyright (C) 2023 - present Instructure, Inc.
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
import DateHelper from '@canvas/datetime/dateHelper'
import {useScope as useI18nScope} from '@canvas/i18n'

import {IconButton} from '@instructure/ui-buttons'
import {Flex} from '@instructure/ui-flex'
import {IconCommentLine, IconMutedLine} from '@instructure/ui-icons'
import {Table} from '@instructure/ui-table'
import {Text} from '@instructure/ui-text'
import {Tooltip} from '@instructure/ui-tooltip'

import {getDisplayStatus, getDisplayScore, submissionCommentsPresent} from '../utils'

const I18n = useI18nScope('grade_summary')

export const assignmentRow = (assignment, queryData, setShowTray, setSelectedSubmission) => {
  return (
    <Table.Row key={assignment._id}>
      <Table.Cell textAlign="start">
        <Flex direction="column">
          <Flex.Item>
            <a href={assignment.htmlUrl}>{assignment.name}</a>
          </Flex.Item>
          <Flex.Item>
            <Text size="small">{assignment.assignmentGroup.name}</Text>
          </Flex.Item>
        </Flex>
      </Table.Cell>
      <Table.Cell textAlign="start">
        {DateHelper.formatDatetimeForDisplay(assignment.dueAt)}
      </Table.Cell>
      <Table.Cell textAlign="start">{getDisplayStatus(assignment)}</Table.Cell>
      <Table.Cell textAlign="start">
        {assignment?.submissionsConnection?.nodes[0]?.hideGradeFromStudent ? (
          <Tooltip renderTip={I18n.t('This assignment is muted')}>
            <IconMutedLine />
          </Tooltip>
        ) : (
          getDisplayScore(assignment, queryData?.gradingStandard)
        )}
      </Table.Cell>
      <Table.Cell textAlign="center">
        {submissionCommentsPresent(assignment) && (
          <IconButton
            margin="0 small"
            screenReaderLabel="Submission Comments"
            size="small"
            onClick={() => {
              setShowTray(true)
              setSelectedSubmission(assignment?.submissionsConnection?.nodes[0])
            }}
          >
            <IconCommentLine />
            <Text size="small">
              {assignment?.submissionsConnection.nodes[0].commentsConnection.nodes.length}
            </Text>
          </IconButton>
        )}
      </Table.Cell>
    </Table.Row>
  )
}
