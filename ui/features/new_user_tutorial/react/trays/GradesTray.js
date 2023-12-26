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

const GradesTray = () => (
  <TutorialTrayContent
    heading={I18n.t('Grades')}
    subheading={I18n.t("Track students' assignment submission status and grades")}
    image="/images/tutorial-tray-images/Panda_Grades.svg"
    imageWidth="8.5rem"
    links={[
      {
        label: I18n.t('How to manage scores'),
        href: I18n.t(
          'how_to_nanage_scores_url',
          'https://drive.google.com/file/d/19TSuAISnxKnP90Bs2l-007X6p47Mprpm/view?usp=sharing'
        )
      },
      {
        label: I18n.t('Tutorial Video: Manage scores'),
        href: I18n.t(
          'tutorial_video_manage_scores_url',
          'https://www.youtube.com/watch?v=cg12SK8NISk&list=PLKjqFgaBNOo8fv5ZWEIUSlSqzXDVC2SV_&index=13'
        )
      },
      {
        label: I18n.t('How do I import and export grades'),
        href: I18n.t(
          'how_do_i_import_and_export_grades_url',
          'https://docs.google.com/document/d/1_pgN6BAVIK4RmJzVy6DUs5HV8e25zTiLoc287QnMgzk/edit#heading=h.hhzohz9fudr'
        )
      }
    ]}
  >
    {I18n.t(`On this page, you can track the assignment submission status and
          student's grades. You can also export a CSV file and add new graded
          items such as midterms based on the file format. After you import the file
          to the grade book, it will automatically create a column for the new
          graded item that you add on the file. If you want to change the points,
          groups, and weights of assignments, you need to set them on the
          assignment page.`)}
  </TutorialTrayContent>
)

export default GradesTray
