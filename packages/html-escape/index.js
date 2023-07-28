/*
 * Copyright (C) 2011 - present Instructure, Inc.
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

const INST = {}

if (!('INST' in window)) window.INST = {}

class SafeString {
  constructor(string) {
    this.string = typeof string === 'string' ? string : `${string}`
  }

  toString() {
    return this.string
  }
}

const ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
}

export function htmlEscape(str) {
  return str.replace(/[&<>"'\/`=]/g, c => ENTITIES[c])
}

export default function escape(strOrObject) {
  if (typeof strOrObject === 'string') {
    return htmlEscape(strOrObject)
  } else if (strOrObject instanceof SafeString) {
    return strOrObject
  } else if (typeof strOrObject === 'number') {
    return escape(strOrObject.toString())
  }

  for (const k in strOrObject) {
    if (strOrObject.hasOwnProperty(k)) {
      const v = strOrObject[k]
      strOrObject[k] = escape(v)
    }
  }
  return strOrObject
}
escape.SafeString = SafeString

INST.htmlEscape = escape

const UNESCAPE_ENTITIES = Object.keys(ENTITIES).reduce((map, key) => {
  const value = ENTITIES[key]
  map[value] = key
  return map
}, {})

const unescapeSource = `(?:${Object.keys(UNESCAPE_ENTITIES).join('|')})`
const UNESCAPE_REGEX = new RegExp(unescapeSource, 'g')

export function unescape(str) {
  return str.replace(UNESCAPE_REGEX, match => UNESCAPE_ENTITIES[match])
}
