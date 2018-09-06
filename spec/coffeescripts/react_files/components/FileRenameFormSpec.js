/*
 * Copyright (C) 2014 - present Instructure, Inc.
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
import ReactDOM from 'react-dom'
import {Simulate} from 'react-addons-test-utils'
import $ from 'jquery'
import FileRenameForm from 'jsx/files/FileRenameForm'

QUnit.module('FileRenameForm', {
  setup() {
    const props = {
      fileOptions: {
        file: {
          id: 999,
          name: 'original_name.txt'
        },
        name: 'options_name.txt'
      }
    }
    this.form = ReactDOM.render(
      React.createFactory(FileRenameForm)(props),
      $('<div>').appendTo('#fixtures')[0]
    )
  },
  teardown() {
    ReactDOM.unmountComponentAtNode(this.form.getDOMNode().parentNode)
    $('#fixtures').empty()
  }
})

test('switches to editing file name state with button click', function() {
  Simulate.click(this.form.refs.renameBtn)
  ok(this.form.state.isEditing)
  ok(this.form.refs.newName)
})

test('isEditing displays options name by default', function() {
  Simulate.click(this.form.refs.renameBtn)
  ok(this.form.state.isEditing)
  equal(this.form.refs.newName.value, 'options_name.txt')
})

test('isEditing displays file name when no options name exists', function() {
  this.form.setProps({fileOptions: {file: {name: 'file_name.md'}}})
  Simulate.click(this.form.refs.renameBtn)
  ok(this.form.state.isEditing)
  equal(this.form.refs.newName.value, 'file_name.md')
})

test('can go back from isEditing to initial view with button click', function() {
  Simulate.click(this.form.refs.renameBtn)
  ok(this.form.state.isEditing)
  ok(this.form.refs.newName)
  Simulate.click(this.form.refs.backBtn)
  ok(!this.form.state.isEditing)
  ok(this.form.refs.replaceBtn)
})

test('calls passed in props method to resolve conflict', function() {
  expect(2)
  this.form.setProps({
    fileOptions: {file: {name: 'file_name.md'}},
    onNameConflictResolved(options) {
      ok(options.name)
    }
  })
  Simulate.click(this.form.refs.renameBtn)
  ok(this.form.state.isEditing)
  Simulate.click(this.form.refs.commitChangeBtn)
})

test('onNameConflictResolved preserves expandZip option when renaming', function() {
  expect(2)
  this.form.setProps({
    fileOptions: {
      file: {name: 'file_name.md'},
      expandZip: 'true'
    },
    onNameConflictResolved(options) {
      equal(options.expandZip, 'true')
    }
  })
  Simulate.click(this.form.refs.renameBtn)
  ok(this.form.state.isEditing)
  Simulate.click(this.form.refs.commitChangeBtn)
})

test('onNameConflictResolved preserves expandZip option when replacing', function() {
  expect(1)
  this.form.setProps({
    fileOptions: {
      file: {name: 'file_name.md'},
      expandZip: 'true'
    },
    onNameConflictResolved(options) {
      equal(options.expandZip, 'true')
    }
  })
  Simulate.click(this.form.refs.replaceBtn)
})
