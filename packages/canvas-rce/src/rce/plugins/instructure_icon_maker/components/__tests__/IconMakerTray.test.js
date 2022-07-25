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
import {render, fireEvent, screen, waitFor, act, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fetchMock from 'fetch-mock'
import {IconMakerTray} from '../IconMakerTray'
import {useStoreProps} from '../../../shared/StoreContext'
import FakeEditor from '../../../shared/__tests__/FakeEditor'
import RceApiSource from '../../../../../rcs/api'
import bridge from '../../../../../bridge'
import base64EncodedFont from '../../svg/font'

jest.mock('../../../../../bridge')
jest.mock('../../svg/font')
jest.mock('../../../../../rcs/api')
jest.mock('../../../shared/StoreContext')
jest.mock('../../utils/useDebouncedValue', () =>
  jest.requireActual('../../utils/__tests__/useMockedDebouncedValue')
)

const startIconMakerUpload = jest
  .fn()
  .mockResolvedValue({url: 'https://uploaded.url', display_name: 'untitled.svg'})

useStoreProps.mockReturnValue({startIconMakerUpload})

// The real font is massive so lets avoid it in snapshots
base64EncodedFont.mockReturnValue('data:;base64,')

const setIconColor = hex => {
  const input = screen.getByRole('textbox', {name: /icon color color picker/i})
  fireEvent.input(input, {target: {value: hex}})
}

describe('RCE "Icon Maker" Plugin > IconMakerTray', () => {
  const defaults = {
    onUnmount: jest.fn(),
    editing: false
  }

  let rcs

  const renderComponent = componentProps => {
    return render(<IconMakerTray {...componentProps} />)
  }

  const {confirm} = window.confirm

  beforeAll(() => {
    rcs = {
      getFile: jest.fn(() => Promise.resolve({name: 'Test Icon.svg'})),
      canvasUrl: 'https://domain.from.env'
    }

    RceApiSource.mockImplementation(() => rcs)

    delete window.confirm
    window.confirm = jest.fn(() => true)
  })

  afterAll(() => {
    window.confirm = confirm
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the create view', () => {
    renderComponent(defaults)
    screen.getByRole('heading', {name: /create icon/i})
  })

  it('closes the tray', async () => {
    const onUnmount = jest.fn()
    renderComponent({...defaults, onUnmount})
    userEvent.click(screen.getByText(/close/i))
    await waitFor(() => expect(onUnmount).toHaveBeenCalled())
  })

  it('does not close the tray when the user has unsaved changes', () => {
    const onUnmount = jest.fn()
    renderComponent({...defaults, onUnmount})
    // edit the icon before clicking on close
    setIconColor('#000000')
    userEvent.click(screen.getByText(/close/i))
    expect(window.confirm).toHaveBeenCalled()
  })

  it('inserts a placeholder when an icon is inserted', async () => {
    const {getByRole} = renderComponent(defaults)
    setIconColor('#000000')
    userEvent.click(getByRole('button', {name: /apply/i}))
    await waitFor(() => expect(bridge.embedImage).toHaveBeenCalled())
  })

  describe('when the user has not created a valid icon', () => {
    beforeEach(() => {
      render(<IconMakerTray {...defaults} />)
      userEvent.click(screen.getByRole('button', {name: /apply/i}))
    })

    it('does not fire off the icon upload callback', () => {
      expect(startIconMakerUpload).not.toHaveBeenCalled()
    })

    it('shows an error message', () => {
      const alertMessage = screen.getByText(/one of the following styles/i)
      expect(alertMessage).toBeInTheDocument()
    })
  })

  describe('focus management', () => {
    let focusedElement, originalFocus

    beforeAll(() => {
      originalFocus = window.HTMLElement.prototype.focus
    })

    beforeEach(() => {
      window.HTMLElement.prototype.focus = jest.fn().mockImplementation(function (args) {
        focusedElement = this
      })
    })

    afterEach(() => (window.HTMLElement.prototype.focus = originalFocus))

    describe('when the close button is focused', () => {
      describe('and the user does a forward tab', () => {
        const event = {key: 'Tab', keyCode: 9}

        it('moves focus to the "name" input', async () => {
          const {findByTestId} = render(<IconMakerTray {...defaults} />)
          const closeButton = await findByTestId('icon-maker-close-button')
          const expectedElement = await findByTestId('icon-name')
          fireEvent.keyDown(closeButton, event)
          expect(focusedElement).toEqual(expectedElement)
        })
      })

      describe('and the user does a reverse tab', () => {
        const event = {key: 'Tab', keyCode: 9, shiftKey: true}

        it('moves focus to the apply button', async () => {
          const {findByTestId} = render(<IconMakerTray {...defaults} />)
          const closeButton = await findByTestId('icon-maker-close-button')
          const expectedElement = await findByTestId('create-icon-button')
          fireEvent.keyDown(closeButton, event)
          expect(focusedElement).toEqual(expectedElement)
        })
      })
    })
  })

  describe('uploads the svg', () => {
    it('with correct content', async () => {
      render(<IconMakerTray {...defaults} />)

      setIconColor('#000000')
      userEvent.click(screen.getByRole('button', {name: /apply/i}))
      let firstCall
      await waitFor(() => {
        const result = startIconMakerUpload.mock.calls[0]
        if (startIconMakerUpload.mock.calls.length <= 0) throw new Error()
        firstCall = startIconMakerUpload.mock.calls[0][0]
        expect(result[1].onDuplicate).toBe(false)
      })

      expect(firstCall).toMatchInlineSnapshot(`
        Object {
          "domElement": <svg
            fill="none"
            height="122px"
            viewBox="0 0 122 122"
            width="122px"
            xmlns="http://www.w3.org/2000/svg"
          >
            <metadata>
              {"type":"image/svg+xml-icon-maker-icons","shape":"square","size":"small","color":"#000000","outlineColor":"#000000","outlineSize":"none","text":"","textSize":"small","textColor":"#000000","textBackgroundColor":null,"textPosition":"below","encodedImage":"","encodedImageType":"","encodedImageName":"","x":"50%","y":"50%","translateX":-54,"translateY":-54,"width":108,"height":108,"transform":"translate(-54,-54)","imageSettings":{"mode":"","image":"","imageName":"","icon":"","iconFillColor":"#000000","cropperSettings":null}}
            </metadata>
            <svg
              fill="none"
              height="122px"
              viewBox="0 0 122 122"
              width="122px"
              x="0"
            >
              <g
                fill="#000000"
                stroke="#000000"
                stroke-width="0"
              >
                <clippath
                  id="clip-path-for-embed"
                >
                  <rect
                    height="114"
                    width="114"
                    x="4"
                    y="4"
                  />
                </clippath>
                <rect
                  height="114"
                  width="114"
                  x="4"
                  y="4"
                />
              </g>
            </svg>
            <style
              type="text/css"
            >
              @font-face {font-family: "Lato Extended";font-weight: bold;src: url(data:;base64,);}
            </style>
          </svg>,
          "name": "untitled.svg",
        }
      `)

      await waitFor(() => expect(defaults.onUnmount).toHaveBeenCalled())
    })

    it('with overwrite if "replace all" is checked', async () => {
      const {getByTestId, getByRole} = render(<IconMakerTray {...defaults} editing />)

      setIconColor('#000000')

      act(() => {
        getByTestId('cb-replace-all').click()
      })

      act(() => {
        getByRole('button', {name: /save/i}).click()
      })

      await waitFor(() => {
        if (startIconMakerUpload.mock.calls.length <= 0) throw new Error()
        const result = startIconMakerUpload.mock.calls[0]
        expect(result[1].onDuplicate).toBe('overwrite')
      })
    })
  })

  describe('alt text handling', () => {
    describe('writes content to the editor', () => {
      it('with alt text when it is present', async () => {
        render(<IconMakerTray {...defaults} />)

        fireEvent.change(document.querySelector('#icon-alt-text'), {target: {value: 'banana'}})
        setIconColor('#000000')
        userEvent.click(screen.getByRole('button', {name: /apply/i}))
        await waitFor(() => expect(bridge.embedImage).toHaveBeenCalled())
        expect(bridge.embedImage.mock.calls[0][0]).toMatchInlineSnapshot(`
          Object {
            "STYLE": null,
            "alt_text": "banana",
            "data-download-url": "https://uploaded.url/?icon_maker_icon=1",
            "data-inst-icon-maker-icon": true,
            "display_name": "untitled.svg",
            "height": null,
            "isDecorativeImage": false,
            "src": "https://uploaded.url",
            "width": null,
          }
        `)

        await waitFor(() => expect(defaults.onUnmount).toHaveBeenCalled())
      })

      it('without alt attribute when no alt text entered', async () => {
        render(<IconMakerTray {...defaults} />)

        setIconColor('#000000')
        userEvent.click(screen.getByRole('button', {name: /apply/i}))
        await waitFor(() => expect(bridge.embedImage).toHaveBeenCalled())
        expect(bridge.embedImage.mock.calls[0][0]).toMatchInlineSnapshot(`
          Object {
            "STYLE": null,
            "alt_text": "",
            "data-download-url": "https://uploaded.url/?icon_maker_icon=1",
            "data-inst-icon-maker-icon": true,
            "display_name": "untitled.svg",
            "height": null,
            "isDecorativeImage": false,
            "src": "https://uploaded.url",
            "width": null,
          }
        `)

        await waitFor(() => expect(defaults.onUnmount).toHaveBeenCalled())
      })

      it('with alt="" if is decorative', async () => {
        render(<IconMakerTray {...defaults} />)
        setIconColor('#000000')
        userEvent.click(screen.getByRole('checkbox', {name: /Decorative Icon/}))
        userEvent.click(screen.getByRole('button', {name: /apply/i}))
        await waitFor(() => expect(bridge.embedImage).toHaveBeenCalled())
        expect(bridge.embedImage.mock.calls[0][0]).toMatchInlineSnapshot(`
          Object {
            "STYLE": null,
            "alt_text": "",
            "data-download-url": "https://uploaded.url/?icon_maker_icon=1",
            "data-inst-icon-maker-icon": true,
            "display_name": "untitled.svg",
            "height": null,
            "isDecorativeImage": true,
            "src": "https://uploaded.url",
            "width": null,
          }
        `)
      })
    })
  })

  describe('the "replace all instances" checkbox', () => {
    it('disables the name field when checked', async () => {
      const {getByTestId} = render(<IconMakerTray {...defaults} editing />)

      act(() => getByTestId('cb-replace-all').click())

      await waitFor(() => expect(getByTestId('icon-name')).toBeDisabled())
    })

    it('does not disable the name field when not checked', async () => {
      const {getByTestId} = render(<IconMakerTray {...defaults} editing />)

      await waitFor(() => expect(getByTestId('icon-name')).not.toBeDisabled())
    })

    it('does not disable the name field on new icons', async () => {
      const {getByTestId} = render(<IconMakerTray {...defaults} />)

      await waitFor(() => expect(getByTestId('icon-name')).not.toBeDisabled())
    })
  })

  describe('when submitting', () => {
    it('disables the footer', async () => {
      render(<IconMakerTray {...defaults} />)

      setIconColor('#000000')
      const button = screen.getByRole('button', {name: /apply/i})
      userEvent.click(button)

      await waitFor(() => expect(button).toBeDisabled())
      await waitFor(() => expect(defaults.onUnmount).toHaveBeenCalled(), {
        timeout: 3000
      })
    })

    it('shows a spinner', async () => {
      const {getByText, getByRole} = render(<IconMakerTray {...defaults} />)

      setIconColor('#000000')
      const button = getByRole('button', {name: /apply/i})
      userEvent.click(button)

      const spinner = getByText('Loading...')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('when an icon is being created', () => {
    let ed

    beforeEach(() => {
      ed = new FakeEditor()
    })

    const subject = () =>
      render(
        <IconMakerTray
          onClose={jest.fn()}
          editor={ed}
          rceConfig={{contextType: 'course', contextId: 2}}
        />
      )

    it('loads the standard SVG metadata', async () => {
      const {getByLabelText, getAllByTestId} = subject()

      await waitFor(() => {
        expect(getByLabelText('Name').value).toEqual('')
        expect(getByLabelText('Icon Shape').value).toEqual('Square')
        expect(getByLabelText('Icon Size').value).toEqual('Small')
        expect(getAllByTestId('colorPreview-none').length).toBeGreaterThan(0)
        expect(getByLabelText('Outline Size').value).toEqual('None')
      })
    })
  })

  describe('when an icon is being edited', () => {
    let ed

    beforeEach(() => {
      ed = new FakeEditor()
      // Add an image to the editor and select it
      ed.setContent(
        '<img id="test-image" src="https://canvas.instructure.com/svg" data-inst-icon-maker-icon="true" data-download-url="https://canvas.instructure.com/files/1/download" alt="a red circle" />'
      )
      ed.setSelectedNode(ed.dom.select('#test-image')[0])
    })

    const subject = () =>
      render(
        <IconMakerTray
          onClose={jest.fn()}
          editing
          editor={ed}
          rcsConfig={{
            contextType: 'course',
            contextId: 2,
            canvasUrl: 'https://canvas.instructure.com'
          }}
        />
      )

    beforeEach(() => {
      fetchMock.mock('*', {
        body: `
          <svg height="100" width="100">
            <metadata>
              {
                "alt":"a test image",
                "shape":"triangle",
                "size":"large",
                "color":"#FF2717",
                "outlineColor":"#06A3B7",
                "outlineSize":"small",
                "text":"Some Text",
                "textSize":"medium",
                "textColor":"#009606",
                "textBackgroundColor":"#E71F63",
                "textPosition":"below"
              }
            </metadata>
            <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red"/>
          </svg>`
      })
    })

    afterEach(() => {
      jest.restoreAllMocks()
      fetchMock.restore()
    })

    it('renders the edit view', () => {
      expect(subject().getByRole('heading', {name: /edit icon/i})).toBeInTheDocument()
    })

    it('inserts a placeholder when an icon is saved', async () => {
      const {getByRole} = subject()
      await waitFor(() => getByRole('textbox', {name: /icon color color picker/i}))
      setIconColor('#000000')
      userEvent.click(getByRole('button', {name: /save/i}))
      await waitFor(() => expect(bridge.embedImage).toHaveBeenCalled())
    })

    it('loads the standard SVG metadata', async () => {
      const {getByLabelText, getByTestId} = subject()

      await waitFor(() => {
        expect(getByLabelText('Name').value).toEqual('Test Icon')
        expect(getByLabelText('Icon Shape').value).toEqual('Triangle')
        expect(getByLabelText('Icon Size').value).toEqual('Large')
        expect(getByTestId('colorPreview-#FF2717')).toBeInTheDocument() // icon color
        expect(getByTestId('colorPreview-#06A3B7')).toBeInTheDocument() // icon outline
        expect(getByLabelText('Outline Size').value).toEqual('Small')
      })
    })

    it('loads the text-related SVG metadata', async () => {
      const {getByLabelText, getByTestId, getByText} = subject()

      await waitFor(() => {
        expect(getByText('Some Text')).toBeInTheDocument()
        expect(getByLabelText('Text Size').value).toEqual('Medium')
        expect(getByTestId('colorPreview-#009606')).toBeInTheDocument() // text color
        expect(getByTestId('colorPreview-#E71F63')).toBeInTheDocument() // text background color
        expect(getByLabelText('Text Position').value).toEqual('Below')
      })
    })

    describe('when an icon has styling from RCE', () => {
      beforeEach(() => {
        // Add an image to the editor and select it
        ed.setContent(
          '<img style="display:block; margin-left:auto; margin-right:auto;" width="156" height="134" id="test-image" src="https://canvas.instructure.com/svg" data-inst-icon-maker-icon="true" data-download-url="https://canvas.instructure.com/files/1/download" alt="one blue pine" />'
        )
        ed.setSelectedNode(ed.dom.select('#test-image')[0])
      })

      it('checks that the icon keeps attributes from RCE', async () => {
        const {getByRole} = subject()
        await waitFor(() => getByRole('textbox', {name: /icon color color picker/i}))
        setIconColor('#000000')
        expect(getByRole('button', {name: /save/i})).toBeEnabled()
        userEvent.click(getByRole('button', {name: /save/i}))
        await waitFor(() => expect(bridge.embedImage).toHaveBeenCalled())
        expect(bridge.embedImage.mock.calls[0][0]).toMatchInlineSnapshot(`
          Object {
            "STYLE": "display:block; margin-left:auto; margin-right:auto;",
            "alt_text": "one blue pine",
            "data-download-url": "https://uploaded.url/?icon_maker_icon=1",
            "data-inst-icon-maker-icon": true,
            "display_name": "untitled.svg",
            "height": "134",
            "isDecorativeImage": false,
            "src": "https://uploaded.url",
            "width": "156",
          }
        `)
      })
    })

    describe('when loading the tray', () => {
      let isLoading

      beforeAll(() => {
        isLoading = IconMakerTray.isLoading
        IconMakerTray.isLoading = jest.fn()
      })

      afterAll(() => {
        IconMakerTray.isLoading = isLoading
      })

      it('renders a spinner', () => {
        IconMakerTray.isLoading.mockReturnValueOnce(true)
        const {getByText} = subject()
        const spinner = getByText('Loading...')
        expect(spinner).toBeInTheDocument()
      })
    })
  })

  describe('color inputs', () => {
    const getNoneColorOptionFor = popoverTestId => {
      const {getByTestId} = renderComponent()
      const dropdownArrow = getByTestId(`${popoverTestId}-trigger`)
      userEvent.click(dropdownArrow)
      const popover = getByTestId(popoverTestId)
      return within(popover).queryByRole('button', {name: /none/i})
    }

    describe('have no none option when', () => {
      it('they represent outline color', () => {
        const noneColorOption = getNoneColorOptionFor('icon-outline-popover')
        expect(noneColorOption).not.toBeInTheDocument()
      })

      it('they represent text color', () => {
        const noneColorOption = getNoneColorOptionFor('icon-text-color-popover')
        expect(noneColorOption).not.toBeInTheDocument()
      })

      it('they represent single color image', async () => {
        const {getByText, getByTestId} = renderComponent()
        const addImageButton = getByText('Add Image')
        userEvent.click(addImageButton)
        const singleColorOption = getByText('Single Color Image')
        userEvent.click(singleColorOption)
        const artIcon = await waitFor(() => getByTestId('icon-maker-art'))
        userEvent.click(artIcon)
        const noneColorOption = getNoneColorOptionFor('single-color-image-fill-popover')
        expect(noneColorOption).not.toBeInTheDocument()
      })
    })

    describe('have a none option when', () => {
      it('they represent icon color', () => {
        const noneColorOption = getNoneColorOptionFor('icon-color-popover')
        expect(noneColorOption).toBeInTheDocument()
      })

      it('they represent text background color', () => {
        const noneColorOption = getNoneColorOptionFor('icon-text-background-color-popover')
        expect(noneColorOption).toBeInTheDocument()
      })
    })
  })
})
