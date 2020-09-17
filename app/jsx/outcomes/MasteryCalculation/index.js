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

import React, {useCallback} from 'react'
import I18n from 'i18n!MasteryScale'
import {Spinner} from '@instructure/ui-spinner'
import {Text} from '@instructure/ui-text'
import ProficiencyCalculation from './ProficiencyCalculation'
import RoleList from '../RoleList'
import {OUTCOME_PROFICIENCY_QUERY, SET_OUTCOME_CALCULATION_METHOD} from './api'
import {useQuery, useMutation} from 'react-apollo'

const MasteryCalculation = ({contextType, contextId}) => {
  const {loading, error, data} = useQuery(OUTCOME_PROFICIENCY_QUERY, {
    variables: {contextId}
  })

  const [setCalculationMethodQuery, {error: setCalculationMethodError}] = useMutation(
    SET_OUTCOME_CALCULATION_METHOD
  )
  const setCalculationMethod = useCallback(
    (calculationMethod, calculationInt) => {
      setCalculationMethodQuery({
        variables: {contextType, contextId, calculationMethod, calculationInt}
      })
    },
    [contextType, contextId, setCalculationMethodQuery]
  )

  if (loading) {
    return (
      <div style={{textAlign: 'center'}}>
        <Spinner renderTitle={I18n.t('Loading')} size="large" margin="0 0 0 medium" />
      </div>
    )
  }
  if (error) {
    return (
      <Text color="danger">
        {I18n.t('An error occurred while loading the outcome calculation: %{error}', {error})}
      </Text>
    )
  }
  const {outcomeCalculationMethod} = data.account
  const roles = ENV.PROFICIENCY_CALCULATION_METHOD_ENABLED_ROLES || []
  return (
    <>
      <RoleList
        description={I18n.t(
          'Permission to change this mastery calculation is enabled at the account level for:'
        )}
        roles={roles}
      />
      <ProficiencyCalculation
        contextType={contextType}
        contextId={contextId}
        method={outcomeCalculationMethod || undefined} // send undefined when value is null
        update={setCalculationMethod}
        updateError={setCalculationMethodError}
      />
    </>
  )
}

export default MasteryCalculation
