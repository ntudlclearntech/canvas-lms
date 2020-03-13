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

import I18n from 'i18n!permission_button'
import {func, bool, string} from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {Text} from '@instructure/ui-elements'
import {
  IconPublishSolid,
  IconTroubleLine,
  IconLockSolid,
  IconOvalHalfSolid
} from '@instructure/ui-icons'
import {Menu} from '@instructure/ui-menu'
import {IconButton} from '@instructure/ui-buttons'

import actions from '../actions'
import propTypes, {ENABLED_FOR_NONE, ENABLED_FOR_ALL, ENABLED_FOR_PARTIAL} from '../propTypes'

const MENU_ID_DEFAULT = 1
const MENU_ID_ENABLED = 2
const MENU_ID_DISABLED = 3
const MENU_ID_PARTIAL = 4
const MENU_ID_LOCKED = 5

const ENABLED_STATE_TO_MENU_ID = {
  [ENABLED_FOR_NONE]: MENU_ID_DISABLED,
  [ENABLED_FOR_PARTIAL]: MENU_ID_PARTIAL,
  [ENABLED_FOR_ALL]: MENU_ID_ENABLED
}

const SelectionState = {
  INFERRED: undefined,
  ENABLED: true,
  DISABLED: false
}

export default class PermissionButton extends Component {
  static propTypes = {
    cleanFocus: func.isRequired,
    fixButtonFocus: func.isRequired,
    handleClick: func.isRequired,
    inTray: bool.isRequired,
    permission: propTypes.rolePermission.isRequired,
    permissionName: string.isRequired,
    permissionLabel: string.isRequired,
    roleLabel: string,
    roleId: string.isRequired,
    setFocus: bool.isRequired,
    onFocus: func
  }

  static defaultProps = {
    roleLabel: ''
  }

  state = {
    showMenu: false
  }

  componentDidMount() {
    if (this.props.setFocus) {
      this.button.focus()
      this.props.cleanFocus()
    }
  }

  componentDidUpdate() {
    if (this.props.setFocus) {
      this.button.focus()
      this.props.cleanFocus()
    }
  }

  setupButtonRef = c => {
    this.button = c
  }

  closeMenu = () => {
    this.setState({showMenu: false}, () =>
      this.props.fixButtonFocus({
        permissionName: this.props.permissionName,
        roleId: this.props.roleId,
        inTray: this.props.inTray
      })
    )
  }

  toggleMenu = () => {
    if (this.state.showMenu) {
      this.closeMenu()
      return
    }
    this.setState({showMenu: true})
  }

  checkedSelection({enabled, locked, explicit}) {
    if (!explicit) return [MENU_ID_DEFAULT]

    const checked = [ENABLED_STATE_TO_MENU_ID[enabled]]
    if (locked) checked.push(MENU_ID_LOCKED)
    return checked
  }

  renderButton() {
    const {enabled} = this.props.permission

    function stateIcon() {
      if (enabled === ENABLED_FOR_NONE) return IconTroubleLine
      if (enabled === ENABLED_FOR_ALL) return IconPublishSolid
      if (enabled === ENABLED_FOR_PARTIAL) return IconOvalHalfSolid
    }

    const stateColor = enabled === ENABLED_FOR_NONE ? 'danger' : 'success'

    return (
      <IconButton
        elementRef={this.setupButtonRef}
        onClick={this.toggleMenu}
        onFocus={this.props.onFocus}
        interaction={this.props.permission.readonly ? 'disabled' : 'enabled'}
        size="large"
        withBackground={false}
        withBorder={false}
        color={stateColor}
        screenReaderLabel={this.renderAllyScreenReaderTag({
          permission: this.props.permission,
          permissionLabel: this.props.permissionLabel,
          roleLabel: this.props.roleLabel
        })}
      >
        {stateIcon()}
      </IconButton>
    )
  }

  renderAllyScreenReaderTag({permission, permissionLabel, roleLabel}) {
    const {enabled, locked} = permission
    let status = ''
    if (enabled === ENABLED_FOR_ALL && !locked) {
      status = I18n.t('Enabled')
    } else if (enabled === ENABLED_FOR_ALL && locked) {
      status = I18n.t('Enabled and Locked')
    } else if (enabled === ENABLED_FOR_PARTIAL && !locked) {
      status = I18n.t('Partially enabled')
    } else if (enabled === ENABLED_FOR_PARTIAL && locked) {
      status = I18n.t('Partially enabled and Locked')
    } else if (enabled === ENABLED_FOR_NONE && !locked) {
      status = I18n.t('Disabled')
    } else {
      status = I18n.t('Disabled and Locked')
    }
    return `${status} ${permissionLabel} ${roleLabel}`
  }

