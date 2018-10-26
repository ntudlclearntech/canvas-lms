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

import {arrayOf, bool, instanceOf, shape, string} from 'prop-types'

export const auditEvent = shape({
  eventType: string.isRequired
})

export const auditEventInfo = shape({
  anonymous: bool.isRequired,
  auditEvent: auditEvent.isRequired
})

export const dateEventGroup = shape({
  auditEvents: arrayOf(auditEventInfo).isRequired,
  startDate: instanceOf(Date).isRequired,
  startDateKey: string.isRequired
})

export const userEventGroup = shape({
  dateEventGroups: arrayOf(dateEventGroup).isRequired
})

export const auditTrail = shape({
  userEventGroups: shape({}).isRequired
})
