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

import {Flex} from '@instructure/ui-flex'
import React from 'react'
import MessageListContainer from './MessageListContainer'
import MessageListActionContainer from './MessageListActionContainer'

const CanvasInbox = () => {
  return (
    <div className="canvas-inbox-container">
      <Flex height="100vh" width="100%" as="div" direction="column">
        <Flex.Item>
          <MessageListActionContainer />
        </Flex.Item>
        <Flex.Item shouldGrow shouldShrink>
          <Flex height="100%" as="div" align="center" justifyItems="center">
            <Flex.Item width="400px" height="100%">
              <MessageListContainer />
            </Flex.Item>
            <Flex.Item shouldGrow shouldShrink height="100%">
              {/* Message Content Goes Here */}
            </Flex.Item>
          </Flex>
        </Flex.Item>
      </Flex>
    </div>
  )
}

export default CanvasInbox
