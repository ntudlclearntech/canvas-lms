/*
 * Copyright (C) 2015 - present Instructure, Inc.
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

// Provides a global-ish registry for tracking multiple
// tinymce intstances on a page.  Basically a central lookup point.
//
// As the method names indicate with the "_" prefixes, you probably
// shouldn't be using this class directly, it's mostly a helper
// for the management being done in "tinymce.editor_box.js".  If
// you're trying to take action based on what happens in here, consider
// subscribing to the events published through jquery.ba-tinypubsub:
//
//   'editorBox/add' (editor_id, box)-> triggered when a new editor
//       box is registered.
//   'editorBox/remove' (editor_id)-> triggered when an editor is removed
//       from the registry
//   'editorBox/removeAll' ()-> fires if all editors have been removed
//
define([
  'jquery',
  'compiled/editor/stocktiny',
  'vendor/jquery.ba-tinypubsub'
], function($, tinymce){

  var EditorBoxList = function(){
    this._textareas = {};
    this._editors = {};
    this._editor_boxes = {};
  };


  $.extend(EditorBoxList.prototype, {

    _addEditorBox: function(id, box) {
      $.publish('editorBox/add', id, box);
      this._editor_boxes[id] = box;
      this._editors[id] = tinymce.get(id);
      this._textareas[id] = $("textarea#" + id);
    },

    _removeEditorBox: function(id) {
      delete this._editor_boxes[id];
      delete this._editors[id];
      delete this._textareas[id];
      $.publish('editorBox/remove', id);
      if ($.isEmptyObject(this._editors)) $.publish('editorBox/removeAll');
    },

    _getTextArea: function(id) {
      if(!this._textareas[id]) {
        this._textareas[id] = $("textarea#" + id);
      }
      return this._textareas[id];
    },

    _getEditor: function(id) {
      if(!this._editors[id]) {
        this._editors[id] = tinymce.get(id);
      }
      return this._editors[id];
    },

    _getEditorBox: function(id) {
      return this._editor_boxes[id];
    }
  });


  return EditorBoxList;
});
