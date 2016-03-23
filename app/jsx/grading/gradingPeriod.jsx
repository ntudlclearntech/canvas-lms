define([
  'timezone',
  'react',
  'jquery',
  'i18n!external_tools',
  'underscore',
  'jsx/grading/gradingPeriodTemplate',
  'jsx/gradebook/grid/helpers/datesHelper'
], function(tz, React, $, I18n, _, GradingPeriodTemplate, DatesHelper) {

  var types = React.PropTypes;
  var GradingPeriod = React.createClass({

    propTypes: {
      title: types.string.isRequired,
      startDate: types.instanceOf(Date).isRequired,
      endDate: types.instanceOf(Date).isRequired,
      id: types.string.isRequired,
      updateGradingPeriodCollection: types.func.isRequired,
      onDeleteGradingPeriod: types.func.isRequired,
      disabled: types.bool.isRequired,
      permissions: types.object.isRequired
    },

    getInitialState: function(){
      return {
        title: this.props.title,
        startDate: this.props.startDate,
        endDate: this.props.endDate,
        weight: this.props.weight
      };
    },

    componentWillReceiveProps: function(nextProps) {
      this.setState({
        title: nextProps.title,
        startDate: nextProps.startDate,
        endDate: nextProps.endDate,
        weight: nextProps.weight,
      });
    },

    onTitleChange: function(event) {
      this.setState({title: event.target.value}, function () {
        this.props.updateGradingPeriodCollection(this);
      });
    },

    onDateChange: function(dateType, id) {
      var $date = $("#" + id);
      var isValidDate = ! ( $date.data('invalid') ||
                            $date.data('blank') );
      var updatedDate = isValidDate ?
        $date.data('unfudged-date') :
        new Date('invalid date');

      if (dateType === "endDate" && DatesHelper.isMidnight(updatedDate)) {
        updatedDate = tz.changeToTheSecondBeforeMidnight(updatedDate);
      }

      var updatedState = {};
      updatedState[dateType] = updatedDate;
      this.setState(updatedState, function() {
        this.replaceInputWithDate(dateType, $date);
        this.props.updateGradingPeriodCollection(this);
      });
    },

    replaceInputWithDate: function(dateType, dateElement) {
      var date = this.state[dateType];
      dateElement.val(DatesHelper.formatDateForDisplay(date));
    },

    render: function () {
      return (
        <GradingPeriodTemplate key={this.props.id}
                               id={this.props.id}
                               title={this.props.title}
                               startDate={this.props.startDate}
                               endDate={this.props.endDate}
                               readonly={!this.props.permissions.manage}
                               disabled={this.props.disabled}
                               onDeleteGradingPeriod={this.props.onDeleteGradingPeriod}
                               onDateChange={this.onDateChange}
                               onTitleChange={this.onTitleChange}/>
      );
    }
  });

  return GradingPeriod;
});
