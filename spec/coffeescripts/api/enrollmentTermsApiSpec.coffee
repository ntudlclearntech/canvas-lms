#
# Copyright (C) 2016 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.

define [
  'jquery',
  'helpers/fakeENV',
  'compiled/api/enrollmentTermsApi',
  'jquery.ajaxJSON'
], ($, fakeENV, api) ->
  deserializedTerms = [
    {
      id: "1",
      name: "Fall 2013 - Art",
      startAt: new Date("2013-06-03T02:57:42Z"),
      endAt: new Date("2013-12-03T02:57:53Z"),
      createdAt: new Date("2015-10-27T16:51:41Z"),
      gradingPeriodGroupId: "2"
    },{
      id: "3",
      name: null,
      startAt: new Date("2014-01-03T02:58:36Z"),
      endAt: new Date("2014-03-03T02:58:42Z"),
      createdAt: new Date("2013-06-02T17:29:19Z"),
      gradingPeriodGroupId: "2"
    },{
      id: "4",
      name: null,
      startAt: null,
      endAt: null,
      createdAt: new Date("2014-05-02T17:29:19Z"),
      gradingPeriodGroupId: "1"
    }
  ]

  serializedTerms = {
    enrollment_terms: [
      {
        id: 1,
        name: "Fall 2013 - Art",
        start_at: "2013-06-03T02:57:42Z",
        end_at: "2013-12-03T02:57:53Z",
        created_at: "2015-10-27T16:51:41Z",
        grading_period_group_id: 2
      },{
        id: 3,
        name: null,
        start_at: "2014-01-03T02:58:36Z",
        end_at: "2014-03-03T02:58:42Z",
        created_at: "2013-06-02T17:29:19Z",
        grading_period_group_id: 2
      },{
        id: 4,
        name: null,
        start_at: null,
        end_at: null,
        created_at: "2014-05-02T17:29:19Z",
        grading_period_group_id: 1
      }
    ]
  }

  QUnit.module "list",
    setup: ->
      @server = sinon.fakeServer.create()
      @fakeHeaders = '<http://some_url?page=1&per_page=10>; rel="last"'
      fakeENV.setup()
      ENV.ENROLLMENT_TERMS_URL = 'api/enrollment_terms'
    teardown: ->
      fakeENV.teardown()
      @server.restore()

  test "calls the resolved endpoint", ->
    @stub($, 'ajaxJSON')
    api.list()
    ok $.ajaxJSON.calledWith('api/enrollment_terms')

  test "deserializes returned enrollment terms", (assert) ->
    start = assert.async()
    @server.respondWith "GET", /enrollment_terms/, [200, {"Content-Type":"application/json", "Link": @fakeHeaders}, JSON.stringify serializedTerms]
    api.list()
       .then (terms) =>
          deepEqual terms, deserializedTerms
          start()
    @server.respond()

  test "rejects the promise upon errors", (assert) ->
    start = assert.async()
    @server.respondWith "GET", /enrollment_terms/, [404, {"Content-Type":"application/json"}, "FAIL"]
    api.list().catch (error) =>
      ok "we got here"
      start()
    @server.respond()
