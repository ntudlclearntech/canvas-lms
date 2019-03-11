/*
 * Copyright (C) 2018 - present Instructure, Inc.
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

import {fireEvent, waitForElement} from 'react-testing-library'
import {
  mockAssignment,
  findInputForLabel,
  saveAssignmentResult,
  waitForNoElement
} from '../../test-utils'
import {
  renderTeacherView,
  renderTeacherQueryAndWaitForResult
} from './integration/integration-utils'

describe('TeacherView', () => {
  describe('basic TeacherView stuff', () => {
    it('shows the assignment', async () => {
      const assignment = mockAssignment()
      const {getByText} = await renderTeacherView(assignment)
      expect(await waitForElement(() => getByText(assignment.name))).toBeInTheDocument()
      expect(
        await waitForElement(() => getByText(`${assignment.pointsPossible}`))
      ).toBeInTheDocument()
      expect(await waitForElement(() => getByText('Everyone'))).toBeInTheDocument()
      expect(await waitForElement(() => getByText('Due:', {exact: false}))).toBeInTheDocument()
      expect(await waitForElement(() => getByText('Available', {exact: false}))).toBeInTheDocument()
    })
  })

  describe('publish toggle', () => {
    // will be re-checked with ADMIN-2345 for flakiness
    it('unpublishes the assignment', async () => {
      const assignment = mockAssignment()
      const {getByText, container} = await renderTeacherQueryAndWaitForResult(assignment, [
        saveAssignmentResult(assignment, {state: 'unpublished'}, {state: 'unpublished'})
      ])
      const publish = getByText('publish', {exact: false})
      const publishCheckbox = findInputForLabel(publish, container)
      expect(publishCheckbox.checked).toBe(true)
      fireEvent.click(publishCheckbox)
      expect(getByText('Saving assignment')).toBeInTheDocument()
      expect(publishCheckbox.checked).toBe(false) // optimistic update
      // make sure the mutation finishes
      expect(await waitForNoElement(() => getByText('Saving assignment'))).toBe(true)
    })

    // will be re-checked with ADMIN-2345 for flakiness
    it('saves the assignment when publishing', async () => {
      const assignment = mockAssignment({state: 'unpublished'})
      const {getByText, container} = await renderTeacherQueryAndWaitForResult(assignment, [
        saveAssignmentResult(
          assignment,
          {
            name: assignment.name,
            description: assignment.description,
            state: 'published'
          },
          {state: 'published'}
        )
      ])
      const publish = getByText('publish', {exact: false})
      const publishCheckbox = findInputForLabel(publish, container)
      expect(publishCheckbox.checked).toBe(false)
      fireEvent.click(publishCheckbox)
      expect(getByText('Saving assignment')).toBeInTheDocument()
      expect(publishCheckbox.checked).toBe(true) // optimistic update
      // make sure the mutation finishes
      expect(await waitForNoElement(() => getByText('Saving assignment'))).toBe(true)
      expect(publishCheckbox.checked).toBe(true) // still
    })
  })
})
