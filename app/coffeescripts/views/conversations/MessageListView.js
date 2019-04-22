//
// Copyright (C) 2013 - present Instructure, Inc.
//
// This file is part of Canvas.
//
// Canvas is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero General Public License as published by the Free
// Software Foundation, version 3 of the License.
//
// Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
// WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
// A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
// details.
//
// You should have received a copy of the GNU Affero General Public License along
// with this program. If not, see <http://www.gnu.org/licenses/>.

import I18n from 'i18nObj'
import PaginatedCollectionView from '../PaginatedCollectionView'
import MessageView from './MessageView'
import template from 'jst/conversations/messageList'

export default class MessageListView extends PaginatedCollectionView {
  static initClass() {
    this.prototype.tagName = 'div'

    this.prototype.itemView = MessageView

    this.prototype.template = template

    this.prototype.course = {}

    this.prototype.selectedMessages = []

    this.prototype.autoFetch = true

    this.prototype.events = {click: 'onClick'}
  }

  constructor() {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/(?:\(0,\s*_assertThisInitialized\d*.default\)|_assertThisInitialized)\((\w+)\)/)[1];
      eval(`${thisName} = this;`);
    }
    this.trackSelectedMessages = this.trackSelectedMessages.bind(this)
    this.updateMessage = this.updateMessage.bind(this)
    super(...arguments)
    this.attachEvents()
  }

  attachEvents() {
    return this.collection.on('change:selected', this.trackSelectedMessages)
  }

  trackSelectedMessages(model) {
    if (model.get('selected')) {
      return this.selectedMessages.push(model)
    } else {
      return this.selectedMessages.splice(this.selectedMessages.indexOf(model), 1)
    }
  }

  onClick(e) {
    if (e.target !== this.el) return
    return this.collection.each(m => m.set('selected', false))
  }

  updateCourse(course) {
    return (this.course = course)
  }

  selectedMessage() {
    return this.selectedMessages[0]
  }

  updateMessage(message, thread) {
    const selectedThread = this.collection.where({selected: true})[0]
    const updatedThread = this.collection.get(thread.id)
    updatedThread.set({
      last_message: thread.last_message,
      last_authored_message_at: new Date().toString(),
      message_count: I18n.n(updatedThread.get('messages').length)
    })
    this.collection.sort()
    this.render()
    return selectedThread != null ? selectedThread.view.select() : undefined
  }

  afterRender() {
    super.afterRender(...arguments)
    this.$('.current-context').text(this.course.name)
    return this.$('.list-header')[this.course.name ? 'show' : 'hide']()
  }

  selectAll() {
    return this.collection.each(x => x.set('selected', true))
  }
}
MessageListView.initClass()
