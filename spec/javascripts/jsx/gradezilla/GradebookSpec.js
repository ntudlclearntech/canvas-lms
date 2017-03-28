/*
 * Copyright (C) 2017 Instructure, Inc.
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

import _ from 'underscore'
import React from 'react'
import ReactDOM from 'react-dom'
import natcompare from 'compiled/util/natcompare'
import round from 'compiled/util/round'
import fakeENV from 'helpers/fakeENV'
import GradeCalculatorSpecHelper from 'spec/jsx/gradebook/GradeCalculatorSpecHelper'
import SubmissionDetailsDialog from 'compiled/SubmissionDetailsDialog'
import CourseGradeCalculator from 'jsx/gradebook/CourseGradeCalculator'
import DataLoader from 'jsx/gradezilla/DataLoader'
import Gradebook from 'compiled/gradezilla/Gradebook'

const $fixtures = document.getElementById('fixtures');

function createGradebook (options = {}) {
  return new Gradebook({
    settings: {
      show_concluded_enrollments: false,
      show_inactive_enrollments: false
    },
    sections: {},
    ...options
  });
}

const createExampleGrades = GradeCalculatorSpecHelper.createCourseGradesWithGradingPeriods;

QUnit.module('Gradebook');

test('normalizes the grading period set from the env', function () {
  const options = {
    grading_period_set: {
      id: '1501',
      grading_periods: [
        { id: '701', weight: 50 },
        { id: '702', weight: 50 }
      ],
      weighted: true
    }
  };
  const gradingPeriodSet = createGradebook(options).gradingPeriodSet;
  deepEqual(gradingPeriodSet.id, '1501');
  equal(gradingPeriodSet.gradingPeriods.length, 2);
  deepEqual(_.map(gradingPeriodSet.gradingPeriods, 'id'), ['701', '702']);
});

test('sets grading period set to null when not defined in the env', function () {
  const gradingPeriodSet = createGradebook().gradingPeriodSet;
  deepEqual(gradingPeriodSet, null);
});

QUnit.module('Gradebook#calculateStudentGrade', {
  setupThis (options = {}) {
    const assignments = [
      { id: '201', points_possible: 10, omit_from_final_grade: false }
    ];
    const submissions = [
      { assignment_id: 201, score: 10 }
    ];
    return {
      gradingPeriodToShow: '0',
      isAllGradingPeriods: Gradebook.prototype.isAllGradingPeriods,
      assignmentGroups: [
        { id: '301', group_weight: 60, rules: {}, assignments }
      ],
      options: {
        group_weighting_scheme: 'points'
      },
      gradingPeriods: [
        { id: '701', weight: 50 },
        { id: '702', weight: 50 }
      ],
      gradingPeriodSet: {
        id: '1501',
        gradingPeriods: [
          { id: '701', weight: 50 },
          { id: '702', weight: 50 }
        ],
        weighted: true
      },
      effectiveDueDates: {
        201: {
          101: { grading_period_id: '701' }
        }
      },
      submissionsForStudent () {
        return submissions;
      },
      addDroppedClass () {},
      ...options
    };
  },

  setup () {
    this.calculate = Gradebook.prototype.calculateStudentGrade;
  }
});

test('calculates grades using properties from the gradebook', function () {
  const self = this.setupThis();
  this.stub(CourseGradeCalculator, 'calculate').returns(createExampleGrades());
  this.calculate.call(self, {
    id: '101',
    loaded: true,
    initialized: true
  });
  const args = CourseGradeCalculator.calculate.getCall(0).args;
  equal(args[0], self.submissionsForStudent());
  equal(args[1], self.assignmentGroups);
  equal(args[2], self.options.group_weighting_scheme);
  equal(args[3], self.gradingPeriodSet);
});

test('scopes effective due dates to the user', function () {
  const self = this.setupThis();
  this.stub(CourseGradeCalculator, 'calculate').returns(createExampleGrades());
  this.calculate.call(self, {
    id: '101',
    loaded: true,
    initialized: true
  });
  const dueDates = CourseGradeCalculator.calculate.getCall(0).args[4];
  deepEqual(dueDates, {
    201: {
      grading_period_id: '701'
    }
  });
});

test('calculates grades without grading period data when grading period set is null', function () {
  const self = this.setupThis({
    gradingPeriodSet: null
  });
  this.stub(CourseGradeCalculator, 'calculate').returns(createExampleGrades());
  this.calculate.call(self, {
    id: '101',
    loaded: true,
    initialized: true
  });
  const args = CourseGradeCalculator.calculate.getCall(0).args;
  equal(args[0], self.submissionsForStudent());
  equal(args[1], self.assignmentGroups);
  equal(args[2], self.options.group_weighting_scheme);
  equal(typeof args[3], 'undefined');
  equal(typeof args[4], 'undefined');
});

test('calculates grades without grading period data when effective due dates are not defined', function () {
  const self = this.setupThis({
    effectiveDueDates: null
  });
  this.stub(CourseGradeCalculator, 'calculate').returns(createExampleGrades());
  this.calculate.call(self, {
    id: '101',
    loaded: true,
    initialized: true
  });
  const args = CourseGradeCalculator.calculate.getCall(0).args;
  equal(args[0], self.submissionsForStudent());
  equal(args[1], self.assignmentGroups);
  equal(args[2], self.options.group_weighting_scheme);
  equal(typeof args[3], 'undefined');
  equal(typeof args[4], 'undefined');
});

test('stores the current grade on the student when not including ungraded assignments', function () {
  const exampleGrades = createExampleGrades();
  const self = this.setupThis({
    include_ungraded_assignments: false
  });
  this.stub(CourseGradeCalculator, 'calculate').returns(exampleGrades);
  const student = {
    id: '101',
    loaded: true,
    initialized: true
  };
  this.calculate.call(self, student);
  equal(student.total_grade, exampleGrades.current);
});

test('stores the final grade on the student when including ungraded assignments', function () {
  const exampleGrades = createExampleGrades();
  const self = this.setupThis({
    include_ungraded_assignments: true
  });
  this.stub(CourseGradeCalculator, 'calculate').returns(exampleGrades);
  const student = {
    id: '101',
    loaded: true,
    initialized: true
  };
  this.calculate.call(self, student);
  equal(student.total_grade, exampleGrades.final);
});

test('stores the current grade from the selected grading period when not including ungraded assignments', function () {
  const exampleGrades = createExampleGrades();
  const self = this.setupThis({
    gradingPeriodToShow: 701,
    include_ungraded_assignments: false
  });
  this.stub(CourseGradeCalculator, 'calculate').returns(exampleGrades);
  const student = {
    id: '101',
    loaded: true,
    initialized: true
  };
  this.calculate.call(self, student);
  equal(student.total_grade, exampleGrades.gradingPeriods[701].current);
});

test('stores the final grade from the selected grading period when including ungraded assignments', function () {
  const exampleGrades = createExampleGrades();
  const self = this.setupThis({
    gradingPeriodToShow: 701,
    include_ungraded_assignments: true
  });
  this.stub(CourseGradeCalculator, 'calculate').returns(exampleGrades);
  const student = {
    id: '101',
    loaded: true,
    initialized: true
  };
  this.calculate.call(self, student);
  equal(student.total_grade, exampleGrades.gradingPeriods[701].final);
});

test('does not calculate when the student is not loaded', function () {
  const self = this.setupThis();
  this.stub(CourseGradeCalculator, 'calculate').returns(createExampleGrades());
  this.calculate.call(self, {
    id: '101',
    loaded: false,
    initialized: true
  });
  notOk(CourseGradeCalculator.calculate.called);
});

test('does not calculate when the student is not initialized', function () {
  const self = this.setupThis();
  this.stub(CourseGradeCalculator, 'calculate').returns(createExampleGrades());
  this.calculate.call(self, {
    id: '101',
    loaded: true,
    initialized: false
  });
  notOk(CourseGradeCalculator.calculate.called);
});

QUnit.module('Gradebook#getStudentGradeForColumn');

test('returns the grade stored on the student for the column id', function () {
  const student = { total_grade: { score: 5, possible: 10 } };
  const grade = createGradebook().getStudentGradeForColumn(student, 'total_grade');
  equal(grade, student.total_grade);
});

test('returns an empty grade when the student has no grade for the column id', function () {
  const student = { total_grade: undefined };
  const grade = createGradebook().getStudentGradeForColumn(student, 'total_grade');
  strictEqual(grade.score, null, 'grade has a null score');
  strictEqual(grade.possible, 0, 'grade has no points possible');
});

QUnit.module('Gradebook#getGradeAsPercent');

test('returns a percent for a grade with points possible', function () {
  const percent = createGradebook().getGradeAsPercent({ score: 5, possible: 10 });
  equal(percent, 0.5);
});

test('returns null for a grade with no points possible', function () {
  const percent = createGradebook().getGradeAsPercent({ score: 5, possible: 0 });
  strictEqual(percent, null);
});

test('returns 0 for a grade with a null score', function () {
  const percent = createGradebook().getGradeAsPercent({ score: null, possible: 10 });
  strictEqual(percent, 0);
});

test('returns 0 for a grade with an undefined score', function () {
  const percent = createGradebook().getGradeAsPercent({ score: undefined, possible: 10 });
  strictEqual(percent, 0);
});

QUnit.module('Gradebook#localeSort');

test('delegates to natcompare.strings', function () {
  this.spy(natcompare, 'strings');
  Gradebook.prototype.localeSort('a', 'b');
  equal(natcompare.strings.callCount, 1);
  deepEqual(natcompare.strings.getCall(0).args, ['a', 'b']);
});

test('substitutes falsy args with empty string', function () {
  this.spy(natcompare, 'strings');
  Gradebook.prototype.localeSort(0, false);
  equal(natcompare.strings.callCount, 1);
  deepEqual(natcompare.strings.getCall(0).args, ['', '']);
});

QUnit.module('Gradebook#gradeSort by an assignment', {
  setup () {
    this.studentA = { assignment_201: { score: 10, possible: 20 } };
    this.studentB = { assignment_201: { score: 6, possible: 10 } };
  }
});

test('always sorts by score', function () {
  const gradebook = createGradebook({ show_total_grade_as_points: true });
  const comparison = gradebook.gradeSort(this.studentA, this.studentB, 'assignment_201', true);
  // a positive value indicates reversing the order of inputs
  equal(comparison, 4, 'studentA with the higher score is ordered second');
});

test('optionally sorts in descending order', function () {
  const gradebook = createGradebook({ show_total_grade_as_points: true });
  const comparison = gradebook.gradeSort(this.studentA, this.studentB, 'assignment_201', false);
  // a negative value indicates preserving the order of inputs
  equal(comparison, -4, 'studentA with the higher score is ordered first');
});

QUnit.module('Gradebook#gradeSort by an assignment group', {
  setup () {
    this.studentA = { assignment_group_301: { score: 10, possible: 20 } };
    this.studentB = { assignment_group_301: { score: 6, possible: 10 } };
  }
});

test('always sorts by percent', function () {
  const gradebook = createGradebook({ show_total_grade_as_points: false });
  const comparison = gradebook.gradeSort(this.studentA, this.studentB, 'assignment_group_301', true);
  // a negative value indicates preserving the order of inputs
  equal(round(comparison, 1), -0.1, 'studentB with the higher percent is ordered second');
});

test('optionally sorts in descending order', function () {
  const gradebook = createGradebook({ show_total_grade_as_points: true });
  const comparison = gradebook.gradeSort(this.studentA, this.studentB, 'assignment_group_301', false);
  // a positive value indicates reversing the order of inputs
  equal(round(comparison, 1), 0.1, 'studentB with the higher percent is ordered first');
});

test('sorts grades with no points possible at lowest priority', function () {
  this.studentA.assignment_group_301.possible = 0;
  const gradebook = createGradebook({ show_total_grade_as_points: false });
  const comparison = gradebook.gradeSort(this.studentA, this.studentB, 'assignment_group_301', true);
  // a value of 1 indicates reversing the order of inputs
  equal(comparison, 1, 'studentA with no points possible is ordered second');
});

test('sorts grades with no points possible at lowest priority in descending order', function () {
  this.studentA.assignment_group_301.possible = 0;
  const gradebook = createGradebook({ show_total_grade_as_points: false });
  const comparison = gradebook.gradeSort(this.studentA, this.studentB, 'assignment_group_301', false);
  // a value of 1 indicates reversing the order of inputs
  equal(comparison, 1, 'studentA with no points possible is ordered second');
});

QUnit.module('Gradebook#gradeSort by "total_grade"', {
  setup () {
    this.studentA = { total_grade: { score: 10, possible: 20 } };
    this.studentB = { total_grade: { score: 6, possible: 10 } };
  }
});

test('sorts by percent when not showing total grade as points', function () {
  const gradebook = createGradebook({ show_total_grade_as_points: false });
  const comparison = gradebook.gradeSort(this.studentA, this.studentB, 'total_grade', true);
  // a negative value indicates preserving the order of inputs
  equal(round(comparison, 1), -0.1, 'studentB with the higher percent is ordered second');
});

test('sorts percent grades with no points possible at lowest priority', function () {
  this.studentA.total_grade.possible = 0;
  const gradebook = createGradebook({ show_total_grade_as_points: false });
  const comparison = gradebook.gradeSort(this.studentA, this.studentB, 'total_grade', true);
  // a value of 1 indicates reversing the order of inputs
  equal(comparison, 1, 'studentA with no points possible is ordered second');
});

test('sorts percent grades with no points possible at lowest priority in descending order', function () {
  this.studentA.total_grade.possible = 0;
  const gradebook = createGradebook({ show_total_grade_as_points: false });
  const comparison = gradebook.gradeSort(this.studentA, this.studentB, 'total_grade', false);
  // a value of 1 indicates reversing the order of inputs
  equal(comparison, 1, 'studentA with no points possible is ordered second');
});

test('sorts by score when showing total grade as points', function () {
  const gradebook = createGradebook({ show_total_grade_as_points: true });
  const comparison = gradebook.gradeSort(this.studentA, this.studentB, 'total_grade', true);
  // a positive value indicates reversing the order of inputs
  equal(comparison, 4, 'studentA with the higher score is ordered second');
});

test('optionally sorts in descending order', function () {
  const gradebook = createGradebook({ show_total_grade_as_points: true });
  const comparison = gradebook.gradeSort(this.studentA, this.studentB, 'total_grade', false);
  // a negative value indicates preserving the order of inputs
  equal(comparison, -4, 'studentA with the higher score is ordered first');
});

QUnit.module('Gradebook#hideAggregateColumns', {
  gradebookStubs () {
    return {
      indexedOverrides: Gradebook.prototype.indexedOverrides,
      indexedGradingPeriods: _.indexBy(this.gradingPeriods, 'id')
    };
  },

  setupThis (options = {}) {
    return {
      ...this.gradebookStubs(),
      gradingPeriodSet: { id: '1' },
      getGradingPeriodToShow () {
        return '1';
      },
      options: {
        all_grading_periods_totals: false
      },
      ...options
    };
  },

  setup () {
    this.hideAggregateColumns = Gradebook.prototype.hideAggregateColumns;
  }
});

test('returns false if there are no grading periods', function () {
  const self = this.setupThis({
    gradingPeriodSet: null,
    isAllGradingPeriods () {
      return false;
    }
  });
  notOk(this.hideAggregateColumns.call(self));
});

test('returns false if there are no grading periods, even if isAllGradingPeriods is true', function () {
  const self = this.setupThis({
    gradingPeriodSet: null,
    getGradingPeriodToShow () {
      return '0';
    },
    isAllGradingPeriods () {
      return true;
    }
  });
  notOk(this.hideAggregateColumns.call(self));
});

test('returns false if "All Grading Periods" is not selected', function () {
  const self = this.setupThis({
    isAllGradingPeriods () {
      return false;
    }
  });
  notOk(this.hideAggregateColumns.call(self));
});

test('returns true if "All Grading Periods" is selected', function () {
  const self = this.setupThis({
    getGradingPeriodToShow () {
      return '0';
    },
    isAllGradingPeriods () {
      return true;
    }
  });
  ok(this.hideAggregateColumns.call(self));
});

test('returns false if "All Grading Periods" is selected and the grading period set has' +
  '"Display Totals for All Grading Periods option" enabled', function () {
  const self = this.setupThis({
    getGradingPeriodToShow () {
      return '0';
    },
    isAllGradingPeriods () {
      return true;
    },
    gradingPeriodSet: { displayTotalsForAllGradingPeriods: true }
  });
  notOk(this.hideAggregateColumns.call(self));
});

QUnit.module('Gradebook#getVisibleGradeGridColumns', {
  setup () {
    this.getVisibleGradeGridColumns = Gradebook.prototype.getVisibleGradeGridColumns;
    this.makeColumnSortFn = Gradebook.prototype.makeColumnSortFn;
    this.compareAssignmentPositions = Gradebook.prototype.compareAssignmentPositions;
    this.compareAssignmentDueDates = Gradebook.prototype.compareAssignmentDueDates;
    this.wrapColumnSortFn = Gradebook.prototype.wrapColumnSortFn;
    this.getStoredSortOrder = Gradebook.prototype.getStoredSortOrder;
    this.defaultSortType = 'assignment_group';
    this.allAssignmentColumns = [
      {
        object: {
          assignment_group: { position: 1 },
          position: 1,
          name: 'first'
        }
      }, {
        object: {
          assignment_group: { position: 1 },
          position: 2,
          name: 'second'
        }
      }, {
        object: {
          assignment_group: { position: 1 },
          position: 3,
          name: 'third'
        }
      }
    ];
    this.aggregateColumns = [];
    this.parentColumns = [];
    this.customColumnDefinitions = function () {
      return [];
    };
    this.spy(this, 'makeColumnSortFn');
  }
});

test('sorts columns when there is a valid sortType', function () {
  this.isInvalidCustomSort = function () {
    return false;
  };
  this.columnOrderHasNotBeenSaved = function () {
    return false;
  };
  this.gradebookColumnOrderSettings = {
    sortType: 'due_date'
  };
  this.getVisibleGradeGridColumns();
  ok(this.makeColumnSortFn.calledWith({
    sortType: 'due_date'
  }));
});

test('falls back to the default sort type if the custom sort type does not have a customOrder property', function () {
  this.isInvalidCustomSort = function () {
    return true;
  };
  this.gradebookColumnOrderSettings = {
    sortType: 'custom'
  };
  this.makeCompareAssignmentCustomOrderFn = Gradebook.prototype.makeCompareAssignmentCustomOrderFn;
  this.getVisibleGradeGridColumns();
  ok(this.makeColumnSortFn.calledWith({
    sortType: 'assignment_group'
  }));
});

test('does not sort columns when gradebookColumnOrderSettings is undefined', function () {
  this.gradebookColumnOrderSettings = undefined;
  this.getVisibleGradeGridColumns();
  notOk(this.makeColumnSortFn.called);
});

QUnit.module('Gradebook#fieldsToExcludeFromAssignments', {
  setup () {
    this.excludedFields = Gradebook.prototype.fieldsToExcludeFromAssignments;
  }
});

test('includes "description" in the response', function () {
  ok(_.contains(this.excludedFields, 'description'));
});

test('includes "needs_grading_count" in the response', function () {
  ok(_.contains(this.excludedFields, 'needs_grading_count'));
});

QUnit.module('Gradebook#submissionsForStudent', {
  setupThis (options = {}) {
    return {
      gradingPeriodSet: null,
      gradingPeriodToShow: null,
      isAllGradingPeriods () {
        return false;
      },
      effectiveDueDates: {
        1: {
          1: { grading_period_id: '1' }
        },
        2: {
          1: { grading_period_id: '2' }
        }
      },
      ...options
    };
  },

  setup () {
    this.student = {
      id: '1',
      assignment_1: {
        assignment_id: '1',
        user_id: '1',
        name: 'yolo'
      },
      assignment_2: {
        assignment_id: '2',
        user_id: '1',
        name: 'froyo'
      }
    };
    this.submissionsForStudent = Gradebook.prototype.submissionsForStudent;
  }
});

test('returns all submissions for the student when there are no grading periods', function () {
  const self = this.setupThis();
  const submissions = this.submissionsForStudent.call(self, this.student);
  propEqual(_.pluck(submissions, 'assignment_id'), ['1', '2']);
});

test('returns all submissions if "All Grading Periods" is selected', function () {
  const self = this.setupThis({
    gradingPeriodSet: { id: '1' },
    gradingPeriodToShow: '0',
    isAllGradingPeriods () {
      return true;
    }
  });
  const submissions = this.submissionsForStudent.call(self, this.student);
  propEqual(_.pluck(submissions, 'assignment_id'), ['1', '2']);
});

test('only returns submissions due for the student in the selected grading period', function () {
  const self = this.setupThis({
    gradingPeriodSet: { id: '1' },
    gradingPeriodToShow: '2'
  });
  const submissions = this.submissionsForStudent.call(self, this.student);
  propEqual(_.pluck(submissions, 'assignment_id'), ['2']);
});

QUnit.module('Gradebook#studentsUrl', {
  setupThis (options = {}) {
    return {
      showConcludedEnrollments: false,
      showInactiveEnrollments: false,
      ...options
    }
  },

  setup () {
    this.studentsUrl = Gradebook.prototype.studentsUrl;
  }
});

test('enrollmentUrl returns "students_url"', function () {
  equal(this.studentsUrl.call(this.setupThis()), 'students_url');
});

test('when concluded only, enrollmentUrl returns "students_with_concluded_enrollments_url"', function () {
  const self = this.setupThis({
    showConcludedEnrollments: true
  });
  equal(this.studentsUrl.call(self), 'students_with_concluded_enrollments_url');
});

test('when inactive only, enrollmentUrl returns "students_with_inactive_enrollments_url"', function () {
  const self = this.setupThis({
    showInactiveEnrollments: true
  });
  equal(this.studentsUrl.call(self), 'students_with_inactive_enrollments_url');
});

test('when show concluded and hide inactive are true, enrollmentUrl returns ' +
  '"students_with_concluded_and_inactive_enrollments_url"', function () {
  const self = this.setupThis({
    showConcludedEnrollments: true,
    showInactiveEnrollments: true
  });
  equal(this.studentsUrl.call(self), 'students_with_concluded_and_inactive_enrollments_url');
});

QUnit.module('Gradebook#weightedGroups', {
  setup () {
    this.weightedGroups = Gradebook.prototype.weightedGroups;
  }
});

test('returns true when group_weighting_scheme is "percent"', function () {
  equal(this.weightedGroups.call({
    options: {
      group_weighting_scheme: 'percent'
    }
  }), true);
});

test('returns false when group_weighting_scheme is not "percent"', function () {
  equal(this.weightedGroups.call({
    options: {
      group_weighting_scheme: 'points'
    }
  }), false);
  equal(this.weightedGroups.call({
    options: {
      group_weighting_scheme: null
    }
  }), false);
});

QUnit.module('Gradebook#weightedGrades', {
  setupThis (groupWeightingScheme, gradingPeriodSet) {
    return {
      options: {
        group_weighting_scheme: groupWeightingScheme
      },
      gradingPeriodSet
    };
  },

  setup () {
    this.weightedGrades = Gradebook.prototype.weightedGrades;
  }
});

test('returns true when group_weighting_scheme is "percent"', function () {
  const self = this.setupThis('percent', {
    weighted: false
  });
  equal(this.weightedGrades.call(self), true);
});

test('returns true when the gradingPeriodSet is weighted', function () {
  const self = this.setupThis('points', {
    weighted: true
  });
  equal(this.weightedGrades.call(self), true);
});

test('returns false when group_weighting_scheme is not "percent" and gradingPeriodSet is not weighted', function () {
  const self = this.setupThis('points', {
    weighted: false
  });
  equal(this.weightedGrades.call(self), false);
});

test('returns false when group_weighting_scheme is not "percent" and gradingPeriodSet is not defined', function () {
  const self = this.setupThis('points', null);
  equal(this.weightedGrades.call(self), false);
});

QUnit.module('Gradebook#displayPointTotals', {
  setupThis (showTotalGradeAsPoints, weightedGrades) {
    return {
      options: {
        show_total_grade_as_points: showTotalGradeAsPoints
      },
      weightedGrades () {
        return weightedGrades;
      }
    };
  },

  setup () {
    this.displayPointTotals = Gradebook.prototype.displayPointTotals;
  }
});

test('returns true when grades are not weighted and show_total_grade_as_points is true', function () {
  const self = this.setupThis(true, false);
  equal(this.displayPointTotals.call(self), true);
});

test('returns false when grades are weighted', function () {
  const self = this.setupThis(true, true);
  equal(this.displayPointTotals.call(self), false);
});

test('returns false when show_total_grade_as_points is false', function () {
  const self = this.setupThis(false, false);
  equal(this.displayPointTotals.call(self), false);
});

QUnit.module('Gradebook#showNotesColumn', {
  setup () {
    this.stub(DataLoader, 'getDataForColumn');
  },

  setupShowNotesColumn (opts = {}) {
    const self = {
      options: {},
      toggleNotesColumn () {},
      ...opts
    };
    this.showNotesColumn = Gradebook.prototype.showNotesColumn.bind(self);
  }
});

test('loads the notes if they have not yet been loaded', function () {
  this.setupShowNotesColumn({
    teacherNotesNotYetLoaded: true
  });
  this.showNotesColumn();
  equal(DataLoader.getDataForColumn.callCount, 1);
});

test('does not load the notes if they are already loaded', function () {
  this.setupShowNotesColumn({
    teacherNotesNotYetLoaded: false
  });
  this.showNotesColumn();
  equal(DataLoader.getDataForColumn.callCount, 0);
});

QUnit.module('Gradebook#cellCommentClickHandler', {
  setup () {
    this.cellCommentClickHandler = Gradebook.prototype.cellCommentClickHandler;
    this.assignments = {
      '61890000000013319': {
        name: 'Assignment #1'
      }
    };
    this.student = this.stub().returns({});
    this.options = {};
    this.fixture = document.createElement('div');
    this.fixture.className = 'editable';
    this.fixture.setAttribute('data-assignment-id', '61890000000013319');
    this.fixture.setAttribute('data-user-id', '61890000000013319');
    $fixtures.appendChild(this.fixture);
    this.submissionDialogArgs = undefined;
    this.stub(SubmissionDetailsDialog, 'open').callsFake((...args) => {
      this.submissionDialogArgs = args;
    });
    this.event = {
      preventDefault: this.stub(),
      currentTarget: this.fixture
    };
    this.grid = {
      getActiveCellNode: this.stub().returns(this.fixture)
    };
  },

  teardown () {
    $fixtures.innerHTML = '';
    this.fixture = null;
  }
});

test('when not editable, returns false if the active cell node has the "cannot_edit" class', function () {
  this.fixture.className = 'cannot_edit';
  const result = this.cellCommentClickHandler(this.event);
  equal(result, false);
  ok(this.event.preventDefault.called);
});

test('when editable, removes the "editable" class from the active cell', function () {
  this.cellCommentClickHandler(this.event);
  equal('', this.fixture.className);
  ok(this.event.preventDefault.called);
});

test('when editable, calls @student with the user id as a string', function () {
  this.cellCommentClickHandler(this.event);
  ok(this.student.calledWith('61890000000013319'));
});

test('when editable, calls SubmissionDetailsDialog', function () {
  this.cellCommentClickHandler(this.event);
  const expectedArguments = [
    {
      name: 'Assignment #1'
    },
    {},
    {}
  ];
  equal(SubmissionDetailsDialog.open.callCount, 1);
  deepEqual(this.submissionDialogArgs, expectedArguments);
});

QUnit.module('Menus', {
  setup () {
    this.fixtures = document.getElementById('fixtures');
    fakeENV.setup({
      current_user_id: '1',
      GRADEBOOK_OPTIONS: {
        context_url: 'http://someUrl/',
        outcome_gradebook_enabled: true
      }
    });
  },

  teardown () {
    this.fixtures.innerHTML = '';
    fakeENV.teardown();
  }
});

test('ViewOptionsMenu is rendered on renderViewOptionsMenu', function () {
  this.fixtures.innerHTML = '<span data-component="ViewOptionsMenu"></span>';
  Gradebook.prototype.renderViewOptionsMenu.call();
  const buttonText = document.querySelector('[data-component="ViewOptionsMenu"] Button').innerText.trim();
  equal(buttonText, 'View');
});

test('ActionMenu is rendered on renderActionMenu', function () {
  this.fixtures.innerHTML = '<span data-component="ActionMenu"></span>';
  const self = {
    options: {
      gradebook_is_editable: true,
      context_allows_gradebook_uploads: true,
      gradebook_import_url: 'http://someUrl',
      export_gradebook_csv_url: 'http://someUrl'
    }
  };
  Gradebook.prototype.renderActionMenu.apply(self);
  const buttonText = document.querySelector('[data-component="ActionMenu"] Button').innerText.trim();
  equal(buttonText, 'Actions');
});

test('GradebookMenu is rendered on renderGradebookMenu', function () {
  this.fixtures.innerHTML = '<span data-component="GradebookMenu" data-variant="DefaultGradebook"></span>';
  const self = {
    options: {
      assignmentOrOutcome: 'assignment',
      navigate () {}
    }
  };
  Gradebook.prototype.renderGradebookMenu.apply(self);
  const buttonText = document.querySelector('[data-component="GradebookMenu"] Button').innerText.trim();
  equal(buttonText, 'Gradebook');
});

QUnit.module('addRow', {
  setup () {
    fakeENV.setup({
      GRADEBOOK_OPTIONS: { context_id: 1 },
    });
  },

  teardown () {
    fakeENV.teardown();
  }
});

test('does not add filtered out users', function () {
  const gradebook = createGradebook({ sections: { 1: { name: 'Section 1' }, 2: { name: 'Section 2' }} });
  gradebook.sections_enabled = true;
  gradebook.sectionToShow = '2';

  const student1 = {
    enrollments: [{grades: {}}],
    sections: ['1'],
    name: 'student',
  };
  const student2 = {...student1, sections: ['2']};
  const student3 = {...student1, sections: ['2']};
  [student1, student2, student3].forEach((student) => { gradebook.addRow(student) });

  ok(student1.row == null, 'filtered out students get no row number');
  ok(student2.row === 0, 'other students do get a row number');
  ok(student3.row === 1, 'row number increments');
  ok(_.isEqual(gradebook.rows, [student2, student3]));
});

QUnit.module('sortByStudentColumn', {
  setup () {
    this.gradebook = createGradebook();
    this.studentA = { sortable_name: 'Ford, Betty' };
    this.studentB = { sortable_name: 'Jones, Adam' };
    this.stub(this.gradebook, 'sortRowsBy').callsFake(sortFn => sortFn(this.studentA, this.studentB));
    this.stub(this.gradebook, 'localeSort');
  }
});

test('sorts the gradebook rows', function () {
  this.gradebook.sortByCustomColumn('sortable_name', 'ascending');
  equal(this.gradebook.sortRowsBy.callCount, 1);
});

test('sorts using localeSort when the settingKey is "sortable_name"', function () {
  this.gradebook.sortByCustomColumn('sortable_name', 'ascending');
  equal(this.gradebook.localeSort.callCount, 1);
});

test('sorts by sortable_name using the "sortable_name" field on students', function () {
  this.gradebook.sortByCustomColumn('sortable_name', 'ascending');
  const [studentA, studentB] = this.gradebook.localeSort.getCall(0).args;
  equal(studentA, 'Ford, Betty', 'studentA sortable_name is in first position');
  equal(studentB, 'Jones, Adam', 'studentB sortable_name is in second position');
});

test('optionally sorts in descending order', function () {
  this.gradebook.sortByCustomColumn('sortable_name', 'descending');
  const [studentA, studentB] = this.gradebook.localeSort.getCall(0).args;
  equal(studentA, 'Jones, Adam', 'studentB sortable_name is in first position');
  equal(studentB, 'Ford, Betty', 'studentA sortable_name is in second position');
});

QUnit.module('sortByCustomColumn', {
  setup () {
    this.gradebook = createGradebook();
    this.studentA = { custom_col_501: 'Great at math' };
    this.studentB = { custom_col_501: 'Tutors English' };
    this.stub(this.gradebook, 'sortRowsBy').callsFake(sortFn => sortFn(this.studentA, this.studentB));
    this.stub(this.gradebook, 'localeSort');
  }
});

test('sorts the gradebook rows', function () {
  this.gradebook.sortByCustomColumn('custom_col_501', 'ascending');
  equal(this.gradebook.sortRowsBy.callCount, 1);
});

test('sorts using localeSort', function () {
  this.gradebook.sortByCustomColumn('custom_col_501', 'ascending');
  equal(this.gradebook.localeSort.callCount, 1);
});

test('sorts using student data stored with the columnId', function () {
  this.gradebook.sortByCustomColumn('custom_col_501', 'ascending');
  const [studentNoteA, studentNoteB] = this.gradebook.localeSort.getCall(0).args;
  equal(studentNoteA, 'Great at math', 'studentA data is in first position');
  equal(studentNoteB, 'Tutors English', 'studentB data is in second position');
});

test('optionally sorts in descending order', function () {
  this.gradebook.sortByCustomColumn('custom_col_501', 'descending');
  const [studentNoteA, studentNoteB] = this.gradebook.localeSort.getCall(0).args;
  equal(studentNoteA, 'Tutors English', 'studentB data is in first position');
  equal(studentNoteB, 'Great at math', 'studentA data is in second position');
});

QUnit.module('sortByAssignmentColumn', {
  setup () {
    this.gradebook = createGradebook();
    this.studentA = { name: 'Adam Jones' };
    this.studentB = { name: 'Betty Ford' };
    this.stub(this.gradebook, 'sortRowsBy').callsFake(sortFn => sortFn(this.studentA, this.studentB));
    this.stub(this.gradebook, 'gradeSort');
  }
});

test('sorts the gradebook rows', function () {
  this.gradebook.sortByAssignmentColumn('assignment_201', 'grade', 'ascending');
  equal(this.gradebook.sortRowsBy.callCount, 1);
});

test('sorts using gradeSort when the settingKey is "grade"', function () {
  this.gradebook.sortByAssignmentColumn('assignment_201', 'grade', 'ascending');
  equal(this.gradebook.gradeSort.callCount, 1);
});

test('sorts by grade using the columnId', function () {
  this.gradebook.sortByAssignmentColumn('assignment_201', 'grade', 'ascending');
  const field = this.gradebook.gradeSort.getCall(0).args[2];
  equal(field, 'assignment_201');
});

test('optionally sorts by grade in ascending order', function () {
  this.gradebook.sortByAssignmentColumn('assignment_201', 'grade', 'ascending');
  const [studentA, studentB, /* field */, ascending] = this.gradebook.gradeSort.getCall(0).args;
  equal(studentA, this.studentA, 'student A is in first position');
  equal(studentB, this.studentB, 'student B is in second position');
  equal(ascending, true, 'ascending is explicitly true');
});

