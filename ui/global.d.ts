/*
 * Copyright (C) 2021 - present Instructure, Inc.
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

import {sendMessageStudentsWho} from './shared/grading/messageStudentsWhoHelper'

declare global {
  interface Global {
    readonly ENV?: any
    readonly INST?: any
  }

  interface Window {
    readonly ENV?: any
    readonly INST?: any
    webkitSpeechRecognition: any
    jsonData: any
    messageStudents: (options: ReturnType<typeof sendMessageStudentsWho>) => void
    updateGrades: () => void
  }

  const ENV: any
  const INST: any

  type ShowIf = {
    (bool?: boolean): JQuery<HTMLElement>
    /**
     * @deprecated use a boolean parameter instead
     * @param num
     * @returns
     */
    (num?: number): JQuery<HTMLElement>
  }

  declare interface JQuery {
    scrollTo: (y: number, x?: number) => void
    capitalize: (str: string) => string
    change: any
    confirmDelete: any
    datetime_field: () => JQuery<HTMLInputElement>
    decodeFromHex: (str: string) => string
    disableWhileLoading: any
    encodeToHex: (str: string) => string
    fileSize: (size: number) => string
    fillTemplateData: any
    fillWindowWithMe: (options?: {onResize: () => void}) => JQuery<HTMLElement>
    fixDialogButtons: () => void
    errorBox: (
      message: string,
      scroll?: boolean,
      override_position?: string | number
    ) => JQuery<HTMLElement>
    getFormData: () => Record<string, unknown>
    live: any
    loadDocPreview: (options: {
      height: string
      id: string
      mimeType: string
      attachment_id: string
      submission_id: any
      attachment_view_inline_ping_url: string | undefined
      attachment_preview_processing: boolean
    }) => void
    mediaComment: any
    mediaCommentThumbnail: (size?: 'normal' | 'small') => void
    queryParam: (name: string) => string
    raw: (str: string) => string
    showIf: ShowIf
    titleize: (str: string) => string
    underscore: (str: string) => string
    youTubeID: (path: string) => string
  }

  declare interface JQueryStatic {
    subscribe: (topic: string, callback: (...args: any[]) => void) => void
    ajaxJSON: (
      url: string,
      submit_type?: string,
      data?: any,
      success?: any,
      error?: any,
      options?: any
    ) => JQuery.JQueryXHR
    replaceTags: (string, string, string?) => string
    raw: (str: string) => string
    getScrollbarWidth: any
    datetimeString: any
    ajaxJSONFiles: any
    isPreviewable: any
  }

  declare interface Array<T> {
    flatMap: <Y>(callback: (value: T, index: number, array: T[]) => Y[]) => Y[]
    flat: <Y>(depth?: number) => Y[]
  }

  declare interface Object {
    fromEntries: any
  }
}

// Global scope declarations are only allowed in module contexts, so we
// need this to make Typescript think this is a module.
export {}
