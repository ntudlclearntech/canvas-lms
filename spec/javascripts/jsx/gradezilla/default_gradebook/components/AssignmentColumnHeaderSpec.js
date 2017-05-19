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
import AssignmentColumnHeader from 'jsx/gradezilla/default_gradebook/components/AssignmentColumnHeader';
import CurveGradesDialogManager from 'jsx/gradezilla/default_gradebook/CurveGradesDialogManager';
import AssignmentMuterDialogManager from 'jsx/gradezilla/shared/AssignmentMuterDialogManager';
import SetDefaultGradeDialogManager from 'jsx/gradezilla/shared/SetDefaultGradeDialogManager';
import { findFlyoutMenuContent, findMenuItem } from './helpers/columnHeaderHelpers';

function createAssignmentProp ({ assignment } = {}) {
  return {
    courseId: '42',
    htmlUrl: 'http://assignment_htmlUrl',
    id: '1',
    invalid: false,
    muted: false,
    name: 'Assignment #1',
    omitFromFinalGrade: false,
    pointsPossible: 13,
    published: true,
    submissionTypes: ['online_text_entry'],
    ...assignment
  };
}

function createStudentsProp () {
  return [
    {
      id: '11',
      name: 'Clark Kent',
      isInactive: false,
      submission: {
        score: 7,
        submittedAt: null
      }
    },
    {
      id: '13',
      name: 'Barry Allen',
      isInactive: false,
      submission: {
        score: 8,
        submittedAt: new Date('Thu Feb 02 2017 16:33:19 GMT-0500 (EST)')
      }
    },
    {
      id: '15',
      name: 'Bruce Wayne',
      isInactive: false,
      submission: {
        score: undefined,
        submittedAt: undefined
      }
    }
  ];
}

function defaultProps ({ props, sortBySetting, assignment, curveGradesAction } = {}) {
  return {
    assignment: createAssignmentProp({ assignment }),
    assignmentDetailsAction: {
      disabled: false,
      onSelect () {},
    },
    curveGradesAction: {
      isDisabled: false,
      onSelect () {},
      ...curveGradesAction
    },
    downloadSubmissionsAction: {
      hidden: false,
      onSelect () {}
    },
    muteAssignmentAction: {
      disabled: false,
      onSelect () {}
    },
    reuploadSubmissionsAction: {
      hidden: false,
      onSelect () {}
    },
    setDefaultGradeAction: {
      disabled: false,
      onSelect () {}
    },
    sortBySetting: {
      direction: 'ascending',
      disabled: false,
      isSortColumn: true,
      onSortByGradeAscending: sinon.stub(),
      onSortByGradeDescending: sinon.stub(),
      onSortByLate: sinon.stub(),
      onSortByMissing: sinon.stub(),
      onSortByUnposted: sinon.stub(),
      settingKey: 'grade',
      ...sortBySetting
    },
    students: createStudentsProp(),
    submissionsLoaded: true,
    addGradebookElement () {},
    removeGradebookElement () {},
    onMenuClose () {},
    ...props
  };
}

function mountComponent (props, mountOptions = {}) {
  return mount(<AssignmentColumnHeader {...props} />, mountOptions);
}

function mountAndOpenOptions (props, mountOptions = {}) {
  const wrapper = mountComponent(props, mountOptions);
  wrapper.find('.Gradebook__ColumnHeaderAction').simulate('click');
  return wrapper;
}

QUnit.module('AssignmentColumnHeader', {
  setup () {
    this.props = defaultProps({
      props: {
        addGradebookElement: this.stub(),
        removeGradebookElement: this.stub(),
        onMenuClose: this.stub()
      }
    });
    this.wrapper = mountComponent(this.props);
  },

  teardown () {
    this.wrapper.unmount();
  }
});

test('renders the assignment name in a link', function () {
  const link = this.wrapper.find('.assignment-name Link');

  equal(link.length, 1);
  equal(link.text().trim(), 'Assignment #1');
  equal(link.props().href, 'http://assignment_htmlUrl');
});

test('renders the points possible', function () {
  const pointsPossible = this.wrapper.find('.assignment-points-possible');

  equal(pointsPossible.length, 1);
  equal(pointsPossible.text().trim(), 'Out of 13');
});

test('renders a PopoverMenu', function () {
  const optionsMenu = this.wrapper.find('PopoverMenu');

  equal(optionsMenu.length, 1);
});

