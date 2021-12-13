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

import {AnonymousAvatar} from '../AnonymousAvatar/AnonymousAvatar'
import {CURRENT_USER} from '../../utils/constants'
import I18n from 'i18n!discussions_posts'
import React, {useState} from 'react'

import {Avatar} from '@instructure/ui-avatar'
import {Flex} from '@instructure/ui-flex'
import {Select} from '@instructure/ui-select'
import {Text} from '@instructure/ui-text'
import {View} from '@instructure/ui-view'
import {string} from 'prop-types'

export const AnonymousResponseSelector = props => {
  const [selectedOption, setSelectedOption] = useState(
    props.discussionAnonymousState ? 'Anonymous' : props.username
  )
  const [showOptions, setShowOptions] = useState(false)
  const [highlightedOption, setHighlightedOption] = useState(null)

  const replyAsOption = () => {
    if (props.discussionAnonymousState === 'partial_anonymity') {
      return (
        <Select
          inputValue={selectedOption}
          isShowingOptions={showOptions}
          onRequestShowOptions={() => {
            setShowOptions(true)
          }}
          onRequestHideOptions={() => {
            setShowOptions(false)
          }}
          onRequestSelectOption={(event, {id}) => {
            setShowOptions(false)
            setSelectedOption(id)
          }}
          onBlur={() => {
            setHighlightedOption(null)
          }}
          onRequestHighlightOption={(event, {id}) => {
            setHighlightedOption(id)
          }}
          renderLabel={
            <Text size="small" weight="light">
              {I18n.t('Replying as')}
            </Text>
          }
        >
          <Select.Option
            id="Anonymous"
            key="Anonymous"
            renderBeforeLabel={<AnonymousAvatar size="small" seedString={CURRENT_USER} />}
            isHighlighted={highlightedOption === 'Anonymous'}
          >
            <Text>{I18n.t('Anonymous')}</Text>
          </Select.Option>
          <Select.Option
            id={props.username}
            key={props.username}
            isHighlighted={highlightedOption === props.username}
            renderBeforeLabel={
              <Avatar
                size="xx-small"
                name={props.username}
                color="licorice"
                hasInverseColor
                margin="0 small 0 0"
              />
            }
          >
            <Text>{props.username}</Text>
          </Select.Option>
        </Select>
      )
    }
    return (
      <Flex direction="column">
        <Text size="small" weight="light">
          {I18n.t('Replying as')}
        </Text>
        <Text>{props.discussionAnonymousState ? 'Anonymous' : props.username}</Text>
      </Flex>
    )
  }

  return (
    <Flex>
      {selectedOption === 'Anonymous' ? (
        <AnonymousAvatar seedString={CURRENT_USER} />
      ) : (
        <Avatar name={props.username} color="licorice" hasInverseColor />
      )}
      <View margin="0 0 0 small">{replyAsOption()}</View>
    </Flex>
  )
}

AnonymousResponseSelector.propTypes = {
  username: string,
  discussionAnonymousState: string || null
}
