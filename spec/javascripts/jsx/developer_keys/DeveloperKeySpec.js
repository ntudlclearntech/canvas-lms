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
import TestUtils from 'react-addons-test-utils'
import ReactDOM from 'react-dom'
import DeveloperKey from 'jsx/developer_keys/DeveloperKey';

class TestTable extends React.Component {
  render () {
    return (<table><tbody>{this.props.children}</tbody></table>)
  }
}

function makeTable (keyProps) {
  return (<TestTable><DeveloperKey {...keyProps} /></TestTable>)
}

function testWrapperOk (keyProps, expectedString) {
  const component = TestUtils.renderIntoDocument(makeTable(keyProps));
  const renderedText = ReactDOM.findDOMNode(TestUtils.findRenderedDOMComponentWithTag(component, 'tr')).innerHTML;
  ok(renderedText.includes(expectedString))
}

function testWrapperNotOk (keyProps, expectedString) {
  const component = TestUtils.renderIntoDocument(makeTable(keyProps));
  const renderedText = ReactDOM.findDOMNode(TestUtils.findRenderedDOMComponentWithTag(component, 'tr')).innerHTML;
  notOk(renderedText.includes(expectedString))
}

const defaultProps = {
  developerKey: {
    access_token_count: 77,
    account_name: "bob account",
    api_key: "rYcJ7LnUbSAuxiMh26tXTSkaYWyfRPh2lr6FqTLqx0FRsmv44EVZ2yXC8Rgtabc3",
    created_at: "2018-02-09T20:36:50Z",
    email: "bob@myemail.com",
    icon_url: "http://my_image.com",
    id: "10000000000004",
    last_used_at: "2018-06-07T20:36:50Z",
    name: "Atomic fireball",
    notes: "all the notas",
    redirect_uri: "http://my_redirect_uri.com",
    redirect_uris: "",
    user_id: "53532",
    user_name: "billy bob",
    vendor_code: "b3w9w9bf",
    workflow_state: "active",
    visible: false,
  },
  store: { dispatch: () => {} },
  actions: {
    // These should really be stubs and tested as to when they are called
    makeVisibleDeveloperKey: () => {},
    makeInvisibleDeveloperKey: () => {},
    activateDeveloperKey: () => {},
    deactivateDeveloperKey: () => {},
    deleteDeveloperKey: () => {},
    setEditingDeveloperKey: () => {},
    developerKeysModalOpen: () => {},
  },
  ctx: { params: { contextId: 'context' } }
}

function updateDefaultProps (updates = {}) {
  const props = Object.assign({}, defaultProps)
  Object.keys(updates).forEach((key) => {
    if (defaultProps[key]) {
      props[key] = Object.assign({}, defaultProps[key], updates[key])
    } else {
      props[key] = updates[key]
    }
  })
  return props
}

QUnit.module('DeveloperKey');
test('includes developerName', () => {
  testWrapperOk(defaultProps, "Atomic fireball")
});

test('includes Unnamed Tool when developerName us null', () => {
  testWrapperOk(updateDefaultProps({ developerKey: { name: null } }), "Unnamed Tool")
});

test('includes Unnamed Tool when developerName empty string case', () => {
  testWrapperOk(updateDefaultProps({ developerKey: { name: '' } }), "Unnamed Tool")
});

test('includes userName', () => {
  testWrapperOk(defaultProps, "billy bob")
});

test('includes No User when userName is null and email missing', () => {
  testWrapperOk(updateDefaultProps({ developerKey: { user_name: null, email: null } }), "No User")
});

test('includes No User when userName is empty string and email is missing', () => {
  testWrapperOk(updateDefaultProps({ developerKey: { user_name: '', email: null } }), "No User")
});

test('includes an image when name is present', () => {
  testWrapperOk(defaultProps, '<img class="icon" src="http://my_image.com" alt="Atomic fireball Logo"')
});

test('includes an image when name is not present', () => {
  const propsModified = updateDefaultProps({ developerKey: { name: null } })
  testWrapperOk(propsModified, '<img class="icon" src="http://my_image.com" alt="Unnamed Tool Logo"')
});

test('includes a blank image when icon_url is null', () => {
  testWrapperOk(updateDefaultProps({ developerKey: { icon_url: null } }), '<img class="icon" src="#" alt=""')
});

test('includes a blank image when icon_url is empty string', () => {
  testWrapperOk(updateDefaultProps({ developerKey: { icon_url: '' } }), '<img class="icon" src="#" alt=""')
});

test('does not inactive when workflow_state is active', () => {
  testWrapperNotOk(defaultProps, 'inactive')
});

test('includes a user link', () => {
  testWrapperOk(defaultProps, '<a href="/users/53532"')
  testWrapperOk(defaultProps, '>billy bob</a>')
});

test('does not include a user link when user_id is null', () => {
  const propsModified = updateDefaultProps({ developerKey: { user_id: null } })
  testWrapperNotOk(propsModified, '<a href="/users/53532"')
  testWrapperNotOk(propsModified, '>billy bob</a>')
  testWrapperOk(propsModified, 'billy bob')
});

test('includes a redirect_uri', () => {
  testWrapperOk(defaultProps, 'URI:')
  testWrapperOk(defaultProps, 'http://my_redirect_uri.com')
});

test('does not include a redirect_uri when redirect_uri is null', () => {
  testWrapperNotOk(updateDefaultProps({ developerKey: { redirect_uri: null } }), 'URI:')
});

test('includes a last_used_at', () => {
  testWrapperOk(defaultProps, "2018-06-07T20:36:50Z")
});

test('includes "Never" when last_used_at is null', () => {
  testWrapperOk(updateDefaultProps({ developerKey: { last_used_at: null } }), 'Never')
});

test('it renders the developer key state control', () => {
  testWrapperOk(defaultProps, 'Key state for the current account')
})

test('renders Name Missing when email present but user_name missing', () => {
  testWrapperOk(updateDefaultProps({ developerKey: { user_name: null } }), 'Name Missing')
})

const inheritedProps = updateDefaultProps({ inherited: true })

test('does not include user info when inherited is true', () => {
  testWrapperNotOk(inheritedProps, "billy bob")
})

test('does not include redirect_uri info when inherited is true', () => {
  testWrapperNotOk(inheritedProps, 'URI:')
  testWrapperNotOk(inheritedProps, 'http://my_redirect_uri.com')
})

test('does not include access token info when inherited is true', () => {
  testWrapperNotOk(inheritedProps, 'Access Token Count:')
  testWrapperNotOk(inheritedProps, 'Created:')
  testWrapperNotOk(inheritedProps, 'Last Used:')
})

test('does not include developer key modification icons', () => {
  testWrapperNotOk(inheritedProps, 'class="icon_react"')
})

test('does not include developer key secret', () => {
  testWrapperNotOk(inheritedProps, 'rYcJ7LnUbSAuxiMh26tXTSkaYWyfRPh2lr6FqTLqx0FRsmv44EVZ2yXC8Rgtabc3')
})