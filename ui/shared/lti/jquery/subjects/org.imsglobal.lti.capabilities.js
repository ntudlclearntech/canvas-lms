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

import {SUBJECT_ALLOW_LIST} from '../messages'

export default ({responseMessages}) => {
  const useFrame = ENV?.FEATURES?.lti_platform_storage
  const imsSubjects = ['org.imsglobal.lti.get_data', 'org.imsglobal.lti.put_data']
  const supported_messages = SUBJECT_ALLOW_LIST.map(subject => {
    if (imsSubjects.includes(subject) && useFrame) {
      return {
        subject,
        frame: 'post_message_forwarding',
      }
    }

    return {subject}
  })
  responseMessages.sendResponse({supported_messages})
  return true
}
