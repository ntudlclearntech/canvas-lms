define [
  'i18n!calendar'
  'jquery'
  'moment'
  'timezone_core'
  'compiled/util/fcUtil'
  'underscore'
  'Backbone'
  'compiled/collections/CalendarEventCollection'
  'compiled/calendar/ShowEventDetailsDialog'
  'jst/calendar/agendaView'
  'vendor/jquery.ba-tinypubsub'
], (I18n, $, moment, tz, fcUtil, _, Backbone, CalendarEventCollection, ShowEventDetailsDialog, template) ->

  class AgendaView extends Backbone.View

    PER_PAGE: 50

    template: template

    els:
      '.agenda-actions .loading-spinner'   : '$spinner'

    events:
      'click .agenda-load-btn': 'loadMore'
      'click .ig-row': 'manageEvent'
      'keyclick .ig-row': 'manageEvent'

    messages:
      loading_more_items: I18n.t('loading_more_items', "Loading more items.")

    @optionProperty 'calendar'

    #Can't be tied to the AgendaView object, because it must maintain persistance.
    currentIndex = -1
    focusedAlready = false

    constructor: ->
      super
      @dataSource = @options.dataSource

      $.subscribe
        "CommonEvent/eventDeleted" : @refetch
        "CommonEvent/eventSaved" : @refetch
        "CalendarHeader/createNewEvent" : @handleNewEvent

    fetch: (contexts, start) ->
      start = fcUtil.now() unless start
      @$el.empty()
      @$el.addClass('active')

      @contexts = contexts

      start.hours(0)
      start.minutes(0)
      start.seconds(0)

      @startDate = start

      @_fetch(start, @handleEvents)

    _fetch: (start, callback) ->
      end = fcUtil.now()
      end.year(3000)
      @lastRequestID = $.guid++
      @dataSource.getEvents start, end, @contexts, callback, {singlePage: true, requestID: @lastRequestID}

    refetch: =>
      return unless @startDate
      @collection = []
      @_fetch(@startDate, @handleEvents)

    handleEvents: (events) =>
      return if events.requestID != @lastRequestID
      @collection = []
      @appendEvents(events)

    appendEvents: (events) =>
      @nextPageDate = events.nextPageDate
      @collection.push.apply(@collection, events)
      @collection = _.sortBy(@collection, 'originalStart')
      @render()

    loadMore: (e) ->
      e.preventDefault()
      @$spinner.show()
      @_fetch(@nextPageDate, @loadMoreFinished)
      $.screenReaderFlashMessage(@messages.loading_more_items)

    loadMoreFinished: (events) =>
      @appendEvents(events)
      @focusFirstNewDate(events)

    focusFirstNewDate: (events) ->
      firstNewEvent = _.min(events, (e) -> e.start)
      $firstEvent = @$("li[data-event-id='#{firstNewEvent.id}']")
      $firstEventDay = $firstEvent.closest('.agenda-day')
      $firstEventDayDate = $firstEventDay.find('.agenda-date')
      $firstEventDayDate[0].focus() if $firstEventDayDate.length

    refocusAfterRender: () ->
      if ((!@collection.length  || currentIndex == -1) && focusedAlready)
        $("#create_new_event_link").focus()
        currentIndex = -1
      else if(currentIndex >= 0)
        children = @$('.ig-list').children()
        elementToFocus = $((children[currentIndex] || children[children.length - 1])).children().first()
        elementToFocus.focus() if elementToFocus

    manageEvent: (e) ->
      e.preventDefault()
      e.stopPropagation()
      focusedAlready = true #So we don't focus the add button right when the page loads.
      eventEl = $(e.target).closest('.agenda-event')
      eventId = eventEl.data('event-id')
      currentIndex = -1 #Default currentIndex to be -1 just in case we don't find any event.
      @collection.forEach((val, index, list) => currentIndex = index if val.id == eventId)
      event = @dataSource.eventWithId(eventId)
      new ShowEventDetailsDialog(event, @dataSource).show e

    handleNewEvent: (e) ->
      #Until we highlight an event, stay focused on the button.
      currentIndex = -1

    render: =>
      super
      @$spinner.hide()
      $.publish('Calendar/colorizeContexts')

      @refocusAfterRender()
      lastEvent = _.last(@collection)
      return if !lastEvent
      @trigger('agendaDateRange', @startDate, lastEvent.originalStart)

    # Internal: Change a flat array of objects into a sturctured array of
    # objects based on the given iterator function. Similar to _.groupBy,
    # except the result is an Array instead of a Hash and this function
    # assumes the list is already sorted by the given iterator.
    #
    # list     - The sorted list of values to box.
    # iterator - A function that returns the value to box by. The iterator
    #            is passed the value from the list.
    #
    # Returns a new boxed array with elemens from the given list.
    sortedBoxBy: (list, iterator) ->
      _.reduce(list, (result, currentElt) ->
        return [[currentElt]] if _.isEmpty(result)

        previousBox = _.last(result)
        previousElt = _.last(previousBox)
        if iterator(currentElt) == iterator(previousElt)
          previousBox.push(currentElt)
        else
          result.push([currentElt])

        result
      , [])

    # Internal: returns the 'start' of the event formatted for the template
    #
    # event - the event to format
    #
    # Returns the formatted String
    formattedDayString: (event) =>
      tz.format(fcUtil.unwrap(event.originalStart), 'date.formats.short_with_weekday')

    # Internal: returns the 'start' of the event formatted for the template
    # Shown to screen reader users, so they hear real month and day names, and
    # not letters like "D E C" or "W E D", or words like "dec" (read "deck")
    #
    # event - the event to format
    #
    # Returns the formatted String
    formattedLongDayString: (event) =>
      tz.format(fcUtil.unwrap(event.originalStart), 'date.formats.long_with_weekday')

    # Internal: change a box of events into an output hash for toJSON
    #
    # events - a box of events (all the events occur on the same day)
    #
    # Returns an Object with 'date' and 'events' keys.
    eventBoxToHash: (events) =>
      now = fcUtil.now()
      event = _.first(events)
      start = event.originalStart
      isToday =
        now.date() == start.date() &&
        now.month() == start.month() &&
        now.year() == start.year()
      date: @formattedDayString(event)
      accessibleDate: @formattedLongDayString(event)
      isToday: isToday
      events: events

    # Internal: Format a hash of event data to an object ready to be sent to the template.
    #
    # boxedEvents - A boxed list of events
    #
    # Returns an object in the format specified by toJSON.
    formatResult: (boxedEvents) ->
      days: _.map(boxedEvents, @eventBoxToHash)
      meta:
        hasMore: !!@nextPageDate

    # Public: Creates the json for the template.
    #
    # Returns an Object:
    #   {
    #     days: [
    #       [date: 'some date', events: [event1.toJSON(), event2.toJSON()],
    #       [date: ...]
    #     ],
    #     meta: {
    #       hasMore: true/false
    #     }
    #   }
    toJSON: ->
      list = @sortedBoxBy(@collection, @formattedDayString)
      @formatResult(list)
