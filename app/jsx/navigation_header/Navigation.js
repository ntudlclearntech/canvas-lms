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

import $ from 'jquery'
import I18n from 'i18n!new_nav'
import React from 'react'
import {func} from 'prop-types'
import {Tray} from '@instructure/ui-overlays'
import {CloseButton} from '@instructure/ui-buttons'
import CoursesTray from './trays/CoursesTray'
import GroupsTray from './trays/GroupsTray'
import AccountsTray from './trays/AccountsTray'
import ProfileTray from './trays/ProfileTray'
import HelpTray from './trays/HelpTray'
import UnreadCounts from './UnreadCounts'
import preventDefault from 'compiled/fn/preventDefault'
import parseLinkHeader from 'compiled/fn/parseLinkHeader'

const EXTERNAL_TOOLS_REGEX = /^\/accounts\/[^\/]*\/(external_tools)/
const ACTIVE_ROUTE_REGEX = /^\/(courses|groups|accounts|grades|calendar|conversations|profile)/
const ACTIVE_CLASS = 'ic-app-header__menu-list-item--active'

const TYPE_URL_MAP = {
  courses: '/api/v1/users/self/favorites/courses?include[]=term&exclude[]=enrollments',
  groups: '/api/v1/users/self/groups?include[]=can_access',
  accounts: '/api/v1/accounts',
  profile: '/api/v1/users/self/tabs',
  help: '/help_links'
}

const TYPE_FILTER_MAP = {
  groups: group => group.can_access && !group.concluded
}

const RESOURCE_COUNT = 10

export default class Navigation extends React.Component {
  static propTypes = {
    unreadComponent: func, // for testing only
    onDataReceived: func
  }

  static defaultProps = {
    unreadComponent: UnreadCounts
  }

  constructor(props) {
    super(props)
    this.closeTray = this.closeTray.bind(this)
    this.onInboxUnreadUpdate = this.onInboxUnreadUpdate.bind(this)
    this.state = {
      groups: [],
      accounts: [],
      courses: [],
      help: [],
      profile: [],
      unread_count: 0,
      isTrayOpen: false,
      type: null,
      coursesLoading: false,
      coursesAreLoaded: false,
      accountsLoading: false,
      accountsAreLoaded: false,
      groupsLoading: false,
      groupsAreLoaded: false,
      helpLoading: false,
      helpAreLoaded: false,
      profileAreLoading: false,
      profileAreLoaded: false
    }
    this.unreadInboxCountElement = null
  }

  UNSAFE_componentWillMount() {
    /**
     * Mount up stuff to our existing DOM elements, yes, it's not very
     * React-y, but it is workable and maintainable, plus it doesn't require
     * us to trash what Rails has already rendered.
     */

    // ////////////////////////////////
    // / Hover Events
    // ////////////////////////////////

    Object.keys(TYPE_URL_MAP).forEach(type => {
      $(`#global_nav_${type}_link`).one('mouseover', () => {
        this.getResource(TYPE_URL_MAP[type], type)
      })
    })

    // ////////////////////////////////
    // / Click Events
    // ////////////////////////////////
    Object.keys(TYPE_URL_MAP).forEach(type => {
      $(`#global_nav_${type}_link`).on(
        'click',
        preventDefault(this.handleMenuClick.bind(this, type))
      )
    })

    // give the trays that slide out from the the nav bar
    // a place to mount. It has to be outside the <div id=application>
    // to aria-hide everything but the tray when open.
    let portal = document.getElementById('nav-tray-portal')
    if (!portal) {
      portal = document.createElement('div')
      portal.id = 'nav-tray-portal'
      // the <header> has z-index: 100. This has to be behind it,
      portal.setAttribute('style', 'position: relative; z-index: 99;')
      document.body.appendChild(portal)
    }
  }

  UNSAFE_componentWillUpdate(_newProps, newState) {
    if (newState.activeItem !== this.state.activeItem) {
      $(`.${ACTIVE_CLASS}`)
        .removeClass(ACTIVE_CLASS)
        .removeAttr('aria-current')
      $(`#global_nav_${newState.activeItem}_link`)
        .closest('li')
        .addClass(ACTIVE_CLASS)
        .attr('aria-current', 'page')
    }
  }

  /**
   * Given a URL and a type value, it gets the data and updates state.
   */
  getResource(url, type) {
    this.setState({[`${type}Loading`]: true})
    this.loadResourcePage(url, type)
  }

  ensureLoaded(type) {
    if (TYPE_URL_MAP[type] && !this.state[`${type}AreLoaded`] && !this.state[`${type}Loading`]) {
      this.getResource(TYPE_URL_MAP[type], type)
    }
  }

