/*
 * Copyright (C) 2016 - present Instructure, Inc.
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

import {asJson, consumePrefetchedXHR} from '@instructure/js-utils'

import {deferPromise} from '../../../shared/async'
import StudentContentDataLoader from './StudentContentDataLoader'

function getStudentIds(courseId, dispatch) {
  if (ENV.prefetch_gradebook_user_ids) {
    /*
     * When user ids have been prefetched, the data is only known valid for the
     * first request. Consume it by pulling it out of the prefetch store, which
     * will force all subsequent requests for user ids to call through the
     * network.
     */
    const promise = consumePrefetchedXHR('user_ids')
    if (promise) {
      return asJson(promise)
    }
  }

  const url = `/courses/${courseId}/gradebook/user_ids`
  return dispatch.getJSON(url)
}

function getGradingPeriodAssignments(courseId, dispatch) {
  const url = `/courses/${courseId}/gradebook/grading_period_assignments`
  return dispatch.getJSON(url)
}

function getAssignmentGroups(options, dispatch) {
  const url = `/api/v1/courses/${options.courseId}/assignment_groups`
  const params = {
    exclude_assignment_submission_types: ['wiki_page'],
    exclude_response_fields: ['description', 'in_closed_grading_period', 'needs_grading_count'],
    include: [
      'assignment_group_id',
      'assignment_visibility',
      'assignments',
      'grades_published',
      'module_ids',
      'post_manually'
    ],
    override_assignment_dates: false
  }

  return dispatch.getDepaginated(url, params)
}

function getContextModules(courseId, dispatch) {
  const url = `/api/v1/courses/${courseId}/modules`
  return dispatch.getDepaginated(url)
}

function getCustomColumns(courseId, dispatch) {
  const url = `/api/v1/courses/${courseId}/custom_gradebook_columns`
  return dispatch.getDepaginated(url, {include_hidden: true})
}

// This function is called from showNoteColumn in Gradebook.coffee
// when the notes column is revealed. In that case dispatch won't
// exist so we'll create a new Dispatcher for this request.
function getDataForColumn(courseId, columnId, options, perPageCallback, dispatch) {
  const url = `/api/v1/courses/${courseId}/custom_gradebook_columns/${columnId}/data`
  const augmentedCallback = data => perPageCallback(columnId, data)
  const params = {include_hidden: true, per_page: options.perPage}
  return dispatch.getDepaginated(url, params, augmentedCallback)
}

function getCustomColumnData(options, customColumnsDfd, dispatch) {
  const {courseId, gradebook} = options
  const perPageCallback = gradebook.gotCustomColumnDataChunk
  const customColumnDataLoaded = deferPromise()

  if (options.customColumnIds) {
    const customColumnDataDfds = options.customColumnIds.map(columnId =>
      getDataForColumn(courseId, columnId, options, perPageCallback, dispatch)
    )
    Promise.all(customColumnDataDfds).then(() => customColumnDataLoaded.resolve())
  } else {
    customColumnsDfd.then(customColumns => {
      const customColumnDataDfds = customColumns.map(column =>
        getDataForColumn(courseId, column.id, options, perPageCallback, dispatch)
      )
      Promise.all(customColumnDataDfds).then(() => customColumnDataLoaded.resolve())
    })
  }

  return customColumnDataLoaded.promise
}

function loadGradebookData(opts) {
  const {dispatch} = opts

  const gotAssignmentGroups = opts.getAssignmentGroups ? getAssignmentGroups(opts, dispatch) : null

  // Begin loading Students before any other data.
  const gotStudentIds = getStudentIds(opts.courseId, dispatch)
  let gotGradingPeriodAssignments
  if (opts.getGradingPeriodAssignments) {
    gotGradingPeriodAssignments = getGradingPeriodAssignments(opts.courseId, dispatch)
  }

  const gotCustomColumns = opts.getCustomColumns ? getCustomColumns(opts.courseId, dispatch) : null

  const studentContentDataLoader = new StudentContentDataLoader(
    {
      courseId: opts.courseId,
      gradebook: opts.gradebook,
      loadedStudentIds: opts.loadedStudentIds,
      studentsChunkSize: opts.perPage,
      submissionsChunkSize: opts.submissionsChunkSize
    },
    dispatch
  )

  const gotContextModules = opts.getContextModules
    ? getContextModules(opts.courseId, dispatch)
    : null

  const gotStudents = deferPromise()
  const gotSubmissions = deferPromise()

  Promise.resolve(gotStudentIds)
    .then(data => studentContentDataLoader.load(data.user_ids))
    .then(() => {
      gotStudents.resolve()
      gotSubmissions.resolve()
    })

  // Custom Column Data will load only after custom columns and all submissions.
  gotSubmissions.promise.then(() => getCustomColumnData(opts, gotCustomColumns, dispatch))

  return {
    gotAssignmentGroups,
    gotContextModules,
    gotCustomColumns,
    gotGradingPeriodAssignments,
    gotStudentIds,
    gotStudents: gotStudents.promise,
    gotSubmissions: gotSubmissions.promise
  }
}

export default {
  getDataForColumn,
  loadGradebookData
}
