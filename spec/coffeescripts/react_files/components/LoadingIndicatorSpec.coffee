define [
  'react'
  'react-dom'
  'jquery'
  'jsx/files/LoadingIndicator'
], (React, ReactDOM, $, LoadingIndicator) ->

  TestUtils = React.addons.TestUtils

  module 'LoadingIndicator'

  test 'display none if no props supplied', ->
    loadingIndicator = React.createFactory(LoadingIndicator)
    rendered = TestUtils.renderIntoDocument(loadingIndicator())
    equal $(rendered.getDOMNode()).css('display'), "none", "loading indicator not shown"
    ReactDOM.unmountComponentAtNode(rendered.getDOMNode().parentNode)

  test 'if props supplied for loading', ->
    loadingIndicator = React.createFactory(LoadingIndicator)
    rendered = TestUtils.renderIntoDocument(loadingIndicator(isLoading: true))
    equal $(rendered.getDOMNode()).css('display'), "", "loading indicator is shown"
    ReactDOM.unmountComponentAtNode(rendered.getDOMNode().parentNode)
