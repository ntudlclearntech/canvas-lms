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

import {CREATE_SUBMISSION_COMMENT, SUBMISSION_COMMENT_QUERY} from '../../assignmentData'
import {fireEvent, render, waitForElement} from 'react-testing-library'
import {legacyMockSubmission, mockAssignment, mockComments, mockSubmission} from '../../test-utils'
import {MockedProvider} from 'react-apollo/test-utils'
import React from 'react'
import StudentContent from '../StudentContent'

function mockSubmissionHistoryEdges(count, opts = {}) {
  const historyEdges = []
  for (let i = 1; i <= count; i++) {
    const submission = opts.useLegacyMock ? legacyMockSubmission() : mockSubmission()
    submission.attempt = i
    historyEdges.push({
      cursor: btoa(i.toString()),
      node: submission
    })
  }
  return historyEdges
}

function mockPageInfo(options = {}) {
  const optsWithDefaults = {
    hasPreviousPage: false,
    startCursor: 1,
    ...options
  }

  return {
    hasPreviousPage: optsWithDefaults.hasPreviousPage,
    startCursor: btoa(optsWithDefaults.startCursor.toString())
  }
}

const mocks = [
  {
    request: {
      query: SUBMISSION_COMMENT_QUERY,
      variables: {
        submissionId: legacyMockSubmission().rootId,
        submissionAttempt: legacyMockSubmission().attempt
      }
    },
    result: {
      data: {
        submissionComments: mockComments()
      }
    }
  },
  {
    request: {
      query: CREATE_SUBMISSION_COMMENT,
      variables: {
        submissionId: legacyMockSubmission().rootId,
        submissionAttempt: legacyMockSubmission().attempt
      }
    },
    result: {
      data: null
    }
  }
]

describe('Assignment Student Content View', () => {
  it('renders the student header if the assignment is unlocked', () => {
    const props = {
      assignment: mockAssignment({lockInfo: {isLocked: false}}),
      submissionHistoryEdges: mockSubmissionHistoryEdges(1, {useLegacyMock: true}),
      pageInfo: mockPageInfo(),
      onLoadMore: () => {}
    }
    const {getByTestId} = render(
      <MockedProvider>
        <StudentContent {...props} />
      </MockedProvider>
    )
    expect(getByTestId('assignments-2-student-view')).toBeInTheDocument()
  })

  it('renders the student header if the assignment is locked', () => {
    const props = {
      assignment: mockAssignment({lockInfo: {isLocked: true}}),
      submissionHistoryEdges: mockSubmissionHistoryEdges(1, {useLegacyMock: true}),
      pageInfo: mockPageInfo(),
      onLoadMore: () => {}
    }
    const {getByTestId} = render(<StudentContent {...props} />)
    expect(getByTestId('assignment-student-header-normal')).toBeInTheDocument()
  })

  it('renders the assignment details and student content tab if the assignment is unlocked', () => {
    const props = {
      assignment: mockAssignment({lockInfo: {isLocked: false}}),
      submissionHistoryEdges: mockSubmissionHistoryEdges(1, {useLegacyMock: true}),
      pageInfo: mockPageInfo(),
      onLoadMore: () => {}
    }
    const {getByRole, getByText, queryByText} = render(
      <MockedProvider>
        <StudentContent {...props} />
      </MockedProvider>
    )
    expect(getByRole('tablist')).toHaveTextContent('Attempt 1')
    expect(getByText('Details')).toBeInTheDocument()
    expect(queryByText('Availability Dates')).not.toBeInTheDocument()
  })

  it('renders the availability dates if the assignment is locked', () => {
    const props = {
      assignment: mockAssignment({lockInfo: {isLocked: true}}),
      submissionHistoryEdges: mockSubmissionHistoryEdges(1, {useLegacyMock: true}),
      pageInfo: mockPageInfo(),
      onLoadMore: () => {}
    }
    const {queryByRole, getByText} = render(
      <MockedProvider>
        <StudentContent {...props} />
      </MockedProvider>
    )
    expect(queryByRole('tablist')).not.toBeInTheDocument()
    expect(getByText('Availability Dates')).toBeInTheDocument()
  })

  it('renders Comments', async () => {
    const props = {
      assignment: mockAssignment({lockInfo: {isLocked: false}}),
      submissionHistoryEdges: mockSubmissionHistoryEdges(1, {useLegacyMock: true}),
      pageInfo: mockPageInfo(),
      onLoadMore: () => {}
    }
    const {getByText} = render(
      <MockedProvider mocks={mocks} addTypename>
        <StudentContent {...props} />
      </MockedProvider>
    )
    fireEvent.click(getByText('Comments', {selector: '[role=tab]'}))

    expect(await waitForElement(() => getByText('Send Comment'))).toBeInTheDocument()
  })

  it('renders spinner while lazy loading comments', () => {
    const props = {
      assignment: mockAssignment({lockInfo: {isLocked: false}}),
      submissionHistoryEdges: mockSubmissionHistoryEdges(1, {useLegacyMock: true}),
      pageInfo: mockPageInfo(),
      onLoadMore: () => {}
    }

    const {getByTitle, getByText} = render(
      <MockedProvider mocks={mocks} addTypename>
        <StudentContent {...props} />
      </MockedProvider>
    )
    fireEvent.click(getByText('Comments', {selector: '[role=tab]'}))
    expect(getByTitle('Loading')).toBeInTheDocument()
  })
})
