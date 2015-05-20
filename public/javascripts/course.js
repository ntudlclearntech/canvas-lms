/**
 * Copyright (C) 2011 Instructure, Inc.
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
  'i18n!courses',
  'jquery' /* $ */
], function(I18n, $) {
  $(document).ready(function() {
    $(".reject_button").click(function(event) {
      var result = confirm(I18n.t('confirm_reject_invitation', "Are you sure you want to reject the invitation to participate in this course?"));
      if(!result) {
        event.preventDefault();
        event.stopPropagation();
      }
    });

    // new styles only - show and hide the courses vertical menu when the user clicks the hamburger button
    $("#courseMenuToggle").click(function() {
      $("body").toggleClass("course-menu-expanded");
    });
  });
});

