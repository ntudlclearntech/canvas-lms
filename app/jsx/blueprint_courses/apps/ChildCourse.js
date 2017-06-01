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

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import { ConnectedChildContent as ChildContent } from '../components/ChildContent'
import FlashNotifications from '../flashNotifications'
import createStore from '../store'
import Router from '../router'

export default class ChildCourse {
  constructor (root, data, debug) {
    this.root = root
    this.store = createStore(data, debug)
    this.router = new Router()
  }

  routes = [{
    path: Router.PATHS.singleMigration,
    onEnter: ({ params }) => this.app.showChangeLog(params),
    onExit: () => this.app.hideChangeLog(),
  }]

  setupRouter () {
    this.router.registerRoutes(this.routes)
    this.router.start()
  }

  unmount () {
    ReactDOM.unmountComponentAtNode(this.root)
    this.router.stop()
  }

  render () {
    ReactDOM.render(
      <Provider store={this.store}>
        <ChildContent routeTo={this.router.page} realRef={(c) => { this.app = c }} />
      </Provider>,
      this.root
    )
  }

  start () {
    FlashNotifications.subscribe(this.store)
    this.render()
    this.setupRouter()
  }
}
