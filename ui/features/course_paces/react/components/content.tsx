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

import React, {useState, useEffect, useRef} from 'react'
import {connect} from 'react-redux'
import {Tabs} from '@instructure/ui-tabs'
import {useScope as useI18nScope} from '@canvas/i18n'
import {paceContextsActions} from '../actions/pace_contexts'
import {actions as uiActions} from '../actions/ui'
import {
  APIPaceContextTypes,
  PaceContext,
  PaceContextTypes,
  ResponsiveSizes,
  StoreState,
} from '../types'
import PaceContextsTable from './pace_contexts_table'
import {getResponsiveSize} from '../reducers/ui'

const I18n = useI18nScope('course_paces_app')

const {Panel: TabPanel} = Tabs as any

interface PaceContextsContentProps {
  currentPage: number
  paceContexts: PaceContext[]
  fetchPaceContexts: (contextType: APIPaceContextTypes, page?: number) => void
  selectedContextType: APIPaceContextTypes
  setSelectedContextType: (selectedContextType: APIPaceContextTypes) => void
  setSelectedModalContext: (contextType: PaceContextTypes, contextId: string) => void
  pageCount: number
  setPage: (page: number) => void
  isLoading: boolean
  responsiveSize: ResponsiveSizes
}

export const PaceContent = ({
  currentPage,
  paceContexts,
  fetchPaceContexts,
  selectedContextType,
  setSelectedModalContext,
  setSelectedContextType,
  pageCount,
  setPage,
  isLoading,
  responsiveSize,
}: PaceContextsContentProps) => {
  const [tab, setTab] = useState('tab-section')
  const currentTypeRef = useRef<string | null>(null)

  useEffect(() => {
    let page = currentPage
    // if switching tabs set page to 1
    if (currentTypeRef.current !== selectedContextType) {
      page = 1
      currentTypeRef.current = selectedContextType
    }
    fetchPaceContexts(selectedContextType, page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContextType, currentPage])

  const changeTab = (_ev, {id}) => {
    setTab(id)
    const type = id.split('-')
    setSelectedContextType(type[1])
  }

  return (
    <Tabs onRequestTabChange={changeTab}>
      <TabPanel
        key="tab-section"
        renderTitle={I18n.t('Sections')}
        id="tab-section"
        isSelected={tab === 'tab-section'}
        padding="none"
      >
        <PaceContextsTable
          contextType="section"
          handleContextSelect={setSelectedModalContext}
          currentPage={currentPage}
          paceContexts={paceContexts}
          pageCount={pageCount}
          setPage={setPage}
          isLoading={isLoading}
          responsiveSize={responsiveSize}
        />
      </TabPanel>
      <TabPanel
        key="tab-student_enrollment"
        renderTitle={I18n.t('Students')}
        id="tab-student_enrollment"
        isSelected={tab === 'tab-student_enrollment'}
        padding="none"
      >
        <PaceContextsTable
          contextType="student_enrollment"
          handleContextSelect={setSelectedModalContext}
          currentPage={currentPage}
          paceContexts={paceContexts}
          pageCount={pageCount}
          setPage={setPage}
          isLoading={isLoading}
          responsiveSize={responsiveSize}
        />
      </TabPanel>
    </Tabs>
  )
}

const mapStateToProps = (state: StoreState) => ({
  paceContexts: state.paceContexts.entries,
  pageCount: state.paceContexts.pageCount,
  currentPage: state.paceContexts.page,
  isLoading: state.paceContexts.isLoading,
  selectedContextType: state.paceContexts.selectedContextType,
  responsiveSize: getResponsiveSize(state),
})

export default connect(mapStateToProps, {
  setPage: paceContextsActions.setPage,
  fetchPaceContexts: paceContextsActions.fetchPaceContexts,
  setSelectedContextType: paceContextsActions.setSelectedContextType,
  setSelectedModalContext: uiActions.setSelectedPaceContext,
})(PaceContent)
