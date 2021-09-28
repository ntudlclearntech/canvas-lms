/*
 * Copyright (C) 2016 - present Instructure, Inc.
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

import canvasBaseTheme from '@instructure/canvas-theme'
import canvasHighContrastTheme from '@instructure/canvas-high-contrast-theme'
import moment from 'moment'
import tz from '@canvas/timezone'
import './initializers/fakeRequireJSFallback.js'
import {themeColors} from './themeColors'
import {
  up as configureDateTimeMomentParser
} from './initializers/configureDateTimeMomentParser'
import {
  up as configureDateTime
} from './initializers/configureDateTime'

// we already put a <script> tag for the locale corresponding ENV.MOMENT_LOCALE
// on the page from rails, so this should not cause a new network request.
moment().locale(ENV.MOMENT_LOCALE)

configureDateTimeMomentParser()
configureDateTime()

// This will inject and set up sentry for deprecation reporting.  It should be
// stripped out and be a no-op in production.
if (process.env.NODE_ENV !== 'production' && process.env.DEPRECATION_SENTRY_DSN) {
  const Raven = require('raven-js')
  Raven.config(process.env.DEPRECATION_SENTRY_DSN, {
    ignoreErrors: ['renderIntoDiv', 'renderSidebarIntoDiv'], // silence the `Cannot read property 'renderIntoDiv' of null` errors we get from the pre- rce_enhancements old rce code
    release: process.env.GIT_COMMIT
  }).install()

  const setupRavenConsoleLoggingPlugin = require('../jsx/shared/helpers/setupRavenConsoleLoggingPlugin')
    .default
  setupRavenConsoleLoggingPlugin(Raven, {loggerName: 'console'})
}

if (process.env.NODE_ENV !== 'production') {
  const {
    filterUselessConsoleMessages
  } = require('@instructure/js-utils/lib/filterUselessConsoleMessages')
  filterUselessConsoleMessages(console)
}

// setup the inst-ui default theme
// override the fontFamily to include "Lato Extended", which we prefer
// to load over plain Lato (see LS-1559)
if (ENV.use_high_contrast) {
  canvasHighContrastTheme.use({
    overrides: {
      typography: {
        fontFamily: 'LatoWeb, "Lato Extended", Lato, "Helvetica Neue", Helvetica, Arial, sans-serif'
      }
    }
  })
} else {
  const brandvars = window.CANVAS_ACTIVE_BRAND_VARIABLES || {}

  // Set CSS transitions to 0ms in Selenium and JS tests
  let transitionOverride = {}
  if (process.env.NODE_ENV === 'test' || window.INST.environment === 'test') {
    transitionOverride = {
      transitions: {
        duration: '0ms'
      }
    }
  }

  canvasBaseTheme.use({
    overrides: {
      ...transitionOverride,
      ...brandvars,
      typography: {
        fontFamily: 'LatoWeb, "Lato Extended", Lato, "Helvetica Neue", Helvetica, Arial, sans-serif'
      },
      colors: {
        ...canvasBaseTheme.colors,
        /**
         * Colors - Text
         */
        textDarkest: themeColors.gray20,
        textDark: themeColors.ash,
        // textLight: themeColors.porcelain,
        // textLightest: themeColors.white,
        textBrand: themeColors.brand,
        textLink: themeColors.brand,
        textAlert: themeColors.barney,
        textInfo: themeColors.brand,
        textSuccess: themeColors.shamrock,
        textDanger: themeColors.crimson,
        textWarning: themeColors.orange,
        /**
         * Colors - Background
         */
        backgroundDarkest: themeColors.midnightBlue,
        backgroundDark: themeColors.ash,
        backgroundMedium: themeColors.tiara,
        // backgroundLight: themeColors.porcelain,
        // backgroundLightest: themeColors.white,
        backgroundBrand: themeColors.brand,
        backgroundBrandSecondary: themeColors.gray20,
        backgroundAlert: themeColors.barney,
        backgroundInfo: themeColors.brand,
        backgroundSuccess: themeColors.shamrock,
        backgroundDanger: themeColors.crimson,
        backgroundWarning: themeColors.orange,
        /**
         * Colors - Border
         */
        // borderLightest: themeColors.white,
        // borderLight: themeColors.porcelain,
        borderMedium: themeColors.tiara,
        borderDark: themeColors.ash,
        borderDarkest: themeColors.midnightBlue,
        borderBrand: themeColors.brand,
        borderAlert: themeColors.barney,
        borderInfo: themeColors.brand,
        borderSuccess: themeColors.shamrock,
        borderDanger: themeColors.crimson,
        borderWarning: themeColors.orange,
        borderDebug: themeColors.crimson,
      }
    }
  })
}

/* #__PURE__ */ if (process.env.NODE_ENV === 'test' || window.INST.environment === 'test') {
  // This is for the `wait_for_ajax_requests` method in selenium
  window.__CANVAS_IN_FLIGHT_XHR_REQUESTS__ = 0
  const send = XMLHttpRequest.prototype.send
  XMLHttpRequest.prototype.send = function() {
    window.__CANVAS_IN_FLIGHT_XHR_REQUESTS__++
    // 'loadend' gets fired after both successful and errored requests
    this.addEventListener('loadend', () => {
      window.__CANVAS_IN_FLIGHT_XHR_REQUESTS__--
      window.dispatchEvent(new CustomEvent('canvasXHRComplete'))
    })
    return send.apply(this, arguments)
  }

  // and this so it also tracks `fetch` requests
  const fetch = window.fetch
  window.fetch = function() {
    window.__CANVAS_IN_FLIGHT_XHR_REQUESTS__++
    const promise = fetch.apply(this, arguments)
    promise.finally(() => {
      window.__CANVAS_IN_FLIGHT_XHR_REQUESTS__--
      window.dispatchEvent(new CustomEvent('canvasXHRComplete'))
    })
    return promise
  }
}
