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

import React from 'react'
import {MessageActionButtons} from './MessageActionButtons'

export default {
  title: 'Playground/Message Action Buttons',
  component: MessageActionButtons,
  argTypes: {
    compose: {action: 'compose'},
    reply: {action: 'reply'},
    replyAll: {action: 'replyAll'},
    archive: {action: 'archive'},
    delete: {action: 'delete'},
    markAsUnread: {action: 'markAsUnread'},
    forward: {action: 'forward'},
    star: {action: 'star'}
  }
}

const Template = args => <MessageActionButtons {...args} />

export const MessageSelected = Template.bind({})

export const SubmissionComment = Template.bind({})
SubmissionComment.args = {
  isSubmissionComment: true
}
