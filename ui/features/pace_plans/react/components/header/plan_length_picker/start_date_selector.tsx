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

import React from 'react'
import {connect} from 'react-redux'
import moment from 'moment-timezone'

import {autoSavingActions as actions} from '../../../actions/pace_plans'
import PacePlanDateInput from '../../../shared/components/pace_plan_date_input'
import {StoreState, PacePlan} from '../../../types'
import {BlackoutDate} from '../../../shared/types'
import {getPacePlan, getDisabledDaysOfWeek, isPlanCompleted} from '../../../reducers/pace_plans'
import {getBlackoutDates} from '../../../shared/reducers/blackout_dates'
import * as DateHelpers from '../../../utils/date_stuff/date_helpers'

interface StoreProps {
  readonly pacePlan: PacePlan
  readonly disabledDaysOfWeek: number[]
  readonly blackoutDates: BlackoutDate[]
  readonly planCompleted: boolean
}

interface DispatchProps {
  readonly setStartDate: typeof actions.setStartDate
}

type ComponentProps = StoreProps & DispatchProps

export class StartDateSelector extends React.Component<ComponentProps> {
  onDateChange = (rawValue: string) => {
    this.props.setStartDate(rawValue)
  }

  isDayDisabled = (date: moment.Moment) => {
    return (
      date > moment(this.props.pacePlan.end_date) ||
      DateHelpers.inBlackoutDate(date, this.props.blackoutDates)
    )
  }

  disabled() {
    return (
      this.props.planCompleted ||
      (this.props.pacePlan.context_type === 'Enrollment' && this.props.pacePlan.hard_end_dates)
    )
  }

  render() {
    return (
      <PacePlanDateInput
        id="start-date"
        disabled={this.disabled()}
        dateValue={this.props.pacePlan.start_date}
        onDateChange={this.onDateChange}
        disabledDaysOfWeek={this.props.disabledDaysOfWeek}
        disabledDays={this.isDayDisabled}
        label="Start Date"
        width="149px"
      />
    )
  }
}

const mapStateToProps = (state: StoreState): StoreProps => {
  return {
    pacePlan: getPacePlan(state),
    disabledDaysOfWeek: getDisabledDaysOfWeek(state),
    blackoutDates: getBlackoutDates(state),
    planCompleted: isPlanCompleted(state)
  }
}

export default connect(mapStateToProps, {setStartDate: actions.setStartDate} as DispatchProps)(
  StartDateSelector
)
