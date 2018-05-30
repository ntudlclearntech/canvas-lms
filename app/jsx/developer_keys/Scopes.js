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
import PropTypes from 'prop-types'
import React from 'react'

import Billboard from '@instructure/ui-core/lib/components/Billboard'
import Checkbox from '@instructure/ui-core/lib/components/Checkbox'
import Flex, { FlexItem } from '@instructure/ui-layout/lib/components/Flex'
import Grid, {GridCol, GridRow} from '@instructure/ui-core/lib/components/Grid'
import IconWarning from 'instructure-icons/lib/Line/IconWarningLine'
import IconSearchLine from 'instructure-icons/lib/Line/IconSearchLine'
import ScreenReaderContent from '@instructure/ui-core/lib/components/ScreenReaderContent'
import Spinner from '@instructure/ui-core/lib/components/Spinner'
import Text from '@instructure/ui-core/lib/components/Text'
import TextInput from '@instructure/ui-core/lib/components/TextInput'
import View from '@instructure/ui-layout/lib/components/View'

import DeveloperKeyScopesList from './ScopesList'

export default class DeveloperKeyScopes extends React.Component {
  state = { filter: '' }

  handleFilterChange = e => {
    this.setState({
      filter: e.currentTarget.value
    })
  }

  enforceScopesSrText () {
    return this.props.requireScopes
      ? I18n.t('Clicking the checkbox will cause scopes table to disappear below')
      : I18n.t('Clicking the checkbox will cause scopes table to appear below')
  }

  body() {
    const { developerKey } = this.props
    if (this.props.availableScopesPending) {
      return (
        <GridRow hAlign="space-around">
          <GridCol width={2}>
            <span id="scopes-loading-spinner">
              <Spinner title={I18n.t('Loading Available Scopes')} />
            </span>
          </GridCol>
        </GridRow>
      )
    }

    return (
      <GridRow>
        <GridCol>
          <View>
              {this.props.requireScopes
                ? <DeveloperKeyScopesList
                    availableScopes={this.props.availableScopes}
                    selectedScopes={developerKey ? developerKey.scopes : []}
                    filter={this.state.filter}
                    listDeveloperKeyScopesSet={this.props.listDeveloperKeyScopesSet}
                    dispatch={this.props.dispatch}
                  />
                : <Billboard
                    hero={<IconWarning />}
                    size="large"
                    headingAs="h2"
                    headingLevel="h2"
                    margin="xx-large"
                    readOnly
                    heading={I18n.t('When scope enforcement is disabled, tokens have access to all endpoints available to the authorizing user.')}
                  />

              }
          </View>
        </GridCol>
      </GridRow>
    )
  }

  render() {
    const searchEndpoints = I18n.t('Search endpoints')
    return (
      <Grid>
        <GridRow rowSpacing="small">
          <GridCol>
            <Text size="medium" weight="bold">
              {I18n.t('Add Scope')}
            </Text>
          </GridCol>
          <GridCol width="auto">
            <Flex>
              <FlexItem padding="0 large 0 0" data-automation="enforce_scopes">
                <Checkbox
                  variant="toggle"
                  label={
                    <span>
                      <Text>{I18n.t('Enforce Scopes')}</Text>
                      <ScreenReaderContent>{this.enforceScopesSrText()}</ScreenReaderContent>
                    </span>
                  }
                  checked={this.props.requireScopes}
                  onChange={this.props.onRequireScopesChange}
                />
              </FlexItem>
              <FlexItem>
                <TextInput
                  label={<ScreenReaderContent>{searchEndpoints}</ScreenReaderContent>}
                  placeholder={searchEndpoints}
                  type="search"
                  icon={() => <IconSearchLine />}
                  onChange={this.handleFilterChange}
                />
              </FlexItem>
            </Flex>
          </GridCol>
        </GridRow>
        {this.body()}
      </Grid>
    )
  }
}

DeveloperKeyScopes.propTypes = {
  availableScopes: PropTypes.objectOf(PropTypes.arrayOf(
    PropTypes.shape({
      resource: PropTypes.string,
      scope: PropTypes.string
    })
  )).isRequired,
  availableScopesPending: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
  listDeveloperKeyScopesSet: PropTypes.func.isRequired,
  developerKey: PropTypes.shape({
    notes: PropTypes.string,
    icon_url: PropTypes.string,
    vendor_code: PropTypes.string,
    redirect_uris: PropTypes.string,
    email: PropTypes.string,
    name: PropTypes.string,
    scopes: PropTypes.arrayOf(PropTypes.string)
  }),
  requireScopes: PropTypes.bool,
  onRequireScopesChange: PropTypes.func.isRequired
}

DeveloperKeyScopes.defaultProps = {
  developerKey: undefined,
  requireScopes: false
}
