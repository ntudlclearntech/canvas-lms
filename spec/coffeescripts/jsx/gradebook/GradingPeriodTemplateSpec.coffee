define [
  'react'
  'jsx/grading/gradingPeriodTemplate'
], (React, GradingPeriod) ->

  TestUtils = React.addons.TestUtils

  module 'readonly GradingPeriod',
    setup: ->
      @props =
        title: "Spring"
        startDate: new Date("2015-03-01T00:00:00Z")
        endDate: new Date("2015-05-31T00:00:00Z")
        id: "1"
        readonly: true

      GradingPeriodElement = React.createElement(GradingPeriod, @props)
      @gradingPeriod = TestUtils.renderIntoDocument(GradingPeriodElement)

    teardown: ->
      React.unmountComponentAtNode(@gradingPeriod.getDOMNode().parentNode)

  test 'isNewGradingPeriod returns false if the id does not contain "new"', ->
    equal @gradingPeriod.isNewGradingPeriod(), false

  test 'isNewGradingPeriod returns true if the id contains "new"', ->
    @stub(@gradingPeriod.props, "id", "new1")
    ok @gradingPeriod.isNewGradingPeriod()

  test 'addIdToText returns the given text with the component ID appended to it', ->
    expectedText = "some-text-" + @gradingPeriod.props.id
    equal @gradingPeriod.addIdToText("some-text-"), expectedText

  test 'does not render a delete button', ->
    notOk @gradingPeriod.refs.deleteButton

  test 'renderTitle returns a non-input element (since the grading period is readonly)', ->
    notEqual @gradingPeriod.renderTitle().type, "input"

  test 'renderStartDate returns a non-input element (since the grading period is readonly)', ->
    notEqual @gradingPeriod.renderStartDate().type, "input"

  test 'renderEndDate returns a non-input element (since the grading period is readonly)', ->
    notEqual @gradingPeriod.renderEndDate().type, "input"

  test 'displays the correct title', ->
    titleNode = React.findDOMNode(@gradingPeriod.refs.title)
    equal titleNode.textContent, "Spring"

  test 'displays the correct start date', ->
    startDateNode = React.findDOMNode(@gradingPeriod.refs.startDate)
    equal startDateNode.textContent, "Mar 1, 2015 at 12am"

  test 'displays the correct end date', ->
    endDateNode = React.findDOMNode(@gradingPeriod.refs.endDate)
    equal endDateNode.textContent, "May 31, 2015 at 12am"

  module 'editable GradingPeriod',
    setup: ->
      @props =
        title: "Spring"
        startDate: new Date("2015-03-01T00:00:00Z")
        endDate: new Date("2015-05-31T00:00:00Z")
        id: "1"
        readonly: false
        disabled: false
        onDeleteGradingPeriod: ->
        onDateChange: ->
        onTitleChange: ->

      GradingPeriodElement = React.createElement(GradingPeriod, @props)
      @gradingPeriod = TestUtils.renderIntoDocument(GradingPeriodElement)

    teardown: ->
      React.unmountComponentAtNode(@gradingPeriod.getDOMNode().parentNode)

  test 'renders a delete button', ->
    ok @gradingPeriod.renderDeleteButton()

  test 'renderTitle returns an input element (since the grading period is editable)', ->
    equal @gradingPeriod.renderTitle().type, "input"

  test 'renderStartDate returns an input element (since the grading period is editable)', ->
    equal @gradingPeriod.renderStartDate().type, "input"

  test 'renderEndDate returns an input element (since the grading period is editable)', ->
    equal @gradingPeriod.renderEndDate().type, "input"

  test 'displays the correct title', ->
    titleNode = React.findDOMNode(@gradingPeriod.refs.title)
    equal titleNode.value, "Spring"

  test 'displays the correct start date', ->
    startDateNode = React.findDOMNode(@gradingPeriod.refs.startDate)
    equal startDateNode.value, "Mar 1, 2015 at 12am"

  test 'displays the correct end date', ->
    endDateNode = React.findDOMNode(@gradingPeriod.refs.endDate)
    equal endDateNode.value, "May 31, 2015 at 12am"


  module 'custom prop validation for editable periods',
    defaultProps: ->
      title: "Spring"
      startDate: new Date("2015-03-01T00:00:00Z")
      endDate: new Date("2015-05-31T00:00:00Z")
      id: "1"
      readonly: false
      disabled: false
      onDeleteGradingPeriod: ->
      onDateChange: ->
      onTitleChange: ->

    setup: ->
      @consoleWarn = @stub(console, 'warn')

  test 'does not warn of invalid props if all required props are present and of the correct type', ->
    props = @defaultProps()
    React.createElement(GradingPeriod, props)
    ok @consoleWarn.notCalled

  test 'warns of missing props if required props are missing', ->
    props = @defaultProps()
    delete props.disabled
    invalidPropMessage = "Warning: Failed propType: GradingPeriodTemplate: required prop disabled not provided or of wrong type."
    React.createElement(GradingPeriod, props)
    ok @consoleWarn.calledWithExactly(invalidPropMessage)

  test 'warns of invalid props if required props are of the wrong type', ->
    props = @defaultProps()
    props.onDeleteGradingPeriod = 'hi ;)'
    invalidPropMessage = "Warning: Failed propType: GradingPeriodTemplate: required prop onDeleteGradingPeriod not provided or of wrong type."
    React.createElement(GradingPeriod, props)
    ok @consoleWarn.calledWithExactly(invalidPropMessage)