test('optionally sorts by grade in descending order', function () {
  this.gradebook.sortByAssignmentColumn('assignment_201', 'grade', 'descending');
  const [studentA, studentB, /* field */, ascending] = this.gradebook.gradeSort.getCall(0).args;
  equal(studentA, this.studentA, 'student A is in first position');
  equal(studentB, this.studentB, 'student B is in second position');
  equal(ascending, false, 'ascending is explicitly false');
});

QUnit.module('sortByAssignmentGroupColumn', {
  setup () {
    this.gradebook = createGradebook();
    this.studentA = { name: 'Adam Jones' };
    this.studentB = { name: 'Betty Ford' };
    this.stub(this.gradebook, 'sortRowsBy').callsFake(sortFn => sortFn(this.studentA, this.studentB));
    this.stub(this.gradebook, 'gradeSort');
  }
});

test('sorts the gradebook rows', function () {
  this.gradebook.sortByAssignmentGroupColumn('assignment_group_301', 'grade', 'ascending');
  equal(this.gradebook.sortRowsBy.callCount, 1);
});

test('sorts by grade using gradeSort', function () {
  this.gradebook.sortByAssignmentGroupColumn('assignment_group_301', 'grade', 'ascending');
  equal(this.gradebook.gradeSort.callCount, 1);
});

