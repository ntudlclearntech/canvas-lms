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

import I18n from 'i18n!discussion_posts'
import PropTypes from 'prop-types'
import React from 'react'
import {InlineList} from '@instructure/ui-list'
import {Reply} from './Reply'
import {Like} from './Like'
import {Expansion} from './Expansion'
import {Link} from '@instructure/ui-link'
import {Text} from '@instructure/ui-text'

export function ThreadingToolbar({...props}) {
  return props.searchTerm && ENV.isolated_view ? (
    <Link as="button" isWithinText={false} onClick={() => {}}>
      <Text weight="bold">{I18n.t('Go to Reply')}</Text>
    </Link>
  ) : (
    <InlineList delimiter="pipe">
      {React.Children.map(props.children, c => (
        <InlineList.Item key={c.props.delimiterKey}>{c}</InlineList.Item>
      ))}
    </InlineList>
  )
}

ThreadingToolbar.propTypes = {
  children: PropTypes.arrayOf(PropTypes.node),
  searchTerm: PropTypes.string
}

ThreadingToolbar.Reply = Reply
ThreadingToolbar.Like = Like
ThreadingToolbar.Expansion = Expansion

export default ThreadingToolbar
