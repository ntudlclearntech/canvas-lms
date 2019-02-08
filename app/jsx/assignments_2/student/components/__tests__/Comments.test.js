/*
 * Copyright (C) 2019 - present Instructure, Inc.
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
import ReactDOM from 'react-dom'
import $ from 'jquery'
import Comments from '../Comments'
import {mockAssignment, mockComments} from '../../test-utils'
import {MockedProvider} from 'react-apollo/test-utils'
import {SUBMISSION_COMMENT_QUERY} from '../../assignmentData'
import wait from 'waait'

const mocks = [
  {
    request: {
      query: SUBMISSION_COMMENT_QUERY,
      variables: {
        submissionId: mockAssignment().submissionsConnection.nodes[0].id.toString()
      }
    },
    result: {
      data: {
        submissionComments: mockComments()
      }
    }
  }
]

describe('Comments', () => {
  beforeAll(() => {
    const found = document.getElementById('fixtures')
    if (!found) {
      const fixtures = document.createElement('div')
      fixtures.setAttribute('id', 'fixtures')
      document.body.appendChild(fixtures)
    }
  })

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(document.getElementById('fixtures'))
  })

  it('renders Comments', async () => {
    ReactDOM.render(
      <MockedProvider mocks={mocks} addTypename>
        <Comments assignment={mockAssignment()} />
      </MockedProvider>,
      document.getElementById('fixtures')
    )

    await wait(0) // wait for response
    const container = $('[data-test-id="comments-container"]')
    expect(container).toHaveLength(1)
  })

  it('renders CommentTextArea', async () => {
    ReactDOM.render(
      <MockedProvider mocks={mocks} addTypename>
        <Comments assignment={mockAssignment()} />
      </MockedProvider>,
      document.getElementById('fixtures')
    )
    await wait(0) // wait for response
    const container = $('[data-test-id="comments-text-area-container"]')
    expect(container).toHaveLength(1)
  })

  it('renders place holder text when no comments', async () => {
    const emptyMock = JSON.parse(JSON.stringify(mocks))
    emptyMock[0].result.data.submissionComments.commentsConnection.nodes = []
    ReactDOM.render(
      <MockedProvider mocks={emptyMock} addTypename>
        <Comments assignment={mockAssignment()} />
      </MockedProvider>,
      document.getElementById('fixtures')
    )
    await wait(0) // wait for response
    const container = $(
      '#fixtures:contains("Send a comment to your instructor about this assignment.")'
    )
    expect(container).toHaveLength(1)
  })

  it('renders comment rows when provided', async () => {
    ReactDOM.render(
      <MockedProvider mocks={mocks} addTypename>
        <Comments assignment={mockAssignment()} />
      </MockedProvider>,
      document.getElementById('fixtures')
    )
    await wait(0) // wait for response
    const container = $('.comment-row-container')
    expect(container).toHaveLength(1)
  })

  it('renders shortname when shortname is provided', async () => {
    ReactDOM.render(
      <MockedProvider mocks={mocks} addTypename>
        <Comments assignment={mockAssignment()} />
      </MockedProvider>,
      document.getElementById('fixtures')
    )
    await wait(0) // wait for response
    const container = $('#fixtures:contains("bob builder")')
    expect(container).toHaveLength(1)
  })

  it('renders loading indicator when loading query', async () => {
    ReactDOM.render(
      <MockedProvider mocks={mocks} addTypename>
        <Comments assignment={mockAssignment()} />
      </MockedProvider>,
      document.getElementById('fixtures')
    )
    const container = $('[data-test-id="loading-indicator"]')
    expect(container).toHaveLength(1)
  })

  it('renders Anonymous when shortname is not provided', async () => {
    const emptyMock = JSON.parse(JSON.stringify(mocks))
    emptyMock[0].result.data.submissionComments.commentsConnection.nodes[0].author = null
    ReactDOM.render(
      <MockedProvider mocks={emptyMock} addTypename>
        <Comments assignment={mockAssignment()} />
      </MockedProvider>,
      document.getElementById('fixtures')
    )
    await wait(0) // wait for response
    let container = $('#fixtures:contains("bob builder")')
    expect(container).toHaveLength(0)
    container = $('#fixtures:contains("Anonymous")')
    expect(container).toHaveLength(1)
  })
})
