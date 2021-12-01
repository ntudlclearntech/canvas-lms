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

export type DeepLinkResponse = {
  content_items: ContentItem[]
  msg: string
  log: string
  errormsg: string
  errorlog: string
  ltiEndpoint: string
  reloadpage: boolean
}

export type ContentItem = {
  title: string
  errors: object
  // there are other fields not included here as defined in the spec:
  // https://www.imsglobal.org/spec/lti-dl/v2p0#content-item-types
}