  loadResourcePage(url, type, previousData = []) {
    $.getJSON(url, (data, __, xhr) => {
      const newData = previousData.concat(this.filterDataForType(data, type))

      // queue the next page if we need one
      if (newData.length < RESOURCE_COUNT) {
        const link = parseLinkHeader(xhr)
        if (link.next) {
          this.loadResourcePage(link.next, type, newData)
          return
        }
      }

      // finished
      this.setState(
        {
          [type]: newData,
          [`${type}Loading`]: false,
          [`${type}AreLoaded`]: true
        },
        this.props.onDataReceived
      )
    })
  }

  filterDataForType(data, type) {
    const filterFunc = TYPE_FILTER_MAP[type]
    if (typeof filterFunc === 'function') {
      return data.filter(filterFunc)
    }
    return data
  }

  determineActiveLink() {
    const path = window.location.pathname
    const matchData = path.match(EXTERNAL_TOOLS_REGEX) || path.match(ACTIVE_ROUTE_REGEX)
    const activeItem = matchData && matchData[1]
    if (!activeItem) {
      this.setState({activeItem: 'dashboard'})
    } else {
      this.setState({activeItem})
    }
  }

  handleMenuClick(type) {
    // Make sure data is loaded up
    this.ensureLoaded(type)

    if (this.state.isTrayOpen && this.state.activeItem === type) {
      this.closeTray()
    } else if (this.state.isTrayOpen && this.state.activeItem !== type) {
      this.openTray(type)
    } else {
      this.openTray(type)
    }
  }

  openTray(type) {
    this.setState({type, isTrayOpen: true, activeItem: type})
  }

  closeTray() {
    this.determineActiveLink()
    this.setState({isTrayOpen: false}, () => {
      setTimeout(() => {
        this.setState({type: null})
      }, 150)
    })
  }

  renderTrayContent() {
    switch (this.state.type) {
      case 'courses':
        return (
          <CoursesTray
            courses={this.state.courses}
            hasLoaded={this.state.coursesAreLoaded}
            closeTray={this.closeTray}
          />
        )
      case 'groups':
        return (
          <GroupsTray
            groups={this.state.groups}
            hasLoaded={this.state.groupsAreLoaded}
            closeTray={this.closeTray}
          />
        )
      case 'accounts':
        return (
          <AccountsTray
            accounts={this.state.accounts}
            hasLoaded={this.state.accountsAreLoaded}
            closeTray={this.closeTray}
          />
        )
      case 'profile':
        return (
          <ProfileTray
            userDisplayName={window.ENV.current_user.display_name}
            userPronoun={window.ENV.current_user.pronoun}
            userAvatarURL={
              window.ENV.current_user.avatar_is_fallback
                ? null
                : window.ENV.current_user.avatar_image_url
            }
            loaded={this.state.profileAreLoaded}
            tabs={this.state.profile}
          />
        )
      case 'help':
        return (
          <HelpTray
            trayTitle={window.ENV.help_link_name}
            links={this.state.help}
            hasLoaded={this.state.helpAreLoaded}
            closeTray={this.closeTray}
          />
        )
      default:
        return null
    }
  }

  getTrayLabel() {
    switch (this.state.type) {
      case 'courses':
        return I18n.t('Courses tray')
      case 'groups':
        return I18n.t('Groups tray')
      case 'accounts':
        return I18n.t('Admin tray')
      case 'profile':
        return I18n.t('Profile tray')
      case 'help':
        return I18n.t('%{title} tray', {title: window.ENV.help_link_name})
      default:
        return I18n.t('Global navigation tray')
    }
  }

  // Also have to attend to the unread dot on the mobile view inbox
  onInboxUnreadUpdate(unreadCount) {
    const el = document.getElementById('mobileHeaderInboxUnreadBadge')
    if (el) el.style.display = unreadCount > 0 ? '' : 'none'
    if (typeof this.props.onDataReceived === 'function') this.props.onDataReceived()
  }

  render() {
    const UnreadComponent = this.props.unreadComponent

    if (this.unreadInboxCountElement === null)
      this.unreadInboxCountElement = document.querySelector(
        '#global_nav_conversations_link .menu-item__badge'
      )

    return (
      <>
        <Tray
          label={this.getTrayLabel()}
          size="small"
          open={this.state.isTrayOpen}
          onDismiss={this.closeTray}
          shouldCloseOnDocumentClick
          mountNode={document.getElementById('nav-tray-portal')}
          theme={{smallWidth: '28em'}}
        >
          <CloseButton placement="end" onClick={this.closeTray}>
            {I18n.t('Close')}
          </CloseButton>
          <div className="tray-with-space-for-global-nav">{this.renderTrayContent()}</div>
        </Tray>
        {!ENV.current_user_disabled_inbox && (
          <UnreadComponent
            targetEl={this.unreadInboxCountElement}
            dataUrl="/api/v1/conversations/unread_count"
            onUpdate={this.onInboxUnreadUpdate}
          />
        )}
      </>
    )
  }
}
