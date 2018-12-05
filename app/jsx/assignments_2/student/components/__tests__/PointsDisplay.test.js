/*
 * Copyright (C) 2018 - present Instructure, Inc.
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
import React from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'

import PointsDisplay from '../PointsDisplay'

beforeAll(() => {
  const found = document.getElementById('fixtures')
  if (!found) {
    const fixtures = document.createElement('div')
    fixtures.setAttribute('id', 'fixtures')
    document.body.appendChild(fixtures)
  }
})

afterEach(() => {
  ReactDOM.unmountComponentAtNode(document.getElementById('fixtures'))
})

it('throws an error if displayAs prop is not valid', () => {
  // Suppress console output for expected thrown errors. See this for details:
  // https://github.com/facebook/react/issues/11098
  jest.spyOn(console, 'error')
  global.console.error.mockImplementation(() => {})

  expect(() => {
    ReactDOM.render(
      <PointsDisplay displayAs="banana" possiblePoints={32} />,
      document.getElementById('fixtures')
    )
  }).toThrow(new Error(`Invalid displayAs option "banana"`))

  global.console.error.mockRestore()
})

it('renders points correctly when no receivedGrade are set', () => {
  ReactDOM.render(
    <PointsDisplay displayAs="points" possiblePoints={32} />,
    document.getElementById('fixtures')
  )
  const textElement = $('[data-test-id="points-display"]')
  expect(textElement.text()).toEqual('-/32')
})

it('renders points correctly when receivedGrade is set', () => {
  ReactDOM.render(
    <PointsDisplay displayAs="points" receivedGrade={4} possiblePoints={5} />,
    document.getElementById('fixtures')
  )
  const textElement = $('[data-test-id="points-display"]')
  expect(textElement.text()).toEqual('4/5')
})

it('renders correctly when receivedGrade is 0', () => {
  ReactDOM.render(
    <PointsDisplay receivedGrade={0} possiblePoints={5} />,
    document.getElementById('fixtures')
  )
  const textElement = $('[data-test-id="points-display"]')
  expect(textElement.text()).toEqual('0/5')
})

it('defaults to using points if displayAs is not explictly set', () => {
  ReactDOM.render(
    <PointsDisplay receivedGrade={4} possiblePoints={5} />,
    document.getElementById('fixtures')
  )
  const textElement = $('[data-test-id="points-display"]')
  expect(textElement.text()).toEqual('4/5')
})

it('renders correctly when displayType is percent', () => {
  ReactDOM.render(
    <PointsDisplay receivedGrade="15%" possiblePoints={5} displayAs="percent" />,
    document.getElementById('fixtures')
  )
  const textElement = $('[data-test-id="points-display"]')
  expect(textElement.text()).toEqual('15%')
})

it('renders percent correctly when no receivedGrade are set', () => {
  ReactDOM.render(
    <PointsDisplay possiblePoints={5} displayAs="percent" />,
    document.getElementById('fixtures')
  )
  const textElement = $('[data-test-id="points-display"]')
  expect(textElement.text()).toEqual('-%')
})

it('renders points possible when displayAs is grading scheme', () => {
  ReactDOM.render(
    <PointsDisplay receivedGrade={4} possiblePoints={5} displayAs="pass_fail" />,
    document.getElementById('fixtures')
  )
  const textElement = $('[data-test-id="points-possible-display"]')
  expect(textElement.text()).toEqual('5 Points Possible')
})

it('renders Points Possible when displayAs is pass fail', () => {
  ReactDOM.render(
    <PointsDisplay receivedGrade={4} possiblePoints={5} displayAs="gpa_scale" />,
    document.getElementById('fixtures')
  )
  const textElement = $('[data-test-id="points-possible-display"]')
  expect(textElement.text()).toEqual('5 Points Possible')
})

it('renders Points Possible when displayAs is letter grade', () => {
  ReactDOM.render(
    <PointsDisplay receivedGrade={4} possiblePoints={5} displayAs="letter_grade" />,
    document.getElementById('fixtures')
  )
  const textElement = $('[data-test-id="points-possible-display"]')
  expect(textElement.text()).toEqual('5 Points Possible')
})
