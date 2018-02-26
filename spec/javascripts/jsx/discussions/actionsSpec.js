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

import actions from 'jsx/discussions/actions'
import * as apiClient from 'jsx/discussions/apiClient'
import $ from 'jquery';
import 'compiled/jquery.rails_flash_notifications'

let sandbox = null

const mockApiClient = (method, res) => {
  sandbox = sinon.sandbox.create()
  sandbox.stub(apiClient, method).returns(res)
}

const mockSuccess = (method, data = {}) => mockApiClient(method, Promise.resolve(data))
const mockFail = (method, err = new Error('Request Failed')) => mockApiClient(method, Promise.reject(err))

QUnit.module('Discussions redux actions', {
  teardown () {
    if (sandbox) sandbox.restore()
    sandbox = null
  }
})

test('updateDiscussion dispatches UPDATE_DISCUSSION_START', () => {
  const state = { discussions: { pages: { 1: { items: [] } }, currentPage: 1 } }
  const discussion = { pinned: false, locked: false }
  const updateFields = { pinned: true }
  const dispatchSpy = sinon.spy()
  actions.updateDiscussion(discussion, updateFields, {})(dispatchSpy, () => state)
  const expected = [
    {
      payload: {
        discussion: {
          locked: false,
          pinned: true
        },
      },
      type: "UPDATE_DISCUSSION_START"
    }
  ]
  deepEqual(dispatchSpy.firstCall.args, expected)
})

test('updateDiscussion calls apiClient.updateDiscussion', () => {
  const state = { discussions: { pages: { 1: { items: [] } }, currentPage: 1 } }
  const discussion = { pinned: true, locked: true}
  const updateFields = {pinned: false}
  const dispatchSpy = sinon.spy()

  mockSuccess('updateDiscussion', {})
  actions.updateDiscussion(discussion, updateFields, {})(dispatchSpy, () => state)
  deepEqual(apiClient.updateDiscussion.firstCall.args[1], discussion)
  deepEqual(apiClient.updateDiscussion.firstCall.args[2], updateFields)
})

test('updateDiscussion dispatches UPDATE_DISCUSSION_FAIL if promise fails', (assert) => {
  const done = assert.async()
  const state = { discussions: { pages: { 1: { items: [] } }, currentPage: 1 } }
  const discussion = { pinned: true, locked: false}
  const updateFields = {locked: true}
  const dispatchSpy = sinon.spy()

  mockFail('updateDiscussion', 'something bad happened')
  actions.updateDiscussion(discussion, updateFields, {})(dispatchSpy, () => state)

  setTimeout(() => {
    const expected = [
      {
        payload: {
          discussion: {
            locked: false,
            pinned: true
          },
        err: "something bad happened",
        message: "Updating discussion failed"
        },
        type: "UPDATE_DISCUSSION_FAIL"
      }
    ]
    deepEqual(dispatchSpy.secondCall.args, expected)
    done()
  })
})

test('updateDiscussion calls screenReaderFlash if successful and success message present', (assert) => {
  const done = assert.async()
  const state = { discussions: { pages: { 1: { items: [] } }, currentPage: 1 } }
  const discussion = { pinned: true, locked: false}
  const updateFields = {locked: true}
  const flashMessages = { successMessage: 'success message' }
  const dispatchSpy = sinon.spy()
  const flashStub = sinon.spy($, 'screenReaderFlashMessage')

  mockSuccess('updateDiscussion', {})
  actions.updateDiscussion(discussion, updateFields, flashMessages)(dispatchSpy, () => state)

  setTimeout(() => {
    deepEqual(flashStub.firstCall.args, ["success message"])
    flashStub.restore()
    done()
  })
})


test('updateDiscussion does not call screenReaderFlash if successful and no success message present', (assert) => {
  const done = assert.async()
  const state = { discussions: { pages: { 1: { items: [] } }, currentPage: 1 } }
  const discussion = { pinned: true, locked: false}
  const updateFields = {locked: true}
  const dispatchSpy = sinon.spy()
  const flashStub = sinon.spy($, 'screenReaderFlashMessage')

  mockSuccess('updateDiscussion', {})
  actions.updateDiscussion(discussion, updateFields, {})(dispatchSpy, () => state)

  setTimeout(() => {
    equal(flashStub.callCount, 0)
    flashStub.restore()
    done()
  })
})

