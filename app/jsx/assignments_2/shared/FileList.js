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

import {getIconByType} from '../../shared/helpers/mimeClassIconHelper'
import I18n from 'i18n!assignments_2'
import mimeClass from 'compiled/util/mimeClass'
import PropTypes from 'prop-types'
import React from 'react'

import {Button} from '@instructure/ui-buttons'
import {Flex} from '@instructure/ui-layout'
import {IconTrashLine} from '@instructure/ui-icons'
import {List, ListItem, Text} from '@instructure/ui-elements'
import {ScreenReaderContent} from '@instructure/ui-a11y'

const getIcon = file => {
  if (mimeClass(file.type) === 'image') {
    const fileURL = window.URL.createObjectURL(file)
    return (
      <img
        alt={I18n.t('%{filename} preview', {filename: file.name})}
        height="15"
        src={fileURL}
        width="15"
      />
    )
  }
  return getIconByType(mimeClass(file.type))
}

const FileList = props => {
  const {canRemove, files, previewHandler, removeFileHandler} = props
  const refsMap = {}

  return (
    <List variant="unstyled" delimiter="solid">
      <ListItem>
        <Text size="x-small" weight="bold">
          {I18n.t('Attached')}
        </Text>
      </ListItem>
      {files.map(file => (
        <ListItem key={file.id}>
          <Flex>
            <Flex.Item size="40px" padding="x-small small">
              {getIcon(file)}
            </Flex.Item>
            <Flex.Item grow shrink>
              <Text size="x-small">{file.name}</Text>
            </Flex.Item>
            <Flex.Item>
              <Button variant="link" size="small" onClick={previewHandler}>
                <span aria-hidden title={I18n.t('Preview')}>
                  {I18n.t('Preview')}
                </span>
                <ScreenReaderContent>
                  {I18n.t('Preview %{filename}', {filename: file.name})}
                </ScreenReaderContent>
              </Button>
            </Flex.Item>
            {canRemove && (
              <Flex.Item padding="0 small 0 x-small">
                <Button
                  icon={IconTrashLine}
                  id={file.id}
                  onClick={removeFileHandler(refsMap)}
                  ref={element => {
                    refsMap[file.id] = element
                  }}
                  size="small"
                  variant="icon"
                >
                  <ScreenReaderContent>
                    {I18n.t('Remove %{filename}', {filename: file.name})}
                  </ScreenReaderContent>
                </Button>
              </Flex.Item>
            )}
          </Flex>
        </ListItem>
      ))}
    </List>
  )
}

FileList.propTypes = {
  canRemove: PropTypes.bool.isRequired,
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired
    })
  ).isRequired,
  previewHandler: PropTypes.func,
  removeFileHandler: PropTypes.func
}

export default FileList
