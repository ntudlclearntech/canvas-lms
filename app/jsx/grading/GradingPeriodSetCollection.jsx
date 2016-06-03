define([
  'react',
  'underscore',
  'jquery',
  'convert_case',
  'axios',
  'i18n!grading_periods',
  'jsx/grading/GradingPeriodSet',
  'jsx/grading/SearchGradingPeriodsField',
  'jsx/shared/helpers/searchHelpers'
], function(React, _, $, ConvertCase, axios, I18n, GradingPeriodSet, SearchGradingPeriodsField, SearchHelpers) {

  const deserializeSets = function(sets) {
    return _.map(sets, function(set) {
      let newSet = ConvertCase.camelize(set);
      newSet.id = set.id.toString();
      newSet.gradingPeriods = deserializePeriods(set.grading_periods);
      return newSet;
    });
  };

  const deserializePeriods = function(periods) {
    return _.map(periods, function(period) {
      let newPeriod = ConvertCase.camelize(period);
      newPeriod.id = period.id.toString();
      newPeriod.startDate = new Date(period.start_date);
      newPeriod.endDate = new Date(period.end_date);
      return newPeriod;
    });
  };

  let GradingPeriodSetCollection = React.createClass({
    propTypes: {
      URLs: React.PropTypes.shape({
        gradingPeriodSetsURL: React.PropTypes.string.isRequired
      }).isRequired
    },

    getInitialState: function() {
      return {
        sets: [],
        showNewSetForm: false,
        searchText: ""
      };
    },

    componentWillMount: function() {
      this.getSets();
    },

    getSets: function() {
      axios.get(this.props.URLs.gradingPeriodSetsURL)
           .then((response) => {
              this.setState({
                sets: deserializeSets(response.data.grading_period_sets)
              });
            })
            .catch(() => {
              $.flashError(I18n.t("An error occured while fetching grading period sets."));
            });
    },

    renderNewGradingPeriodSetForm: function() {
      if(!this.state.showNewSetForm) return null;

      return (
        <NewGradingPeriodSetForm
          ref="newSetForm"
          closeForm={this.closeNewSetForm}
          URLs={this.props.URLs}
        />
      );
    },

    setAndGradingPeriodTitles(set) {
      let titles = _.pluck(set.gradingPeriods, 'title');
      titles.unshift(set.title);
      return _.compact(titles);
    },

    searchTextMatchesTitles(titles) {
      return _.any(titles, (title) => {
        return SearchHelpers.substringMatchRegex(this.state.searchText).test(title);
      });
    },

    filterSetsBySearchText: function() {
      if (this.state.searchText === "") return this.state.sets;

      return _.filter(this.state.sets, (set) => {
        let titles = this.setAndGradingPeriodTitles(set);
        return this.searchTextMatchesTitles(titles);
      });
    },

    changeSearchText: function(searchText) {
      if (searchText !== this.state.searchText) {
        this.setState({ searchText: searchText });
      }
    },

    renderSets: function() {
      let visibleSets = this.filterSetsBySearchText();
      return _.map(visibleSets, set => {
        return (
          <GradingPeriodSet key={set.id}
                            set={set}
                            gradingPeriods={set.gradingPeriods}/>
        );
      });
    },

    render: function() {
      return (
        <div>
          <div className="GradingPeriodSets__toolbar header-bar no-line">
            <SearchGradingPeriodsField changeSearchText={this.changeSearchText} />
            <div className="header-bar-right">
            </div>
          </div>
          <div>
            {this.renderSets()}
          </div>
        </div>
      );
    }
  });

  return GradingPeriodSetCollection;
});
