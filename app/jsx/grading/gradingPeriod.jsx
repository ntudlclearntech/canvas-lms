define([
  'timezone',
  'react',
  'jquery',
  'i18n!external_tools',
  'underscore',
  'jsx/grading/gradingPeriodTemplate',
  'jsx/shared/helpers/dateHelper'
], function(tz, React, $, I18n, _, GradingPeriodTemplate, DateHelper) {
  var Types = React.PropTypes;

  var GradingPeriod = React.createClass({
    propTypes: {
      title: Types.string.isRequired,
      startDate: Types.instanceOf(Date).isRequired,
      endDate: Types.instanceOf(Date).isRequired,
      closeDate: Types.instanceOf(Date).isRequired,
      id: Types.string.isRequired,
      updateGradingPeriodCollection: Types.func.isRequired,
      onDeleteGradingPeriod: Types.func.isRequired,
      disabled: Types.bool.isRequired,
      readOnly: Types.bool.isRequired,
      permissions: Types.shape({
        update: Types.bool.isRequired,
        delete: Types.bool.isRequired,
      }).isRequired
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

      if (dateType === "endDate" && DateHelper.isMidnight(updatedDate)) {
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
      dateElement.val(DateHelper.formatDatetimeForDisplay(date));
    },

    render: function () {
      return (
        <GradingPeriodTemplate key={this.props.id}
                               ref="template"
                               id={this.props.id}
                               title={this.props.title}
                               startDate={this.props.startDate}
                               endDate={this.props.endDate}
                               closeDate={this.props.closeDate || this.props.endDate}
                               permissions={this.props.permissions}
                               disabled={this.props.disabled}
                               readOnly={this.props.readOnly}
                               onDeleteGradingPeriod={this.props.onDeleteGradingPeriod}
                               onDateChange={this.onDateChange}
                               onTitleChange={this.onTitleChange}/>
      );
    }
  });

  return GradingPeriod;
});
