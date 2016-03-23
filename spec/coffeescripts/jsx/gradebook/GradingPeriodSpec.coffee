define [
  'react'
  'jquery'
  'underscore'
  'jsx/grading/gradingPeriod'
  'helpers/fakeENV'
  'jsx/gradebook/grid/helpers/datesHelper'
  'jquery.instructure_misc_plugins'
  'compiled/jquery.rails_flash_notifications'
], (React, $, _, GradingPeriod, fakeENV, DatesHelper) ->

  TestUtils = React.addons.TestUtils

  module 'GradingPeriod',
    setup: ->
      @stub($, 'flashMessage', -> )
      @stub($, 'flashError', -> )
      @server = sinon.fakeServer.create()
      fakeENV.setup()
      ENV.GRADING_PERIODS_URL = "api/v1/courses/1/grading_periods"

      @createdPeriodData = "grading_periods":[
        {
          "id":"3", "start_date":"2015-04-20T05:00:00Z", "end_date":"2015-04-21T05:00:00Z",
          "weight":null, "title":"New Period!", "permissions": { "read":true, "manage":true }
        }
      ]
      @updatedPeriodData = "grading_periods":[
        {
          "id":"1", "startDate":"2015-03-01T06:00:00Z", "endDate":"2015-05-31T05:00:00Z",
          "weight":null, "title":"Updated Grading Period!", "permissions": { "read":true, "manage":true }
        }
      ]
      @server.respondWith "POST", ENV.GRADING_PERIODS_URL, [200, {"Content-Type":"application/json"}, JSON.stringify @createdPeriodData]
      @server.respondWith "PUT", ENV.GRADING_PERIODS_URL + "/1", [200, {"Content-Type":"application/json"}, JSON.stringify @updatedPeriodData]
      @props =
        id: "1"
        title: "Spring"
        startDate: new Date("2015-03-01T00:00:00Z")
        endDate: new Date("2015-05-31T00:00:00Z")
        weight: null
        disabled: false
        permissions: { read: true, manage: true }
        onDeleteGradingPeriod: ->
        updateGradingPeriodCollection: sinon.spy()

      GradingPeriodElement = React.createElement(GradingPeriod, @props)
      @gradingPeriod = TestUtils.renderIntoDocument(GradingPeriodElement)
      @server.respond()
    teardown: ->
      React.unmountComponentAtNode(@gradingPeriod.getDOMNode().parentNode)
      fakeENV.teardown()
      @server.restore()

  test 'sets initial state properly', ->
    equal @gradingPeriod.state.title, @props.title
    equal @gradingPeriod.state.startDate, @props.startDate
    equal @gradingPeriod.state.endDate, @props.endDate
    equal @gradingPeriod.state.weight, @props.weight

  test 'onDateChange calls replaceInputWithDate', ->
    replaceInputWithDate = @stub(@gradingPeriod, 'replaceInputWithDate')
    @gradingPeriod.onDateChange("startDate", "period_start_date_1")
    ok replaceInputWithDate.calledOnce

  test 'onDateChange calls updateGradingPeriodCollection', ->
    @gradingPeriod.onDateChange("startDate", "period_start_date_1")
    ok @gradingPeriod.props.updateGradingPeriodCollection.calledOnce

  test 'onTitleChange changes the title state', ->
    fakeEvent = { target: { name: "title", value: "MXP: Most Xtreme Primate" } }
    @gradingPeriod.onTitleChange(fakeEvent)
    deepEqual @gradingPeriod.state.title, "MXP: Most Xtreme Primate"

  test 'onTitleChange calls updateGradingPeriodCollection', ->
    fakeEvent = { target: { name: "title", value: "MXP: Most Xtreme Primate" } }
    @gradingPeriod.onTitleChange(fakeEvent)
    ok @gradingPeriod.props.updateGradingPeriodCollection.calledOnce

  test 'replaceInputWithDate calls formatDateForDisplay', ->
    formatDate = @stub(DatesHelper, 'formatDateForDisplay')
    fakeDateElement = { val: -> }
    @gradingPeriod.replaceInputWithDate("startDate", fakeDateElement)
    ok formatDate.calledOnce
