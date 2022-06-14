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
import {findDOMNode} from 'react-dom'
import {node, object, func} from 'prop-types'

import {themeable} from '@instructure/ui-themeable'
import {CondensedButton} from '@instructure/ui-buttons'
import {ScreenReaderContent} from '@instructure/ui-a11y-content'

import styles from './styles.css'
import theme from './theme'

class ShowOnFocusButton extends Component {
  static propTypes = {
    buttonProps: object,
    srProps: object,
    children: node.isRequired,
    elementRef: func
  }

  static defaultProps = {
    elementRef: () => {}
  }

  constructor(props) {
    super(props)
    this.state = {
      visible: false
    }
  }

  handleFocus = e => {
    this.setState(
      {
        visible: true
      },
      () => {
        findDOMNode(this.btnRef).focus()
      }
    )
  }

  handleBlur = e => {
    this.setState({
      visible: false
    })
  }

  renderButton() {
    const {buttonProps, children} = this.props
    return (
      <CondensedButton
        elementRef={btn => {
          this.btnRef = btn
          this.props.elementRef(btn)
        }}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        {...buttonProps}
      >
        {children}
      </CondensedButton>
    )
  }

  renderInvisibleButton() {
    const {srProps} = this.props
    return <ScreenReaderContent {...srProps}>{this.renderButton()}</ScreenReaderContent>
  }

  render() {
    if (this.state.visible) {
      return this.renderButton()
    } else {
      return this.renderInvisibleButton()
    }
  }
}

export default themeable(theme, styles)(ShowOnFocusButton)
