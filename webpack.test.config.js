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

process.env.NODE_ENV = 'test'

const path = require('path')
const webpack = require('webpack')
const testWebpackConfig = require('./frontend_build/baseWebpackConfig')

const CONTEXT_COFFEESCRIPT_SPEC = 'spec/coffeescripts'
const CONTEXT_EMBER_GRADEBOOK_SPEC = 'app/coffeescripts/ember'
const CONTEXT_JSX_SPEC = 'spec/javascripts/jsx'

const RESOURCE_COFFEESCRIPT_SPEC = /Spec.(coffee|js)$/
const RESOURCE_EMBER_GRADEBOOK_SPEC = /\.spec.js$/
const RESOURCE_JSX_SPEC = /Spec$/

const RESOURCE_JSA_SPLIT_SPEC = /^\.\/[a-f].*Spec$/
const RESOURCE_JSG_SPLIT_SPEC = /^\.\/g.*Spec$/
const RESOURCE_JSH_SPLIT_SPEC = /^\.\/[h-z].*Spec$/

testWebpackConfig.entry = undefined

testWebpackConfig.plugins.push(
  new webpack.DefinePlugin({
    CONTEXT_COFFEESCRIPT_SPEC: JSON.stringify(CONTEXT_COFFEESCRIPT_SPEC),
    CONTEXT_EMBER_GRADEBOOK_SPEC: JSON.stringify(CONTEXT_EMBER_GRADEBOOK_SPEC),
    CONTEXT_JSX_SPEC: JSON.stringify(CONTEXT_JSX_SPEC),
    RESOURCE_COFFEESCRIPT_SPEC,
    RESOURCE_EMBER_GRADEBOOK_SPEC,
    RESOURCE_JSX_SPEC
  })
)

testWebpackConfig.plugins.push(new webpack.EnvironmentPlugin({
  JSPEC_PATH: null,
  JSPEC_GROUP: null,
  A11Y_REPORT: false,
  SENTRY_DSN: null,
  GIT_COMMIT: null
}))

if (process.env.JSPEC_GROUP) {
  let ignoreResource = () => {
    throw new Error(`Unknown JSPEC_GROUP ${process.env.JSPEC_GROUP}`)
  }

  if (process.env.JSPEC_GROUP === 'coffee') {
    ignoreResource = (resource, context) => {
      return context.endsWith(CONTEXT_JSX_SPEC) && RESOURCE_JSX_SPEC.test(resource)
    }
  } else if (process.env.JSPEC_GROUP === 'jsa') {
    ignoreResource = (resource, context) => {
      return (
        context.endsWith(CONTEXT_COFFEESCRIPT_SPEC) ||
        context.endsWith(CONTEXT_EMBER_GRADEBOOK_SPEC) ||
        (context.endsWith(CONTEXT_JSX_SPEC) &&
          RESOURCE_JSX_SPEC.test(resource) &&
          !RESOURCE_JSA_SPLIT_SPEC.test(resource))
      )
    }
  } else if (process.env.JSPEC_GROUP === 'jsg') {
    ignoreResource = (resource, context) => {
      return (
        context.endsWith(CONTEXT_COFFEESCRIPT_SPEC) ||
        context.endsWith(CONTEXT_EMBER_GRADEBOOK_SPEC) ||
        (context.endsWith(CONTEXT_JSX_SPEC) &&
          RESOURCE_JSX_SPEC.test(resource) &&
          !RESOURCE_JSG_SPLIT_SPEC.test(resource))
      )
    }
  } else if (process.env.JSPEC_GROUP === 'jsh') {
    ignoreResource = (resource, context) => {
      return (
        context.endsWith(CONTEXT_COFFEESCRIPT_SPEC) ||
        context.endsWith(CONTEXT_EMBER_GRADEBOOK_SPEC) ||
        (context.endsWith(CONTEXT_JSX_SPEC) &&
          RESOURCE_JSX_SPEC.test(resource) &&
          !RESOURCE_JSH_SPLIT_SPEC.test(resource))
      )
    }
  }

  testWebpackConfig.plugins.push(
    new webpack.IgnorePlugin({
      checkResource: ignoreResource
    })
  )
}

if (process.env.SENTRY_DSN) {
  const SentryCliPlugin = require('@sentry/webpack-plugin');
  testWebpackConfig.plugins.push(new SentryCliPlugin({
    release: process.env.GIT_COMMIT,
    include: [
      path.resolve(__dirname, 'public/javascripts'),
      path.resolve(__dirname, 'app/jsx'),
      path.resolve(__dirname, 'app/coffeescripts'),
      path.resolve(__dirname, 'spec/javascripts/jsx'),
      path.resolve(__dirname, 'spec/coffeescripts')
    ],
    ignore: [
      path.resolve(__dirname, 'public/javascripts/translations'),
      /bower\//
    ]
  }));
}

testWebpackConfig.resolve.alias[CONTEXT_EMBER_GRADEBOOK_SPEC] = path.resolve(__dirname, CONTEXT_EMBER_GRADEBOOK_SPEC)
testWebpackConfig.resolve.alias[CONTEXT_COFFEESCRIPT_SPEC] = path.resolve(__dirname, CONTEXT_COFFEESCRIPT_SPEC)
testWebpackConfig.resolve.alias[CONTEXT_JSX_SPEC] = path.resolve(__dirname, CONTEXT_JSX_SPEC)
testWebpackConfig.resolve.alias['spec/jsx'] = path.resolve(__dirname, 'spec/javascripts/jsx')
testWebpackConfig.mode = 'development'
testWebpackConfig.module.rules.unshift({
  test: [
    /\/spec\/coffeescripts\//,
    /\/spec_canvas\/coffeescripts\//,
    // Some plugins use a special spec_canvas path for their specs
    /\/spec\/javascripts\/jsx\//,
    /\/ember\/.*\/tests\//
  ],

  // Our spec files expect qunit's global `test`, `module`, `asyncTest` and `start` variables.
  // These imports loaders make it so they are avalable as local variables
  // inside of a closure, without truly making them globals.
  // We should get rid of this and just change our actual source to s/test/qunit.test/ and s/module/qunit.module/
  loaders: [
    'imports-loader?test=>QUnit.test',
  ]
})

module.exports = testWebpackConfig
