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

import React from 'react'
import I18n from 'i18n!new_user_tutorial'
import PropTypes from 'prop-types'
import {Heading, List} from '@instructure/ui-elements'
import {Link} from '@instructure/ui-link'

const UserGuideContent = props => (
  <div>
    <Heading level="h3" as="h3" margin="medium 0 0 0" ellipsis>
      {I18n.t('User Guide')}
    </Heading>
    <List margin="0 0 medium 0">
      {props.items.map(item => {
        return (
          <List.Item>
            <Link href={item.url} target="_blank">
              {item.title}
            </Link>
          </List.Item>
        )
      })}
    </List>
  </div>
)

UserGuideContent.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired
    })
  )
}

UserGuideContent.defaultProps = {
  items: []
}

export default UserGuideContent
