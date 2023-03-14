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
import '../tinymce/ru'

const locale = {
  "accessibility_checker_b3af1f6c": {
    "message": "Контроллер доступности"
  },
  "action_to_take_b626a99a": {
    "message": "Что необходимо сделать:"
  },
  "add_a_caption_2a915239": {
    "message": "Добавить надпись"
  },
  "add_alt_text_for_the_image_48cd88aa": {
    "message": "Добавить альтернативный текст для изображения"
  },
  "adjacent_links_with_the_same_url_should_be_a_singl_7a1f7f6c": {
    "message": "Соседние ссылки с одним и тем же URL-адресом должны быть объединены в одну ссылку."
  },
  "alt_attribute_text_should_not_contain_more_than_12_e21d4040": {
    "message": "Альтернативный атрибутивный текст не должен содержать более 120 символов."
  },
  "apply_781a2546": {
    "message": "Применить"
  },
  "change_alt_text_92654906": {
    "message": "Изменить альтернативный текст"
  },
  "change_heading_tag_to_paragraph_a61e3113": {
    "message": "Изменить тег заголовка параграфа"
  },
  "change_text_color_1aecb912": {
    "message": "Изменить цвет текста"
  },
  "check_accessibility_3c78211c": {
    "message": "Проверить доступность"
  },
  "checking_for_accessibility_issues_fac18c6d": {
    "message": "Проверка на отсутствие проблем, связанных с доступностью"
  },
  "close_accessibility_checker_29d1c51e": {
    "message": "Закрыть контроллер доступности"
  },
  "close_d634289d": {
    "message": "Закрыть"
  },
  "column_e1ae5c64": {
    "message": "Колонка"
  },
  "column_group_1c062368": {
    "message": "Группа колонок"
  },
  "count_plural_one_item_loaded_other_items_loaded_857023b7": {
    "message": "{ count, plural,\n    one {}\n    few {}\n   many {}\n  other {}\n}"
  },
  "decorative_image_fde98579": {
    "message": "Декоративное изображение"
  },
  "description_436c48d7": {
    "message": "Описание"
  },
  "element_starting_with_start_91bf4c3b": {
    "message": "Элемент, начинающийся с { start }"
  },
  "fix_heading_hierarchy_f60884c4": {
    "message": "Исправить иерархию заголовков"
  },
  "format_as_a_list_142210c3": {
    "message": "Форматировать в виде списка"
  },
  "header_column_f27433cb": {
    "message": "Колонка заголовка"
  },
  "header_row_and_column_ec5b9ec": {
    "message": "Строка и колонка заголовка"
  },
  "header_row_f33eb169": {
    "message": "Строка заголовка"
  },
  "heading_levels_should_not_be_skipped_3947c0e0": {
    "message": "Уровни заголовков не должны пропускаться."
  },
  "heading_starting_with_start_42a3e7f9": {
    "message": "Заголовок, начинающийся с { start }"
  },
  "headings_should_not_contain_more_than_120_characte_3c0e0cb3": {
    "message": "Заголовки не должны содержать более 120 символов."
  },
  "icon_215a1dc6": {
    "message": "Значок"
  },
  "image_filenames_should_not_be_used_as_the_alt_attr_bcfd7780": {
    "message": "Имена файлов изображений не должны использоваться в качестве альтернативного атрибута с описанием содержимого изображения."
  },
  "image_with_filename_file_aacd7180": {
    "message": "Изображение с именем файла { file }"
  },
  "images_should_include_an_alt_attribute_describing__b86d6a86": {
    "message": "Изображения должны содержать альтернативный атрибут с описанием содержимого изображения."
  },
  "issue_num_total_f94536cf": {
    "message": "Проблема { num }/{ total }"
  },
  "keyboards_navigate_to_links_using_the_tab_key_two__5fab8c82": {
    "message": "Клавиатуры используются для перехода по ссылкам с помощью клавиши Tab. Две соседние ссылки, ведущие в одно и то же место, могут запутывать пользователей клавиатур."
  },
  "learn_more_about_adjacent_links_2cb9762c": {
    "message": "Узнать больше о соседних ссылках"
  },
  "learn_more_about_color_contrast_c019dfb9": {
    "message": "Узнать больше о цветовом контрасте"
  },
  "learn_more_about_organizing_page_headings_8a7caa2e": {
    "message": "Узнать больше об организации заголовков страниц"
  },
  "learn_more_about_table_headers_5f5ee13": {
    "message": "Узнать больше о заголовках таблиц"
  },
  "learn_more_about_using_alt_text_for_images_5698df9a": {
    "message": "Узнать больше об использовании замещающего текста для изображений"
  },
  "learn_more_about_using_captions_with_tables_36fe496f": {
    "message": "Узнать больше об использовании заголовков с таблицами"
  },
  "learn_more_about_using_filenames_as_alt_text_264286af": {
    "message": "Узнать больше об использовании имен файлов в качестве замещающего текста"
  },
  "learn_more_about_using_lists_4e6eb860": {
    "message": "Узнать больше об использовании списков"
  },
  "learn_more_about_using_scope_attributes_with_table_20df49aa": {
    "message": "Узнать больше об использовании базовых атрибутов с таблицами"
  },
  "leave_as_is_4facfe55": {
    "message": "Оставить как есть"
  },
  "link_with_text_starting_with_start_b3fcbe71": {
    "message": "Ссылка с текстом, начинающимся с { start }"
  },
  "links_to_an_external_site_de74145d": {
    "message": "Ссылки на внешний сайт."
  },
  "lists_should_be_formatted_as_lists_f862de8d": {
    "message": "Списки должны быть отформатированы в виде списков."
  },
  "merge_links_2478df96": {
    "message": "Объединить ссылки"
  },
  "minimize_file_preview_da911944": {
    "message": "Уменьшить просмотр файла"
  },
  "minimize_video_20aa554b": {
    "message": "Уменьшить видео"
  },
  "next_40e12421": {
    "message": "Далее"
  },
  "no_accessibility_issues_were_detected_f8d3c875": {
    "message": "Проблем, связанных с доступностью, не обнаружено."
  },
  "no_headers_9bc7dc7f": {
    "message": "Заголовки отсутствуют"
  },
  "none_3b5e34d2": {
    "message": "Нет"
  },
  "paragraph_starting_with_start_a59923f8": {
    "message": "Параграф, начинающийся с { start }"
  },
  "prev_f82cbc48": {
    "message": "Назад"
  },
  "remove_heading_style_5fdc8855": {
    "message": "Удалить стиль заголовка"
  },
  "replace_e61834a7": {
    "message": "Заменить"
  },
  "reset_95a81614": {
    "message": "Сброс"
  },
  "row_fc0944a7": {
    "message": "Строка"
  },
  "row_group_979f5528": {
    "message": "Группа строк"
  },
  "screen_readers_cannot_determine_what_is_displayed__6a5842ab": {
    "message": "Экранные дикторы не могут определить, что отображено на изображении, без альтернативного текста, и при этом имена файлов зачастую представляют собой бессмысленные наборы цифр и букв, которые не несут в себе описания контекста или значения."
  },
  "screen_readers_cannot_determine_what_is_displayed__6f1ea667": {
    "message": "Экранные дикторы не могут определить, что отображено на изображении, без альтернативного текста, содержащего описание контекста и значения изображения. Альтернативный текст должен быть простым и сжатым."
  },
  "screen_readers_cannot_determine_what_is_displayed__a57e6723": {
    "message": "Экранные дикторы не могут определить, что отображено на изображении, без альтернативного текста, содержащего описание контекста и значения изображения."
  },
  "screen_readers_cannot_interpret_tables_without_the_bd861652": {
    "message": "Экранные дикторы не могут интерпретировать таблицы без надлежащей структуры. Заголовки таблиц содержат направление и объем содержания."
  },
  "screen_readers_cannot_interpret_tables_without_the_e62912d5": {
    "message": "Экранные дикторы не могут интерпретировать таблицы без надлежащей структуры. Надписи в таблицах содержат описание контекста и общее представление о таблице."
  },
  "screen_readers_cannot_interpret_tables_without_the_f0bdec0f": {
    "message": "Экранные дикторы не могут интерпретировать таблицы без надлежащей структуры. Заголовки таблиц содержат направление и общее описание содержания."
  },
  "set_header_scope_8c548f40": {
    "message": "Задать объем заголовка"
  },
  "set_table_header_cfab13a0": {
    "message": "Задать заголовок таблицы"
  },
  "sighted_users_browse_web_pages_quickly_looking_for_1d4db0c1": {
    "message": "Зрячие пользователи быстро просматривают веб-страницы в поисках крупных или полужирных заголовков. Пользователи экранных дикторов полагаются на заголовки для контекстуального понимания. Заголовки должны иметь надлежащую структуру."
  },
  "sighted_users_browse_web_pages_quickly_looking_for_ade806f5": {
    "message": "Зрячие пользователи быстро просматривают веб-страницы в поисках крупных или полужирных заголовков. Пользователи экранных дикторов полагаются на заголовки для контекстуального понимания. Заголовки должны быть сжатыми в рамках надлежащей структуры."
  },
  "start_over_f7552aa9": {
    "message": "Начать заново"
  },
  "table_header_starting_with_start_ffcabba6": {
    "message": "Заголовок таблицы, начинающийся с { start }"
  },
  "table_starting_with_start_e7232848": {
    "message": "Таблица, начинающаяся с { start }"
  },
  "tables_headers_should_specify_scope_5abf3a8e": {
    "message": "Заголовки таблиц должны конкретизировать объем."
  },
  "tables_should_include_a_caption_describing_the_con_e91e78fc": {
    "message": "Таблицы должны содержать надпись с описанием содержимого таблицы."
  },
  "tables_should_include_at_least_one_header_48779eac": {
    "message": "Таблицы должны содержать как минимум один заголовок."
  },
  "text_is_difficult_to_read_without_sufficient_contr_69e62bd6": {
    "message": "Текст трудно поддается чтению без достаточной контрастности между текстом и фоном, особенно для тех, кто плохо видит."
  },
  "text_larger_than_18pt_or_bold_14pt_should_display__5c364db6": {
    "message": "Текст крупнее 18pt (или полужирный 14pt) должен отображаться с минимальным коэффициентом контрастности 3:1."
  },
  "text_smaller_than_18pt_or_bold_14pt_should_display_aaffb22b": {
    "message": "Текст мельче 18pt (или полужирный 14pt) должен отображаться с минимальным коэффициентом контрастности 4,5:1."
  },
  "the_document_preview_is_currently_being_processed__7d9ea135": {
    "message": "Предварительный просмотр документа в данный момент обрабатывается. Повторите попытку позже."
  },
  "this_document_cannot_be_displayed_within_canvas_7aba77be": {
    "message": "Этот документ нельзя отобразить внутри Canvas."
  },
  "when_markup_is_used_that_visually_formats_items_as_f941fc1b": {
    "message": "Когда используется разметка, которая визуально форматирует элементы в виде списка, но не указывает на отношение списка, пользователи могут испытывать трудности при просмотре информации."
  },
  "why_523b3d8c": {
    "message": "Почему"
  }
}


formatMessage.addLocale({ru: locale})
