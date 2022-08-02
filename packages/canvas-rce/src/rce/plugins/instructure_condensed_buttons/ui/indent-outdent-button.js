/*
 * Copyright (C) 2019 - present Instructure, Inc.
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

import formatMessage from '../../../../format-message'

export default function register(editor) {
  const baseIndentButton = {
    tooltip: formatMessage('Increase Indent'),
    icon: 'indent',
    onAction: () => editor.execCommand('indent')
  }

  const indentButtons = [
    {
      name: 'indent',
      text: formatMessage('Increase Indent'),
      cmd: 'indent'
    },
    {
      name: 'outdent',
      text: formatMessage('Decrease Indent'),
      cmd: 'outdent'
    }
  ]
  editor.ui.registry.addButton('inst_indent', baseIndentButton)

  editor.ui.registry.addSplitButton('inst_outdent', {
    ...baseIndentButton,
    fetch: callback => {
      const items = indentButtons.map(button => {
        return {
          type: 'choiceitem',
          value: button.cmd,
          icon: button.name,
          text: button.text
        }
      })
      callback(items)
    },
    onAction: () => {
      const activeIndent = indentButtons.find(b => editor.formatter.match(b.name))
      const cmd = activeIndent ? activeIndent.cmd : 'indent'
      editor.execCommand(cmd)
    },
    onItemAction: (splitButtonApi, value) => editor.execCommand(value),
    onSetup: () => {
      function showHideButtons(canOutdent) {
        editor
          .$(`.tox-tbtn[aria-label="${baseIndentButton.tooltip}"]`, document)
          [canOutdent ? 'hide' : 'show']()
        editor
          .$(`.tox-split-button[aria-label="${baseIndentButton.tooltip}"]`, document)
          [canOutdent ? 'show' : 'hide']()
      }
      function onNodeChange() {
        const canOutdent = editor.queryCommandState('outdent')
        showHideButtons(canOutdent)
      }
      setTimeout(onNodeChange) // hide one of the buttons on first render

      editor.on('NodeChange', onNodeChange)
      return () => editor.off('NodeChange', onNodeChange)
    }
  })
}
