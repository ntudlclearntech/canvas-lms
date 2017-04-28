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

import React from 'react'
import I18n from 'i18n!assignments'

  var DueDateAddRowButton = React.createClass({

    propTypes: {
      display: React.PropTypes.bool.isRequired
    },

    render(){
      if(!this.props.display){ return null }

      return(
        <button id        = "add_due_date"
                ref       = "addButton"
                className = "Button Button--add-row"
                onClick   = {this.props.handleAdd}
                type      = "button" >
          <i className="icon-plus" />
          <span className="screenreader-only">{I18n.t("Add new set of due dates")}</span>
          <span aria-hidden="true">{I18n.t("Add")}</span>
        </button>
      )
    }
  })

export default DueDateAddRowButton
