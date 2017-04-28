/*
 * Copyright (C) 2015 - present Instructure, Inc.
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

import I18n from 'i18nObj'
import React from 'react'
import tz from 'timezone'
import _ from 'underscore'
import $ from 'jquery'
import 'jquery.instructure_date_and_time'


  var slowRender = function () {
    var datetime = this.props.dateTime;
    if (!datetime) {
      return (<time></time>);
    }
    if (!_.isDate(datetime)) {
      datetime = tz.parse(datetime);
    }
    var fudged = $.fudgeDateForProfileTimezone(datetime);
    var friendly = $.friendlyDatetime(fudged);

    var timeProps = _.extend({}, this.props, {
      title: $.datetimeString(datetime),
      dateTime: datetime.toISOString()
    });

    return (
      <time {...timeProps}>
        <span className='visible-desktop'>
          {/* something like: Mar 6, 2014 */}
          {friendly}
        </span>
        <span className='hidden-desktop'>
          {/* something like: 3/3/2014 */}
          {fudged.toLocaleDateString()}
        </span>
      </time>
    );

  };

  var FriendlyDatetime = React.createClass({

    displayName: 'FriendlyDatetime',

    propTypes: {
      dateTime: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.instanceOf(Date)
      ]).isRequired
    },

    // The original render function is really slow because of all
    // tz.parse, $.fudge, $.datetimeString, etc.
    // As long as @props.datetime stays same, we don't have to recompute our output.
    // memoizing like this beat React.addons.PureRenderMixin 3x
    render: _.memoize(slowRender, function () {
      return this.props.dateTime;
    })

  });

export default FriendlyDatetime