test('sorts by grade using the columnId', function () {
  this.gradebook.sortByAssignmentGroupColumn('assignment_group_301', 'grade', 'ascending');
  const field = this.gradebook.gradeSort.getCall(0).args[2];
  equal(field, 'assignment_group_301');
});

test('optionally sorts by grade in ascending order', function () {
  this.gradebook.sortByAssignmentGroupColumn('assignment_group_301', 'grade', 'ascending');
  const [studentA, studentB, /* field */, ascending] = this.gradebook.gradeSort.getCall(0).args;
  equal(studentA, this.studentA, 'student A is in first position');
  equal(studentB, this.studentB, 'student B is in second position');
  equal(ascending, true, 'ascending is explicitly true');
});

test('optionally sorts by grade in descending order', function () {
  this.gradebook.sortByAssignmentGroupColumn('assignment_group_301', 'grade', 'descending');
  const [studentA, studentB, /* field */, ascending] = this.gradebook.gradeSort.getCall(0).args;
  equal(studentA, this.studentA, 'student A is in first position');
  equal(studentB, this.studentB, 'student B is in second position');
  equal(ascending, false, 'ascending is explicitly false');
});

QUnit.module('sortByTotalGradeColumn', {
  setup () {
    this.gradebook = createGradebook();
    this.studentA = { name: 'Adam Jones' };
    this.studentB = { name: 'Betty Ford' };
    this.stub(this.gradebook, 'sortRowsBy').callsFake(sortFn => sortFn(this.studentA, this.studentB));
    this.stub(this.gradebook, 'gradeSort');
  }
});

