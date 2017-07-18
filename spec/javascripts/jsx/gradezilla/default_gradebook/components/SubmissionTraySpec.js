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

import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import SubmissionTray from 'jsx/gradezilla/default_gradebook/components/SubmissionTray';

QUnit.module('SubmissionTray', function (hooks) {
  let content;
  let wrapper;

  hooks.afterEach(function () {
    wrapper.unmount();
  });

  function mountComponent (props) {
    const defaultProps = {
      contentRef (ref) {
        content = ref;
      },
      colors: {
        late: '#FEF7E5',
        missing: '#F99',
        excused: '#E5F3FC'
      },
      locale: 'en',
      onRequestClose () {},
      onClose () {},
      showContentComingSoon: false,
      isOpen: true,
      student: { name: 'Jane Doe' },
      submission: {
        grade: '100%',
        excused: false,
        late: false,
        missing: false,
        pointsDeducted: 3,
        secondsLate: 0
      }
    };
    wrapper = mount(<SubmissionTray {...defaultProps} {...props} />);
  }

  function avatarDiv () {
    return document.querySelector('#SubmissionTray__Avatar');
  }

  function studentNameDiv () {
    return document.querySelector('#SubmissionTray__StudentName');
  }

  function wrapContent () {
    return new ReactWrapper(content, wrapper.node);
  }

  function radioInputGroupDiv () {
    return document.querySelector('#SubmissionTray__RadioInputGroup');
  }

  test('shows "Content Coming Soon" content if showContentComingSoon is true', function () {
    const server = sinon.fakeServer.create({ respondImmediately: true });
    server.respondWith('GET', /^\/images\/.*\.svg$/, [
      200, { 'Content-Type': 'img/svg+xml' }, '{}'
    ]);
    mountComponent({ showContentComingSoon: true });
    ok(document.querySelector('.ComingSoonContent__Container'));
    server.restore();
  });

  test('shows avatar if showContentComingSoon is false and avatar is not null', function () {
    const avatarUrl = 'http://bob_is_not_a_domain/me.jpg?filter=make_me_pretty';
    mountComponent({ student: { name: 'Bob', avatarUrl } });
    const avatarBackground = avatarDiv().firstChild.style.getPropertyValue('background-image');
    strictEqual(avatarBackground, `url("${avatarUrl}")`);
  });

  test('shows no avatar if showContentComingSoon is false and avatar is null', function () {
    mountComponent({ student: { name: 'Joe' } });
    notOk(avatarDiv());
  });

  test('shows name if showContentComingSoon is false', function () {
    mountComponent({ student: { name: 'Sara' } });
    strictEqual(studentNameDiv().innerHTML, 'Sara');
  });

  test('shows the late policy grade when points have been deducted', function () {
    mountComponent();
    strictEqual(wrapContent().find('LatePolicyGrade').length, 1);
  });

  test('uses the submission to show the late policy grade', function () {
    mountComponent();
    const latePolicyGrade = wrapContent().find('LatePolicyGrade').at(0);
    equal(latePolicyGrade.prop('submission').grade, '100%');
    strictEqual(latePolicyGrade.prop('submission').pointsDeducted, 3);
  });

  test('does not show the late policy grade when zero points have been deducted', function () {
    mountComponent({ submission: { excused: false, late: true, missing: false, pointsDeducted: 0, secondsLate: 0 } });
    strictEqual(wrapContent().find('LatePolicyGrade').length, 0);
  });

  test('does not show the late policy grade when points deducted is null', function () {
    mountComponent({ submission: { excused: false, late: true, missing: false, pointsDeducted: null, secondsLate: 0 } });
    strictEqual(wrapContent().find('LatePolicyGrade').length, 0);
  });

  test('shows a radio input group if showContentComingSoon is false', function () {
    mountComponent();
    ok(radioInputGroupDiv());
  });

  test('does not show a radio input group if showContentComingSoon is true', function () {
    mountComponent({ showContentComingSoon: true });
    notOk(radioInputGroupDiv());
  });
});

