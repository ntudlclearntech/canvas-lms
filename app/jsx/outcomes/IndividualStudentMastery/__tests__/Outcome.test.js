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
import { render, shallow } from 'enzyme'
import Outcome from '../Outcome'

const defaultProps = (props = {}) => (
  Object.assign({
    outcome: {
      id: 1,
      expansionId: 100,
      mastered: false,
      ratings: [
        { description: 'My first rating' },
        { description: 'My second rating' }
      ],
      results: [
        {
          id: 1,
          score: 1,
          percent: 0.1,
          assignment: {
            id: 1,
            html_url: 'http://foo',
            name: 'My assignment',
            submission_types: 'online_quiz'
          }
        }
      ],
      title: 'My outcome'
    },
    expanded: false,
    onExpansionChange: () => {}
  }, props)
)

it('renders the Outcome component', () => {
  const wrapper = shallow(<Outcome {...defaultProps()}/>)
  expect(wrapper.debug()).toMatchSnapshot()
})

it('renders correct expanded', () => {
  const wrapper = shallow(<Outcome {...defaultProps()} expanded />)
  expect(wrapper.debug()).toMatchSnapshot()
})

describe('header', () => {
  it('includes the outcome name', () => {
    const wrapper = shallow(<Outcome {...defaultProps()}/>)
    const header = wrapper.find('ToggleDetails')
    const summary = render(header.prop('summary'))
    expect(summary.text()).toMatch('My outcome')
  })

  it('includes mastery when mastered', () => {
    const props = defaultProps()
    props.outcome.mastered = true
    const wrapper = shallow(<Outcome {...props} />)
    const header = wrapper.find('ToggleDetails')
    const summary = render(header.prop('summary'))
    expect(summary.text()).toMatch('Mastered')
  })

  it('includes non-mastery when not mastered', () => {
    const wrapper = shallow(<Outcome {...defaultProps()} />)
    const header = wrapper.find('ToggleDetails')
    const summary = render(header.prop('summary'))
    expect(summary.text()).toMatch('Not mastered')
  })

  it('shows correct number of alignments', () => {
    const wrapper = shallow(<Outcome {...defaultProps()} />)
    const header = wrapper.find('ToggleDetails')
    const summary = render(header.prop('summary'))
    expect(summary.text()).toMatch('1 alignment')
  })
})

it('includes the individual results', () => {
  const wrapper = shallow(<Outcome {...defaultProps()} />)
  expect(wrapper.find('AssignmentResult')).toHaveLength(1)
})

describe('handleToggle()', () => {
  it('calls onExpansionChange with the correct data', () => {
    const props = defaultProps()
    props.onExpansionChange = jest.fn()

    const wrapper = shallow(<Outcome {...props} />)
    wrapper.instance().handleToggle(null, true)
    expect(props.onExpansionChange).toBeCalledWith('outcome', 100, true)
  })
})
