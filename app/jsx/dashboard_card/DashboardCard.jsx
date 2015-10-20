define([
  'underscore',
  'react',
  'i18n!dashcards',
  './DashboardCardAction',
  './DashboardColorPicker',
  './CourseActivitySummaryStore'
], function(_, React, I18n, DashboardCardAction, DashboardColorPicker, CourseActivitySummaryStore) {

  var DashboardCard = React.createClass({

    // ===============
    //     CONFIG
    // ===============

    displayName: 'DashboardCard',

    propTypes: {
      courseId: React.PropTypes.string,
      shortName: React.PropTypes.string,
      originalName: React.PropTypes.string,
      courseCode: React.PropTypes.string,
      assetString: React.PropTypes.string,
      term: React.PropTypes.string,
      href: React.PropTypes.string,
      links: React.PropTypes.array
    },

    getDefaultProps: function () {
      return {
        links: []
      };
    },

    nicknameInfo: function(nickname) {
      return {
        nickname: nickname,
        originalName: this.props.originalName,
        courseId: this.props.id,
        onNicknameChange: this.handleNicknameChange
      }
    },

    // ===============
    //    LIFECYCLE
    // ===============

    handleNicknameChange: function(nickname){
      this.setState({ nicknameInfo: this.nicknameInfo(nickname) })
    },

    getInitialState: function() {
      return _.extend({ nicknameInfo: this.nicknameInfo(this.props.shortName) },
        CourseActivitySummaryStore.getStateForCourse(this.props.id))
    },

    componentDidMount: function() {
      CourseActivitySummaryStore.addChangeListener(this.handleStoreChange)
    },

    // ===============
    //    ACTIONS
    // ===============

    handleStoreChange: function() {
      this.setState(
        CourseActivitySummaryStore.getStateForCourse(this.props.id)
      );
    },

    settingsClick: function(e){
      if(e){ e.preventDefault(); }
      this.toggleEditing();
    },

    toggleEditing: function(){
      var currentState = !!this.state.editing;

      if (this.isMounted()) {
        this.setState({editing: !currentState});
      }
    },

    doneEditing: function(){
      if(this.isMounted()) {
        this.setState({editing: false})
      }
    },

    handleColorChange: function(color){
      var hexColor = "#" + color;
      this.props.handleColorChange(hexColor)
    },

    // ===============
    //    HELPERS
    // ===============

    unreadCount: function(icon, stream){
      var activityType = {
        'icon-announcement': 'Announcement',
        'icon-assignment': 'Message',
        'icon-discussion': 'DiscussionTopic'
      }[icon];

      stream = stream || [];
      var streamItem = _.find(stream, function(item) {
        // only return 'Message' type if category is 'Due Date' (for assignments)
        return item.type === activityType &&
          (activityType !== 'Message' || item.notification_category === I18n.t('Due Date'))
      });

      // TODO: unread count is always 0 for assignments (see CNVS-21227)
      return (streamItem) ? streamItem.unread_count : 0;
    },

    // ===============
    //    RENDERING
    // ===============

    colorPickerIfEditing: function(){
      if (this.state.editing) {
        return (
          <DashboardColorPicker
            parentNode        = {this.getDOMNode()}
            doneEditing       = {this.doneEditing}
            handleColorChange = {this.handleColorChange}
            assetString       = {this.props.assetString}
            settingsToggle    = {this.refs.settingsToggle}
            backgroundColor   = {this.props.backgroundColor}
            nicknameInfo      = {this.state.nicknameInfo}
          />
        );
      }
    },

    linksForCard: function(){
      return this.props.links.map(link => {
        if (!link.hidden) {
          return (
            <DashboardCardAction
              unreadCount       = {this.unreadCount(link.icon, this.state.stream)}
              iconClass         = {link.icon}
              linkClass         = {link.css_class}
              path              = {link.path}
              screenReaderLabel = {link.screenreader}
            />
          );
        }
      });
    },

    render: function () {
      return (
        <div className="ic-DashboardCard" ref="cardDiv">
          <div>
            <div className="ic-DashboardCard__background" style={{backgroundColor: this.props.backgroundColor}}>
              <a className="ic-DashboardCard__link" href={this.props.href}>
                <header className="ic-DashboardCard__header">
                  <h2 className="ic-DashboardCard__header-title" title={this.props.originalName}>
                    {this.state.nicknameInfo.nickname}
                  </h2>
                  <p className="ic-DashboardCard__header-subtitle">{this.props.courseCode}</p>
                  {
                    this.props.term ? (
                      <p className="ic-DashboardCard__header-term">
                        {this.props.term}
                      </p>
                    ) : null
                  }
                </header>
              </a>
              <button
                className="Button Button--icon-action-rev ic-DashboardCard__header-button"
                onClick={this.settingsClick}
                ref="settingsToggle"
                >
                  <i className="icon-settings" aria-hidden="true" />
                  <span className="screenreader-only">
                    { I18n.t("Choose a color or course nickname for %{course}", { course: this.state.nicknameInfo.nickname}) }
                  </span>
              </button>
            </div>
            <div className="ic-DashboardCard__action-container">
              { this.linksForCard() }
            </div>
          </div>
          { this.colorPickerIfEditing() }
        </div>
      );
    }
  });

  return DashboardCard;
});
