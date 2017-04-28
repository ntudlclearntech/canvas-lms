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

import React from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'
import I18n from 'i18n!publish_cloud'
import PublishCloud from 'compiled/react_files/components/PublishCloud'
import RestrictedDialogForm from 'jsx/files/RestrictedDialogForm'

  // Function Summary
  // Create a blank dialog window via jQuery, then dump the RestrictedDialogForm into that
  // dialog window. This allows us to do react things inside of this all ready rendered
  // jQueryUI widget
  PublishCloud.openRestrictedDialog = function () {
    var $dialog = $('<div>').dialog({
      title: I18n.t('Editing permissions for: %{name}', {name: this.props.model.displayName()}),
      width: 800,
      minHeight: 300,
      close: function () {
        ReactDOM.unmountComponentAtNode(this);
        $(this).remove();
      }
    });

    ReactDOM.render(
      <RestrictedDialogForm
        usageRightsRequiredForContext={this.props.usageRightsRequiredForContext}
        models={[this.props.model]}
        closeDialog={() => { $dialog.dialog('close'); }}
      />
    , $dialog[0]
    );

  };

  PublishCloud.render = function () {
    var fileName = this.props.fileName || I18n.t('This file');
    if (this.props.userCanManageFilesForContext) {
      if (this.state.published && this.state.restricted) {
        return (
          <button
            type='button'
            data-tooltip='left'
            onClick={this.openRestrictedDialog}
            ref='publishCloud'
            className='btn-link published-status restricted'
            title={this.getRestrictedText()}
            aria-label={`${fileName} is ${this.getRestrictedText()} - ${I18n.t('Click to modify')}`}
          >
            <i className='icon-cloud-lock' />
          </button>
        );
      } else if (this.state.published && this.state.hidden) {
        return (
          <button
            type='button'
            data-tooltip='left'
            onClick={this.openRestrictedDialog}
            ref='publishCloud'
            className='btn-link published-status hiddenState'
            title={I18n.t('Hidden. Available with a link')}
            aria-label={`${fileName} is ${I18n.t('Hidden. Available with a link - Click to modify')}`}
          >
            <i className='icon-cloud-lock' />
          </button>
        );
      } else if (this.state.published) {
        return (
          <button
            type='button'
            data-tooltip='left'
            onClick={this.openRestrictedDialog}
            ref='publishCloud'
            className='btn-link published-status published'
            title={I18n.t('Published')}
            aria-label={`${fileName} is ${I18n.t('Published - Click to modify')}`}
          >
            <i className='icon-publish' />
          </button>
        );
      } else {
        return (
          <button
            type='button'
            data-tooltip='left'
            onClick={this.openRestrictedDialog}
            ref='publishCloud'
            className='btn-link published-status unpublished'
            title={I18n.t('Unpublished')}
            aria-label={`${fileName} is ${I18n.t('Unpublished - Click to modify')}`}
          >
            <i className='icon-unpublish' />
          </button>
        );
      }
    } else {
      if (this.state.published && this.state.restricted) {
        return (
          <div
            style={{marginRight: '12px'}}
            data-tooltip='left'
            ref='publishCloud'
            className='published-status restricted'
            title={this.getRestrictedText()}
            aria-label={`${fileName} is ${this.getRestrictedText()}`}
          >
            <i className='icon-calendar-day' />
          </div>
        );
      } else {
        return (
          <div style={{width: 28, height: 36}} />
        );
      }
    }

  };

export default React.createClass(PublishCloud)
