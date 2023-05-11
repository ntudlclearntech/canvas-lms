/*
 * Copyright (C) 2023 - present Instructure, Inc.
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

import {EnvCommon} from '@canvas/global/env/EnvCommon'
import {EnvDeepLinking} from '@canvas/global/env/EnvDeepLinking'
import {EnvAssignments} from '@canvas/global/env/EnvAssignments'
import {EnvRce} from '@canvas/global/env/EnvRce'
import {EnvCourse} from '@canvas/global/env/EnvCourse'
import {EnvCoursePaces} from '@canvas/global/env/EnvCoursePaces'
import {EnvGradebook} from '@canvas/global/env/EnvGradebook'
import {EnvGradingStandards} from '@canvas/global/env/EnvGradingStandards'
import {EnvPlatformStorage} from '@canvas/global/env/EnvPlatformStorage'
import {EnvAccounts} from '@canvas/global/env/EnvAccounts'
import {EnvContextModules} from '@canvas/global/env/EnvContextModules'

/**
 * Top level ENV variable.
 *
 * Includes non-optional values that are always (or almost always) present.
 *
 * Each controller that provdies custom environment variables has a file for those values,
 * such as EnvAssignments.d.ts. They have internal interfaces where values aren't declared
 * optional for easier access, but the top level variable includes them as optional.
 */
export type GlobalEnv =
  // These values should always be present, since they're put there in application_controller.rb
  EnvCommon &
    // This a partial list of feature-specific ENV variables.
    // Individual typescript files can narrow the type of ENV to include them
    Partial<
      EnvAccounts &
        EnvAssignments &
        EnvCourse &
        EnvCoursePaces &
        EnvDeepLinking &
        EnvGradebook &
        EnvGradingStandards &
        EnvPlatformStorage &
        EnvRce &
        EnvContextModules
    >
