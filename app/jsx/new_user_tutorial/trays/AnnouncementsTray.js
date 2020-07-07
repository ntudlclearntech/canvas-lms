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
import I18n from 'i18n!new_user_tutorial'
import TutorialTrayContent from './TutorialTrayContent'
import UserGuideContent from './UserGuideContent'

const AnnouncementsTray = () => (
  <TutorialTrayContent
    heading={I18n.t('Announcements')}
    subheading={I18n.t('Keep students informed')}
    image="/images/tutorial-tray-images/Panda_Announcements.svg"
    seeAllLink={{
      label: I18n.t('See more in Canvas Guides'),
      href: `https://community.canvaslms.com/docs/DOC-10460-canvas-instructor
      -guide-table-of-contents#jive_content_id_Announcements`
    }}
    links={[
      {
        label: I18n.t('What are announcements?'),
        href: 'https://community.canvaslms.com/docs/DOC-10736-67952724136'
      },
      {
        label: I18n.t('How do I add an announcement in a course?'),
        href: 'https://community.canvaslms.com/docs/DOC-10405-415250731'
      },
      {
        label: I18n.t('How do I edit an announcement in a course?'),
        href: 'https://community.canvaslms.com/docs/DOC-10407-415250732'
      },
      {
        label: I18n.t('How do I use the Announcements Index Page?'),
        href: 'https://community.canvaslms.com/docs/DOC-10214-415276768'
      }
    ]}
  >
    <Text as="p">
      {I18n.t(`Share important information with all users in your course.
          When the announcement was posted, NTU COOL will automatically send a notification to users' emails.`)}
    </Text>
    <UserGuideContent
      items={[
        {
          title: I18n.t('How to post an announcement'),
          url: I18n.t(
            'how_to_post_an_announcement_url',
            'https://drive.google.com/file/d/147ARqRvY3xEzLAT490kiF2dCqsNFOh_y/view?usp=sharing'
          )
        },
        {
          title: I18n.t('Tutorial Video: Announcements'),
          url: I18n.t(
            'tutorial_video_announcements_url',
            'https://www.youtube.com/watch?v=tupfmCiH558&list=PLKjqFgaBNOo8fv5ZWEIUSlSqzXDVC2SV_&index=6'
          )
        }
      ]}
    />
  </TutorialTrayContent>
)

export default AnnouncementsTray
