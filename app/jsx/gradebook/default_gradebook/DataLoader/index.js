/*
 * Copyright (C) 2020 - present Instructure, Inc.
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

import {RequestDispatch} from '../../../shared/network'
import AssignmentGroupsLoader from './AssignmentGroupsLoader'
import ContextModulesLoader from './ContextModulesLoader'
import CustomColumnsDataLoader from './CustomColumnsDataLoader'
import GradingPeriodAssignmentsLoader from './GradingPeriodAssignmentsLoader'
import OldDataLoader from './OldDataLoader'
import StudentContentDataLoader from './StudentContentDataLoader'
import StudentIdsLoader from './StudentIdsLoader'

export default class DataLoader {
  constructor({gradebook}) {
    this._gradebook = gradebook
    this.dispatch = new RequestDispatch({
      activeRequestLimit: gradebook.options.activeRequestLimit
    })

    const loaderConfig = {
      dispatch: this.dispatch,
      gradebook
    }

    this.assignmentGroupsLoader = new AssignmentGroupsLoader(loaderConfig)
    this.contextModulesLoader = new ContextModulesLoader(loaderConfig)
    this.customColumnsDataLoader = new CustomColumnsDataLoader(loaderConfig)
    this.gradingPeriodAssignmentsLoader = new GradingPeriodAssignmentsLoader(loaderConfig)
    this.studentContentDataLoader = new StudentContentDataLoader(loaderConfig)
    this.studentIdsLoader = new StudentIdsLoader(loaderConfig)
  }

  loadInitialData() {
    const gradebook = this._gradebook
    const {options} = gradebook

    const promises = OldDataLoader.loadGradebookData({
      dataLoader: this,
      dispatch: this.dispatch,
      gradebook,

      activeRequestLimit: options.performanceControls?.active_request_limit,
      courseId: options.context_id,

      getAssignmentGroups: true,
      getContextModules: true,
      getCustomColumns: true,
      getGradingPeriodAssignments: gradebook.gradingPeriodSet != null
    })

    // eslint-disable-next-line promise/catch-or-return
    promises.gotCustomColumns.then(customColumns => {
      gradebook.gotCustomColumns(customColumns)
    })

    // TODO: In TALLY-769, remove this entire block.
    // eslint-disable-next-line promise/catch-or-return
    Promise.all([
      promises.gotStudentIds,
      promises.gotContextModules,
      promises.gotCustomColumns,
      promises.gotAssignmentGroups,
      promises.gotGradingPeriodAssignments
    ]).then(() => {
      gradebook.finishRenderingUI()
    })
  }

  loadCustomColumnData(customColumnId) {
    this.customColumnsDataLoader.loadCustomColumnsData([customColumnId])
  }

  loadOverridesForSIS() {
    const gradebook = this._gradebook
    const {options} = gradebook

    const url = `/api/v1/courses/${options.context_id}/assignment_groups`
    const params = {
      exclude_assignment_submission_types: ['wiki_page'],
      exclude_response_fields: ['description', 'in_closed_grading_period', 'needs_grading_count'],
      include: ['assignments', 'grades_published', 'overrides'],
      override_assignment_dates: false
    }

    this.dispatch.getDepaginated(url, params).then(gradebook.addOverridesToPostGradesStore)
  }

  reloadStudentDataForEnrollmentFilterChange() {
    this._reloadStudentData({
      getGradingPeriodAssignments: true
    })
  }

  reloadStudentDataForSectionFilterChange() {
    this._reloadStudentData({
      getGradingPeriodAssignments: false
    })
  }

  reloadStudentDataForStudentGroupFilterChange() {
    this._reloadStudentData({
      getGradingPeriodAssignments: false
    })
  }

  // PRIVATE

  _reloadStudentData(loadOptions) {
    const gradebook = this._gradebook
    const {options} = gradebook

    gradebook.updateStudentsLoaded(false)
    gradebook.updateSubmissionsLoaded(false)

    OldDataLoader.loadGradebookData({
      dataLoader: this,
      dispatch: this.dispatch,
      gradebook,

      courseId: options.context_id,

      getGradingPeriodAssignments:
        loadOptions.getGradingPeriodAssignments && gradebook.gradingPeriodSet != null
    })
  }
}
