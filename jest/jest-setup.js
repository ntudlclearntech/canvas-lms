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

import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import {filterUselessConsoleMessages} from '@instructure/js-utils'
import {up as configureDateTime} from '../ui/boot/initializers/configureDateTime'

import {up as configureDateTimeMomentParser} from '../ui/boot/initializers/configureDateTimeMomentParser'

/**
 * We want to ensure errors and warnings get appropriate eyes. If
 * you are seeing an exception from here, it probably means you
 * have an unintended consequence from your changes. If you expect
 * the warning/error, add it to the ignore list below.
 */
/* eslint-disable no-console */
const globalError = global.console.error
const ignoredErrors = [
  /\[object Object\]/,
  /%s has a method called shouldComponentUpdate/,
  /`NaN` is an invalid value for the `%s` css style property/,
  /`value` prop on `%s` should not be null/,
  /<Provider> does not support changing `store` on the fly/,
  /A component is changing a controlled input of type %s to be uncontrolled/,
  /A theme registry has already been initialized/,
  /An update to (%s|DefaultToolForm) inside a test was not wrapped in act/,
  /Can't perform a React state update on an unmounted component/,
  /CancelAttemptButton: prop type `submission` is invalid/,
  /Cannot read property '(activeElement|useRealTimers)' of undefined/,
  /Cannot read property 'length' of null/,
  /Cannot read property 'name' of null/,
  /Cannot update during an existing state transition/,
  /ColorPicker: isMounted is deprecated/,
  /contextType was defined as an instance property on %s/,
  /Each child in a list should have a unique "key" prop/,
  /Encountered two children with the same key/,
  /Error writing result to store for query/,
  /Expected one of BreadcrumbLink in Breadcrumb but found 'BreadcrumbLinkWithTip'/,
  /Expected one of Group, Option in Select but found 'option'/,
  /Expected one of ListItem in List but found 'ProfileTab/,
  /Expected one of PaginationButton in Pagination but found .*/,
  /Failed loading the language file for/,
  /Function components cannot be given refs/,
  /Functions are not valid as a React child/,
  /invalid messageType: (notSupported|undefined)/,
  /Invalid prop `assignmentID` of type `number` supplied to `StudentFooter`/,
  /Invalid prop `background` of value `` supplied to `View`, expected one of/,
  /Invalid prop `borderColor` of value `slate` supplied to `View`/,
  /Invalid prop `children` of type `array` supplied to `Transition`/,
  /Invalid prop `children` supplied to `(Option|View)`/,
  /Invalid prop `conversation._id` of type `number` supplied to `ComposeModalManager`/,
  /Invalid prop `courseId` of type `number` supplied to `(DirectShareUserModal|K5Announcement)`/,
  /Invalid prop `courseID` of type `number` supplied to `(StudentFooter|StudentLastAttended)`/,
  /Invalid prop `currentFolder` of type `Object` supplied to `FilePreview`/,
  /Invalid prop `currentUserId` of type `number` supplied to `AddStudentModal`/,
  /Invalid prop `disabled` of type `object` supplied to `(Checkbox|ToggleFacade)`/,
  /Invalid prop `editorOptions.plugins` of type `string` supplied to `(ForwardRef|RCEWrapper)`/,
  /Invalid prop `editorOptions.toolbar\[0\]` of type `string` supplied to `(ForwardRef|RCEWrapper)`/,
  /Invalid prop `firstAnnouncement.postedDate` of type `String` supplied to `K5Announcement`/,
  /Invalid prop `heading` of type `object` supplied to `Billboard`/,
  /Invalid prop `headingAs` of value `h4` supplied to `Billboard`/,
  /Invalid prop `homeroomAnnouncements\[0\].courseId` of type `number` supplied to `HomeroomAnnouncementsLayout`/,
  /Invalid prop `id` of type `number` supplied to `Option`/,
  /Invalid prop `label` of type `function` supplied to `StepItem`/,
  /Invalid prop `open` of type `number` supplied to `(Modal|ModalSpinner)`/,
  /Invalid prop `options.favoriteCourses\[0\]._id` of type `number` supplied to `CourseSelect`/,
  /Invalid prop `outcomeContextId` of type `number` supplied to `ManageOutcomeItem`/,
  /Invalid prop `outcomes.1._id` of type `number` supplied to `OutcomesPopover`/,
  /Invalid prop `outcomesGroup.contextId` of type `number` supplied to `FindOutcomesView`, expected `string`/,
  /Invalid prop `rceBodyRef` supplied to `MentionDropdownPortal`/,
  /Invalid prop `returnFocusTo` of type `DeprecatedComponent` supplied to `(CourseHomeDialog|HomePagePromptContainer)`/,
  /Invalid prop `selected.1._id` of type `number` supplied to `ManageOutcomesFooter`/,
  /Invalid prop `selectedDate` of type `date` supplied to `CanvasDateInput`/,
  /Invalid prop `selectedGroupId` of type `array` supplied to `GroupActionDrillDown`/,
  /Invalid prop `shares\[0\].content_export.id` of type `number` supplied to `ReceivedTable`/,
  /Invalid prop `studentID` of type `number` supplied to `StudentLastAttended`/,
  /Invalid prop `submissions\[0\].submissionDraft.submissionAttempt` of type `number` supplied to `StudentsTable`/,
  /Invalid prop `tool.id` of type `number` supplied to `ContentTypeExternalToolTray`/,
  /Invalid prop `value` of type `object` supplied to `CanvasSelect`/,
  /Invariant Violation/,
  /It looks like you're using the wrong act/,
  /modalProps.onDismiss is not a function/,
  /Must provide id for each option via `getOptionProps`/,
  /Prop `children` should be supplied unless/,
  /props.setRCEOpen is not a function/,
  /React does not recognize the `%s` prop on a DOM element/,
  /Render methods should be a pure function of props and state/,
  /The 'screenReaderOnly' prop must be used in conjunction with 'liveRegion'/,
  /The above error occurred in the <.*> component/,
  /The prop `accountId` is marked as required in `(SecurityPanel|Whitelist)`/,
  /The prop `activeMailbox` is marked as required in `MailboxSelectionDropdown`/,
  /The prop `allSubmissions\[0\]._id` is marked as required in `Header`/,
  /The prop `app.courses\[0\].id` is marked as required in `K5AppLink`/,
  /The prop `apps\[0\].courses\[0\].id` is marked as required in `AppsList`/,
  /The prop `assignmentsCompletedForToday` is marked as required in `K5Course`/,
  /The prop `assignmentsDueToday` is marked as required in `K5Course`/,
  /The prop `assignmentsMissing` is marked as required in `K5Course`/,
  /The prop `avatarName` is marked as required in `UserLink`/,
  /The prop `canAddObservee` is marked as required in `(K5Dashboard|ObserverOptions|ResponsiveK5Dashboard)`/,
  /The prop `canReadAnnouncements` is marked as required in `(K5Announcement|K5Course)`/,
  /The prop `children` is marked as required in `TruncateText`/,
  /The prop `closeTray` is marked as required in `HelpTray`/,
  /The prop `color` is marked as required in `StatusColorListItem`/,
  /The prop `colors.late` is marked as required in `StatusColorPanel`/,
  /The prop `compose` is marked as required in `MessageActionButtons`/,
  /The prop `conferenceType.type` is marked as required in `Conference`/,
  /The prop `conferenceTypes\[0\].name` is marked as required in `(AddConference|ConferenceButton)`/,
  /The prop `containingContext.userId` is marked as required in `CanvasContentTray`/,
  /The prop `courseId` is marked as required in `(LatestAnnouncementLink|PublishButton)`/,
  /The prop `currentUserRoles` is marked as required in `ObserverOptions`/,
  /The prop `dateTime` is marked as required in `FriendlyDatetime`/,
  /The prop `firstAnnouncement.id` is marked as required in `K5Announcement`/,
  /The prop `focusAttemptOnInit` is marked as required in `AttemptTab`/,
  /The prop `focusLastElement` is marked as required in `RSSFeedList`/,
  /The prop `focusOnInit` is marked as required in `(FileUpload|TextEntry|UrlEntry)`/,
  /The prop `groupTitle` is marked as required in `(GroupMoveModal|GroupRemoveModal|SearchBreadcrumb)`/,
  /The prop `handleAddOutcomes` is marked as required in `ManagementHeader`/,
  /The prop `handleFileDrop` is marked as required in `ManagementHeader`/,
  /The prop `hasLoaded` is marked as required in `HistoryList`/,
  /The prop `homeroomAnnouncements` is marked as required in `HomeroomPage`/,
  /The prop `host` is marked as required in `CanvasContentTray`/,
  /The prop `id` is marked as required in `(CanvasSelectOption|ColHeader|DashboardCard|FormField|Option)`/,
  /The prop `imageUrl` is marked as required in `GenericErrorPage`/,
  /The prop `isLiked` is marked as required in `Like`/,
  /The prop `isLoading` is marked as required in `LoadingWrapper`/,
  /The prop `item.assignment.name` is marked as required in `Row`/,
  /The prop `item.gradedAnonymously` is marked as required in `Row`/,
  /The prop `jwt` is marked as required in `CanvasContentTray`/,
  /The prop `label` is marked as required in `(CanvasInstUIModal|FormField|FormFieldLayout|Modal)`/,
  /The prop `listDeveloperKeyScopesSet` is marked as required in `(Scopes|ScopesList)`/,
  /The prop `liveRegion` is marked as required in `(SecurityPanel|Whitelist)`/,
  /The prop `loading` is marked as required in `(HomeroomAnnouncementsLayout|LoadingWrapper)`/,
  /The prop `loadingAnnouncements` is marked as required in `HomeroomPage`/,
  /The prop `loadingCards` is marked as required in `HomeroomPage`/,
  /The prop `ltiKeysSetLtiKey` is marked as required in `DeveloperKeyActionButtons`/,
  /The prop `name` is marked as required in `Avatar`/,
  /The prop `onChangeSubmission` is marked as required in `StudentContent`/,
  /The prop `onClearHandler` is marked as required in `(ManageOutcomesFooter|OutcomesPopover)`/,
  /The prop `onSelect` is marked as required in `MailboxSelectionDropdown`/,
  /The prop `outcome.mastery_points` is marked as required in `StudentOutcomeScore`/,
  /The prop `outcome.title` is marked as required in `StudentOutcomeScore`/,
  /The prop `outcomeGroup._id` is marked as required in `GroupDescriptionModal`/,
  /The prop `outcomeGroup.title` is marked as required in `(GroupDescriptionModal|GroupEditModal|ManageOutcomesView)`/,
  /The prop `outcomes.1._id` is marked as required in `OutcomesPopover`/,
  /The prop `outcomes\[0\].mastery_points` is marked as required in `(Gradebook|ScoresGrid)`/,
  /The prop `outcomes\[0\].title` is marked as required in `ScoresGrid`/,
  /The prop `outcomesGroup._id` is marked as required in `FindOutcomesView`/,
  /The prop `permissionName` is marked as required in `PermissionTray`/,
  /The prop `pollTimeout` is marked as required in `LinkValidator`/,
  /The prop `pollTimeoutInitial` is marked as required in `LinkValidator`/,
  /The prop `rcsProps.canUploadFiles` is marked as required in `ForwardRef`/,
  /The prop `renderLabel` is marked as required in `(FileDrop|NumberInput|Select)`/,
  /The prop `reply` is marked as required in `MessageActionButtons`/,
  /The prop `replyAll` is marked as required in `MessageActionButtons`/,
  /The prop `rollup.outcomeId` is marked as required in `StudentOutcomeScore`/,
  /The prop `rollup.rating.mastery` is marked as required in `StudentOutcomeScore`/,
  /The prop `rollups\[0\].outcomeRollups\[0\].rating.mastery` is marked as required in `Gradebook`/,
  /The prop `rollups\[0\].outcomeRollups\[0\].rating.mastery` is marked as required in `ScoresGrid`/,
  /The prop `rootId` is marked as required in `GroupSelectionDrillDown`/,
  /The prop `rubric.criteria\[0\].id` is marked as required in `Rubric`/,
  /The prop `rubric.id` is marked as required in `RubricTab`/,
  /The prop `rubricAssessment.data\[0\].criterion_id` is marked as required in `Rubric`/,
  /The prop `rubricAssociation._id` is marked as required in `RubricTab`/,
  /The prop `screenReaderLabel` is marked as required in `IconButton`/,
  /The prop `selectedRoles\[0\].value` is marked as required in `PermissionsIndex`/,
  /The prop `students\[0\].name` is marked as required in `ScoresGrid`/,
  /The prop `submission._id` is marked as required in `TextEntry`/,
  /The prop `text` is marked as required in `(SVGWithTextPlaceholder|TextPlaceholder)`/,
  /The prop `title` is marked as required in `ManageOutcomeItem`/,
  /The prop `trayProps.canUploadFiles` is marked as required in `RCEWrapper`/,
  /The prop `updateDeveloperKey` is marked as required in `Scopes`/,
  /The prop `url` is marked as required in `SVGWithTextPlaceholder`/,
  /The prop `userId` is marked as required in `(CourseNotificationSettingsManager|GeneratePairingCode|NotificationPreferences)`/,
  /The prop `value` is marked as required in `CanvasSelectOption`/,
  /The prop `win.innerHeight` is marked as required in `ExternalToolDialog`/,
  /Unexpected keys "searchPermissions", "filterRoles", "tabChanged", "setAndOpenAddTray" found in preloadedState argument passed to createStore/,
  /Use the `defaultValue` or `value` props on <select> instead of setting `selected` on <option>/,
  /validateDOMNesting\(...\): %s cannot appear as a child of <%s>/,
  /WARNING: heuristic fragment matching going on!/,
  /You are using the simple \(heuristic\) fragment matcher, but your queries contain union or interface types./,
  /You seem to have overlapping act\(\) calls/
]
const globalWarn = global.console.warn
const ignoredWarnings = [
  /\[View|Button|Text\] .* in version 8.0.0/i,
  /`wait` has been deprecated and replaced by `waitFor`/,
  /`waitForElement` has been deprecated/,
  /Error getting \/media_objects\/dummy_media_id\/info/,
  /Exactly one focusable child is required/,
  /Found @client directives in a query but no ApolloClient resolvers were specified/,
  /is deprecated and will be removed/,
  /Missing field __typename in/,
  /Missing field errors in/,
  /Missing field id in/,
  /Missing field moduleItem in/,
  /Please update the following components: %s/,
  /shared_brand_configs.* not called/,
  /The `renderSortLabel` prop should be provided when Table is sortable/,
  /toBeEmpty has been deprecated/,
  /track.label will no longer be used to uniquely identify track/,
  /Translation for .* is missing/,
  /Unmatched (GET|POST) to \/api\/v1/,
  /value provided is not in a recognized RFC2822 or ISO format/
]
global.console = {
  log: console.log,
  error: error => {
    if (ignoredErrors.some(regex => regex.test(error))) {
      return
    }
    globalError(error)
    throw new Error(
      `Looks like you have an unhandled error. Keep our test logs clean by handling or filtering it. ${error}`
    )
  },
  warn: warning => {
    if (ignoredWarnings.some(regex => regex.test(warning))) {
      return
    }
    globalWarn(warning)
    throw new Error(
      `Looks like you have an unhandled warning. Keep our test logs clean by handling or filtering it. ${warning}`
    )
  },
  info: console.info,
  debug: console.debug
}
/* eslint-enable no-console */
filterUselessConsoleMessages(global.console)

