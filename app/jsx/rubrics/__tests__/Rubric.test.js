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
import _ from 'lodash'
import Rubric from '../Rubric'
import { rubric, pointsAssessment } from './fixtures'

describe('the Rubric component', () => {
  it('renders as expected', () => {
    const modal = shallow(<Rubric rubric={rubric} rubricAssessment={pointsAssessment}/>)
    expect(modal.debug()).toMatchSnapshot()
  })

  const setCloned = (object, path, value) => _.setWith(_.clone(object), path, value, _.clone)
  it('hides the score total when needed', () => {
    const hidden = setCloned(pointsAssessment, 'rubric_association.hide_score_total', true)
    const modal = shallow(
      <Rubric
        rubric={rubric}
        rubricAssessment={hidden}
      />)
    expect(modal.debug()).toMatchSnapshot()
  })
})
