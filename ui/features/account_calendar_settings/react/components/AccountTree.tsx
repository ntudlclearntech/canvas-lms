/*
 * Copyright (C) 2022 - present Instructure, Inc.
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

import React, {useState, useEffect} from 'react'

import {ApplyTheme} from '@instructure/ui-themeable'
import {Flex} from '@instructure/ui-flex'
import {IconMiniArrowEndSolid, IconMiniArrowDownSolid} from '@instructure/ui-icons'
import {Spinner} from '@instructure/ui-spinner'
import {TreeBrowser} from '@instructure/ui-tree-browser'
import {View} from '@instructure/ui-view'

import doFetchApi from '@canvas/do-fetch-api-effect'
import {useScope as useI18nScope} from '@canvas/i18n'
import {showFlashError} from '@canvas/alerts/react/FlashAlert'

import {addAccountsToTree} from '../utils'
import {AccountCalendarItem} from './AccountCalendarItem'
import {CollectionChild, Collection, AccountData, VisibilityChange} from '../types'
import {treeBrowserTheme} from '../theme'

const I18n = useI18nScope('account_calendar_settings_account_tree')

type ComponentProps = {
  readonly originAccountId: number
  readonly visibilityChanges: VisibilityChange[]
  readonly onAccountToggled: (id: number, visible: boolean) => void
  readonly showSpinner: boolean
}

// Doing this to avoid TS2339 errors-- remove once we're on InstUI 8
const {Node: TreeBrowserNode} = TreeBrowser as any

export const AccountTree: React.FC<ComponentProps> = ({
  originAccountId,
  visibilityChanges,
  onAccountToggled,
  showSpinner
}) => {
  const [expandedCollectionIds, setExpandedCollectionIds] = useState<number[]>([])
  const [collections, setCollections] = useState<Collection>({})
  const [loadingCollectionIds, setLoadingCollectionIds] = useState<number[]>([originAccountId])

  const renderItems = (items: CollectionChild[]) => (
    <>
      {items.map(item => (
        <TreeBrowserNode variant="indent" key={`tree_item_${item.id}`}>
          <AccountCalendarItem
            item={item}
            visibilityChanges={visibilityChanges}
            onAccountToggled={onAccountToggled}
            padding="xx-small"
          />
        </TreeBrowserNode>
      ))}
    </>
  )

  const renderLoadingItem = () => (
    <TreeBrowserNode variant="indent">
      <Spinner renderTitle={I18n.t('Loading sub-accounts')} size="x-small" />
    </TreeBrowserNode>
  )

  const receivedAccountData = accounts => {
    setCollections(addAccountsToTree(accounts, collections, originAccountId))
    // expand the root by default
    if (expandedCollectionIds.length === 0) {
      setExpandedCollectionIds([originAccountId])
    }
  }

  const fetchAccountData = (
    accountId,
    nextLink?: string,
    accumulatedResults: AccountData[] = []
  ) => {
    setLoadingCollectionIds([...loadingCollectionIds, accountId])
    doFetchApi({
      path: nextLink || `/api/v1/accounts/${accountId}/account_calendars`,
      params: {
        ...(nextLink == null && {per_page: 100})
      }
    })
      .then(({json, link}) => {
        const accountData = accumulatedResults.concat(json || [])
        if (link?.next) {
          fetchAccountData(accountId, link.next.url, accountData)
        } else {
          receivedAccountData(accountData)
          setLoadingCollectionIds(loadingCollectionIds.filter(id => id !== accountId))
        }
      })
      .catch(showFlashError(I18n.t("Couldn't load account calendar settings")))
  }

  useEffect(() => {
    fetchAccountData(originAccountId)
    // this should run on first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCollectionToggle = (collection: {id: number; expanded: boolean}) => {
    if (collection.expanded && collections[collection.id].children.length === 1) {
      fetchAccountData(collection.id)
    }
    setExpandedCollectionIds(
      collection.expanded
        ? [...expandedCollectionIds, collection.id]
        : expandedCollectionIds.filter(nodeId => nodeId !== collection.id)
    )
  }

  if (loadingCollectionIds.includes(originAccountId) || showSpinner) {
    return (
      <Flex as="div" alignItems="center" justifyItems="center" padding="x-large">
        <Spinner renderTitle={I18n.t('Loading accounts')} />
      </Flex>
    )
  }

  const renderedCollections = {...collections}
  for (const id in renderedCollections) {
    renderedCollections[id].renderBeforeItems = loadingCollectionIds.includes(parseInt(id, 10))
      ? renderLoadingItem()
      : renderItems(renderedCollections[id].children)
  }

  return (
    <View as="div" padding="small">
      <ApplyTheme theme={treeBrowserTheme}>
        <div id="account-tree">
          <TreeBrowser
            variant="indent"
            selectionType="none"
            treeLabel={I18n.t(
              'Accounts tree: navigate the accounts tree hierarchically to toggle account calendar visibility'
            )}
            showRootCollection
            collections={renderedCollections}
            items={{}}
            rootId={originAccountId}
            expanded={expandedCollectionIds}
            onCollectionToggle={handleCollectionToggle}
            collectionIcon={IconMiniArrowEndSolid}
            collectionIconExpanded={IconMiniArrowDownSolid}
            itemIcon={null}
          />
        </div>
      </ApplyTheme>
    </View>
  )
}
