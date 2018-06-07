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
import _ from 'lodash'
import PropTypes from 'prop-types'
import Table from '@instructure/ui-elements/lib/components/Table'
import I18n from 'i18n!edit_rubric'

import Criterion from './Criterion'

import { rubricShape, rubricAssessmentShape, rubricAssociationShape } from './types'
import { roundIfWhole } from './Points'

const totalString = (score) => I18n.t('Total Points: %{total}', {
  total: I18n.toNumber(score, { precision: 1 })
})

const totalAssessingString = (score, possible) =>
  I18n.t('Total Points: %{total} out of %{possible}', {
    total: roundIfWhole(score),
    possible: I18n.toNumber(possible, { precision: 1 })
  })

const Rubric = ({ onAssessmentChange, rubric, rubricAssessment, rubricAssociation, customRatings }) => {
  const assessing = onAssessmentChange !== null
  const priorData = _.get(rubricAssessment, 'data', [])
  const byCriteria = _.keyBy(priorData, (ra) => ra.criterion_id)
  const allComments = _.get(rubricAssociation, 'summary_data.saved_comments', {})
  const onCriteriaChange = (id) => (update) => {
    const data = priorData.map((prior) => (
      prior.criterion_id === id ? { ...prior, ...update } : prior
    ))
    onAssessmentChange({
      ...rubricAssessment,
      data,
      score: _.sum(data.map((result) => result.points !== null ? result.points : 0))
    })
  }
  const criteria = rubric.criteria.map((criterion) => {
    const assessment = byCriteria[criterion.id]
    return (
      <Criterion
        key={criterion.id}
        assessment={assessment}
        criterion={criterion}
        freeForm={rubric.free_form_criterion_comments}
        onAssessmentChange={assessing ? onCriteriaChange(criterion.id) : undefined}
        savedComments={allComments[criterion.id]}
        customRatings={customRatings}
      />
    )
  })

  const possible = rubric.points_possible
  const points = _.get(rubricAssessment, 'score', possible)
  const total = assessing ? totalAssessingString(points, possible) : totalString(points)
  const hideScore = _.get(rubricAssociation, 'hide_score_total') === true
  const noScore = _.get(rubricAssociation, 'score') === null

  return (
    <div className="react-rubric">
      <Table caption={rubric.title}>
        <thead>
          <tr>
            <th scope="col">{I18n.t('Criteria')}</th>
            <th scope="col">{I18n.t('Ratings')}</th>
            <th scope="col">{I18n.t('Pts')}</th>
          </tr>
        </thead>
        <tbody className="criterions">
          {criteria}
          <tr>
            <td colSpan="3" className="total-points">
              {hideScore || noScore ? null : total}
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  )
}
Rubric.propTypes = {
  onAssessmentChange: PropTypes.func,
  rubric: PropTypes.shape(rubricShape).isRequired,
  rubricAssessment: (props) => {
    const shape = PropTypes.shape(rubricAssessmentShape)
    const rubricAssessment = props.onAssessmentChange ? shape.isRequired : shape
    return PropTypes.checkPropTypes({ rubricAssessment }, props, 'prop', 'Rubric')
  },
  rubricAssociation: PropTypes.shape(rubricAssociationShape),
  customRatings: PropTypes.arrayOf(PropTypes.object)
}
Rubric.defaultProps = {
  onAssessmentChange: null,
  rubricAssessment: null,
  rubricAssociation: {},
  customRatings: []
}

export default Rubric
