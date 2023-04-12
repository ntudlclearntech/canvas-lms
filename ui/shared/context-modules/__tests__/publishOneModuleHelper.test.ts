/*
 * Copyright (C) 2023 - present Instructure, Inc.
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

import {getByText, waitFor} from '@testing-library/dom'
import doFetchApi from '@canvas/do-fetch-api-effect'
import {updateModuleItem} from '@canvas/context-modules/jquery/utils'
import publishModuleItemHelperModule from '../utils/publishOneModuleHelper'
import {makeModuleWithItems} from './testHelpers'

const {
  batchUpdateOneModuleApiCall,
  disableContextModulesPublishMenu,
  fetchModuleItemPublishedState,
  renderContextModulesPublishIcon,
  publishModule,
  unpublishModule,
  updateModuleItemsPublishedStates,
} = {
  ...publishModuleItemHelperModule,
}

jest.mock('@canvas/do-fetch-api-effect')

jest.mock('@canvas/context-modules/jquery/utils', () => {
  const originalModule = jest.requireActual('@canvas/context-modules/jquery/utils')
  return {
    __esmodule: true,
    ...originalModule,
    updateModuleItem: jest.fn(),
  }
})

const updatePublishMenuDisabledState = jest.fn()

describe('publishOneModuleHelper', () => {
  beforeAll(() => {
    // @ts-expect-error
    window.modules = {
      updatePublishMenuDisabledState,
    }
  })

  beforeEach(() => {
    doFetchApi.mockResolvedValue({response: {ok: true}, json: {published: true}})
  })

  afterEach(() => {
    jest.clearAllMocks()
    doFetchApi.mockReset()
    document.body.innerHTML = ''
  })

  describe('publishModule', () => {
    let spy
    beforeEach(() => {
      spy = jest.spyOn(publishModuleItemHelperModule, 'batchUpdateOneModuleApiCall')
      makeModuleWithItems(1, false)
    })
    afterEach(() => {
      spy.mockRestore()
    })
    it('calls batchUpdateOneModuleApiCall with the correct argumets', () => {
      const spy = jest.spyOn(publishModuleItemHelperModule, 'batchUpdateOneModuleApiCall')
      const courseId = 1
      const moduleId = 1
      let skipItems = false
      publishModule(courseId, moduleId, skipItems)
      expect(spy).toHaveBeenCalledWith(
        courseId,
        moduleId,
        true,
        skipItems,
        'Publishing module and items',
        'Module and items published'
      )
      spy.mockClear()
      skipItems = true
      publishModule(courseId, moduleId, skipItems)
      expect(spy).toHaveBeenCalledWith(
        courseId,
        moduleId,
        true,
        skipItems,
        'Publishing module',
        'Module published'
      )
    })
  })

  describe('unpublishModule', () => {
    let spy
    beforeEach(() => {
      spy = jest.spyOn(publishModuleItemHelperModule, 'batchUpdateOneModuleApiCall')
      makeModuleWithItems(1, false)
    })
    afterEach(() => {
      spy.mockRestore()
    })
    it('calls batchUpdateOneModuleApiCall with the correct argumets', () => {
      const courseId = 1
      const moduleId = 1
      unpublishModule(courseId, moduleId)
      expect(spy).toHaveBeenCalledWith(
        courseId,
        moduleId,
        false,
        false,
        'Unpublishing module and items',
        'Module and items unpublished'
      )
    })
  })

  describe('batchUpdateOneModuleApiCall', () => {
    let spy
    beforeEach(() => {
      makeModuleWithItems(1, false)
      makeModuleWithItems(2, true)
    })
    afterEach(() => {
      spy?.mockRestore()
    })

    it('PUTS the batch request then GETs the updated results', async () => {
      await batchUpdateOneModuleApiCall(1, 2, false, true, 'loading message', 'success message')

      expect(doFetchApi).toHaveBeenCalledTimes(2)
      expect(doFetchApi).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          path: '/api/v1/courses/1/modules/2',
          body: {
            module: {
              published: false,
              skip_content_tags: true,
            },
          },
        })
      )
      expect(doFetchApi).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          path: '/api/v1/courses/1/modules/2/items',
        })
      )
    })

    it('disables the "Publish All" button while running', async () => {
      spy = jest.spyOn(publishModuleItemHelperModule, 'disableContextModulesPublishMenu')
      await batchUpdateOneModuleApiCall(1, 2, false, true, 'loading message', 'success message')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith(true)
      expect(spy).toHaveBeenCalledWith(false)
    })

    it('renders the modules publish button', async () => {
      spy = jest.spyOn(publishModuleItemHelperModule, 'renderContextModulesPublishIcon')
      await batchUpdateOneModuleApiCall(1, 2, false, true, 'loading message', 'success message')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith(1, 2, true, true, 'loading message')
      expect(spy).toHaveBeenCalledWith(1, 2, true, false, 'loading message')
    })

    it('updates the module items when skipping item update', async () => {
      spy = jest.spyOn(publishModuleItemHelperModule, 'updateModuleItemsPublishedStates')
      await batchUpdateOneModuleApiCall(1, 1, true, true, 'loading message', 'success message')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith(1, undefined, true)
      expect(spy).toHaveBeenCalledWith(1, undefined, false)
    })

    it('updates the module items when publishing item update', async () => {
      spy = jest.spyOn(publishModuleItemHelperModule, 'updateModuleItemsPublishedStates')
      await batchUpdateOneModuleApiCall(1, 1, true, false, 'loading message', 'success message')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith(1, undefined, true)
      expect(spy).toHaveBeenCalledWith(1, true, false)
    })
  })

  describe('updateModulePublishedStates', () => {
    beforeEach(() => {
      makeModuleWithItems(1)
      makeModuleWithItems(2)
    })

    it('calls updateModuleItemsPublishedStates', () => {
      const published = true
      const isPublishing = false
      updateModuleItemsPublishedStates(1, published, isPublishing)
      expect(updateModuleItem).toHaveBeenCalledTimes(2)
      expect(updateModuleItem).toHaveBeenCalledWith(
        expect.objectContaining({assignment_117: expect.any(Array)}),
        expect.objectContaining({published, bulkPublishInFlight: isPublishing}),
        expect.anything()
      )
      expect(updateModuleItem).toHaveBeenCalledWith(
        expect.objectContaining({assignment_119: expect.any(Array)}),
        expect.objectContaining({published, bulkPublishInFlight: isPublishing}),
        expect.anything()
      )
    })
  })

  describe('updateModuleItemsPublishedStates', () => {
    beforeEach(() => {
      makeModuleWithItems(1)
    })

    it('calls updateModuleItem for each module item', () => {
      const published = true
      const isPublishing = false
      updateModuleItemsPublishedStates(1, published, isPublishing)
      expect(updateModuleItem).toHaveBeenCalledTimes(2)
      expect(updateModuleItem).toHaveBeenCalledWith(
        expect.objectContaining({assignment_117: expect.any(Object)}),
        {published, bulkPublishInFlight: isPublishing},
        expect.any(Object)
      )
      expect(updateModuleItem).toHaveBeenCalledWith(
        expect.objectContaining({assignment_119: expect.any(Object)}),
        {published, bulkPublishInFlight: isPublishing},
        expect.any(Object)
      )
    })

    it('does not change published state if undefined', () => {
      const published = undefined
      const isPublishing = true
      updateModuleItemsPublishedStates(1, published, isPublishing)
      expect(updateModuleItem).toHaveBeenCalledTimes(2)
      expect(updateModuleItem).toHaveBeenCalledWith(
        expect.objectContaining({assignment_117: expect.any(Object)}),
        {bulkPublishInFlight: isPublishing},
        expect.any(Object)
      )
      expect(updateModuleItem).toHaveBeenCalledWith(
        expect.objectContaining({assignment_119: expect.any(Object)}),
        {bulkPublishInFlight: isPublishing},
        expect.any(Object)
      )
    })
  })

  describe('fetchModuleItemPublishedState', () => {
    beforeEach(() => {
      doFetchApi.mockReset()
      doFetchApi.mockResolvedValue({response: {ok: true}, json: [], link: null})
    })
    it('GETs the module item states', () => {
      fetchModuleItemPublishedState(7, 8)
      expect(doFetchApi).toHaveBeenCalledTimes(1)
      expect(doFetchApi).toHaveBeenCalledWith({
        method: 'GET',
        path: '/api/v1/courses/7/modules/8/items',
      })
    })
    it('exhausts paginated responses', async () => {
      doFetchApi.mockResolvedValueOnce({
        response: {ok: true},
        json: [{id: 1, published: true}],
        link: {next: {url: '/another/page'}},
      })

      fetchModuleItemPublishedState(7, 8)
      await waitFor(() => expect(doFetchApi).toHaveBeenCalledTimes(2))
      expect(doFetchApi).toHaveBeenLastCalledWith({
        method: 'GET',
        path: '/another/page',
      })
    })
  })

  describe('disableContextModulesPublishMenu', () => {
    it('calls the global function', () => {
      disableContextModulesPublishMenu(true)
      expect(updatePublishMenuDisabledState).toHaveBeenCalledWith(true)
      updatePublishMenuDisabledState.mockReset()
      disableContextModulesPublishMenu(false)
      expect(updatePublishMenuDisabledState).toHaveBeenCalledWith(false)
    })
  })

  describe('renderContextModulesPublishIcon', () => {
    beforeEach(() => {
      makeModuleWithItems(2, false)
    })
    it('renders the ContextModulesPublishIcon', () => {
      renderContextModulesPublishIcon(1, 2, true, false, 'loading message')
      expect(getByText(document.body, 'Module publish menu')).toBeInTheDocument()
    })
  })
})
