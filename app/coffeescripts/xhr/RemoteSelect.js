//
// Copyright (C) 2012 - present Instructure, Inc.
//
// This file is part of Canvas.
//
// Canvas is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero General Public License as published by the Free
// Software Foundation, version 3 of the License.
//
// Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
// WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
// A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
// details.
//
// You should have received a copy of the GNU Affero General Public License along
// with this program. If not, see <http://www.gnu.org/licenses/>.
//

// RemoteSelect.coffee
// Populates a <select> element with data from an ajax call. Takes two arguments.
// The first is a <select> element, the second is an options hash

/*
xsslint jqueryObject.property placeholder spinner
*/

import $ from 'jquery'
import _ from 'underscore'
import cache from '../class/cache'
import Spinner from 'spin.js'
import optGroupTpl from 'jst/util/select/optgroups'
import optsTpl from 'jst/util/select/options'

export default class RemoteSelect {

  // #
  // default options:
  //   * cache all requests
  //   * don't format data returned from the server
  //   * pull data from the current URL
  defaultOptions = {
    cache: true,
    formatter: d => d,
    requestParams: {},
    start: true,
    url: window.location.href,
  }

  // #
  // display options for the spinner
  spinnerOptions = {
    lines: 10,
    length: 3,
    radius: 3,
    speed: 1,
    trail: 60,
    width: 2,
  }


  // #
  // class constructor.
  // @param el {jQueryEl} - a wrapped <select> element to
  //   fill with data from the server. any existing options
  //   will be kept.
  // @param options {Object} - config options.
  //   * cache {Boolean} - cache ajax requests.
  //   * formatter {Function} - format data to match expected
  //       format. accepts one argument - an array or object
  //       of data returned from the server.
  //   * url {String} - the url to fetch data from.
  // @api public
  constructor (el, options) {
    this.el = el
    this.options = options
    this.options = _.extend({}, this.defaultOptions, this.options)
    if (this.options.cache) {
      $.extend(true, this, cache)
    }

    this.body = $('body')

    // store existing info in @el so that it can be displayed
    // along with new data. keep it in options to make it easy
    // to override.
    this.options.placeholder = this.el.html()

    // start request if start option is true
    if (this.options.start === true) {
      this.makeRequest()
    }
  }

  // #
  // call the server to get data for the select.
  // @param params {Object} - an object of parameters to send
  //   with the request.
  // @return jqXHR|Boolean
  // @api public
  makeRequest (params = {}) {
    params = _.extend({}, this.options.requestParams, params)
    this.el.prop('disabled', true)

    // use data from the cache if it exists
    if (this.options.cache) {
      let cachedValue
      if ((cachedValue = this.cache.get([this.options.url, params]))) {
        return this.onResponse(cachedValue)
      }
    }

    // otherwise start the spinner and make a request to the server
    this.startSpinner()
    this.currentRequest = $.getJSON(this.options.url, params, this.onResponse)

    // append some extra properties to @currentRequest and then
    // return it
    return _.tap(this.currentRequest, (obj) => {
      obj.url = this.options.url
      obj.params = params
      return obj.error(this.stopSpinner)
    })
  }

  // #
  // add data to <select> in @el.
  // @param data {Object|Array} - data returned from the ajax call.
  // @api private
  onResponse = (data) => {
    const fData = this.options.formatter(data)
    const template = this.getTemplate(fData)

    // cache data if it hasn't already been
    if (this.shouldCache(this.currentKey())) {
      this.cache.set(this.currentKey(), data)
    }

    this.el.empty().append(this.options.placeholder).append(template(fData))

    this.stopSpinner()
    return this.el.prop('disabled', false)
  }

  // #
  // return the cache key information for the current request
  // @return Array
  // @api private
  currentKey () {
    return [this.options.url, this.currentRequest.params]
  }

  // #
  // determines if a given key should be cached.
  // @params args {Splat} - a list of arguments to be converted
  //   into a cache key
  // @return Boolean
  // @api private
  shouldCache (...key) {
    return this.options.cache && !this.cache.get(key)
  }

  // #
  // given a data object, determine which template
  // should be used (i.e. <option> or <optgroup>).
  // @param data {Object|Array}
  // @return Function
  // @api private
  getTemplate (data) {
    if (_.isArray(data)) {
      return optsTpl
    } else {
      return optGroupTpl
    }
  }

  // #
  // display loading spinner
  // @api private
  startSpinner () {
    this.spinner = $(new Spinner(this.spinnerOptions).spin().el)
    this.spinner.css(this.toTheRightOf(this.el))
    return this.body.append(this.spinner)
  }

  // #
  // hide loading spinner
  // @api private
  stopSpinner = () => this.spinner.remove()

  // #
  // given an element, calculate, cache, and return css to
  // place a spinner to the right of it.
  // @param el {jQueryEl}
  // @return Object
  // @api private
  toTheRightOf (el) {
    return (
      this.spinnerCss ||
      (this.spinnerCss = {
        left: el.offset().left + el.width() + 10,
        position: 'absolute',
        top: el.offset().top + el.height() / 2,
        zIndex: 9999
      })
    )
  }
}
