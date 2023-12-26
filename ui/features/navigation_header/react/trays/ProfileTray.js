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

import {useScope as useI18nScope} from '@canvas/i18n'
import React from 'react'
import {arrayOf, bool, object, shape, string} from 'prop-types'
import {Text} from '@instructure/ui-text'
import {List} from '@instructure/ui-list'
import {Heading} from '@instructure/ui-heading'
import {Badge} from '@instructure/ui-badge'
import {Avatar} from '@instructure/ui-avatar'
import {Spinner} from '@instructure/ui-spinner'
import {Link} from '@instructure/ui-link'
import {View} from '@instructure/ui-view'
import LogoutButton from '../LogoutButton'
import HighContrastModeToggle from './HighContrastModeToggle'
import {AccessibleContent} from '@instructure/ui-a11y-content'

const I18n = useI18nScope('ProfileTray')

// Trying to keep this as generalized as possible, but it's still a bit
// gross matching on the id of the tray tabs given to us by Rails
const idsToCounts = [{id: 'content_shares', countName: 'unreadShares'}]

const a11yCount = count => (
  <AccessibleContent alt={I18n.t('%{count} unread.', {count})}>{count}</AccessibleContent>
)

function ProfileTab({id, html_url, label, counts}) {
  function renderCountBadge() {
    const found = idsToCounts.filter(x => x.id === id)
    if (found.length === 0) return null // no count defined for this label
    const count = counts[found[0].countName]
    if (count === 0) return null // zero count is not displayed
    return (
      <Badge
        count={count}
        standalone={true}
        margin="0 0 xxx-small small"
        formatOutput={a11yCount}
      />
    )
  }

  return (
    <View className={`profile-tab-${id}`} as="div" margin="small 0">
      <Link isWithinText={false} href={html_url}>
        {label}
        {renderCountBadge()}
      </Link>
    </View>
  )
}

ProfileTab.propTypes = {
  id: string.isRequired,
  label: string.isRequired,
  html_url: string.isRequired,
  counts: object,
}

// currentTabId and targetTabId are string
function moveTabToUnderTarget(tabs, currentTabId, targetTabId) {
  let targetTabPosition = -1
  let currentTabPosition = -1
  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i].id == targetTabId) {
      targetTabPosition = i
    }
    if (tabs[i].id == currentTabId) {
      currentTabPosition = i
    }
  }

  if (targetTabPosition !== -1 && currentTabPosition !== -1) {
    let index = currentTabPosition

    // current tab is under the target tab
    if (currentTabPosition > targetTabPosition) {
      while (index > targetTabPosition + 1) {
        const tempTabPosition = tabs[index - 1]
        tabs[index - 1] = tabs[index]
        tabs[index] = tempTabPosition
        index--
      }
    } else {
      while (index < targetTabPosition) {
        const tempTabPosition = tabs[index + 1]
        tabs[index + 1] = tabs[index]
        tabs[index] = tempTabPosition
        index++
      }
    }
  }

  return tabs
}

export default function ProfileTray(props) {
  const {userDisplayName, userAvatarURL, loaded, userPronouns, counts} = props

  let {tabs} = props
  /*
  tab format:
  {
    full_url: ""
    html_url: "",
    id: "notifications",
    label: "Notifications",
    position: 1
    type: "internal"
  }
  */
  const video_external_tool_tab_id = `context_external_tool_${typeof ntuCoolLmsId !== 'undefined' ? ntuCoolLmsId : 0}`
  tabs = moveTabToUnderTarget(tabs, video_external_tool_tab_id, 'notifications')
  const announcements_external_tool_tab_id = `context_external_tool_${typeof announcementId !== 'undefined' ? announcementId : 0}`
  tabs = moveTabToUnderTarget(tabs, announcements_external_tool_tab_id, 'past_global_announcements')

  return (
    <View as="div" padding="medium">
      <View textAlign="center">
        <Avatar
          name={userDisplayName}
          src={userAvatarURL}
          alt={I18n.t('User profile picture')}
          size="x-large"
          display="block"
          margin="auto"
          data-fs-exclude={true}
        />
        <div style={{wordBreak: 'break-word'}}>
          <Heading level="h3" as="h2">
            {userDisplayName}
            {userPronouns && (
              <Text size="large" fontStyle="italic">
                &nbsp;({userPronouns})
              </Text>
            )}
          </Heading>
        </div>
        <LogoutButton size="small" margin="medium 0 x-small 0" />
      </View>
      <hr role="presentation" />
      <List isUnstyled={true} margin="none" itemSpacing="small">
        {loaded ? (
          tabs.map(tab => (
            <List.Item key={tab.id}>
              <ProfileTab {...tab} counts={counts} />
            </List.Item>
          ))
        ) : (
          <List.Item key="loading">
            <div style={{textAlign: 'center'}}>
              <Spinner margin="medium" renderTitle="Loading" />
            </div>
          </List.Item>
        )}
      </List>
      {/*
      <hr role="presentation" />
      <HighContrastModeToggle />
      */}
    </View>
  )
}

ProfileTray.propTypes = {
  userDisplayName: string.isRequired,
  userAvatarURL: string.isRequired,
  loaded: bool.isRequired,
  userPronouns: string,
  tabs: arrayOf(shape(ProfileTab.propTypes)).isRequired,
  counts: object.isRequired,
}
