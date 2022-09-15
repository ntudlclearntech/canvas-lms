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

import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {DEFAULT_SETTINGS} from '../../../svg/constants'
import {ShapeSection} from '../ShapeSection'
import {createCroppedImageSvg} from '../ImageCropper/imageCropUtils'
import {convertFileToBase64} from '../../../svg/utils'

jest.mock('../ImageCropper/imageCropUtils', () => {
  return {
    createCroppedImageSvg: jest
      .fn()
      .mockImplementation(() => Promise.resolve({outerHTML: '<svg />'}))
  }
})

jest.mock('../../../svg/utils', () => {
  return {
    convertFileToBase64: jest
      .fn()
      .mockImplementation(() => Promise.resolve('data:image/svg+xml;base64,PHN2Zaaaaaaaaa'))
  }
})

function selectOption(button, option) {
  userEvent.click(
    screen.getByRole('button', {
      name: button
    })
  )
  userEvent.click(
    screen.getByRole('option', {
      name: option
    })
  )
}

describe('<ShapeSection />', () => {
  it('changes the icon shape', () => {
    const onChange = jest.fn()
    render(<ShapeSection settings={{...DEFAULT_SETTINGS, shape: 'circle'}} onChange={onChange} />)
    selectOption(/icon shape/i, /triangle/i)
    expect(onChange).toHaveBeenCalledWith({shape: 'triangle'})
  })

  it('changes the icon size', () => {
    const onChange = jest.fn()
    render(<ShapeSection settings={{...DEFAULT_SETTINGS, size: 'small'}} onChange={onChange} />)
    selectOption(/icon size/i, /extra small/i)
    expect(onChange).toHaveBeenCalledWith({size: 'x-small'})
  })

  describe('when there is an embedded image', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      shape: 'triangle',
      imageSettings: {
        cropperSettings: {}
      }
    }

    it('recrops the embedded image', () => {
      render(<ShapeSection settings={settings} onChange={() => {}} />)
      expect(createCroppedImageSvg).toHaveBeenCalledWith({shape: 'triangle'})
    })

    it('sets the encoded image to the newly cropped base64 encoded image', async () => {
      const onChange = jest.fn()
      render(<ShapeSection settings={settings} onChange={onChange} />)
      expect(convertFileToBase64).toHaveBeenCalled()
      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith({
          payload: 'data:image/svg+xml;base64,PHN2Zaaaaaaaaa',
          type: 'SetEncodedImage'
        })
      )
    })
  })
})
