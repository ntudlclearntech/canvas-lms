/*
 * Copyright (C) 2021 - present Instructure, Inc.
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

import React, {useReducer, useState, useEffect, Suspense} from 'react'

import formatMessage from '../../../../../../format-message'
import reducer, {actions, initialState, modes} from '../../../reducers/imageSection'
import {actions as svgActions} from '../../../reducers/svgSettings'

import {Button} from '@instructure/ui-buttons'
import {Flex} from '@instructure/ui-flex'
import {Group} from '../Group'
import {IconCropSolid} from '@instructure/ui-icons'
import {ImageCropperModal} from '../ImageCropper'
import {Spinner} from '@instructure/ui-spinner'
import {Text} from '@instructure/ui-text'
import {TruncateText} from '@instructure/ui-truncate-text'
import {View} from '@instructure/ui-view'

import Course from './Course'
import ModeSelect from './ModeSelect'
import PreviewIcon from '../../../../shared/PreviewIcon'

export const ImageSection = ({settings, onChange, editing, editor}) => {
  const [openCropModal, setOpenCropModal] = useState(false)
  const [state, dispatch] = useReducer(reducer, initialState)

  const Upload = React.lazy(() => import('./Upload'))

  const allowedModes = {
    [modes.courseImages.type]: Course,
    [modes.uploadImages.type]: Upload
  }

  useEffect(() => {
    if (editing) {
      dispatch({
        type: actions.SET_IMAGE.type,
        payload: settings.encodedImage
      })
    }
  }, [settings.encodedImage])

  useEffect(() => {
    if (editing) {
      dispatch({
        type: actions.SET_IMAGE_NAME.type,
        payload: settings.encodedImageName
      })
    }
  }, [settings.encodedImageName])

  useEffect(() => {
    onChange({
      type: svgActions.SET_ENCODED_IMAGE,
      payload: state.image
    })
  }, [state.image])

  useEffect(() => {
    onChange({
      type: svgActions.SET_ENCODED_IMAGE_TYPE,
      payload: state.mode
    })
  }, [state.mode])

  useEffect(() => {
    onChange({
      type: svgActions.SET_ENCODED_IMAGE_NAME,
      payload: state.imageName
    })
  }, [state.imageName])

  return (
    <Group as="section" defaultExpanded summary={formatMessage('Image')}>
      <Flex direction="column" margin="small">
        <Flex.Item>
          <Text weight="bold">{formatMessage('Current Image')}</Text>
        </Flex.Item>
        <Flex.Item>
          <Flex>
            <Flex.Item shouldGrow>
              <Flex>
                <Flex.Item margin="0 small 0 0">
                  <PreviewIcon
                    variant="large"
                    testId="selected-image-preview"
                    image={state.image}
                    loading={state.loading}
                  />
                </Flex.Item>
              </Flex>
            </Flex.Item>
            <Flex.Item>
              <View maxWidth="200px" as="div">
                <TruncateText>
                  <Text>{state.imageName ? state.imageName : formatMessage('None Selected')}</Text>
                </TruncateText>
              </View>
            </Flex.Item>
            <Flex.Item>
              <ModeSelect dispatch={dispatch} />
            </Flex.Item>
          </Flex>
        </Flex.Item>
        <Flex.Item>
          <Suspense
            fallback={
              <Flex justifyItems="center">
                <Flex.Item>
                  <Spinner renderTitle={formatMessage('Loading')} />
                </Flex.Item>
              </Flex>
            }
          >
            {!!allowedModes[state.mode] &&
              React.createElement(allowedModes[state.mode], {dispatch, editor})}
          </Suspense>
        </Flex.Item>
        <Flex.Item>
          <Button
            renderIcon={IconCropSolid}
            onClick={() => {
              setOpenCropModal(true)
            }}
          />
          {openCropModal && (
            <ImageCropperModal
              open={openCropModal}
              onClose={() => setOpenCropModal(false)}
              image={state.image}
            />
          )}
        </Flex.Item>
      </Flex>
    </Group>
  )
}
