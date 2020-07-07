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

const AssignmentsTray = () => (
  <TutorialTrayContent
    heading={I18n.t('Settings')}
    subheading={I18n.t('Change basic settings such as course languages, and the navigation bar')}
    image="/images/tutorial-tray-images/settings.svg"
  >
    <Text as="p">
      {I18n.t(`On the setting page, you can change the course language, hide
          unnecessary functions from the navigation bar, or set the start and end
          date of the course.`)}
    </Text>
    <UserGuideContent
      items={[
        {
          title: I18n.t('How do I change the Settings in a course'),
          url: I18n.t(
            'how_do_i_change_the_settings_in_a_course_url',
            'https://docs.google.com/document/d/1_pgN6BAVIK4RmJzVy6DUs5HV8e25zTiLoc287QnMgzk/edit#heading=h.m9jh3tjgo2kd'
          )
        }
      ]}
    />
  </TutorialTrayContent>
)

export default AssignmentsTray
