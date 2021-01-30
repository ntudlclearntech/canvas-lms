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
import {render, waitForElement} from '@testing-library/react'
import K5DashboardCard from '../cards/K5DashboardCard'
import {DashboardCardHeaderHero} from 'jsx/dashboard/cards/K5DashboardCard'

const defaultProps = {
  id: 'test',
  href: '/courses/5',
  originalName: 'test course'
}

afterEach(() => {
  fetchMock.restore()
})

describe('DashboardCardHeaderHero', () => {
  const heroProps = {
    backgroundColor: '#FFFFFF',
    onClick: () => {}
  }
  it('doesnt add instFS query params if it doesnt use an inst-fs url', () => {
    const {getByTestId} = render(
      <DashboardCardHeaderHero {...heroProps} image="https://example.com/path/to/image.png" />
    )
    expect(getByTestId('k5-dashboard-card-hero').style.getPropertyValue('background-image')).toBe(
      'url(https://example.com/path/to/image.png)'
    )
  })

  it('adds instFS query params if it does use an inst-fs url', () => {
    const {getByTestId} = render(
      <DashboardCardHeaderHero
        {...heroProps}
        image="https://inst-fs-iad-beta.inscloudgate.net/files/blah/foo?download=1&token=abcxyz"
      />
    )
    expect(getByTestId('k5-dashboard-card-hero').style.getPropertyValue('background-image')).toBe(
      'url(https://inst-fs-iad-beta.inscloudgate.net/files/blah/foo?download=1&token=abcxyz&geometry=300x150)'
    )
  })

  it('shows the background color if no image is provided', () => {
    const {getByTestId} = render(<DashboardCardHeaderHero {...heroProps} />)
    expect(getByTestId('k5-dashboard-card-hero').style.getPropertyValue('background-color')).toBe(
      'rgb(255, 255, 255)'
    )
  })
})

describe('K-5 Dashboard Cards', () => {
  it('renders a link with the courses title', () => {
    fetchMock.get('/api/v1/courses/test/discussion_topics?only_announcements=true&per_page=1', '[]')
    const {getByText} = render(<K5DashboardCard {...defaultProps} />)
    expect(getByText('test course')).toBeInTheDocument()
  })

  it('displays a link to the latest announcement if one exists', async () => {
    fetchMock.get(
      '/api/v1/courses/test/discussion_topics?only_announcements=true&per_page=1',
      JSON.stringify([
        {
          id: '55',
          html_url: '/courses/test/discussion_topics/55',
          title: 'How do you do, fellow kids?'
        }
      ])
    )
    const {getByText} = render(<K5DashboardCard {...defaultProps} />)
    const linkText = await waitForElement(() => getByText('How do you do, fellow kids?'))
    const link = linkText.closest('a')
    expect(link.href).toBe('http://localhost/courses/test/discussion_topics/55')
  })
})
