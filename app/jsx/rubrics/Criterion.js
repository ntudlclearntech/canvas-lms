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
import PropTypes from 'prop-types'
import ScreenReaderContent from '@instructure/ui-a11y/lib/components/ScreenReaderContent'
import Button from '@instructure/ui-core/lib/components/Button'
import CloseButton from '@instructure/ui-core/lib/components/CloseButton'
import Heading from '@instructure/ui-core/lib/components/Heading'
import Text from '@instructure/ui-core/lib/components/Text'
import IconOutcomes from '@instructure/ui-icons/lib/Line/IconOutcomes'
import Modal, { ModalHeader, ModalBody } from '@instructure/ui-overlays/lib/components/Modal'
import I18n from 'i18n!edit_rubric'

import { assessmentShape, criterionShape } from './types'
import Ratings from './Ratings'

const Comments = ({ assessment, freeForm }) => (
  <div className={freeForm ? 'rubric-freeform' : ''}>
    <Text size="x-small" weight={freeForm ? 'normal' : 'light'}>
      {
        assessment && assessment.comments_html ?
          // eslint-disable-next-line react/no-danger
          <div dangerouslySetInnerHTML={{ __html: assessment.comments_html }} />
          : assessment && assessment.comments
      }
    </Text>
  </div>
)
Comments.propTypes = {
  assessment: PropTypes.shape(assessmentShape).isRequired,
  freeForm: PropTypes.bool.isRequired
}

const OutcomeIcon = () => (
  <span>
    <IconOutcomes />&nbsp;
    <ScreenReaderContent>{I18n.t('This criterion is linked to a Learning Outcome')}</ScreenReaderContent>
  </span>
)

const LongDescription = ({ showLongDescription }) => (
  // eslint-disable-next-line jsx-a11y/anchor-is-valid
  <Button margin="none" variant="link" onClick={() => showLongDescription()}>
    <Text size="x-small">{I18n.t('view longer description')}</Text>
  </Button>
)
LongDescription.propTypes = {
  showLongDescription: PropTypes.func.isRequired
}

const LongDescriptionDialog = ({ open, close, longDescription }) => {
  const modalHeader = I18n.t('Criterion Long Description')
  return (
    <Modal
       open={open}
       onDismiss={close}
       size="medium"
       label={modalHeader}
       shouldCloseOnDocumentClick
     >
       <ModalHeader>
         <CloseButton
           placement="end"
           offset="medium"
           variant="icon"
           onClick={close}
         >
           Close
         </CloseButton>
         <Heading>{modalHeader}</Heading>
       </ModalHeader>
       <ModalBody>
         <Text lineHeight="double">{longDescription}</Text>
       </ModalBody>
    </Modal>
  )
}
LongDescriptionDialog.propTypes = {
  close: PropTypes.func.isRequired,
  longDescription: PropTypes.string.isRequired,
  open: PropTypes.bool
}
LongDescriptionDialog.defaultProps = {
  open: false
}

const Threshold = ({ threshold }) => (
  <Text size="x-small">
    {I18n.t('threshold')}: {I18n.toNumber(threshold, { precision: 1 })}
  </Text>
)
Threshold.defaultProps = { threshold: null }
Threshold.propTypes = { threshold: PropTypes.number }

const roundIfWhole = (n) => (
  I18n.toNumber(n, { precision: Math.floor(n) === n ? 0 : 1 })
)

export const pointString = (points, possible) =>
  I18n.t('%{points} / %{possible} pts', {
    points: roundIfWhole(points),
    possible: I18n.toNumber(possible, { precision : 1 })
  })

export default class Criterion extends React.Component {
  state = {}

  closeModal = () => { this.setState({ dialogOpen: false }) }

  openModal = () => {
    this.setState({ dialogOpen: true })
  }

  render () {
    const { assessment, criterion, freeForm } = this.props
    const { dialogOpen } = this.state

    const points = assessment && assessment.points
    const outcome = criterion.learning_outcome_id !== undefined
    const pointsPossible = criterion.points
    const longDescription = criterion.long_description
    const threshold = criterion.mastery_points

    const comments = <Comments assessment={assessment} freeForm={freeForm} />
    const ratings = freeForm ? comments : (
      <Ratings tiers={criterion.ratings} points={points} />
    )

    return (
      <tr className="rubric-criterion">
        <th scope="row" className="description-header">
          <div className="description container">
            {outcome ? <OutcomeIcon /> : ''}
            <Text size="small">
              {criterion.description}
            </Text>
          </div>
          {
            longDescription !== "" ? (
              <LongDescription showLongDescription={this.openModal} />
            ) : null
          }
          <LongDescriptionDialog
            close={this.closeModal}
            longDescription={longDescription}
            open={dialogOpen}
            />
          {
            threshold !== undefined ? <Threshold threshold={threshold} /> : null
          }
          {
            freeForm ? null : (
              <div className="assessment-comments">
                <Text size="x-small" weight="normal">{I18n.t('Instructor Comments')}</Text>
                {comments}
              </div>
            )
          }
        </th>
        <td className="ratings">
          {ratings}
        </td>
        <td>
          <div className="container graded-points">
            {pointString(points, pointsPossible)}
          </div>
        </td>
      </tr>
    )
  }
}
Criterion.propTypes = {
  assessment: PropTypes.shape(assessmentShape).isRequired,
  criterion: PropTypes.shape(criterionShape).isRequired,
  freeForm: PropTypes.bool.isRequired
}
