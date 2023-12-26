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

const AnnouncementsTray = () => (
  <TutorialTrayContent
    heading={I18n.t('Announcements')}
    subheading={I18n.t('Share important updates with users')}
    image="/images/tutorial-tray-images/Panda_Announcements.svg"
    links={[
      {
        label: I18n.t('How to post an announcement'),
        href: I18n.t(
          'how_to_post_an_announcement_url',
          'https://drive.google.com/file/d/147ARqRvY3xEzLAT490kiF2dCqsNFOh_y/view?usp=sharing'
        )
      },
      {
        label: I18n.t('Tutorial Video: Announcements'),
        href: I18n.t(
          'tutorial_video_announcements_url',
          'https://www.youtube.com/watch?v=tupfmCiH558&list=PLKjqFgaBNOo8fv5ZWEIUSlSqzXDVC2SV_&index=6'
        )
      }
    ]}
  >
    {I18n.t(`Share important information with all users in your course.
          When the announcement was posted, NTU COOL will automatically send a notification to users' emails.`)}
  </TutorialTrayContent>
)

export default AnnouncementsTray
