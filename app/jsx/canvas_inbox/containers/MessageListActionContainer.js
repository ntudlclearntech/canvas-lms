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

import {AlertManagerContext} from 'jsx/shared/components/AlertManager'
import {COURSES_QUERY, CONVERSATIONS_QUERY} from '../Queries'
import {DELETE_CONVERSATIONS} from '../Mutations'
import {CourseSelect} from '../components/CourseSelect/CourseSelect'
import {Flex} from '@instructure/ui-flex'
import I18n from 'i18n!conversations_2'
import {MailboxSelectionDropdown} from '../components/MailboxSelectionDropdown/MailboxSelectionDropdown'
import {MessageActionButtons} from '../components/MessageActionButtons/MessageActionButtons'
import PropTypes from 'prop-types'
import {useQuery, useMutation} from 'react-apollo'
import React, {useContext} from 'react'
import {reduceDuplicateCourses} from '../helpers/courses_helper'
import {View} from '@instructure/ui-view'

const MessageListActionContainer = props => {
  const {setOnFailure, setOnSuccess} = useContext(AlertManagerContext)
  const conversationsQuery = CONVERSATIONS_QUERY
  const userID = ENV.current_user_id?.toString()

  const removeDeletedConversationsFromCache = (cache, result) => {
    const conversationsFromCache = JSON.parse(
      JSON.stringify(
        cache.readQuery({
          query: conversationsQuery,
          variables: {userID, scope: props.scope, course: props.course}
        })
      )
    )

    const conversationIDsFromResult = result.data.deleteConversations.conversationIds

    const updatedCPs = conversationsFromCache.legacyNode.conversationsConnection.nodes.filter(
      conversationParticipant => {
        return !conversationIDsFromResult.includes(conversationParticipant.conversation._id)
      }
    )

    conversationsFromCache.legacyNode.conversationsConnection.nodes = updatedCPs
    cache.writeQuery({
      query: conversationsQuery,
      variables: {userID, scope: props.scope, course: props.course},
      data: conversationsFromCache
    })
  }

  const handleDeleteComplete = data => {
    const deletedSuccessMsg = I18n.t(
      {
        one: 'Message Deleted!',
        other: 'Messages Deleted!'
      },
      {count: props.selectdIds.length}
    )

    if (data.deleteConversations.errors) {
      // keep delete button enabled since deletion returned errors
      props.deleteToggler(false)
      setOnFailure(I18n.t('Delete operation failed'))
    } else {
      props.deleteToggler(true)
      setOnSuccess(deletedSuccessMsg, false)
    }
  }

  const [deleteConversations] = useMutation(DELETE_CONVERSATIONS, {
    update: removeDeletedConversationsFromCache,
    onCompleted(data) {
      handleDeleteComplete(data)
    },
    onError() {
      setOnFailure(I18n.t('Delete operation failed'))
    }
  })

  const {loading, error, data} = useQuery(COURSES_QUERY, {
    variables: {userID}
  })

  if (loading) {
    return <span />
  }

  if (error) {
    setOnFailure(I18n.t('Unable to load courses menu.'))
  }

  const moreCourses = reduceDuplicateCourses(
    data?.legacyNode?.enrollments,
    data?.legacyNode?.favoriteCoursesConnection?.nodes
  )

  const handleDelete = () => {
    const delMsg = I18n.t(
      {
        one:
          'Are you sure you want to delete your copy of this conversation? This action cannot be undone.',
        other:
          'Are you sure you want to delete your copy of these conversations? This action cannot be undone.'
      },
      {count: props.selectdIds.length}
    )

    const confirmResult = window.confirm(delMsg) // eslint-disable-line no-alert
    if (confirmResult) {
      deleteConversations({variables: {ids: props.selectdIds}})
    } else {
      // confirm message was cancelled by user
      props.deleteToggler(false)
    }
  }

  return (
    <View
      as="div"
      display="inline-block"
      width="100%"
      margin="none"
      padding="small"
      background="secondary"
    >
      <Flex wrap="wrap">
        <Flex.Item>
          <CourseSelect
            mainPage
            options={{
              favoriteCourses: data?.legacyNode?.favoriteCoursesConnection?.nodes,
              moreCourses,
              concludedCourses: [],
              groups: data?.legacyNode?.favoriteGroupsConnection?.nodes
            }}
            onCourseFilterSelect={props.onCourseFilterSelect}
          />
        </Flex.Item>
        <Flex.Item padding="none none none xxx-small">
          <MailboxSelectionDropdown
            activeMailbox={props.activeMailbox}
            onSelect={props.onSelectMailbox}
          />
        </Flex.Item>
        <Flex.Item shouldGrow shouldShrink />
        <Flex.Item>
          <MessageActionButtons
            archive={() => {}}
            compose={props.onCompose}
            delete={() => {
              handleDelete()
            }}
            deleteDisabled={props.deleteDisabled}
            forward={() => {}}
            markAsUnread={() => {}}
            reply={() => {}}
            replyAll={() => {}}
            star={() => {}}
          />
        </Flex.Item>
      </Flex>
    </View>
  )
}

export default MessageListActionContainer

MessageListActionContainer.propTypes = {
  course: PropTypes.string,
  scope: PropTypes.string,
  activeMailbox: PropTypes.string,
  onCourseFilterSelect: PropTypes.func,
  onSelectMailbox: PropTypes.func,
  onCompose: PropTypes.func,
  selectdIds: PropTypes.array,
  deleteToggler: PropTypes.func,
  deleteDisabled: PropTypes.bool
}
