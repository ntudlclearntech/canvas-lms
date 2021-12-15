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

import {render, fireEvent} from '@testing-library/react'
import React from 'react'
import {DiscussionPostToolbar} from '../DiscussionPostToolbar'
import {ChildTopic} from '../../../../graphql/ChildTopic'

jest.mock('../../../utils', () => ({
  ...jest.requireActual('../../../utils'),
  responsiveQuerySizes: () => ({desktop: {maxWidth: '1024px'}})
}))

beforeAll(() => {
  window.matchMedia = jest.fn().mockImplementation(() => {
    return {
      matches: true,
      media: '',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  })
})

const setup = props => {
  return render(<DiscussionPostToolbar {...props} />)
}

describe('DiscussionPostToolbar', () => {
  describe('Rendering', () => {
    it('should render', () => {
      const component = setup()
      expect(component).toBeTruthy()
    })

    it('should not render Collapse Toggle by default', () => {
      const {queryByTestId} = setup()
      expect(queryByTestId('collapseToggle')).toBeNull()
    })

    it('should not render clear search button by default', () => {
      const {queryByTestId} = setup()
      expect(queryByTestId('clear-search-button')).toBeNull()
    })
  })

  describe('Search Field', () => {
    it('should call onChange when typing occurs', () => {
      const onSearchChangeMock = jest.fn()
      const {getByLabelText} = setup({onSearchChange: onSearchChangeMock})
      const searchInput = getByLabelText('Search entries or author')
      fireEvent.change(searchInput, {target: {value: 'A'}})
      window.setTimeout(() => expect(onSearchChangeMock.mock.calls.length).toBe(1), 1500)
      fireEvent.change(searchInput, {target: {value: 'B'}})
      window.setTimeout(() => expect(onSearchChangeMock.mock.calls.length).toBe(2), 1500)
    })
  })

  describe('View Dropdown', () => {
    it('should call onChange when event is fired', () => {
      const onViewFilterMock = jest.fn()
      const {getByText, getByLabelText} = setup({onViewFilter: onViewFilterMock})
      const simpleSelect = getByLabelText('Filter by')
      fireEvent.click(simpleSelect)
      const unread = getByText('Unread')
      fireEvent.click(unread)
      expect(onViewFilterMock.mock.calls.length).toBe(1)
      expect(onViewFilterMock.mock.calls[0][1].id).toBe('unread')
    })

    it('"My Drafts" filter should be visible', () => {
      window.ENV = {
        draft_discussions: true
      }
      const onViewFilterMock = jest.fn()
      const {getByText, getByLabelText} = setup({onViewFilter: onViewFilterMock})
      const simpleSelect = getByLabelText('Filter by')
      fireEvent.click(simpleSelect)
      expect(getByText('My Drafts')).toBeTruthy()
    })
  })

  describe('Sort control', () => {
    it('should show up arrow when ascending', () => {
      const {getByTestId} = setup({
        sortDirection: 'asc'
      })
      const upArrow = getByTestId('UpArrow')
      expect(upArrow).toBeTruthy()
    })

    it('should show down arrow when descending', () => {
      const {getByTestId} = setup({
        sortDirection: 'desc'
      })
      const downArrow = getByTestId('DownArrow')
      expect(downArrow).toBeTruthy()
    })

    it('should call onClick when clicked', () => {
      const onSortClickMock = jest.fn()
      const {getByTestId} = setup({
        onSortClick: onSortClickMock
      })
      const button = getByTestId('sortButton')
      button.click()
      expect(onSortClickMock.mock.calls.length).toBe(1)
    })
  })

  describe('Groups Menu Button', () => {
    it('should not render when there are no child topics', () => {
      const container = setup({
        childTopics: []
      })
      expect(container.queryByTestId('groups-menu-button')).toBeNull()
    })

    it('should render when there are child topics', () => {
      const container = setup({
        childTopics: [ChildTopic.mock()]
      })
      expect(container.queryByTestId('groups-menu-button')).toBeTruthy()
    })
  })

  describe('Anonymous Indicator Avatar', () => {
    describe('discussion is anonymous', () => {
      it('should render discussionAnonymousState is not null', () => {
        ENV.current_user_roles = ['student']
        const container = setup({
          discussionAnonymousState: 'full_anonymity'
        })
        expect(container.queryByTestId('anonymous_avatar')).toBeTruthy()
      })
    })

    describe('discussion is not anonymous', () => {
      it('should render discussionAnonymousState is null', () => {
        ENV.current_user_roles = ['student']
        const container = setup({
          discussionAnonymousState: null
        })
        expect(container.queryByTestId('anonymous_avatar')).toBeNull()
      })
    })
  })
})
