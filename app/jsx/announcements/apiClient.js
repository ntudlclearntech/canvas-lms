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

import axios from 'axios'
import { encodeQueryString } from '../shared/queryString'

// not using default because we will add more api calls in near future
// eslint-disable-next-line
export function getAnnouncements ({ courseId, announcements, announcementsSearch }, { page }) {
  const { term } = announcementsSearch
  const params = encodeQueryString([
    { only_announcements: true },
    { 'include[]': 'sections_user_count' },
    { 'include[]': 'sections' },
    { per_page: 40 },
    { page: page || announcements.currentPage },
    { search_term: term || null }
  ])

  return axios.get(`/api/v1/courses/${courseId}/discussion_topics?${params}`)
}