require('jest-fetch-mock').enableFetchMocks()

window.scroll = () => {}
window.ENV = {
  use_rce_enhancements: true
}

Enzyme.configure({adapter: new Adapter()})

// because InstUI themeable components need an explicit "dir" attribute on the <html> element
document.documentElement.setAttribute('dir', 'ltr')

configureDateTime()
configureDateTimeMomentParser()

// because everyone implements `flat()` and `flatMap()` except JSDOM 🤦🏼‍♂️
if (!Array.prototype.flat) {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Array.prototype, 'flat', {
    configurable: true,
    value: function flat(depth = 1) {
      if (depth === 0) return this.slice()
      return this.reduce(function (acc, cur) {
        if (Array.isArray(cur)) {
          acc.push(...flat.call(cur, depth - 1))
        } else {
          acc.push(cur)
        }
        return acc
      }, [])
    },
    writable: true
  })
}

if (!Array.prototype.flatMap) {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Array.prototype, 'flatMap', {
    configurable: true,
    value: function flatMap(_cb) {
      return Array.prototype.map.apply(this, arguments).flat()
    },
    writable: true
  })
}

require('@instructure/ui-themes')

if (process.env.DEPRECATION_SENTRY_DSN) {
  const Raven = require('raven-js')
  Raven.config(process.env.DEPRECATION_SENTRY_DSN, {
    ignoreErrors: ['renderIntoDiv', 'renderSidebarIntoDiv'], // silence the `Cannot read property 'renderIntoDiv' of null` errors we get from the pre- rce_enhancements old rce code
    release: process.env.GIT_COMMIT,
    autoBreadcrumbs: {
      xhr: false
    }
  }).install()

  const setupRavenConsoleLoggingPlugin =
    require('../ui/boot/initializers/setupRavenConsoleLoggingPlugin').default
  setupRavenConsoleLoggingPlugin(Raven, {loggerName: 'console-jest'})
}

// set up mocks for native APIs
if (!('MutationObserver' in window)) {
  Object.defineProperty(window, 'MutationObserver', {
    value: require('@sheerun/mutationobserver-shim')
  })
}

if (!('IntersectionObserver' in window)) {
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: class IntersectionObserver {
      disconnect() {
        return null
      }

      observe() {
        return null
      }

      takeRecords() {
        return null
      }

      unobserve() {
        return null
      }
    }
  })
}

if (!('ResizeObserver' in window)) {
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: class IntersectionObserver {
      observe() {
        return null
      }

      unobserve() {
        return null
      }
    }
  })
}

if (!('matchMedia' in window)) {
  window.matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {}
  })
  window.matchMedia._mocked = true
}

if (!('scrollIntoView' in window.HTMLElement.prototype)) {
  window.HTMLElement.prototype.scrollIntoView = () => {}
}
