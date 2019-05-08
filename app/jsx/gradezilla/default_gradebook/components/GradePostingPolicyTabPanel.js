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

import React, {Component} from 'react'
import {bool, func, shape} from 'prop-types'
import View from '@instructure/ui-layout/lib/components/View'
import List, {ListItem} from '@instructure/ui-elements/lib/components/List'
import RadioInput from '@instructure/ui-forms/lib/components/RadioInput'
import RadioInputGroup from '@instructure/ui-forms/lib/components/RadioInputGroup'
import Text from '@instructure/ui-elements/lib/components/Text'
import {showFlashAlert} from '../../../shared/FlashAlert'

import I18n from 'i18n!gradezilla'

const MANUAL_POST = 'manual'
const AUTOMATIC_POST = 'auto'

export default class GradePostingPolicyTabPanel extends Component {
  static propTypes = {
    anonymousAssignmentsPresent: bool.isRequired,
    onChange: func.isRequired,
    settings: shape({
      postManually: bool.isRequired
    }).isRequired
  }

  constructor(props) {
    super(props)

    this.handlePostPolicySelected = this.handlePostPolicySelected.bind(this)
  }

  handlePostPolicySelected(_e, value) {
    if (value === AUTOMATIC_POST && this.props.anonymousAssignmentsPresent) {
      showFlashAlert({
        message: I18n.t(
          'Anonymous assignments are hidden by default and will need to be posted manually even if the course setting is set to Automatic.'
        ),
        type: 'warning'
      })
    }

    this.props.onChange({postManually: value === MANUAL_POST})
  }

  render() {
    const automaticallyPostLabel = (
      <View as="div">
        <Text>{I18n.t('Automatically Post Grades')}</Text>

        <br />

        <Text size="small">
          {I18n.t('Assignment grades will be visible to students as soon as they are entered.')}
        </Text>
      </View>
    )

    const manuallyPostLabel = (
      <View as="div">
        <Text>{I18n.t('Manually Post Grades')}</Text>

        <br />

        <Text size="small">
          {I18n.t(`
            Grades will be hidden by default. Any grades that have already posted will remain visible.
            Choose when to post grades for each assignment on each column in the gradebook.
          `)}
        </Text>

        {this.props.settings.postManually && (
          <View as="div">
            <Text size="small" as="p">
              {I18n.t(
                'While the grades for an assignment are set to manual, students will not receive new notifications about or be able to see:'
              )}
            </Text>

            <List margin="0 0 0 small" size="small" itemSpacing="small">
              <ListItem>{I18n.t('Their grade for the assignment')}</ListItem>
              <ListItem>{I18n.t('Grade change notifications')}</ListItem>
              <ListItem>{I18n.t('Submission comments')}</ListItem>
              <ListItem>{I18n.t('Curving assignments')}</ListItem>
              <ListItem>{I18n.t('Score change notifications')}</ListItem>
            </List>

            <Text size="small" as="p">
              {I18n.t(
                'Once a grade is posted manually, it will automatically send new notifications and be visible to students.'
              )}
            </Text>
          </View>
        )}
      </View>
    )

    return (
      <div id="GradePostingPolicyTabPanel__Container">
        <RadioInputGroup
          description={I18n.t('Individual Assignment Grade Posting')}
          name="postPolicy"
          onChange={this.handlePostPolicySelected}
          value={this.props.settings.postManually ? MANUAL_POST : AUTOMATIC_POST}
        >
          <RadioInput
            name="postPolicy"
            id="GradePostingPolicyTabPanel__PostAutomatically"
            label={automaticallyPostLabel}
            value={AUTOMATIC_POST}
          />

          <RadioInput
            name="postPolicy"
            id="GradePostingPolicyTabPanel__PostManually"
            label={manuallyPostLabel}
            value={MANUAL_POST}
          />
        </RadioInputGroup>
      </div>
    )
  }
}
