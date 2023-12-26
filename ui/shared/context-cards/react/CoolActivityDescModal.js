import React from 'react'
import { Text } from '@instructure/ui-text'
import { Heading } from '@instructure/ui-heading'
import { Button, CloseButton } from '@instructure/ui-buttons'
import { IconStarLightSolid, IconStarSolid } from '@instructure/ui-icons'
import { Modal } from '@instructure/ui-modal'
import { View } from '@instructure/ui-view'
import { useScope as useI18nScope } from '@canvas/i18n'

const I18n = useI18nScope('cool_activity_desc_modal')

export default class CoolActivityDescModal extends React.Component {
  render() {
    return (
      <Modal open={this.props.modalIsOpen} size="medium" label="Activity Details">
        <Modal.Header>
          <CloseButton
            placement="end"
            offset="small"
            onClick={this.props.onClose}
            screenReaderLabel="Close"
          />
          <Heading>{I18n.t('modal_head', '"Activity Compared to Class" explanation')}</Heading>
        </Modal.Header>
        <Modal.Body>
          <Text size="large" weight="bold">{I18n.t('modal_body.page_views', 'Page Views')}</Text>
          <br />
          <Text>{I18n.t('modal_body.page_views_explanation', 'A view is counted each time a user navigates to a course page.')}</Text>
          <br /><br />
          <Text size="large" weight="bold">{I18n.t('modal_body.course_activities', 'Course Activities')}</Text>
          <br />
          <Text>{I18n.t('modal_body.course_activities_explanation', 'User actions will generate analytics course participation, such as posting a new comment to a discussion or an announcement, taking a quiz, submitting an assignment, and creating a wiki page etc.')}</Text>
          <br /><br />
          <Text size="large" weight="bold">{I18n.t('modal_body.calculation_rules', 'Calculation Rules')}</Text>
          <br />
          <Text>{I18n.t('modal_body.calculation_rules_explanation_1', 'The activity section provides an overview of the student\'s participation compared to other students in the course. It is not meant to be an exact comparison and is based on the standard deviation of the student\'s participation and page views in the course.')}</Text>
          <br />
          <Text>{I18n.t('modal_body.calculation_rules_explanation_2', 'Star rating definition into four levels:')}</Text>
          <br />
          <View
            as="span"
            display="inline-block"
            width="100%"
            margin="small none"
            padding="small"
            borderRadius="medium"
            borderWidth="small"
          >
            <IconStarLightSolid style={{ color: '#008EE2', paddingRight: '0.2rem' }} />
            <IconStarLightSolid style={{ color: '#008EE2', paddingRight: '0.2rem' }} />
            <IconStarLightSolid style={{ color: '#008EE2', paddingRight: '0.2rem' }} />
            <Text>{I18n.t('modal_body.zero_star', 'Student with no page views or no participation in any course activities.')}</Text>
            <br />
            <IconStarSolid style={{ color: '#008EE2', paddingRight: '0.2rem' }} />
            <Text>{I18n.t('modal_body.one_star', 'Students whose participation falls in the lowest quartile of course activity.')}</Text>
            <br />
            <IconStarSolid style={{ color: '#008EE2', paddingRight: '0.2rem' }} />
            <IconStarSolid style={{ color: '#008EE2', paddingRight: '0.2rem' }} />
            <Text>{I18n.t('modal_body.two_star', 'Students whose participation falls in the middle two quartiles.')}</Text>
            <br />
            <IconStarSolid style={{ color: '#008EE2', paddingRight: '0.2rem' }} />
            <IconStarSolid style={{ color: '#008EE2', paddingRight: '0.2rem' }} />
            <IconStarSolid style={{ color: '#008EE2', paddingRight: '0.2rem' }} />
            <Text>{I18n.t('modal_body.three_star', 'Students whose participation falls in the top quartile.')}</Text>
            <br />
          </View>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={this.props.onClose}>
            {I18n.t('close', 'Close')}
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