test('does not render a PopoverMenu if assignment is not published', function () {
  const props = defaultProps({ assignment: { published: false } });
  const wrapper = mountComponent(props);
  const optionsMenu = wrapper.find('PopoverMenu');
  equal(optionsMenu.length, 0);
});

test('renders a PopoverMenu with a trigger', function () {
  const optionsMenuTrigger = this.wrapper.find('PopoverMenu .Gradebook__ColumnHeaderAction');

  equal(optionsMenuTrigger.length, 1);
});

test('calls addGradebookElement prop on open', function () {
  this.wrapper.find('.Gradebook__ColumnHeaderAction').simulate('click');

  strictEqual(this.props.addGradebookElement.callCount, 1);
});

test('calls removeGradebookElement prop on close', function () {
  this.wrapper.find('.Gradebook__ColumnHeaderAction').simulate('click');
  this.wrapper.find('.Gradebook__ColumnHeaderAction').simulate('click');

  strictEqual(this.props.removeGradebookElement.callCount, 1);
});

test('calls onMenuClose prop on close', function () {
  this.wrapper.find('.Gradebook__ColumnHeaderAction').simulate('click');
  this.wrapper.find('.Gradebook__ColumnHeaderAction').simulate('click');

  strictEqual(this.props.onMenuClose.callCount, 1);
});

test('adds a class to the trigger when the PopoverMenu is opened', function () {
  const optionsMenuTrigger = this.wrapper.find('PopoverMenu .Gradebook__ColumnHeaderAction');
  optionsMenuTrigger.simulate('click');

  ok(optionsMenuTrigger.hasClass('menuShown'));
});

test('renders a title for the More icon based on the assignment name', function () {
  const optionsMenuTrigger = this.wrapper.find('PopoverMenu IconMoreSolid');

  equal(optionsMenuTrigger.props().title, 'Assignment #1 Options');
});

QUnit.module('AssignmentColumnHeader: Sort by Settings', {
  setup () {
    this.mountAndOpenOptions = mountAndOpenOptions;
  },

  openSortByMenu (wrapper) {
    const menuContent = new ReactWrapper([wrapper.node.optionsMenuContent], wrapper.node);
    const flyout = menuContent.find('MenuItemFlyout');
    flyout.find('button').simulate('mouseOver');
    return new ReactWrapper([wrapper.node.sortByMenuContent], wrapper.node);
  },

  teardown () {
    this.wrapper.unmount();
  }
});

test('sort by does not allow multiple selects', function () {
  const flyout = findFlyoutMenuContent.call(this, defaultProps(), 'Sort by');
  strictEqual(flyout.find('MenuItemGroup').prop('allowMultiple'), false);
});

test('selects "Grade - Low to High" when sorting by grade ascending', function () {
  const props = defaultProps({ sortBySetting: { direction: 'ascending' } });
  const menuItem = findMenuItem.call(this, props, 'Sort by', 'Grade - Low to High');
  strictEqual(menuItem.prop('selected'), true);
});

test('does not select "Grade - Low to High" when isSortColumn is false', function () {
  const props = defaultProps({ sortBySetting: { isSortColumn: false } });
  const menuItem = findMenuItem.call(this, props, 'Sort by', 'Grade - Low to High');
  strictEqual(menuItem.prop('selected'), false);
});

test('clicking "Grade - Low to High" calls onSortByGradeAscending', function () {
  const onSortByGradeAscending = this.stub();
  const props = defaultProps({ sortBySetting: { onSortByGradeAscending } });
  findMenuItem.call(this, props, 'Sort by', 'Grade - Low to High').simulate('click');
  strictEqual(onSortByGradeAscending.callCount, 1);
});

test('"Grade - Low to High" is optionally disabled', function () {
  const props = defaultProps({ sortBySetting: { disabled: true } });
  const menuItem = findMenuItem.call(this, props, 'Sort by', 'Grade - Low to High');
  strictEqual(menuItem.prop('disabled'), true);
});

test('selects "Grade - High to Low" when sorting by grade descending', function () {
  const props = defaultProps({ sortBySetting: { direction: 'descending' } });
  const menuItem = findMenuItem.call(this, props, 'Sort by', 'Grade - High to Low');
  strictEqual(menuItem.prop('selected'), true);
});

