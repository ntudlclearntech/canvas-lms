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

import axios from 'axios'
import parseLinkHeader from 'jsx/shared/helpers/parseLinkHeader'
import MigrationStates from './migrationStates'

const ApiClient = {
  _depaginate (url, allResults = []) {
    return axios.get(url)
      .then((res) => {
        const results = allResults.concat(res.data)
        if (res.headers.link) {
          const links = parseLinkHeader(res)
          if (links.next) {
            return this._depaginate(links.next, results)
          }
        }
        res.data = results // eslint-disable-line
        return res
      })
  },

  _queryString (params) {
    return params.map((param) => {
      const key = Object.keys(param)[0]
      const value = param[key]
      return value ? `${key}=${value}` : null
    }).filter(param => !!param).join('&')
  },

  getCourses ({ accountId }, { search = '', term = '', subAccount = '' } = {}) {
    const params = this._queryString([
      { per_page: '100' },
      { blueprint: 'false' },
      { blueprint_associated: 'false' },
      { 'include[]': 'term' },
      { 'include[]': 'teachers' },
      { search_term: search },
      { enrollment_term_id: term },
    ])

    return this._depaginate(`/api/v1/accounts/${subAccount || accountId}/courses?${params}`)
  },

  getAssociations ({ course }) {
    const params = this._queryString([
      { per_page: '100' },
    ])

    return this._depaginate(`/api/v1/courses/${course.id}/blueprint_templates/default/associated_courses?${params}`)
  },

  saveAssociations ({ course, addedAssociations, removedAssociations }) {
    return axios.put(`/api/v1/courses/${course.id}/blueprint_templates/default/update_associations`, {
      course_ids_to_add: addedAssociations.map(c => c.id),
      course_ids_to_remove: removedAssociations,
    })
  },

  getMigrations ({ course }) {
    return axios.get(`/api/v1/courses/${course.id}/blueprint_templates/default/migrations`)
  },

  beginMigration ({ course, willSendNotification, willIncludeCustomNotificationMessage, notificationMessage}) {
    const params = {
      send_notification: willSendNotification
    }
    if (willIncludeCustomNotificationMessage && notificationMessage) {
      params.comment = notificationMessage
    }
    return axios.post(`/api/v1/courses/${course.id}/blueprint_templates/default/migrations`, params)
  },

  checkMigration (state) {
    return this.getMigrations(state)
      .then((res) => {
        let status = MigrationStates.states.void

        if (res.data[0]) {
          status = res.data[0].workflow_state
        }

        res.data = status // eslint-disable-line
        return res
      })
  },

  getMigrationDetails ({ course }, migrationId) {
    return axios.get(`/api/v1/courses/${course.id}/blueprint_templates/default/migrations/${migrationId}/details`)
  },

  getSyncHistory ({ course }) {
    return this.getMigrations({ course })
      .then(({ data }) =>
        Promise.all(
          // limit to last 5 migrations
          data.slice(0, 5)
            .map(mig =>
              this.getMigrationDetails({ course }, mig.id)
                .then(res => Object.assign(mig, { changes: res.data }))
            )))
  },
  loadUnsynchedChanges ({ course }) {
    return axios.get(`/api/v1/courses/${course.id}/blueprint_templates/default/unsynced_changes`)
  },
}

export default ApiClient
