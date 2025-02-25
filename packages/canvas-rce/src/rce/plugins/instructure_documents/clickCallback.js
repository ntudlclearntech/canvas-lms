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

import doFileUpload from '../shared/Upload/doFileUpload'

export default function (ed, document) {
  return doFileUpload(ed, document, {
    // https://gitlab.dlc.ntu.edu.tw/ntu-cool/canvas-lms/-/issues/479
    accept: [
      'text/*',
      'application/*',
      '.kml',
      '.kmz',
      '.shp',
      '.geojson',
      '.stl',
      '.obj',
      '.gltf',
      '.glb',
      '.yaml',
      '.yml',
      '.toml',
      '.xml',
      '.json',
      '.sh',
      '.py',
      '.java',
      '.sqlite',
      '.db',
      '.mdb',
      '.hdf',
      '.h5',
      '.mat',
      '.fig',
      '.nb',
      '.exe',
      '.apk',
      '.dmg',
      '.ttf',
      '.otf',
      '.woff',
      '.woff2',
      '.zip',
      '.gz',
      '.bz2',
      '.7z',
      '.rar',
      '.tar',
      '.xz',
      '.gtar',
      '.lzma',
      '.zst',
      '.jar',
      '.js',
      '.php',
      '.bin',
      '.dll',
      '.pdf',
      '.doc',
      '.docx',
      '.docm',
      '.xls',
      '.xlsx',
      '.xlsb',
      '.xlsm',
      '.ppt',
      '.pptx',
      '.ppsm',
      '.ppsx',
      '.pptm',
      '.txt',
      '.html',
      '.htm',
      '.css',
      '.csv',
      '.md',
      '.markdown',
      '.rtf',
      '.epub',
      '.ics',
      '.vsd',
    ],
    panels: ['COMPUTER'],
  }).shownPromise
}