test('does not select "Grade - High to Low" when isSortColumn is false', function () {
  const props = defaultProps({ sortBySetting: { isSortColumn: false } });
  const menuItem = findMenuItem.call(this, props, 'Sort by', 'Grade - High to Low');
  strictEqual(menuItem.prop('selected'), false);
});

test('clicking "Grade - High to Low" calls onSortByGradeDescending', function () {
  const onSortByGradeDescending = this.stub();
  const props = defaultProps({ sortBySetting: { onSortByGradeDescending } });
  findMenuItem.call(this, props, 'Sort by', 'Grade - High to Low').simulate('click');
  strictEqual(onSortByGradeDescending.callCount, 1);
});

test('"Grade - High to Low" is optionally disabled', function () {
  const props = defaultProps({ sortBySetting: { disabled: true } });
  const menuItem = findMenuItem.call(this, props, 'Sort by', 'Grade - High to Low');
  strictEqual(menuItem.prop('disabled'), true);
});

test('selects "Missing" when sorting by missing', function () {
  const props = defaultProps({ sortBySetting: { settingKey: 'missing' } });
  const menuItem = findMenuItem.call(this, props, 'Sort by', 'Missing');
  strictEqual(menuItem.prop('selected'), true);
});

test('does not select "Missing" when isSortColumn is false', function () {
  const props = defaultProps({ sortBySetting: { settingKey: 'missing', isSortColumn: false } });
  const menuItem = findMenuItem.call(this, props, 'Sort by', 'Grade - High to Low');
  strictEqual(menuItem.prop('selected'), false);
});

test('clicking "Missing" calls onSortByMissing', function () {
  const onSortByMissing = this.stub();
  const props = defaultProps({ sortBySetting: { onSortByMissing } });
  findMenuItem.call(this, props, 'Sort by', 'Missing').simulate('click');
  strictEqual(onSortByMissing.callCount, 1);
});

test('"Missing" is optionally disabled', function () {
  const props = defaultProps({ sortBySetting: { disabled: true } });
  const menuItem = findMenuItem.call(this, props, 'Sort by', 'Missing');
  strictEqual(menuItem.prop('disabled'), true);
});

test('selects "Late" when sorting by late', function () {
  const props = defaultProps({ sortBySetting: { settingKey: 'late' } });
  const menuItem = findMenuItem.call(this, props, 'Sort by', 'Late');
  strictEqual(menuItem.prop('selected'), true);
});

test('does not select "Late" when isSortColumn is false', function () {
  const props = defaultProps({ sortBySetting: { settingKey: 'late', isSortColumn: false } });
  const menuItem = findMenuItem.call(this, props, 'Sort by', 'Grade - High to Low');
  strictEqual(menuItem.prop('selected'), false);
});

test('clicking "Late" calls onSortByLate', function () {
  const onSortByLate = this.stub();
  const props = defaultProps({ sortBySetting: { onSortByLate } });
  findMenuItem.call(this, props, 'Sort by', 'Late').simulate('click');
  strictEqual(onSortByLate.callCount, 1);
});

test('"Late" is optionally disabled', function () {
  const props = defaultProps({ sortBySetting: { disabled: true } });
  const menuItem = findMenuItem.call(this, props, 'Sort by', 'Late');
  strictEqual(menuItem.prop('disabled'), true);
});

test('selects "Unposted" when sorting by unposted', function () {
  const props = defaultProps({ sortBySetting: { settingKey: 'unposted' } });
  const menuItem = findMenuItem.call(this, props, 'Sort by', 'Unposted');
  strictEqual(menuItem.prop('selected'), true);
});

test('does not select "Unposted" when isSortColumn is false', function () {
  const props = defaultProps({ sortBySetting: { settingKey: 'unposted', isSortColumn: false } });
  const menuItem = findMenuItem.call(this, props, 'Sort by', 'Grade - High to Low');
  strictEqual(menuItem.prop('selected'), false);
});

test('clicking "Unposted" calls onSortByUnposted', function () {
  const onSortByUnposted = this.stub();
  const props = defaultProps({ sortBySetting: { onSortByUnposted } });
  findMenuItem.call(this, props, 'Sort by', 'Unposted').simulate('click');
  strictEqual(onSortByUnposted.callCount, 1);
});

test('"Unposted" is optionally disabled', function () {
  const props = defaultProps({ sortBySetting: { disabled: true } });
  const menuItem = findMenuItem.call(this, props, 'Sort by', 'Unposted');
  strictEqual(menuItem.prop('disabled'), true);
});

