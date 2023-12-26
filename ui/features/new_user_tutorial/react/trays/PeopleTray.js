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

const PeopleTray = () => (
  <TutorialTrayContent
    heading={I18n.t('People')}
    subheading={I18n.t('Add Auditors, TAs, and Teachers to your course')}
    image="/images/tutorial-tray-images/Panda_People.svg"
    links={[
      {
        label: I18n.t('How to send emails to students'),
        href: I18n.t(
          'how_to_send_emails_to_students_url',
          'https://drive.google.com/file/d/1Nur4yoFQbcGEm0nQwHRSZBeiboHkyQcU/view?usp=sharing'
        )
      },
      {
        label: I18n.t('Tutorial Video: Send emails'),
        href: I18n.t(
          'tutorial_video_send_emails_url',
          'https://www.youtube.com/watch?v=kN2roz8R_Do&list=PLKjqFgaBNOo8fv5ZWEIUSlSqzXDVC2SV_&index=19'
        )
      },
      {
        label: I18n.t('Tutorial Video: Add members'),
        href: I18n.t(
          'tutorial_video_add_members',
          'https://www.youtube.com/watch?v=nZDvz-rAiCo&list=PLKjqFgaBNOo8fv5ZWEIUSlSqzXDVC2SV_&index=4'
        )
      },
      {
        label: I18n.t('Tutorial Video: Create groups'),
        href: I18n.t(
          'tutorial_video_create_groups_url',
          'https://www.youtube.com/watch?v=8uObPRzoTTc&list=PLKjqFgaBNOo8fv5ZWEIUSlSqzXDVC2SV_&index=5'
        )
      }
    ]}
  >
    {I18n.t(`NTU COOL will automatically synchronize the student list with the NTU
          Course Selection System. Therefore, enrolled students including NTU
          and NTU System (NTUST and NTNU) students will be added to NTU COOL
          automatically. You can add members such as auditors or manage student
          groups on this page.`)}
  </TutorialTrayContent>
)

export default PeopleTray
