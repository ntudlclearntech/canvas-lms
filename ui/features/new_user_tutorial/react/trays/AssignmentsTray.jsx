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

const AssignmentsTray = () => (
  <TutorialTrayContent
    heading={I18n.t('Assignments')}
    subheading={I18n.t('Create various types of graded assignments')}
    image="/images/tutorial-tray-images/Panda_Assignments.svg"
    imageWidth="11rem"
    links={[
      {
        label: I18n.t('How to assign assignments'),
        href: I18n.t(
          'how_to_assign_assignments_url',
          'https://drive.google.com/file/d/1z0iIyJeq5RLFwHaggmermbJgfw5t1-Mg/view?usp=sharing'
        )
      },
      {
        label: I18n.t('How to correct assignments'),
        href: I18n.t(
          'how_to_correct_assignments_url',
          'https://drive.google.com/file/d/1cw70AI3WrCFfbV2EOrcZl2Z12bYSOHXB/view?usp=sharing'
        )
      },
      {
        label: I18n.t('Tutorial Video: Assign assignments'),
        href: I18n.t(
          'tutorial_video_assign_assignments_url',
          'https://www.youtube.com/watch?v=IeVYgHhMKNU&list=PLKjqFgaBNOo8fv5ZWEIUSlSqzXDVC2SV_&index=10'
        )
      },
      {
        label: I18n.t('Tutorial Video: Correct assignments'),
        href: I18n.t(
          'tutorial_video_correct_assignments_url',
          'https://www.youtube.com/watch?v=SuxMtw0TzVY&list=PLKjqFgaBNOo8fv5ZWEIUSlSqzXDVC2SV_&index=12'
        )
      }
    ]}
  >
    {I18n.t(`Create assignments on the Assignments page. Organize assignments
                into groups like Homework, Presentation, Discussions
                and Quizzes. Assignment groups can be weighted.`)}
  </TutorialTrayContent >
)

export default AssignmentsTray
