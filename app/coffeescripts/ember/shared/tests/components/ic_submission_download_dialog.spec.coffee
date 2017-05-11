#
# Copyright (C) 2014 - present Instructure, Inc.
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

define [
  'ember'
  'underscore'
  '../../components/ic_submission_download_dialog_component'
  '../shared_ajax_fixtures'
], (Ember, _, DownloadDialog, fixtures) ->

  {run} = Ember

  buildComponent = (props) ->
    props = _.extend props,
      'assignmentUrl': '/courses/1/assignments/1'
    DownloadDialog.create(props)

  QUnit.module 'ic_submission_download_dialog',
    setup: ->
      fixtures.create()

  test 'is "finished" if file ready', ->
    component = buildComponent
      'attachment': {workflow_state: 'available'}
    equal component.get('status'), 'finished'

  test 'is "zipping" if percent complete is > 95', ->
    component = buildComponent
      'percentComplete': 95
    equal component.get('status'), 'zipping'

  test 'is "starting" otherwise', ->
    component = buildComponent()
    equal component.get('status'), 'starting'

  QUnit.module 'progress:'

  test 'percentComplete is 100 if file ready', ->
    # initialize percentComplete at 100
    # so the observer that updates the progressbar doesn't fire
    # otherwise the test fails because there is no DOM
    component = buildComponent
      'attachment': {workflow_state: 'available'}
      'percentComplete': 100
    component.progress()
    equal component.get('percentComplete'), 100

  test 'percentComplete is 0 if file_state is a string', ->
    component = buildComponent
      'attachment': {file_state: 'ready_to_download'}
    component.progress()
    equal component.get('percentComplete'), 0

  QUnit.module 'keepChecking'

  test 'is true if open', ->
    component = buildComponent
      'isOpened': true
    equal component.get('keepChecking'), true

  test 'is undefined if closed', ->
    component = buildComponent()
    equal component.get('keepChecking'), undefined

  test 'is undefined if percentComplete is 100', ->
    component = buildComponent
      'percentComplete': 100
    equal component.get('keepChecking'), undefined
