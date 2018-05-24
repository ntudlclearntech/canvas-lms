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
import PropTypes from 'prop-types'
import React from 'react'
import Checkbox from '@instructure/ui-core/lib/components/Checkbox'
import Flex, {FlexItem} from '@instructure/ui-layout/lib/components/Flex'
import ScreenReaderContent from '@instructure/ui-core/lib/components/ScreenReaderContent'
import DeveloperKeyScopesMethod from './ScopesMethod'

const DeveloperKeyScope = props => {
  return (
    <div className="developer-key-scope">
      <Flex alignItems="start" padding="small none small none">
        <FlexItem shrink padding="none small none none">
          <DeveloperKeyScopesMethod method={props.scope.verb} />
        </FlexItem>
        <FlexItem grow shrink padding="none small none none">
          {props.scope.scope}
        </FlexItem>
        <FlexItem padding="none">
          <Checkbox
            label={<ScreenReaderContent>{props.scope.scope}</ScreenReaderContent>}
            value={props.scope.scope}
            onChange={props.onChange}
            checked={props.checked}
            inline
          />
        </FlexItem>
      </Flex>
    </div>
  )
}

DeveloperKeyScope.propTypes = {
  onChange: PropTypes.func.isRequired,
  checked: PropTypes.bool.isRequired,
  scope: PropTypes.shape({
    scope: PropTypes.string.isRequired,
    resource: PropTypes.string.isRequired,
    path: PropTypes.string,
    verb: PropTypes.string.isRequired
  }).isRequired
}

export default DeveloperKeyScope
