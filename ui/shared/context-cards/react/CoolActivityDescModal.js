import React from 'react'
import I18n from 'i18n!cool_activity_desc_modal'
import { Text } from '@instructure/ui-text'
import { Heading } from '@instructure/ui-heading'
import { Button, CloseButton } from '@instructure/ui-buttons'
import { IconStarLightSolid, IconStarSolid } from '@instructure/ui-icons'
import { Modal } from '@instructure/ui-modal'
import { View } from '@instructure/ui-view'

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
          <Text size="large" weight="bold">{I18n.t('modal_body.page_view', 'Page View')}</Text>
          <br />
          <Text>{I18n.t('modal_body.page_view_explanation', 'Any course page view.')}</Text>
          <br /><br />
          <Text size="large" weight="bold">{I18n.t('modal_body.participation', 'Participation')}</Text>
          <br />
          <Text>{I18n.t('modal_body.participation_explanation_1', 'The sum of student\'s participation and page view.')}</Text>
          <br />
          <Text>{I18n.t('modal_body.participation_explanation_2', 'Participation includes downloading, reading documents, joining disscusion, taking quizzes, submitting assignments, and creating a new page.')}</Text>
          <br /><br />
          <Text size="large" weight="bold">{I18n.t('modal_body.calculation_method', 'Calculation Method:')}</Text>
          <br />
          <Text>{I18n.t('modal_body.calculation_method_explanation_1', 'The data represents the comparison of activity between individuals and the rest of the class, and its calculation is based on the quartile of participation and page view.')}</Text>
          <br />
          <Text>{I18n.t('modal_body.calculation_method_explanation_2', 'There are four different level of activeness:')}</Text>
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
            <Text>{I18n.t('modal_body.zero_star', 'Zero star means the student didn\'t participate in any course activities, or view any page')}</Text>
            <br />
            <IconStarSolid style={{ color: '#008EE2', paddingRight: '0.2rem' }} />
            <Text>{I18n.t('modal_body.one_star', 'One star means the student\'s activeness lies in the first quartile')}</Text>
            <br />
            <IconStarSolid style={{ color: '#008EE2', paddingRight: '0.2rem' }} />
            <IconStarSolid style={{ color: '#008EE2', paddingRight: '0.2rem' }} />
            <Text>{I18n.t('modal_body.two_star', 'Two star means the student\'s activeness lies between the second and thrid quartile')}</Text>
            <br />
            <IconStarSolid style={{ color: '#008EE2', paddingRight: '0.2rem' }} />
            <IconStarSolid style={{ color: '#008EE2', paddingRight: '0.2rem' }} />
            <IconStarSolid style={{ color: '#008EE2', paddingRight: '0.2rem' }} />
            <Text>{I18n.t('modal_body.three_star', 'Two star means the student\'s activeness lies in the fourth quartile')}</Text>
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