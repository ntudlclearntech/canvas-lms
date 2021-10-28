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

import {Action} from 'redux'
import {ThunkAction} from 'redux-thunk'
import {showFlashAlert} from '@canvas/alerts/react/FlashAlert'
// @ts-ignore: TS doesn't understand i18n scoped imports
import I18n from 'i18n!pace_plans_actions'

import {PacePlan, PlanContextTypes, Progress, StoreState} from '../types'
import {createAction, ActionsUnion} from '../shared/types'
import {actions as uiActions} from './ui'
import * as Api from '../api/pace_plan_api'

export const PUBLISH_STATUS_POLLING_MS = 3000
const TERMINAL_PROGRESS_STATUSES = ['completed', 'failed']

export enum Constants {
  SET_END_DATE = 'PACE_PLAN/SET_END_DATE',
  SET_START_DATE = 'PACE_PLAN/SET_START_DATE',
  PUBLISH_PLAN = 'PACE_PLAN/PUBLISH_PLAN',
  TOGGLE_EXCLUDE_WEEKENDS = 'PACE_PLAN/TOGGLE_EXCLUDE_WEEKENDS',
  SET_PACE_PLAN = 'PACE_PLAN/SET_PACE_PLAN',
  PLAN_CREATED = 'PACE_PLAN/PLAN_CREATED',
  TOGGLE_HARD_END_DATES = 'PACE_PLAN/TOGGLE_HARD_END_DATES',
  RESET_PLAN = 'PACE_PLAN/RESET_PLAN',
  SET_PROGRESS = 'PACE_PLAN/SET_PROGRESS'
}

/* Action creators */

type LoadingAfterAction = (plan: PacePlan) => any
// Without this, we lose the ReturnType through our mapped ActionsUnion (because of setPlanDays), and the type just becomes any.
type SetEndDate = {type: Constants.SET_END_DATE; payload: string}

const regularActions = {
  setPacePlan: (plan: PacePlan) =>
    createAction(Constants.SET_PACE_PLAN, {...plan, originalPlan: plan}),
  setStartDate: (date: string) => createAction(Constants.SET_START_DATE, date),
  setEndDate: (date: string): SetEndDate => createAction(Constants.SET_END_DATE, date),
  planCreated: (plan: PacePlan) => createAction(Constants.PLAN_CREATED, plan),
  toggleExcludeWeekends: () => createAction(Constants.TOGGLE_EXCLUDE_WEEKENDS),
  toggleHardEndDates: () => createAction(Constants.TOGGLE_HARD_END_DATES),
  resetPlan: () => createAction(Constants.RESET_PLAN),
  setProgress: (progress?: Progress) => createAction(Constants.SET_PROGRESS, progress)
}

