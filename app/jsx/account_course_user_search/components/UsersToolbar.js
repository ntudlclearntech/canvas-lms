/*
 * Copyright (C) 2015 - present Instructure, Inc.
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
import {string, func, shape, arrayOf} from 'prop-types'
import IconGroupLine from '@instructure/ui-icons/lib/Line/IconGroup'
import IconMoreLine from '@instructure/ui-icons/lib/Line/IconMore'
import IconPlusLine from '@instructure/ui-icons/lib/Line/IconPlus'
import IconStudentViewLine from '@instructure/ui-icons/lib/Line/IconStudentView'

import Button from '@instructure/ui-buttons/lib/components/Button'
import FormFieldGroup from '@instructure/ui-form-field/lib/components/FormFieldGroup'
import {GridCol} from '@instructure/ui-layout/lib/components/Grid'
import Menu, {MenuItem} from '@instructure/ui-menu/lib/components/Menu'

import ScreenReaderContent from '@instructure/ui-a11y/lib/components/ScreenReaderContent'
import CanvasSelect from 'jsx/shared/components/CanvasSelect'
import TextInput from '@instructure/ui-forms/lib/components/TextInput'

import I18n from 'i18n!account_course_user_search'
import preventDefault from 'compiled/fn/preventDefault'
import CreateOrUpdateUserModal from '../../shared/components/CreateOrUpdateUserModal'

export default function UsersToolbar(props) {
  function handleRoleSelect(event, value) {
    props.onUpdateFilters({role_filter_id: value})
  }

  const placeholder = I18n.t('Search people...')
  return (
    <form onSubmit={preventDefault(props.onApplyFilters)}>
      <FormFieldGroup layout="columns" description="">
        <GridCol width="auto">
          <CanvasSelect
            id="userType"
            label={<ScreenReaderContent>{I18n.t('Filter by user type')}</ScreenReaderContent>}
            value={props.role_filter_id}
            onChange={handleRoleSelect}
          >
            <CanvasSelect.Option key="all" id="all" value="">
              {I18n.t('All Roles')}
            </CanvasSelect.Option>
            {props.roles.map(role => (
              <CanvasSelect.Option key={role.id} id={role.id} value={role.id}>
                {role.label}
              </CanvasSelect.Option>
            ))}
          </CanvasSelect>
        </GridCol>

        <TextInput
          type="search"
          value={props.search_term}
          label={<ScreenReaderContent>{placeholder}</ScreenReaderContent>}
          placeholder={placeholder}
          onChange={e => props.onUpdateFilters({search_term: e.target.value})}
          onKeyUp={e => {
            if (e.key === 'Enter') {
              props.toggleSRMessage(true)
            } else {
              props.toggleSRMessage(false)
            }
          }}
          onBlur={() => props.toggleSRMessage(true)}
          onFocus={() => props.toggleSRMessage(false)}
          messages={!!props.errors.search_term && [{type: 'error', text: props.errors.search_term}]}
        />

        <GridCol width="auto">
          {window.ENV.PERMISSIONS.can_create_users && (
            <CreateOrUpdateUserModal
              createOrUpdate="create"
              url={`/accounts/${props.accountId}/users`}
              afterSave={props.onApplyFilters} // update displayed results in case new user should appear
            >
              <Button aria-label={I18n.t('Add people')}>
                <IconPlusLine />
                {I18n.t('People')}
              </Button>
            </CreateOrUpdateUserModal>
          )}{' '}
          {renderKabobMenu(props.accountId)}
        </GridCol>
      </FormFieldGroup>
    </form>
  )
}

function renderKabobMenu(accountId) {
  const showAvatarItem = ENV.PERMISSIONS.can_manage_admin_users // see accounts_controller#avatars
  const showGroupsItem = ENV.PERMISSIONS.can_manage_groups // see groups_controller#context_index
  if (showAvatarItem || showGroupsItem) {
    return (
      <Menu
        trigger={
          <Button theme={{iconPlusTextMargin: '0'}}>
            <IconMoreLine margin="0" title={I18n.t('More People Options')} />
          </Button>
        }
      >
        {showAvatarItem && (
          <MenuItem onClick={() => (window.location = `/accounts/${accountId}/avatars`)}>
            <IconStudentViewLine /> {I18n.t('Manage profile pictures')}
          </MenuItem>
        )}
        {showGroupsItem && (
          <MenuItem onClick={() => (window.location = `/accounts/${accountId}/groups`)}>
            <IconGroupLine /> {I18n.t('View user groups')}
          </MenuItem>
        )}
      </Menu>
    )
  }
  return null
}

UsersToolbar.propTypes = {
  toggleSRMessage: func.isRequired,
  onUpdateFilters: func.isRequired,
  onApplyFilters: func.isRequired,
  search_term: string,
  role_filter_id: string,
  errors: shape({search_term: string}),
  accountId: string,
  roles: arrayOf(
    shape({
      id: string.isRequired,
      label: string.isRequired
    })
  ).isRequired
}

UsersToolbar.defaultProps = {
  search_term: '',
  role_filter_id: '',
  errors: {},
  accountId: '',
  roles: []
}
