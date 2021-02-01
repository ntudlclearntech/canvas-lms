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
import {AttachmentDisplay} from '../components/AttachmentDisplay/AttachmentDisplay'
import {ComposeActionButtons} from 'jsx/canvas_inbox/components/ComposeActionButtons/ComposeActionButtons'
import {ComposeInputWrapper} from 'jsx/canvas_inbox/components/ComposeInputWrapper/ComposeInputWrapper'
import {CourseSelect} from 'jsx/canvas_inbox/components/CourseSelect/CourseSelect'
import I18n from 'i18n!conversations_2'
import {IndividualMessageCheckbox} from 'jsx/canvas_inbox/components/IndividualMessageCheckbox/IndividualMessageCheckbox'
import {MessageBody} from 'jsx/canvas_inbox/components/MessageBody/MessageBody'
import PropTypes from 'prop-types'
import React, {useContext, useState} from 'react'
import {SubjectInput} from 'jsx/canvas_inbox/components/SubjectInput/SubjectInput'
import {uploadFiles} from 'jsx/shared/upload_file'

import {CloseButton} from '@instructure/ui-buttons'
import {Flex} from '@instructure/ui-flex'
import {Heading} from '@instructure/ui-heading'
import {Modal} from '@instructure/ui-modal'
import {PresentationContent} from '@instructure/ui-a11y-content'
import {Text} from '@instructure/ui-text'
import {View} from '@instructure/ui-view'

const ComposeModalContainer = props => {
  const {setOnFailure, setOnSuccess} = useContext(AlertManagerContext)

  const [attachments, setAttachments] = useState([])
  const [attachmentsToUpload, setAttachmentsToUpload] = useState([])
  const [subject, setSubject] = useState()
  const [body, setBody] = useState()
  const [bodyMessages, setBodyMessages] = useState([])

  const fileUploadUrl = attachmentFolderId => {
    return `/api/v1/folders/${attachmentFolderId}/files`
  }

  const addAttachment = async e => {
    const files = Array.from(e.currentTarget?.files)
    if (!files.length) {
      setOnFailure(I18n.t('Error adding files to conversation message'))
      return
    }

    const newAttachmentsToUpload = files.map((file, i) => {
      return {isLoading: true, id: file.url ? `${i}-${file.url}` : `${i}-${file.name}`}
    })

    setAttachmentsToUpload(prev => prev.concat(newAttachmentsToUpload))
    setOnSuccess(I18n.t('Uploading files'))

    try {
      const newFiles = await uploadFiles(
        files,
        fileUploadUrl(ENV.CONVERSATIONS.ATTACHMENTS_FOLDER_ID)
      )
      setAttachments(prev => prev.concat(newFiles))
    } catch (err) {
      setOnFailure(I18n.t('Error uploading files'))
    } finally {
      setAttachmentsToUpload(prev => {
        const attachmentsStillUploading = prev.filter(
          file => !newAttachmentsToUpload.includes(file)
        )
        return attachmentsStillUploading
      })
    }
  }

  const removeAttachment = id => {
    setAttachments(prev => {
      const index = prev.findIndex(attachment => attachment.id === id)
      prev.splice(index, 1)
      return [...prev]
    })
  }

  const replaceAttachment = async (id, e) => {
    removeAttachment(id)
    addAttachment(e)
  }

  const onSubjectChange = value => {
    setSubject(value.currentTarget.value)
  }

  const onBodyChange = value => {
    setBody(value)
    if (value) {
      setBodyMessages([])
    }
  }

  const validMessageFields = () => {
    // TODO: validate recipients
    if (!body) {
      setBodyMessages([{text: I18n.t('Message body is required'), type: 'error'}])
      return false
    }
    return true
  }

  const renderModalHeader = () => (
    <Modal.Header>
      <CloseButton
        placement="end"
        offset="small"
        onClick={props.onDismiss}
        screenReaderLabel={I18n.t('Close')}
      />
      <Heading>{I18n.t('Compose Message')}</Heading>
    </Modal.Header>
  )

  const renderModalBody = () => (
    <Modal.Body padding="none">
      <Flex direction="column" width="100%" height="100%">
        {renderHeaderInputs()}
        <View borderWidth="small none none none" padding="x-small">
          <MessageBody onBodyChange={onBodyChange} messages={bodyMessages} />
        </View>
        {[...attachments, ...attachmentsToUpload].length > 0 && (
          <View borderWidth="small none none none" padding="small">
            <AttachmentDisplay
              attachments={[...attachments, ...attachmentsToUpload]}
              onReplaceItem={replaceAttachment}
              onDeleteItem={removeAttachment}
            />
          </View>
        )}
      </Flex>
    </Modal.Body>
  )

  const renderHeaderInputs = () => (
    <Flex direction="column" width="100%" height="100%" padding="small">
      <Flex.Item>
        <ComposeInputWrapper
          title={
            <PresentationContent>
              <Text size="small">{I18n.t('Course')}</Text>
            </PresentationContent>
          }
          input={renderCourseSelect()}
          shouldGrow={false}
        />
      </Flex.Item>
      <SubjectInput onChange={onSubjectChange} value={subject} />
      <Flex.Item>
        <ComposeInputWrapper
          shouldGrow
          input={<IndividualMessageCheckbox onChange={() => {}} checked={false} />}
        />
      </Flex.Item>
    </Flex>
  )

  const renderCourseSelect = () => (
    <CourseSelect
      mainPage={false}
      options={{
        favoriteCourses: [],
        moreCourses: [],
        concludedCourses: [],
        groups: []
      }}
      onCourseFilterSelect={() => {}}
    />
  )

  const renderModalFooter = () => (
    <Modal.Footer>
      <ComposeActionButtons
        onAttachmentUpload={addAttachment}
        onMediaUpload={() => {}}
        onCancel={props.onDismiss}
        onSend={() => {
          if (!validMessageFields()) {
            return
          }
          console.log('submitting...')
        }}
        isSending={false}
      />
    </Modal.Footer>
  )

  return (
    <Modal
      open={props.open}
      onDismiss={props.onDismiss}
      size="medium"
      label={I18n.t('Compose Message')}
      shouldCloseOnDocumentClick={false}
    >
      {renderModalHeader()}
      {renderModalBody()}
      {renderModalFooter()}
    </Modal>
  )
}

export default ComposeModalContainer

ComposeModalContainer.propTypes = {
  open: PropTypes.bool,
  onDismiss: PropTypes.func
}
