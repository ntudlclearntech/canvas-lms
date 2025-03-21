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

import {useScope as useI18nScope} from '@canvas/i18n'
import $ from 'jquery'
import _ from 'underscore'
import {View} from '@canvas/backbone'
import SearchableSubmenuView from './SearchableSubmenuView'
import template from '../../jst/courseOptions.handlebars'
import '@canvas/datetime'
import 'bootstrap-dropdown'
import 'bootstrap-select'

const I18n = useI18nScope('conversations')

export default class CourseSelectionView extends View {
  static initClass() {
    this.prototype.events = {change: 'onChange'}

    this.prototype._value = ''
  }

  initialize() {
    super.initialize(...arguments)
    if (!this.options.defaultOption)
      this.options.defaultOption = I18n.t('all_courses', 'All Courses')
    this.$el.addClass('show-tick')
    this.$el
      .selectpicker({useSubmenus: true})
      .next()
      .on('mouseover', () => this.loadAll())
      .find('.dropdown-toggle')
      .on('focus', () => this.loadAll())
    const dropdown = this.$el.data('selectpicker')?.$newElement
    if (dropdown) {
      dropdown.on('focusout', () => {
        setTimeout(() => {
          // fully close dropdown once focus has left the dropdown tree
          if (
            !dropdown[0].contains(document.activeElement) &&
            // selenium tests fail when executing JS scripts as the web
            // driver moves focus to the body. so let's just exclude it
            // from the things we care to check :P
            document.activeElement !== document.body
          ) {
            dropdown.removeClass('open')
          }
        }, 0)
      })
    }
    this.options.courses.favorites.on('reset', () => this.render())
    this.options.courses.all.on('reset', () => this.render())
    this.listenTo(this.options.courses.all, 'add', _.debounce(_.bind(this.render), 200))
    this.options.courses.groups.on('reset', () => this.render())
    this.listenTo(this.options.courses.groups, 'add', _.debounce(_.bind(this.render), 200))
    this.$picker = this.$el.next()
    return this.render()
  }

  render() {
    super.render()
    const more = []
    const concluded = []
    const now = $.fudgeDateForProfileTimezone(new Date())
    this.options.courses.all.each(course => {
      if (this.options.courses.favorites.get(course.id)) return
      if (course.get('access_restricted_by_date')) return

      const is_complete = this.is_complete(course, now)

      const collection = is_complete ? concluded : more
      return collection.push(course.toJSON())
    })

    let group_json = this.options.courses.groups.toJSON()

    if (this.options.messageableOnly) {
      group_json = _.filter(group_json, g => g.can_message)
    }
    const data = {
      defaultOption: this.options.defaultOption,
      favorites: this.options.courses.favorites.toJSON(),
      more,
      groups: group_json,
    }

    if (!this.options.excludeConcluded) {
      data.concluded = concluded
    }

    this.truncate_course_name_data(data)
    this.$el.html(template(data))
    this.$el.selectpicker('refresh')
    this.$picker.find('.paginatedLoadingIndicator').remove()
    this.getAriaLabel()
    this.createSearchViews()
    if (!this.renderValue()) return this.loadAll()
  }

  is_complete(course, asOf) {
    if (course.get('workflow_state') === 'completed') return true
    if (course.get('end_at') && course.get('restrict_enrollments_to_course_dates'))
      return new Date(course.get('end_at')) < asOf
    if (course.get('term') && course.get('term').end_at)
      return new Date(course.get('term').end_at) < asOf
    return false
  }

  createSearchViews() {
    const searchViews = []
    this.$picker.find('.dropdown-submenu').each(function () {
      searchViews.push(new SearchableSubmenuView({el: this}))
    })
    return (this.searchViews = searchViews)
  }

  loadAll() {
    const {all, groups} = this.options.courses
    if (all._loading) return
    all.fetch()
    all._loading = true

    groups.fetchAll()
    return this.$picker
      .find('> .dropdown-menu')
      .append($('<div />').attr('class', 'paginatedLoadingIndicator').css('clear', 'both'))
  }

  setValue(value) {
    this._value = value || ''
    this.renderValue()
    return this.triggerEvent()
  }

  renderValue() {
    this.silenced = true
    this.$el.selectpicker('val', this._value)
    this.silenced = false
    return this.$el.val() === this._value
  }

  onChange() {
    if (this.silenced) return
    this._value = this.$el.val()
    this.triggerEvent()
    this.getAriaLabel()
    return this.searchViews.forEach(view => view.clearSearch())
  }

  getAriaLabel() {
    if (ENV.CONVERSATIONS.CAN_MESSAGE_ACCOUNT_CONTEXT) return
    const label =
      this.getCurrentContext().name ||
      I18n.t('Select course: a selection is required before recipients field will become available')
    return this.$picker.find('button').attr('aria-label', label)
  }

  getCurrentContext() {
    const matches = this._value.match(/(\w+)_(\d+)/)
    if (!matches) return {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_match, type, id] = Array.from(matches)
    const context =
      type === 'course'
        ? this.options.courses.favorites.get(id) || this.options.courses.all.get(id)
        : this.options.courses.groups.get(id)
    if (context) {
      return {name: context.get('course_code'), id: this._value}
    } else {
      return {}
    }
  }

  triggerEvent() {
    return this.trigger('course', this.getCurrentContext())
  }

  focus() {
    return this.$el.next().find('.dropdown-toggle').focus()
  }

  truncate_course_name_data(course_data) {
    return _.each(['favorites', 'more', 'concluded', 'groups'], key =>
      this.truncate_course_names(course_data[key])
    )
  }

  truncate_course_names(courses) {
    return _.each(courses, c => this.truncate_course(c))
  }

  truncate_course(course) {
    /*
      course.course_code for: /api/v1/courses/?state[]=unpublished&state[]=available&state[]=completed&include[]=term&per_page=50
      course.name for: /api/v1/users/self/groups?per_page=20&include=can_message

      Check #228 for more details
    */
    const name = course.course_code ? course.course_code : course.name
    const truncated = this.middle_truncate(name)
    if (name !== truncated) {
      return (course.truncated_name = truncated)
    }
  }

  middle_truncate(name) {
    if (name.length > 25) {
      return `${name.slice(0, 10)}…${name.slice(-10)}`
    } else {
      return name
    }
  }
}
CourseSelectionView.initClass()
