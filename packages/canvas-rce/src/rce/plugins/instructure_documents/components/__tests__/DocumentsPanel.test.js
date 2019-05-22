/*
 * Copyright (C) 2019 - present Instructure, Inc.
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
import {render} from 'react-testing-library'
import DocumentsPanel from '../DocumentsPanel'

function renderComponent(props) {
  return render(
    <DocumentsPanel
      documents={{
        bookmark: "http://next.docs/",
        files: [],
        hasMore: true,
        isLoading: false,
      }}
      fetchInitialDocs={() => {}}
      fetchNextDocs={() => {}}
      onLinkClick={() => {}}
      {...props}
    />
  )
}

function makeDocuments(override) {
  return {
    files: [1,2].map(i => {
      return {
        id: i,
        filename: `file${i}.txt`,
        content_type: 'text/plain',
        display_name: `file${i}`,
        href: `http://the.net/${i}`,
        date: `2019-05-25T13:0${i}:00Z`,
      }
    }),
    bookmark: null,
    hasMore: false,
    isLoading: false,
    ...override
  }
}

describe('RCE "Documents" Plugin > DocumentsPanel', () => {
  it('renders empty notice', () => {
    const {getByText} = renderComponent({documents: {files: [], isLoading: false, hasMore: false}})
    expect(getByText('No results.')).toBeInTheDocument()
  })

  it('renders loading spinner', () => {
    const {getByText} = renderComponent({documents: {files: [], isLoading: true}})
    expect(getByText('Loading...')).toBeInTheDocument()
  })

  it('renders documents', () => {
    const {getByText, getAllByTestId} = renderComponent({
      documents: makeDocuments()
    })

    expect(getAllByTestId('instructure_links-Link')).toHaveLength(2)
    expect(getByText('file1')).toBeInTheDocument()
    expect(getByText('file2')).toBeInTheDocument()
  })

  it('renders load more button if there is more', () => {
    const {getByText} = renderComponent({
      documents: makeDocuments({hasMore: true, bookmark: 'next.docs'})
    })

    expect(getByText('Load More')).toBeInTheDocument()
  })

  it('fetches initial data when mounted', () => {
    const fetchInitialDocs = jest.fn()
    renderComponent({
      fetchInitialDocs
    })

    expect(fetchInitialDocs).toHaveBeenCalled()
  })

  it('fetches more when the load more button is clicked', () => {
    const fetchNextDocs = jest.fn()
    const {getByText} = renderComponent({
      documents: makeDocuments({hasMore: true, bookmark: 'more.docs'}),
      fetchNextDocs
    })

    const loadMoreBtn = getByText('Load More')
    loadMoreBtn.click()
    expect(fetchNextDocs).toHaveBeenCalled()
  })

  it('shows an error message if the fetch failed', () => {
    const fetchNextDocs = jest.fn()
    const {getByText} = renderComponent({
      documents: makeDocuments({error: 'whoops'}),
      fetchNextDocs
    })

    expect(getByText('Loading failed.')).toBeInTheDocument()
  })

  it('shows spinner during initial load', () => {
    const fetchInitialDocs = jest.fn()
    const {getByText} = renderComponent({
      documents: makeDocuments({files: [], isLoading: true}),
      fetchInitialDocs
    })

    expect(getByText('Loading...')).toBeInTheDocument()
  })


  it('shows spinner while loading more', () => {
    const fetchNextDocs = jest.fn()
    const {getByText} = renderComponent({
      documents: makeDocuments({isLoading: true, hasMore: true}),
      fetchNextDocs
    })

    expect(getByText('Loading...')).toBeInTheDocument()
  })
})