  renderMenu(button) {
    const closeMenuIfInTray = this.props.inTray ? Function.prototype : this.closeMenu
    const perm = this.props.permission
    const selected = this.checkedSelection(perm)

    function unboundAdjustPermissions({
      enabled = undefined,
      locked = false,
      explicit = false
    } = {}) {
      this.props.handleClick({
        name: this.props.permissionName,
        id: this.props.roleId,
        inTray: this.props.inTray,
        enabled,
        locked,
        explicit
      })
    }

    const adjustPermissions = unboundAdjustPermissions.bind(this)

    // Since the enum enabled values exist only here on the front end and
    // the backend uses only Booleans for the granular permissions, we
    // will convert them back to Booleans for the API call.
    function enable() {
      adjustPermissions({enabled: true, locked: perm.locked, explicit: true})
    }

    function disable() {
      adjustPermissions({enabled: false, locked: perm.locked, explicit: true})
    }

    // Toggling the locked state also requires us to send along the current
    // overridden enabled value, if any. Otherwise unlocking with an
    // inferred value will just revert to the default, which isn't always
    // what we want.
    function toggleLock() {
      let enabled = SelectionState.INFERRED
      if (selected.includes(MENU_ID_DISABLED)) enabled = SelectionState.DISABLED
      else if (selected.includes(MENU_ID_ENABLED)) enabled = SelectionState.ENABLED
      adjustPermissions({enabled, locked: !perm.locked, explicit: true})
    }

    return (
      <Menu
        placement="bottom center"
        trigger={button}
        defaultShow={!this.props.inTray}
        shouldFocusTriggerOnClose={false}
        onSelect={closeMenuIfInTray}
        onDismiss={closeMenuIfInTray}
        onBlur={closeMenuIfInTray}
      >
        <Menu.Group label="" selected={selected}>
          {/* "partially enabled" callout removed for now per Product until they can decide on wording
          {selected.includes(MENU_ID_PARTIAL) && [
            <Menu.Item id="permission_table_partial_menu_item" value={MENU_ID_PARTIAL} disabled>
              <Text>{I18n.t('Partially Enabled')}</Text>
            </Menu.Item>,
            <Menu.Separator />
          ]}
          */}
          <Menu.Item
            id="permission_table_enable_menu_item"
            value={MENU_ID_ENABLED}
            onClick={enable}
          >
            <Text>{I18n.t('Enable')}</Text>
          </Menu.Item>
          <Menu.Item
            id="permission_table_disable_menu_item"
            value={MENU_ID_DISABLED}
            onClick={disable}
          >
            <Text>{I18n.t('Disable')}</Text>
          </Menu.Item>
          <Menu.Item
            id="permission_table_lock_menu_item"
            value={MENU_ID_LOCKED}
            onClick={toggleLock}
          >
            <Text>{I18n.t('Lock')}</Text>
          </Menu.Item>
          <Menu.Separator />
          <Menu.Item
            id="permission_table_use_default_menu_item"
            value={MENU_ID_DEFAULT}
            onClick={adjustPermissions}
          >
            <Text>{I18n.t('Use Default')}</Text>
          </Menu.Item>
        </Menu.Group>
      </Menu>
    )
  }

  render() {
    // Note: for performance, we do not initialize the menu button at all until
    //       the button is clicked, unless we are in a tray (which has significatnly
    //       less buttons). The reason we do something different if the button is
    //       in the tray is because focus is able to escape from the tray if we
    //       do it the other way, and performance of the tray is not currently
    //       an issue.
    const button = this.renderButton()
    return (
      <div
        id={`${this.props.permissionName}_${this.props.roleId}`}
        className="ic-permissions__permission-button-container"
      >
        <div>{this.props.inTray || this.state.showMenu ? this.renderMenu(button) : button}</div>
        <div
          className={
            this.props.permission.locked && this.props.permission.explicit
              ? null
              : 'ic-hidden-button'
          }
        >
          <Text color="primary">
            <IconLockSolid />
          </Text>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state, ownProps) {
  const targetFocusButton =
    ownProps.permissionName === state.nextFocus.permissionName &&
    ownProps.roleId === state.nextFocus.roleId
  const targetFocusArea =
    (state.nextFocus.targetArea === 'tray' && ownProps.inTray) ||
    (state.nextFocus.targetArea === 'table' && !ownProps.inTray)

  const stateProps = {
    setFocus: targetFocusButton && targetFocusArea
  }
  return {...stateProps, ...ownProps}
}

const mapDispatchToProps = {
  handleClick: actions.modifyPermissions,
  fixButtonFocus: actions.fixButtonFocus,
  cleanFocus: actions.cleanFocus
}

export const ConnectedPermissionButton = connect(
  mapStateToProps,
  mapDispatchToProps
)(PermissionButton)
