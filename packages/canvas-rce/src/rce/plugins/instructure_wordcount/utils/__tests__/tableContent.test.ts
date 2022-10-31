/*
 * Copyright (C) 2022 - present Instructure, Inc.
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

import {generateRows} from '../tableContent'

jest.mock('../countContent', () => {
  return {
    countContent: () => 0,
  }
})

const editor: any = {}

describe('generateRows', () => {
  it('creates the expected row structure', () => {
    expect(generateRows(editor)).toEqual([
      {label: 'Words', documentCount: 0, selectionCount: 0},
      {label: 'Characters (no spaces)', documentCount: 0, selectionCount: 0},
      {label: 'Characters', documentCount: 0, selectionCount: 0},
    ])
  })
})
