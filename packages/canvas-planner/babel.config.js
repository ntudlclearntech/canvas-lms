/*
 * Copyright (C) 2022 - present Instructure, Inc.
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

// this target is intended for use in browsers, refer to
// ui-build/babel-recommendations.md for guidance
module.exports = {
  assumptions: {
    setPublicClassFields: true
  },
  env: {
    production: {
      plugins: [
        'transform-react-remove-prop-types',
        '@babel/plugin-transform-react-inline-elements',
        '@babel/plugin-transform-react-constant-elements'
      ]
    }
  },
  presets: [
    ['@babel/preset-env', {
      useBuiltIns: 'entry',
      corejs: '3.20',
      modules: false,
    }],
    ['@babel/preset-react', { useBuiltIns: true }],
  ],

  plugins: [
    ['inline-react-svg'],
    ['@babel/plugin-transform-runtime', {
      corejs: 3,
      helpers: true,
      useESModules: true,
      regenerator: true
    }],

    ['@instructure/babel-plugin-themeable-styles', {
      postcssrc: require('@instructure/ui-postcss-config')()(),
      themeablerc: require('./themeable.config.js'),
    }]
  ],

  targets: {
    browsers: 'last 2 versions',
    esmodules: true
  }
}
