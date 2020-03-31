/*
 * Copyright (C) 2020 - present Instructure, Inc.
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
import {render, fireEvent} from '@testing-library/react'
import Modal from 'react-modal'
import UploadForm from '../UploadForm'

function formProps(overrides) {
  return {
    currentFolder: {files: {models: []}},
    contextId: '1',
    contextType: 'user',
    ...overrides
  }
}

describe('Files UploadForm', () => {
  beforeEach(() => {
    // we don't want any files actually queued for upload
    const spy = jest.spyOn(UploadForm.prototype, 'queueUploads')
    spy.mockReturnValue(null)
  })

  it('renders the file input form', () => {
    const {container} = render(<UploadForm {...formProps()} />)
    const form = container.querySelector('form')
    expect(form).toBeInTheDocument()
    expect(form.classList.contains('hidden')).toBeTruthy()
  })

  it('enqueues uploads when files are available', function() {
    const {getByTestId} = render(<UploadForm {...formProps()} />)
    expect(UploadForm.prototype.queueUploads).toHaveBeenCalledTimes(0)

    const fileInput = getByTestId('file-input')
    const file = new File(['foo'], 'foo.txt', {type: 'text/plain'})
    fireEvent.change(fileInput, {target: {files: [file]}})

    expect(UploadForm.prototype.queueUploads).toHaveBeenCalledTimes(1)
  })

  it('shows file rename modal when necessary', () => {
    const {getByTestId, getByText} = render(
      <UploadForm
        {...formProps({
          currentFolder: {
            files: {
              models: [
                {
                  display_name: 'foo.txt',
                  get: what => (what === 'display_name' ? 'foo.txt' : false)
                }
              ]
            }
          }
        })}
      />
    )
    Modal.setAppElement('body')

    // upload an existing file
    const file = new File(['foo'], 'foo.txt', {type: 'text/plain'})
    const fileInput = getByTestId('file-input')
    fireEvent.change(fileInput, {target: {files: [file]}})

    const renameModal = getByText('An item named "foo.txt" already exists in this location.', {
      exact: false
    })
    expect(renameModal).toBeInTheDocument()
    fireEvent.click(getByText('Replace'))
  })

  it('shows zip file modal when necessary', () => {
    const {getByTestId, getByText} = render(<UploadForm {...formProps()} />)
    Modal.setAppElement('body')

    // upload a zip file
    const file = new File(['foo'], 'foo.zip', {type: 'application/zip'})
    const fileInput = getByTestId('file-input')
    fireEvent.change(fileInput, {target: {files: [file]}})

    const zipModal = getByText('Would you like to expand the contents of "foo.zip"', {exact: false})
    expect(zipModal).toBeInTheDocument()
    fireEvent.click(getByText('Upload It'))
  })
})
