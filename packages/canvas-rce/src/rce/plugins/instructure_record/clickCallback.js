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

import React from 'react'
import ReactDOM from 'react-dom'
import Bridge from '../../../bridge'
import {StoreProvider} from '../shared/StoreContext'
import uploadMediaTranslations from './mediaTranslations'

export default function(ed, document) {
  return import('@instructure/canvas-media').then(CanvasMedia => {
    const UploadMedia = CanvasMedia.default
    // return import('./UploadMedia').then(({UploadMedia}) => {
    let container = document.querySelector('.canvas-rce-media-upload')
    if (!container) {
      container = document.createElement('div')
      container.className = 'canvas-rce-media-upload'
      document.body.appendChild(container)
    }

    const handleDismiss = () => {
      ReactDOM.unmountComponentAtNode(container)
      ed.focus(false)
    }

    // redux's activateMediaUpload action does the image placeholder,
    // but it also does the upload. We need to separate them if we
    // want to stay within the redux approach
    const handleStartUpload = fileProps => {
      Bridge.focusEditor(ed.rceWrapper)
      Bridge.insertImagePlaceholder(fileProps)
      handleDismiss()
    }

    const handleUpload = (error, uploadData, onUploadComplete) => {
      onUploadComplete(error, uploadData)
    }

    const trayProps = Bridge.trayProps.get(ed)

    ReactDOM.render(
      <StoreProvider {...trayProps}>
        {contentProps => (
          <UploadMedia
            contextType={ed.settings.canvas_rce_user_context.type}
            contextId={ed.settings.canvas_rce_user_context.id}
            languages={Bridge.languages}
            open
            liveRegion={() => document.getElementById('flash_screenreader_holder')}
            onStartUpload={fileProps => handleStartUpload(fileProps)}
            onUploadComplete={(err, data) =>
              handleUpload(err, data, contentProps.mediaUploadComplete)
            }
            onEmbed={embedCode => Bridge.insertEmbedCode(embedCode)}
            onDismiss={handleDismiss}
            tabs={{embed: true, record: true, upload: true}}
            uploadMediaTranslations={uploadMediaTranslations}
          />
        )}
      </StoreProvider>,
      container
    )
  })
}
