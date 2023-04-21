/*
 * Copyright (C) 2020 - present Instructure, Inc.
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

import UploadMedia from './UploadMedia'
import ClosedCaptionCreator from './ClosedCaptionCreator'
import RocketSVG from './RocketSVG'
import useComputerPanelFocus from './useComputerPanelFocus'
import {isAudio, isVideo, isPreviewable, sizeMediaPlayer} from './shared/utils'
import LoadingIndicator from './shared/LoadingIndicator'
import saveMediaRecording, {
  saveClosedCaptions,
  saveClosedCaptionsForAttachment,
} from './saveMediaRecording'
import closedCaptionLanguages, {sortedClosedCaptionLanguageList} from './closedCaptionLanguages'
import getTranslations from './getTranslations'
import * as CONSTANTS from './shared/constants'

export {
  UploadMedia as default,
  ClosedCaptionCreator as ClosedCaptionPanel,
  RocketSVG,
  useComputerPanelFocus,
  isAudio,
  isVideo,
  isPreviewable,
  sizeMediaPlayer,
  LoadingIndicator,
  saveMediaRecording,
  saveClosedCaptions,
  saveClosedCaptionsForAttachment,
  closedCaptionLanguages,
  sortedClosedCaptionLanguageList,
  getTranslations,
  CONSTANTS,
}
