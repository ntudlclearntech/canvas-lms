/*
 * Copyright (C) 2020 - present Instructure, Inc.
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

type Deferred<T> = {
  state: 'pending' | 'resolved' | 'rejected'
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error?: Error) => void
}

export default function deferPromise<T>(): Deferred<T> {
  const deferred: Deferred<T> = {
    state: 'pending',
    resolve: () => {},
    reject: () => {},
    promise: new Promise(() => {}),
  }

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = (value: T) => {
      if (deferred.state === 'pending') {
        deferred.state = 'resolved'
        resolve(value)
      }
    }

    deferred.reject = (error?: Error) => {
      if (deferred.state === 'pending') {
        deferred.state = 'rejected'
        reject(error)
      }
    }
  })

  return deferred
}
