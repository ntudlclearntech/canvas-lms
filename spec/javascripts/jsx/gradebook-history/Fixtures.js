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

let idCounter = 0;

function historyEvent () {
  return {
    created_at: '2017-05-30T23:16:59Z',
    event_type: 'grade_change',
    excused_after: false,
    excused_before: false,
    grade_after: 21,
    grade_before: 19,
    graded_anonymously: false,
    id: `fa399876-979e-43c6-93ad-${++idCounter}ef5a41e3ccf`,
    links: {
      assignment: 1,
      course: 1,
      grader: 1,
      page_view: null,
      student: idCounter
    }
  }
}

function historyEventArray () {
  return [historyEvent(), historyEvent(), historyEvent()];
}

function user () {
  return {
    id: `${++idCounter}`,
    name: `User #${idCounter}`
  }
}

function userArray () {
  return [
    user(), user(), user()
  ]
}

function userMap () {
  const user1 = user();
  const user2 = user();
  const user3 = user();
  const map = {};
  map[`${user1.id}`] = user1.name;
  map[`${user2.id}`] = user2.name;
  map[`${user3.id}`] = user3.name;

  return map;
}

function payload () {
  return {
    events: historyEventArray(),
    users: userArray(),
    link: '<http://fake.url/3?&page=first>; rel="current",<http://fake.url/3?&page=bookmark:asdf>; rel="next"'
  }
}

function response () {
  return {
    data: {
      events: historyEventArray(),
      linked: {
        assignments: [],
        courses: [],
        page_views: [],
        users: userArray()
      },
      links: {}
    },
    headers: {
      'content-type': 'application/json; charset=utf-8',
      date: 'Thu, 01 Jun 2017 00:09:21 GMT',
      link: '<http://fake.url/3?&page=first>; rel="current",<http://fake.url/3?&page=bookmark:asdf>; rel="next"',
      status: '304 Not Modified'
    }
  }
}

function timeFrame () {
  return {
    from: '2017-05-22T00:00:00-05:00',
    to: '2017-05-22T00:00:00-05:00'
  };
}

export default {
  historyEvent,
  historyEventArray,
  payload,
  response,
  timeFrame,
  user,
  userArray,
  userMap
};
