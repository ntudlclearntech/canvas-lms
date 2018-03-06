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

import I18n from 'i18n!shared_components'
import React, { Component } from 'react'
import { bool, node, string, func, shape, arrayOf } from 'prop-types'
import cx from 'classnames'

import Heading from '@instructure/ui-core/lib/components/Heading'
import Checkbox from '@instructure/ui-core/lib/components/Checkbox'
import Avatar from '@instructure/ui-core/lib/components/Avatar'
import Badge from '@instructure/ui-core/lib/components/Badge'
import ScreenReaderContent from '@instructure/ui-core/lib/components/ScreenReaderContent'
import Text from '@instructure/ui-core/lib/components/Text'
import Button from '@instructure/ui-core/lib/components/Button'
import PopoverMenu from '@instructure/ui-core/lib/components/PopoverMenu'
import IconMore from 'instructure-icons/lib/Line/IconMoreLine'

import IconDragHandleLine from 'instructure-icons/lib/Line/IconDragHandleLine'
import LockIconView from 'compiled/views/LockIconView'
import { author as authorShape } from '../proptypes/user'
import masterCourseDataShape from '../proptypes/masterCourseData'

export default class CourseItemRow extends Component {
  static propTypes = {
    actionsContent: node,
    metaContent: node,
    masterCourse: shape({
      courseData: masterCourseDataShape,
      getLockOptions: func.isRequired,
    }),
    author: authorShape,
    title: string.isRequired,
    body: node,
    connectDragSource: func,
    id: string,
    className: string,
    itemUrl: string,
    selectable: bool,
    draggable: bool,
    defaultSelected: bool,
    isRead: bool,
    showAvatar: bool,
    onSelectedChanged: func,
    icon: node,
    showManageMenu: bool,
    manageMenuOptions: arrayOf(node),
    onManageMenuSelect: func,
    sectionToolTip: node,
    replyButton: node,
    shouldFocusOnTitle: bool,
    clearFocusDirectives: func, // Required if shouldFocusOnTitle is true
  }

  static defaultProps = {
    actionsContent: null,
    body: null,
    metaContent: null,
    masterCourse: null,
    author: {
      id: null,
      display_name: '',
      html_url: '',
      avatar_image_url: null,
    },
    id: null,
    className: '',
    itemUrl: null,
    selectable: false,
    draggable: false,
    defaultSelected: false,
    isRead: true,
    icon: null,
    showAvatar: false,
    connectDragSource: null,
    onSelectedChanged () {},
    showManageMenu: false,
    manageMenuOptions: [],
    onManageMenuSelect () {},
    sectionToolTip: null,
    replyButton: null,
    shouldFocusOnTitle: false,
    clearFocusDirectives: () => {}
  }

  state = {
    isSelected: this.props.defaultSelected,
  }

  componentWillUnmount () {
    this.unmountMasterCourseLock()
  }

  componentDidMount () {
    if (this.props.shouldFocusOnTitle) {
      this._titleElement.focus()
      this.props.clearFocusDirectives()
    }
  }

  onSelectChanged = (e) => {
    this.setState({ isSelected: e.target.checked }, () => {
      this.props.onSelectedChanged({ selected: this.state.isSelected, id: this.props.id })
    })
  }

  initializeMasterCourseIcon = (container) => {
    const { courseData = {}, getLockOptions } = this.props.masterCourse || {}
    if (container && (courseData.isMasterCourse || courseData.isChildCourse)) {
      this.unmountMasterCourseLock()
      const opts = getLockOptions()

      // initialize master course lock icon, which is a Backbone view
      // I know, I know, backbone in react is grosssss but wachagunnado
      this.masterCourseLock = new LockIconView({ ...opts, el: container })
      this.masterCourseLock.render()
    }
  }

  unmountMasterCourseLock () {
    if (this.masterCourseLock) {
      this.masterCourseLock.remove()
      this.masterCourseLock = null
    }
  }

  renderClickableDiv (component, refName = undefined) {
    const refFn = (c) => {
      if (refName) {
        this[refName] = c
      }
    }

    return (
      <a className="ic-item-row__content-link" ref={refFn} href={this.props.itemUrl}>
        <div className="ic-item-row__content-link-container">
          {component}
        </div>
      </a>
    )
  }

  render () {
    const classes = cx('ic-item-row', {
      'ic-item-row__unread': !this.props.isRead,
    })
    return (
      <div className={`${classes} ${this.props.className}`}>
        {(this.props.draggable && this.props.connectDragSource && <div className="ic-item-row__drag-col">
          {this.props.connectDragSource(
            <span>
              <Text color="secondary" size="large">
                <IconDragHandleLine />
              </Text>
            </span>, {dropEffect: 'copy'})
          }
        </div>)}
        {(this.props.icon &&
        <div className={this.props.draggable ? "ic-item-row__icon-col-teacher" : "ic-item-row__icon-col-student"}>
          {!this.props.isRead ?
            <Badge margin="0 small 0 0 " standalone type="notification" />
          : null}
          {this.props.icon}
        </div>)}
        {(this.props.selectable && <div className="ic-item-row__select-col">
          <Checkbox
            defaultChecked={this.props.defaultSelected}
            onChange={this.onSelectChanged}
            label={<ScreenReaderContent>{this.props.title}</ScreenReaderContent>}
          />
        </div>)}
        {(this.props.showAvatar && <div className="ic-item-row__author-col">
          <Avatar
            size="small"
            name={this.props.author.display_name || I18n.t('Unknown')}
            src={this.props.author.avatar_image_url}
          />
        </div>)}
        <div className="ic-item-row__content-col">
          {!this.props.isRead && <ScreenReaderContent>{I18n.t('Unread')}</ScreenReaderContent>}
          {this.renderClickableDiv(<Heading level="h3">{this.props.title}</Heading>, "_titleElement")}
          {this.props.sectionToolTip}
          {this.props.body ? this.renderClickableDiv(this.props.body) : null}
          {this.props.replyButton ? this.renderClickableDiv(this.props.replyButton) : null}
        </div>
        <div className="ic-item-row__meta-col">
          <div className="ic-item-row__meta-actions">
            {this.props.actionsContent}
            <span ref={this.initializeMasterCourseIcon} className="ic-item-row__master-course-lock" />
            {this.props.showManageMenu && this.props.manageMenuOptions.length > 0 &&
              (<span className="ic-item-row__manage-menu">
                <PopoverMenu
                  onSelect={this.props.onManageMenuSelect}
                  trigger={
                    <Button variant="icon" size="small">
                      <IconMore />
                      <ScreenReaderContent>{I18n.t('Manage options for %{name}', { name: this.props.title })}</ScreenReaderContent>
                    </Button>
                  }>{this.props.manageMenuOptions}</PopoverMenu>
              </span>)}
          </div>
          <div className="ic-item-row__meta-content">
            {this.props.metaContent}
          </div>
        </div>
      </div>
    )
  }
}