QUnit.module('AssignmentColumnHeader: Curve Grades Dialog', {
  teardown () {
    this.wrapper.unmount();
  }
});

test('menu item is present in the popover menu', function () {
  this.wrapper = mountAndOpenOptions(defaultProps());
  const menuItem = document.querySelector('[data-menu-item-id="curve-grades"]');
  equal(menuItem.textContent, 'Curve Grades');
  notOk(menuItem.parentElement.parentElement.parentElement.getAttribute('aria-disabled'));
});

test('Curve Grades menu item is disabled when isDisabled is true', function () {
  const props = defaultProps({ curveGradesAction: { isDisabled: true } });
  this.wrapper = mountAndOpenOptions(props);
  const menuItem = document.querySelector('[data-menu-item-id="curve-grades"]');
  ok(menuItem.parentElement.parentElement.parentElement.getAttribute('aria-disabled'));
});

test('Curve Grades menu item is enabled when isDisabled is false', function () {
  this.wrapper = mountAndOpenOptions(defaultProps());
  const menuItem = document.querySelector('[data-menu-item-id="curve-grades"]');
  notOk(menuItem.parentElement.parentElement.parentElement.getAttribute('aria-disabled'));
});

test('onSelect is called when menu item is clicked', function () {
  const onSelect = this.stub();
  const props = defaultProps({ curveGradesAction: { onSelect } });
  this.wrapper = mountAndOpenOptions(props);
  const menuItem = document.querySelector('[data-menu-item-id="curve-grades"]');
  menuItem.click();
  equal(onSelect.callCount, 1);
});

test('the Curve Grades dialog has focus when it is invoked', function () {
  const props = defaultProps();
  const curveGradesActionOptions = {
    isAdmin: true,
    contextUrl: 'http://contextUrl',
    submissionsLoaded: true
  };
  const curveGradesProps = CurveGradesDialogManager.createCurveGradesAction(
    props.assignment, props.students, curveGradesActionOptions
  );

  props.curveGradesAction.onSelect = curveGradesProps.onSelect;
  this.wrapper = mountAndOpenOptions(props, { attachTo: document.querySelector('#fixtures') });

  const specificMenuItem = document.querySelector('[data-menu-item-id="curve-grades"]');
  specificMenuItem.click();

  const allDialogCloseButtons = document.querySelectorAll('.ui-dialog-titlebar-close.ui-state-focus');
  const dialogCloseButton = allDialogCloseButtons[allDialogCloseButtons.length - 1];

  equal(document.activeElement, dialogCloseButton);

  dialogCloseButton.click();
});

QUnit.module('AssignmentColumnHeader: Message Students Who Action', {
  setup () {
    this.props = defaultProps();
  },

  teardown () {
    this.wrapper.unmount();
  }
});

test('shows the menu item in an enabled state', function () {
  this.wrapper = mountAndOpenOptions(this.props);

  const menuItem = document.querySelector('[data-menu-item-id="message-students-who"]');

  equal(menuItem.textContent, 'Message Students Who');
  notOk(menuItem.parentElement.parentElement.parentElement.getAttribute('aria-disabled'));
});

test('disables the menu item when submissions are not loaded', function () {
  this.props.submissionsLoaded = false;
  this.wrapper = mountAndOpenOptions(this.props);

  const menuItem = document.querySelector('[data-menu-item-id="message-students-who"]');

  equal(menuItem.parentElement.parentElement.parentElement.getAttribute('aria-disabled'), 'true');
});

test('clicking the menu item invokes the Message Students Who dialog', function () {
  this.wrapper = mountAndOpenOptions(this.props);
  this.stub(window, 'messageStudents');

  const menuItem = document.querySelector('[data-menu-item-id="message-students-who"]');
  menuItem.click();

  equal(window.messageStudents.callCount, 1);
});

QUnit.module('AssignmentColumnHeader: Mute/Unmute Assignment Action', {
  setup () {
    this.props = defaultProps();
  },

  teardown () {
    this.wrapper.unmount();
  }
});

test('shows the enabled "Mute Assignment" option when assignment is not muted', function () {
  this.wrapper = mountAndOpenOptions(this.props);

  const specificMenuItem = document.querySelector('[data-menu-item-id="assignment-muter"]');

  equal(specificMenuItem.textContent, 'Mute Assignment');
  notOk(specificMenuItem.parentElement.parentElement.parentElement.getAttribute('aria-disabled'));
});

