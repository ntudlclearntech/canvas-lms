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
import {fireEvent, render, screen} from '@testing-library/react'
import {AddressBook, COURSE_TYPE, BACK_BUTTON_TYPE} from '../AddressBook'

const demoData = [
  {id: 'course_11', name: 'Test 101'},
  {id: 'course_12', name: 'History 101'},
  {id: 'course_13', name: 'English 101'},
  {id: '1', name: 'Rob Orton', full_name: 'Rob Orton', pronounds: null},
  {id: '2', name: 'Matthew Lemon', full_name: 'Matthew Lemon', pronounds: null},
  {id: '3', name: 'Drake Harper', full_name: 'Drake Harpert', pronounds: null},
  {id: '4', name: 'Davis Hyer', full_name: 'Davis Hyer', pronounds: null}
]

const defaultProps = {
  menuData: demoData
}

const setup = props => {
  return render(<AddressBook {...props} />)
}

describe('Address Book Component', () => {
  describe('Rendering', () => {
    it('Should render', () => {
      const component = setup(defaultProps)
      expect(component).toBeTruthy()
    })

    it('Should render popup menu when prop is true', async () => {
      setup({...defaultProps, open: true})
      const popover = await screen.findByTestId('address-book-popover')
      expect(popover).toBeTruthy()
    })

    it('Should render a text input', async () => {
      const {findByTestId} = setup(defaultProps)
      const input = await findByTestId('address-book-input')
      expect(input).toBeTruthy()
    })

    it('Should render back button when isSubMenu is present', async () => {
      setup({...defaultProps, isSubMenu: true, open: true})
      const backItem = await screen.findByText('Back')
      expect(backItem).toBeTruthy()
    })

    it('Should render header text when HeaderText is present', async () => {
      const headerText = 'Test Header Text'
      setup({...defaultProps, open: true, headerText})
      const headerItem = await screen.findByText(headerText)
      expect(headerItem).toBeTruthy()
    })
  })

  describe('Behaviors', () => {
    it('Should render popup menu when button is clicked', async () => {
      const {container} = setup({...defaultProps})
      const button = container.querySelector('button')
      fireEvent.click(button)
      const popover = await screen.findByTestId('address-book-popover')
      expect(popover).toBeTruthy()
    })

    it('Should render popup menu when textInput is focused', async () => {
      const {container} = setup({...defaultProps})
      const input = container.querySelector('input')
      fireEvent.focus(input)
      const popover = await screen.findByTestId('address-book-popover')
      expect(popover).toBeTruthy()
    })

    it('Should pass back ID of item when selected', async () => {
      const onSelectSpy = jest.fn()
      setup({...defaultProps, open: true, onSelect: onSelectSpy})
      const popover = await screen.findByTestId('address-book-popover')
      const items = popover.querySelectorAll('li')
      fireEvent.mouseDown(items[4])
      expect(onSelectSpy.mock.calls[0][0]).toBe('2')
    })

    it('Should select item when navigating down and enter key is pressed', async () => {
      const onSelectSpy = jest.fn()
      const {container} = setup({...defaultProps, open: true, onSelect: onSelectSpy})
      const input = container.querySelector('input')
      fireEvent.focus(input)
      fireEvent.keyDown(input, {key: 'ArrowDown', keyCode: 40})
      fireEvent.keyDown(input, {key: 'ArrowDown', keyCode: 40})
      fireEvent.keyDown(input, {key: 'ArrowDown', keyCode: 40})
      fireEvent.keyDown(input, {key: 'ArrowDown', keyCode: 40})
      fireEvent.keyDown(input, {key: 'Enter', keyCode: 13})
      expect(onSelectSpy.mock.calls.length).toBe(1)
      expect(onSelectSpy.mock.calls[0][0]).toBe('2')
    })

    it('Should select item when navigating up and enter key is pressed', () => {
      const onSelectSpy = jest.fn()
      const {container} = setup({...defaultProps, open: true, onSelect: onSelectSpy})
      const input = container.querySelector('input')
      fireEvent.focus(input)
      fireEvent.keyDown(input, {key: 'ArrowUp', keyCode: 38})
      fireEvent.keyDown(input, {key: 'ArrowUp', keyCode: 38})
      fireEvent.keyDown(input, {key: 'ArrowUp', keyCode: 38})
      fireEvent.keyDown(input, {key: 'Enter', keyCode: 13})
      expect(onSelectSpy.mock.calls.length).toBe(1)
      expect(onSelectSpy.mock.calls[0][0]).toBe('2')
    })
  })

  describe('Tags', () => {
    it('Should render tag when item is selected', async () => {
      const onSelectSpy = jest.fn()
      setup({...defaultProps, open: true, onSelect: onSelectSpy})
      const popover = await screen.findByTestId('address-book-popover')
      const items = popover.querySelectorAll('li')
      fireEvent.mouseDown(items[4])
      const tag = await screen.findByTestId('address-book-tag')
      expect(tag).toBeTruthy()
    })

    it('Should be able to select 2 tags when no limit is set', async () => {
      setup({...defaultProps, open: true})
      const popover = await screen.findByTestId('address-book-popover')
      const items = popover.querySelectorAll('li')
      fireEvent.mouseDown(items[4])
      fireEvent.mouseDown(items[5])
      const tags = await screen.findAllByTestId('address-book-tag')
      expect(tags.length).toBe(2)
    })

    it('Should be able to select only 1 tags when limit is 1', async () => {
      setup({...defaultProps, open: true, limitTagCount: 1})
      const popover = await screen.findByTestId('address-book-popover')
      const items = popover.querySelectorAll('li')
      fireEvent.mouseDown(items[4])
      fireEvent.mouseDown(items[5])
      const tags = await screen.findAllByTestId('address-book-tag')
      expect(tags.length).toBe(1)
    })

    it('Should pass back selected IDs as an array', async () => {
      const onSelectedIdsChangeMock = jest.fn()
      setup({
        ...defaultProps,
        open: true,
        limitTagCount: 1,
        onSelectedIdsChange: onSelectedIdsChangeMock
      })
      const popover = await screen.findByTestId('address-book-popover')
      const items = popover.querySelectorAll('li')
      fireEvent.mouseDown(items[4])
      await screen.findByTestId('address-book-tag')
      expect(onSelectedIdsChangeMock.mock.calls[0][0]).toStrictEqual([demoData[4]])
    })
  })

  describe('Callbacks', () => {
    it('Should send search input through onTextChange callback', async () => {
      const onChangeSpy = jest.fn()
      const {findByTestId} = setup({...defaultProps, onTextChange: onChangeSpy})
      const input = await findByTestId('address-book-input')
      fireEvent.change(input, {target: {value: 'Test'}})
      expect(onChangeSpy.mock.calls.length).toBe(1)
    })

    it('Should select item when clicked', async () => {
      const onSelectSpy = jest.fn()
      setup({...defaultProps, open: true, onSelect: onSelectSpy})
      const popover = await screen.findByTestId('address-book-popover')
      const items = popover.querySelectorAll('li')
      fireEvent.mouseDown(items[4])
      expect(onSelectSpy.mock.calls.length).toBe(1)
    })

    it('Should call back for group clicks', async () => {
      const onSelectSpy = jest.fn()
      setup({...defaultProps, open: true, onSelect: onSelectSpy})
      const popover = await screen.findByTestId('address-book-popover')
      const items = popover.querySelectorAll('li')
      fireEvent.mouseDown(items[0])
      expect(onSelectSpy.mock.calls.length).toBe(1)
      expect(onSelectSpy.mock.calls[0][0].includes(COURSE_TYPE)).toBe(true)
    })

    it('Should call back for back click', async () => {
      const onSelectSpy = jest.fn()
      setup({...defaultProps, open: true, onSelect: onSelectSpy, isSubMenu: true})
      const popover = await screen.findByTestId('address-book-popover')
      const items = popover.querySelectorAll('li')
      fireEvent.mouseDown(items[0])
      expect(onSelectSpy.mock.calls.length).toBe(1)
      expect(onSelectSpy.mock.calls[0][0].includes(BACK_BUTTON_TYPE)).toBe(true)
    })
  })
})
