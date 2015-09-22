define [
  'ember'
  '../start_app'
  '../shared_ajax_fixtures'
  'helpers/fakeENV'
], (Ember, startApp, fixtures, fakeENV) ->

  {run} = Ember

  fixtures.create()

  setType = null

  module 'grading_cell',
    setup: ->
      App = startApp()
      @component = App.GradingCellComponent.create()

      setType = (type) =>
        run => @assignment.set('grading_type', type)
      @component.reopen
        changeGradeURL: ->
          "/api/v1/assignment/:assignment/:submission"
      fakeENV.setup({ current_user_roles: [ "teacher" ] })
      run =>
        @submission = Ember.Object.create
          grade: 'A'
          assignment_id: 1
          user_id: 1
        @assignment = Ember.Object.create
          grading_type: 'points'
          due_at: new Date(2015, 6, 15)
        @component.setProperties
          'submission': @submission
          assignment: @assignment
        @component.append()

    teardown: ->
      fakeENV.teardown()
      run =>
        @component.destroy()
        App.destroy()

  test "setting value on init", ->
    component = App.GradingCellComponent.create()
    equal(component.get('value'), '-')

    equal(@component.get('value'), 'A')


  test "saveURL", ->
    equal(@component.get('saveURL'), "/api/v1/assignment/1/1")

  test "isPoints", ->
    setType 'points'
    ok @component.get('isPoints')

  test "isPercent", ->
    setType 'percent'
    ok @component.get('isPercent')

  test "isLetterGrade", ->
    setType 'letter_grade'
    ok @component.get('isLetterGrade')

  test "nilPointsPossible", ->
    ok @component.get('nilPointsPossible')
    run => @assignment.set('points_possible', 10)
    equal @component.get('nilPointsPossible'), false

  test "isGpaScale", ->
    setType 'gpa_scale'
    ok @component.get('isGpaScale')

  test "isInPastGradingPeriodAndNotAdmin returns true with defaults set in module above", ->
    ok @component.get('isInPastGradingPeriodAndNotAdmin')

  test "isInPastGradingPeriodAndNotAdmin returns false when multiple grading periods is disabled", ->
    ENV.GRADEBOOK_OPTIONS.multiple_grading_periods_enabled = false
    ok ! @component.get('isInPastGradingPeriodAndNotAdmin')

  test "isInPastGradingPeriodAndNotAdmin returns false when user is an admin", ->
    ENV.current_user_roles = ["teacher", "admin"]
    ok ! @component.get('isInPastGradingPeriodAndNotAdmin')

  test "isInPastGradingPeriodAndNotAdmin returns false when no past grading periods exist", ->
    ENV.GRADEBOOK_OPTIONS.latest_end_date_of_admin_created_grading_periods_in_the_past = null
    ok ! @component.get('isInPastGradingPeriodAndNotAdmin')

  asyncTest "focusOut", ->
    expect(1)
    stub = sinon.stub @component, 'boundUpdateSuccess'
    submissions = []

    requestStub = null
    run =>
      requestStub = Ember.RSVP.resolve all_submissions: submissions

    sinon.stub(@component, 'ajax').returns requestStub

    run =>
      @component.set('value', 'ohai')
      @component.send('focusOut', {target: {id: 'student_and_assignment_grade'}})
      start()

    ok stub.called
