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

const QuizzesTray = () => (
  <TutorialTrayContent
    heading={I18n.t('Quizzes')}
    subheading={I18n.t("Assess students' learning efficacy")}
    image="/images/tutorial-tray-images/quiz.svg"
  >
    <Text as="p">
      {I18n.t(`There are two main functions in NTU COOL quizzes: creating quizzes and
          managing quiz results. In creating quizzes, you can do the basic settings,
          such as quiz instructions, points, published date, and whom to assign. The
          system supports various question types including multiple choices and
          true or false questions. You can also view the quiz results instantly and
          download files with detailed results.`)}
    </Text>
    <UserGuideContent
      items={[
        {
          title: I18n.t('How to create quizzes'),
          url: I18n.t(
            'how_to_create_quizzes_url',
            'https://drive.google.com/file/d/1tYgrJ19wpXhFjxJVMaN2E1wHYJcU0EX4/view?usp=sharing'
          )
        },
        {
          title: I18n.t('Tutorial Video: Create quizzes'),
          url: I18n.t(
            'tutorial_video_create_quizzes_url',
            'https://www.youtube.com/watch?v=HCviiSfcAUQ&list=PLKjqFgaBNOo8fv5ZWEIUSlSqzXDVC2SV_&index=17'
          )
        },
        {
          title: I18n.t('Tutorial Video: Manage quiz results'),
          url: I18n.t(
            'tutorial_video_manage_quiz_results_url',
            'https://www.youtube.com/watch?v=uORfe9tfM8A&list=PLKjqFgaBNOo8fv5ZWEIUSlSqzXDVC2SV_&index=18'
          )
        }
      ]}
    />
  </TutorialTrayContent>
)

export default QuizzesTray
