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
import {Text} from '@instructure/ui-elements'
import TutorialTrayContent from './TutorialTrayContent'
import UserGuideContent from './UserGuideContent'

const HomeTray = () => (
  <TutorialTrayContent
    name="Home"
    heading={I18n.t('Home')}
    subheading={I18n.t('This is your course landing page')}
    image="/images/tutorial-tray-images/publish.png"
  >
    <Text as="p">
      {I18n.t(`When people visit your course, this is the first page they'll see.
          We've set your homepage to Modules, but you have the option to change it.`)}
    </Text>
    <Text as="p">
      {I18n.t(`Until the course is published, only instructors and TAs will be able to
       access it. The course is published by default, and students can access it
       after they login to NTU COOL.`)}
    </Text>
    <UserGuideContent
      items={[
        {
          title: I18n.t('How do I set my home page'),
          url: I18n.t(
            'home_user_guide_url',
            'https://docs.google.com/document/d/1_pgN6BAVIK4RmJzVy6DUs5HV8e25zTiLoc287QnMgzk/edit#heading=h.ypz36a4n5hvl'
          )
        }
      ]}
    />
  </TutorialTrayContent>
)

export default HomeTray
