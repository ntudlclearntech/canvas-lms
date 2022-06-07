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

import React from 'react'
import {string, func, shape} from 'prop-types'
import {Tooltip} from '@instructure/ui-tooltip'
import {Table} from '@instructure/ui-table'
import {IconMiniArrowUpSolid, IconMiniArrowDownSolid} from '@instructure/ui-icons'
import {CondensedButton} from '@instructure/ui-buttons'

export default function UsersListHeader(props) {
  const {id, tipAsc, tipDesc, label, onUpdateFilters, columnHeaderRef} = props
  const {sort, order, search_term, role_filter_id} = props.searchFilter
  const newOrder = (sort === id && order === 'asc') || (!sort && id === 'username') ? 'desc' : 'asc'

  const handleFilterUpdate = event => {
    if (event && event.currentTarget) columnHeaderRef(event.currentTarget)
    onUpdateFilters({search_term, sort: id, order: newOrder, role_filter_id})
  }

  return (
    <Table.ColHeader id={id} data-testid="UsersListHeader">
      <Tooltip renderTip={sort === id && order === 'asc' ? tipAsc : tipDesc}>
        <CondensedButton
          id={`${id}-button`}
          onClick={handleFilterUpdate}
          theme={{fontWeight: '700', mediumPaddingHorizontal: '0', mediumHeight: '1.5rem'}}
        >
          {label}
          {sort === id ? (
            order === 'asc' ? (
              <IconMiniArrowUpSolid />
            ) : (
              <IconMiniArrowDownSolid />
            )
          ) : (
            ''
          )}
        </CondensedButton>
      </Tooltip>
    </Table.ColHeader>
  )
}

UsersListHeader.propTypes = {
  id: string.isRequired,
  tipAsc: string.isRequired,
  tipDesc: string.isRequired,
  label: string.isRequired,
  onUpdateFilters: func.isRequired,
  columnHeaderRef: func.isRequired,
  searchFilter: shape({
    sort: string,
    order: string,
    search_term: string,
    fole_filter_id: string
  }).isRequired
}

UsersListHeader.displayName = 'ColHeader'
