define([
  'react',
  'underscore',
  'jsx/grading/GradingPeriodSetCollection',
  'compiled/api/gradingPeriodSetsApi',
  'compiled/api/enrollmentTermsApi'
], (React, _, SetCollection, setsApi, termsApi) => {
  const wrapper = document.getElementById('fixtures');
  const Simulate = React.addons.TestUtils.Simulate;

  const assertDisabled = function(component) {
    let $el = React.findDOMNode(component);
    equal($el.getAttribute('aria-disabled'), 'true');
    ok(_.contains($el.classList, 'disabled'));
  };

  const assertEnabled = function(component) {
    let $el = React.findDOMNode(component);
    equal($el.getAttribute('aria-disabled'), 'false');
    notOk(_.contains($el.classList, 'disabled'));
  };

  const exampleSet = {
    id: "1",
    title: "Fall 2015",
    gradingPeriods: [
      {
        id: "1",
        title: "Q1",
        startDate: new Date("2015-09-01T12:00:00Z"),
        endDate: new Date("2015-10-31T12:00:00Z")
      },{
        id: "2",
        title: "Q2",
        startDate: new Date("2015-11-01T12:00:00Z"),
        endDate: new Date("2015-12-31T12:00:00Z")
      }
    ],
    permissions: { read: true, create: true, update: true, delete: true }
  };

  const exampleSets = [
    exampleSet,
    {
      id: "2",
      title: "Spring 2016",
      gradingPeriods: [],
      permissions: { read: true, create: true, update: true, delete: true }
    }
  ];

  const exampleTerms = [
    {
      id: 1,
      name: "Fall 2013 - Art",
      startAt: new Date("2013-06-03T02:57:42Z"),
      endAt: new Date("2013-12-03T02:57:53Z"),
      createdAt: new Date("2015-10-27T16:51:41Z"),
      gradingPeriodGroupId: 2
    },{
      id: 3,
      name: null,
      startAt: new Date("2014-01-03T02:58:36Z"),
      endAt: new Date("2014-03-03T02:58:42Z"),
      createdAt: new Date("2013-06-02T17:29:19Z"),
      gradingPeriodGroupId: 2
    },{
      id: 4,
      name: null,
      startAt: null,
      endAt: null,
      createdAt: new Date("2014-05-02T17:29:19Z"),
      gradingPeriodGroupId: 1
    }
  ];

  const props = {
    urls: {
      gradingPeriodSetsURL: "api/v1/accounts/1/grading_period_sets",
      enrollmentTermsURL: "api/v1/accounts/1/terms",
      deleteGradingPeriodURL:  "api/v1/accounts/1/grading_periods/%7B%7B%20id%20%7D%7D",
      gradingPeriodsUpdateURL: "api/v1/accounts/1/grading_periods/batch_update"
    },
    readOnly: false,
  };

  module("GradingPeriodSetCollection - API Data Load", {
    renderComponent() {
      const element = React.createElement(SetCollection, props);
      return React.render(element, wrapper);
    },

    stubTermsSuccess() {
      const termsSuccess = new Promise(resolve => resolve(exampleTerms));
      this.stub(termsApi, 'list').returns(termsSuccess);
      return termsSuccess;
    },

    stubSetsSuccess() {
      const setsSuccess = new Promise(resolve => resolve(exampleSets));
      this.stub(setsApi, 'list').returns(setsSuccess);
      return setsSuccess;
    },

    stubSetsFailure() {
      const setsFailure = new Promise((_, reject) => reject("FAIL"));
      this.stub(setsApi, 'list').returns(setsFailure);
      return setsFailure;
    },

    teardown() {
      React.unmountComponentAtNode(wrapper);
    }
  });

  asyncTest("loads enrollment terms", function() {
    let terms = this.stubTermsSuccess();
    let sets = this.stubSetsSuccess();
    let collection = this.renderComponent();

    Promise.all([terms, sets]).then(function() {
      propEqual(_.pluck(collection.state.enrollmentTerms, "id"), _.pluck(exampleTerms, "id"));
      start();
    });
  });

  asyncTest("loads grading period sets", function() {
    let terms = this.stubTermsSuccess();
    let sets = this.stubSetsSuccess();
    let collection = this.renderComponent();

    Promise.all([terms, sets]).then(function() {
      propEqual(_.pluck(collection.state.sets, "id"), _.pluck(exampleSets, "id"));
      start();
    });
  });

  asyncTest("has an empty set collection if sets failed to load", function() {
    let terms = this.stubTermsSuccess();
    let sets = this.stubSetsFailure();
    let collection = this.renderComponent();

    Promise.all([terms, sets]).catch(function() {
      propEqual(collection.state.sets, []);
      start();
    });
  });

  module("GradingPeriodSetCollection", {
    setup() {
      const setsSuccess = new Promise(resolve => resolve(exampleSets));
      const termsSuccess = new Promise(resolve => resolve(exampleTerms));
      this.sets = this.stub(setsApi, 'list').returns(setsSuccess);
      this.terms = this.stub(termsApi, 'list').returns(termsSuccess);
    },

    renderComponent() {
      const element = React.createElement(SetCollection, props);
      return React.render(element, wrapper);
    },

    teardown() {
      React.unmountComponentAtNode(wrapper);
    }
  });

  asyncTest("uses the name, start date (if no name), or creation date (if no start) for the display name", function() {
    let collection = this.renderComponent();
    const expectedNames = ["Fall 2013 - Art", "Term starting Jan 3, 2014", "Term created May 2, 2014"];

    Promise.all([this.terms, this.sets]).then(function() {
      const actualNames = _.pluck(collection.state.enrollmentTerms, "displayName");
      propEqual(expectedNames, actualNames);
      start();
    });
  });

  test("doesn't show the new set form on initial load", function() {
    let collection = this.renderComponent();
    notOk(collection.refs.newSetForm);
  });

  test("has the add new set button enabled on initial load", function() {
    let collection = this.renderComponent();
    let addSetFormButton = React.findDOMNode(collection.refs.addSetFormButton);
    equal(addSetFormButton.getAttribute('aria-disabled'), 'false');
    notOk(_.contains(addSetFormButton.classList, 'disabled'));
  });

  test("disables the add new set button after it is clicked", function() {
    let collection = this.renderComponent();
    let addSetFormButton = React.findDOMNode(collection.refs.addSetFormButton);
    Simulate.click(addSetFormButton);
    equal(addSetFormButton.getAttribute('aria-disabled'), 'true');
    ok(_.contains(addSetFormButton.classList, 'disabled'));
  });

  test("shows the new set form when the add new set button is clicked", function() {
    let collection = this.renderComponent();
    let addSetFormButton = React.findDOMNode(collection.refs.addSetFormButton);
    Simulate.click(addSetFormButton);
    ok(collection.refs.newSetForm);
  });

  test("closes the new set form when closeNewSetForm is called", function() {
    let collection = this.renderComponent();
    collection.closeNewSetForm();
    notOk(collection.refs.newSetForm);
  });

  module("GradingPeriodSetCollection - Search", {
    setup() {
      const setsSuccess = new Promise(resolve => resolve(exampleSets));
      const termsSuccess = new Promise(resolve => resolve(exampleTerms));
      this.sets = this.stub(setsApi, 'list').returns(setsSuccess);
      this.terms = this.stub(termsApi, 'list').returns(termsSuccess);
    },

    renderComponent() {
      const element = React.createElement(SetCollection, props);
      return React.render(element, wrapper);
    },

    teardown() {
      React.unmountComponentAtNode(wrapper);
    }
  });

  test("setAndGradingPeriodTitles returns an array of set and grading period title names", function() {
    const set = { title: "Set!", gradingPeriods: [{ title: "Grading Period 1" }, { title: "Grading Period 2" }] };
    let collection = this.renderComponent();
    const titles = collection.setAndGradingPeriodTitles(set);
    propEqual(titles, ["Set!", "Grading Period 1", "Grading Period 2"]);
  });

  test("setAndGradingPeriodTitles filters out empty, null, and undefined titles", function() {
    const set = {
      title: null,
      gradingPeriods: [
        { title: "Grading Period 1" },
        {},
        { title: "Grading Period 2" },
        { title: "" }
      ]
    };

    let collection = this.renderComponent();
    const titles = collection.setAndGradingPeriodTitles(set);
    propEqual(titles, ["Grading Period 1", "Grading Period 2"]);
  });

  test("changeSearchText calls setState if the new search text differs from the old search text", function() {
    const titles = ["hello world", "goodbye friend"];
    let collection = this.renderComponent();
    const setStateSpy = this.spy(collection, "setState");
    collection.changeSearchText("hello world");
    collection.changeSearchText("goodbye world");
    ok(setStateSpy.calledTwice)
  });

  test("changeSearchText does not call setState if the new search text equals the old search text", function() {
    const titles = ["hello world", "goodbye friend"];
    let collection = this.renderComponent();
    const setStateSpy = this.spy(collection, "setState");
    collection.changeSearchText("hello world");
    collection.changeSearchText("hello world");
    ok(setStateSpy.calledOnce)
  });

  test("searchTextMatchesTitles returns true if the search text exactly matches one of the titles", function() {
    const titles = ["hello world", "goodbye friend"];
    let collection = this.renderComponent();
    collection.changeSearchText("hello world");
    equal(collection.searchTextMatchesTitles(titles), true)
  });

  test("searchTextMatchesTitles returns true if the search text exactly matches one of the titles", function() {
    const titles = ["hello world", "goodbye friend"];
    let collection = this.renderComponent();
    collection.changeSearchText("hello world");
    equal(collection.searchTextMatchesTitles(titles), true)
  });

  test("searchTextMatchesTitles returns true if the search text is a substring of one of the titles", function() {
    const titles = ["hello world", "goodbye friend"];
    let collection = this.renderComponent();
    collection.changeSearchText("orl");
    equal(collection.searchTextMatchesTitles(titles), true)
  });

  test("searchTextMatchesTitles returns false if the search text is a not a substring of any of the titles", function() {
    const titles = ["hello world", "goodbye friend"];
    let collection = this.renderComponent();
    collection.changeSearchText("olr");
    equal(collection.searchTextMatchesTitles(titles), false)
  });

  asyncTest("getVisibleSets returns sets that match the search text", function() {
    let collection = this.renderComponent();

    Promise.all([this.terms, this.sets]).then(function() {
      collection.changeSearchText("201");
      let filteredIDs = _.pluck(collection.getVisibleSets(), "id");
      propEqual(filteredIDs, ["1", "2"]);

      collection.changeSearchText("pring");
      filteredIDs = _.pluck(collection.getVisibleSets(), "id");
      propEqual(filteredIDs, ["2"]);

      collection.changeSearchText("Fal");
      filteredIDs = _.pluck(collection.getVisibleSets(), "id");
      propEqual(filteredIDs, ["1"]);

      collection.changeSearchText("does not match");
      filteredIDs = _.pluck(collection.getVisibleSets(), "id");
      propEqual(collection.getVisibleSets(), []);
      start();
    });
  });

  test("filterSetsByActiveTerm returns all the sets if 'All Terms' is selected", function() {
    const ALL_TERMS_ID = 0;
    const selectedTermID = ALL_TERMS_ID;
    let collection = this.renderComponent();
    const filteredSets = collection.filterSetsByActiveTerm(exampleSets, exampleTerms, selectedTermID);
    propEqual(filteredSets, exampleSets);
  });

  test("filterSetsByActiveTerm filters to only show the set that the selected term belongs to", function() {
    let selectedTermID = 3;
    let collection = this.renderComponent();
    let filteredSets = collection.filterSetsByActiveTerm(exampleSets, exampleTerms, selectedTermID);
    let expectedSets = _.where(exampleSets, { id: "2" });
    propEqual(filteredSets, expectedSets);

    selectedTermID = 4;
    filteredSets = collection.filterSetsByActiveTerm(exampleSets, exampleTerms, selectedTermID);
    expectedSets = _.where(exampleSets, { id: "1" });
    propEqual(filteredSets, expectedSets);
  });

  module("GradingPeriodSetCollection - Delete Set", {
    setup() {
      const setsSuccess = new Promise(resolve => resolve(exampleSets));
      const termsSuccess = new Promise(resolve => resolve(exampleTerms));
      this.sets = this.stub(setsApi, 'list').returns(setsSuccess);
      this.terms = this.stub(termsApi, 'list').returns(termsSuccess);
    },

    renderComponent() {
      const element = React.createElement(SetCollection, props);
      return React.render(element, wrapper);
    },

    teardown() {
      React.unmountComponentAtNode(wrapper);
    }
  });

  asyncTest("removeGradingPeriodSet removes the set from the collection", function() {
    let collection = this.renderComponent();

    Promise.all([this.sets, this.terms]).then(function() {
      collection.removeGradingPeriodSet("1");
      const setIDs = _.pluck(collection.state.sets, "id");
      propEqual(setIDs, ["2"]);
      start();
    });
  });

  module("GradingPeriodSetCollection - Update Set Periods", {
    setup() {
      const setsSuccess = new Promise(resolve => resolve(exampleSets));
      const termsSuccess = new Promise(resolve => resolve(exampleTerms));
      this.sets = this.stub(setsApi, 'list').returns(setsSuccess);
      this.terms = this.stub(termsApi, 'list').returns(termsSuccess);
    },

    renderComponent() {
      const element = React.createElement(SetCollection, props);
      return React.render(element, wrapper);
    },

    teardown() {
      React.unmountComponentAtNode(wrapper);
    }
  });

  asyncTest("updateSetPeriods updates the grading periods on the given set", function() {
    let collection = this.renderComponent();

    Promise.all([this.sets, this.terms]).then(function() {
      collection.updateSetPeriods("1", []);
      const set = _.findWhere(collection.state.sets, {id: "1"});
      propEqual(set.gradingPeriods, []);
      start();
    });
  });

  module("GradingPeriodSetCollection 'Edit Grading Period Set'", {
    setup() {
      const setsSuccess = new Promise(resolve => resolve(exampleSets));
      const termsSuccess = new Promise(resolve => resolve(exampleTerms));
      this.sets = this.stub(setsApi, 'list').returns(setsSuccess);
      this.terms = this.stub(termsApi, 'list').returns(termsSuccess);
    },

    renderComponent() {
      const element = React.createElement(SetCollection, props);
      return React.render(element, wrapper);
    },

    teardown() {
      React.unmountComponentAtNode(wrapper);
    }
  });

  asyncTest("renders the 'edit grading period set' when 'edit grading period set' is clicked", function() {
    let set = this.renderComponent();
    Promise.all([this.sets, this.terms]).then(function() {
      notOk(!!set.refs["edit-grading-period-set-1"], "the grading period set is visible");
      Simulate.click(set.refs["show-grading-period-set-1"].refs.editButton);
      ok(set.refs["edit-grading-period-set-1"], "the edit form is visible");
      start();
    });
  });

  asyncTest("disables other 'grading period set' actions while open", function() {
    let set = this.renderComponent();
    Promise.all([this.sets, this.terms]).then(function() {
      Simulate.click(set.refs["show-grading-period-set-1"].refs.editButton);
      assertDisabled(set.refs.addSetFormButton);
      ok(set.refs["show-grading-period-set-2"].props.actionsDisabled);
      start();
    });
  });

  asyncTest("'onCancel' removes the 'edit grading period set' form", function() {
    let set = this.renderComponent();
    Promise.all([this.sets, this.terms]).then(function() {
      Simulate.click(set.refs["show-grading-period-set-1"].refs.editButton);
      set.refs["edit-grading-period-set-1"].props.onCancel();
      notOk(!!set.refs["edit-grading-period-set-1"]);
      start();
    });
  });

  asyncTest("'onCancel' focuses on the 'edit grading period set' button", function() {
    let set = this.renderComponent();
    Promise.all([this.sets, this.terms]).then(function() {
      Simulate.click(set.refs["show-grading-period-set-1"].refs.editButton);
      set.refs["edit-grading-period-set-1"].props.onCancel();
      let editButton = React.findDOMNode(set.refs["show-grading-period-set-1"].refs.editButton);
      equal(document.activeElement, editButton);
      start();
    });
  });

  asyncTest("'onCancel' re-enables all grading period set actions", function() {
    let set = this.renderComponent();
    Promise.all([this.sets, this.terms]).then(function() {
      Simulate.click(set.refs["show-grading-period-set-1"].refs.editButton);
      set.refs["edit-grading-period-set-1"].props.onCancel();
      assertEnabled(set.refs.addSetFormButton);
      notOk(set.refs["show-grading-period-set-2"].props.actionsDisabled);
      start();
    });
  });

  module("GradingPeriodSetCollection 'Edit Grading Period Set - onSave'", {
    setup() {
      this.stub(setsApi, 'list').returns(new Promise(() => {}));
      this.stub(termsApi, 'list').returns(new Promise(() => {}));
    },

    renderComponent() {
      const element = React.createElement(SetCollection, props);
      let component = React.render(element, wrapper);
      component.onTermsLoaded(exampleTerms);
      component.onSetsLoaded(exampleSets);
      Simulate.click(component.refs["show-grading-period-set-1"].refs.editButton);
      return component;
    },

    callOnSave(collection) {
      Simulate.click(collection.refs["edit-grading-period-set-1"].refs.saveButton);
    },

    teardown() {
      React.unmountComponentAtNode(wrapper);
    }
  });

  asyncTest("removes the 'edit grading period set' form", function() {
    let updatedSet = _.extend({}, exampleSet, {title: "Updated Title"});
    let success = new Promise(resolve => resolve(updatedSet));
    this.stub(setsApi, "update").returns(success);
    let collection = this.renderComponent();
    this.callOnSave(collection);
    requestAnimationFrame(function() {
      ok(collection.refs["show-grading-period-set-1"]);
      notOk(!!collection.refs["edit-grading-period-set-1"]);
      start();
    });
  });

  asyncTest("updates the given grading period set", function() {
    let updatedSet = _.extend({}, exampleSet, {title: "Updated Title"});
    let success = new Promise(resolve => resolve(updatedSet));
    this.stub(setsApi, "update").returns(success);
    let collection = this.renderComponent();
    this.callOnSave(collection);
    requestAnimationFrame(() => {
      let setComponent = collection.refs["show-grading-period-set-1"];
      equal(setComponent.props.set.title, "Updated Title");
      start();
    });
  });

  asyncTest("re-enables all grading period set actions", function() {
    let updatedSet = _.extend({}, exampleSet, {title: "Updated Title"});
    let success = new Promise(resolve => resolve(updatedSet));
    this.stub(setsApi, "update").returns(success);
    let collection = this.renderComponent();
    this.callOnSave(collection);
    requestAnimationFrame(() => {
      assertEnabled(collection.refs.addSetFormButton);
      notOk(collection.refs["show-grading-period-set-1"].props.actionsDisabled);
      notOk(collection.refs["show-grading-period-set-2"].props.actionsDisabled);
      start();
    });
  });

  asyncTest("preserves the 'edit grading period set' form upon failure", function() {
    let updatedSet = _.extend({}, exampleSet, {title: "Updated Title"});
    let failure = new Promise(_, reject => reject("FAIL"));
    this.stub(setsApi, "update").returns(failure);
    let collection = this.renderComponent();
    this.callOnSave(collection);
    requestAnimationFrame(() => {
      ok(collection.refs["edit-grading-period-set-1"]);
      notOk(!!collection.refs["show-grading-period-set-1"]);
      start();
    });
  });
});
