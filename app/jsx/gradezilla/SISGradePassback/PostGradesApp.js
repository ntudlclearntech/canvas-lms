import React from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'
import I18n from 'i18n!modules'
import PostGradesDialog from 'jsx/gradezilla/SISGradePassback/PostGradesDialog'
import classnames from 'classnames'

const { bool, func, shape, string } = React.PropTypes

// The PostGradesApp mounts a single "Post Grades" button, which pops up
// the PostGradesDialog when clicked.
class PostGradesApp extends React.Component {
  static propTypes = {
    labelText: string.isRequired,
    store: shape({
      addChangeListener: func.isRequired,
      removeChangeListener: func.isRequired,
    }).isRequired,
    renderAsButton: bool,
    returnFocusTo: shape({
      focus: func.isRequired
    }).isRequired
  };

  static defaultProps = {
    renderAsButton: false
  };

  static AppLaunch (store, returnFocusTo) {
    const $dialog = $('<div class="post-grades-dialog">').dialog({
      title: I18n.t('Post Grades to SIS'),
      maxWidth: 650,
      maxHeight: 450,
      minWidth: 650,
      minHeight: 450,
      width: 650,
      height: 450,
      resizable: false,
      buttons: [],
      close () {
        ReactDOM.unmountComponentAtNode(this);
        $(this).remove();
        if (returnFocusTo) {
          returnFocusTo.focus();
        }
      }
    });

    function closeDialog (e) {
      e.preventDefault();
      $dialog.dialog('close');
    }

    store.reset()
    ReactDOM.render(<PostGradesDialog store={store} closeDialog={closeDialog} />, $dialog[0]);
  }

  componentDidMount () {
    this.boundForceUpdate = this.forceUpdate.bind(this)
    this.props.store.addChangeListener(this.boundForceUpdate)
  }

  componentWillUnmount () { this.props.store.removeChangeListener(this.boundForceUpdate) }

  openDialog (e) {
    e.preventDefault();

    PostGradesApp.AppLaunch(this.props.store, this.props.returnFocusTo);
  }

  render () {
    const navClass = classnames({
      'ui-button': this.props.renderAsButton
    });
    if (this.props.renderAsButton) {
      return (
        <button
          id="post-grades-button"
          className={navClass}
          onClick={this.openDialog}
        >{this.props.labelText}</button>
      );
    } else {
      return (
        <a
          tabIndex={0}
          id="post-grades-button"
          className={navClass}
          onClick={this.openDialog}
        >{this.props.labelText}</a>
      );
    }
  }
}

export default PostGradesApp
