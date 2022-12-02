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

import formatMessage from '../../format-message'

const locale = {
  "afrikaans_da0fe6ee": { "message": "Afrikaans" },
  "albanian_21ed929e": { "message": "Albański" },
  "arabic_c5c87acd": { "message": "Arabski" },
  "armenian_12da6118": { "message": "Armeński" },
  "belarusian_b2f19c76": { "message": "Białoruski" },
  "bulgarian_feccab7e": { "message": "Bułgarski" },
  "catalan_16f6b78f": { "message": "Kataloński" },
  "chinese_111d37f6": { "message": "Chiński" },
  "chinese_simplified_7f0bd370": { "message": "Chiński (uproszczony)" },
  "chinese_traditional_8a7f759d": { "message": "Chiński (tradycyjny)" },
  "croatian_d713d655": { "message": "Chorwacki" },
  "czech_9aa2cbe4": { "message": "Czeski" },
  "danish_c18cdac8": { "message": "Duński" },
  "dutch_6d05cee5": { "message": "Holenderski" },
  "english_australia_dc405d82": { "message": "Angielski (Australia)" },
  "english_c60612e2": { "message": "Angielski" },
  "english_canada_12688ee4": { "message": "Angielski (Kanada)" },
  "english_united_kingdom_a613f831": {
    "message": "Angielski (Wielka Brytania)"
  },
  "estonian_5e8e2fa4": { "message": "Estoński" },
  "file_name_8fd421ff": { "message": "Nazwa pliku" },
  "filipino_33339264": { "message": "Filipiński" },
  "finnish_4df2923d": { "message": "Fiński" },
  "french_33881544": { "message": "Francuski" },
  "french_canada_c3d92fa6": { "message": "Francuski (Kanada)" },
  "galician_7e4508b5": { "message": "Galicyjski" },
  "german_3ec99bbb": { "message": "Niemiecki" },
  "greek_65c5b3f7": { "message": "Greckie" },
  "haitian_creole_7eb4195b": { "message": "Kreolski haitański" },
  "hebrew_88fbf778": { "message": "Hebrajski" },
  "hindi_9bcd4b34": { "message": "Hindi" },
  "hungarian_fc7d30c9": { "message": "Węgierski" },
  "icelandic_9d6d35de": { "message": "Islandzki" },
  "indonesian_5f6accd6": { "message": "Indonezyjski" },
  "irish_567e109f": { "message": "Irlandzki" },
  "italian_bd3c792d": { "message": "Włoski" },
  "japanese_b5721ca7": { "message": "Japoński" },
  "korean_da812d9": { "message": "Koreański" },
  "latvian_2bbb6aab": { "message": "Łotewski" },
  "lithuanian_5adcbe24": { "message": "Litewski" },
  "loading_25990131": { "message": "Wczytywanie..." },
  "macedonian_6ed541af": { "message": "Macedoński" },
  "malay_f5dddce4": { "message": "Malajski" },
  "maltese_916925e8": { "message": "Maltański" },
  "maori_new_zealand_5380a95f": { "message": "Māori (Nowa Zelandia)" },
  "no_preview_is_available_for_this_file_f940114a": {
    "message": "Nie ma możliwości podglądu tego pliku."
  },
  "norwegian_53f391ec": { "message": "Norweski" },
  "norwegian_bokmal_ad5843fa": { "message": "Norweski Bokmål" },
  "norwegian_nynorsk_c785f8a6": { "message": "Norweski Nynorsk" },
  "persian_a8cadb95": { "message": "Perski" },
  "polish_4cf2ecaf": { "message": "Polski" },
  "portuguese_9c212cf4": { "message": "Portugalski" },
  "romanian_13670c1e": { "message": "Rumuński" },
  "russian_1e3e197": { "message": "Rosyjski" },
  "serbian_7187f1f2": { "message": "Serbski" },
  "slovak_69f48e1b": { "message": "Słowacki" },
  "slovenian_30ae5208": { "message": "Słoweński" },
  "spanish_de9de5d6": { "message": "Hiszpański" },
  "swahili_5caeb4ba": { "message": "Suahili" },
  "swedish_59a593ca": { "message": "Szwedzki" },
  "tagalog_74906db7": { "message": "Tagalog" },
  "thai_8f9bc548": { "message": "Tajski" },
  "turkish_5b69578b": { "message": "Turecki" },
  "ukrainian_945b00b7": { "message": "Ukraiński" },
  "vietnamese_e7a76583": { "message": "Wietnamski" },
  "welsh_42ab94b1": { "message": "Walijski" },
  "yiddish_f96986df": { "message": "Jidysz" }
}


formatMessage.addLocale({pl: locale})
