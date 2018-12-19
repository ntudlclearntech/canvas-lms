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

import {cspEnabled, whitelistedDomains} from '../reducers'
import {
  SET_CSP_ENABLED,
  SET_CSP_ENABLED_OPTIMISTIC,
  ADD_DOMAIN,
  ADD_DOMAIN_OPTIMISTIC,
  ADD_DOMAIN_BULK
} from '../actions'

describe('cspEnabled', () => {
  const testMatrix = [
    [{type: SET_CSP_ENABLED, payload: true}, undefined, true],
    [{type: SET_CSP_ENABLED_OPTIMISTIC, payload: false}, undefined, false]
  ]
  it.each(testMatrix)(
    'with %p action and %p value the cspEnabled state becomes %p',
    (action, initialState, expectedState) => {
      expect(cspEnabled(initialState, action)).toEqual(expectedState)
    }
  )
})

describe('whitelistedDomains', () => {
  const testMatrix = [
    [{type: ADD_DOMAIN, payload: {account: 'instructure.com'}}, [], {account: ['instructure.com']}],
    [
      {type: ADD_DOMAIN_OPTIMISTIC, payload: {account: 'instructure.com'}},
      [],
      {account: ['instructure.com']}
    ],
    [
      {type: ADD_DOMAIN_BULK, payload: {account: ['instructure.com'], tools: ['bridgelms.com']}},
      {account: ['canvaslms.com', 'eduappcenter.com']},
      {account: ['canvaslms.com', 'eduappcenter.com', 'instructure.com'], tools: ['bridgelms.com']}
    ]
  ]
  it.each(testMatrix)(
    'with %p action and %p payload the whitelistedDomains state becomes %p',
    (action, initialState, expectedState) => {
      expect(whitelistedDomains(initialState, action)).toEqual(expectedState)
    }
  )

  it('does not allow duplicate domains with ADD_DOMAIN actions', () => {
    const action = {type: ADD_DOMAIN, payload: {account: 'instructure.com'}}
    const initialState = {account: ['instructure.com', 'canvaslms.com']}
    expect(whitelistedDomains(initialState, action)).toEqual({
      account: ['instructure.com', 'canvaslms.com']
    })
  })

  it('does not allow duplicates domains with ADD_DOMAIN_BULK actions', () => {
    const action = {type: ADD_DOMAIN_BULK, payload: {account: ['instructure.com', 'bridgelms.com']}}
    const initialState = {account: ['instructure.com', 'canvaslms.com']}
    expect(whitelistedDomains(initialState, action)).toEqual({
      account: ['instructure.com', 'canvaslms.com', 'bridgelms.com']
    })
  })
})
