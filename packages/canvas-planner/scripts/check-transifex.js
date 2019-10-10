/*
 * Copyright (C) 2019 - present Instructure, Inc.
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

/* eslint no-console: off, semi: off */
import request from 'request'
import {readFile, writeFile, readFileSync} from 'fs'
import {join} from 'path'
import formatMessage from 'format-message'
import parse from 'format-message-parse'

let configFileName = process.argv[2]
if (!configFileName) {
  configFileName = '/dev/stdin'
}

const config = JSON.parse(readFileSync(configFileName))

const TRANSIFEX_USERNAME = process.env.TRANSIFEX_USERNAME
const TRANSIFEX_PASSWORD = process.env.TRANSIFEX_PASSWORD

const JIRA_USERNAME = process.env.JIRA_USERNAME
const JIRA_PASSWORD = process.env.JIRA_PASSWORD

function createJIRAIssue(resource, {summary, description}) {
  return new Promise((resolve, reject) => {
    request(
      {
        method: 'POST',
        url: 'https://instructure.atlassian.net/rest/api/2/issue/',
        auth: {user: JIRA_USERNAME, pass: JIRA_PASSWORD},
        json: {
          fields: {
            project: {key: resource.jiraProjectKey},
            summary,
            description,
            issuetype: {name: resource.jiraIssueType},
            assignee: {name: resource.jiraAssigneeName}
          }
        }
      },
      (err, resp, body) => (err ? reject(err) : resolve(body))
    )
  })
}

function filenameForStatusOfResource(resource) {
  return join(resource.folder, `.transifex-status.${resource.projectSlug}.${resource.slug}.json`)
}

function loadPreviousStatusOfResource(resource) {
  return new Promise((resolve, reject) => {
    const filename = filenameForStatusOfResource(resource)
    readFile(filename, 'utf8', (err, data) => {
      if (err) {
        return err.code === 'ENOENT' ? resolve({}) : reject(err)
      }
      resolve(JSON.parse(data))
    })
  })
}

function writeJSONFile(filename, content) {
  return new Promise((resolve, reject) => {
    writeFile(filename, JSON.stringify(content, null, '  '), 'utf8', err =>
      err ? reject(err) : resolve()
    )
  })
}

function saveStatusOfResource(resource, status) {
  return writeJSONFile(filenameForStatusOfResource(resource), status)
}

function filenameForResource(resource, language) {
  const dir = resource.folder.replace(/\/+$/, '')
  if (resource.localeNameMapping && resource.localeNameMapping[language]) {
    language = resource.localeNameMapping[language]
  }
  const file = language.replace(/_/g, '-') + '.json'
  return join(dir, file)
}

function saveTranslationsOfResource(resource, language, translations) {
  const sorted = Object.keys(translations)
    .sort()
    .reduce((o, id) => {
      o[id] = translations[id]
      return o
    }, {})
  return writeJSONFile(filenameForResource(resource, language), sorted)
}

function getJSON(path) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `https://www.transifex.com/api/2${path}`,
        auth: {user: TRANSIFEX_USERNAME, pass: TRANSIFEX_PASSWORD},
        json: true
      },
      (err, resp, body) => (err ? reject(err) : resolve(body))
    )
  })
}

function getSourceLastUpdatedDate(resource) {
  return getJSON(`/project/${resource.projectSlug}/resource/${resource.slug}?details=1`)
}

function checkStatusOfResource(resource) {
  return getJSON(`/project/${resource.projectSlug}/resource/${resource.slug}/stats/`)
}

async function getMessagesOfResource(resource) {
  const body = await getJSON(`/project/${resource.projectSlug}/resource/${resource.slug}/content/`)
  return JSON.parse(body.content)
}

async function getTranslationsOfResource(resource, language) {
  const body = await getJSON(
    `/project/${resource.projectSlug}/resource/${resource.slug}/translation/${language}/?mode=onlytranslated`
  )
  return JSON.parse(body.content)
}

function createJIRAForNewStrings(resource, languages) {
  const statuses = languages
    .map(
      status =>
        `*Language: ${status.language}*\n` +
        `* Translate: ${status.untranslated_entities} strings (${status.untranslated_words} words)\n` +
        `* Review: ${status.translated_entities - status.reviewed} strings`
    )
    .join('\n\n')
  const description = `Transifex is reporting that new translations are needed in ${resource.project} ${resource.name}.\n\n${statuses}`
  return createJIRAIssue(resource, {
    summary: `Translate new strings in ${resource.project} ${resource.name}`,
    description
  })
}

function getParamsFromPatternAst(ast) {
  if (!ast || !ast.slice) return []
  let stack = ast.slice()
  const params = []
  while (stack.length) {
    const element = stack.pop()
    if (typeof element === 'string') continue
    if (element.length === 1 && element[0] === '#') continue

    const name = element[0]
    if (params.indexOf(name) < 0) params.push(name)

    const type = element[1]
    if (type === 'select' || type === 'plural' || type === 'selectordinal') {
      var children = type === 'select' ? element[2] : element[3]
      stack = stack.concat(...Object.keys(children).map(key => children[key]))
    }
  }
  return params
}

