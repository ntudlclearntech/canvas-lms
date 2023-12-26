/*
 * Copyright (C) 2017 - present Instructure, Inc.
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
import {useScope as useI18nScope} from '@canvas/i18n'
import TutorialTrayContent from './TutorialTrayContent'

const I18n = useI18nScope('new_user_tutorial')

const FilesTray = () => (
  <TutorialTrayContent
    heading={I18n.t('Files')}
    subheading={I18n.t('Upload Images, and Documents for students to download')}
    image="/images/tutorial-tray-images/Panda_Files.svg"
    links={[
      {
        label: I18n.t('Tutorial Video: Files'),
        href: I18n.t(
          'tutorial_video_files_url',
          'https://www.youtube.com/watch?v=o7R6n_Yt17A&list=PLKjqFgaBNOo8fv5ZWEIUSlSqzXDVC2SV_&index=9'
        )
      }
    ]}
  >
    {I18n.t(`Instructors can upload handouts, supplementary materials, and images to
          the Files. It is highly recommended that instructors use the folders to
          distinguish between different file types or weekly schedule. Students can
          easily find and download the files they need in different folders.`)}
  </TutorialTrayContent>
)

export default FilesTray
