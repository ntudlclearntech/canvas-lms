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

import {AlertManagerContext} from '@canvas/alerts/react/AlertManager'
import {CONVERSATIONS_QUERY, SUBMISSION_COMMENTS_QUERY} from '../../graphql/Queries'
import {UPDATE_CONVERSATION_PARTICIPANTS} from '../../graphql/Mutations'
import {ConversationListHolder} from '../components/ConversationListHolder/ConversationListHolder'
import { useScope as useI18nScope } from '@canvas/i18n';
import {Mask} from '@instructure/ui-overlays'
import PropTypes from 'prop-types'
import React, {useContext, useEffect, useState} from 'react'
import {Spinner} from '@instructure/ui-spinner'
import {useQuery, useMutation} from 'react-apollo'
import {View} from '@instructure/ui-view'

const I18n = useI18nScope('conversations_2');

const ConversationListContainer = ({course, scope, onSelectConversation, userFilter}) => {
  const {setOnFailure, setOnSuccess} = useContext(AlertManagerContext)
  const [submissionComments, setSubmissionComments] = useState([])
  const userID = ENV.current_user_id?.toString()

  const [starChangeConversationParticipants] = useMutation(UPDATE_CONVERSATION_PARTICIPANTS, {
    onCompleted(data) {
      if (data.updateConversationParticipants.errors) {
        setOnFailure(I18n.t('There was an unexpected error updating the conversation participants'))
      } else {
        const isStarred =
          data.updateConversationParticipants.conversationParticipants[0].label === 'starred'

        if (isStarred) {
          setOnSuccess(I18n.t('The conversation has been successfully starred'))
        } else {
          setOnSuccess(I18n.t('The conversation has been successfully unstarred'))
        }
      }
    },
    onError() {
      setOnFailure(I18n.t('There was an unexpected error updating the conversation participants'))
    }
  })

  const handleStar = (starred, conversationId) => {
    starChangeConversationParticipants({
      variables: {
        conversationIds: [conversationId],
        starred
      }
    })
  }

  const scopeIsSubmissionComments = scope === 'submission_comments'

  const conversationsQuery = useQuery(CONVERSATIONS_QUERY, {
    variables: {userID, scope, filter: [userFilter, course]},
    fetchPolicy: 'cache-and-network',
    skip: scopeIsSubmissionComments
  })

  const submissionCommentsQuery = useQuery(SUBMISSION_COMMENTS_QUERY, {
    variables: {userID},
    skip: !scopeIsSubmissionComments
  })

  useEffect(() => {
    if (
      scopeIsSubmissionComments &&
      submissionCommentsQuery.data &&
      !submissionCommentsQuery.loading
    ) {
      const groupedSubmissionComments = {}
      const submissionComments =
        submissionCommentsQuery.data.legacyNode.submissionCommentsConnection.nodes

      submissionComments.forEach(submissionComment => {
        const key = submissionComment.submissionId + '-' + submissionComment.attempt

        if (!groupedSubmissionComments[key]) {
          groupedSubmissionComments[key] = []
        }

        groupedSubmissionComments[key].push(submissionComment)
      })

      setSubmissionComments(Object.entries(groupedSubmissionComments).map(e => e[1]))
    }
  }, [scopeIsSubmissionComments, submissionCommentsQuery.data, submissionCommentsQuery.loading])

  if (conversationsQuery.loading || submissionCommentsQuery.loading) {
    return (
      <View as="div" style={{position: 'relative'}} height="100%">
        <Mask>
          <Spinner renderTitle={() => I18n.t('Loading Message List')} variant="inverse" />
        </Mask>
      </View>
    )
  }

  if (conversationsQuery.error || submissionCommentsQuery.error) {
    setOnFailure(I18n.t('Unable to load messages.'))
  }

  return (
    <ConversationListHolder
      conversations={
        !scopeIsSubmissionComments
          ? conversationsQuery.data?.legacyNode?.conversationsConnection?.nodes
          : submissionComments
      }
      onOpen={() => {}}
      onSelect={onSelectConversation}
      onStar={handleStar}
      isSubmissionComments={scopeIsSubmissionComments}
    />
  )
}

export default ConversationListContainer

ConversationListContainer.propTypes = {
  course: PropTypes.string,
  userFilter: PropTypes.number,
  scope: PropTypes.string,
  onSelectConversation: PropTypes.func
}

ConversationListContainer.defaultProps = {
  scope: 'inbox',
  onSelectConversation: () => {}
}
