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

import {AlertManagerContext} from '@canvas/alerts/react/AlertManager'
import {Conversation} from '../../../graphql/Conversation'
import {ConversationContext} from '../../../util/constants'
import {CONVERSATION_MESSAGES_QUERY} from '../../../graphql/Queries'
import {DELETE_CONVERSATION_MESSAGES} from '../../../graphql/Mutations'
import {useScope as useI18nScope} from '@canvas/i18n'
import {MessageDetailHeader} from '../../components/MessageDetailHeader/MessageDetailHeader'
import {MessageDetailItem} from '../../components/MessageDetailItem/MessageDetailItem'
import PropTypes from 'prop-types'
import React, {useContext, useEffect, useState} from 'react'
import {Spinner} from '@instructure/ui-spinner'
import {useMutation, useQuery} from 'react-apollo'
import {View} from '@instructure/ui-view'

const I18n = useI18nScope('conversations_2')

export const MessageDetailContainer = props => {
  const {setOnFailure, setOnSuccess} = useContext(AlertManagerContext)
  const {setMessageOpenEvent, messageOpenEvent} = useContext(ConversationContext)
  const [messageRef, setMessageRef] = useState()
  const variables = {
    conversationID: props.conversation._id
  }

  const removeConversationMessagesFromCache = (cache, result) => {
    const options = {
      query: CONVERSATION_MESSAGES_QUERY,
      variables
    }
    const data = JSON.parse(JSON.stringify(cache.readQuery(options)))

    data.legacyNode.conversationMessagesConnection.nodes =
      data.legacyNode.conversationMessagesConnection.nodes.filter(
        message =>
          !result.data.deleteConversationMessages.conversationMessageIds.includes(message._id)
      )

    cache.writeQuery({...options, data})
  }

  const handleDeleteConversationMessage = conversationMessageId => {
    const delMsg = I18n.t(
      'Are you sure you want to delete your copy of this message? This action cannot be undone.'
    )

    const confirmResult = window.confirm(delMsg) // eslint-disable-line no-alert
    if (confirmResult) {
      deleteConversationMessages({variables: {ids: [conversationMessageId]}})
    }
  }

  const [deleteConversationMessages] = useMutation(DELETE_CONVERSATION_MESSAGES, {
    update: removeConversationMessagesFromCache,
    onCompleted() {
      setOnSuccess(I18n.t('Successfully deleted the conversation message'), false)
    },
    onError() {
      setOnFailure(I18n.t('There was an unexpected error deleting the conversation message'))
    }
  })

  const {loading, error, data} = useQuery(CONVERSATION_MESSAGES_QUERY, {
    variables
  })

  // Intial focus on message when loaded
  useEffect(() => {
    if (!loading && messageOpenEvent && messageRef) {
      // Focus
      messageRef?.focus()
      setMessageOpenEvent(false)
    }
  }, [loading, messageRef, messageOpenEvent, setMessageOpenEvent])

  if (loading) {
    return (
      <View as="div" textAlign="center" margin="large none">
        <Spinner renderTitle={() => I18n.t('Loading Conversation Messages')} variant="inverse" />
      </View>
    )
  }

  if (error) {
    setOnFailure(I18n.t('Failed to load conversation messages.'))
    return
  }

  return (
    <>
      <MessageDetailHeader
        focusRef={setMessageRef}
        text={props.conversation.subject}
        onReply={props.onReply}
        onReplyAll={props.onReplyAll}
        onDelete={() => props.onDelete([props.conversation._id])}
      />
      {data?.legacyNode?.conversationMessagesConnection.nodes.map(message => (
        <View as="div" borderWidth="small none none none" padding="small" key={message.id}>
          <MessageDetailItem
            conversationMessage={message}
            contextName={data?.legacyNode?.contextName}
            onReply={() => props.onReply(message)}
            onReplyAll={() => props.onReplyAll(message)}
            onDelete={() => handleDeleteConversationMessage(message._id)}
          />
        </View>
      ))}
    </>
  )
}

MessageDetailContainer.propTypes = {
  conversation: Conversation.shape,
  onReply: PropTypes.func,
  onReplyAll: PropTypes.func,
  onDelete: PropTypes.func
}
