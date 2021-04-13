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

import {Assignment} from '@canvas/assignments/graphql/student/Assignment'
import {Text} from '@instructure/ui-text'
import {Flex} from '@instructure/ui-flex'
import FriendlyDatetime from '@canvas/datetime/react/components/FriendlyDatetime'
import GradeDisplay from './GradeDisplay'
import I18n from 'i18n!assignments_2'

import LoadingIndicator from '@canvas/loading-indicator'
import React, {lazy, Suspense} from 'react'
import SubmissionManager from './SubmissionManager'
import {Submission} from '@canvas/assignments/graphql/student/Submission'
import {Tabs} from '@instructure/ui-tabs'
import {View} from '@instructure/ui-layout'

const RubricTab = lazy(() => import('./RubricTab'))

ContentTabs.propTypes = {
  assignment: Assignment.shape,
  submission: Submission.shape
}

function currentSubmissionGrade(assignment, submission) {
  const tabBarAlign = {
    position: 'absolute',
    right: '50px'
  }

  const currentGrade = submission.state === 'graded' ? submission.grade : null

  return (
    <div style={tabBarAlign}>
      <Text weight="bold">
        <GradeDisplay
          displaySize="medium"
          gradingStatus={submission.gradingStatus}
          gradingType={assignment.gradingType}
          pointsPossible={assignment.pointsPossible}
          receivedGrade={currentGrade}
          showGradeForExcused
        />
      </Text>
      <Text size="small">
        {submission.submittedAt ? (
          <Flex justifyItems="end">
            <Flex.Item padding="0 xx-small 0 0">{I18n.t('Submitted:')}</Flex.Item>
            <Flex.Item>
              <FriendlyDatetime
                dateTime={submission.submittedAt}
                format={I18n.t('#date.formats.full')}
              />
            </Flex.Item>
          </Flex>
        ) : (
          I18n.t('Not submitted')
        )}
      </Text>
    </div>
  )
}

function LoggedInContentTabs(props) {
  const noRightLeftPadding = 'small none' // to make "submit" button edge line up with moduleSequenceFooter "next" button edge

  return (
    <div data-testid="assignment-2-student-content-tabs">
      <View padding={noRightLeftPadding}>
        {props.submission.state === 'graded' || props.submission.state === 'submitted'
          ? currentSubmissionGrade(props.assignment, props.submission)
          : null}
        <SubmissionManager assignment={props.assignment} submission={props.submission} />
      </View>
    </div>
  )
}

// FIXME: this may not actually be used now that we fixed the triple-equals
function LoggedOutContentTabs(props) {
  // Note that for not logged in users we already have the rubrics data available
  // on the assignment, and don't need to do a seperate query to get that data.
  // This is to avoid a large time watching loading spinners on the default tab
  // which we want to render as fast as possible.
  return (
    <div data-testid="assignment-2-student-content-tabs">
      {props.assignment.rubric && (
        <Tabs variant="default">
          <Tabs.Panel renderTitle={I18n.t('Rubric')} selected>
            <Suspense fallback={<LoadingIndicator />}>
              <RubricTab rubric={props.assignment.rubric} />
            </Suspense>
          </Tabs.Panel>
        </Tabs>
      )}
    </div>
  )
}

export default function ContentTabs(props) {
  if (props.submission) {
    return <LoggedInContentTabs {...props} />
  } else {
    return <LoggedOutContentTabs {...props} />
  }
}
