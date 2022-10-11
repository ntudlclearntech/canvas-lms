/*
 * Copyright (C) 2021 - present Instructure, Inc.
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

import {Button} from '@instructure/ui-buttons'
import {Text} from '@instructure/ui-text'
import {View} from '@instructure/ui-view'

import Modal from '@canvas/instui-bindings/react/InstuiModal'
import {useScope as useI18nScope} from '@canvas/i18n'

import {PaceContextTypes} from '../types'

const I18n = useI18nScope('remove_pace_warning_modal')

const {Body: ModalBody, Footer: ModalFooter} = Modal as any

export type ComponentProps = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  readonly contextType: PaceContextTypes
}

const MODAL_HEADER_TEXT = {
  Section: I18n.t('Remove this Section Pace?'),
  Enrollment: I18n.t('Remove this Student Pace?'),
}

const MODAL_BODY_TEXT = {
  Section: I18n.t(
    'This section pace will be removed and the pace will revert back to the default pace.'
  ),
  Enrollment: I18n.t(
    "This student pace will be removed and the pace will revert back to the student's section pace or course default pace."
  ),
}

export const RemovePaceWarningModal: React.FC<ComponentProps> = ({
  open,
  onCancel,
  onConfirm,
  contextType,
}) => (
  <Modal size="small" open={open} onDismiss={onCancel} label={MODAL_HEADER_TEXT[contextType]}>
    <ModalBody>
      <View>
        <Text>{MODAL_BODY_TEXT[contextType]}</Text>
      </View>
    </ModalBody>
    <ModalFooter>
      <View>
        <Button onClick={onCancel}>{I18n.t('Cancel')}</Button>
        <Button margin="0 x-small" onClick={onConfirm} color="danger">
          {I18n.t('Remove')}
        </Button>
      </View>
    </ModalFooter>
  </Modal>
)
