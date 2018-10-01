/*
 * Copyright (C) 2015 - present Instructure, Inc.
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
import ReactDOM from 'react-dom'
import TestUtils from 'react-dom/test-utils'
import ReactDndTestBackend from 'react-dnd-test-backend'
import getDroppableDashboardCardBox from 'jsx/dashboard_card/getDroppableDashboardCardBox'
import CourseActivitySummaryStore from 'jsx/dashboard_card/CourseActivitySummaryStore'

QUnit.module('DashboardCardBox', {
  setup() {
    sandbox.stub(CourseActivitySummaryStore, 'getStateForCourse').returns({})
    this.courseCards = [
      {
        id: 1,
        shortName: 'Bio 101'
      },
      {
        id: 2,
        shortName: 'Philosophy 201'
      }
    ]
  },
  teardown() {
    localStorage.clear()
    if (this.component) {
      ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(this.component).parentNode)
    }
  }
})

test('should render div.ic-DashboardCard per provided courseCard', function() {
  const Box = getDroppableDashboardCardBox(ReactDndTestBackend)
  const CardBox = <Box connectDropTarget={el => el} courseCards={this.courseCards} />
  this.component = TestUtils.renderIntoDocument(CardBox)
  const $html = $(ReactDOM.findDOMNode(this.component))
  equal($html.children('div.ic-DashboardCard').length, this.courseCards.length)
})