test('shows the enabled "Unmute Assignment" option when assignment is muted', function () {
  this.props.assignment.muted = true;
  this.wrapper = mountAndOpenOptions(this.props);

  const specificMenuItem = document.querySelector('[data-menu-item-id="assignment-muter"]');

  equal(specificMenuItem.textContent, 'Unmute Assignment');
  notOk(specificMenuItem.parentElement.parentElement.parentElement.getAttribute('aria-disabled'));
});

test('disables the option when prop muteAssignmentAction.disabled is truthy', function () {
  this.props.muteAssignmentAction.disabled = true;
  this.wrapper = mountAndOpenOptions(this.props);

  const specificMenuItem = document.querySelector('[data-menu-item-id="assignment-muter"]');

  equal(specificMenuItem.parentElement.parentElement.parentElement.getAttribute('aria-disabled'), 'true');
});

test('clicking the option invokes prop muteAssignmentAction.onSelect', function () {
  this.props.muteAssignmentAction.onSelect = this.stub();
  this.wrapper = mountAndOpenOptions(this.props);

  const specificMenuItem = document.querySelector('[data-menu-item-id="assignment-muter"]');
  specificMenuItem.click();

  equal(this.props.muteAssignmentAction.onSelect.callCount, 1);
});

test('the Assignment Muting dialog has focus when it is invoked', function () {
  const dialogManager = new AssignmentMuterDialogManager(this.props.assignment, 'http://url', true);

  this.props.muteAssignmentAction.onSelect = dialogManager.showDialog;
  this.wrapper = mountAndOpenOptions(this.props, { attachTo: document.querySelector('#fixtures') });

  const specificMenuItem = document.querySelector('[data-menu-item-id="assignment-muter"]');
  specificMenuItem.click();

  const allDialogCloseButtons = document.querySelectorAll('.ui-dialog-titlebar-close.ui-state-focus');
  const dialogCloseButton = allDialogCloseButtons[allDialogCloseButtons.length - 1];

  equal(document.activeElement, dialogCloseButton);

  dialogCloseButton.click();
});

QUnit.module('AssignmentColumnHeader: non-standard assignment', {
  setup () {
    this.props = defaultProps();
  },

  teardown () {
    this.wrapper.unmount();
  }
});

test('renders 0 points possible when the assignment has no possible points', function () {
  this.props.assignment.pointsPossible = undefined;
  this.wrapper = mountComponent(this.props);
  const pointsPossible = this.wrapper.find('.assignment-points-possible');

  equal(pointsPossible.length, 1);
  equal(pointsPossible.text().trim(), 'Out of 0');
});

test('renders a muted icon when the assignment is muted', function () {
  this.props.assignment.muted = true;
  this.wrapper = mountComponent(this.props);
  const link = this.wrapper.find('.assignment-name Link');
  const icon = link.find('IconMutedSolid');
  const expectedLinkTitle = 'This assignment is muted';

  equal(link.length, 1);
  deepEqual(link.props().title, expectedLinkTitle);
  equal(icon.length, 1);
  equal(icon.props().title, expectedLinkTitle);
});

test('renders a warning icon when the assignment does not count towards final grade', function () {
  this.props.assignment.omitFromFinalGrade = true;
  this.wrapper = mountComponent(this.props);
  const link = this.wrapper.find('.assignment-name Link');
  const icon = link.find('IconWarningSolid');
  const expectedLinkTitle = 'This assignment does not count toward the final grade';

  equal(link.length, 1);
  deepEqual(link.props().title, expectedLinkTitle);
  equal(icon.length, 1);
  equal(icon.props().title, expectedLinkTitle);
});

test('renders a warning icon when the assignment is invalid', function () {
  this.props.assignment.invalid = true;
  this.wrapper = mountComponent(this.props);
  const link = this.wrapper.find('.assignment-name Link');
  const icon = link.find('IconWarningSolid');
  const expectedLinkTitle = 'This assignment has no points possible and cannot be included in grade calculation';

  equal(link.length, 1);
  deepEqual(link.props().title, expectedLinkTitle);
  equal(icon.length, 1);
  equal(icon.props().title, expectedLinkTitle);
});

