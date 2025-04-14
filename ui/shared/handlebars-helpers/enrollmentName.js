//
// Copyright (C) 2013 - present Instructure, Inc.
//
// This file is part of Canvas.
//
// Canvas is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero General Public License as published by the Free
// Software Foundation, version 3 of the License.
//
// Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
// WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
// A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
// details.
//
// You should have received a copy of the GNU Affero General Public License along
// with this program. If not, see <http://www.gnu.org/licenses/>.

import {useScope as useI18nScope} from '@canvas/i18n'

const I18n = useI18nScope('enrollmentNames')

const types = {
  get StudentEnrollment() {
    return I18n.t('student', 'Student')
  },
  get TeacherEnrollment() {
    return I18n.t('teacher', 'Teacher')
  },
  get TaEnrollment() {
    return I18n.t('teacher_assistant', 'TA')
  },
  get ObserverEnrollment() {
    return I18n.t('observer', 'Observer')
  },
  get DesignerEnrollment() {
    return I18n.t('designer', 'Designer')
  },
}

export default function enrollmentName(type) {
  if (type == '旁聽生' || type.toLowerCase() == 'auditor') {
    return I18n.t('auditor', 'Auditor')
  } else if (
    type == '助教 (無評分權限)' ||
    type.toLowerCase() == 'ta (no permission for grading)'
  ) {
    return I18n.t('teacher_assistant_no_grading', 'TA (no permission for grading)')
  } else {
    return types[type] || type
  }
}
