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

import {addQueryParamsToUrl, parseUrlOrNull, relativeHttpUrlForHostname} from '../url-util'

describe('parseUrlOrNull', () => {
  it('should parse a valid url', () => {
    expect(parseUrlOrNull('https://foobar.local/123')?.toString()).toEqual(
      'https://foobar.local/123'
    )
  })

  it('should parse a valid url with an origin', () => {
    expect(parseUrlOrNull('/123', 'https://foobar.local')?.toString()).toEqual(
      'https://foobar.local/123'
    )
  })

  it('should handle falsey values', () => {
    expect(parseUrlOrNull(null)).toEqual(null)
  })

  it('should handle invalid URLs', () => {
    expect(parseUrlOrNull('!@#!@#')).toEqual(null)
  })
})

describe('relativeHttpUrlForHostname', () => {
  it('should not remove query parameters or other parts of the URL', () => {
    expect(
      relativeHttpUrlForHostname('http://test.com/123?foo=bar&baz=qux#hash', 'http://test.com')
    ).toEqual('/123?foo=bar&baz=qux#hash')

    expect(
      relativeHttpUrlForHostname('http://test.com:123/123?foo=bar&baz=qux#hash', 'http://test.com')
    ).toEqual('/123?foo=bar&baz=qux#hash')
  })

  it('should only relativize urls when appropriate', () => {
    const canvasOrigins = [
      {value: 'HTTP://CANVAS.COM', shouldTransform: true},
      {value: 'HTTPS://CANVAS.COM', shouldTransform: true},
      {value: 'http://canvas.com', shouldTransform: true},
      {value: 'https://canvas.com', shouldTransform: true},
      {value: 'http://canvas.com:80', shouldTransform: true},
      {value: 'https://canvas.com:443', shouldTransform: true},
      {value: 'http://canvas.com:443', shouldTransform: true},
      {value: 'https://canvas.com:80', shouldTransform: true},
      {value: 'http://canvas.com:1234', shouldTransform: true},
    ]

    const urlOrigins = [
      {value: 'HTTP://CANVAS.COM', shouldTransform: true},
      {value: 'HTTPS://CANVAS.COM', shouldTransform: true},

      {value: 'http://canvas.com', shouldTransform: true},
      {value: 'https://canvas.com', shouldTransform: true},
      {value: 'ftp://canvas.com', shouldTransform: false},

      {value: 'http://canvas.com:80', shouldTransform: true},
      {value: 'https://canvas.com:443', shouldTransform: true},
      {value: 'http://canvas.com:443', shouldTransform: true},
      {value: 'https://canvas.com:80', shouldTransform: true},
      {value: 'http://canvas.com:1234', shouldTransform: true},
      {value: 'https://canvas.com:1234', shouldTransform: true},

      {value: 'http://other.canvas.com', shouldTransform: false},
      {value: 'https://other.canvas.com', shouldTransform: false},
      {value: 'https://google.com', shouldTransform: false},
      {value: 'http://nowhere.com', shouldTransform: false},
    ]

    const paths = [
      {value: '/other-page', shouldTransform: true},
      {value: '/avocado.jpg', shouldTransform: true},
      {value: '!@#$%^', shouldTransform: false},
    ]

    const elements = [
      {value: 'iframe', shouldTransform: true},
      {value: 'img', shouldTransform: true, selfClosing: true},
      {value: 'embed', shouldTransform: true, selfClosing: true},
    ]

    canvasOrigins.forEach(canvasOrigin => {
      urlOrigins.forEach(urlOrigin => {
        paths.forEach(path => {
          elements.forEach(element => {
            const shouldTransform = [canvasOrigin, urlOrigin, path, element].every(
              it => it.shouldTransform
            )

            const absoluteUrl = `${urlOrigin.value}${path.value}`
            const relativeUrl = path.value

            const transformedUrl = relativeHttpUrlForHostname(absoluteUrl, canvasOrigin.value)
            const expectedUrl = shouldTransform ? relativeUrl : absoluteUrl

            expect(transformedUrl).toEqual(expectedUrl)
          })
        })
      })
    })
  })
})