QUnit.module('AssignmentColumnHeader: Set Default Grade Action', {
  setup () {
    this.props = defaultProps();
  },

  teardown () {
    this.wrapper.unmount();
  }
});

test('shows the menu item in an enabled state', function () {
  this.wrapper = mountAndOpenOptions(this.props);

  const specificMenuItem = document.querySelector('[data-menu-item-id="set-default-grade"]');

  equal(specificMenuItem.textContent, 'Set Default Grade');
  strictEqual(specificMenuItem.parentElement.parentElement.parentElement.getAttribute('aria-disabled'), null);
});

test('disables the menu item when the disabled prop is true', function () {
  this.props.setDefaultGradeAction.disabled = true;
  this.wrapper = mountAndOpenOptions(this.props);

  const specificMenuItem = document.querySelector('[data-menu-item-id="set-default-grade"]');

  equal(specificMenuItem.parentElement.parentElement.parentElement.getAttribute('aria-disabled'), 'true');
});

test('clicking the menu item invokes the onSelect handler', function () {
  this.props.setDefaultGradeAction.onSelect = this.stub();
  this.wrapper = mountAndOpenOptions(this.props);

  const specificMenuItem = document.querySelector('[data-menu-item-id="set-default-grade"]');
  specificMenuItem.click();

  equal(this.props.setDefaultGradeAction.onSelect.callCount, 1);
});

test('the Set Default Grade dialog has focus when it is invoked', function () {
  const dialogManager =
    new SetDefaultGradeDialogManager(this.props.assignment, this.props.students, 1, '1', true, true);

  this.props.setDefaultGradeAction.onSelect = dialogManager.showDialog;
  this.wrapper = mountAndOpenOptions(this.props, { attachTo: document.querySelector('#fixtures') });

  const specificMenuItem = document.querySelector('[data-menu-item-id="set-default-grade"]');
  specificMenuItem.click();

  const allDialogCloseButtons = document.querySelectorAll('.ui-dialog-titlebar-close.ui-state-focus');
  const dialogCloseButton = allDialogCloseButtons[allDialogCloseButtons.length - 1];

  equal(document.activeElement, dialogCloseButton);

  dialogCloseButton.click();
});

QUnit.module('AssignmentColumnHeader: Download Submissions Action', {
  setup () {
    this.props = defaultProps();
  },

  teardown () {
    this.wrapper.unmount();
  }
});

test('shows the menu item in an enabled state', function () {
  this.wrapper = mountAndOpenOptions(this.props);

  const specificMenuItem = document.querySelector('[data-menu-item-id="download-submissions"]');

  equal(specificMenuItem.textContent, 'Download Submissions');
  notOk(specificMenuItem.parentElement.parentElement.parentElement.getAttribute('aria-disabled'));
});

test('does not render the menu item when the hidden prop is true', function () {
  this.props.downloadSubmissionsAction.hidden = true;
  this.wrapper = mountAndOpenOptions(this.props);

  const specificMenuItem = document.querySelector('[data-menu-item-id="download-submissions"]');

  equal(specificMenuItem, null);
});

test('clicking the menu item invokes the onSelect handler', function () {
  this.props.downloadSubmissionsAction.onSelect = this.stub();
  this.wrapper = mountAndOpenOptions(this.props);

  const specificMenuItem = document.querySelector('[data-menu-item-id="download-submissions"]');
  specificMenuItem.click();

  equal(this.props.downloadSubmissionsAction.onSelect.callCount, 1);
});

QUnit.module('AssignmentColumnHeader: Reupload Submissions Action', {
  setup () {
    this.props = defaultProps();
  },

  teardown () {
    this.wrapper.unmount();
  }
});

test('shows the menu item in an enabled state', function () {
  this.wrapper = mountAndOpenOptions(this.props);

  const specificMenuItem = document.querySelector('[data-menu-item-id="reupload-submissions"]');

  equal(specificMenuItem.textContent, 'Re-Upload Submissions');
  strictEqual(specificMenuItem.parentElement.getAttribute('aria-disabled'), null);
});

test('does not render the menu item when the hidden prop is true', function () {
  this.props.reuploadSubmissionsAction.hidden = true;
  this.wrapper = mountAndOpenOptions(this.props);

  const specificMenuItem = document.querySelector('[data-menu-item-id="reupload-submissions"]');

  equal(specificMenuItem, null);
});

