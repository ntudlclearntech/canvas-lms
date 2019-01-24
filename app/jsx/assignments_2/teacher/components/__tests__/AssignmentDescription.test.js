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
import {render} from 'react-testing-library'
import apiUserContent from 'compiled/str/apiUserContent'
import AssignmentDescription from '../AssignmentDescription'

jest.mock('jsx/shared/rce/RichContentEditor') // jest cannot deal with jquery as loded from here

jest.mock('compiled/str/apiUserContent')
apiUserContent.convert = jest.fn(arg => `converted ${arg}`)

it('renders readOnly', () => {
  const text = 'Hello world'
  const {getByText, getByTestId} = render(<AssignmentDescription text={text} readOnly />)
  expect(getByTestId('AssignmentDescription')).toBeInTheDocument()
  expect(getByText(`converted ${text}`)).toBeInTheDocument()
})