test('updateDiscussion calls screenReaderFlash if unsuccessful with custom flash message', (assert) => {
  const done = assert.async()
  const state = { discussions: { pages: { 1: { items: [] } }, currentPage: 1 } }
  const discussion = { pinned: true, locked: false}
  const updateFields = {locked: true}
  const flashMessages = { failMessage: 'fail message' }
  const dispatchSpy = sinon.spy()
  const flashStub = sinon.spy($, 'screenReaderFlashMessage')

  mockFail('updateDiscussion', 'badness occurres')
  actions.updateDiscussion(discussion, updateFields, flashMessages)(dispatchSpy, () => state)

  setTimeout(() => {
    deepEqual(flashStub.firstCall.args, ["fail message"])
    flashStub.restore()
    done()
  })
})

test('updateDiscussion throws exception if updating a field that does not exist on the discussion', (assert) => {
  const state = { discussions: { pages: { 1: { items: [] } }, currentPage: 1 } }
  const discussion = { pinned: true, locked: false}
  const updateFields = {foobar: true}
  const dispatchSpy = sinon.spy()

  assert.throws(
    function() {
      actions.updateDiscussion(discussion, updateFields, {})(dispatchSpy, () => state)
    },
    "field foobar does not exist in the discussion"
  )
})

QUnit.module('Discussion toggleSubscriptionState actions', {
  setup () {
    this.dispatchSpy = sinon.spy()
    this.getState = () => ({foo: 'bar'})
  },

  teardown () {
    if (sandbox) sandbox.restore()
    sandbox = null
  }
})

test('does not call the API if the discussion has a subscription_hold', function() {
  const discussion = { subscription_hold: 'test hold' }
  actions.toggleSubscriptionState(discussion)(this.dispatchSpy, this.getState)
  equal(this.dispatchSpy.callCount, 0)
})

test('calls unsubscribeFromTopic if the discussion is currently subscribed', function() {
  const discussion = { id: 1, subscribed: true }
  mockSuccess('unsubscribeFromTopic', {})
  actions.toggleSubscriptionState(discussion)(this.dispatchSpy, this.getState)
  equal(apiClient.unsubscribeFromTopic.callCount, 1)
  deepEqual(apiClient.unsubscribeFromTopic.firstCall.args, [this.getState(), discussion])
})

test('calls subscribeToTopic if the discussion is currently unsubscribed', function() {
  const discussion = { id: 1, subscribed: false }
  mockSuccess('subscribeToTopic', {})
  actions.toggleSubscriptionState(discussion)(this.dispatchSpy, this.getState)
  equal(apiClient.subscribeToTopic.callCount, 1)
  deepEqual(apiClient.subscribeToTopic.firstCall.args, [this.getState(), discussion])
})

test('dispatches toggleSubscribeSuccess with unsubscription status if currently subscribed', function(assert) {
  const done = assert.async()
  const discussion = { id: 1, subscribed: true }
  mockSuccess('unsubscribeFromTopic', {})
  actions.toggleSubscriptionState(discussion)(this.dispatchSpy, this.getState)

  setTimeout(() => {
    const expectedArgs = [{
      payload: { id: 1, subscribed: false },
      type: "TOGGLE_SUBSCRIBE_SUCCESS"
    }]
    deepEqual(this.dispatchSpy.secondCall.args, expectedArgs)
    done()
  })
})

test('dispatches toggleSubscribeSuccess with subscription status if currently unsubscribed', function(assert) {
  const done = assert.async()
  const discussion = { id: 1, subscribed: false }
  mockSuccess('subscribeToTopic', {})
  actions.toggleSubscriptionState(discussion)(this.dispatchSpy, this.getState)

  setTimeout(() => {
    const expectedArgs = [{
      payload: { id: 1, subscribed: true },
      type: "TOGGLE_SUBSCRIBE_SUCCESS"
    }]
    deepEqual(this.dispatchSpy.secondCall.args, expectedArgs)
    done()
  })
})

test('dispatches toggleSubscribeFail in an error occures on the API call', function(assert) {
  const done = assert.async()
  const flashStub = sinon.spy($, 'screenReaderFlashMessageExclusive')
  const discussion = { id: 1, subscribed: false }

  mockFail('subscribeToTopic', "test error message")
  actions.toggleSubscriptionState(discussion)(this.dispatchSpy, this.getState)

  setTimeout(() => {
    const expectedArgs = [{
      payload: { message: 'Subscribe failed', err: "test error message" },
      type: "TOGGLE_SUBSCRIBE_FAIL"
    }]
    deepEqual(this.dispatchSpy.secondCall.args, expectedArgs)
    deepEqual(flashStub.firstCall.args, ["Subscribe failed"]);
    flashStub.restore()
    done()
  })
})
