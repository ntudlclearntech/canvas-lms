/*
 * Copyright (C) 2021 - present Instructure, Inc.
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
import fetchMock from 'fetch-mock'
import {render, waitFor, fireEvent} from '@testing-library/react'
import {CreateCourseModal} from '../CreateCourseModal'

const manageableCourses = [
  {
    id: 4,
    name: 'CPMS'
  },
  {
    id: 5,
    name: 'CS'
  },
  {
    id: 6,
    name: 'Elementary'
  }
]

const MANAGEABLE_COURSES_URL = '/api/v1/manageable_accounts?per_page=100'

describe('CreateCourseModal', () => {
  const setModalOpen = jest.fn()

  const getProps = (overrides = {}) => ({
    isModalOpen: true,
    setModalOpen,
    ...overrides
  })

  afterEach(() => {
    fetchMock.restore()
  })

  it('shows a spinner with correct title while loading accounts', async () => {
    const {getByText} = render(<CreateCourseModal {...getProps()} />)
    await waitFor(() => expect(getByText('Loading accounts...')).toBeInTheDocument())
  })

  it('shows form fields for account and course name after loading accounts', async () => {
    fetchMock.get(MANAGEABLE_COURSES_URL, manageableCourses)
    const {getByLabelText} = render(<CreateCourseModal {...getProps()} />)
    await waitFor(() => {
      expect(
        getByLabelText('Which account will this course be associated with?')
      ).toBeInTheDocument()
      expect(getByLabelText('Course Name')).toBeInTheDocument()
    })
  })

  it('closes the modal when clicking cancel', async () => {
    fetchMock.get(MANAGEABLE_COURSES_URL, manageableCourses)
    const {getByText, getByRole} = render(<CreateCourseModal {...getProps()} />)
    await waitFor(() => expect(getByRole('button', {name: 'Cancel'})).not.toBeDisabled())
    fireEvent.click(getByText('Cancel'))
    expect(setModalOpen).toHaveBeenCalledWith(false)
  })

  it('disables the create button without a course name and account', async () => {
    fetchMock.get(MANAGEABLE_COURSES_URL, manageableCourses)
    const {getByText, getByLabelText, getByRole} = render(<CreateCourseModal {...getProps()} />)
    await waitFor(() => expect(getByLabelText('Course Name')).toBeInTheDocument())
    const createButton = getByRole('button', {name: 'Create'})
    expect(createButton).toBeDisabled()
    fireEvent.change(getByLabelText('Course Name'), {target: {value: 'New course'}})
    expect(createButton).toBeDisabled()
    fireEvent.click(getByLabelText('Which account will this course be associated with?'))
    fireEvent.click(getByText('Elementary'))
    expect(createButton).not.toBeDisabled()
  })

  it('includes all received accounts in the select, handling pagination correctly', async () => {
    const accountsPage1 = []
    for (let i = 0; i < 50; i++) {
      accountsPage1.push({
        id: i,
        name: String(i)
      })
    }
    const accountsPage2 = [
      {
        id: 51,
        name: '51'
      },
      {
        id: 52,
        name: '52'
      }
    ]
    const response1 = {
      headers: {Link: '</api/v1/manageable_accounts?page=2&per_page=100>; rel="next"'},
      body: accountsPage1
    }
    fetchMock.mock(MANAGEABLE_COURSES_URL, response1)
    fetchMock.get('/api/v1/manageable_accounts?per_page=100&page=2', accountsPage2)
    const {getByText, getByLabelText} = render(<CreateCourseModal {...getProps()} />)
    await waitFor(() => expect(getByLabelText('Course Name')).toBeInTheDocument())
    fireEvent.click(getByLabelText('Which account will this course be associated with?'))
    accountsPage1.forEach(a => {
      expect(getByText(a.name)).toBeInTheDocument()
    })
    accountsPage2.forEach(a => {
      expect(getByText(a.name)).toBeInTheDocument()
    })
  })

  it('creates new course and enrolls user in that course', async () => {
    fetchMock.get(MANAGEABLE_COURSES_URL, manageableCourses)
    fetchMock.post(encodeURI('/api/v1/accounts/6/courses?course[name]=Science'), {id: '14'})
    fetchMock.post(
      encodeURI(
        '/api/v1/courses/14/enrollments?enrollment[type]=TeacherEnrollment&enrollment[user_id]=self&enrollment[enrollment_state]=active'
      ),
      200
    )
    const {getByText, getByLabelText} = render(<CreateCourseModal {...getProps()} />)
    await waitFor(() => expect(getByLabelText('Course Name')).toBeInTheDocument())
    fireEvent.click(getByLabelText('Which account will this course be associated with?'))
    fireEvent.click(getByText('Elementary'))
    fireEvent.change(getByLabelText('Course Name'), {target: {value: 'Science'}})
    fireEvent.click(getByText('Create'))
    expect(getByText('Creating new course...')).toBeInTheDocument()
  })

  it('shows an error message if course creation fails', async () => {
    fetchMock.get(MANAGEABLE_COURSES_URL, manageableCourses)
    fetchMock.post(encodeURI('/api/v1/accounts/5/courses?course[name]=Math'), 500)
    const {getByText, getByLabelText, getAllByText, getByRole} = render(
      <CreateCourseModal {...getProps()} />
    )
    await waitFor(() => expect(getByLabelText('Course Name')).toBeInTheDocument())
    fireEvent.click(getByLabelText('Which account will this course be associated with?'))
    fireEvent.click(getByText('CS'))
    fireEvent.change(getByLabelText('Course Name'), {target: {value: 'Math'}})
    fireEvent.click(getByText('Create'))
    await waitFor(() => expect(getAllByText('Error creating course')[0]).toBeInTheDocument())
    expect(getByRole('button', {name: 'Cancel'})).not.toBeDisabled()
  })
})
