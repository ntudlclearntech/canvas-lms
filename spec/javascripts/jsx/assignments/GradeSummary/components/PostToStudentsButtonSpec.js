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
import {mount} from 'enzyme'

import {
  FAILURE,
  STARTED,
} from 'ui/features/assignment_grade_summary/react/assignment/AssignmentActions.js'
import PostToStudentsButton from 'ui/features/assignment_grade_summary/react/components/PostToStudentsButton.js'

QUnit.module('GradeSummary PostToStudentsButton', suiteHooks => {
  let props
  let wrapper

  suiteHooks.beforeEach(() => {
    props = {
      assignment: {
        gradesPublished: true,
        muted: true,
      },
      onClick: sinon.spy(),
      unmuteAssignmentStatus: null,
    }
  })

  suiteHooks.afterEach(() => {
    wrapper.unmount()
  })

  function mountComponent() {
    wrapper = mount(<PostToStudentsButton {...props} />)
  }

  QUnit.module('when grades have not been released', contextHooks => {
    contextHooks.beforeEach(() => {
      props.assignment.gradesPublished = false
      mountComponent()
    })

    test('is labeled with "Post to Students"', () => {
      equal(wrapper.find('button').text(), 'Post to Students')
    })

    test('is disabled', () => {
      strictEqual(wrapper.find('button').prop('disabled'), true)
    })

    test('does not call the onClick prop when clicked', () => {
      wrapper.find('button').simulate('click')
      strictEqual(props.onClick.callCount, 0)
    })
  })

  QUnit.module('when grades are not yet posted to students', contextHooks => {
    contextHooks.beforeEach(mountComponent)

    test('is labeled with "Post to Students"', () => {
      equal(wrapper.find('button').text(), 'Post to Students')
    })

    test('is not read-only', () => {
      notEqual(wrapper.find('button').prop('aria-readonly'), true)
    })

    test('calls the onClick prop when clicked', () => {
      wrapper.find('button').simulate('click')
      strictEqual(props.onClick.callCount, 1)
    })
  })

  QUnit.module('when grades are being posted to students', contextHooks => {
    contextHooks.beforeEach(() => {
      props.unmuteAssignmentStatus = STARTED
      mountComponent()
    })

    test('is labeled with "Posting to Students"', () => {
      // The Spinner in the button duplicates the label. Assert that the label
      // includes the expected text, but is not exactly equal.
      const label = wrapper.find('button').text()
      ok(label.match(/Posting to Students/))
    })

    test('is read-only', () => {
      strictEqual(wrapper.find('button').prop('aria-readonly'), true)
    })

    test('does not call the onClick prop when clicked', () => {
      wrapper.find('button').simulate('click')
      strictEqual(props.onClick.callCount, 0)
    })
  })

  QUnit.module('when grades are visible to students', contextHooks => {
    contextHooks.beforeEach(() => {
      props.assignment.muted = false
      mountComponent()
    })

    test('is labeled with "Grades Posted to Students"', () => {
      // The Icon in the button duplicates the label. Assert that the label
      // includes the expected text, but is not exactly equal.
      const label = wrapper.find('button').text()
      ok(label.match(/Grades Posted to Students/))
    })

    test('is read-only', () => {
      strictEqual(wrapper.find('button').prop('aria-readonly'), true)
    })

    test('does not call the onClick prop when clicked', () => {
      wrapper.find('button').simulate('click')
      strictEqual(props.onClick.callCount, 0)
    })
  })

  QUnit.module('when posting to students failed', contextHooks => {
    contextHooks.beforeEach(() => {
      props.unmuteAssignmentStatus = FAILURE
      mountComponent()
    })

    test('is labeled with "Post to Students"', () => {
      equal(wrapper.find('button').text(), 'Post to Students')
    })

    test('is not read-only', () => {
      notEqual(wrapper.find('button').prop('aria-readonly'), true)
    })

    test('calls the onClick prop when clicked', () => {
      wrapper.find('button').simulate('click')
      strictEqual(props.onClick.callCount, 1)
    })
  })
})
