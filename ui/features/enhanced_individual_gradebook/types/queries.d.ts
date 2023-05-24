/*
 * Copyright (C) 2023 - present Instructure, Inc.
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

import {WorkflowState} from '../../../api'

export type UserConnection = {
  enrollments: {
    section: {
      name: string
      id: string
    }
  }
  email: string
  id: string
  loginId: string
  name: string
  sortableName: string
}

export type AssignmentConnection = {
  id: string
  name: string
  pointsPossible: number
  submissionTypes: string[]
  anonymizeStudents: boolean
  omitFromFinalGrade: boolean
  workflowState: WorkflowState
  muted: boolean
  gradingType: string
}

export type AssignmentGroupConnection = {
  id: string
  name: string
  groupWeight: number
  rules: {
    drop_lowest?: number
    drop_highest?: number
    never_drop?: string[]
  }
  state: string
  position: number
  assignmentsConnection: {
    nodes: AssignmentConnection[]
  }
}

export type SubmissionConnection = {
  assignmentId: string
  user: UserConnection
  id: string
  score: number
  grade: string
}

export type GradebookQueryResponse = {
  course: {
    enrollmentsConnection: {
      nodes: {
        user: UserConnection
      }[]
    }
    submissionsConnection: {
      nodes: SubmissionConnection[]
    }
    assignmentGroupsConnection: {
      nodes: AssignmentGroupConnection[]
    }
  }
}

export type GradebookStudentDetails = {
  enrollments: {
    id: string
    section: {
      id: string
      name: string
    }
  }[]
  loginId: string
  name: string
}

export type GradebookUserSubmissionDetails = {
  grade: string
  id: string
  score: number
  enteredScore: number
  assignmentId: string
  submissionType: string
  proxySubmitter: string
  submittedAt: string
  state: string
  excused: boolean
}

export type GradebookStudentQueryResponse = {
  course: {
    usersConnection: {
      nodes: GradebookStudentDetails[]
    }
    submissionsConnection: {
      nodes: GradebookUserSubmissionDetails[]
    }
  }
}
