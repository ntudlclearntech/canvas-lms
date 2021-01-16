/*
 * Copyright (C) 2015 - present Instructure, Inc.
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

import I18n from 'i18n!react_files'
import React from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import customPropTypes from 'compiled/react_files/modules/customPropTypes'
import Folder from 'compiled/models/Folder'
import UsageRightsDialog from './UsageRightsDialog'

export default class UsageRightsIndicator extends React.Component {
  warningMessage = I18n.t('Before publishing this file, you must specify usage rights.')

  static propTypes = {
    model: customPropTypes.filesystemObject.isRequired,
    userCanEditFilesForContext: PropTypes.bool.isRequired,
    userCanRestrictFilesForContext: PropTypes.bool.isRequired,
    usageRightsRequiredForContext: PropTypes.bool.isRequired,
    modalOptions: PropTypes.object.isRequired,
    contextType: PropTypes.string,
    contextId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    hidePreview: PropTypes.bool,
    deferSave: PropTypes.func,
    suppressWarning: PropTypes.bool
  }

  handleClick = event => {
    event.preventDefault()
    const contents = (
      <UsageRightsDialog
        isOpen
        closeModal={this.props.modalOptions.closeModal}
        itemsToManage={[this.props.model]}
        userCanRestrictFilesForContext={this.props.userCanRestrictFilesForContext}
        contextType={this.props.contextType}
        contextId={this.props.contextId}
        hidePreview={this.props.hidePreview}
        deferSave={this.props.deferSave}
      />
    )
    this.props.modalOptions.openModal(contents, () => {
      ReactDOM.findDOMNode(this).focus()
    })
  }

  getIconData = useJustification => {
    switch (useJustification) {
      case 'own_copyright':
        return {iconClass: 'icon-files-copyright', text: I18n.t('Own Copyright')}
      case 'public_domain':
        return {iconClass: 'icon-files-public-domain', text: I18n.t('Public Domain')}
      case 'used_by_permission':
        return {iconClass: 'icon-files-obtained-permission', text: I18n.t('Used by Permission')}
      case 'fair_use':
        return {iconClass: 'icon-files-fair-use', text: I18n.t('Fair Use')}
      case 'creative_commons':
        return {iconClass: 'icon-files-creative-commons', text: I18n.t('Creative Commons')}
    }
  }

  render() {
    if (
      this.props.model instanceof Folder ||
      (!this.props.usageRightsRequiredForContext && !this.props.model.get('usage_rights'))
    ) {
      return null
    } else if (this.props.usageRightsRequiredForContext && !this.props.model.get('usage_rights')) {
      if (this.props.userCanEditFilesForContext) {
        return (
          <button
            className="UsageRightsIndicator__openModal btn-link"
            onClick={this.handleClick}
            title={this.props.suppressWarning ? null : this.warningMessage}
            data-tooltip="top"
          >
            {!this.props.suppressWarning && (
              <span className="screenreader-only">{this.warningMessage}</span>
            )}
            <i className="UsageRightsIndicator__warning icon-warning" />
          </button>
        )
      } else {
        return null
      }
    } else {
      const useJustification = this.props.model.get('usage_rights').use_justification
      const iconData = this.getIconData(useJustification)

      return (
        <button
          className="UsageRightsIndicator__openModal btn-link"
          onClick={this.handleClick}
          disabled={!this.props.userCanEditFilesForContext}
          title={this.props.model.get('usage_rights').license_name}
          data-tooltip="top"
        >
          <span ref="screenreaderText" className="screenreader-only">
            {iconData.text}
          </span>
          <span className="screenreader-only">
            {this.props.model.get('usage_rights').license_name}
          </span>
          <i ref="icon" className={iconData.iconClass} />
        </button>
      )
    }
  }
}
