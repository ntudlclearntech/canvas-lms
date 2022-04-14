/*
 * Copyright (C) 2022 - present Instructure, Inc.
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
import {render, fireEvent, waitFor} from '@testing-library/react'

import MultiColor from '../index'
import {actions} from '../../../../../reducers/imageSection'

describe('MultiColor', () => {
  let dispatch, onLoaded

  beforeEach(() => {
    dispatch = jest.fn()
    onLoaded = jest.fn()
  })

  afterEach(() => jest.clearAllMocks())

  const subject = () => render(<MultiColor dispatch={dispatch} onLoaded={onLoaded} />)

  it('renders the multi-color SVG list', () => {
    const {getByTestId} = subject()
    expect(getByTestId('multicolor-svg-list')).toBeInTheDocument()
  })

  describe('when an entry is clicked', () => {
    it('sets the selected image with loading states', async () => {
      const {getByTestId} = subject()

      fireEvent.click(getByTestId('icon-maker-art'))

      expect(dispatch).toHaveBeenNthCalledWith(1, {
        ...actions.START_LOADING
      })

      expect(dispatch).toHaveBeenNthCalledWith(2, {
        ...actions.SET_IMAGE_NAME,
        payload: 'Art Icon'
      })

      // Wait for the async bits to resolve
      await waitFor(() => {
        expect(dispatch).toHaveBeenNthCalledWith(3, {
          ...actions.SET_IMAGE,
          payload: expect.any(String)
        })

        expect(dispatch).toHaveBeenNthCalledWith(4, {
          ...actions.SET_IMAGE_COLLECTION_OPEN,
          payload: false
        })

        expect(dispatch).toHaveBeenNthCalledWith(5, {
          ...actions.STOP_LOADING
        })
      })
    })

    it('converts the selected icon to base64', async () => {
      const {getByTestId} = subject()

      fireEvent.click(getByTestId('icon-maker-art'))

      await waitFor(() => {
        expect(dispatch.mock.calls[2][0].payload).toMatchInlineSnapshot(
          `"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgwIiBoZWlnaHQ9IjQ4MCIgdmlld0JveD0iMCAwIDQ4MCA0ODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICAgIDxwYXRoIGQ9Ik0xMzIuNDMyIDE2Ny41NDJDMTM1LjY5OSAxNTguNDA1IDEzNS4wMTggMTQ3LjgzOSAxMjkuNzM2IDEzOC42OUMxMjIuNTAxIDEyNi4xNjEgMTEwLjU2MyAxMjUuNzA5IDEwMC41NCAxMjUuMzNDMTAwLjI0IDEyNS4zMTkgOTkuOTQxIDEyNS4zMDcgOTkuNjQ0MiAxMjUuMjk2Qzk0LjMyMDggMTI1LjA4OCA4OS41NDI4IDEyNC44MzMgODUuMjcxOSAxMjMuMzQzQzgxLjE4MDEgMTIxLjkxNiA3Ny40NzcxIDExOS4zMTggNzQuNDgwOCAxMTQuMTI4QzczLjU0NzcgMTEyLjUxMiA3MS40ODA5IDExMS45NTggNjkuODY0NyAxMTIuODkxQzYwLjc5NDMgMTE4LjEyOCA1OC4zNzg5IDEyNy45MDggNTkuNTYxMiAxMzguMzM1QzYwLjc0MzIgMTQ4Ljc1OSA2NS41NDE2IDE2MC43MDMgNzIuMDU4NSAxNzEuOTlDNzYuNzQ2NyAxODAuMTEgODQuMjEzNyAxODUuNjUgOTIuNTA4MiAxODguMDA5QzEwOS44NzggMjIzLjIyMyAxMzYuODAyIDI3Ny4xMTQgMTYzLjA4NyAzMjAuMzlDMTc2LjM4MiAzNDIuMjc5IDE4OS42MiAzNjEuNjMxIDIwMS40NjQgMzc0LjQ4OEMyMDcuMzY3IDM4MC44OTYgMjEzLjEwOSAzODUuODk3IDIxOC41MSAzODguNzMxQzIyMy45MzIgMzkxLjU3NyAyMjkuNjEyIDM5Mi41MTQgMjM0LjY3NyAzODkuNTlDMjM5LjcwMSAzODYuNjg5IDI0MS43MzkgMzgxLjM2MiAyNDIuMDExIDM3NS4zMDVDMjQyLjI4MiAzNjkuMjc2IDI0MC44NjggMzYxLjg4OSAyMzguMzI4IDM1My42NzFDMjMzLjIzMyAzMzcuMTg0IDIyMy4yNjUgMzE2LjI4OSAyMTEuMTI1IDI5NC4wNTVDMTg3LjE5NCAyNTAuMjI3IDE1NC40MjMgMjAwLjQ4NCAxMzIuNDMyIDE2Ny41NDJaIiBmaWxsPSJibGFjayIvPgogICAgICA8cGF0aCBkPSJNMjIyLjAwMyAzODMuOTg3QzI1MS4wMTYgMzY3LjIzNiAxNjEuNTgzIDIzMS4wMzUgMTE3LjU5NiAxNjUuMTg0QzExNC4xMzYgMTcxLjIxIDEwMi41NSAxODMuMTA3IDgzLjg4ODkgMTgyLjQ4OEMxMTguNTg2IDI1Mi44NjMgMTkyLjc2IDQwMC44NzEgMjIyLjAwMyAzODMuOTg3WiIgZmlsbD0id2hpdGUiLz4KICAgICAgPHBhdGggZD0iTTEwMS4xMTMgMjEzLjgxNkMxMTQuMjIyIDIxMS4xMzQgMTI2LjAyNyAyMDQuMzk3IDEzNC45MDUgMTk0LjM4NkMxMzMuMjE2IDE4OC40NzIgMTI1LjYxMyAxNzguMzM0IDExNy4xNjQgMTY1LjY2MkMxMDkuMDU0IDE3OC41MDMgOTYuODg4OSAxODUuMDkzIDgzLjM3MTQgMTgwLjg2OUwxMDEuMTEzIDIxMy44MTZaIiBmaWxsPSIjNTBDMEZGIi8+CiAgICAgIDxwYXRoIGQ9Ik02My4xNDU4IDE2NS4yMzFDNTAuMzUwNyAxNDMuMDcgNDkuNDg3NyAxMTUuOTI5IDY0LjI5NDUgMTA3LjM4Qzc3Ljk3MjUgMTMxLjA3MSAxMDIuMTc1IDExMy4xNDkgMTE0Ljk3IDEzNS4zMTFDMTIzLjQ2OCAxNTAuMDMgMTE4Ljc1NiAxNjguNjYxIDEwNC40NDUgMTc2LjkyM0M5MC4xMzQ3IDE4NS4xODYgNzEuNjQ0MiAxNzkuOTUxIDYzLjE0NTggMTY1LjIzMVoiIGZpbGw9IndoaXRlIi8+CiAgICAgIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTEyLjA1MyAxMzdDMTE5LjY2NCAxNTAuMTgyIDExNS4zODMgMTY2LjcxMiAxMDIuNzY2IDE3My45OTdDOTAuMTQ4NiAxODEuMjgxIDczLjY5MjkgMTc2LjcyMyA2Ni4wODI0IDE2My41NDJDNjQuNDE0NiAxNjAuNjUzIDYyLjk2MjUgMTU3LjY4MiA2MS43MzI1IDE1NC42ODhDNzQuOTc5NCAxNTcuMTYzIDc2LjM4ODMgMTUwLjI0IDc4LjAyMzYgMTQyLjIwNEM3OS4zMjE0IDEzNS44MjcgODAuNzYxNyAxMjguNzUgODguMzc1IDEyNS4xMTNDODguNzYyIDEyNS4xNjYgODkuMTQ1NyAxMjUuMjE3IDg5LjUyNTYgMTI1LjI2OEw4OS43OTE5IDEyNS4zMDRDOTQuNDc0NCAxMjUuOTI5IDk4LjU1OTUgMTI2LjQ3NSAxMDIuMjc0IDEyOC4wNDJDMTA1Ljg5MiAxMjkuNTY5IDEwOS4yMzEgMTMyLjExMiAxMTIuMDUzIDEzN1pNMTIwLjMzNSAxNjMuMTk1QzEyMy45MDIgMTUzLjg5NSAxMjMuMzI4IDE0My4wMTIgMTE3LjkwNiAxMzMuNjIxQzExNC4zMzEgMTI3LjQyOSAxMDkuODQ2IDEyMy45MDIgMTA0LjkwMSAxMjEuODE1QzEwMC4zMzMgMTE5Ljg4OCA5NS40NDAzIDExOS4yMzcgOTEuMDMwMyAxMTguNjVMOTAuNDIxMSAxMTguNTY5Qzg1LjY5MDYgMTE3LjkzNyA4MS40NjU0IDExNy4zMDcgNzcuNTkyNyAxMTUuNTQ2QzczLjg1MjMgMTEzLjg0NSA3MC4zMDQzIDExMS4wMTMgNjcuMjMxMSAxMDUuNjlDNjYuMjk4IDEwNC4wNzQgNjQuMjMxMyAxMDMuNTIgNjIuNjE1IDEwNC40NTNDNTMuNzIwMiAxMDkuNTg5IDUwLjAzNzkgMTE5Ljk5MSA1MC4wMDAzIDEzMS4xODlDNDkuOTYyMyAxNDIuNDg4IDUzLjU3NDUgMTU1LjM5NCA2MC4yMjk0IDE2Ni45MjFDNjQuODkxNiAxNzQuOTk2IDcyLjMwMjEgMTgwLjUxOSA4MC41NDE2IDE4Mi45QzgwLjU4NzIgMTgzLjI3MSA4MC42OTQ2IDE4My42MzYgODAuODY0NyAxODMuOTgxQzk4LjIwNzIgMjE5LjE1NyAxMjUuNDg2IDI3My44OCAxNTIuMTEgMzE3LjcxM0MxNjUuNDA1IDMzOS42MDIgMTc4LjY0MyAzNTguOTU0IDE5MC40ODYgMzcxLjgxMUMxOTYuMzkgMzc4LjIxOSAyMDIuMTMxIDM4My4yMiAyMDcuNTMyIDM4Ni4wNTRDMjEyLjk1NCAzODguOSAyMTguNjM0IDM4OS44MzcgMjIzLjcgMzg2LjkxM0MyMjguNzI0IDM4NC4wMTIgMjMwLjc2MSAzNzguNjg1IDIzMS4wMzQgMzcyLjYyOEMyMzEuMzA1IDM2Ni41OTkgMjI5Ljg5IDM1OS4yMTIgMjI3LjM1MSAzNTAuOTk0QzIyMi4yNTYgMzM0LjUwNyAyMTIuMjg4IDMxMy42MTIgMjAwLjE0NyAyOTEuMzc4QzE3NS44MzYgMjQ2Ljg1MyAxNDIuNCAxOTYuMjIyIDEyMC40MTMgMTYzLjMwNkMxMjAuMzg4IDE2My4yNjggMTIwLjM2MiAxNjMuMjMxIDEyMC4zMzUgMTYzLjE5NVpNODkuNzk4MiAxODUuNjYyQzkwLjE5MDMgMTg1LjYyMSA5MC41NzkgMTg1LjU3NiA5MC45NjQzIDE4NS41MjZDMTAxLjI0NyAxODUuNzE2IDExMC4zMTkgMTgwLjMwNSAxMTcuMTA5IDE3MS42MjJDMTE4LjA4NCAxNzMuMDYxIDExOS4wMzIgMTc0LjQ0OSAxMTkuOTQ5IDE3NS43OTJMMTE5Ljk1IDE3NS43OTNMMTE5Ljk1NCAxNzUuOEwxMTkuOTU1IDE3NS44MDFDMTIyLjA2NSAxNzguODkyIDEyNC4wMSAxODEuNzQyIDEyNS43NDcgMTg0LjQwNEMxMjguMjY1IDE4OC4yNjYgMTMwLjA1NyAxOTEuMzE4IDEzMS4wNDEgMTkzLjYwOEMxMjMuMzk3IDIwMS42NTYgMTEzLjY2MyAyMDcuMjc0IDEwMi44NzkgMjA5Ljk1NEw4OS43OTgyIDE4NS42NjJaTTEwNC42MTggMjE2LjQ4NkMxMTYuNDUyIDIxMy41MjQgMTI3LjE3MyAyMDcuMzc0IDEzNS42NDYgMTk4LjU3MkMxNTQuODQgMjI3LjkzOCAxNzYuODggMjYyLjg2OCAxOTQuMjE2IDI5NC42MTdDMjA2LjMwNSAzMTYuNzU4IDIxNi4wMDUgMzM3LjE3IDIyMC44OTMgMzUyLjk5QzIyMy4zNDUgMzYwLjkyNSAyMjQuNTAxIDM2Ny40NDEgMjI0LjI4MiAzNzIuMzI0QzIyNC4wNjQgMzc3LjE3OSAyMjIuNTUgMzc5Ljc3MyAyMjAuMzIgMzgxLjA2QzIxOC4wNzUgMzgyLjM1NiAyMTUuMDQgMzgyLjM2MiAyMTAuNjczIDM4MC4wN0MyMDYuMjg0IDM3Ny43NjcgMjAxLjE2MiAzNzMuNDI1IDE5NS40NTcgMzY3LjIzMkMxODQuMDg0IDM1NC44ODYgMTcxLjEyNyAzMzYuMDA0IDE1Ny44ODYgMzE0LjIwNEMxMzkuMjU3IDI4My41MzQgMTIwLjI3NyAyNDcuNDQ1IDEwNC42MTggMjE2LjQ4NloiIGZpbGw9ImJsYWNrIi8+CiAgICAgIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjY5LjUwOCAxNDYuNzE4QzMxNC44NTggMTE0LjAyNCAzNzguMTM5IDEyNC4yNzEgNDEwLjg2MiAxNjkuNjA4QzQ0My41NzIgMjE0Ljk3IDQzMy4zMjUgMjc4LjI2MSAzODcuOTcxIDMxMC45NzNDMzY1LjQ4OSAzMjcuMTg5IDMzNC4xMjQgMzIyLjEwOSAzMTcuOSAyOTkuNjI3TDI4OC4wMzQgMjU4LjIwOEMyODYuOTI2IDI1Ni42NyAyODUuNjkgMjU2LjExOSAyODQuNTg4IDI1Ni4wMTNDMjgzLjQgMjU1Ljg5OCAyODIuMDcyIDI1Ni4yNzggMjgwLjkyNSAyNTcuMTFDMjc5Ljc3NyAyNTcuOTQzIDI3OC45OTcgMjU5LjA5MiAyNzguNzMgMjYwLjI2NkMyNzguNDgyIDI2MS4zNTcgMjc4LjYxOCAyNjIuNjk3IDI3OS43MSAyNjQuMjA4TDI3OS43MTQgMjY0LjIxMkMyODYuMjk1IDI3My4zNSAyODQuMjI5IDI4Ni4wODQgMjc1LjEwNSAyOTIuNjkyTDI3NS4xIDI5Mi42OTVDMjY1Ljk2MiAyOTkuMjg2IDI1My4yMDYgMjk3LjIyIDI0Ni42MTUgMjg4LjA4M0MyMTMuOTAzIDI0Mi43MjkgMjI0LjE1MyAxNzkuNDM4IDI2OS41MDggMTQ2LjcxOFoiIGZpbGw9ImJsYWNrIi8+CiAgICAgIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjM0Ljc5MiAyODAuNTc4QzIwMy4xNzEgMjM2LjczOCAyMTMuMDc4IDE3NS41NiAyNTYuOTIgMTQzLjkzMUMzMDAuNzU3IDExMi4zMjggMzYxLjkyNiAxMjIuMjM0IDM5My41NTggMTY2LjA1OEM0MjUuMTc2IDIwOS45MDYgNDE1LjI3IDI3MS4wODQgMzcxLjQzIDMwMi43MDRDMzUwLjQ2MSAzMTcuODI4IDMyMS4yMDggMzEzLjA5MSAzMDYuMDc2IDI5Mi4xMjFMMjc2LjIxMSAyNTAuNzA0QzI2OS42MTUgMjQxLjU0OSAyNTUuODUgMjUxLjU4OCAyNjIuNDA3IDI2MC42NTlDMjY3Ljg5OCAyNjguMjgyIDI2Ni4xNzcgMjc4LjkxIDI1OC41NTkgMjg0LjQyN0MyNTAuOTM1IDI4OS45MjYgMjQwLjI5IDI4OC4yMDIgMjM0Ljc5MiAyODAuNTc4WiIgZmlsbD0id2hpdGUiLz4KICAgICAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yNTguODk2IDE0Ni42NzJDMzAxLjIyIDExNi4xNjEgMzYwLjI3NyAxMjUuNzI0IDM5MC44MTYgMTY4LjAzNVpNMzkwLjgxNiAxNjguMDM1QzQyMS4zNDQgMjEwLjM3IDQxMS43NzkgMjY5LjQzNiAzNjkuNDUzIDI5OS45NjRDMzQ5Ljk5OSAzMTMuOTk1IDMyMi44NTggMzA5LjYwMSAzMDguODE3IDI5MC4xNDVMMjc4Ljk1MiAyNDguNzI5QzI3Ni43NjIgMjQ1LjY4OSAyNzMuODAzIDI0NC4wNjEgMjcwLjY3NCAyNDMuNzU4QzI2Ny42MzEgMjQzLjQ2NCAyNjQuNjkxIDI0NC40NDQgMjYyLjM5MiAyNDYuMTExQzI2MC4wOTQgMjQ3Ljc3OCAyNTguMjUxIDI1MC4yNjcgMjU3LjU3NSAyNTMuMjQxQzI1Ni44OCAyNTYuMjk3IDI1Ny40ODIgMjU5LjYxMyAyNTkuNjY3IDI2Mi42MzdDMjY0LjA2NCAyNjguNzQ1IDI2Mi42ODggMjc3LjI2MyAyNTYuNTc3IDI4MS42ODlDMjUwLjQ2NyAyODYuMDkzIDI0MS45MzggMjg0LjcxIDIzNy41MzIgMjc4LjYwMUMyMDcuMDA0IDIzNi4yNzYgMjE2LjU2OSAxNzcuMjA5IDI1OC44OTYgMTQ2LjY3Mk0yNTQuOTQzIDE0MS4xOUMzMDAuMjk0IDEwOC40OTYgMzYzLjU3NSAxMTguNzQ0IDM5Ni4yOTggMTY0LjA4QzQyOS4wMDggMjA5LjQ0MiA0MTguNzYgMjcyLjczMyAzNzMuNDA2IDMwNS40NDVDMzUwLjkyNCAzMjEuNjYxIDMxOS41NTkgMzE2LjU4MSAzMDMuMzM2IDI5NC4wOTlMMjczLjQ2OSAyNTIuNjgxQzI3Mi4zNjEgMjUxLjE0MyAyNzEuMTI2IDI1MC41OTIgMjcwLjAyNCAyNTAuNDg1QzI2OC44MzUgMjUwLjM3IDI2Ny41MDggMjUwLjc1IDI2Ni4zNiAyNTEuNTgyQzI2NS4yMTMgMjUyLjQxNSAyNjQuNDMyIDI1My41NjQgMjY0LjE2NSAyNTQuNzM5QzI2My45MTcgMjU1LjgyOSAyNjQuMDUzIDI1Ny4xNjkgMjY1LjE0NiAyNTguNjhMMjY1LjE0OSAyNTguNjg1QzI3MS43MzEgMjY3LjgyMiAyNjkuNjY0IDI4MC41NTcgMjYwLjU0MSAyODcuMTY0TDI2MC41MzUgMjg3LjE2OEMyNTEuMzk4IDI5My43NTggMjM4LjY0MSAyOTEuNjkzIDIzMi4wNTEgMjgyLjU1NUMxOTkuMzM5IDIzNy4yMDEgMjA5LjU4OSAxNzMuOTExIDI1NC45NDMgMTQxLjE5WiIgZmlsbD0iYmxhY2siLz4KICAgICAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0zNjQuMDExIDE5Ny44NTlDMzU4LjMgMjAxLjk3OCAzNTAuMzE5IDIwMC42ODYgMzQ2LjE5MiAxOTQuOTc0QzM0Mi4wNjMgMTg5LjI3IDM0My4zNTggMTgxLjI3MiAzNDkuMDc2IDE3Ny4xNjNDMzU0Ljc5OCAxNzMuMDI5IDM2Mi43NzkgMTc0LjMyMSAzNjYuODk1IDE4MC4wNDlDMzcxLjAyNCAxODUuNzUyIDM2OS43MjggMTkzLjc1IDM2NC4wMTEgMTk3Ljg1OVoiIGZpbGw9IiM0NUNFNDIiLz4KICAgICAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0zNjQuMTU0IDE4Mi4wMkMzNjEuMTMxIDE3Ny44MTMgMzU1LjI2NyAxNzYuODYxIDM1MS4wNTggMTc5LjkwMkwzNTEuMDUxIDE3OS45MDdMMzUxLjA1MSAxNzkuOTA3QzM0Ni44NTMgMTgyLjkyNCAzNDUuOTAxIDE4OC44MDQgMzQ4LjkzMiAxOTIuOTkyTDM0OC45MzQgMTkyLjk5NEMzNTEuOTcgMTk3LjE5NyAzNTcuODQxIDE5OC4xNDQgMzYyLjAzNyAxOTUuMTE4TDM2Mi4wNDIgMTk1LjExNUMzNjYuMjQgMTkyLjA5NyAzNjcuMTkyIDE4Ni4yMTggMzY0LjE2MSAxODIuMDNMMzY0LjE1NCAxODIuMDJMMzY0LjE1NCAxODIuMDJaTTM2OS42MzkgMTc4LjA3MUMzNjQuNDMgMTcwLjgyOSAzNTQuMzM3IDE2OS4xOTggMzQ3LjEwMyAxNzQuNDIxQzMzOS44NyAxNzkuNjIyIDMzOC4yMzMgMTg5LjczNiAzNDMuNDU3IDE5Ni45NTRDMzQ4LjY3NCAyMDQuMTczIDM1OC43NjEgMjA1LjgxIDM2NS45ODYgMjAwLjYwM0MzNzMuMjIxIDE5NS40MDMgMzc0Ljg2IDE4NS4yOSAzNjkuNjM5IDE3OC4wNzFaIiBmaWxsPSJibGFjayIvPgogICAgICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTM2Ni4wODMgMjM3LjgxOEMzNjMuMzMgMjM0LjAwMSAzNjQuMTkgMjI4LjY5MSAzNjguMDA2IDIyNS45MzhDMzcxLjgyMiAyMjMuMTk0IDM3Ny4xMzEgMjI0LjA1MyAzNzkuODg2IDIyNy44NjJDMzgyLjYzOSAyMzEuNjc5IDM4MS43NzkgMjM2Ljk4OCAzNzcuOTYyIDIzOS43NDFDMzc0LjE0NSAyNDIuNDk0IDM2OC44MzYgMjQxLjYzNCAzNjYuMDgzIDIzNy44MThaIiBmaWxsPSIjRkY2QTZBIi8+CiAgICAgIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzc3LjE0OSAyMjkuODRDMzc1LjQ4NyAyMjcuNTQ0IDM3Mi4yODcgMjI3LjAyNiAzNjkuOTg0IDIyOC42OEMzNjcuNjgzIDIzMC4zNDIgMzY3LjE2NiAyMzMuNTM4IDM2OC44MjcgMjM1Ljg0MUMzNzAuNDg4IDIzOC4xNDQgMzczLjY4NSAyMzguNjYyIDM3NS45ODggMjM3LjAwMUMzNzguMjkxIDIzNS4zNCAzNzguODA5IDIzMi4xNDMgMzc3LjE0OSAyMjkuODRaTTM2Ni4wMzYgMjIzLjE5NUMzNzEuMzY0IDIxOS4zNjMgMzc4Ljc4MSAyMjAuNTY0IDM4Mi42MjcgMjI1Ljg4MkwzODIuNjMgMjI1Ljg4NUMzODYuNDc0IDIzMS4yMTYgMzg1LjI3MiAyMzguNjM4IDM3OS45NDIgMjQyLjQ4MkMzNzQuNjExIDI0Ni4zMjcgMzY3LjE5IDI0NS4xMjUgMzYzLjM0NSAyMzkuNzk1QzM1OS41IDIzNC40NjQgMzYwLjcwMiAyMjcuMDQyIDM2Ni4wMzMgMjIzLjE5OEwzNjYuMDM2IDIyMy4xOTVaIiBmaWxsPSJibGFjayIvPgogICAgICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMzMS4wNjkgMjU0LjE3N0MzNDAuMTM5IDI0Ny42MzUgMzUyLjgyMyAyNDkuNjg4IDM1OS4zNjQgMjU4Ljc1N0MzNjUuOTEzIDI2Ny44MzYgMzYzLjg1OCAyODAuNTIgMzU0Ljc3OCAyODcuMDY4QzM0NS43MDggMjkzLjYxIDMzMy4wMjQgMjkxLjU1NyAzMjYuNDgzIDI4Mi40ODhMMzI2LjQ4MiAyODIuNDg2QzMxOS45NDMgMjczLjQwOSAzMjEuOTk3IDI2MC43MjggMzMxLjA2NyAyNTQuMTc4TDMzMS4wNjkgMjU0LjE3N1oiIGZpbGw9ImJsYWNrIi8+CiAgICAgIDxjaXJjbGUgY3g9IjM0Mi45MjciIGN5PSIyNzAuNjIyIiByPSIxMy41MTcxIiB0cmFuc2Zvcm09InJvdGF0ZSgtMjguNjE1OSAzNDIuOTI3IDI3MC42MjIpIiBmaWxsPSIjNTBDMEZGIi8+CiAgICAgIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzE3Ljg0NCAxNjIuOTQ5QzMyMS45NyAxNjguNjcgMzIwLjY4NiAxNzYuNjUyIDMxNC45NTkgMTgwLjc2OEMzMDkuMjQ3IDE4NC44OTUgMzAxLjI2NiAxODMuNjAzIDI5Ny4xNDggMTc3Ljg4NEMyOTMuMDEzIDE3Mi4xNzEgMjk0LjMwNSAxNjQuMTg5IDMwMC4wMzQgMTYwLjA2NUMzMDUuNzU0IDE1NS45MzkgMzEzLjcyNyAxNTcuMjMgMzE3Ljg0NCAxNjIuOTQ5WiIgZmlsbD0iI0ZGRjg0NyIvPgogICAgICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMxNS4xMDYgMTY0LjkyNEMzMTIuMDgxIDE2MC43MjMgMzA2LjIyMiAxNTkuNzcxIDMwMi4wMTQgMTYyLjgwNkwzMDIuMDEyIDE2Mi44MDhDMjk3Ljc5OCAxNjUuODQyIDI5Ni44NTIgMTcxLjcwNyAyOTkuODg5IDE3NS45MDNMMjk5Ljg5NCAxNzUuOTFDMzAyLjkyIDE4MC4xMTMgMzA4Ljc4NiAxODEuMDYzIDMxMi45ODMgMTc4LjAzTDMxMi45OTEgMTc4LjAyNUMzMTcuMTk0IDE3NS4wMDMgMzE4LjE0NSAxNjkuMTM4IDMxNS4xMDcgMTY0LjkyN0wzMTUuMTA2IDE2NC45MjRaTTMyMC41OTEgMTYwLjk3NUMzMTUuMzgxIDE1My43MzkgMzA1LjI5NSAxNTIuMTA4IDI5OC4wNjIgMTU3LjMyNEMyOTAuODIgMTYyLjUzOSAyODkuMTgyIDE3Mi42MzMgMjk0LjQxMiAxNzkuODYzQzI5OS42MjEgMTg3LjA5NCAzMDkuNzEzIDE4OC43MjggMzE2LjkzOCAxODMuNTExQzMyNC4xODUgMTc4LjMgMzI1LjgwMiAxNjguMjA0IDMyMC41OTEgMTYwLjk3NVoiIGZpbGw9ImJsYWNrIi8+CiAgICAgIDwvc3ZnPg=="`
        )
      })
    })
  })

  it('calls "onLoaded" when mounting', () => {
    subject()
    expect(onLoaded).toHaveBeenCalled()
  })
})