test('sorts the gradebook rows', function () {
  this.gradebook.sortByTotalGradeColumn('ascending');
  equal(this.gradebook.sortRowsBy.callCount, 1);
});

test('sorts by grade using gradeSort', function () {
  this.gradebook.sortByTotalGradeColumn('ascending');
  equal(this.gradebook.gradeSort.callCount, 1);
});

test('sorts by "total_grade"', function () {
  this.gradebook.sortByTotalGradeColumn('ascending');
  const field = this.gradebook.gradeSort.getCall(0).args[2];
  equal(field, 'total_grade');
});

test('optionally sorts by grade in ascending order', function () {
  this.gradebook.sortByTotalGradeColumn('ascending');
  const [studentA, studentB, /* field */, ascending] = this.gradebook.gradeSort.getCall(0).args;
  equal(studentA, this.studentA, 'student A is in first position');
  equal(studentB, this.studentB, 'student B is in second position');
  equal(ascending, true, 'ascending is explicitly true');
});

test('optionally sorts by grade in descending order', function () {
  this.gradebook.sortByTotalGradeColumn('descending');
  const [studentA, studentB, /* field */, ascending] = this.gradebook.gradeSort.getCall(0).args;
  equal(studentA, this.studentA, 'student A is in first position');
  equal(studentB, this.studentB, 'student B is in second position');
  equal(ascending, false, 'ascending is explicitly false');
});

