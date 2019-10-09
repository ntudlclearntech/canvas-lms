/*
 * Copyright (C) 2017 - present Instructure, Inc.
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

import $ from 'jquery'
import React from 'react'
import TestUtils from 'react-dom/test-utils'
import CheckboxInput from 'jsx/external_apps/components/CheckboxInput'

QUnit.module('CheckboxInput#defaultState')

const component = TestUtils.renderIntoDocument(<CheckboxInput id="test" errors={{}} />)

test('toggles value when checked and unchecked', () => {
  const app = TestUtils.findRenderedComponentWithType(component, CheckboxInput)

  TestUtils.Simulate.change(app.refs.input, {target: {checked: true}})
  equal(app.state.value, true)

  TestUtils.Simulate.change(app.refs.input, {target: {checked: false}})
  equal(app.state.value, false)
})
