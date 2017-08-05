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

import axios from 'axios';

function getAssignmentsByName (courseId, searchTerm) {
  if (searchTerm.length < 3) {
    // the endpoint doesn't allow searching by 2 letters or less
    return Promise.resolve({ response: { data: [] } });
  }

  const params = {
    params: {
      search_term: searchTerm
    }
  };

  const url = encodeURI(`/api/v1/courses/${courseId}/assignments`);

  return axios.get(url, params);
}

function getAssignmentsNextPage (url) {
  return axios.get(url);
}

export default {
  getAssignmentsByName,
  getAssignmentsNextPage
};
