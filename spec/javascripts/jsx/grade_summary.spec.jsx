/**
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
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

define([
  'lodash',
  'jquery',
  'helpers/fakeENV',
  'jsx/gradebook/CourseGradeCalculator',
  'grade_summary'
], (_, $, fakeENV, CourseGradeCalculator, grade_summary) => { // eslint-disable-line camelcase
  function createAssignmentGroups () {
    return [
      { id: '301', assignments: [{ id: '201', muted: false }, { id: '202', muted: true }] },
      { id: '302', assignments: [{ id: '203', muted: true }] }
    ];
  }

  function createSubmissions () {
    return [
      { assignment_id: '201', score: 10 },
      { assignment_id: '203', score: 15 }
    ];
  }

  module('grade_summary#calculateTotals', {
    setup () {
      fakeENV.setup();

      this.screenReaderFlashMessageExclusive = this.stub($, 'screenReaderFlashMessageExclusive');
      $('#fixtures').html('<div class="grade changed"></div>');

      this.currentOrFinal = 'current';
      this.groupWeightingScheme = null;
      this.calculatedGrades = {
        group_sums: [
          {
            group: {
              id: '1',
              rules: {},
              group_weight: 0,
              assignments: [
                {
                  id: '4',
                  submission_types: ['none'],
                  points_possible: 10,
                  due_at: '2017-01-03T06:59:00Z',
                  omit_from_final_grade: false
                }, {
                  id: '3',
                  submission_types: ['none'],
                  points_possible: 10,
                  due_at: '2016-12-26T06:59:00Z',
                  omit_from_final_grade: false
                }
              ]
            },
            current: {
              possible: 0,
              score: 0,
              submission_count: 0,
              submissions: [
                {
                  percent: 0,
                  possible: 10,
                  score: 0,
                  submission: {
                    assignment_id: '4',
                    score: null,
                    excused: false,
                    workflow_state: 'unsubmitted'
                  },
                  submitted: false
                },
                {
                  percent: 0,
                  possible: 10,
                  score: 0,
                  submission: {
                    assignment_id: '3',
                    score: null,
                    excused: false,
                    workflow_state: 'unsubmitted'
                  },
                  submitted: false
                }
              ],
              weight: 0
            },
            final: {
              possible: 20,
              score: 0,
              submission_count: 0,
              submissions: [
                {
                  percent: 0,
                  possible: 10,
                  score: 0,
                  submission: {
                    assignment_id: '4',
                    score: null,
                    excused: false,
                    workflow_state: 'unsubmitted'
                  },
                  submitted: false
                },
                {
                  percent: 0,
                  possible: 10,
                  score: 0,
                  submission: {
                    assignment_id: '3',
                    score: null,
                    excused: false,
                    workflow_state: 'unsubmitted'
                  },
                  submitted: false
                }
              ],
              weight: 0
            }
          }
        ],
        current: {
          score: 0,
          possible: 0
        },
        final: {
          score: 0,
          possible: 20
        }
      };
    },

    teardown () {
      fakeENV.teardown();
    }
  });

  test('generates a screenreader-only alert when grades have been changed', function () {
    grade_summary.calculateTotals(this.calculatedGrades, this.currentOrFinal, this.groupWeightingScheme);

    ok(this.screenReaderFlashMessageExclusive.calledOnce);
  });

  test('does not generate a screenreader-only alert when grades are unchanged', function () {
    $('#fixtures').html('');
    grade_summary.calculateTotals(this.calculatedGrades, this.currentOrFinal, this.groupWeightingScheme);

    notOk(this.screenReaderFlashMessageExclusive.called);
  });

  module('grade_summary.listAssignmentGroupsForGradeCalculation', {
    setup () {
      fakeENV.setup();
      ENV.assignment_groups = createAssignmentGroups();
    },

    teardown () {
      fakeENV.teardown();
    }
  });

  test('excludes muted assignments when no "What-If" grades exist', function () {
    const assignmentGroups = grade_summary.listAssignmentGroupsForGradeCalculation();
    equal(assignmentGroups.length, 2);
    equal(assignmentGroups[0].assignments.length, 1);
    equal(assignmentGroups[1].assignments.length, 0);
  });

  test('includes muted assignments where "What-If" grades exist', function () {
    grade_summary.addWhatIfAssignment('203');
    let assignmentGroups = grade_summary.listAssignmentGroupsForGradeCalculation();
    equal(assignmentGroups[0].assignments.length, 1);
    equal(assignmentGroups[1].assignments.length, 1);
    grade_summary.addWhatIfAssignment('202');
    assignmentGroups = grade_summary.listAssignmentGroupsForGradeCalculation();
    equal(assignmentGroups[0].assignments.length, 2);
    equal(assignmentGroups[1].assignments.length, 1);
  });

  test('excludes muted assignments previously with "What-If" grades', function () {
    grade_summary.addWhatIfAssignment('202');
    grade_summary.addWhatIfAssignment('203');
    let assignmentGroups = grade_summary.listAssignmentGroupsForGradeCalculation();
    equal(assignmentGroups[0].assignments.length, 2);
    equal(assignmentGroups[1].assignments.length, 1);
    grade_summary.removeWhatIfAssignment('202');
    assignmentGroups = grade_summary.listAssignmentGroupsForGradeCalculation();
    equal(assignmentGroups[0].assignments.length, 1);
    equal(assignmentGroups[1].assignments.length, 1);
  });

  module('grade_summary.calculateGrades', {
    setup () {
      fakeENV.setup();
      ENV.submissions = createSubmissions();
      ENV.assignment_groups = createAssignmentGroups();
      ENV.group_weighting_scheme = 'points';
      ENV.grading_periods = [{ id: 701, weight: 50 }, { id: 702, weight: 50 }];
      ENV.effective_due_dates = { 201: { 101: { grading_period_id: '701' } } };
      ENV.student_id = '101';
      this.stub(CourseGradeCalculator, 'calculate').returns('expected');
    },

    teardown () {
      fakeENV.teardown();
    }
  });

  test('calculates grades using data in the env', function () {
    this.stub(CourseGradeCalculator, 'calculate').returns('expected');
    grade_summary.calculateGrades();
    const args = CourseGradeCalculator.calculate.getCall(0).args;
    equal(args[0], ENV.submissions);
    deepEqual(_.map(args[1], 'id'), ['301', '302']);
    equal(args[2], ENV.group_weighting_scheme);
    equal(args[3], ENV.grading_periods);
  });

  test('returns the result of grade calculation from the grade calculator', function () {
    const grades = grade_summary.calculateGrades();
    equal(grades, 'expected');
  });

  test('scopes effective due dates to the user', function () {
    this.stub(CourseGradeCalculator, 'calculate');
    grade_summary.calculateGrades();
    const dueDates = CourseGradeCalculator.calculate.getCall(0).args[4];
    deepEqual(dueDates, { 201: { grading_period_id: '701' } });
  });

  test('calculates grades without grading period data when effective due dates are not defined', function () {
    delete ENV.effective_due_dates;
    this.stub(CourseGradeCalculator, 'calculate');
    grade_summary.calculateGrades();
    const args = CourseGradeCalculator.calculate.getCall(0).args;
    equal(args[0], ENV.submissions);
    equal(args[1], ENV.assignment_groups);
    equal(args[2], ENV.group_weighting_scheme);
    equal(args[3], undefined);
    equal(args[4], undefined);
  });

  test('includes muted assignments where "What-If" grades exist', function () {
    grade_summary.addWhatIfAssignment('202');
    grade_summary.addWhatIfAssignment('203');
    grade_summary.calculateGrades();
    const assignmentGroups = CourseGradeCalculator.calculate.getCall(0).args[1];
    equal(assignmentGroups[0].assignments.length, 2);
    equal(assignmentGroups[1].assignments.length, 1);
  });
});
