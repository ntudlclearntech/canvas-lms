define([
  'react',
  'underscore',
  'jquery',
  'instructure-ui/Button',
  'instructure-ui/Checkbox',
  'i18n!grading_periods',
  'compiled/api/gradingPeriodSetsApi',
  'jsx/grading/EnrollmentTermInput',
  'compiled/jquery.rails_flash_notifications'
], function(React, _, $, { default: Button }, { default: Checkbox }, I18n, setsApi, EnrollmentTermInput) {

  let NewGradingPeriodSetForm = React.createClass({
    propTypes: {
      enrollmentTerms:         React.PropTypes.array.isRequired,
      closeForm:               React.PropTypes.func.isRequired,
      addGradingPeriodSet:     React.PropTypes.func.isRequired,
      readOnly:                React.PropTypes.bool.isRequired,
      urls:                    React.PropTypes.shape({
        gradingPeriodSetsURL:  React.PropTypes.string.isRequired
      }).isRequired
    },

    getInitialState() {
      return {
        buttonsDisabled: false,
        title: "",
        weighted: false,
        selectedEnrollmentTermIDs: []
      };
    },

    componentDidMount() {
      this.refs.titleInput.focus();
    },

    setSelectedEnrollmentTermIDs(termIDs) {
      this.setState({
        selectedEnrollmentTermIDs: termIDs
      });
    },

    isTitlePresent() {
      if(this.state.title.trim() !== '') {
        return true;
      } else {
        $.flashError(I18n.t("A name for this set is required"));
        return false;
      }
    },

    isValid() {
      return this.isTitlePresent()
    },

    submit(event) {
      event.preventDefault();
      this.setState({ buttonsDisabled: true }, () => {
        if(this.isValid()) {
          let set = { title: this.state.title.trim(), weighted: this.state.weighted };
          set.enrollmentTermIDs = this.state.selectedEnrollmentTermIDs;
          setsApi.create(set)
                 .then(this.submitSucceeded)
                 .catch(this.submitFailed);
        } else {
          this.setState({ buttonsDisabled: false });
        }
      });
    },

    submitSucceeded(set) {
      $.flashMessage(I18n.t("Successfully created a set"));
      this.props.addGradingPeriodSet(set, this.state.selectedEnrollmentTermIDs);
    },

    submitFailed() {
      $.flashError(I18n.t("There was a problem submitting your set"));
      this.setState({ buttonsDisabled: false });
    },

    onSetTitleChange(event) {
      this.setState({ title: event.target.value });
    },

    onSetWeightedChange(event) {
      this.setState({ weighted: event.target.checked });
    },

    render() {
      return (
        <div className="GradingPeriodSetForm pad-box">
          <form className="ic-Form-group ic-Form-group--horizontal">
            <div className="grid-row">
              <div className="col-xs-12 col-lg-6">
                <div className="ic-Form-control">
                  <label htmlFor="set-name" className="ic-Label">{I18n.t("Set name")}</label>
                  <input onChange={this.onSetTitleChange}
                         type="text"
                         id="set-name"
                         className="ic-Input"
                         placeholder={I18n.t("Set name...")}
                         ref="titleInput"/>
                </div>
                <EnrollmentTermInput
                  enrollmentTerms              = {this.props.enrollmentTerms}
                  selectedIDs                  = {this.state.selectedEnrollmentTermIDs}
                  setSelectedEnrollmentTermIDs = {this.setSelectedEnrollmentTermIDs}
                />
                <div className="ic-Input">
                  <Checkbox
                    ref={(ref) => { this.weightedCheckbox = ref }}
                    label={I18n.t('Weighted grading periods')}
                    value="weighted"
                    checked={this.state.weighted}
                    onChange={this.onSetWeightedChange}
                  />
                </div>
              </div>
            </div>
            <div className="grid-row">
              <div className="col-xs-12 col-lg-12">
                <div className="ic-Form-actions below-line">
                  <Button disabled={this.state.buttonsDisabled}
                          onClick={this.props.closeForm}
                          ref="cancelButton">
                    {I18n.t("Cancel")}
                  </Button>
                  &nbsp;
                  <Button disabled={this.state.buttonsDisabled}
                          variant="primary"
                          onClick={this.submit}
                          ref="createButton">
                    {I18n.t("Create")}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      );
    }
  });

  return NewGradingPeriodSetForm;
});
