/*
 * Copyright (C) 2017 - present Instructure, Inc.
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

import React from 'react';
import { func, string } from 'prop-types';
import _ from 'underscore';
import Button from 'instructure-ui/lib/components/Button';
import LatePoliciesTabPanel from 'jsx/gradezilla/default_gradebook/components/LatePoliciesTabPanel';
import GradebookSettingsModalApi from 'jsx/gradezilla/default_gradebook/apis/GradebookSettingsModalApi';
import Modal, { ModalBody, ModalFooter, ModalHeader } from 'instructure-ui/lib/components/Modal';
import Heading from 'instructure-ui/lib/components/Heading';
import TabList, { TabPanel } from 'instructure-ui/lib/components/TabList';
import I18n from 'i18n!gradebook';
import { showAjaxFlashAlert } from 'jsx/shared/AjaxFlashAlert';

class GradebookSettingsModal extends React.Component {
  static propTypes = {
    courseId: string.isRequired,
    locale: string.isRequired,
    onClose: func.isRequired
  }

  constructor (props) {
    super(props);
    this.state = {
      isOpen: false,
      latePolicy: { changes: {}, validationErrors: {} }
    };
  }

  onFetchLatePolicySuccess = ({ data }) => {
    this.changeLatePolicy({ ...this.state.latePolicy, data: data.latePolicy });
  }

  onFetchLatePolicyFailure = () => {
    const message = I18n.t('An error occurred while loading late policies');
    showAjaxFlashAlert(message, 'error');
  }

  onUpdateLatePolicySuccess = () => {
    const message = I18n.t('Late policies updated');
    showAjaxFlashAlert(message, 'success');
    this.close();
  }

  onUpdateLatePolicyFailure = () => {
    const message = I18n.t('An error occurred while updating late policies');
    showAjaxFlashAlert(message, 'error');
  }

  handleUpdateButtonClicked = () => {
    if (this.state.latePolicy.data.newRecord) {
      this.createLatePolicy();
    } else {
      this.updateLatePolicy();
    }
  }

  fetchLatePolicy = () => {
    GradebookSettingsModalApi
      .fetchLatePolicy(this.props.courseId)
      .then(this.onFetchLatePolicySuccess)
      .catch(this.onFetchLatePolicyFailure);
  }

  createLatePolicy = () => {
    GradebookSettingsModalApi
      .createLatePolicy(this.props.courseId, this.state.latePolicy.changes)
      .then(this.onUpdateLatePolicySuccess)
      .catch(this.onUpdateLatePolicyFailure);
  }

  updateLatePolicy = () => {
    GradebookSettingsModalApi
      .updateLatePolicy(this.props.courseId, this.state.latePolicy.changes)
      .then(this.onUpdateLatePolicySuccess)
      .catch(this.onUpdateLatePolicyFailure);
  }

  changeLatePolicy = (latePolicy) => {
    this.setState({ latePolicy });
  }

  isUpdateButtonDisabled = () => {
    const { latePolicy: { changes, validationErrors } } = this.state;
    return _.isEmpty(changes) || !_.isEmpty(validationErrors);
  }

  open = () => {
    this.setState({ isOpen: true });
  }

  close = () => {
    this.setState({ isOpen: false }, () => {
      const latePolicy = { changes: {}, data: undefined, validationErrors: {} };
      // need to reset the latePolicy state _after_ the modal is closed, otherwise
      // the spinner will be visible for a brief moment before the modal closes.
      this.setState({ latePolicy });
    });
  }

  render () {
    const title = I18n.t('Gradebook Settings');
    const { isOpen, latePolicy } = this.state;

    return (
      <Modal
        size="large"
        isOpen={isOpen}
        label={title}
        closeButtonLabel={I18n.t('Close')}
        onAfterOpen={this.fetchLatePolicy}
        onRequestClose={this.close}
        onExited={this.props.onClose}
      >
        <ModalHeader>
          <Heading level="h3">{ I18n.t('Gradebook Settings') }</Heading>
        </ModalHeader>

        <ModalBody>
          <TabList defaultSelectedIndex={0}>
            <TabPanel id="late-policies-tab" title={I18n.t('Late Policies')}>
              <LatePoliciesTabPanel
                latePolicy={latePolicy}
                changeLatePolicy={this.changeLatePolicy}
                locale={this.props.locale}
              />
            </TabPanel>
          </TabList>
        </ModalBody>

        <ModalFooter>
          <Button
            id="gradebook-settings-cancel-button"
            onClick={this.close}
            margin="0 small"
          >
            {I18n.t('Cancel')}
          </Button>

          <Button
            id="gradebook-settings-update-button"
            onClick={this.handleUpdateButtonClicked}
            disabled={this.isUpdateButtonDisabled()}
            variant="primary"
          >
            {I18n.t('Update')}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
}

export default GradebookSettingsModal;
