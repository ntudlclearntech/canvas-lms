/*
 * Copyright (C) 2022 - present Instructure, Inc.
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

import bridge from '../../../bridge'
import configureStore from '../../../sidebar/store/configureStore'
import {get as getSession} from '../../../sidebar/actions/session'
import {uploadToMediaFolder} from '../../../sidebar/actions/upload'
import doFileUpload from '../shared/Upload/doFileUpload'
import formatMessage from '../../../format-message'
import {isImage, isAudioOrVideo} from '../shared/fileTypeUtils'
import {showFlashAlert} from '../../../common/FlashAlert'

// assume that if there are multiple RCEs on the page,
// they all talk to the same canvas
const config = {
  store: null,
  session: null, // null: we haven't gotten it yet, false: we don't need it
}

// when UploadFile renders
// <StoreProvider {...trayProps}>
//  {contentProps => {
//     return (
//       <UploadFileModal
// The StoreProvider function calls configureStore which creates a new store
// (We don't seem to have a way to grab an existing store)
// So the configureStore and getSession logic gets repeated here for the
// automatic file upload when pasting or dropping a file on the RCE
function initStore(initProps) {
  if (config.store === null) {
    config.store = configureStore(initProps)
  }
  if (config.session === null) {
    if (initProps.host && initProps.jwt) {
      getSession(config.store.dispatch, config.store.getState)
        .then(() => {
          config.session = config.store.getState().session
        })
        .catch(_err => {
          showFlashAlert({
            message: formatMessage(
              'Having trouble initializing copy/paste, but it can still limp along'
            ),
            type: 'error',
          })
        })
    } else {
      config.session = false
    }
  }
  return config.store
}

// if the context requires usage rights to publish a file
// open the UI for that instead of automatically uploading
function getUsageRights(ed, document, theFile) {
  return doFileUpload(ed, document, {
    accept: theFile.type,
    panels: ['COMPUTER'],
    preselectedFile: theFile,
  })
}

tinymce.create('tinymce.plugins.InstructurePastePlugin', {
  init(ed) {
    const store = initStore(bridge.trayProps.get(ed))

    function handlePasteOrDrop(event) {
      event.preventDefault()
      const cbdata = event.clipboardData || event.dataTransfer // paste || drop
      const files = cbdata.files
      const types = cbdata.types

      if (types.includes('Files')) {
        if (files.length > 1) {
          handleMultiFilePaste(files)
          return
        }
        // we're pasting a file
        const file = files[0]
        if (bridge.activeEditor().props.instRecordDisabled && isAudioOrVideo(file.type)) {
          return
        }
        if (/(?:course|group)/.test(bridge.trayProps.get(ed).contextType)) {
          if (config.session === null) {
            showFlashAlert({
              message: formatMessage(
                'If Usage Rights are required the file will not be published until set on the Files page.'
              ),
              type: 'info',
            })
          } else if (config.session && config.session.usageRightsRequired) {
            return getUsageRights(ed, document, file)
          } else {
            const fileMetaProps = {
              altText: file.name,
              contentType: file.type,
              displayAs: 'embed',
              isDecorativeImage: false,
              name: file.name,
              parentFolderId: 'media',
              size: file.size,
              domObject: file,
            }
            let tabContext = 'documents'
            if (isImage(file.type)) {
              tabContext = 'images'
            } else if (isAudioOrVideo(file.type)) {
              tabContext = 'media'
            }
            store.dispatch(uploadToMediaFolder(tabContext, fileMetaProps))
          }
        }
      } else if (types.includes('text/html')) {
        const text = cbdata.getData('text/html')
        ed.execCommand('mceInsertContent', false, text)
      } else if (types.includes('text/plain')) {
        const text = cbdata.getData('text/plain')
        ed.execCommand('mceInsertContent', false, text)
      } else {
        showFlashAlert({
          message: formatMessage("Sorry, we don't know how to paste that"),
          type: 'info',
        })
      }
    }
    ed.on('paste', handlePasteOrDrop)
    ed.on('drop', handlePasteOrDrop)
  },
})

function handleMultiFilePaste(_files) {
  showFlashAlert({
    message: formatMessage("Sorry, we don't support multiple files."),
    type: 'info',
  })
}

tinymce.PluginManager.add('instructure_paste', tinymce.plugins.InstructurePastePlugin)
