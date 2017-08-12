/*
 * Copyright (C) 2017 - present Instructure, Inc.
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

import { createGradebook } from 'spec/jsx/gradezilla/default_gradebook/GradebookSpecHelper';
import StudentCellFormatter from 'jsx/gradezilla/default_gradebook/slick-grid/formatters/StudentCellFormatter';

QUnit.module('StudentCellFormatter', function (hooks) {
  let $fixture;
  let gradebook;
  let formatter;
  let student;

  hooks.beforeEach(function () {
    $fixture = document.createElement('div');
    document.body.appendChild($fixture);

    gradebook = createGradebook({});
    formatter = new StudentCellFormatter(gradebook);

    gradebook.setSections([
      { id: '2001', name: 'Freshmen' },
      { id: '2002', name: 'Sophomores' },
      { id: '2003', name: 'Juniors' },
      { id: '2004', name: 'Seniors' }
    ]);

    student = {
      enrollments: [{ grades: { html_url: 'http://example.com/grades/1101' } }],
      id: '1101',
      isConcluded: false,
      isInactive: false,
      login_id: 'adam.jones@example.com',
      name: 'Adam Jones',
      sections: ['2001', '2003', '2004'],
      sis_user_id: 'sis_student_1101',
      sortable_name: 'Jones, Adam'
    };
  });

  hooks.afterEach(function () {
    $fixture.remove();
  });

  function renderCell () {
    $fixture.innerHTML = formatter.render(
      0, // row
      0, // cell
      null, // value
      null, // column definition
      student // dataContext
    );
    return $fixture;
  }

  QUnit.module('#render with a placeholder student');

  test('renders no content', function () {
    student = { isPlaceholder: true };
    strictEqual(renderCell().innerHTML, '');
  });

  QUnit.module('#render with an active student');

  test('includes a link to the student grades', function () {
    const expectedUrl = 'http://example.com/grades/1101#tab-assignments';
    equal(renderCell().querySelector('.student-grades-link').href, expectedUrl);
  });

  test('renders the student name when displaying names as "first, last"', function () {
    equal(renderCell().querySelector('.student-grades-link').innerHTML, 'Adam Jones');
  });

  test('does not escape html in the student name when displaying names as "first, last"', function () {
    // student names have already been escaped
    student.name = '&lt;span&gt;Adam Jones&lt;/span&gt;';
    equal(renderCell().querySelector('.student-grades-link').innerHTML, '&lt;span&gt;Adam Jones&lt;/span&gt;');
  });

  test('renders the sortable name when displaying names as "last, first"', function () {
    gradebook.setSelectedPrimaryInfo('last_first', true); // skipRedraw
    equal(renderCell().querySelector('.student-grades-link').innerHTML, 'Jones, Adam');
  });

  test('does not escape html in the student name when displaying names as "last, first"', function () {
    // student names have already been escaped
    gradebook.setSelectedPrimaryInfo('last_first', true); // skipRedraw
    student.sortable_name = '&lt;span&gt;Jones, Adam&lt;/span&gt;';
    equal(renderCell().querySelector('.student-grades-link').innerHTML, '&lt;span&gt;Jones, Adam&lt;/span&gt;');
  });

  test('does not render an enrollment status label', function () {
    strictEqual(renderCell().querySelector('.label'), null);
  });

  test('renders section names when secondary info is "section"', function () {
    gradebook.setSelectedSecondaryInfo('section', true); // skipRedraw
    equal(renderCell().querySelector('.secondary-info').innerHTML, 'Freshmen, Juniors, and Seniors');
  });

  test('does not escape html in the section names', function () {
    //  section names have already been escaped
    gradebook.sections[2001].name = '&lt;span&gt;Freshmen&lt;/span&gt;';
    gradebook.setSelectedSecondaryInfo('section', true); // skipRedraw
    equal(renderCell().querySelector('.secondary-info').innerHTML,
      '&lt;span&gt;Freshmen&lt;/span&gt;, Juniors, and Seniors');
  });

  test('does not render section names when sections should not be visible', function () {
    gradebook.setSections([]);
    gradebook.setSelectedSecondaryInfo('section', true); // skipRedraw
    strictEqual(renderCell().querySelector('.secondary-info'), null);
  });

  test('renders the student login id when secondary info is "login_in"', function () {
    gradebook.setSelectedSecondaryInfo('login_id', true); // skipRedraw
    equal(renderCell().querySelector('.secondary-info').innerHTML, 'adam.jones@example.com');
  });

  test('renders the student SIS user id when secondary info is "sis_id"', function () {
    gradebook.setSelectedSecondaryInfo('sis_id', true); // skipRedraw
    equal(renderCell().querySelector('.secondary-info').innerHTML, 'sis_student_1101');
  });

  test('does not render secondary info when secondary info is "none"', function () {
    gradebook.setSelectedSecondaryInfo('none', true); // skipRedraw
    strictEqual(renderCell().querySelector('.secondary-info'), null);
  });

  QUnit.module('#render with an inactive student');

  test('renders the "inactive" status label', function () {
    student.isInactive = true;
    equal(renderCell().querySelector('.label').innerHTML, 'inactive');
  });

  QUnit.module('#render with an concluded student');

  test('renders the "concluded" status label', function () {
    student.isConcluded = true;
    equal(renderCell().querySelector('.label').innerHTML, 'concluded');
  });
});
