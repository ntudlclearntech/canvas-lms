#
# Copyright (C) 2013 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.

import template from '../../jst/CopyCourse.handlebars'
import MigrationView from '@canvas/content-migrations/backbone/views/MigrationView.coffee'

export default class CopyCourseView extends MigrationView
  template: template

  # For templates jst/content_migrations/CopyCourse
  @optionProperty 'isAdmin'

  @child 'courseFindSelect', '.courseFindSelect'
  @child 'dateShift', '.dateShift'
  @child 'selectContent', '.selectContent'
  @child 'importQuizzesNext', '.importQuizzesNext'
  @child 'importBlueprintSettings', '.importBlueprintSettings'

  afterRender: ->
    if !@isAdmin
      @dateShift.$dateAdjustCheckbox.click()
      @dateShift.toggleContent()
      SelectSpecificContentCheckbox = @selectContent.$el.find("input[name=selective_import][value='true']")
      SelectSpecificContentCheckbox.click()

  initialize: ->
    super
    @courseFindSelect.on 'course_changed', (course) =>
      @dateShift.updateNewDates(course)
      @importBlueprintSettings.courseSelected(course)
