define([
  'react',
  'underscore',
  'jquery',
  'i18n!grading_periods',
  'convert_case',
  'jsx/grading/GradingPeriodSet',
  'jsx/grading/SearchGradingPeriodsField',
  'jsx/shared/helpers/searchHelpers',
  'jsx/shared/helpers/dateHelper',
  'jsx/grading/EnrollmentTermsDropdown',
  'jsx/grading/NewGradingPeriodSetForm',
  'jsx/grading/EditGradingPeriodSetForm',
  'compiled/api/gradingPeriodSetsApi',
  'compiled/api/enrollmentTermsApi',
  'jquery.instructure_misc_plugins'
], function(React, _, $, I18n, ConvertCase, GradingPeriodSet, SearchGradingPeriodsField, SearchHelpers, DateHelper, EnrollmentTermsDropdown, NewGradingPeriodSetForm, EditGradingPeriodSetForm, setsApi, termsApi) {

  const presentEnrollmentTerms = function(enrollmentTerms) {
    return _.map(enrollmentTerms, term => {
      let newTerm = _.extend({}, term);

      if (newTerm.name) {
        newTerm.displayName = newTerm.name;
      } else if (_.isDate(newTerm.startAt)) {
        let started = DateHelper.formatDateForDisplay(newTerm.startAt);
        newTerm.displayName = I18n.t("Term starting ") + started;
      } else {
        let created = DateHelper.formatDateForDisplay(newTerm.createdAt);
        newTerm.displayName = I18n.t("Term created ") + created;
      }

      return newTerm;
    });
  };

  const getShowGradingPeriodSetRef = function(set) {
    return "show-grading-period-set-" + set.id;
  };

  const getEditGradingPeriodSetRef = function(set) {
    return "edit-grading-period-set-" + set.id;
  };

  const setFocus = function(ref) {
    React.findDOMNode(ref).focus();
  };

  const { bool, string, shape } = React.PropTypes;

  let GradingPeriodSetCollection = React.createClass({
    propTypes: {
      readOnly: bool.isRequired,

      urls: shape({
        gradingPeriodSetsURL:    string.isRequired,
        gradingPeriodsUpdateURL: string.isRequired,
        enrollmentTermsURL:      string.isRequired,
        deleteGradingPeriodURL:  string.isRequired
      }).isRequired,
    },

    getInitialState() {
      return {
        enrollmentTerms: [],
        sets: [],
        showNewSetForm: false,
        searchText: "",
        selectedTermID: "0",
        editSet: {
          id:          null,
          saving:      false,
          wasExpanded: false
        }
      };
    },

    componentDidUpdate(prevProps, prevState) {
      if (prevState.editSet.id && (prevState.editSet.id !== this.state.editSet.id)) {
        let set = {id: prevState.editSet.id};
        this.refs[getShowGradingPeriodSetRef(set)].setState({expanded: prevState.editSet.wasExpanded});
        setFocus(this.refs[getShowGradingPeriodSetRef(set)].refs.editButton);
      }
    },

    addGradingPeriodSet(set, termIDs) {
      this.setState({
        sets: [set].concat(this.state.sets),
        enrollmentTerms: this.associateTermsWithSet(set.id, termIDs),
        showNewSetForm: false
      }, () => {
        React.findDOMNode(this.refs.addSetFormButton).focus();
      });
    },

    associateTermsWithSet(setID, termIDs) {
      return _.map(this.state.enrollmentTerms, function(term) {
        if (_.contains(termIDs, term.id)) {
          let newTerm = _.extend({}, term);
          newTerm.gradingPeriodGroupId = setID;
          return newTerm;
        } else {
          return term;
        }
      });
    },

    componentWillMount() {
      this.getSets();
      this.getTerms();
    },

    getSets() {
      setsApi.list()
        .then((sets) => {
          this.onSetsLoaded(sets);
        })
        .catch((_) => {
          $.flashError(I18n.t(
            "An error occured while fetching grading period sets."
          ));
        });
    },

    getTerms() {
      termsApi.list()
        .then((terms) => {
          this.onTermsLoaded(terms);
        })
        .catch((_) => {
           $.flashError(I18n.t(
             "An error occured while fetching enrollment terms."
           ));
        });
    },

    onTermsLoaded(terms) {
      this.setState({ enrollmentTerms: presentEnrollmentTerms(terms) });
    },

    onSetsLoaded(sets) {
      const sortedSets = _.sortBy(sets, "createdAt").reverse()
      this.setState({ sets: sortedSets });
    },

    onSetUpdated(updatedSet) {
      let sets = _.map(this.state.sets, (set) => {
        return (set.id === updatedSet.id) ? _.extend({}, set, updatedSet) : set;
      });

      let terms = _.map(this.state.enrollmentTerms, function(term) {
        if (_.contains(updatedSet.enrollmentTermIDs, term.id)) {
          return _.extend({}, term, { gradingPeriodGroupId: updatedSet.id });
        } else if (term.gradingPeriodGroupId === updatedSet.id) {
          return _.extend({}, term, { gradingPeriodGroupId: null });
        } else {
          return term;
        }
      });

      this.setState({ sets: sets, enrollmentTerms: terms });
      $.flashMessage(I18n.t("The grading period set was updated successfully."));
    },

    setAndGradingPeriodTitles(set) {
      let titles = _.pluck(set.gradingPeriods, 'title');
      titles.unshift(set.title);
      return _.compact(titles);
    },

    searchTextMatchesTitles(titles) {
      return _.any(titles, (title) => {
        return SearchHelpers
          .substringMatchRegex(this.state.searchText).test(title);
      });
    },

    filterSetsBySearchText(sets, searchText) {
      if (searchText === "") return sets;

      return _.filter(sets, (set) => {
        let titles = this.setAndGradingPeriodTitles(set);
        return this.searchTextMatchesTitles(titles);
      });
    },

    changeSearchText(searchText) {
      if (searchText !== this.state.searchText) {
        this.setState({ searchText: searchText });
      }
    },

    filterSetsBySelectedTerm(sets, terms, selectedTermID) {
      if (selectedTermID === "0") return sets;

      const activeTerm = _.findWhere(terms, { id: selectedTermID });
      const setID = activeTerm.gradingPeriodGroupId;
      return _.where(sets, { id: setID });
    },

    changeSelectedEnrollmentTerm(event) {
      this.setState({ selectedTermID: event.target.value });
    },

    getVisibleSets() {
      let setsFilteredBySearchText =
        this.filterSetsBySearchText(this.state.sets, this.state.searchText);
      let filterByTermArgs = [
        setsFilteredBySearchText,
        this.state.enrollmentTerms,
        this.state.selectedTermID
      ];
      return this.filterSetsBySelectedTerm(...filterByTermArgs);
    },

    editGradingPeriodSet(set) {
      let setComponent = this.refs[getShowGradingPeriodSetRef(set)];
      this.setState({ editSet: {id: set.id, saving: false, wasExpanded: setComponent.state.expanded }});
    },

    removeGradingPeriodSet(setID) {
      let newSets = _.reject(this.state.sets, set => set.id === setID);
      this.setState({ sets: newSets });
    },

    updateSetPeriods(setID, gradingPeriods) {
      let newSets = _.map(this.state.sets, (set) => {
        if (set.id === setID) {
          return _.extend({}, set, { gradingPeriods: gradingPeriods });
        }

        return set;
      });

      this.setState({ sets: newSets });
    },

    openNewSetForm() {
      this.setState({ showNewSetForm: true });
    },

    closeNewSetForm() {
      this.setState({ showNewSetForm: false }, () => {
        React.findDOMNode(this.refs.addSetFormButton).focus();
      });
    },

    termsBelongingToActiveSets() {
      const setIDs = _.pluck(this.state.sets, "id");
      return _.filter(this.state.enrollmentTerms, function(term) {
        const setID = term.gradingPeriodGroupId;
        return setID && _.contains(setIDs, setID);
      });
    },

    termsNotBelongingToActiveSets() {
      return _.difference(this.state.enrollmentTerms, this.termsBelongingToActiveSets());
    },

    selectableTermsForEditSetForm(setID) {
      const termsBelongingToThisSet = _.where(this.termsBelongingToActiveSets(), { gradingPeriodGroupId: setID });
      return _.union(this.termsNotBelongingToActiveSets(), termsBelongingToThisSet);
    },

    closeEditSetForm(id) {
      this.setState({ editSet: {id: null, saving: false, wasExpanded: false }});
    },

    renderEditGradingPeriodSetForm(set) {
      let cancelCallback = () => {
        this.closeEditSetForm(set.id);
      };

      let saveCallback = (set) => {
        let editSet = _.extend({}, this.state.editSet, {saving: true});
        this.setState({editSet: editSet});
        setsApi.update(set)
               .then((updated) => {
                 this.onSetUpdated(updated);
                 this.closeEditSetForm(set.id);
               })
               .catch((_) => {
                 $.flashError(I18n.t(
                   "An error occured while updating the grading period set."
                 ));
               });
      };

      return (
        <EditGradingPeriodSetForm
          key             = {set.id}
          ref             = {getEditGradingPeriodSetRef(set)}
          set             = {set}
          enrollmentTerms = {this.selectableTermsForEditSetForm(set.id)}
          disabled        = {this.state.editSet.saving}
          onCancel        = {cancelCallback}
          onSave          = {saveCallback} />
      );
    },

    renderSets() {
      const urls = {
        batchUpdateURL: this.props.urls.gradingPeriodsUpdateURL,
        gradingPeriodSetsURL: this.props.urls.gradingPeriodSetsURL,
        deleteGradingPeriodURL: this.props.urls.deleteGradingPeriodURL
      };

      return _.map(this.getVisibleSets(), set => {
        if (this.state.editSet.id === set.id) {
          return this.renderEditGradingPeriodSetForm(set);
        } else {
          return (
            <GradingPeriodSet
              key             = {set.id}
              ref             = {getShowGradingPeriodSetRef(set)}
              set             = {set}
              gradingPeriods  = {set.gradingPeriods}
              urls            = {urls}
              actionsDisabled = {!!this.state.editSet.id}
              readOnly        = {this.props.readOnly}
              permissions     = {set.permissions}
              terms           = {this.state.enrollmentTerms}
              onEdit          = {this.editGradingPeriodSet}
              onDelete        = {this.removeGradingPeriodSet}
              onPeriodsChange = {this.updateSetPeriods}
            />
          );
        }
      });
    },

    renderNewGradingPeriodSetForm() {
      if (this.state.showNewSetForm) {
        return (
          <NewGradingPeriodSetForm
            ref                 = "newSetForm"
            closeForm           = {this.closeNewSetForm}
            urls                = {this.props.urls}
            enrollmentTerms     = {this.termsNotBelongingToActiveSets()}
            readOnly            = {this.props.readOnly}
            addGradingPeriodSet = {this.addGradingPeriodSet}
          />
        );
      }
    },

    renderAddSetFormButton() {
      let disable = this.state.showNewSetForm || !!this.state.editSet.id;
      if (!this.props.readOnly) {
        return (
          <button
            ref            = 'addSetFormButton'
            className      = {disable ? 'Button Button--primary disabled' : 'Button Button--primary'}
            aria-disabled  = {disable}
            onClick        = {this.openNewSetForm}
            aria-label     = {I18n.t("Add Set of Grading Periods")}
          >
            <i className="icon-plus"/>
            &nbsp;
            <span aria-hidden="true">{I18n.t("Set of Grading Periods")}</span>
          </button>
        );
      }
    },

    render() {
      return (
        <div>
          <div className="GradingPeriodSets__toolbar header-bar no-line">
            <EnrollmentTermsDropdown
              terms={this.termsBelongingToActiveSets()}
              changeSelectedEnrollmentTerm={this.changeSelectedEnrollmentTerm} />
            <SearchGradingPeriodsField changeSearchText={this.changeSearchText} />
            <div className="header-bar-right">
              {this.renderAddSetFormButton()}
            </div>
          </div>
          {this.renderNewGradingPeriodSetForm()}
          <div id="grading-period-sets">
            {this.renderSets()}
          </div>
        </div>
      );
    }
  });

  return GradingPeriodSetCollection;
});