const thunkActions = {
  publishPlan: (): ThunkAction<Promise<void>, StoreState, void, Action> => {
    return (dispatch, getState) => {
      dispatch(uiActions.showLoadingOverlay(I18n.t('Starting publish...')))

      return Api.publish(getState().pacePlan)
        .then(responseBody => {
          if (!responseBody) throw new Error(I18n.t('Response body was empty'))
          const {pace_plan: updatedPlan, progress} = responseBody
          dispatch(pacePlanActions.setPacePlan(updatedPlan))
          dispatch(pacePlanActions.setProgress(progress))
          dispatch(pacePlanActions.pollForPublishStatus())
          dispatch(uiActions.hideLoadingOverlay())
        })
        .catch(error => {
          dispatch(uiActions.hideLoadingOverlay())
          dispatch(uiActions.setErrorMessage(I18n.t('There was an error publishing your plan.')))
          console.log(error) // eslint-disable-line no-console
        })
    }
  },
  pollForPublishStatus: (): ThunkAction<void, StoreState, void, Action> => {
    // Give the thunk function a name so that we can assert on it in tests
    return function pollingThunk(dispatch, getState) {
      const progress = getState().pacePlan.publishingProgress
      if (!progress || TERMINAL_PROGRESS_STATUSES.includes(progress.workflow_state)) return

      const pollingLoop = () =>
        Api.getPublishProgress(progress.id)
          .then(updatedProgress => {
            if (!updatedProgress) throw new Error(I18n.t('Response body was empty'))
            dispatch(
              pacePlanActions.setProgress(
                updatedProgress.workflow_state !== 'completed' ? updatedProgress : undefined
              )
            )
            if (TERMINAL_PROGRESS_STATUSES.includes(updatedProgress.workflow_state)) {
              showFlashAlert({
                message: I18n.t('Finished publishing plan'),
                err: null,
                type: 'success',
                srOnly: true
              })
            } else {
              setTimeout(pollingLoop, PUBLISH_STATUS_POLLING_MS)
            }
          })
          .catch(error => {
            dispatch(
              uiActions.setErrorMessage(
                I18n.t('There was an error checking plan publishing status')
              )
            )
            console.log(error) // eslint-disable-line no-console
          })
      return pollingLoop()
    }
  },
  resetToLastPublished: (
    contextType: PlanContextTypes,
    contextId: string
  ): ThunkAction<void, StoreState, void, Action> => {
    return async (dispatch, getState) => {
      dispatch(uiActions.showLoadingOverlay(I18n.t('Loading...')))

      await Api.waitForActionCompletion(() => getState().ui.autoSaving)

      return Api.resetToLastPublished(contextType, contextId)
        .then(pacePlan => {
          if (!pacePlan) throw new Error(I18n.t('Response body was empty'))
          dispatch(pacePlanActions.setPacePlan(pacePlan))
          dispatch(uiActions.hideLoadingOverlay())
        })
        .catch(error => {
          dispatch(uiActions.hideLoadingOverlay())
          dispatch(
            uiActions.setErrorMessage(I18n.t('There was an error resetting to the previous plan.'))
          )
          console.error(error) // eslint-disable-line no-console
        })
    }
  },
  loadLatestPlanByContext: (
    contextType: PlanContextTypes,
    contextId: string,
    afterAction: LoadingAfterAction = pacePlanActions.setPacePlan
  ): ThunkAction<void, StoreState, void, Action> => {
    return async (dispatch, getState) => {
      dispatch(uiActions.showLoadingOverlay(I18n.t('Loading...')))

      await Api.waitForActionCompletion(() => getState().ui.autoSaving)

      return Api.getNewPacePlanFor(getState().course.id, contextType, contextId)
        .then(pacePlan => {
          if (!pacePlan) throw new Error(I18n.t('Response body was empty'))
          dispatch(afterAction(pacePlan))
          dispatch(uiActions.hideLoadingOverlay())
        })
        .catch(error => {
          dispatch(uiActions.hideLoadingOverlay())
          dispatch(uiActions.setErrorMessage(I18n.t('There was an error loading the plan.')))
          console.error(error) // eslint-disable-line no-console
        })
    }
  },
  relinkToParentPlan: (): ThunkAction<void, StoreState, void, Action> => {
    return async (dispatch, getState) => {
      const pacePlanId = getState().pacePlan.id
      if (!pacePlanId) return Promise.reject(new Error(I18n.t('Cannot relink unsaved plans')))

      dispatch(uiActions.showLoadingOverlay(I18n.t('Relinking plans...')))

      await Api.waitForActionCompletion(() => getState().ui.autoSaving)

      return Api.relinkToParentPlan(pacePlanId)
        .then(pacePlan => {
          if (!pacePlan) throw new Error(I18n.t('Response body was empty'))
          dispatch(pacePlanActions.setPacePlan(pacePlan))
          dispatch(uiActions.hideLoadingOverlay())
        })
        .catch(error => {
          dispatch(uiActions.hideLoadingOverlay())
          dispatch(uiActions.setErrorMessage(I18n.t('There was an error linking plan.')))
          console.error(error) // eslint-disable-line no-console
        })
    }
  }
}

export const pacePlanActions = {...regularActions, ...thunkActions}
export type PacePlanAction = ActionsUnion<typeof regularActions>
