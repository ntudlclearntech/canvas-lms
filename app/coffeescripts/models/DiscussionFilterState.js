//
// Copyright (C) 2012 - present Instructure, Inc.
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

import {Model} from 'Backbone'

export default class DiscussionFilterState extends Model {
  hasFilter() {
    const {unread, query} = this.attributes
    if (unread || query != null) {
      return true
    } else {
      return false
    }
  }

  reset() {
    this.set({
      unread: false,
      query: null,
      collapsed: false
    })
    return this.trigger('reset')
  }
}
DiscussionFilterState.prototype.defaults = {
  unread: false,
  query: null,
  collapsed: false
}
