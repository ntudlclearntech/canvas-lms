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
import {useScope as useI18nScope} from '@canvas/i18n'
import {SimpleSelect} from '@instructure/ui-simple-select'
import CanvasDateInput from '@canvas/datetime/react/components/DateInput'
import moment from 'moment'
import {MomentInput} from 'moment-timezone'
import tz from '@canvas/timezone'
import type {
  AssignmentGroup,
  FilterCondition,
  GradingPeriod,
  Module,
  Section,
  StudentGroupCategoryMap
} from '../gradebook.d'

const I18n = useI18nScope('gradebook')

const {Option, Group: OptionGroup} = SimpleSelect as any
const formatDate = date => tz.format(date, 'date.formats.medium')
const dateLabels = {'start-date': I18n.t('Start Date'), 'end-date': I18n.t('End Date')}

type SubmissionTypeOption = ['has-ungraded-submissions' | 'has-submissions', string]

const submissionTypeOptions: SubmissionTypeOption[] = [
  ['has-ungraded-submissions', I18n.t('Has ungraded submissions')],
  ['has-submissions', I18n.t('Has submissions')]
]

const conditionTypeLabels = {
  'assignment-group': I18n.t('Assignment Groups'),
  'grading-period': I18n.t('Grading Periods'),
  module: I18n.t('Modules'),
  section: I18n.t('Sections'),
  'student-group': I18n.t('Student Groups'),
  submission: I18n.t('Submissions'),
  'start-date': I18n.t('Start Date'),
  'end-date': I18n.t('End Date')
}

type Props = {
  assignmentGroups: AssignmentGroup[]
  condition: FilterCondition
  gradingPeriods: GradingPeriod[]
  modules: Module[]
  onChange: any
  sections: Section[]
  studentGroupCategories: StudentGroupCategoryMap
}

type MenuItem = [id: string, name: string]

export default function ({
  condition,
  onChange,
  modules,
  assignmentGroups,
  gradingPeriods,
  sections,
  studentGroupCategories
}: Props) {
  let items: MenuItem[] = []
  let itemGroups: [string, string, MenuItem[]][] = []

  switch (condition.type) {
    case 'module': {
      items = modules.map(({id, name}) => [id, name])
      break
    }
    case 'assignment-group': {
      items = assignmentGroups.map(({id, name}) => [id, name])
      break
    }
    case 'section': {
      items = sections.map(({id, name}) => [id, name])
      break
    }
    case 'student-group': {
      itemGroups = Object.values(studentGroupCategories).map(c => [
        c.id,
        c.name,
        c.groups.map(g => [g.id, g.name])
      ])
      break
    }
    case 'grading-period': {
      const all: MenuItem = ['0', I18n.t('All Grading Periods')]
      const periods: MenuItem[] = gradingPeriods.map(({id, title: name}) => [id, name])
      items = [all, ...periods]
      break
    }
  }

  return (
    <>
      {(items.length > 0 || itemGroups.length > 0) && (
        <SimpleSelect
          data-testid="select-condition"
          key={condition.type} // resets dropdown when condition type is changed
          renderLabel={conditionTypeLabels[condition.type || 'assignment-group']}
          placeholder="--"
          size="small"
          value={condition.value || '_'}
          onChange={(_event, {value}) => {
            onChange({
              ...condition,
              value
            })
          }}
        >
          {items.map(([id, name]: [string, string]) => {
            return (
              <Option key={id} id={`${condition.id}-item-${id}`} value={id}>
                {name}
              </Option>
            )
          })}

          {itemGroups.map(([id, name, items_]) => {
            return (
              <OptionGroup value={id} renderLabel={name}>
                {items_.map(([itemId, itemName]: [string, string]) => {
                  return (
                    <Option key={itemId} id={`${condition.id}-item-${itemId}`} value={itemId}>
                      {itemName}
                    </Option>
                  )
                })}
              </OptionGroup>
            )
          })}
        </SimpleSelect>
      )}
      {['start-date', 'end-date'].includes(condition.type || '') && (
        <CanvasDateInput
          size="small"
          dataTestid="date-input"
          renderLabel={dateLabels[condition.type!]}
          selectedDate={condition.value}
          formatDate={formatDate}
          interaction="enabled"
          onSelectedDateChange={(value: MomentInput) => {
            onChange({
              ...condition,
              value: value ? moment(value).toISOString() : null
            })
          }}
        />
      )}
      {condition.type === 'submissions' && (
        <SimpleSelect
          key={condition.type} // resets dropdown when condition type is changed
          renderLabel={I18n.t('Submissions')}
          size="small"
          data-testid="submissions-input"
          placeholder="--"
          value={condition.value || '_'}
          onChange={(_event, {value}) => {
            onChange({
              ...condition,
              value
            })
          }}
        >
          {submissionTypeOptions.map(([id, name]: SubmissionTypeOption) => {
            return (
              <Option key={id} id={`${condition.id}-item-${id}`} value={id}>
                {name}
              </Option>
            )
          })}
        </SimpleSelect>
      )}
    </>
  )
}
