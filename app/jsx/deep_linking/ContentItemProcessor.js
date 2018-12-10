/*
 * Copyright (C) 2018 - present Instructure, Inc.
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

import $ from 'jquery'
import {send} from 'jsx/shared/rce/RceCommandShim'
import LinkContentItem from './models/LinkContentItem'

export function processContentItemsForEditor(event, editor) {
  const {content_items, msg, log, errormsg, errorlog} = event.data
  new ContentItemProcessor(
    content_items,
    {
      msg,
      errormsg
    },
    {
      log,
      errorlog
    }
  ).processContentItemsForEditor(editor)
}

export default class ContentItemProcessor {
  constructor(contentItems, messages, logs) {
    this.contentItems = contentItems
    this.messages = messages
    this.logs = logs
    this.showMessages()
    this.showLogs()
  }

  get loggingEnabled() {
    return ENV && ENV.DEEP_LINKING_LOGGING
  }

  get typeMap() {
    return {
      'link': LinkContentItem
    }
  }

  processContentItemsForEditor(editor) {
    this.contentItems.forEach(contentItem => {
      if (Object.keys(this.typeMap).includes(contentItem.type)) {
        const contentItemModel = new this.typeMap[contentItem.type](contentItem)
        send($(`#${editor.id}`), 'insert_code', contentItemModel.toHtmlString());
      }
    })
  }

  showMessages() {
    if (this.messages.errormsg) {
      $.flashError(this.messages.errormsg)
    }

    if (this.messages.msg) {
      $.flashMessage(this.messages.msg)
    }
  }

  showLogs() {
    if (this.loggingEnabled) {
      if (this.logs.errorlog) {
        console.error(this.logs.errorlog)
      }

      if (this.logs.log) {
        console.log(this.logs.log)
      }
    }
  }
}
