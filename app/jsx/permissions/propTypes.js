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

import {shape, string, bool, oneOf} from 'prop-types'

const propTypes = {}

export const COURSE = 'Course'
export const ACCOUNT = 'Account'

propTypes.permission = shape({
  permission_name: string.isRequired,
  label: string.isRequired,
  contextType: oneOf([COURSE, ACCOUNT]),
  displayed: bool.isRequired
})

propTypes.role = shape({
  id: string.isRequired,
  label: string.isRequired,
  base_role_name: string,
  contextType: oneOf([COURSE, ACCOUNT]),
  displayed: bool.isRequired
})

export default propTypes