QUnit.module('Gradebook#sortGridRows', {
  setup () {
    this.gradebook = createGradebook();
  }
});

test('sorts by the student column by default', function () {
  this.stub(this.gradebook, 'sortByStudentColumn');
  this.gradebook.sortGridRows();
  equal(this.gradebook.sortByStudentColumn.callCount, 1);
});

test('uses the saved sort setting for student column sorting', function () {
  this.gradebook.setSortRowsBySetting('student_name', 'sortable_name', 'ascending');
  this.stub(this.gradebook, 'sortByStudentColumn');
  this.gradebook.sortGridRows();

  const [settingKey, direction] = this.gradebook.sortByStudentColumn.getCall(0).args;
  equal(settingKey, 'sortable_name', 'parameter 1 is the sort settingKey');
  equal(direction, 'ascending', 'parameter 2 is the sort direction');
});

test('optionally sorts by a custom column', function () {
  this.gradebook.setSortRowsBySetting('custom_col_501', null, 'ascending');
  this.stub(this.gradebook, 'sortByCustomColumn');
  this.gradebook.sortGridRows();
  equal(this.gradebook.sortByCustomColumn.callCount, 1);
});

test('uses the saved sort setting for custom column sorting', function () {
  this.gradebook.setSortRowsBySetting('custom_col_501', null, 'ascending');
  this.stub(this.gradebook, 'sortByCustomColumn');
  this.gradebook.sortGridRows();

  const [columnId, direction] = this.gradebook.sortByCustomColumn.getCall(0).args;
  equal(columnId, 'custom_col_501', 'parameter 1 is the sort columnId');
  equal(direction, 'ascending', 'parameter 2 is the sort direction');
});

test('optionally sorts by an assignment column', function () {
  this.gradebook.setSortRowsBySetting('assignment_201', 'grade', 'ascending');
  this.stub(this.gradebook, 'sortByAssignmentColumn');
  this.gradebook.sortGridRows();
  equal(this.gradebook.sortByAssignmentColumn.callCount, 1);
});

test('uses the saved sort setting for assignment sorting', function () {
  this.gradebook.setSortRowsBySetting('assignment_201', 'grade', 'ascending');
  this.stub(this.gradebook, 'sortByAssignmentColumn');
  this.gradebook.sortGridRows();

  const [columnId, settingKey, direction] = this.gradebook.sortByAssignmentColumn.getCall(0).args;
  equal(columnId, 'assignment_201', 'parameter 1 is the sort columnId');
  equal(settingKey, 'grade', 'parameter 2 is the sort settingKey');
  equal(direction, 'ascending', 'parameter 3 is the sort direction');
});

test('optionally sorts by an assignment group column', function () {
  this.gradebook.setSortRowsBySetting('assignment_group_301', 'grade', 'ascending');
  this.stub(this.gradebook, 'sortByAssignmentGroupColumn');
  this.gradebook.sortGridRows();
  equal(this.gradebook.sortByAssignmentGroupColumn.callCount, 1);
});

test('uses the saved sort setting for assignment group sorting', function () {
  this.gradebook.setSortRowsBySetting('assignment_group_301', 'grade', 'ascending');
  this.stub(this.gradebook, 'sortByAssignmentGroupColumn');
  this.gradebook.sortGridRows();

  const [columnId, settingKey, direction] = this.gradebook.sortByAssignmentGroupColumn.getCall(0).args;
  equal(columnId, 'assignment_group_301', 'parameter 1 is the sort columnId');
  equal(settingKey, 'grade', 'parameter 2 is the sort settingKey');
  equal(direction, 'ascending', 'parameter 3 is the sort direction');
});

test('optionally sorts by the total grade column', function () {
  this.gradebook.setSortRowsBySetting('total_grade', 'grade', 'ascending');
  this.stub(this.gradebook, 'sortByTotalGradeColumn');
  this.gradebook.sortGridRows();
  equal(this.gradebook.sortByTotalGradeColumn.callCount, 1);
});

test('uses the saved sort setting for total grade sorting', function () {
  this.gradebook.setSortRowsBySetting('total_grade', 'grade', 'ascending');
  this.stub(this.gradebook, 'sortByTotalGradeColumn');
  this.gradebook.sortGridRows();

  const [direction] = this.gradebook.sortByTotalGradeColumn.getCall(0).args;
  equal(direction, 'ascending', 'the only parameter is the sort direction');
});

test('updates the column headers after sorting', function () {
  this.stub(this.gradebook, 'sortByStudentColumn');
  this.stub(this.gradebook, 'updateColumnHeaders').callsFake(() => {
    equal(this.gradebook.sortByStudentColumn.callCount, 1, 'sorting method was called first');
  });
  this.gradebook.sortGridRows();
})

QUnit.module('Gradebook#groupTotalFormatter', {
  setup () {
    fakeENV.setup();
  },

  teardown () {
    fakeENV.teardown();
  },
});

test('calculates percentage from given score and possible values', function () {
  const gradebook = createGradebook();
  const groupTotalOutput = gradebook.groupTotalFormatter(0, 0, { score: 9, possible: 10 }, {});
  ok(groupTotalOutput.includes('9 / 10'));
  ok(groupTotalOutput.includes('90%'));
});

test('displays percentage as "-" when group total score is positive infinity', function () {
  const gradebook = createGradebook();
  this.stub(gradebook, 'calculateAndRoundGroupTotalScore').returns(Number.POSITIVE_INFINITY);
  const groupTotalOutput = gradebook.groupTotalFormatter(0, 0, { score: 9, possible: 0 }, {});
  ok(groupTotalOutput.includes('9 / 0'));
  ok(groupTotalOutput.includes('-'));
});

test('displays percentage as "-" when group total score is negative infinity', function () {
  const gradebook = createGradebook();
  this.stub(gradebook, 'calculateAndRoundGroupTotalScore').returns(Number.NEGATIVE_INFINITY);
  const groupTotalOutput = gradebook.groupTotalFormatter(0, 0, { score: 9, possible: 0 }, {});
  ok(groupTotalOutput.includes('9 / 0'));
  ok(groupTotalOutput.includes('-'));
});

test('displays percentage as "-" when group total score is not a number', function () {
  const gradebook = createGradebook();
  this.stub(gradebook, 'calculateAndRoundGroupTotalScore').returns(NaN);
  const groupTotalOutput = gradebook.groupTotalFormatter(0, 0, { score: 9, possible: 0 }, {});
  ok(groupTotalOutput.includes('9 / 0'));
  ok(groupTotalOutput.includes('-'));
});

QUnit.module('Gradebook#onBeforeHeaderCellDestroy', {
  setup () {
    this.$mountPoint = document.createElement('div');
    $fixtures.appendChild(this.$mountPoint);
  },

  teardown () {
    $fixtures.innerHTML = '';
  }
});

test('unmounts any component on the cell being destroyed', function () {
  const component = React.createElement('span', {}, 'Example Component');
  ReactDOM.render(component, this.$mountPoint, null);
  Gradebook.prototype.onBeforeHeaderCellDestroy(null, { node: this.$mountPoint });
  const componentExistedAtNode = ReactDOM.unmountComponentAtNode(this.$mountPoint);
  equal(componentExistedAtNode, false, 'the component was already unmounted');
});

QUnit.module('Gradebook#renderStudentColumnHeader', {
  setup () {
    this.$mountPoint = document.createElement('div');
    $fixtures.appendChild(this.$mountPoint);
  },

  teardown () {
    ReactDOM.unmountComponentAtNode(this.$mountPoint);
    $fixtures.innerHTML = '';
  }
});

test('renders the StudentColumnHeader to the "student" column header node', function () {
  const gradebook = createGradebook();
  this.stub(gradebook, 'getColumnHeaderNode').withArgs('student').returns(this.$mountPoint);
  gradebook.renderStudentColumnHeader();
  ok(this.$mountPoint.innerText.includes('Student Name'), 'the "Student Name" header is rendered');
});

QUnit.module('Gradebook#getStudentColumnHeaderProps');

test('includes properties from gradebook', function () {
  const gradebook = createGradebook();
  const props = gradebook.getStudentColumnHeaderProps();
  ok(props.selectedSecondaryInfo, 'selectedSecondaryInfo is present');
  ok(props.selectedPrimaryInfo, 'selectedPrimaryInfo is present');
  equal(typeof props.sectionsEnabled, 'boolean');
  equal(typeof props.onSelectSecondaryInfo, 'function');
  equal(typeof props.onSelectPrimaryInfo, 'function');
});

test('includes props for the "Sort by" settings', function () {
  const props = createGradebook().getStudentColumnHeaderProps();
  ok(props.sortBySetting, 'sort by setting is present');
  equal(typeof props.sortBySetting.disabled, 'boolean', 'props include "disabled"');
  equal(typeof props.sortBySetting.onSortBySortableNameAscending, 'function', 'props include "onSortBySortableNameAscending"');
  equal(typeof props.sortBySetting.onSortBySortableNameDescending, 'function', 'props include "onSortBySortableNameDescending"');
});

QUnit.module('Gradebook#getStudentColumnSortBySetting', {
  setup () {
    this.gradebook = createGradebook();
    this.gradebook.setStudentsLoaded(true);
  }
});

test('includes the sort direction', function () {
  this.gradebook.setSortRowsBySetting('student', 'sortable_name', 'ascending');
  const props = this.gradebook.getStudentColumnSortBySetting();
  equal(props.direction, 'ascending');
});

test('is not disabled when students are loaded', function () {
  const props = this.gradebook.getStudentColumnSortBySetting();
  equal(props.disabled, false);
});

