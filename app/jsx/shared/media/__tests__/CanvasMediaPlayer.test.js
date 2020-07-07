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
import {render, wait, fireEvent, act} from '@testing-library/react'
import {queries as domQueries} from '@testing-library/dom'
import CanvasMediaPlayer, {setPlayerSize} from '../CanvasMediaPlayer'
import {uniqueId} from 'lodash'

const defaultMediaObject = (overrides = {}) => ({
  bitrate: '12345',
  content_type: 'video/mp4',
  fileExt: 'mp4',
  height: '500',
  isOriginal: 'false',
  size: '3123123123',
  src: uniqueId('anawesomeurl-') + '.test',
  label: 'an awesome label',
  width: '1000',
  ...overrides
})

describe('CanvasMediaPlayer', () => {
  beforeAll(() => {
    // put the flash_screenreader_holder into the dom
    let d = document.createElement('div')
    d.id = 'flash_screenreader_holder'
    d.setAttribute('role', 'alert')
    document.body.appendChild(d)
    // the specs looking for Alert text found
    // 2 copies, one in the screenreader message
    // and 1 in the component. let's give the
    // component a place to render so the getByText
    // queries don't look in the flash_screenreader_holder
    d = document.createElement('div')
    d.id = 'here'
    d.innerHTML = '<div></div>'
    document.body.appendChild(d)
  })

  beforeEach(() => {
    fetch.resetMocks()
    jest.useFakeTimers()
  })
  afterEach(async () => {
    jest.resetAllMocks()
  })
  it('renders the component', () => {
    const {container, getAllByText} = render(
      <CanvasMediaPlayer
        media_id="dummy_media_id"
        media_sources={[defaultMediaObject(), defaultMediaObject(), defaultMediaObject()]}
      />
    )
    // need queryAll because some of the buttons have tooltip and text
    expect(getAllByText('Play')[0]).toBeInTheDocument()
    expect(container.querySelector('video')).toBeInTheDocument()
  })
  it('sorts sources by bitrate, ascending', () => {
    const {container, getAllByText} = render(
      <CanvasMediaPlayer
        media_id="dummy_media_id"
        media_sources={[
          defaultMediaObject({bitrate: '3000', label: '3000'}),
          defaultMediaObject({bitrate: '2000', label: '2000'}),
          defaultMediaObject({bitrate: '1000', label: '1000'})
        ]}
      />
    )
    const sourceChooser = getAllByText('Source Chooser')[0].closest('button')
    fireEvent.click(sourceChooser)
    const sourceList = container.querySelectorAll(
      'ul[aria-label="Source Chooser"] ul[role="menu"] li'
    )
    expect(domQueries.getByText(sourceList[0], '1000')).toBeInTheDocument()
    expect(domQueries.getByText(sourceList[1], '2000')).toBeInTheDocument()
    expect(domQueries.getByText(sourceList[2], '3000')).toBeInTheDocument()
  })
  it('handles string-type media_sources', () => {
    // seen for audio files
    const {getAllByText} = render(
      <CanvasMediaPlayer
        media_id="dummy_media_id"
        media_sources="http://localhost:3000/files/797/download?download_frd=1"
        type="audio"
      />
    )
    // just make sure it doesn't blow up and renders the player
    expect(getAllByText('Play')[0]).toBeInTheDocument()
  })
  // this spec causes react to emit " Warning: Can't perform a React state update on an unmounted component."
  // in the next spec, and I can't figure out why. Everything still passes though.
  it('renders loading if there are no media sources', async () => {
    fetch.mockResponse(JSON.stringify({media_sources: []}))
    await act(async () => {
      const {getByText} = render(<CanvasMediaPlayer media_id="dummy_media_id" mediaSources={[]} />)
      expect(getByText('Loading')).toBeInTheDocument()
    })
  })
  it('makes ajax call if no mediaSources are provided on load', async () => {
    fetch.mockResponse(
      JSON.stringify({media_sources: [defaultMediaObject(), defaultMediaObject()]})
    )
    await act(async () => {
      render(<CanvasMediaPlayer media_id="dummy_media_id" />)
      jest.runAllTimers()
      await wait()
    })
    expect(fetch.mock.calls.length).toEqual(1)
    expect(fetch.mock.calls[0][0]).toEqual('/media_objects/dummy_media_id/info')
  })
  it('shows error message if fetch for media_sources fails', async () => {
    fetch.mockResponses([JSON.stringify({error: 'whoops'}), {status: 503}])
    let component
    await act(async () => {
      component = render(<CanvasMediaPlayer media_id="dummy_media_id" />, {
        container: document.getElementById('here').firstElementChild
      })
      jest.runAllTimers()
      await wait()
    })
    expect(fetch.mock.calls.length).toEqual(1)
    expect(component.getByText('Failed retrieving media sources.')).toBeInTheDocument()
  })
  it('tries ajax call up to MAX times if no media_sources', async () => {
    fetch.mockResponses(
      [JSON.stringify({media_sources: []}), {status: 200}],
      [JSON.stringify({media_sources: []}), {status: 304}],
      [JSON.stringify({media_sources: []}), {status: 304}],
      [JSON.stringify({media_sources: []}), {status: 304}],
      [JSON.stringify({media_sources: []}), {status: 304}],
      [JSON.stringify({media_sources: []}), {status: 304}]
    )
    let component
    await act(async () => {
      component = render(
        <CanvasMediaPlayer
          media_id="dummy_media_id"
          MAX_RETRY_ATTEMPTS={5}
          SHOW_BE_PATIENT_MSG_AFTER_ATTEMPTS={2}
        />,
        {
          container: document.getElementById('here').firstElementChild
        }
      )
      expect(component.getByText('Loading')).toBeInTheDocument()
      jest.runAllTimers() // triggers useEffect
      await wait() // render
      expect(component.getByText('Loading')).toBeInTheDocument()
      expect(document.getElementById('flash_screenreader_holder').textContent).toMatch(/Loading/)
      jest.runAllTimers()
      await wait()
      jest.runAllTimers()
      await wait()
      expect(
        component.getByText('Your media has been uploaded and will appear here after processing.', {
          exact: false
        })
      ).toBeInTheDocument()
      expect(document.getElementById('flash_screenreader_holder').textContent).toMatch(
        /Your media has been uploaded and will appear here after processing./
      )
      jest.runAllTimers()
      await wait()
      jest.runAllTimers()
      await wait()
      jest.runAllTimers()
      await wait()
      // add a 7th iteration just to prove the queries stopped at MAX_RETRY_ATTEMPTS
      jest.runAllTimers()
      await wait()

      expect(fetch.mock.calls.length).toEqual(6) // initial attempt + 5 MAX_RETRY_ATTEMPTS
      expect(
        component.getByText(
          'Giving up on retrieving media sources. This issue will probably resolve itself eventually.',
          {exact: false}
        )
      ).toBeInTheDocument()
      expect(document.getElementById('flash_screenreader_holder').textContent).toMatch(
        /Giving up on retrieving media sources. This issue will probably resolve itself eventually./
      )

      jest.runAllTimers()
      await wait()
    })
  })
  it('still says "Loading" if we receive no info from backend', async () => {
    fetch.mockResponse(JSON.stringify({media_sources: []}))
    await act(async () => {
      const {getByText} = render(<CanvasMediaPlayer media_id="dummy_media_id" />, {
        container: document.getElementById('here').firstElementChild
      })
      jest.runAllTimers()
      await wait()

      expect(getByText('Loading')).toBeInTheDocument()
    })
  })
  describe('renders correct set of video controls', () => {
    it('renders all the buttons', () => {
      document.fullscreenEnabled = true
      const {getAllByText, getByLabelText, queryAllByText, queryByLabelText} = render(
        <CanvasMediaPlayer
          media_id="dummy_media_id"
          media_sources={[defaultMediaObject(), defaultMediaObject(), defaultMediaObject()]}
        />
      )
      // need queryAll because some of the buttons have tooltip and text
      // (in v7 of the player, so let's just do it now)
      expect(getAllByText('Play')[0]).toBeInTheDocument()
      expect(getByLabelText('Timebar')).toBeInTheDocument()
      expect(getAllByText('Unmuted')[0]).toBeInTheDocument()
      expect(getAllByText('Playback Speed')[0]).toBeInTheDocument()
      expect(queryByLabelText('Source Chooser')).not.toBeInTheDocument()
      expect(getAllByText('Full Screen')[0]).toBeInTheDocument()
      expect(queryAllByText('Video Track').length).toBe(0) // AKA CC
    })
    it('skips fullscreen button when not enabled', () => {
      document.fullscreenEnabled = false
      const {getAllByText, getByLabelText, queryAllByText, queryByLabelText} = render(
        <CanvasMediaPlayer
          media_id="dummy_media_id"
          media_sources={[defaultMediaObject(), defaultMediaObject(), defaultMediaObject()]}
        />
      )
      expect(getAllByText('Play')[0]).toBeInTheDocument()
      expect(getByLabelText('Timebar')).toBeInTheDocument()
      expect(getAllByText('Unmuted')[0]).toBeInTheDocument()
      expect(getAllByText('Playback Speed')[0]).toBeInTheDocument()
      expect(queryByLabelText('Source Chooser')).not.toBeInTheDocument()
      expect(queryAllByText('Full Screen').length).toBe(0)
      expect(queryAllByText('Video Track').length).toBe(0) // AKA CC
    })
    it('skips source chooser button when there is only 1 source', () => {
      document.fullscreenEnabled = true
      const {getAllByText, getByLabelText, queryAllByText, queryByLabelText} = render(
        <CanvasMediaPlayer media_id="dummy_media_id" media_sources={[defaultMediaObject()]} />
      )
      expect(getAllByText('Play')[0]).toBeInTheDocument()
      expect(getByLabelText('Timebar')).toBeInTheDocument()
      expect(getAllByText('Unmuted')[0]).toBeInTheDocument()
      expect(getAllByText('Playback Speed')[0]).toBeInTheDocument()
      expect(queryByLabelText('Source Chooser')).not.toBeInTheDocument()
      expect(getAllByText('Full Screen')[0]).toBeInTheDocument()
      expect(queryAllByText('Video Track').length).toBe(0) // AKA CC
    })
    it('includes the CC button when there are subtitle track(s)', () => {
      const {getAllByText, getByLabelText, queryByLabelText} = render(
        <CanvasMediaPlayer
          media_id="dummy_media_id"
          media_sources={[defaultMediaObject()]}
          media_tracks={[
            {label: 'English', language: 'en', src: '/media_objects/more/stuff', type: 'subtitles'}
          ]}
        />
      )
      expect(getAllByText('Play')[0]).toBeInTheDocument()
      expect(getByLabelText('Timebar')).toBeInTheDocument()
      expect(getAllByText('Unmuted')[0]).toBeInTheDocument()
      expect(getAllByText('Playback Speed')[0]).toBeInTheDocument()
      expect(queryByLabelText('Source Chooser')).not.toBeInTheDocument()
      expect(getAllByText('Video Track')[0]).toBeInTheDocument() // AKA CC
    })
  })

  describe('renders the right size', () => {
    const makePlayer = (w, h) => {
      return {
        videoWidth: w,
        videoHeight: h,
        style: {},
        classList: {
          add: jest.fn()
        }
      }
    }

    it('when the media is audio', () => {
      const container = document.createElement('div')
      const player = makePlayer(1000, 500)
      setPlayerSize(player, 'audio/*', {width: 400, height: 200}, container)
      expect(player.classList.add).toHaveBeenCalledWith('audio-player')
      expect(player.style.width).toBe('320px')
      expect(player.style.height).toBe('14.25rem')
      expect(container.style.width).toBe('320px')
      expect(container.style.height).toBe('14.25rem')
    })

    it('when the video is landscape', () => {
      const container = document.createElement('div')
      const player = makePlayer(1000, 500)
      setPlayerSize(player, 'video/*', {width: 400, height: 200}, container)
      expect(player.classList.add).toHaveBeenCalledWith('video-player')
      expect(player.style.width).toBe('400px')
      expect(player.style.height).toBe('200px')
      expect(container.style.width).toBe('400px')
      expect(container.style.height).toBe('200px')
    })

    it('when the video is portrait', () => {
      const container = document.createElement('div')
      const player = makePlayer(500, 1000)
      setPlayerSize(player, 'video/*', {width: 400, height: 200}, container)
      expect(player.classList.add).toHaveBeenCalledWith('video-player')
      expect(player.style.width).toBe('100px')
      expect(player.style.height).toBe('200px')
      expect(container.style.width).toBe('')
      expect(container.style.height).toBe('')
    })

    it('shrinks the height for short and squat videos', () => {
      const container = document.createElement('div')
      const player = makePlayer(1000, 100)
      setPlayerSize(player, 'video/*', {width: 400, height: 200}, container)
      expect(player.classList.add).toHaveBeenCalledWith('video-player')
      expect(player.style.width).toBe('400px')
      expect(player.style.height).toBe('40px')
      expect(container.style.width).toBe('400px')
      expect(container.style.height).toBe('40px')
    })
  })
})
