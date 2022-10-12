/*
 * Copyright (C) 2011 - present Instructure, Inc.
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
import GradebookData from './react/default_gradebook/GradebookData'
import type {GradebookOptions} from './react/default_gradebook/gradebook.d'
import ready from '@instructure/ready'

import('@canvas/context-cards/react/StudentContextCardTrigger')

ready(() => {
  const mountPoint = document.querySelector('#gradebook_app') as HTMLElement
  const filterNavNode = document.querySelector('#gradebook-filter-nav') as HTMLDivElement
  const gradebookMenuNode = document.querySelector(
    '[data-component="GradebookMenu"]'
  ) as HTMLSpanElement
  const settingsModalButtonContainer = document.getElementById(
    'gradebook-settings-modal-button-container'
  ) as HTMLSpanElement
  const gridColorNode = document.querySelector('[data-component="GridColor"]') as HTMLSpanElement
  const viewOptionsMenuNode = document.querySelector(
    "[data-component='ViewOptionsMenu']"
  ) as HTMLSpanElement
  const applyScoreToUngradedModalNode = document.querySelector(
    '[data-component="ApplyScoreToUngradedModal"]'
  ) as HTMLSpanElement
  const gradingPeriodsFilterContainer = document.getElementById(
    'grading-periods-filter-container'
  ) as HTMLElement
  const gradebookGridNode = document.getElementById('gradebook_grid') as HTMLDivElement
  const flashMessageContainer = document.getElementById('flash_message_holder') as HTMLDivElement

  ReactDOM.render(
    <GradebookData
      applyScoreToUngradedModalNode={applyScoreToUngradedModalNode}
      currentUserId={ENV.current_user_id as string}
      filterNavNode={filterNavNode}
      flashMessageContainer={flashMessageContainer}
      gradebookEnv={ENV.GRADEBOOK_OPTIONS as GradebookOptions}
      gradebookGridNode={gradebookGridNode}
      gradebookMenuNode={gradebookMenuNode}
      gradingPeriodsFilterContainer={gradingPeriodsFilterContainer}
      gridColorNode={gridColorNode}
      locale={ENV.LOCALE}
      settingsModalButtonContainer={settingsModalButtonContainer}
      viewOptionsMenuNode={viewOptionsMenuNode}
    />,
    mountPoint
  )
})