describe('addQueryParamsToUrl', () => {
  it('return null for nullish values', () => {
    expect(addQueryParamsToUrl(null, {})).toEqual(null)
    expect(addQueryParamsToUrl(undefined, {})).toEqual(null)
  })

  it('return handle empty records', () => {
    expect(addQueryParamsToUrl('/test', {})).toEqual('/test')
    expect(addQueryParamsToUrl('/test?a=b', {})).toEqual('/test?a=b')
    expect(addQueryParamsToUrl('https://somewhere.com/test', {})).toEqual(
      'https://somewhere.com/test'
    )
  })

  it('should handle empty string', () => {
    expect(addQueryParamsToUrl('', {})).toEqual('')
    expect(addQueryParamsToUrl('', {a: '10', b: 'hello'})).toEqual('?a=10&b=hello')
  })

  it('should handle just query params', () => {
    expect(addQueryParamsToUrl('?x=10', {})).toEqual('?x=10')
    expect(addQueryParamsToUrl('?x=10', {a: '10', b: 'hello'})).toEqual('?x=10&a=10&b=hello')
  })

  it('should handle hash urls', () => {
    expect(addQueryParamsToUrl('#somewhere', {})).toEqual('#somewhere')
    expect(addQueryParamsToUrl('#somewhere', {a: '10', b: 'hello'})).toEqual(
      '?a=10&b=hello#somewhere'
    )
  })

  it('should handle root relative path', () => {
    expect(addQueryParamsToUrl('/', {})).toEqual('/')
    expect(addQueryParamsToUrl('/', {a: '10', b: 'hello'})).toEqual('/?a=10&b=hello')
  })

  it('should handle absolute URLs', () => {
    expect(
      addQueryParamsToUrl('http://some.url/whatever', {
        a: '10',
        b: '20',
      })
    ).toEqual('http://some.url/whatever?a=10&b=20')

    expect(
      addQueryParamsToUrl('http://some.url/whatever?x=foo', {
        a: '10',
        b: '20',
      })
    ).toEqual('http://some.url/whatever?x=foo&a=10&b=20')
  })

  it('should handle relative URLs from the root', () => {
    expect(
      addQueryParamsToUrl('/whatever', {
        a: '10',
        b: '20',
      })
    ).toEqual('/whatever?a=10&b=20')

    expect(
      addQueryParamsToUrl('/whatever?x=foo', {
        a: '10',
        b: '20',
      })
    ).toEqual('/whatever?x=foo&a=10&b=20')
  })

  it('should handle relative URLs not from the root', () => {
    expect(
      addQueryParamsToUrl('whatever', {
        a: '10',
        b: '20',
      })
    ).toEqual('whatever?a=10&b=20')

    expect(
      addQueryParamsToUrl('whatever?x=foo', {
        a: '10',
        b: '20',
      })
    ).toEqual('whatever?x=foo&a=10&b=20')
  })

  it('should overwrite existing values', () => {
    expect(addQueryParamsToUrl('?x=10', {x: '20'})).toEqual('?x=20')
    expect(addQueryParamsToUrl('?x', {x: '20'})).toEqual('?x=20')
    expect(addQueryParamsToUrl('?x=10&y=50', {x: '20', y: ''})).toEqual('?x=20&y=')
  })

  it('should handle existing keys without values', () => {
    expect(addQueryParamsToUrl('?x', {y: '20'})).toEqual('?x=&y=20')
  })

  it('should handle adding keys without values', () => {
    expect(addQueryParamsToUrl('', {x: ''})).toEqual('?x=')
  })

  it('should not remove inputs that are null', () => {
    expect(addQueryParamsToUrl('?x=10&y=20', {x: null, y: undefined})).toEqual('?x=10&y=20')
  })
})
