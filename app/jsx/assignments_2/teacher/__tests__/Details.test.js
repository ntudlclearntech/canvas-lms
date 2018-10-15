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
import {shallow} from 'enzyme'
import apiUserContent from 'compiled/str/apiUserContent'
import Details from '../Details'

jest.mock('compiled/str/apiUserContent')
apiUserContent.convert = jest.fn(arg => `converted ${arg}`)

it('renders and converts', () => {
  const assignment = {
    name: 'title',
    pointsPossible: 42,
    dueAt: 'due',
    description: '<p>some assignment description</p>',
  }
  const wrapper = shallow(<Details assignment={assignment} />)
  // snapshot also tests that the content was converted
  expect(wrapper).toMatchSnapshot()
})
