define [
  'Backbone'
  'compiled/collections/AssignmentGroupCollection'
  'compiled/models/Course'
  'compiled/models/AssignmentGroup'
  'compiled/views/assignments/AssignmentSettingsView'
  'compiled/views/assignments/AssignmentGroupWeightsView'
  'jquery'
  'helpers/fakeENV'
  'helpers/jquery.simulate'
], (Backbone, AssignmentGroupCollection, Course, AssignmentGroup, AssignmentSettingsView, AssignmentGroupWeightsView, $, fakeENV) ->

  group = (opts = {}) ->
    new AssignmentGroup $.extend({group_weight: 50}, opts)

  assignmentGroups = ->
    @groups = new AssignmentGroupCollection([group(), group()])

  createView = (opts = {}) ->
    @course = new Course
      apply_assignment_group_weights: opts.weighted
    @course.urlRoot = "/courses/1" #without this it keeps throwing an error
    view = new AssignmentSettingsView
      model: @course
      assignmentGroups: opts.assignmentGroups or assignmentGroups()
      weightsView: AssignmentGroupWeightsView
      userIsAdmin: opts.userIsAdmin
    if opts.trigger
      view.setTrigger(opts.trigger)
    view.open()
    view

  module 'AssignmentSettingsView',
    setup: -> fakeENV.setup()
    teardown: -> fakeENV.teardown()

  test 'sets the checkbox to the right value on open', ->
    view = createView(weighted: true)
    ok view.$('#apply_assignment_group_weights').prop('checked')
    view.remove()

    view = createView(weighted: false)
    ok !view.$('#apply_assignment_group_weights').prop('checked')
    view.remove()

  test 'shows the weights table when checked', ->
    view = createView(weighted: true)
    ok view.$('#ag_weights_wrapper').is(":visible")
    view.remove()

  test 'hides the weights table when clicked', ->
    view = createView(weighted: true)
    ok view.$('#ag_weights_wrapper').is(":visible")
    view.$('#apply_assignment_group_weights').click()
    ok view.$('#ag_weights_wrapper').not(":visible")
    view.remove()

  test 'calculates the total weight', ->
    view = createView(weighted: true)
    equal view.$('#percent_total').text(), '100%'

  test 'changes the apply_assignment_group_weights flag', ->
    view = createView(weighted: true)
    view.$('#apply_assignment_group_weights').click()
    attributes = view.getFormData()
    equal(attributes.apply_assignment_group_weights, "0")
    view.remove()

  test 'changes the checkbox icon on the menu item when apply_assignment_group_weights flag changes', ->
    $('body').append('<a id="assignmentSettingsCog"><i class="icon-check"></i></a> ')
    $trigger = $('#assignmentSettingsCog')
    view = createView(trigger: $trigger[0])

    view.$('#apply_assignment_group_weights').click()
    iconClass = view.$trigger.find('i').attr('class')

    view.$('#apply_assignment_group_weights').click()
    notEqual iconClass, view.$trigger.find('i').attr('class')

    view.$('#apply_assignment_group_weights').click()
    equal iconClass, view.$trigger.find('i').attr('class')

    view.remove()
    $trigger.remove()

  test 'saves group weights', ->
    view = createView(weighted: true)
    view.$(".ag-weights-tr:eq(0) .group_weight_value").val("20")
    view.$(".ag-weights-tr:eq(1) .group_weight_value").val("80")

    view.$("#update-assignment-settings").click()
    equal view.assignmentGroups.first().get('group_weight'), 20
    equal view.assignmentGroups.last().get('group_weight'), 80
    view.remove()

  module 'AssignmentSettingsView with an assignment in a closed grading period',
    setup: ->
      fakeENV.setup(MULTIPLE_GRADING_PERIODS_ENABLED: true)
    teardown: -> fakeENV.teardown()

  test 'disables the checkbox', ->
    closed_group = group(has_assignment_due_in_closed_grading_period: true)
    groups = new AssignmentGroupCollection([group(), closed_group])
    view = createView(weighted: true, assignmentGroups: groups)
    ok view.$('#apply_assignment_group_weights').hasClass("disabled")
    ok view.$('#ag_weights_wrapper').is(":visible")
    ok view.$('#apply_assignment_group_weights').prop('checked')
    view.$('#apply_assignment_group_weights').click()
    ok view.$('#ag_weights_wrapper').is(":visible")
    ok view.$('#apply_assignment_group_weights').prop('checked')
    view.remove()

  test 'does not disable the checkbox when the user is an admin', ->
    closed_group = group(has_assignment_due_in_closed_grading_period: true)
    groups = new AssignmentGroupCollection([group(), closed_group])
    view = createView(weighted: true, assignmentGroups: groups, userIsAdmin: true)
    notOk view.$('#apply_assignment_group_weights').hasClass("disabled")
    ok view.$('#ag_weights_wrapper').is(":visible")
    ok view.$('#apply_assignment_group_weights').prop('checked')
    view.$('#apply_assignment_group_weights').click()
    ok view.$('#ag_weights_wrapper').not(":visible")
    notOk view.$('#apply_assignment_group_weights').prop('checked')
    view.remove()

  test 'does not change the apply_assignment_group_weights flag', ->
    closed_group = group(has_assignment_due_in_closed_grading_period: true)
    groups = new AssignmentGroupCollection([group(), closed_group])
    view = createView(weighted: true, assignmentGroups: groups)
    view.$('#apply_assignment_group_weights').click()
    attributes = view.getFormData()
    equal(attributes.apply_assignment_group_weights, "1")
    view.remove()

  test 'changes the apply_assignment_group_weights flag when the user is an admin', ->
    closed_group = group(has_assignment_due_in_closed_grading_period: true)
    groups = new AssignmentGroupCollection([group(), closed_group])
    view = createView(weighted: true, assignmentGroups: groups, userIsAdmin: true)
    view.$('#apply_assignment_group_weights').click()
    attributes = view.getFormData()
    equal(attributes.apply_assignment_group_weights, "0")
    view.remove()

  test 'disables the weight input fields in the table', ->
    closed_group = group(has_assignment_due_in_closed_grading_period: true, group_weight: 35)
    groups = new AssignmentGroupCollection([group(group_weight: 25), closed_group])
    view = createView(weighted: true, assignmentGroups: groups)
    ok view.$('.ag-weights-tr:eq(0) .group_weight_value').attr('readonly')
    ok view.$('.ag-weights-tr:eq(1) .group_weight_value').attr('readonly')

  test 'disables the Save and Cancel buttons', ->
    closed_group = group(has_assignment_due_in_closed_grading_period: true)
    groups = new AssignmentGroupCollection([group(), closed_group])
    view = createView(weighted: true, assignmentGroups: groups)
    ok view.$('#cancel-assignment-settings').hasClass('disabled')
    ok view.$('#update-assignment-settings').hasClass('disabled')
    view.remove()

  test 'disables the Save and Cancel button handlers', ->
    closed_group = group(has_assignment_due_in_closed_grading_period: true)
    groups = new AssignmentGroupCollection([group(), closed_group])
    view = createView(weighted: true, assignmentGroups: groups)
    @spy view, 'saveFormData'
    @spy view, 'cancel'
    view.$('#cancel-assignment-settings').click()
    view.$('#update-assignment-settings').click()
    notOk view.saveFormData.called
    notOk view.cancel.called
    view.remove()

  test 'calculates the total weight', ->
    closed_group = group(has_assignment_due_in_closed_grading_period: true, group_weight: 35)
    groups = new AssignmentGroupCollection([group(group_weight: 25), closed_group])
    view = createView(weighted: true, assignmentGroups: groups)
    equal view.$('#percent_total').text(), '60%'