test('is disabled when students are not loaded', function () {
  this.gradebook.setStudentsLoaded(false);
  const props = this.gradebook.getStudentColumnSortBySetting();
  equal(props.disabled, true);
});

test('sets isSortColumn to true when sorting by the student column', function () {
  this.gradebook.setSortRowsBySetting('student', 'sortable_name', 'ascending');
  const props = this.gradebook.getStudentColumnSortBySetting();
  equal(props.isSortColumn, true);
});

test('sets isSortColumn to false when not sorting by the student column', function () {
  const columnId = this.gradebook.getAssignmentColumnId('202');
  this.gradebook.setSortRowsBySetting(columnId, 'grade', 'ascending');
  const props = this.gradebook.getStudentColumnSortBySetting();
  equal(props.isSortColumn, false);
});

test('sets the onSortBySortableNameAscending function', function () {
  this.stub(this.gradebook, 'setSortRowsBySetting');
  const props = this.gradebook.getStudentColumnSortBySetting();

  props.onSortBySortableNameAscending();
  equal(this.gradebook.setSortRowsBySetting.callCount, 1);

  const [columnId, settingKey, direction] = this.gradebook.setSortRowsBySetting.getCall(0).args;
  equal(columnId, 'student', 'parameter 1 is the sort columnId');
  equal(settingKey, 'sortable_name', 'parameter 2 is the sort settingKey');
  equal(direction, 'ascending', 'parameter 3 is the sort direction');
});

test('sets the onSortBySortableNameDescending function', function () {
  this.stub(this.gradebook, 'setSortRowsBySetting');
  const props = this.gradebook.getStudentColumnSortBySetting();

  props.onSortBySortableNameDescending();
  equal(this.gradebook.setSortRowsBySetting.callCount, 1);

  const [columnId, settingKey, direction] = this.gradebook.setSortRowsBySetting.getCall(0).args;
  equal(columnId, 'student', 'parameter 1 is the sort columnId');
  equal(settingKey, 'sortable_name', 'parameter 2 is the sort settingKey');
  equal(direction, 'descending', 'parameter 3 is the sort direction');
});

test('includes the sort settingKey', function () {
  this.gradebook.setSortRowsBySetting('student', 'sortable_name', 'ascending');
  const props = this.gradebook.getStudentColumnSortBySetting();
  equal(props.settingKey, 'sortable_name');
});

QUnit.module('Gradebook#renderAssignmentColumnHeader', {
  setup () {
    fakeENV.setup({
      GRADEBOOK_OPTIONS: {
        context_url: 'http://contextUrl/'
      },
      current_user_roles: []
    });
    this.$mountPoint = document.createElement('div');
    $fixtures.appendChild(this.$mountPoint);
  },

  createGradebook (options = {}) {
    const gradebook = createGradebook(options);
    gradebook.setAssignments({
      201: {
        course_id: '801',
        id: '201',
        html_url: '/assignments/201',
        muted: false,
        name: 'Math Assignment',
        omit_from_final_grade: false,
        submission_types: ['online_text_entry']
      }
    });
    return gradebook;
  },

  teardown () {
    ReactDOM.unmountComponentAtNode(this.$mountPoint);
    $fixtures.innerHTML = '';
    fakeENV.teardown();
  }
});

test('renders the AssignmentColumnHeader to the related assignment column header node', function () {
  const gradebook = this.createGradebook();
  this.stub(gradebook, 'getColumnHeaderNode').withArgs('assignment_201').returns(this.$mountPoint);
  gradebook.renderAssignmentColumnHeader('201');
  ok(this.$mountPoint.innerText.includes('Math Assignment'), 'the Assignment header is rendered');
});

QUnit.module('Gradebook#renderAssignmentGroupColumnHeader', {
  setup () {
    this.$mountPoint = document.createElement('div');
    $fixtures.appendChild(this.$mountPoint);
  },

  createGradebook (options = {}) {
    const gradebook = createGradebook({
      group_weighting_scheme: 'percent',
      ...options
    });
    gradebook.setAssignmentGroups({
      301: { name: 'Assignments', group_weight: 40 }
    });
    return gradebook;
  },

  teardown () {
    ReactDOM.unmountComponentAtNode(this.$mountPoint);
    $fixtures.innerHTML = '';
  }
});

test('renders the AssignmentGroupColumnHeader to the related assignment group column header node', function () {
  const gradebook = this.createGradebook();
  this.stub(gradebook, 'getColumnHeaderNode').withArgs('assignment_group_301').returns(this.$mountPoint);
  gradebook.renderAssignmentGroupColumnHeader('301');
  ok(this.$mountPoint.innerText.includes('Assignments'), 'the Assignment Group header is rendered');
});

QUnit.module('Gradebook#renderTotalGradeColumnHeader', {
  setup () {
    this.$mountPoint = document.createElement('div');
    $fixtures.appendChild(this.$mountPoint);
  },

  teardown () {
    ReactDOM.unmountComponentAtNode(this.$mountPoint);
    $fixtures.innerHTML = '';
  }
});

test('renders the TotalGradeColumnHeader to the "total_grade" column header node', function () {
  const gradebook = createGradebook();
  this.stub(gradebook, 'hideAggregateColumns').returns(false);
  this.stub(gradebook, 'getColumnHeaderNode').withArgs('total_grade').returns(this.$mountPoint);
  gradebook.renderTotalGradeColumnHeader();
  ok(this.$mountPoint.innerText.includes('Total'), 'the "Total" header is rendered');
});

test('does not render when aggregate columns are hidden', function () {
  const gradebook = createGradebook();
  this.stub(gradebook, 'hideAggregateColumns').returns(true);
  this.stub(gradebook, 'getColumnHeaderNode').withArgs('total_grade').returns(this.$mountPoint);
  gradebook.renderTotalGradeColumnHeader();
  equal(this.$mountPoint.children.length, 0, 'the mount point contains no elements');
});

QUnit.module('Gradebook#getAssignmentColumnId');

test('returns a unique key for the assignment column', function () {
  equal(Gradebook.prototype.getAssignmentColumnId('201'), 'assignment_201');
});

QUnit.module('Gradebook#getAssignmentGroupColumnId');

test('returns a unique key for the assignment group column', function () {
  equal(Gradebook.prototype.getAssignmentGroupColumnId('301'), 'assignment_group_301');
});

QUnit.module('Gradebook#getAssignmentColumnSortBySetting', {
  setup () {
    this.gradebook = createGradebook();
    this.gradebook.setAssignmentsLoaded(true);
    this.gradebook.setStudentsLoaded(true);
    this.gradebook.setSubmissionsLoaded(true);
  }
});

test('includes the sort direction', function () {
  const columnId = this.gradebook.getAssignmentColumnId('201');
  this.gradebook.setSortRowsBySetting(columnId, 'grade', 'ascending');
  const props = this.gradebook.getAssignmentColumnSortBySetting('201');
  equal(props.direction, 'ascending');
});

test('is not disabled when assignments, students, and submissions are loaded', function () {
  const props = this.gradebook.getAssignmentColumnSortBySetting('201');
  equal(props.disabled, false);
});

test('is disabled when assignments are not loaded', function () {
  this.gradebook.setAssignmentsLoaded(false);
  const props = this.gradebook.getAssignmentColumnSortBySetting('201');
  equal(props.disabled, true);
});

test('is disabled when students are not loaded', function () {
  this.gradebook.setStudentsLoaded(false);
  const props = this.gradebook.getAssignmentColumnSortBySetting('201');
  equal(props.disabled, true);
});

test('is disabled when submissions are not loaded', function () {
  this.gradebook.setSubmissionsLoaded(false);
  const props = this.gradebook.getAssignmentColumnSortBySetting('201');
  equal(props.disabled, true);
});

test('sets isSortColumn to true when sorting by the given assignment', function () {
  const columnId = this.gradebook.getAssignmentColumnId('201');
  this.gradebook.setSortRowsBySetting(columnId, 'grade', 'ascending');
  const props = this.gradebook.getAssignmentColumnSortBySetting('201');
  equal(props.isSortColumn, true);
});

test('sets isSortColumn to false when not sorting by the given assignment', function () {
  const columnId = this.gradebook.getAssignmentColumnId('202');
  this.gradebook.setSortRowsBySetting(columnId, 'grade', 'ascending');
  const props = this.gradebook.getAssignmentColumnSortBySetting('201');
  equal(props.isSortColumn, false);
});

test('sets the onSortByGradeAscending function', function () {
  this.stub(this.gradebook, 'setSortRowsBySetting');
  const props = this.gradebook.getAssignmentColumnSortBySetting('201');

  props.onSortByGradeAscending();
  equal(this.gradebook.setSortRowsBySetting.callCount, 1);

  const [columnId, settingKey, direction] = this.gradebook.setSortRowsBySetting.getCall(0).args;
  equal(columnId, this.gradebook.getAssignmentColumnId('201'), 'parameter 1 is the sort columnId');
  equal(settingKey, 'grade', 'parameter 2 is the sort settingKey');
  equal(direction, 'ascending', 'parameter 3 is the sort direction');
});

test('sets the onSortByGradeDescending function', function () {
  this.stub(this.gradebook, 'setSortRowsBySetting');
  const props = this.gradebook.getAssignmentColumnSortBySetting('201');

  props.onSortByGradeDescending();
  equal(this.gradebook.setSortRowsBySetting.callCount, 1);

  const [columnId, settingKey, direction] = this.gradebook.setSortRowsBySetting.getCall(0).args;
  equal(columnId, this.gradebook.getAssignmentColumnId('201'), 'parameter 1 is the sort columnId');
  equal(settingKey, 'grade', 'parameter 2 is the sort settingKey');
  equal(direction, 'descending', 'parameter 3 is the sort direction');
});

