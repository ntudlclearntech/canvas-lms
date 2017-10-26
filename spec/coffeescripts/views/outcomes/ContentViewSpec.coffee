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
  'jquery'
  'Backbone'
  'compiled/views/outcomes/ContentView'
  'helpers/fakeENV'
  'jst/outcomes/mainInstructions'
  'helpers/assertions'
], ($, Backbone, ContentView, fakeENV, instructionsTemplate, assertions) ->

  QUnit.module 'CollectionView',
    setup: ->
      fakeENV.setup()
      viewEl = $('<div id="content-view-el">original_text</div>')
      viewEl.appendTo fixtures
      @contentView = new ContentView
        el: viewEl
        instructionsTemplate: instructionsTemplate
        renderengInstructions: false
      @contentView.$el.appendTo $('#fixtures')
      @contentView.render()
    teardown: ->
      fakeENV.teardown()
      @contentView.remove()

  test 'should be accessible', (assert) ->
    done = assert.async()
    assertions.isAccessible @contentView, done, {'a11yReport': true}

  test 'collectionView replaces text with warning and link on renderNoOutcomeWarning event', ->
    ok @contentView.$el?.text().match(/original_text/)
    $.publish "renderNoOutcomeWarning"
    ok @contentView.$el?.text().match(/You have no outcomes/)
    ok not @contentView.$el?.text().match(/original_text/)
    ok @contentView.$el?.find('a')?.attr('href')?.search(@contentView._contextPath() + '/outcomes') > 0
