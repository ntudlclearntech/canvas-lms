#
# Copyright (C) 2013 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.

define [], ->

  formatter =
    0: 'toUpperCase'
    1: 'toLowerCase'

  # see also lib/i18n/lolcalize.rb
  letThereBeLols = (str) ->
    # don't want to mangle placeholders, wrappers, etc.
    pattern = /(\s*%h?\{[^\}]+\}\s*|\s*[\n\\`\*_\{\}\[\]\(\)\#\+\-!]+\s*|^\s+)/
    result = for token in str.split(pattern)
      if token.match(pattern)
        token
      else
        s = ''
        for i in [0...token.length]
          s += token[i][formatter[i % 2]]()
        s = s.replace(/\.( |$)/, '!!?! ')
        s = s.replace(/^(\w+)$/, '$1!')
        s += " LOL!" if s.length > 2
        s
    result.join('')

  i18nLolcalize = (strOrObj) ->
    if typeof strOrObj is 'string'
      letThereBeLols strOrObj
    else
      result = {}
      for key, value of strOrObj
        result[key] = letThereBeLols(value)
      result

