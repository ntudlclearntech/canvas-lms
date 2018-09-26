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

import actions from 'jsx/developer_keys/actions/ltiKeyActions'
import reducer from 'jsx/developer_keys/reducers/createLtiKeyReducer'

function freshState() {
  return {
    ltiKey: false,
    customizing: false
  }
}

it('sets the defaults', () => {
  const defaults = reducer(undefined, {})
  expect(defaults.ltiKey).toEqual(false)
  expect(defaults.customizing).toEqual(false)
})

it('handles "LTI_KEYS_SET_LTI_KEY"', () => {
  const state = freshState()
  const action = actions.ltiKeysSetLtiKey(true)
  const newState = reducer(state, action)

  expect(newState.ltiKey).toEqual(true)
  expect(newState.customizing).toEqual(false)
})

it('handles "LTI_KEYS_SET_CUSTOMIZING"', () => {
  const state = freshState()
  const action = actions.ltiKeysSetCustomizing(true)
  const newState = reducer(state, action)

  expect(newState.ltiKey).toEqual(false)
  expect(newState.customizing).toEqual(true)
})
