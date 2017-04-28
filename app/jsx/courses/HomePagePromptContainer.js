/*
 * Copyright (C) 2017 - present Instructure, Inc.
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
import CourseHomeDialog from 'jsx/courses/CourseHomeDialog'
import I18n from 'i18n!home_page_prompt'
import $ from 'jquery'
import 'compiled/jquery.rails_flash_notifications'

class HomePagePromptContainer extends React.Component {
  static propTypes = {
    store: React.PropTypes.object.isRequired,
    onSubmit: React.PropTypes.func.isRequired,
    wikiFrontPageTitle: React.PropTypes.string,
    wikiUrl: React.PropTypes.string.isRequired,
    courseId: React.PropTypes.string.isRequired,
    forceOpen: React.PropTypes.bool.isRequired,
    returnFocusTo: React.PropTypes.instanceOf(Element).isRequired,
  }

  state = {
    dialogOpen: true
  }

  componentDidMount () {
    this.flashScreenReaderAlert()
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.forceOpen) {
      this.setState({dialogOpen: true})
      this.flashScreenReaderAlert()
    }
  }

  flashScreenReaderAlert () {
    $.screenReaderFlashMessage(I18n.t('Before publishing your course, you must either publish a module or choose a different home page.'))
  }

  render () {
    return (
      <CourseHomeDialog
        store={this.props.store}
        open={this.state.dialogOpen}
        onRequestClose={this.onClose}
        courseId={this.props.courseId}
        wikiFrontPageTitle={this.props.wikiFrontPageTitle}
        wikiUrl={this.props.wikiUrl}
        onSubmit={this.props.onSubmit}
        returnFocusTo={this.props.returnFocusTo}
        isPublishing
      />
    )
  }

  onClose = () => {
    this.setState({dialogOpen: false})
  }
}

export default HomePagePromptContainer
