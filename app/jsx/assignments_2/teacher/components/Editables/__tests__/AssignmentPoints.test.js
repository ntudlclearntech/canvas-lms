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
import {render, fireEvent} from 'react-testing-library'
import AssignmentPoints from '../AssignmentPoints'

describe('AssignmentPoints', () => {
  it('renders the value in view mode', () => {
    const {getByText} = render(
      <AssignmentPoints
        mode="view"
        onChange={() => {}}
        onChangeMode={() => {}}
        pointsPossible={1432}
      />
    )

    expect(getByText('1432')).toBeInTheDocument()
  })

  it('renders the value in edit mode', () => {
    const {container} = render(
      <AssignmentPoints
        mode="edit"
        onChange={() => {}}
        onChangeMode={() => {}}
        pointsPossible={1432}
      />
    )

    expect(container.querySelector('input[value="1432"]')).toBeInTheDocument()
  })

  it('shows error message with invalid value', () => {
    const {getByText} = render(
      <AssignmentPoints
        mode="view"
        onChange={() => {}}
        onChangeMode={() => {}}
        pointsPossible="1432x"
      />
    )

    expect(getByText('Points must be a number >= 0')).toBeInTheDocument()
  })

  it('saves new value on Enter', () => {
    const onChange = jest.fn()
    const {container} = render(
      <AssignmentPoints
        mode="edit"
        onChange={onChange}
        onChangeMode={() => {}}
        pointsPossible={12}
      />
    )

    const input = container.querySelector('input[value="12"]')
    fireEvent.input(input, {target: {value: '7'}})
    fireEvent.keyDown(input, {key: 'Enter', code: 13})
    expect(onChange).toHaveBeenCalledWith(7)
  })

  it('reverts to the old value on Escape', () => {
    const onChange = jest.fn()
    const {container} = render(
      <AssignmentPoints
        mode="edit"
        onChange={onChange}
        onChangeMode={() => {}}
        pointsPossible={12}
      />
    )

    const input = container.querySelector('input[value="12"]')
    fireEvent.input(input, {target: {value: '7'}})
    fireEvent.keyDown(input, {key: 'Escape', code: 27})
    expect(onChange).toHaveBeenCalledWith(7)
    expect(onChange).toHaveBeenCalledWith(12)
  })
})
