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

const ModulesTray = () => (
  <TutorialTrayContent
    name="Modules"
    heading={I18n.t('Modules')}
    subheading={I18n.t('Organize course content')}
    image="/images/tutorial-tray-images/Panda_Modules.svg"
    imageWidth="9rem"
    seeAllLink={{
      label: I18n.t('See more in Canvas Guides'),
      href: `https://community.canvaslms.com/docs/DOC-10460-canvas-instructor-guide-
      table-of-contents#jive_content_id_Modules`
    }}
    links={[
      {
        label: I18n.t('How do I add a module?'),
        href: 'https://community.canvaslms.com/docs/DOC-13129-415241424'
      },
      {
        label: I18n.t('How do I publish or unpublish a module as an instructor?'),
        href: 'https://community.canvaslms.com/docs/DOC-10114-4152180497'
      },
      {
        label: I18n.t('How do I add assignment types, pages, and files as module items?'),
        href: 'https://community.canvaslms.com/docs/DOC-12689-415241427'
      },
      {
        label: I18n.t('How do I move or reorder a module?'),
        href: 'https://community.canvaslms.com/docs/DOC-12697-415241425'
      }
    ]}
  >
    <Text as="p">
      {I18n.t(`Instructors can arrange the course resources in the Modules section.
          For instance, instructors can upload weekly handouts, videos, assignments, and discussions in Modules.
          Aside from sorting by weeks, instructors can arrange modules by topics.`)}
    </Text>
    <UserGuideContent
      items={[
        {
          title: I18n.t('How to publish handouts'),
          url: I18n.t(
            'how_to_publish_handouts_url',
            'https://drive.google.com/file/d/1m0bpSWz7BHDjhOxFxQ7JqMDNB-u5UeDF/view?usp=sharing'
          )
        },
        {
          title: I18n.t('Tutorial Video: Modules'),
          url: I18n.t(
            'tutorial_video_modules_url',
            'https://www.youtube.com/watch?v=lPZo_Mc8mfQ&list=PLKjqFgaBNOo8fv5ZWEIUSlSqzXDVC2SV_&index=7'
          )
        },
        {
          title: I18n.t('Tutorial Video: Publish videos'),
          url: I18n.t(
            'tutorial_vide_publish_videos_url',
            'https://www.youtube.com/watch?v=m4kchtMBNxI&list=PLKjqFgaBNOo8fv5ZWEIUSlSqzXDVC2SV_&index=15'
          )
        }
      ]}
    />
  </TutorialTrayContent>
)

export default ModulesTray
