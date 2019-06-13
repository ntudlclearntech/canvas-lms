/*
 * Copyright (C) 2019 - present Instructure, Inc.
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

import {AttachmentShape} from '../assignmentData'
import {getIconByType} from '../../../shared/helpers/mimeClassIconHelper'
import I18n from 'i18n!assignments_2'
import PropTypes from 'prop-types'
import React, {Component} from 'react'

import {Button} from '@instructure/ui-buttons/lib/components'
import {Flex, FlexItem} from '@instructure/ui-layout'
import ScreenReaderContent from '@instructure/ui-a11y/lib/components/ScreenReaderContent'
import Text from '@instructure/ui-elements/lib/components/Text'
import theme from '@instructure/ui-themes/lib/canvas/base'
import Tooltip from '@instructure/ui-overlays/lib/components/Tooltip'

export default class FilePreview extends Component {
  static propTypes = {
    files: PropTypes.arrayOf(AttachmentShape)
  }

  state = {
    selectedFile: 0
  }

  capitalize = s => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  selectFile = index => {
    if (index >= 0 || index < this.props.files.length) {
      this.setState({selectedFile: index})
    }
  }

  shouldDisplayThumbnail = file => {
    return file.mimeClass === 'image' && file.thumbnailUrl
  }

  renderThumbnail = (file, index) => {
    return (
      <Button variant="icon" size="large" onClick={() => this.selectFile(index)}>
        <img
          alt={I18n.t('%{filename} preview', {filename: file.displayName})}
          height="100"
          src={file.thumbnailUrl}
          width="100"
        />
        <ScreenReaderContent>{file.displayName}</ScreenReaderContent>
      </Button>
    )
  }

  renderIcon = (file, index) => {
    return (
      <Button
        variant="icon"
        size="large"
        onClick={() => this.selectFile(index)}
        icon={getIconByType(file.mimeClass)}
      >
        <ScreenReaderContent>{file.displayName}</ScreenReaderContent>
      </Button>
    )
  }

  renderFileIcons = () => {
    const iconsContainerStyle = {
      padding: theme.variables.spacing.small,
      borderRight: !this.props.files[this.state.selectedFile].submissionPreviewUrl
        ? `1px solid ${theme.variables.colors.borderMedium}`
        : ''
    }

    const iconsStyle = {
      display: 'block',
      textAlign: 'center',
      margin: `0 0 ${theme.variables.spacing.xSmall} 0`
    }

    return (
      <div data-testid="assignments_2_file_icons" style={iconsContainerStyle}>
        {this.props.files.map((file, index) => (
          <div key={file.id} style={iconsStyle}>
            <Tooltip tip={file.displayName} placement="bottom" variant="inverse">
              {this.shouldDisplayThumbnail(file)
                ? this.renderThumbnail(file, index)
                : this.renderIcon(file, index)}
            </Tooltip>
            <div style={{display: 'block'}}>
              <Text size="small">{this.capitalize(file.mimeClass)}</Text>
            </div>
          </div>
        ))}
      </div>
    )
  }

  renderFilePreview = () => {
    const iframeContainerStyle = {
      maxWidth: '1366px',
      height: '0',
      paddingBottom: '130%',
      position: 'relative'
    }

    const iframeStyle = {
      border: 'none',
      width: '100%',
      height: '100%',
      position: 'absolute',
      borderLeft: `1px solid ${theme.variables.colors.borderMedium}`
    }

    // TODO: replace this with appropriate SVG when available
    if (!this.props.files[this.state.selectedFile].submissionPreviewUrl) {
      return (
        <div
          style={{
            textAlign: 'center',
            padding: `${theme.variables.spacing.medium} 0 0 0`
          }}
        >
          <div style={{display: 'block'}}>
            <Text weight="bold">{I18n.t('No preview available for file')}</Text>
          </div>
        </div>
      )
    }

    return (
      <div style={iframeContainerStyle} data-testid="assignments_2_submission_preview">
        <ScreenReaderContent>
          {this.props.files[this.state.selectedFile].displayName}
        </ScreenReaderContent>
        <iframe
          src={this.props.files[this.state.selectedFile].submissionPreviewUrl}
          title="preview"
          style={iframeStyle}
        />
      </div>
    )
  }

  render() {
    return (
      <div style={{margin: '-0.75rem'}}>
        <Flex>
          <FlexItem align="start">{this.renderFileIcons()}</FlexItem>
          <FlexItem shrink grow align="start">
            {this.renderFilePreview()}
          </FlexItem>
        </Flex>
      </div>
    )
  }
}
