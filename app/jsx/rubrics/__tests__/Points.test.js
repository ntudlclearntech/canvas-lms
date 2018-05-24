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
import React from 'react'
import { shallow } from 'enzyme'
import Points from '../Points'

describe('The Points component', () => {
  const component = (props) => shallow(<Points {...props} />)
  const id = { criterion_id: '_7506' }

  it('renders the root component as expected', () => {
    expect(component({
      assessment: { ...id, points: 1, pointsText: '1' },
      pointsPossible: 2
    }).debug()).toMatchSnapshot()
  })

  it('renders as expected with fractional points', () => {
    expect(component({
      assessment: { ...id, points: 1.1, pointsText: '1.1' },
      pointsPossible: 2
    }).debug()).toMatchSnapshot()
  })

  it('renders blank when points are undefined', () => {
    expect(component({
      assessing: true,
      assessment: id,
      pointsPossible: 2
    }).debug()).toMatchSnapshot()
  })

  it('renders points possible with no assessment', () => {
    expect(component({
      assessing: false,
      assessment: null,
      pointsPossible: 2
    }).debug()).toMatchSnapshot()
  })

  it('renders an error when points is a string', () => {
    const el = component({
      assessing: true,
      assessment: {
        ...id,
        points: null,
        pointsText: 'stringy',
      },
      pointsPossible: 2
    })
    expect(el.debug()).toMatchSnapshot()
    expect(el.find('TextInput').prop('messages')).toHaveLength(1)
  })
})
