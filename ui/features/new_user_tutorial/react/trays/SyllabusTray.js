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

const SyllabusTray = () => (
  <TutorialTrayContent
    heading={I18n.t('Syllabus')}
    subheading={I18n.t('Announce course basic information, schedules, and the grading policy')}
    image="/images/tutorial-tray-images/Panda_Syllabus.svg"
    links={[
      {
        label: I18n.t('How to create a course syllabus'),
        href: I18n.t(
          'how_to_create_a_course_syllabus_url',
          'https://drive.google.com/file/d/16Tk4rAcgB47OxjErLIIxtKdJ9FnB_Jxg/view?usp=sharing'
        )
      },
      {
        label: I18n.t('Tutorial Video: Syllabus'),
        href: I18n.t(
          'tutorial_video_syllabus_url',
          'https://www.youtube.com/watch?v=jWpTqlDMZqY&list=PLKjqFgaBNOo8fv5ZWEIUSlSqzXDVC2SV_&index=8'
        )
      }
    ]}
  >
    {I18n.t(`You can use the editor to build or paste a table about the information such as
          course objectives, schedules, and the grading policy. Also, the system will
          automatically generate a list of all graded assignments on this page.
          The list can't be edited.`)}
  </TutorialTrayContent>
)

export default SyllabusTray
