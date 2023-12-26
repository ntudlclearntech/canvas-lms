/* * Copyright (C) 2017 - present Instructure, Inc.
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

const DiscussionsTray = () => (
  <TutorialTrayContent
    heading={I18n.t('Discussions')}
    subheading={I18n.t('Facilitate course interaction')}
    image="/images/tutorial-tray-images/Panda_Discussions.svg"
    imageWidth="9rem"
    links={[
      {
        label: I18n.t('Tutorial Video: Discussion'),
        href: I18n.t(
          'tutorial_video_discussion_url',
          'https://www.youtube.com/watch?v=MjSi2tkkMxk&amp;list=PLKjqFgaBNOo8fv5ZWEIUSlSqzXDVC2SV_&amp;index=14'
        )
      }
    ]}
  >
    {I18n.t(`The discussion function allows instructors, teaching assistants, and students
          to interact and discuss with each other. Students can post questions and share their
          reflections on it. Besides, instructors and teaching assistants can set up different themes
          and require students to comment on as graded assignments. Moreover, outstanding works of
          students can be uploaded to discussion posts for the whole class to appreciate.`)}
  </TutorialTrayContent >
)

export default DiscussionsTray
