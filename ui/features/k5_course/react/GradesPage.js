/*
 * Copyright (C) 2021 - present Instructure, Inc.
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

import React, {useState, useCallback, useEffect} from 'react'
import I18n from 'i18n!k5_course_GradesPage'
import PropTypes from 'prop-types'

import {showFlashError} from '@canvas/alerts/react/FlashAlert'
import useFetchApi from '@canvas/use-fetch-api-hook'
import GradingPeriodSelect from './GradingPeriodSelect'
import GradesEmptyPage from './GradesEmptyPage'
import GradeDetails from './GradeDetails'

export const GradesPage = ({
  courseId,
  courseName,
  hideFinalGrades,
  currentUser,
  userIsInstructor
}) => {
  const [loadingGradingPeriods, setLoadingGradingPeriods] = useState(true)
  const [error, setError] = useState(null)
  const [gradingPeriods, setGradingPeriods] = useState(null)
  const [currentGradingPeriodId, setCurrentGradingPeriodId] = useState(null)
  const [allowTotalsForAllPeriods, setAllowTotalsForAllPeriods] = useState(true)
  const [selectedGradingPeriodId, setSelectedGradingPeriodId] = useState(null)

  useFetchApi({
    path: `/api/v1/courses/${courseId}`,
    loading: setLoadingGradingPeriods,
    success: useCallback(data => {
      setGradingPeriods(data.grading_periods)
      setCurrentGradingPeriodId(data.enrollments[0].current_grading_period_id)
      setAllowTotalsForAllPeriods(data.enrollments[0].totals_for_all_grading_periods_option)
    }, []),
    error: setError,
    params: {
      include: ['grading_periods', 'current_grading_period_scores', 'total_scores']
    }
  })

  useEffect(() => {
    if (error) {
      showFlashError(I18n.t('Failed to load grading periods for %{courseName}', {courseName}))(
        error
      )
      setError(null)
    }
  }, [error, courseName])

  const allGradingPeriodsSelected = gradingPeriods?.length > 0 && selectedGradingPeriodId === null
  const showTotals = !hideFinalGrades && !(allGradingPeriodsSelected && !allowTotalsForAllPeriods)

  return userIsInstructor ? (
    <GradesEmptyPage userIsInstructor courseId={courseId} />
  ) : (
    <>
      {(gradingPeriods?.length > 0 || loadingGradingPeriods) && (
        <GradingPeriodSelect
          loadingGradingPeriods={loadingGradingPeriods}
          gradingPeriods={gradingPeriods}
          onGradingPeriodSelected={setSelectedGradingPeriodId}
          currentGradingPeriodId={currentGradingPeriodId}
          courseName={courseName}
        />
      )}
      <GradeDetails
        courseId={courseId}
        courseName={courseName}
        selectedGradingPeriodId={selectedGradingPeriodId}
        showTotals={showTotals}
        currentUser={currentUser}
        loadingGradingPeriods={loadingGradingPeriods}
      />
    </>
  )
}

GradesPage.propTypes = {
  courseId: PropTypes.string.isRequired,
  courseName: PropTypes.string.isRequired,
  hideFinalGrades: PropTypes.bool.isRequired,
  currentUser: PropTypes.object.isRequired,
  userIsInstructor: PropTypes.bool.isRequired
}

export default GradesPage
