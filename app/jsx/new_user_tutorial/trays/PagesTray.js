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

const PagesTray = () => (
  <TutorialTrayContent
    heading={I18n.t('Pages')}
    subheading={I18n.t('Create and compile educational resources')}
    image="/images/tutorial-tray-images/page.svg"
  >
    <Text as="p">
      {I18n.t(`Teachers and TAs can build Pages containing content and educational
          resources that help students learn but aren't assignments. Include text,
          multimedia, and links to files and external resources. Students can also
          create content on Pages if they were given the authority by teachers or
          teaching assistants.`)}
    </Text>
    <UserGuideContent
      items={[
        {
          title: I18n.t('How do I edit Pages'),
          url: I18n.t(
            'how_do_i_edit_pages_url',
            'https://docs.google.com/document/d/1_pgN6BAVIK4RmJzVy6DUs5HV8e25zTiLoc287QnMgzk/edit#heading=h.kq9xgh62ph56'
          )
        }
      ]}
    />
  </TutorialTrayContent>
)

export default PagesTray
