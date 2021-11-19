/*
 * Copyright (C) 2021 - present Instructure, Inc.
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
import formatMessage from '../../../format-message'

export default function (ed, document, _trayProps) {
  return import('./EquationEditorModal').then(module => {
    const EquationEditorModal = module.default
    let container = document.querySelector('.canvas-rce-equation-container')
    if (!container) {
      container = document.createElement('div')
      container.className = 'canvas-rce-equation-container'
      document.body.appendChild(container)
    }

    const handleDismiss = () => {
      ReactDOM.unmountComponentAtNode(container)
      ed.focus(false)
    }

    ReactDOM.render(
      <EquationEditorModal
        editor={ed}
        label={formatMessage('Equation Editor')}
        onModalDismiss={handleDismiss}
        onModalClose={handleDismiss}
      />,
      container
    )
  })
}

export function oldClickCallback(ed, document) {
  const ev = document.createEvent('CustomEvent')
  ev.initCustomEvent('tinyRCE/initEquation', true, true, {ed})
  document.dispatchEvent(ev)
}
