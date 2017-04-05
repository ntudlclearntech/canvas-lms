import I18n from 'i18n!new_nav'
import React from 'react'
import SVGWrapper from 'jsx/shared/SVGWrapper'
import Spinner from 'instructure-ui/lib/components/Spinner'

  var GroupsTray = React.createClass({
    propTypes: {
      groups: React.PropTypes.array.isRequired,
      closeTray: React.PropTypes.func.isRequired,
      hasLoaded: React.PropTypes.bool.isRequired
    },

    getDefaultProps() {
      return {
        groups: []
      };
    },

    renderCurrentGroups() {
      if (!this.props.hasLoaded) {
        return (
          <li className="ic-NavMenu-list-item ic-NavMenu-list-item--loading-message">
            <Spinner size="small" title={I18n.t('Loading')} />
          </li>
        );
      }
      var groups =  this.props.groups.map((group) => {
        if (group.can_access && !group.concluded) {
          return (
            <li className="ic-NavMenu-list-item" key={group.id}>
              <a href={`/groups/${group.id}`} className='ic-NavMenu-list-item__link'>{group.name}</a>
            </li>
          );
        };
      });
      groups.push(
        <li key='allGroupsLink' className='ic-NavMenu-list-item ic-NavMenu-list-item--feature-item'>
          <a href='/groups' className='ic-NavMenu-list-item__link'>{I18n.t('All Groups')}</a>
        </li>
      );
      return groups;
    },

    render() {
      return (
        <div>
          <div className="ic-NavMenu__header">
            <h1 className="ic-NavMenu__headline">{I18n.t('Groups')}</h1>
            <button className="Button Button--icon-action ic-NavMenu__closeButton" type="button" onClick={this.props.closeTray}>
              <i className="icon-x"></i>
              <span className="screenreader-only">{I18n.t('Close')}</span>
            </button>
          </div>
          <ul className="ic-NavMenu__link-list">
            {this.renderCurrentGroups()}
          </ul>
        </div>
      );
    }
  });

export default GroupsTray
