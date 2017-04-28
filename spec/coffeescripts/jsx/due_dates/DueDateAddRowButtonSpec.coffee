#
# Copyright (C) 2015 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.

define [
  'jquery'
  'react'
  'react-dom'
  'react-addons-test-utils'
  'underscore'
  'jsx/due_dates/DueDateAddRowButton'
], ($, React, ReactDOM, {Simulate, SimulateNative}, _, DueDateAddRowButton) ->

  QUnit.module 'DueDateAddRowButton with true display prop',
    setup: ->
      props =
        display: true

      DueDateAddRowButtonElement = React.createElement(DueDateAddRowButton, props)
      @DueDateAddRowButton = ReactDOM.render(DueDateAddRowButtonElement, $('<div>').appendTo('body')[0])

    teardown: ->
      ReactDOM.unmountComponentAtNode(@DueDateAddRowButton.getDOMNode().parentNode)

  test 'renders a button', ->
    ok @DueDateAddRowButton.isMounted()
    ok @DueDateAddRowButton.refs.addButton


  QUnit.module 'DueDateAddRowButton with false display prop',
    setup: ->
      props =
        display: false

      DueDateAddRowButtonElement = React.createElement(DueDateAddRowButton, props)
      @DueDateAddRowButton = ReactDOM.render(DueDateAddRowButtonElement, $('<div>').appendTo('body')[0])

    teardown: ->
      if @DueDateAddRowButton.getDOMNode()
        ReactDOM.unmountComponentAtNode(@DueDateAddRowButton.getDOMNode().parentNode)

  test 'does not render a button', ->
    ok @DueDateAddRowButton.isMounted()
    ok !@DueDateAddRowButton.refs.addButton