function getTranslationErrors(messages, translations) {
  const errors = []
  for (const id of Object.keys(translations)) {
    const translation = translations[id].message
    if (!translation) {
      // unset untranslated messages
      translations[id] = undefined
      continue
    }
    // unset translation descriptions, as they are not needed nor used
    translations[id].description = undefined

    let translationAst
    try {
      translationAst = parse(translation)
    } catch (e) {
      const problem = 'Translation is an invalid ICU message pattern.'
      errors.push({id, translation, problem, notes: e.message})
      translations[id] = undefined // unset translation with errors
    }
    if (!translationAst) continue
    const translationParams = getParamsFromPatternAst(translationAst)

    const source = messages[id].message
    const sourceAst = messages[id].ast || (messages[id].ast = parse(source))
    const sourceParams =
      messages[id].params || (messages[id].params = getParamsFromPatternAst(sourceAst))

    const missing = sourceParams.filter(key => !translationParams.includes(key))
    const extra = translationParams.filter(key => !sourceParams.includes(key))
    const problem = []
    if (missing.length > 0) {
      const params = missing.map(str => JSON.stringify(str)).join(', ')
      problem.push(
        formatMessage(
          `{ count, plural,
          one {Translation is missing {params} parameter.}
        other {Translation is missing {params} parameters.}
      }`,
          {count: missing.length, params}
        )
      )
    }
    if (extra.length > 0) {
      const params = extra.map(str => JSON.stringify(str)).join(', ')
      problem.push(
        formatMessage(
          `{ count, plural,
          one {Translation has extra {params} parameter.}
        other {Translation has extra {params} parameters.}
      }`,
          {count: extra.length, params}
        )
      )
    }
    let notes = ''
    if (missing.length > 0 && missing.length === extra.length) {
      notes = 'Parameters may have been translated by mistake.'
    }
    if (problem.length > 0) {
      errors.push({id, translation, problem: problem.join('\n'), notes})
      translations[id] = undefined // unset translation with errors
    }
  }
  return errors
}

function handleTranslationErrors(resource, errors) {
  if (Object.keys(errors).length === 0) return
  const formatLanguage = language =>
    `*Language: ${language}*\n` +
    '||Key||Translation||Problem||Notes||\n' +
    formatErrors(errors[language])
  let formatErrors = rows => rows.map(formatError).join('\n')
  let formatError = row =>
    '|' + [row.id, row.translation, row.problem, row.notes || ' '].map(clean).join('|') + '|'
  let clean = str => str.replace(/[{}|]/g, '\\$&').replace(/(\r?\n)+/g, '\n')

  const statuses = Object.keys(errors)
    .map(formatLanguage)
    .join('\n')
  const description = `There were problems during language import in ${resource.project} ${resource.name}.\n\n${statuses}`
  return createJIRAIssue(resource, {
    summary: `Fix Transifex Import Errors for ${resource.project} ${resource.name}`,
    description
  })
}

async function handleNewTranslations(resource, languages) {
  const messages = await getMessagesOfResource(resource)
  const allErrors = {}
  for (const language of languages) {
    const translations = await getTranslationsOfResource(resource, language)
    const errors = getTranslationErrors(messages, translations)
    if (errors.length) {
      allErrors[language] = errors
    }
    await saveTranslationsOfResource(resource, language, translations)
  }
  await handleTranslationErrors(resource, allErrors)
}

async function run() {
  for (const resource of config.resources) {
    const prevStatus = await loadPreviousStatusOfResource(resource)
    const status = await checkStatusOfResource(resource)
    const sourceLastUpdated = Date.parse(await getSourceLastUpdatedDate(resource))

    const newStrings = []
    const newTranslations = []
    const sourcePreviouslyUpdated =
      Date.parse((prevStatus[resource.sourceLanguage] || {}).last_update) || 0
    const sourceWasUpdated = sourceLastUpdated > sourcePreviouslyUpdated

    for (const language of Object.keys(status).sort()) {
      if (language === resource.sourceLanguage) continue
      const prevLangStatus = prevStatus[language] || {
        untranslated_entities: 0,
        translated_entities: 0,
        last_update: '2015-12-12 12:34:56'
      }
      const langStatus = status[language]
      const langPreviouslyUpdated = Date.parse(prevLangStatus.last_update)
      const langLastUpdated = Date.parse(langStatus.last_update)
      const langWasUpdated = langLastUpdated > langPreviouslyUpdated

      if (sourceWasUpdated && langStatus.untranslated_entities > 0) {
        newStrings.push({...langStatus, language})
      }
      if (langWasUpdated && langStatus.translated_entities > 0) {
        newTranslations.push(language)
      }
    }

    const promises = []
    if (newStrings.length) {
      if (resource.jiraTicketForNewStrings !== false) {
        promises.push(createJIRAForNewStrings(resource, newStrings))
      }
    }
    if (newTranslations.length) {
      promises.push(handleNewTranslations(resource, newTranslations))
    }

    promises.push(saveStatusOfResource(resource, status))
    await Promise.all(promises)
  }
}

run().catch(err => {
  console.error(err.stack)
  process.exit(-1)
})
