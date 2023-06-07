/*
 * Copyright (C) 2017 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that they will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */
import React, {Component} from 'react'
import classnames from 'classnames'
import {func, bool, string} from 'prop-types'

import {Heading} from '@instructure/ui-heading'
import {Link} from '@instructure/ui-link'

import {InlineList} from '@instructure/ui-list'
import formatMessage from '../../format-message'
import DesertSvg from './empty-desert.svg' // Currently uses react-svg-loader
import BalloonsSvg from './balloons.svg'
import buildStyle from './style'

export default class PlannerEmptyState extends Component {
  static propTypes = {
    changeDashboardView: func,
    onAddToDo: func.isRequired,
    isCompletelyEmpty: bool,
    responsiveSize: string,
    isWeekly: bool,
  }

  static defaultProps = {
    responsiveSize: 'large',
  }

  constructor(props) {
    super(props)
    this.style = buildStyle()
  }

  handleDashboardCardLinkClick = () => {
    if (this.props.changeDashboardView) {
      this.props.changeDashboardView('cards')
    }
  }

  renderAddToDoButton = () => {
    return (
      <Link
        as="button"
        isWithinText={false}
        id="PlannerEmptyState_AddToDo"
        onClick={this.props.onAddToDo}
      >
        {formatMessage('Add To-Do')}
      </Link>
    )
  }

  renderNothingAtAll = () => {
    return (
      <div
        className={classnames(
          this.style.classNames.root,
          'planner-empty-state',
          this.style.classNames[this.props.responsiveSize]
        )}
      >
        <DesertSvg
          className={classnames(this.style.classNames.desert, 'desert')}
          aria-hidden="true"
        />
        <div className={this.style.classNames.title}>
          <Heading>{formatMessage('No Due Dates Assigned')}</Heading>
        </div>
        <div className={this.style.classNames.subtitlebox}>
          <div className={this.style.classNames.subtitle}>
            {formatMessage("Looks like there isn't anything here")}
          </div>
          {!this.props.isWeekly && (
            <InlineList delimiter="pipe">
              {this.props.changeDashboardView && (
                <InlineList.Item>
                  <Link
                    as="button"
                    isWithinText={false}
                    id="PlannerEmptyState_CardView"
                    onClick={this.handleDashboardCardLinkClick}
                  >
                    {formatMessage('Go to Card View Dashboard')}
                  </Link>
                </InlineList.Item>
              )}
              <InlineList.Item>{this.renderAddToDoButton()}</InlineList.Item>
            </InlineList>
          )}
        </div>
      </div>
    )
  }

  renderNothingLeft = () => {
    const msg = this.props.isWeekly
      ? formatMessage('Nothing Due This Week')
      : formatMessage('Nothing More To Do')
    return (
      <div
        className={classnames(
          this.style.classNames.root,
          'planner-empty-state',
          this.style.classNames[this.props.responsiveSize]
        )}
      >
        <BalloonsSvg
          className={classnames(this.style.classNames.balloons, 'balloons')}
          aria-hidden="true"
        />
        <div className={this.style.classNames.title}>
          <Heading>{msg}</Heading>
        </div>
        {!this.props.isWeekly && (
          <div className={this.style.classNames.subtitlebox}>
            <div className={this.style.classNames.subtitle}>
              {formatMessage('Scroll up to see your history!')}
            </div>
            {this.renderAddToDoButton()}
          </div>
        )}
      </div>
    )
  }

  render() {
    return (
      <>
        <style>{this.style.css}</style>
        {this.props.isCompletelyEmpty ? this.renderNothingAtAll() : this.renderNothingLeft()}
      </>
    )
  }
}
