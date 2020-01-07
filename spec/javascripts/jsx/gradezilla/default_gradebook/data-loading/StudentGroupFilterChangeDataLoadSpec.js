/*
 * Copyright (C) 2019 - present Instructure, Inc.
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

import DataLoader from 'jsx/gradezilla/DataLoader'
import {
  createGradebook,
  setFixtureHtml
} from 'jsx/gradezilla/default_gradebook/__tests__/GradebookSpecHelper'
import {createExampleStudents} from './DataLoadingSpecHelpers'
import DataLoadingWrapper from './DataLoadingWrapper'

QUnit.module('Gradebook Student Group Filter Change Data Loading', suiteHooks => {
  let $container
  let dataLoadingWrapper
  let gradebook
  let gradebookOptions

  let initialData
  let nextData

  suiteHooks.beforeEach(() => {
    $container = document.body.appendChild(document.createElement('div'))
    setFixtureHtml($container)

    initialData = {
      assignmentGroups: [
        {
          assignments: [
            {
              anonymize_students: false,
              anonymous_grading: false,
              assignment_visibility: [],
              course_id: '1201',
              grading_type: 'letter_grade',
              html_url: 'http://canvas/courses/1201/assignments/2301',
              id: '2301',
              muted: false,
              name: 'Math Assignment',
              only_visible_to_overrides: false,
              points_possible: 10,
              published: true,
              submission_types: ['online_text_entry']
            },

            {
              anonymize_students: false,
              anonymous_grading: false,
              assignment_visibility: ['1102', '1104'],
              course_id: '1201',
              grading_type: 'letter_grade',
              html_url: 'http://canvas/courses/1201/assignments/2302',
              id: '2302',
              muted: false,
              name: 'English Assignment',
              only_visible_to_overrides: true,
              points_possible: 5,
              published: false,
              submission_types: ['online_text_entry']
            }
          ],
          id: '2201',
          name: 'Assignments',
          position: 1
        }
      ],

      contextModules: [
        {id: '2601', position: 3, name: 'English'},
        {id: '2602', position: 1, name: 'Math'},
        {id: '2603', position: 2, name: 'Science'}
      ],
      gradingPeriodAssignments: {
        1401: ['2301'],
        1402: ['2302']
      },
      studentIds: ['1101', '1102', '1103'],
      students: createExampleStudents().slice(0, 3)
    }

    nextData = {
      gradingPeriodAssignments: {
        1401: ['2301', '2303'],
        1402: ['2302', '2304']
      },
      studentIds: ['1101', '1102', '1103', '1104'],
      students: createExampleStudents().slice(3)
    }

    gradebookOptions = {
      api_max_per_page: 50,
      assignment_groups_url: '/assignment-groups',
      chunk_size: 10,
      context_id: '1201',
      context_modules_url: '/context-modules',
      custom_column_data_url: '/custom-column-data',
      sections: [
        {id: '2001', name: 'Freshmen'},
        {id: '2002', name: 'Sophomores'}
      ],
      settings: {
        filter_rows_by: {
          section_id: null
        },
        selected_view_options_filters: ['sections', 'studentGroups']
      },
      student_groups: [
        {
          id: '1',
          name: 'Default Set',
          groups: [
            {id: '1', name: 'Default Set 1'},
            {id: '2', name: 'Default Set 2'}
          ]
        },
        {
          id: '2',
          name: 'Alternate Set',
          groups: [
            {id: '3', name: 'Alternate Set 1'},
            {id: '4', name: 'Alternate Set 2'}
          ]
        }
      ],
      students_stateless_url: '/students-url',
      submissions_url: '/submissions-url'
    }

    dataLoadingWrapper = new DataLoadingWrapper()
    dataLoadingWrapper.setup()
  })

  suiteHooks.afterEach(() => {
    gradebook.destroy()
    $container.remove()
    dataLoadingWrapper.teardown()
  })

  function initializeAndLoadGradebook(options = {}) {
    if (options.includeGradingPeriodSet) {
      gradebookOptions.grading_period_set = {
        grading_periods: [
          {id: '1401', startDate: new Date('2015-09-01'), title: 'Q1'},
          {id: '1402', startDate: new Date('2015-10-15'), title: 'Q2'}
        ],
        id: '1301'
      }
    }

    gradebook = createGradebook(gradebookOptions)
    sinon.stub(gradebook, 'saveSettings').callsFake((settings, onSuccess = () => {}) => {
      onSuccess(settings)
    })

    gradebook.initialize()

    // Load Grid Data
    dataLoadingWrapper.loadStudentIds(initialData.studentIds)
    dataLoadingWrapper.loadGradingPeriodAssignments(initialData.gradingPeriodAssignments)
    dataLoadingWrapper.loadAssignmentGroups(initialData.assignmentGroups)
    dataLoadingWrapper.loadContextModules()
    dataLoadingWrapper.loadCustomColumns()

    // Load Student Data
    dataLoadingWrapper.loadStudents(initialData.students)
    dataLoadingWrapper.loadSubmissions([])

    dataLoadingWrapper.finishLoadingStudents()
    dataLoadingWrapper.finishLoadingSubmissions()
    dataLoadingWrapper.finishLoadingCustomColumnData()

    DataLoader.loadGradebookData.resetHistory()
  }

  function changeStudentGroupFilter() {
    gradebook.updateCurrentStudentGroup('3')
  }

  QUnit.module('when the student group filter changes', () => {
    test('sets the students as not loaded', () => {
      initializeAndLoadGradebook()
      changeStudentGroupFilter()
      strictEqual(gradebook.contentLoadStates.studentsLoaded, false)
    })

    test('sets the submissions as not loaded', () => {
      initializeAndLoadGradebook()
      changeStudentGroupFilter()
      strictEqual(gradebook.contentLoadStates.submissionsLoaded, false)
    })

    test('calls DataLoader.loadGradebookData()', () => {
      initializeAndLoadGradebook()
      changeStudentGroupFilter()
      strictEqual(DataLoader.loadGradebookData.callCount, 1)
    })

    QUnit.module('when calling DataLoader.loadGradebookData()', () => {
      test('includes the course id', () => {
        initializeAndLoadGradebook()
        changeStudentGroupFilter()
        const [options] = DataLoader.loadGradebookData.lastCall.args
        equal(options.courseId, '1201')
      })

      test('includes the per page api request setting', () => {
        initializeAndLoadGradebook()
        changeStudentGroupFilter()
        const [options] = DataLoader.loadGradebookData.lastCall.args
        equal(options.perPage, 50)
      })

      test('requests assignment groups', () => {
        initializeAndLoadGradebook()
        changeStudentGroupFilter()
        const [options] = DataLoader.loadGradebookData.lastCall.args
        equal(typeof options.assignmentGroupsURL, 'undefined')
      })

      test('does not request context modules', () => {
        initializeAndLoadGradebook()
        changeStudentGroupFilter()
        const [options] = DataLoader.loadGradebookData.lastCall.args
        equal(typeof options.contextModulesURL, 'undefined')
      })

      test('requests data for hidden custom columns', () => {
        initializeAndLoadGradebook()
        changeStudentGroupFilter()
        const [options] = DataLoader.loadGradebookData.lastCall.args
        strictEqual(options.customColumnDataParams.include_hidden, true)
      })

      test('includes the students url', () => {
        initializeAndLoadGradebook()
        changeStudentGroupFilter()
        const [options] = DataLoader.loadGradebookData.lastCall.args
        equal(options.studentsURL, '/students-url')
      })

      test('includes the students page callback', () => {
        initializeAndLoadGradebook()
        changeStudentGroupFilter()
        const [options] = DataLoader.loadGradebookData.lastCall.args
        strictEqual(options.studentsPageCb, gradebook.gotChunkOfStudents)
      })

      test('includes students params', () => {
        initializeAndLoadGradebook()
        const exampleStudentsParams = {example: true}
        sandbox.stub(gradebook, 'studentsParams').returns(exampleStudentsParams)
        changeStudentGroupFilter()
        const [options] = DataLoader.loadGradebookData.lastCall.args
        equal(options.studentsParams, exampleStudentsParams)
      })

      test('includes the loaded student ids', () => {
        initializeAndLoadGradebook()
        const studentIds = ['1101', '1102', '1103']
        gradebook.courseContent.students.setStudentIds(studentIds)
        changeStudentGroupFilter()
        const [options] = DataLoader.loadGradebookData.lastCall.args
        deepEqual(options.loadedStudentIds, studentIds)
      })

      test('includes the submissions url', () => {
        initializeAndLoadGradebook()
        changeStudentGroupFilter()
        const [options] = DataLoader.loadGradebookData.lastCall.args
        equal(options.submissionsURL, '/submissions-url')
      })

      test('includes the submissions chunk callback', () => {
        initializeAndLoadGradebook()
        changeStudentGroupFilter()
        const [options] = DataLoader.loadGradebookData.lastCall.args
        strictEqual(options.submissionsChunkCb, gradebook.gotSubmissionsChunk)
      })

      test('includes the submissions chunk size', () => {
        initializeAndLoadGradebook()
        changeStudentGroupFilter()
        const [options] = DataLoader.loadGradebookData.lastCall.args
        equal(options.submissionsChunkSize, 10)
      })

      test('includes the stored custom columns', () => {
        initializeAndLoadGradebook()
        gradebook.gotCustomColumns([{id: '2401'}, {id: '2402'}])
        changeStudentGroupFilter()
        const [options] = DataLoader.loadGradebookData.lastCall.args
        deepEqual(options.customColumnIds, ['2401', '2402'])
      })

      test('includes the custom column data url', () => {
        initializeAndLoadGradebook()
        changeStudentGroupFilter()
        const [options] = DataLoader.loadGradebookData.lastCall.args
        equal(options.customColumnDataURL, '/custom-column-data')
      })

      test('includes the custom column data page callback', () => {
        initializeAndLoadGradebook()
        changeStudentGroupFilter()
        const [options] = DataLoader.loadGradebookData.lastCall.args
        strictEqual(options.customColumnDataPageCb, gradebook.gotCustomColumnDataChunk)
      })

      test('does not request grading period assignments', () => {
        initializeAndLoadGradebook({includeGradingPeriodSet: true})
        changeStudentGroupFilter()
        const [options] = DataLoader.loadGradebookData.lastCall.args
        strictEqual(options.getGradingPeriodAssignments, false)
      })
    })

    test('re-renders the filters', () => {
      initializeAndLoadGradebook()
      sandbox.spy(gradebook, 'renderFilters')
      changeStudentGroupFilter()
      strictEqual(gradebook.renderFilters.callCount, 1)
    })

    test('re-renders the filters after students load status is updated', () => {
      initializeAndLoadGradebook()
      sandbox.stub(gradebook, 'renderFilters').callsFake(() => {
        strictEqual(gradebook.contentLoadStates.studentsLoaded, false)
      })
      changeStudentGroupFilter()
    })

    test('re-renders the filters after submissions load status is updated', () => {
      initializeAndLoadGradebook()
      sandbox.stub(gradebook, 'renderFilters').callsFake(() => {
        strictEqual(gradebook.contentLoadStates.submissionsLoaded, false)
      })
      changeStudentGroupFilter()
    })

    QUnit.module('when student ids finish loading', contextHooks => {
      contextHooks.beforeEach(() => {
        initializeAndLoadGradebook()
        changeStudentGroupFilter()
      })

      test('stores the loaded student ids in the Gradebook', () => {
        dataLoadingWrapper.loadStudentIds(nextData.studentIds)
        deepEqual(gradebook.courseContent.students.listStudentIds(), nextData.studentIds)
      })

      test('updates grid rows for the loaded student ids', () => {
        dataLoadingWrapper.loadStudentIds(nextData.studentIds)
        strictEqual(document.body.querySelectorAll('.canvas_0 .slick-row').length, 4)
      })

      test('updates assignment student visibility', () => {
        dataLoadingWrapper.loadStudentIds(nextData.studentIds)
        dataLoadingWrapper.loadStudents(nextData.students)
        const studentIds = Object.keys(gradebook.studentsThatCanSeeAssignment('2302'))
        deepEqual(studentIds, ['1102', '1104'])
      })
    })

    QUnit.module('loading students', hooks => {
      hooks.beforeEach(() => {
        initializeAndLoadGradebook()
        changeStudentGroupFilter()
        dataLoadingWrapper.loadStudentIds(nextData.studentIds)
      })

      QUnit.module('when a chunk of students have loaded', () => {
        test('adds the loaded students to the Gradebook', () => {
          dataLoadingWrapper.loadStudents(nextData.students)
          const studentNames = gradebook.courseContent.students
            .listStudents()
            .map(student => student.name)
          deepEqual(studentNames.sort(), ['Adam Jones', 'Betty Ford', 'Charlie Xi', 'Dana Young'])
        })

        test('updates the rows for loaded students', () => {
          dataLoadingWrapper.loadStudents(nextData.students)
          const $studentNames = document.body.querySelectorAll('.slick-row .student-name')
          const studentNames = [...$studentNames].map($name => $name.textContent.trim())
          deepEqual(studentNames, ['Adam Jones', 'Betty Ford', 'Charlie Xi', 'Dana Young'])
        })
      })

      QUnit.module('when students finish loading', () => {
        test('sets the students as loaded', () => {
          dataLoadingWrapper.finishLoadingStudents()
          strictEqual(gradebook.contentLoadStates.studentsLoaded, true)
        })

        test('re-renders the column headers', () => {
          sinon.spy(gradebook, 'updateColumnHeaders')
          dataLoadingWrapper.finishLoadingStudents()
          strictEqual(gradebook.updateColumnHeaders.callCount, 1)
        })

        test('re-renders the column headers after updating students load state', () => {
          sinon.stub(gradebook, 'updateColumnHeaders').callsFake(() => {
            // students load state was already updated
            strictEqual(gradebook.contentLoadStates.studentsLoaded, true)
          })
          dataLoadingWrapper.finishLoadingStudents()
        })

        test('re-renders the filters', () => {
          sinon.spy(gradebook, 'renderFilters')
          dataLoadingWrapper.finishLoadingStudents()
          strictEqual(gradebook.renderFilters.callCount, 1)
        })

        test('re-renders the filters after updating students load state', () => {
          sinon.stub(gradebook, 'renderFilters').callsFake(() => {
            // students load state was already updated
            strictEqual(gradebook.contentLoadStates.studentsLoaded, true)
          })
          dataLoadingWrapper.finishLoadingStudents()
        })
      })
    })

    QUnit.module('loading submissions', hooks => {
      hooks.beforeEach(() => {
        initializeAndLoadGradebook()
        changeStudentGroupFilter()

        dataLoadingWrapper.loadStudentIds(nextData.studentIds)
        dataLoadingWrapper.loadAssignmentGroups([])
        dataLoadingWrapper.loadContextModules()
        dataLoadingWrapper.loadCustomColumns()
        dataLoadingWrapper.loadStudents(nextData.students)
      })

      QUnit.module('when submissions finish loading', contextHooks => {
        contextHooks.beforeEach(() => {
          dataLoadingWrapper.finishLoadingStudents()
        })

        test('sets the submissions as loaded', () => {
          dataLoadingWrapper.finishLoadingSubmissions()
          strictEqual(gradebook.contentLoadStates.submissionsLoaded, true)
        })

        test('re-renders the column headers', () => {
          sandbox.spy(gradebook, 'updateColumnHeaders')
          dataLoadingWrapper.finishLoadingSubmissions()
          strictEqual(gradebook.updateColumnHeaders.callCount, 1)
        })

        test('re-renders the column headers after updating submissions load state', () => {
          sandbox.stub(gradebook, 'updateColumnHeaders').callsFake(() => {
            // submissions load state was already updated
            strictEqual(gradebook.contentLoadStates.submissionsLoaded, true)
          })
          dataLoadingWrapper.finishLoadingSubmissions()
        })

        test('re-renders the filters', () => {
          sandbox.spy(gradebook, 'renderFilters')
          dataLoadingWrapper.finishLoadingSubmissions()
          strictEqual(gradebook.renderFilters.callCount, 1)
        })

        test('re-renders the filters after updating submissions load state', () => {
          sandbox.stub(gradebook, 'renderFilters').callsFake(() => {
            // submissions load state was already updated
            strictEqual(gradebook.contentLoadStates.submissionsLoaded, true)
          })
          dataLoadingWrapper.finishLoadingSubmissions()
        })
      })
    })
  })
})
