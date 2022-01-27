/*
 * Copyright (C) 2020 - present Instructure, Inc.
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

import {Avatar} from '@instructure/ui-avatar'
import {Flex} from '@instructure/ui-flex'
import {MessageDetailActions} from '../MessageDetailActions/MessageDetailActions'
import {MessageDetailMediaAttachment} from '../MessageDetailMediaAttachment/MessageDetailMediaAttachment'
import {MessageDetailParticipants} from '../MessageDetailParticipants/MessageDetailParticipants'
import PropTypes from 'prop-types'
import React from 'react'
import {Responsive} from '@instructure/ui-responsive'
import {responsiveQuerySizes} from '../../../util/utils'
import {IconPaperclipLine} from '@instructure/ui-icons'
import {Link} from '@instructure/ui-link'
import {List} from '@instructure/ui-list'
import {Text} from '@instructure/ui-text'
import I18n from 'i18n!conversations_2'

export const MessageDetailItem = ({...props}) => {
  const dateOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }

  const createdAt = Intl.DateTimeFormat(I18n.currentLocale(), dateOptions).format(
    new Date(props.conversationMessage.createdAt)
  )

  return (
    <Responsive
      match="media"
      query={responsiveQuerySizes({mobile: true, tablet: true, desktop: true})}
      props={{
        mobile: {
          avatar: 'small',
          usernames: 'x-small',
          courseNameDate: 'x-small',
          messageBody: 'x-small',
          dataTestId: 'message-detail-item-mobile'
        },
        tablet: {
          avatar: 'medium',
          usernames: 'small',
          courseNameDate: 'x-small',
          messageBody: 'small',
          dataTestId: 'message-detail-item-tablet'
        },
        desktop: {
          avatar: 'medium',
          usernames: 'medium',
          courseNameDate: 'x-small',
          messageBody: 'medium',
          dataTestId: 'message-detail-item-desktop'
        }
      }}
      render={responsiveProps => (
        <>
          <Flex data-testid={responsiveProps.dataTestId} alignItems="start">
            <Flex.Item>
              <Avatar
                size={responsiveProps.avatar}
                margin="small small small none"
                name={props.conversationMessage.author.name}
                src={props.conversationMessage.author.avatarUrl}
              />
            </Flex.Item>
            <Flex.Item shouldShrink shouldGrow>
              <Flex direction="column">
                <Flex.Item>
                  <MessageDetailParticipants
                    participantsSize={responsiveProps.usernames}
                    conversationMessage={props.conversationMessage}
                  />
                </Flex.Item>
                <Flex.Item>
                  <Text weight="normal" size={responsiveProps.courseNameDate}>
                    {props.contextName}
                  </Text>
                </Flex.Item>
                <Flex.Item>
                  <Text weight="normal" size={responsiveProps.courseNameDate}>
                    {createdAt}
                  </Text>
                </Flex.Item>
              </Flex>
            </Flex.Item>
            <Flex.Item textAlign="end">
              <MessageDetailActions
                onReply={props.onReply}
                onReplyAll={props.onReplyAll}
                onDelete={props.onDelete}
              />
            </Flex.Item>
          </Flex>
          <Text size={responsiveProps.messageBody}>{props.conversationMessage.body}</Text>
          {props.conversationMessage.attachmentsConnection?.nodes?.length > 0 && (
            <List isUnstyled margin="medium auto small">
              {props.conversationMessage.attachmentsConnection.nodes.map(attachment => {
                return (
                  <List.Item as="div" key={attachment.id}>
                    <Link href={attachment.url} renderIcon={<IconPaperclipLine size="x-small" />}>
                      {attachment.displayName}
                    </Link>
                  </List.Item>
                )
              })}
            </List>
          )}
          {props.conversationMessage.mediaComment && (
            <MessageDetailMediaAttachment mediaComment={props.conversationMessage.mediaComment} />
          )}
        </>
      )}
    />
  )
}

MessageDetailItem.propTypes = {
  // TODO: not sure yet the exact shape of the data that will be fetched, so these will likely change
  conversationMessage: PropTypes.object,
  contextName: PropTypes.string,
  onReply: PropTypes.func,
  onReplyAll: PropTypes.func,
  onDelete: PropTypes.func
}

MessageDetailItem.defaultProps = {
  conversationMessage: {}
}
