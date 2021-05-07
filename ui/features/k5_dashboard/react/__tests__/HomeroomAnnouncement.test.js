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
import {render} from '@testing-library/react'
import HomeroomAnnouncement from '../HomeroomAnnouncement'

describe('HomeroomAnnouncement', () => {
  const getProps = (overrides = {}) => ({
    courseId: 123,
    courseName: "Mrs. Jensen's Homeroom",
    courseUrl: 'http://google.com/courseurl',
    canEdit: true,
    title: '20 minutes of weekly reading',
    message: '<p>You have this assignment due <strong>tomorrow</strong>!',
    url: 'http://google.com/url',
    attachment: {
      display_name: 'exam1.pdf',
      url: 'http://google.com/download',
      filename: '1608134586_366__exam1.pdf'
    },
    published: true,
    ...overrides
  })

  it('shows homeroom course title with underlying link for teachers', () => {
    const {getByText} = render(<HomeroomAnnouncement {...getProps()} />)
    const courseName = getByText("Mrs. Jensen's Homeroom")
    expect(courseName).toBeInTheDocument()
    expect(courseName.href).toBe('http://google.com/courseurl')
  })

  it('shows homeroom course title with no link for students', () => {
    const {getByText} = render(<HomeroomAnnouncement {...getProps({canEdit: false})} />)
    const courseName = getByText("Mrs. Jensen's Homeroom")
    expect(courseName).toBeInTheDocument()
    expect(courseName.href).toBeUndefined()
  })

  it('shows announcement title', () => {
    const {getByText} = render(<HomeroomAnnouncement {...getProps()} />)
    expect(getByText('20 minutes of weekly reading')).toBeInTheDocument()
  })

  it('shows announcement body with rich content', () => {
    const {getByText} = render(<HomeroomAnnouncement {...getProps()} />)
    const announcementBody = getByText('You have this assignment', {exact: false})
    expect(announcementBody).toBeInTheDocument()
    expect(announcementBody.innerHTML).toBe(
      'You have this assignment due <strong>tomorrow</strong>!'
    )
  })

  it('shows an edit button if teacher', () => {
    const {getByText} = render(<HomeroomAnnouncement {...getProps()} />)
    expect(getByText('Edit announcement 20 minutes of weekly reading')).toBeInTheDocument()
  })

  it('does not show an edit button if student', () => {
    const {queryByText} = render(<HomeroomAnnouncement {...getProps({canEdit: false})} />)
    expect(queryByText('Edit announcement 20 minutes of weekly reading')).not.toBeInTheDocument()
  })

  it('shows the announcement attachment link if present', () => {
    const {getByText} = render(<HomeroomAnnouncement {...getProps()} />)
    const courseName = getByText('exam1.pdf')
    expect(courseName).toBeInTheDocument()
    expect(courseName.href).toBe('http://google.com/download')
    expect(courseName.title).toBe('1608134586_366__exam1.pdf')
  })

  it('shows indicator if course is unpublished', () => {
    const {getByText} = render(<HomeroomAnnouncement {...getProps({published: false})} />)
    expect(getByText('Your homeroom is currently unpublished.')).toBeInTheDocument()
  })

  it('does not show indicator if course is published', () => {
    const {queryByText} = render(<HomeroomAnnouncement {...getProps()} />)
    expect(queryByText('Your homeroom is currently unpublished.')).not.toBeInTheDocument()
  })
})
