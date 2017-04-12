if ENV.badge_counts
  require.ensure [], () ->
    $ = require('jquery')
    $ ->
      for type, unread of ENV.badge_counts
        if unread > 0
          type = "grades" if type is "submissions"
          $badge = $("<b/>").text(unread).addClass("nav-badge")
          $("#section-tabs .#{type}").append($badge)
  , 'badgeCountsAsyncChunk'
