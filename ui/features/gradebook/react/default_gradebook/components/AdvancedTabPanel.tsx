// @ts-nocheck
/*
 * Copyright (C) 2018 - present Instructure, Inc.
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
import {bool, func, shape} from 'prop-types'
import {Checkbox} from '@instructure/ui-checkbox'
import {View} from '@instructure/ui-view'

import {useScope as useI18nScope} from '@canvas/i18n'

const I18n = useI18nScope('gradebook')

export default function AdvancedTabPanel(props) {
  const {courseSettings, onCourseSettingsChange, gradebookIsEditable} = props

  return (
    <div id="AdvancedTabPanel__Container">
      <View as="div" margin="small">
        <Checkbox
          checked={courseSettings.allowFinalGradeOverride}
          label={I18n.t('Allow final grade override')}
          onChange={event => {
            onCourseSettingsChange({allowFinalGradeOverride: event.target.checked})
          }}
          disabled={!gradebookIsEditable}
        />
      </View>
    </div>
  )
}

AdvancedTabPanel.propTypes = {
  courseSettings: shape({
    allowFinalGradeOverride: bool.isRequired,
  }).isRequired,
  onCourseSettingsChange: func.isRequired,
}
