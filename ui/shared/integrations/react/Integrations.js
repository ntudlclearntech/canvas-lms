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

import React, {useState} from 'react'
import I18n from 'i18n!course_settings'

import {Flex} from '@instructure/ui-flex'
import {Text} from '@instructure/ui-text'
import {View} from '@instructure/ui-view'
import IntegrationRow from './IntegrationRow'

import MicrosoftSync from './microsoft_sync/MicrosoftSync'
import useMicrosoftSettings from './microsoft_sync/useSettings'
import MicrosoftSyncButton from './microsoft_sync/MicrosoftSyncButton'

const Integrations = () => {
  const [
    msGroup,
    msEnabled,
    msLoading,
    msError,
    msToggleEnabled,
    setMSError,
    setMSGroup
  ] = useMicrosoftSettings(ENV.COURSE_ID)

  const [msExpanded, setMSExpanded] = useState(false)
  const [msInfo, setMSInfo] = useState()

  return (
    <>
      <View as="div" borderWidth="none none small none" borderColor="slate" padding="none small">
        <Flex justifyItems="space-between">
          <Flex.Item>
            <Text size="large">{I18n.t('Feature')}</Text>
          </Flex.Item>
          <Flex.Item>
            <Text size="large">{I18n.t('State')}</Text>
          </Flex.Item>
        </Flex>
      </View>

      <IntegrationRow
        name={I18n.t('Microsoft Sync')}
        enabled={msEnabled}
        loading={msLoading}
        onChange={msToggleEnabled}
        error={msError}
        info={msInfo}
        expanded={msExpanded || !!msError}
        onToggle={() => setMSExpanded(expanded => !expanded)}
      >
        <MicrosoftSync enabled={msEnabled} group={msGroup} loading={msLoading}>
          <MicrosoftSyncButton
            courseId={ENV.COURSE_ID}
            enabled={msEnabled}
            group={msGroup}
            onError={setMSError}
            onInfo={setMSInfo}
            onSuccess={setMSGroup}
          />
        </MicrosoftSync>
      </IntegrationRow>
    </>
  )
}

export default Integrations
