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

const FETCH_HISTORY_START = 'FETCH_HISTORY_START';
const FETCH_HISTORY_SUCCESS = 'FETCH_HISTORY_SUCCESS';
const FETCH_HISTORY_FAILURE = 'FETCH_HISTORY_FAILURE';
const FETCH_HISTORY_NEXT_PAGE_START = 'FETCH_HISTORY_NEXT_PAGE_START';
const FETCH_HISTORY_NEXT_PAGE_SUCCESS = 'FETCH_HISTORY_NEXT_PAGE_SUCCESS';
const FETCH_HISTORY_NEXT_PAGE_FAILURE = 'FETCH_HISTORY_NEXT_PAGE_FAILURE';

function fetchHistoryStart () {
  return {
    type: FETCH_HISTORY_START
  };
}

function fetchHistorySuccess ({ events, linked: { users }}, { link }) {
  return {
    type: FETCH_HISTORY_SUCCESS,
    payload: { events, users, link }
  };
}

function fetchHistoryFailure () {
  return {
    type: FETCH_HISTORY_FAILURE
  };
}

function fetchHistoryNextPageStart () {
  return {
    type: FETCH_HISTORY_NEXT_PAGE_START
  };
}

function fetchHistoryNextPageSuccess ({ events, linked: { users }}, { link }) {
  return {
    type: FETCH_HISTORY_NEXT_PAGE_SUCCESS,
    payload: { events, users, link }
  };
}

function fetchHistoryNextPageFailure () {
  return {
    type: FETCH_HISTORY_NEXT_PAGE_FAILURE
  };
}

export default {
  FETCH_HISTORY_START,
  FETCH_HISTORY_SUCCESS,
  FETCH_HISTORY_FAILURE,
  FETCH_HISTORY_NEXT_PAGE_START,
  FETCH_HISTORY_NEXT_PAGE_SUCCESS,
  FETCH_HISTORY_NEXT_PAGE_FAILURE,
  fetchHistoryStart,
  fetchHistorySuccess,
  fetchHistoryFailure,
  fetchHistoryNextPageStart,
  fetchHistoryNextPageSuccess,
  fetchHistoryNextPageFailure
};
