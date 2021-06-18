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

import React from 'react'
import {createCache} from '@canvas/apollo'
import {MockedProvider} from '@apollo/react-testing'
import {render as realRender, fireEvent, waitFor} from '@testing-library/react'
import OutcomeRemoveModal from '../OutcomeRemoveModal'
import OutcomesContext from '@canvas/outcomes/react/contexts/OutcomesContext'
import * as FlashAlert from '@canvas/alerts/react/FlashAlert'
import {accountMocks, deleteOutcomeMock} from '@canvas/outcomes/mocks/Management'

describe('OutcomeRemoveModal', () => {
  let onCloseHandlerMock
  let cache

  const defaultProps = (props = {}) => ({
    outcomeLinkId: '1',
    isOpen: true,
    onCloseHandler: onCloseHandlerMock,
    ...props
  })

  beforeEach(() => {
    cache = createCache()
    onCloseHandlerMock = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const render = (
    children,
    {contextType = 'Account', contextId = '1', mocks = accountMocks()} = {}
  ) => {
    return realRender(
      <OutcomesContext.Provider value={{env: {contextType, contextId}}}>
        <MockedProvider cache={cache} mocks={mocks}>
          {children}
        </MockedProvider>
      </OutcomesContext.Provider>
    )
  }

  it('shows modal if isOpen prop true', () => {
    const {getByText} = render(<OutcomeRemoveModal {...defaultProps()} />)
    expect(getByText('Remove Outcome?')).toBeInTheDocument()
  })

  it('does not show modal if isOpen prop false', () => {
    const {queryByText} = render(<OutcomeRemoveModal {...defaultProps({isOpen: false})} />)
    expect(queryByText('Remove Outcome?')).not.toBeInTheDocument()
  })

  it('calls onCloseHandler on Remove button click', async () => {
    const {getByText} = render(<OutcomeRemoveModal {...defaultProps()} />, {
      mocks: [deleteOutcomeMock()]
    })
    fireEvent.click(getByText('Remove Outcome'))
    expect(onCloseHandlerMock).toHaveBeenCalledTimes(1)
  })

  it('calls onCloseHandler on Cancel button click', () => {
    const {getByText} = render(<OutcomeRemoveModal {...defaultProps()} />)
    fireEvent.click(getByText('Cancel'))
    expect(onCloseHandlerMock).toHaveBeenCalledTimes(1)
  })

  it('calls onCloseHandler on Close (X) button click', () => {
    const {getAllByText} = render(<OutcomeRemoveModal {...defaultProps()} />)
    const closeBtn = getAllByText('Close')[getAllByText('Close').length - 1]
    fireEvent.click(closeBtn)
    expect(onCloseHandlerMock).toHaveBeenCalledTimes(1)
  })

  it('renders component with proper text for Account context', () => {
    const {getByText} = render(<OutcomeRemoveModal {...defaultProps()} />)
    expect(
      getByText('Are you sure that you want to remove this outcome from this account?')
    ).toBeInTheDocument()
  })

  it('renders component with proper text for Course context', () => {
    const {getByText} = render(<OutcomeRemoveModal {...defaultProps()} />, {
      contextType: 'Course'
    })
    expect(
      getByText('Are you sure that you want to remove this outcome from this course?')
    ).toBeInTheDocument()
  })

  describe('deletes the outcome', () => {
    it('displays flash confirmation with proper message if delete request succeeds for account', async () => {
      const showFlashAlertSpy = jest.spyOn(FlashAlert, 'showFlashAlert')
      const {getByText} = render(<OutcomeRemoveModal {...defaultProps()} />, {
        mocks: [deleteOutcomeMock()]
      })
      fireEvent.click(getByText('Remove Outcome'))
      await waitFor(() => {
        expect(showFlashAlertSpy).toHaveBeenCalledWith({
          message: 'This outcome was successfully removed from this account.',
          type: 'success'
        })
      })
    })

    it('displays flash confirmation with proper message if delete request succeeds for course', async () => {
      const showFlashAlertSpy = jest.spyOn(FlashAlert, 'showFlashAlert')
      const {getByText} = render(<OutcomeRemoveModal {...defaultProps()} />, {
        contextType: 'Course',
        mocks: [deleteOutcomeMock()]
      })
      fireEvent.click(getByText('Remove Outcome'))
      await waitFor(() => {
        expect(showFlashAlertSpy).toHaveBeenCalledWith({
          message: 'This outcome was successfully removed from this course.',
          type: 'success'
        })
      })
    })

    it('displays flash confirmation with proper message if delete request fails', async () => {
      const showFlashAlertSpy = jest.spyOn(FlashAlert, 'showFlashAlert')
      const {getByText} = render(<OutcomeRemoveModal {...defaultProps()} />, {
        mocks: [deleteOutcomeMock({failResponse: true})]
      })
      fireEvent.click(getByText('Remove Outcome'))
      await waitFor(() => {
        expect(showFlashAlertSpy).toHaveBeenCalledWith({
          message:
            'An error occurred while removing the outcome: GraphQL error: Could not find associated outcome in this context',
          type: 'error'
        })
      })
    })

    it('displays flash confirmation with proper message if delete request fails because it is aligned with content', async () => {
      const showFlashAlertSpy = jest.spyOn(FlashAlert, 'showFlashAlert')
      const {getByText} = render(<OutcomeRemoveModal {...defaultProps()} />, {
        mocks: [deleteOutcomeMock({failAlignedContentMutation: true})]
      })
      fireEvent.click(getByText('Remove Outcome'))
      await waitFor(() => {
        expect(showFlashAlertSpy).toHaveBeenCalledWith({
          message:
            'An error occurred while removing the outcome: Outcome cannot be removed because it is aligned to content',
          type: 'error'
        })
      })
    })

    it('displays flash confirmation with proper message if delete mutation fails', async () => {
      const showFlashAlertSpy = jest.spyOn(FlashAlert, 'showFlashAlert')
      const {getByText} = render(<OutcomeRemoveModal {...defaultProps()} />, {
        mocks: [deleteOutcomeMock({failMutation: true})]
      })
      fireEvent.click(getByText('Remove Outcome'))
      await waitFor(() => {
        expect(showFlashAlertSpy).toHaveBeenCalledWith({
          message: 'An error occurred while removing the outcome.',
          type: 'error'
        })
      })
    })

    it('displays flash confirmation with proper message if delete request fails with no error message', async () => {
      const showFlashAlertSpy = jest.spyOn(FlashAlert, 'showFlashAlert')
      const {getByText} = render(<OutcomeRemoveModal {...defaultProps()} />, {
        mocks: [deleteOutcomeMock({failMutationNoErrMsg: true})]
      })
      fireEvent.click(getByText('Remove Outcome'))
      await waitFor(() => {
        expect(showFlashAlertSpy).toHaveBeenCalledWith({
          message: 'An error occurred while removing the outcome.',
          type: 'error'
        })
      })
    })
  })
})
