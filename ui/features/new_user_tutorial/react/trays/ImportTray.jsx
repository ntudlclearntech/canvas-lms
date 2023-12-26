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

const ImportTray = () => (
  <TutorialTrayContent
    heading={I18n.t('ntu_cool_custom.import_content_title', 'Import contents')}
    subheading={I18n.t(
      'ntu_cool_custom.import_content_subtitle',
      'Bring existing content into your course'
    )}
    image="/images/tutorial-tray-images/Panda_Map.svg"
    links={[
      {
        label: I18n.t(
          'ntu_cool_custom.how_to_use_import_content',
          'How to import existing course contents and videos?'
        ),
        href: I18n.t(
          'ntu_cool_custom.how_to_use_import_content_url',
          'https://drive.google.com/file/d/1rHHRf6Qle1u4M5HCvUuzmMSBKhUJe2wj/view?usp=sharing'
        )
      }
    ]}
  >
    {I18n.t(
      'ntu_cool_custom.tutorial_import_content',
      `You can use this function to import the content of the previous course into this course,
     including: files,assignments, quizzes, etc. If you need to import videos, please import the video links through this function first,
     and then go to the Video Manager to import existing course videos. Symphony does not currently support the import function.`
    )}
  </TutorialTrayContent>
)

export default ImportTray
