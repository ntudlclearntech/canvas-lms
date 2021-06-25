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
import {DEFAULT_SETTINGS} from '../../../svg/constants'
import {PreviewSection} from '../PreviewSection'

describe('<PreviewSection />', () => {
  it('renders the svg preview', () => {
    const {container} = render(
      <PreviewSection
        settings={{
          ...DEFAULT_SETTINGS,
          color: '#f00',
          outlineColor: '#0f0',
          outlineSize: 'medium',
          shape: 'triangle',
          size: 'large'
        }}
      />
    )
    expect(container.querySelector('svg')).toMatchInlineSnapshot(`
      <svg
        fill="none"
        height="218px"
        viewBox="0 0 218 218"
        width="218px"
      >
        <g
          fill="#f00"
          stroke="#0f0"
          stroke-width="4"
        >
          <path
            d="M109 8L210 210H8L109 8Z"
          />
        </g>
      </svg>
    `)
  })
})
