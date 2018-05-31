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

import I18n from 'i18n!permissions'
import React, {Component} from 'react'
import {arrayOf, func} from 'prop-types'
import {connect} from 'react-redux'
import $ from 'jquery'
import 'compiled/jquery.rails_flash_notifications'

import Button from '@instructure/ui-buttons/lib/components/Button'
import Text from '@instructure/ui-elements/lib/components/Text'

import actions from '../actions'
import propTypes from '../propTypes'

// const COL_WIDTH = 140
// const ROW_HEIGHT = 60

export default class PermissionsTable extends Component {
  static propTypes = {
    roles: arrayOf(propTypes.role).isRequired,
    permissions: arrayOf(propTypes.permission).isRequired,
    setAndOpenRoleTray: func.isRequired
  }

  state = {
    leftOffset: 0,
    topOffset: 0,
    expanded: {}
  }

  toggleExpanded(id) {
    return () => {
      const expanded = Object.assign(this.state.expanded)
      expanded[id] = !expanded[id]
      if (expanded[id]) {
        $.screenReaderFlashMessage(I18n.t('4 rows added'))
      } else {
        $.screenReaderFlashMessage(I18n.t('4 rows removed'))
      }
      this.setState({expanded})
    }
  }

  openRoleTray(role) {
    // TODO ideally (according to kendal) we should have this close the current
    //      tray (an animation) before loading the new tray. I was hoping that
    //      calling hideTrays() here would be enough to do that, but it is
    //      alas not the case. The `Admin > People` page has an example of
    //      how this should look, so I should check there for inspiration.
    this.props.setAndOpenRoleTray(role)
  }

  renderTopHeader() {
    return (
      <tr className="ic-permissions__top-header">
        <td className="ic-permissions__corner-stone" />
        {this.props.roles.map(role => (
          <th
            key={role.id}
            scope="col"
            aria-label={role.label}
            className="ic-permissions__top-header__col-wrapper-th"
          >
            <div className="ic-permissions__top-header__col-wrapper">
              <div
                style={{top: `${this.state.topOffset}px`}}
                className="ic-permissions__header-content"
              >
                <Button variant="link" onClick={() => this.openRoleTray(role)}>
                  {role.label}
                </Button>
              </div>
            </div>
          </th>
        ))}
      </tr>
    )
  }

  renderLeftHeader(perm) {
    return (
      <th scope="row" className="ic-permissions__main-left-header" aria-label={perm.label}>
        <div className="ic-permissions__left-header__col-wrapper">
          <div
            style={{left: `${this.state.leftOffset}px`}}
            className="ic-permissions__header-content"
          >
            <button onClick={this.toggleExpanded(perm.permission_name)}>
              {this.state.expanded[perm.permission_name] ? 'v' : '>'}
            </button>
            <a href="#">{perm.label}</a>
          </div>
        </div>
      </th>
    )
  }

  renderExapndedRows() {
    const rowTypes = {
      create: I18n.t('create'),
      read: I18n.t('read'),
      update: I18n.t('update'),
      delete: I18n.t('delete')
    }

    return Object.keys(rowTypes).map(rowType => (
      <tr key={rowType}>
        <th scope="row" className="ic-permissions__left-header__expanded">
          <div className="ic-permissions__left-header__col-wrapper">
            <div
              style={{left: `${this.state.leftOffset}px`}}
              className="ic-permissions__header-content"
            >
              <Text>{rowTypes[rowType]}</Text>
            </div>
          </div>
        </th>
        {this.props.roles.map(role => (
          <td key={role.id}>
            <div className="ic-permissions__cell-content">
              <input type="checkbox" aria-label="toggle some mini permission" />
            </div>
          </td>
        ))}
      </tr>
    ))
  }

  renderTable() {
    return (
      <table className="ic-permissions__table">
        <tbody>{this.renderTopHeader()}</tbody>
        {this.props.permissions.map(perm => (
          <tbody key={perm.permission_name}>
            <tr>
              {this.renderLeftHeader(perm)}
              {this.props.roles.map(role => (
                <td key={role.id}>
                  <div className="ic-permissions__cell-content">
                    <button aria-label="toggle some permission">√</button>
                  </div>
                </td>
              ))}
            </tr>
            {this.state.expanded[perm.permission_name] && this.renderExapndedRows()}
          </tbody>
        ))}
      </table>
    )
  }

  render() {
    return (
      <div
        className="ic-permissions__table-container"
        ref={c => {
          this.contentWrapper = c
        }}
      >
        {this.renderTable()}
      </div>
    )
  }
}

function mapStateToProps(state, ownProps) {
  const stateProps = {
    roles: state.roles.filter(r => r.displayed),
    permissions: state.permissions.filter(p => p.displayed)
  }
  return {...ownProps, ...stateProps}
}

const mapDispatchToProps = {
  setAndOpenRoleTray: actions.setAndOpenRoleTray
}

export const ConnectedPermissionsTable = connect(mapStateToProps, mapDispatchToProps)(
  PermissionsTable
)
