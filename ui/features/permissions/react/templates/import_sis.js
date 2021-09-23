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

import I18n from 'i18n!permissions_templates_10'
import {generateActionTemplates} from '../generateActionTemplates'

export const template = generateActionTemplates(
  [
    {
      title: I18n.t('Account Navigation'),
      description: I18n.t(
        'Determines visibility and management of SIS Import link in Account Navigation.'
      )
    },
    {
      title: I18n.t('SIS Import'),
      description: I18n.t('Allows user to import SIS data.')
    }
  ],
  [
    {
      title: I18n.t('SIS Import'),
      description: I18n.t('To manage SIS data, SIS Data - manage must also be enabled.')
    },
    {
      title: I18n.t('Subaccounts'),
      description: I18n.t('Not available at the subaccount level')
    }
  ],
  [],
  []
)
