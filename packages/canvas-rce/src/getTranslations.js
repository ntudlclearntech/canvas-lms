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

/*
 * this file is generated by scripts/installTranslations.js
 * as part of the build. DO NOT EDIT
 */

export default function getTranslations(locale) {
  let p
  switch (locale) {
    case 'ar':
      p = import('./translations/locales/ar')
      break
    case 'ca':
      p = import('./translations/locales/ca')
      break
    case 'cy':
      p = import('./translations/locales/cy')
      break
    case 'da':
      p = import('./translations/locales/da')
      break
    case 'da-x-k12':
      p = import('./translations/locales/da-x-k12')
      break
    case 'de':
      p = import('./translations/locales/de')
      break
    case 'el':
      p = import('./translations/locales/el')
      break
    case 'en':
      p = import('./translations/locales/en')
      break
    case 'en-AU-x-unimelb':
      p = import('./translations/locales/en-AU-x-unimelb')
      break
    case 'en_AU':
      p = import('./translations/locales/en_AU')
      break
    case 'en_CA':
      p = import('./translations/locales/en_CA')
      break
    case 'en_CY':
      p = import('./translations/locales/en_CY')
      break
    case 'en_GB':
      p = import('./translations/locales/en_GB')
      break
    case 'es':
      p = import('./translations/locales/es')
      break
    case 'fa_IR':
      p = import('./translations/locales/fa_IR')
      break
    case 'fi':
      p = import('./translations/locales/fi')
      break
    case 'fr':
      p = import('./translations/locales/fr')
      break
    case 'fr_CA':
      p = import('./translations/locales/fr_CA')
      break
    case 'he':
      p = import('./translations/locales/he')
      break
    case 'ht':
      p = import('./translations/locales/ht')
      break
    case 'hu':
      p = import('./translations/locales/hu')
      break
    case 'hy':
      p = import('./translations/locales/hy')
      break
    case 'is':
      p = import('./translations/locales/is')
      break
    case 'it':
      p = import('./translations/locales/it')
      break
    case 'ja':
      p = import('./translations/locales/ja')
      break
    case 'ko':
      p = import('./translations/locales/ko')
      break
    case 'mi':
      p = import('./translations/locales/mi')
      break
    case 'nb':
      p = import('./translations/locales/nb')
      break
    case 'nb-x-k12':
      p = import('./translations/locales/nb-x-k12')
      break
    case 'nl':
      p = import('./translations/locales/nl')
      break
    case 'nn':
      p = import('./translations/locales/nn')
      break
    case 'pl':
      p = import('./translations/locales/pl')
      break
    case 'pt':
      p = import('./translations/locales/pt')
      break
    case 'pt_BR':
      p = import('./translations/locales/pt_BR')
      break
    case 'ru':
      p = import('./translations/locales/ru')
      break
    case 'sl':
      p = import('./translations/locales/sl')
      break
    case 'sv':
      p = import('./translations/locales/sv')
      break
    case 'sv-x-k12':
      p = import('./translations/locales/sv-x-k12')
      break
    case 'tr':
      p = import('./translations/locales/tr')
      break
    case 'uk_UA':
      p = import('./translations/locales/uk_UA')
      break
    case 'zh':
      p = import('./translations/locales/zh')
      break
    case 'zh_HK':
      p = import('./translations/locales/zh_HK')
      break
    default:
      p = Promise.resolve(null)
  }
  return p
}

export function getLocaleList() {
  return [
    'ar',
    'ca',
    'cy',
    'da',
    'da-x-k12',
    'de',
    'el',
    'en',
    'en-AU-x-unimelb',
    'en_AU',
    'en_CA',
    'en_CY',
    'en_GB',
    'es',
    'fa_IR',
    'fi',
    'fr',
    'fr_CA',
    'he',
    'ht',
    'hu',
    'hy',
    'is',
    'it',
    'ja',
    'ko',
    'mi',
    'nb',
    'nb-x-k12',
    'nl',
    'nn',
    'pl',
    'pt',
    'pt_BR',
    'ru',
    'sl',
    'sv',
    'sv-x-k12',
    'tr',
    'uk_UA',
    'zh',
    'zh_HK'
  ]
}
