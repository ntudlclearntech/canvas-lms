define (require) ->
  EventTracker = require('../event_tracker')
  K = require('../constants')

  class PageBlurred extends EventTracker
    eventType: K.EVT_PAGE_BLURRED
    options: {
      frequency: 5000
    }

    install: (deliver) ->
      @bind window, 'blur', ->
        unless document.activeElement.tagName == "IFRAME"
          deliver()
      , throttle: @getOption('frequency')