test('sets the onSortByLate function', function () {
  this.stub(this.gradebook, 'setSortRowsBySetting');
  const props = this.gradebook.getAssignmentColumnSortBySetting('201');

  props.onSortByLate();
  equal(this.gradebook.setSortRowsBySetting.callCount, 1);

  const [columnId, settingKey, direction] = this.gradebook.setSortRowsBySetting.getCall(0).args;
  equal(columnId, this.gradebook.getAssignmentColumnId('201'), 'parameter 1 is the sort columnId');
  equal(settingKey, 'late', 'parameter 2 is the sort settingKey');
  equal(direction, 'ascending', 'parameter 3 is the sort direction');
});

test('sets the onSortByMissing function', function () {
  this.stub(this.gradebook, 'setSortRowsBySetting');
  const props = this.gradebook.getAssignmentColumnSortBySetting('201');

  props.onSortByMissing();
  equal(this.gradebook.setSortRowsBySetting.callCount, 1);

  const [columnId, settingKey, direction] = this.gradebook.setSortRowsBySetting.getCall(0).args;
  equal(columnId, this.gradebook.getAssignmentColumnId('201'), 'parameter 1 is the sort columnId');
  equal(settingKey, 'missing', 'parameter 2 is the sort settingKey');
  equal(direction, 'ascending', 'parameter 3 is the sort direction');
});

test('sets the onSortByUnposted function', function () {
  this.stub(this.gradebook, 'setSortRowsBySetting');
  const props = this.gradebook.getAssignmentColumnSortBySetting('201');

  props.onSortByUnposted();
  equal(this.gradebook.setSortRowsBySetting.callCount, 1);

  const [columnId, settingKey, direction] = this.gradebook.setSortRowsBySetting.getCall(0).args;
  equal(columnId, this.gradebook.getAssignmentColumnId('201'), 'parameter 1 is the sort columnId');
  equal(settingKey, 'unposted', 'parameter 2 is the sort settingKey');
  equal(direction, 'ascending', 'parameter 3 is the sort direction');
});

test('includes the sort settingKey', function () {
  const columnId = this.gradebook.getAssignmentColumnId('202');
  this.gradebook.setSortRowsBySetting(columnId, 'grade', 'ascending');
  const props = this.gradebook.getAssignmentColumnSortBySetting('201');
  equal(props.settingKey, 'grade');
});

QUnit.module('Gradebook#getAssignmentColumnHeaderProps', {
  setup () {
    fakeENV.setup({
      GRADEBOOK_OPTIONS: {
        context_url: 'http://contextUrl/'
      },
      current_user_roles: []
    });
  },

  createGradebook (options = {}) {
    const gradebook = createGradebook(options);
    gradebook.setAssignments({
      201: { name: 'Math Assignment' },
      202: { name: 'English Assignment' }
    });
    return gradebook;
  },

  teardown () {
    fakeENV.teardown();
  }
});

test('includes properties from the assignment', function () {
  const props = this.createGradebook().getAssignmentColumnHeaderProps('201');
  ok(props.assignment, 'assignment is present');
  equal(props.assignment.name, 'Math Assignment');
});

test('includes props for the "Sort by" setting', function () {
  const props = this.createGradebook().getAssignmentColumnHeaderProps('201');
  ok(props.sortBySetting, 'Sort by setting is present');
  equal(typeof props.sortBySetting.disabled, 'boolean', 'props include "disabled"');
  equal(typeof props.sortBySetting.onSortByGradeAscending, 'function', 'props include "onSortByGradeAscending"');
});

test('includes props for the Assignment Details action', function () {
  const props = this.createGradebook().getAssignmentColumnHeaderProps('201');
  ok(props.assignmentDetailsAction, 'Assignment Details action config is present');
  ok('disabled' in props.assignmentDetailsAction, 'props include "disabled"');
  equal(typeof props.assignmentDetailsAction.onSelect, 'function', 'props include "onSelect"');
});

test('includes props for the Set Default Grade action', function () {
  const props = this.createGradebook().getAssignmentColumnHeaderProps('201');
  ok(props.setDefaultGradeAction, 'Set Default Grade action config is present');
  ok('disabled' in props.setDefaultGradeAction, 'props include "disabled"');
  equal(typeof props.setDefaultGradeAction.onSelect, 'function', 'props include "onSelect"');
});

test('includes props for the Download Submissions action', function () {
  const props = this.createGradebook().getAssignmentColumnHeaderProps('201');
  ok(props.downloadSubmissionsAction, 'Download Submissions action config is present');
  ok('hidden' in props.downloadSubmissionsAction, 'props include "hidden"');
  equal(typeof props.downloadSubmissionsAction.onSelect, 'function', 'props include "onSelect"');
});

test('includes props for the Reupload Submissions action', function () {
  const props = this.createGradebook().getAssignmentColumnHeaderProps('201');
  ok(props.reuploadSubmissionsAction, 'Reupload Submissions action config is present');
  ok('hidden' in props.reuploadSubmissionsAction, 'props include "hidden"');
  equal(typeof props.reuploadSubmissionsAction.onSelect, 'function', 'props include "onSelect"');
});

test('includes props for the Mute Assignment action', function () {
  const props = this.createGradebook().getAssignmentColumnHeaderProps('201');
  ok(props.muteAssignmentAction, 'Mute Assignment action config is present');
  ok('disabled' in props.muteAssignmentAction, 'props include "disabled"');
  equal(typeof props.muteAssignmentAction.onSelect, 'function', 'props include "onSelect"');
});

QUnit.module('Gradebook#getAssignmentGroupColumnSortBySetting', {
  setup () {
    this.gradebook = createGradebook();
    this.gradebook.setAssignmentsLoaded(true);
    this.gradebook.setStudentsLoaded(true);
    this.gradebook.setSubmissionsLoaded(true);
  }
});

test('includes the sort direction', function () {
  const columnId = this.gradebook.getAssignmentGroupColumnId('301');
  this.gradebook.setSortRowsBySetting(columnId, 'grade', 'ascending');
  const props = this.gradebook.getAssignmentGroupColumnSortBySetting('301');
  equal(props.direction, 'ascending');
});

test('is not disabled when assignments, students, and submissions are loaded', function () {
  const props = this.gradebook.getAssignmentGroupColumnSortBySetting('301');
  equal(props.disabled, false);
});

test('is disabled when assignments are not loaded', function () {
  this.gradebook.setAssignmentsLoaded(false);
  const props = this.gradebook.getAssignmentGroupColumnSortBySetting('301');
  equal(props.disabled, true);
});

test('is disabled when students are not loaded', function () {
  this.gradebook.setStudentsLoaded(false);
  const props = this.gradebook.getAssignmentGroupColumnSortBySetting('301');
  equal(props.disabled, true);
});

test('is disabled when submissions are not loaded', function () {
  this.gradebook.setSubmissionsLoaded(false);
  const props = this.gradebook.getAssignmentGroupColumnSortBySetting('301');
  equal(props.disabled, true);
});

test('sets isSortColumn to true when sorting by the given assignment', function () {
  const columnId = this.gradebook.getAssignmentGroupColumnId('301');
  this.gradebook.setSortRowsBySetting(columnId, 'grade', 'ascending');
  const props = this.gradebook.getAssignmentGroupColumnSortBySetting('301');
  equal(props.isSortColumn, true);
});

test('sets isSortColumn to false when not sorting by the given assignment', function () {
  const columnId = this.gradebook.getAssignmentGroupColumnId('302');
  this.gradebook.setSortRowsBySetting(columnId, 'grade', 'ascending');
  const props = this.gradebook.getAssignmentGroupColumnSortBySetting('301');
  equal(props.isSortColumn, false);
});

test('sets the onSortByGradeAscending function', function () {
  this.stub(this.gradebook, 'setSortRowsBySetting');
  const props = this.gradebook.getAssignmentGroupColumnSortBySetting('301');

  props.onSortByGradeAscending();
  equal(this.gradebook.setSortRowsBySetting.callCount, 1);

  const [columnId, settingKey, direction] = this.gradebook.setSortRowsBySetting.getCall(0).args;
  equal(columnId, this.gradebook.getAssignmentGroupColumnId('301'), 'parameter 1 is the sort columnId');
  equal(settingKey, 'grade', 'parameter 2 is the sort settingKey');
  equal(direction, 'ascending', 'parameter 3 is the sort direction');
});

test('sets the onSortByGradeDescending function', function () {
  this.stub(this.gradebook, 'setSortRowsBySetting');
  const props = this.gradebook.getAssignmentGroupColumnSortBySetting('301');

  props.onSortByGradeDescending();
  equal(this.gradebook.setSortRowsBySetting.callCount, 1);

  const [columnId, settingKey, direction] = this.gradebook.setSortRowsBySetting.getCall(0).args;
  equal(columnId, this.gradebook.getAssignmentGroupColumnId('301'), 'parameter 1 is the sort columnId');
  equal(settingKey, 'grade', 'parameter 2 is the sort settingKey');
  equal(direction, 'descending', 'parameter 3 is the sort direction');
});

test('includes the sort settingKey', function () {
  const columnId = this.gradebook.getAssignmentGroupColumnId('301');
  this.gradebook.setSortRowsBySetting(columnId, 'grade', 'ascending');
  const props = this.gradebook.getAssignmentGroupColumnSortBySetting('301');
  equal(props.settingKey, 'grade');
});

QUnit.module('Gradebook#getAssignmentGroupColumnHeaderProps', {
  createGradebook (options = {}) {
    const gradebook = createGradebook({
      group_weighting_scheme: 'percent',
      ...options
    });
    gradebook.setAssignmentGroups({
      301: { name: 'Assignments', group_weight: 40 },
      302: { name: 'Homework', group_weight: 60 }
    });
    return gradebook;
  }
});

