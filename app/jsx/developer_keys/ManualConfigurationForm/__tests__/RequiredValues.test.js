/*
 * Copyright (C) 2018 - present Instructure, Inc.
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
import { mount } from 'enzyme'
import get from 'lodash/get'

import RequiredValues from '../RequiredValues'

const props = (overrides = {}) => {
  return {
    toolConfiguration: {
      title: 'This is a title',
      description: 'asdfsdf',
      target_link_uri: 'http://example.com',
      oidc_initiation_url: 'http://example.com/initiate',
      public_jwk: '',
      ...overrides
    }
  }
}

it('generates the toolConfiguration', () => {
  const wrapper = mount(<RequiredValues {...props()} />)
  const toolConfig = wrapper.instance().generateToolConfigurationPart()
  expect(Object.keys(toolConfig).length).toEqual(5)
})

const checkToolConfigPart = (toolConfig, path, value) => {
  expect(get(toolConfig, path)).toEqual(value);
}

const checkChange = (path, funcName, value) => {
  const wrapper = mount(<RequiredValues {...props()} />)

  wrapper.instance()[funcName]({target: { value }})
  checkToolConfigPart(
    wrapper.instance().generateToolConfigurationPart(),
    path,
    value
  )
}

it('changes the output when domain changes', () => {
  checkChange(['title'], 'handleTitleChange', 'New Title')
})

it('changes the output when tool_id changes', () => {
  checkChange(['description'], 'handleDescriptionChange', 'qwerty')
})

it('changes the output when icon_url changes', () => {
  checkChange(['oidc_initiation_url'], 'handleOidcInitiationUrlChange', 'http://example.com/new/login')
})

it('changes the output when target_link_uri changes', () => {
  checkChange(['target_link_uri'], 'handleTargetLinkUriChange', 'http://example.com/new')
})

it('changes the output when public_jwk changes', () => {
  checkChange(['public_jwk'], 'handlePublicJwkChange', '{}')
})
