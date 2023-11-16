/*
 * Copyright (C) 2023 - present Instructure, Inc.
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

import React, {useEffect, useState} from 'react'
import {useScope as useI18nScope} from '@canvas/i18n'
import {Text} from '@instructure/ui-text'
import {Checkbox} from '@instructure/ui-checkbox'
import {Flex} from '@instructure/ui-flex'
import {NodeStructure} from './EnrollmentTree'
import {translateState} from './EnrollmentTreeGroup'
import RoleMismatchToolTip from './RoleMismatchToolTip'
import {createAnalyticPropsGenerator} from './util/analytics'
import {MODULE_NAME} from './types'

const I18n = useI18nScope('temporary_enrollment')

// initialize analytics props
const analyticProps = createAnalyticPropsGenerator(MODULE_NAME)

interface Props extends NodeStructure {
  indent: any
  updateCheck?: Function
  workflowState?: string
}

export function EnrollmentTreeItem(props: Props) {
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (props.isCheck !== undefined) {
      setChecked(props.isCheck)
    }
  }, [props.isCheck])

  const handleCheckboxChange = () => {
    setChecked(!checked)

    if (props.updateCheck) {
      props.updateCheck(props, !props.isCheck)
    }
  }

  const renderRow = () => {
    return (
      <Flex key={props.id} padding="xxx-small" as="div" alignItems="center">
        <Flex.Item margin={props.indent}>
          <Checkbox
            data-testid={'check ' + props.id}
            label=""
            size="medium"
            checked={checked}
            onChange={handleCheckboxChange}
            {...analyticProps('Course')}
          />
        </Flex.Item>
        <Flex.Item margin="0 0 0 x-small">
          <Text>{props.label}</Text>
        </Flex.Item>
        {props.isMismatch ? (
          <Flex.Item>
            <RoleMismatchToolTip />
          </Flex.Item>
        ) : null}
        {props.workflowState ? (
          <Flex.Item margin="0 medium">
            <Text weight="light">
              {I18n.t('course status: %{state}', {state: translateState(props.workflowState)})}
            </Text>
          </Flex.Item>
        ) : null}
      </Flex>
    )
  }

  return renderRow()
}
