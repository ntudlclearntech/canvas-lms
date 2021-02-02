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

import {AlertManagerContext} from 'jsx/shared/components/AlertManager'
import MessageListActionContainer from '../MessageListActionContainer'
import {createCache} from '../../../canvas-apollo'
import {COURSES_QUERY, CONVERSATIONS_QUERY} from '../../Queries'
import {MockedProvider} from '@apollo/react-testing'
import React from 'react'
import {render, fireEvent} from '@testing-library/react'
import {mockQuery} from '../../mocks'
import waitForApolloLoading from '../../helpers/waitForApolloLoading'

const createGraphqlMocks = () => {
  const mocks = [
    {
      request: {
        query: COURSES_QUERY,
        variables: {
          userID: '1'
        },
        overrides: {
          Node: {
            __typename: 'User'
          }
        }
      }
    },
    {
      request: {
        query: CONVERSATIONS_QUERY,
        variables: {
          userID: '1',
          scope: 'inbox',
          course: 'course_123'
        },
        overrides: {
          Node: {
            __typename: 'User'
          },
          Conversation: () => ({
            _id: '1a',
            contextType: 'context',
            contextId: 2,
            subject: 'Second Subject',
            updateAt: new Date(),
            conversationMessageConnections: [{}],
            conversationParticipantsConnection: [{}]
          })
        }
      }
    }
  ]

  const mockResults = Promise.all(
    mocks.map(async m => {
      const result = await mockQuery(m.request.query, m.request.overrides, m.request.variables)
      return {
        request: {query: m.request.query, variables: m.request.variables},
        result
      }
    })
  )
  return mockResults
}

const setup = async overrideProps => {
  const mocks = await createGraphqlMocks()
  return render(
    <AlertManagerContext.Provider value={{setOnFailure: jest.fn(), setOnSuccess: jest.fn()}}>
      <MockedProvider mocks={mocks} cache={createCache()}>
        <MessageListActionContainer {...overrideProps} />
      </MockedProvider>
    </AlertManagerContext.Provider>
  )
}

describe('MessageListActionContainer', () => {
  beforeEach(() => {
    window.ENV = {
      current_user_id: 1
    }
  })

  describe('rendering', () => {
    it('should render', async () => {
      const component = await setup()

      await waitForApolloLoading()

      expect(component.container).toBeTruthy()
    })

    it('should call onCourseFilterSelect when course selected ', async () => {
      const mock = jest.fn()

      const component = await setup({
        onCourseFilterSelect: mock
      })

      await waitForApolloLoading()

      const courseDropdown = await component.getByTestId('course-select')

      fireEvent.click(courseDropdown)
      await waitForApolloLoading()

      const options = await component.queryAllByText('Hello World')

      expect(options.length).toBe(6)

      fireEvent.click(options[1])

      expect(mock.mock.calls.length).toBe(1)
    })

    it('should callback to update mailbox when event fires', async () => {
      const mock = jest.fn()

      const component = await setup({
        onSelectMailbox: mock
      })

      await waitForApolloLoading()

      const mailboxDropdown = await component.findByLabelText('Mailbox Selection')

      fireEvent.click(mailboxDropdown)

      await waitForApolloLoading()

      const option = await component.findByText('Sent')

      expect(option).toBeTruthy()

      fireEvent.click(option)

      expect(mock.mock.calls.length).toBe(1)
    })

    it('should call onSelectMailbox when mailbox changed', async () => {
      const mock = jest.fn()

      const component = await setup({
        onSelectMailbox: mock
      })

      await waitForApolloLoading()

      const mailboxDropdown = await component.findByLabelText('Mailbox Selection')

      fireEvent.click(mailboxDropdown)
      await waitForApolloLoading()

      const option = await component.findByText('Sent')

      expect(option).toBeTruthy()

      fireEvent.click(option)

      expect(mock.mock.calls.length).toBe(1)
    })

    it('should load with selected mailbox set via props', async () => {
      const component = await setup({
        activeMailbox: 'sent'
      })

      await waitForApolloLoading()

      const mailboxDropdown = await component.findByDisplayValue('Sent')

      expect(mailboxDropdown).toBeTruthy()
    })
  })

  it('should have delete button disabled on load', async () => {
    const component = await setup({
      deleteDisabled: true
    })

    await waitForApolloLoading()

    const button = await component.getByTestId('delete')
    expect(button).toBeDisabled()
  })

  it('should have delete button enabled when there are deleteDisabled = false', async () => {
    const component = await setup({
      deleteDisabled: false
    })

    await waitForApolloLoading()

    const button = await component.getByTestId('delete')
    expect(button).not.toBeDisabled()
  })
})
