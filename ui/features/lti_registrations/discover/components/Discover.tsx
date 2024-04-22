/*
 * Copyright (C) 2024 - present Instructure, Inc.
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

import React, {useEffect, useState} from 'react'
import {Flex} from '@instructure/ui-flex'
import ProductCard from './ProductCard'
import useSearch from '@canvas/outcomes/react/hooks/useSearch'
import {Button, IconButton} from '@instructure/ui-buttons'
import {IconEndSolid, IconFilterLine, IconSearchLine} from '@instructure/ui-icons'
import {useScope as useI18nScope} from '@canvas/i18n'
import LtiFilterTray from './LtiFilterTray'
import {View} from '@instructure/ui-view'
import {TextInput} from '@instructure/ui-text-input'
import {ScreenReaderContent} from '@instructure/ui-a11y-content'
import {useSearchParams} from 'react-router-dom'
import type {LtiFilter} from '../model/Filter'
import FilterTags from './FilterTags'

const product = {
  name: 'Product Name',
  company: 'Company',
  companyUrl: 'https://google.com',
  tagline: 'This product supports LTI 1.3',
  logoUrl:
    'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=',
}

// TODO: remove mock data
const filterValues: LtiFilter = {
  companies: [
    {
      id: 100,
      name: 'Praxis',
    },
    {
      id: 200,
      name: 'Khan Academy',
    },
  ],
  versions: [
    {
      id: 9465,
      name: 'LTI v1.1',
    },
    {
      id: 9494,
      name: 'LTI v1.3',
    },
  ],
  audience: [
    {
      id: 387,
      name: 'HiEd',
    },
    {
      id: 9495,
      name: 'K-12',
    },
  ],
}

export const Discover = () => {
  const I18n = useI18nScope('lti_registrations')
  const {search: searchString, onChangeHandler, onClearHandler} = useSearch()
  const [isTrayOpen, setIsTrayOpen] = useState(false)
  const [searchParams, _] = useSearchParams()
  const [filterIds, setFilterIds] = useState<number[]>([])

  useEffect(() => {
    onClearHandler()
    const queryParams = searchParams.get('filter')
    const params = queryParams ? JSON.parse(queryParams) : []
    const ids: number[] = Object.values(params) as number[]
    setFilterIds(ids)
  }, [onClearHandler, searchParams])

  const renderProducts = () => {
    const mock = [...Array(10)]
      .map(() => product)
      .filter(e => e.name.includes(searchString) || e.company.includes(searchString))
    return mock.map((_, i) => {
      const id = `test-id-${i}`
      return <ProductCard product={{...product, id}} key={id} />
    })
  }

  return (
    <div>
      <Flex gap="small" margin="0 0 small 0">
        <Flex.Item shouldGrow={true}>
          <View as="div">
            <TextInput
              renderLabel={
                <ScreenReaderContent>
                  {I18n.t('Search by extension name & company name')}
                </ScreenReaderContent>
              }
              placeholder="Search by extension name & company name"
              value={searchString}
              onChange={onChangeHandler}
              renderBeforeInput={<IconSearchLine inline={false} />}
              renderAfterInput={
                searchString ? (
                  <IconButton
                    size="small"
                    screenReaderLabel={I18n.t('Clear search field')}
                    withBackground={false}
                    withBorder={false}
                    onClick={onClearHandler}
                  >
                    <IconEndSolid size="x-small" data-testid="clear-search-icon" />
                  </IconButton>
                ) : null
              }
              shouldNotWrap={true}
            />
          </View>
        </Flex.Item>
        <Button
          data-testid="apply-filters-button"
          renderIcon={IconFilterLine}
          onClick={() => setIsTrayOpen(true)}
        >
          {I18n.t('Filters')}
        </Button>
      </Flex>
      <FilterTags filterValues={filterValues} />

      <h1>This is the Discover page</h1>
      <Flex gap="medium" wrap="wrap">
        {renderProducts()}
      </Flex>

      <LtiFilterTray
        isTrayOpen={isTrayOpen}
        setIsTrayOpen={setIsTrayOpen}
        filterValues={filterValues}
        filterIds={filterIds}
        setFilterIds={setFilterIds}
      />
    </div>
  )
}