test('includes properties from the assignment group', function () {
  const props = this.createGradebook().getAssignmentGroupColumnHeaderProps('301');
  ok(props.assignmentGroup, 'assignmentGroup is present');
  equal(props.assignmentGroup.name, 'Assignments');
  equal(props.assignmentGroup.groupWeight, 40);
});

test('sets weightedGroups to true when assignment group weighting scheme is "percent"', function () {
  const props = this.createGradebook().getAssignmentGroupColumnHeaderProps('301');
  equal(props.weightedGroups, true);
});

test('sets weightedGroups to false when assignment group weighting scheme is not "percent"', function () {
  const options = { group_weighting_scheme: 'equal' };
  const props = this.createGradebook(options).getAssignmentGroupColumnHeaderProps('301');
  equal(props.weightedGroups, false);
});

test('includes props for the "Sort by" setting', function () {
  const props = this.createGradebook().getAssignmentGroupColumnHeaderProps('301');
  ok(props.sortBySetting, 'Sort by setting is present');
  equal(typeof props.sortBySetting.disabled, 'boolean', 'props include "disabled"');
  equal(typeof props.sortBySetting.onSortByGradeAscending, 'function', 'props include "onSortByGradeAscending"');
});

QUnit.module('Gradebook#getTotalGradeColumnSortBySetting', {
  setup () {
    this.gradebook = createGradebook();
    this.gradebook.setAssignmentsLoaded(true);
    this.gradebook.setStudentsLoaded(true);
    this.gradebook.setSubmissionsLoaded(true);
  }
});

test('includes the sort direction', function () {
  this.gradebook.setSortRowsBySetting('total_grade', 'grade', 'ascending');
  const props = this.gradebook.getTotalGradeColumnSortBySetting();
  equal(props.direction, 'ascending');
});

test('is not disabled when assignments, students, and submissions are loaded', function () {
  const props = this.gradebook.getTotalGradeColumnSortBySetting();
  equal(props.disabled, false);
});

test('is disabled when assignments are not loaded', function () {
  this.gradebook.setAssignmentsLoaded(false);
  const props = this.gradebook.getTotalGradeColumnSortBySetting();
  equal(props.disabled, true);
});

test('is disabled when students are not loaded', function () {
  this.gradebook.setStudentsLoaded(false);
  const props = this.gradebook.getTotalGradeColumnSortBySetting();
  equal(props.disabled, true);
});

test('is disabled when submissions are not loaded', function () {
  this.gradebook.setSubmissionsLoaded(false);
  const props = this.gradebook.getTotalGradeColumnSortBySetting();
  equal(props.disabled, true);
});

test('sets isSortColumn to true when sorting by the total grade', function () {
  this.gradebook.setSortRowsBySetting('total_grade', 'grade', 'ascending');
  const props = this.gradebook.getTotalGradeColumnSortBySetting();
  equal(props.isSortColumn, true);
});

test('sets isSortColumn to false when not sorting by the total grade', function () {
  this.gradebook.setSortRowsBySetting('student', 'grade', 'ascending');
  const props = this.gradebook.getTotalGradeColumnSortBySetting();
  equal(props.isSortColumn, false);
});

test('sets the onSortByGradeAscending function', function () {
  this.stub(this.gradebook, 'setSortRowsBySetting');
  const props = this.gradebook.getTotalGradeColumnSortBySetting();

  props.onSortByGradeAscending();
  equal(this.gradebook.setSortRowsBySetting.callCount, 1);

  const [columnId, settingKey, direction] = this.gradebook.setSortRowsBySetting.getCall(0).args;
  equal(columnId, 'total_grade', 'parameter 1 is the sort columnId');
  equal(settingKey, 'grade', 'parameter 2 is the sort settingKey');
  equal(direction, 'ascending', 'parameter 3 is the sort direction');
});

test('sets the onSortByGradeDescending function', function () {
  this.stub(this.gradebook, 'setSortRowsBySetting');
  const props = this.gradebook.getTotalGradeColumnSortBySetting();

  props.onSortByGradeDescending();
  equal(this.gradebook.setSortRowsBySetting.callCount, 1);

  const [columnId, settingKey, direction] = this.gradebook.setSortRowsBySetting.getCall(0).args;
  equal(columnId, 'total_grade', 'parameter 1 is the sort columnId');
  equal(settingKey, 'grade', 'parameter 2 is the sort settingKey');
  equal(direction, 'descending', 'parameter 3 is the sort direction');
});

test('includes the sort settingKey', function () {
  this.gradebook.setSortRowsBySetting('total_grade', 'grade', 'ascending');
  const props = this.gradebook.getTotalGradeColumnSortBySetting();
  equal(props.settingKey, 'grade');
});

QUnit.module('Gradebook#getTotalGradeColumnHeaderProps', {
  createGradebook (options = {}) {
    const gradebook = createGradebook({
      group_weighting_scheme: 'percent',
      ...options
    });
    gradebook.setAssignmentGroups({
      301: { name: 'Assignments', group_weight: 40 },
      302: { name: 'Homework', group_weight: 60 }
    });
    return gradebook;
  }
});

test('includes props for the "Sort by" setting', function () {
  const props = this.createGradebook().getTotalGradeColumnHeaderProps('301');
  ok(props.sortBySetting, 'Sort by setting is present');
  equal(typeof props.sortBySetting.disabled, 'boolean', 'props include "disabled"');
  equal(typeof props.sortBySetting.onSortByGradeAscending, 'function', 'props include "onSortByGradeAscending"');
});

QUnit.module('Gradebook#setStudentDisplay', {
  createGradebook (multipleSections = false) {
    const options = {};

    if (multipleSections) {
      options.sections = [
        { id: '1000', name: 'section1000' },
        { id: '2000', name: 'section2000' }
      ];
    }

    return createGradebook(options);
  },

  createStudent () {
    return {
      name: 'test student',
      sortable_name: 'student, test',
      sections: ['1000'],
      sis_user_id: 'sis_user_id',
      login_id: 'canvas_login_id',
      enrollments: [{grades: {html_url: 'http://example.url/'}}]
    };
  },

  setup () {
    fakeENV.setup({
      GRADEBOOK_OPTIONS: { context_id: 10 },
    });
  },

  teardown () {
    fakeENV.teardown();
  }
});

test('sets a display_name prop on the given student with their name', function () {
  const gradebook = this.createGradebook();
  const student = this.createStudent();

  gradebook.setStudentDisplay(student);

  ok(student.display_name.includes(student.name));
});

test('when secondaryInfo is set as "section", sets display_name with sections', function () {
  const gradebook = this.createGradebook(true);
  const student = this.createStudent();

  gradebook.setSelectedSecondaryInfo('section', true);
  gradebook.setStudentDisplay(student);

  ok(student.display_name.includes(student.sections[0]));
});

test('when secondaryInfo is set as "sis_id", sets display_name with sis id', function () {
  const gradebook = this.createGradebook(true);
  const student = this.createStudent();

  gradebook.setSelectedSecondaryInfo('sis_id', true);
  gradebook.setStudentDisplay(student);

  ok(student.display_name.includes(student.sis_user_id));
});

test('when secondaryInfo is set as "login_id", sets display_name with login id', function () {
  const gradebook = this.createGradebook(true);
  const student = this.createStudent();

  gradebook.setSelectedSecondaryInfo('login_id', true);
  gradebook.setStudentDisplay(student);

  ok(student.display_name.includes(student.login_id));
});

test('when secondaryInfo is set as "none", sets display_name without other values', function () {
  const gradebook = this.createGradebook(true);
  const student = this.createStudent();

  gradebook.setSelectedSecondaryInfo('none', true);
  gradebook.setStudentDisplay(student);

  notOk(student.display_name.includes(student.sections[0]));
  notOk(student.display_name.includes(student.sis_user_id));
  notOk(student.display_name.includes(student.login_id));
});

test('when primaryInfo is set as "first_last", sets display_name with student name', function () {
  const gradebook = this.createGradebook();
  const student = this.createStudent();

  gradebook.setSelectedPrimaryInfo('first_last', true);
  gradebook.setStudentDisplay(student);

  ok(student.display_name.includes(student.name));
});

test('when primaryInfo is set as "last_first", sets display_name with student sortable_name', function () {
  const gradebook = this.createGradebook();
  const student = this.createStudent();

  gradebook.setSelectedPrimaryInfo('last_first', true);
  gradebook.setStudentDisplay(student);

  ok(student.display_name.includes(student.sortable_name));
});

test('when primaryInfo is set as "anonymous", sets display_name without other values', function () {
  const gradebook = this.createGradebook();
  const student = this.createStudent();

  gradebook.setSelectedPrimaryInfo('anonymous', true);
  gradebook.setStudentDisplay(student);

  notOk(student.display_name.includes(student.name));
  notOk(student.display_name.includes(student.sortable_name));
});

QUnit.module('Gradebook#setSortRowsBySetting');

test('sets the "sort rows by" setting', function () {
  const gradebook = createGradebook();
  gradebook.setSortRowsBySetting('assignment_201', 'grade', 'descending');
  const sortRowsBySetting = gradebook.getSortRowsBySetting();
  equal(sortRowsBySetting.columnId, 'assignment_201');
  equal(sortRowsBySetting.settingKey, 'grade');
  equal(sortRowsBySetting.direction, 'descending');
});

test('sorts the grid rows after updating the setting', function () {
  const gradebook = createGradebook();
  this.stub(gradebook, 'sortGridRows').callsFake(() => {
    const sortRowsBySetting = gradebook.getSortRowsBySetting();
    equal(sortRowsBySetting.columnId, 'assignment_201', 'sortRowsBySetting.columnId was set beforehand');
    equal(sortRowsBySetting.settingKey, 'grade', 'sortRowsBySetting.settingKey was set beforehand');
    equal(sortRowsBySetting.direction, 'descending', 'sortRowsBySetting.direction was set beforehand');
  });
  gradebook.setSortRowsBySetting('assignment_201', 'grade', 'descending');
});
