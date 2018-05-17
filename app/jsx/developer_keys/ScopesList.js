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
import I18n from 'i18n!react_developer_keys'
import LazyLoad from 'react-lazy-load'
import PropTypes from 'prop-types'
import React from 'react'
import Flex, {FlexItem} from '@instructure/ui-layout/lib/components/Flex'
import ScreenReaderContent from '@instructure/ui-core/lib/components/ScreenReaderContent'
import Text from '@instructure/ui-core/lib/components/Text'
import Checkbox from '@instructure/ui-core/lib/components/Checkbox'
import View from '@instructure/ui-layout/lib/components/View'
import DeveloperKeyScopesGroup from './ScopesGroup'
import DeveloperKeyScopesMethod from './ScopesMethod'

export default class DeveloperKeyScopesList extends React.Component {
  constructor(props) {
    super(props)
    const formattedScopesArray = Object.keys(this.props.availableScopes).map(k => ({
      [k]: this.props.availableScopes[k]
    }))

    this.state = {
      formattedScopesArray,
      availableScopes: formattedScopesArray.slice(0, 10), // Only load 10 groups on initial render
      readOnlySelected: false,
      selectedScopes: this.props.selectedScopes || []
    }
  }

  componentDidMount() {
    this.delayedRender()
  }

  setSelectedScopes = selectedScopes => {
    this.setState({
      selectedScopes
    })
    this.props.dispatch(this.props.actions.listDeveloperKeyScopesSet(selectedScopes))
  }

  setReadOnlySelected = readOnlySelected => {
    this.setState({
      readOnlySelected
    })
  }

  delayedRender = () => {
    // Load the rest of the groups once the modal is open
    setTimeout(() => {
      const upperIndex = this.state.formattedScopesArray.length
      this.setState({
        availableScopes: this.state.formattedScopesArray.slice(0, upperIndex)
      })
    }, 0)
  }

  handleReadOnlySelected = event => {
    let newScopes = []
    if (event.currentTarget.checked) {
      newScopes = this.allScopes(this.props.availableScopes)
        .filter(s => s.verb === 'GET')
        .map(s => s.scope)
    } else {
      newScopes = []
    }

    this.setState({
      selectedScopes: newScopes,
      readOnlySelected: event.currentTarget.checked
    })

    this.props.dispatch(this.props.actions.listDeveloperKeyScopesSet(newScopes))
  }

  noFilter() {
    return this.props.filter === '' || !this.props.filter
  }

  allScopes(availableScopes) {
    return Object.values(availableScopes).reduce((accumulator, currentValue) => {
      return accumulator.concat(currentValue)
    }, [])
  }

  render() {
    return (
      <div className="scopes-list">
        <View borderRadius="small" display="block" borderWidth="small">
          <Flex height="564px" width="100%" as="div" direction="column">
            <FlexItem padding="none" textAlign="start">
              <View padding="small" display="block" borderWidth="none none medium none">
                <Flex>
                  <FlexItem grow shrink padding="none large none medium">
                    <Text size="medium" weight="bold">
                      {I18n.t('All Endpoints')}
                    </Text>
                  </FlexItem>
                  <FlexItem>
                    <Text size="medium" weight="bold">
                      {I18n.t('Read only')}
                    </Text>
                    <DeveloperKeyScopesMethod method="get" margin="none small none small" />
                    <Checkbox
                      label={<ScreenReaderContent>{I18n.t('All GET scopes')}</ScreenReaderContent>}
                      onChange={this.handleReadOnlySelected}
                      checked={this.state.readOnlySelected}
                      inline
                    />
                  </FlexItem>
                </Flex>
              </View>
            </FlexItem>
            <FlexItem grow shrink>
              {this.state.availableScopes.map(scopeGroup => {
                return Object.keys(scopeGroup).reduce((result, key) => {
                  if (this.noFilter() || key.indexOf(this.props.filter.toLowerCase()) > -1) {
                    result.push(
                      <LazyLoad
                        offset={1000}
                        debounce={false}
                        height={50}
                        width="100%"
                        key={`${key}-scope-group`}
                      >
                        <DeveloperKeyScopesGroup
                          scopes={this.props.availableScopes[key]}
                          name={key}
                          selectedScopes={this.state.selectedScopes}
                          setSelectedScopes={this.setSelectedScopes}
                          setReadOnlySelected={this.setReadOnlySelected}
                        />
                      </LazyLoad>
                    )
                  }
                  return result
                }, [])
              })}
            </FlexItem>
          </Flex>
        </View>
      </div>
    )
  }
}

DeveloperKeyScopesList.propTypes = {
  dispatch: PropTypes.func.isRequired,
  actions: PropTypes.shape({
    listDeveloperKeyScopesSet: PropTypes.func.isRequired
  }).isRequired,
  availableScopes: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        resource: PropTypes.string,
        scope: PropTypes.string
      })
    )
  ).isRequired,
  filter: PropTypes.string.isRequired,
  selectedScopes: PropTypes.arrayOf(PropTypes.string).isRequired
}