test('clicking the menu item invokes the onSelect property', function () {
  this.props.reuploadSubmissionsAction.onSelect = this.stub();
  this.wrapper = mountAndOpenOptions(this.props);

  const specificMenuItem = document.querySelector('[data-menu-item-id="reupload-submissions"]');
  specificMenuItem.click();

  equal(this.props.reuploadSubmissionsAction.onSelect.callCount, 1);
});

QUnit.module('AssignmentColumnHeader#handleKeyDown', function (hooks) {
  hooks.beforeEach(function () {
    this.wrapper = mountComponent(defaultProps(), { attachTo: document.querySelector('#fixtures') });
    this.preventDefault = sinon.spy();
  });

  hooks.afterEach(function () {
    this.wrapper.unmount();
  });

  this.handleKeyDown = function (which, shiftKey = false) {
    return this.wrapper.node.handleKeyDown({ which, shiftKey, preventDefault: this.preventDefault });
  };

  QUnit.module('with focus on assignment link', {
    setup () {
      this.wrapper.node.assignmentLink.focus();
    }
  });

  test('Tab sets focus on options menu trigger', function () {
    this.handleKeyDown(9, false); // Tab
    equal(document.activeElement, this.wrapper.node.optionsMenuTrigger);
  });

  test('prevents default behavior for Tab', function () {
    this.handleKeyDown(9, false); // Tab
    strictEqual(this.preventDefault.callCount, 1);
  });

  test('returns false for Tab', function () {
    // This prevents additional behavior in Grid Support Navigation.
    const returnValue = this.handleKeyDown(9, false); // Tab
    strictEqual(returnValue, false);
  });

  test('does not handle Shift+Tab', function () {
    // This allows Grid Support Navigation to handle navigation.
    const returnValue = this.handleKeyDown(9, true); // Shift+Tab
    equal(typeof returnValue, 'undefined');
  });

  QUnit.module('with focus on options menu trigger', {
    setup () {
      this.wrapper.node.optionsMenuTrigger.focus();
    }
  });

  test('Shift+Tab sets focus on assignment link', function () {
    this.handleKeyDown(9, true); // Shift+Tab
    strictEqual(this.wrapper.node.assignmentLink.focused, true);
  });

  test('prevents default behavior for Shift+Tab', function () {
    this.handleKeyDown(9, true); // Shift+Tab
    strictEqual(this.preventDefault.callCount, 1);
  });

  test('returns false for Shift+Tab', function () {
    // This prevents additional behavior in Grid Support Navigation.
    const returnValue = this.handleKeyDown(9, true); // Shift+Tab
    strictEqual(returnValue, false);
  });

  test('does not handle Tab', function () {
    // This allows Grid Support Navigation to handle navigation.
    const returnValue = this.handleKeyDown(9, false); // Tab
    equal(typeof returnValue, 'undefined');
  });

  test('Enter opens the options menu', function () {
    this.handleKeyDown(13); // Enter
    const optionsMenu = this.wrapper.find('PopoverMenu');
    strictEqual(optionsMenu.node.show, true);
  });

  test('returns false for Enter on options menu', function () {
    // This prevents additional behavior in Grid Support Navigation.
    const returnValue = this.handleKeyDown(13); // Enter
    strictEqual(returnValue, false);
  });

  QUnit.module('without focus');

  test('does not handle Tab', function () {
    const returnValue = this.handleKeyDown(9, false); // Tab
    equal(typeof returnValue, 'undefined');
  });

  test('does not handle Shift+Tab', function () {
    const returnValue = this.handleKeyDown(9, true); // Shift+Tab
    equal(typeof returnValue, 'undefined');
  });

  test('does not handle Enter', function () {
    const returnValue = this.handleKeyDown(13); // Enter
    equal(typeof returnValue, 'undefined');
  });
});

QUnit.module('AssignmentColumnHeader: focus', {
  setup () {
    this.wrapper = mountComponent(defaultProps(), { attachTo: document.querySelector('#fixtures') });
  },

  teardown () {
    this.wrapper.unmount();
  }
});

test('#focusAtStart sets focus on the assignment link', function () {
  this.wrapper.node.focusAtStart();
  strictEqual(this.wrapper.node.assignmentLink.focused, true);
});

test('#focusAtEnd sets focus on the options menu trigger', function () {
  this.wrapper.node.focusAtEnd();
  equal(document.activeElement, this.wrapper.node.optionsMenuTrigger);
});
