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
import '../tinymce/ca'

const locale = {
  "access_the_pretty_html_editor_37168efe": {
    "message": "Accediu a l’editor de dades HTML processades"
  },
  "accessibility_checker_b3af1f6c": {
    "message": "Verificador d''accessibilitat"
  },
  "add_8523c19b": { "message": "Afegeix" },
  "add_another_f4e50d57": { "message": "Afegeix-ne un altre" },
  "add_cc_subtitles_55f0394e": { "message": "Afegeix CC/subtítols" },
  "add_image_60b2de07": { "message": "Afegeix la imatge" },
  "aleph_f4ffd155": { "message": "Àlef" },
  "align_11050992": { "message": "Alinea" },
  "alignment_and_lists_5cebcb69": { "message": "Alineació i llistes" },
  "all_4321c3a1": { "message": "Tot" },
  "all_apps_a50dea49": { "message": "Totes les aplicacions" },
  "alpha_15d59033": { "message": "Alfa" },
  "alphabetical_55b5b4e0": { "message": "Alfabètic" },
  "alt_text_611fb322": { "message": "Text alternatiu" },
  "amalg_coproduct_c589fb12": { "message": "Amalg (coproducte)" },
  "an_error_occured_reading_the_file_ff48558b": {
    "message": "S''ha produït un error en llegir el fitxer"
  },
  "an_error_occurred_making_a_network_request_d1bda348": {
    "message": "S''ha produït un error en realitzar una sol·licitud de xarxa"
  },
  "an_error_occurred_uploading_your_media_71f1444d": {
    "message": "S''ha produït un error en carregar l''element multimèdia."
  },
  "and_7fcc2911": { "message": "I" },
  "angle_c5b4ec50": { "message": "Angle" },
  "announcement_list_da155734": { "message": "Llista d''anuncis" },
  "announcements_a4b8ed4a": { "message": "Anuncis" },
  "apply_781a2546": { "message": "Aplica" },
  "apply_changes_to_all_instances_of_this_icon_maker__2642f466": {
    "message": "Apliqueu els canvis a totes les instàncies d’aquesta icona de l’eina de creació d’icones a l''assignatura"
  },
  "approaches_the_limit_893aeec9": { "message": "S’apropa al límit" },
  "approximately_e7965800": { "message": "Aproximadament" },
  "apps_54d24a47": { "message": "Aplicacions" },
  "arrows_464a3e54": { "message": "Fletxes" },
  "art_icon_8e1daad": { "message": "Icona d''art" },
  "aspect_ratio_will_be_preserved_cb5fdfb8": {
    "message": "La relació d''aspecte es mantindrà"
  },
  "assignments_1e02582c": { "message": "Activitats" },
  "asterisk_82255584": { "message": "Asterisc" },
  "attributes_963ba262": { "message": "Atributs" },
  "audio_and_video_recording_not_supported_please_use_5ce3f0d7": {
    "message": "La funció d’enregistrament d’àudio i vídeo no és compatible; utilitzeu un altre navegador."
  },
  "audio_options_feb58e2c": { "message": "Opcions de so" },
  "audio_options_tray_33a90711": { "message": "Safata d''opcions de so" },
  "audio_player_for_title_20cc70d": {
    "message": "Reproductor de so per a { title }"
  },
  "auto_saved_content_exists_would_you_like_to_load_t_fee528f2": {
    "message": "Existeix contingut desat automàticament. Voleu carregar el contingut desat automàticament al seu lloc?"
  },
  "available_folders_694d0436": { "message": "Carpetes disponibles" },
  "backslash_b2d5442d": { "message": "Barra invertida" },
  "bar_ec63ed6": { "message": "Barra" },
  "basic_554cdc0a": { "message": "Bàsic" },
  "because_501841b": { "message": "Perquè" },
  "below_81d4dceb": { "message": "A sota de" },
  "beta_cb5f307e": { "message": "Beta" },
  "big_circle_16b2e604": { "message": "Cercle gran" },
  "binomial_coefficient_ea5b9bb7": { "message": "Coeficient binomial" },
  "black_4cb01371": { "message": "Negre" },
  "blue_daf8fea9": { "message": "Blau" },
  "bottom_15a2a9be": { "message": "Fons" },
  "bottom_third_5f5fec1d": { "message": "Terç inferior" },
  "bowtie_5f9629e4": { "message": "Corbatí" },
  "brick_f2656265": { "message": "Totxo" },
  "c_2001_acme_inc_283f7f80": { "message": "(c) 2001 Acme Inc." },
  "cancel_caeb1e68": { "message": "Cancel·la" },
  "cap_product_3a5265a6": { "message": "Producte amb tapa" },
  "center_align_e68d9997": { "message": "Alineació centrada" },
  "centered_dot_64d5e378": { "message": "Punt centrat" },
  "centered_horizontal_dots_451c5815": {
    "message": "Punts horitzontals centrats"
  },
  "chi_54a32644": { "message": "Ksi" },
  "choose_caption_file_9c45bc4e": { "message": "Tria un fitxer de subtítols" },
  "choose_usage_rights_33683854": { "message": "Tria els drets d''ús..." },
  "circle_484abe63": { "message": "Cercle" },
  "circle_unordered_list_9e3a0763": {
    "message": "marca amb un cercle la llista desordenada"
  },
  "clear_2084585f": { "message": "Suprimeix" },
  "clear_image_3213fe62": { "message": "Esborra la imatge" },
  "clear_selected_file_82388e50": {
    "message": "Esborra el fitxer seleccionat"
  },
  "clear_selected_file_filename_2fe8a58e": {
    "message": "Esborra el fitxer seleccionat: { filename }"
  },
  "click_or_shift_click_for_the_html_editor_25d70bb4": {
    "message": "Feu clic aquí o feu-hi clic mentre premeu la tecla Maj per obrir l’editor d’HTML."
  },
  "click_to_embed_imagename_c41ea8df": {
    "message": "Feu clic per integrar { imageName }"
  },
  "click_to_hide_preview_3c707763": {
    "message": "Feu clic per amagar la visualització prèvia"
  },
  "click_to_insert_a_link_into_the_editor_c19613aa": {
    "message": "Feu clic per inserir un enllaç en l''editor."
  },
  "click_to_show_preview_faa27051": {
    "message": "Feu clic per mostrar la visualització prèvia"
  },
  "close_a_menu_or_dialog_also_returns_you_to_the_edi_739079e6": {
    "message": "Tanca un menú o un quadre de diàleg També us torna a l''àrea d''editor"
  },
  "close_d634289d": { "message": "Tanca" },
  "closed_caption_file_must_be_less_than_maxkb_kb_5880f752": {
    "message": "El fitxer de subtítols tancats ha de tenir menys de { maxKb } kB"
  },
  "closed_captions_subtitles_e6aaa016": {
    "message": "Llegendes/subtítols tancats"
  },
  "clubs_suit_c1ffedff": { "message": "Trèvols (coll de cartes)" },
  "collaborations_5c56c15f": { "message": "Col·laboracions" },
  "collapse_to_hide_types_1ab46d2e": {
    "message": "Contrau per amagar { types }"
  },
  "color_picker_6b359edf": { "message": "Selector de color" },
  "color_picker_colorname_selected_ad4cf400": {
    "message": "Selector de color (s’ha seleccionat el color { colorName })"
  },
  "complex_numbers_a543d004": { "message": "Números complexos" },
  "computer_1d7dfa6f": { "message": "Ordinador" },
  "congruent_5a244acd": { "message": "Congruent" },
  "contains_311f37b7": { "message": "Conté" },
  "content_1440204b": { "message": "Contingut" },
  "content_is_still_being_uploaded_if_you_continue_it_8f06d0cb": {
    "message": "Encara s''està penjant el contingut. Si continueu, no s''integrarà adequadament."
  },
  "content_subtype_5ce35e88": { "message": "Subtipus de contingut" },
  "content_type_2cf90d95": { "message": "Tipus de contingut" },
  "coproduct_e7838082": { "message": "Coproducte" },
  "copyright_holder_66ee111": { "message": "Titular del copyright:" },
  "count_plural_0_0_words_one_1_word_other_words_acf32eca": {
    "message": "{ count, plural,\n     =0 {0 paraules}\n    one {1 paraula}\n  other {# paraules}\n}"
  },
  "count_plural_one_item_loaded_other_items_loaded_857023b7": {
    "message": "{ count, plural,\n    one {# element carregat}\n  other {# elements carregats}\n}"
  },
  "course_documents_104d76e0": { "message": "Documents de l''assignatura" },
  "course_files_62deb8f8": { "message": "Fitxers de l''assignatura" },
  "course_files_a31f97fc": { "message": "Fitxers de l''assignatura" },
  "course_images_f8511d04": { "message": "Imatges de l''assignatura" },
  "course_link_b369426": { "message": "Enllaç a l’assignatura" },
  "course_links_b56959b9": { "message": "Enllaços de l''assignatura" },
  "course_media_ec759ad": {
    "message": "Elements multimèdia de l''assignatura"
  },
  "course_navigation_dd035109": { "message": "Navegació de l''assignatura" },
  "create_icon_110d6463": { "message": "Crea una icona" },
  "create_icon_maker_icon_c716bffe": {
    "message": "Crea una icona de l’eina de creació d’icones"
  },
  "creative_commons_license_725584ae": {
    "message": "Llicència de Creative Commons:"
  },
  "crop_image_41bf940c": { "message": "Retalla la imatge" },
  "crop_image_807ebb08": { "message": "Retalla la imatge" },
  "cup_product_14174434": { "message": "Producte amb tassa" },
  "current_image_f16c249c": { "message": "Imatge actual" },
  "custom_6979cd81": { "message": "Personalitzat" },
  "cyan_c1d5f68a": { "message": "Cian" },
  "dagger_57e0f4e5": { "message": "Daga" },
  "date_added_ed5ad465": { "message": "Data afegida" },
  "decorative_icon_9a7f3fc3": { "message": "Icona decorativa" },
  "decorative_type_upper_f2c95e3": { "message": "{ TYPE_UPPER } decoratiu" },
  "decrease_indent_d9cf469d": { "message": "Redueix la sagnia" },
  "deep_purple_bb3e2907": { "message": "Porpra fosc" },
  "default_bulleted_unordered_list_47079da8": {
    "message": "llista desordenada amb pics predeterminada"
  },
  "default_numerical_ordered_list_48dd3548": {
    "message": "llista ordenada enumerada predeterminada"
  },
  "definite_integral_fe7ffed1": { "message": "Integral definida" },
  "degree_symbol_4a823d5f": { "message": "Símbol de grau" },
  "delimiters_4db4840d": { "message": "Delimitadors" },
  "delta_53765780": { "message": "Delta" },
  "describe_the_icon_f6a18823": { "message": "(Descriviu la icona)" },
  "describe_the_type_ff448da5": { "message": "(Descriviu el { TYPE })" },
  "describe_the_video_2fe8f46a": { "message": "(Descriu el vídeo)" },
  "details_98a31b68": { "message": "Detalls" },
  "diagonal_dots_7d71b57e": { "message": "Punts en diagonal" },
  "diamond_b8dfe7ae": { "message": "Diamant" },
  "diamonds_suit_526abaaf": { "message": "Diamants (coll de cartes)" },
  "digamma_258ade94": { "message": "Digamma" },
  "dimension_type_f5fa9170": { "message": "Tipus de dimensió" },
  "dimensions_45ddb7b7": { "message": "Mides" },
  "directionality_26ae9e08": { "message": "Direccionalitat" },
  "directly_edit_latex_b7e9235b": { "message": "Edita directament LaTeX" },
  "disable_preview_222bdf72": {
    "message": "Desactiva la visualització prèvia"
  },
  "discussions_a5f96392": { "message": "Fòrums" },
  "discussions_index_6c36ced": { "message": "Índex dels fòrums" },
  "disjoint_union_e74351a8": { "message": "Unió desarticulada" },
  "display_options_315aba85": { "message": "Mostra les opcions" },
  "display_text_link_opens_in_a_new_tab_75e9afc9": {
    "message": "Mostra l''enllaç al text (s''obre en una pestanya nova)"
  },
  "division_sign_72190870": { "message": "Signe de la divisió" },
  "document_678cd7bf": { "message": "Document" },
  "documents_81393201": { "message": "Documents" },
  "done_54e3d4b6": { "message": "Fet" },
  "double_dagger_faf78681": { "message": "Daga doble" },
  "down_and_left_diagonal_arrow_40ef602c": {
    "message": "Fletxa descendent esquerra en diagonal"
  },
  "down_and_right_diagonal_arrow_6ea0f460": {
    "message": "Fletxa descendent dreta en diagonal"
  },
  "download_filename_2baae924": { "message": "Baixa { filename }" },
  "downward_arrow_cca52012": { "message": "Fletxa descendent" },
  "downward_pointing_triangle_2a12a601": {
    "message": "Triangle d’orientació descendent"
  },
  "drag_a_file_here_1bf656d5": { "message": "Arrossega un fitxer aquí" },
  "drag_and_drop_or_click_to_browse_your_computer_60772d6d": {
    "message": "Arrossegueu i deixeu anar o feu clic per explorar l''ordinador"
  },
  "drag_handle_use_up_and_down_arrows_to_resize_e29eae5c": {
    "message": "Arrossegueu el controlador. Utilitzeu les fletxes cap a dalt i cap a baix per canviar la mida"
  },
  "due_multiple_dates_cc0ee3f5": {
    "message": "Data de lliurament: Dates múltiples"
  },
  "due_when_7eed10c6": { "message": "Data de lliurament: { when }" },
  "edit_alt_text_for_this_icon_instance_9c6fc5fd": {
    "message": "Editeu el text alternatiu per a aquesta instància de la icona"
  },
  "edit_course_link_5a5c3c59": { "message": "Edita l’enllaç a l’assignatura" },
  "edit_equation_f5279959": { "message": "Edita l''equació" },
  "edit_existing_icon_maker_icon_5d0ebb3f": {
    "message": "Edita la icona de l’eina de creació d’icones existent"
  },
  "edit_icon_2c6b0e91": { "message": "Edita la icona" },
  "edit_link_7f53bebb": { "message": "Edita l''enllaç" },
  "editor_statusbar_26ac81fc": { "message": "Editor de la barra d''estat" },
  "embed_828fac4a": { "message": "Integra" },
  "embed_code_314f1bd5": { "message": "Integra el codi" },
  "embed_image_1080badc": { "message": "Integra la imatge" },
  "embed_video_a97a64af": { "message": "Integra el vídeo" },
  "embedded_content_aaeb4d3d": { "message": "contingut incrustat" },
  "empty_set_91a92df4": { "message": "Conjunt buit" },
  "encircled_dot_8f5e51c": { "message": "Punt encerclat" },
  "encircled_minus_72745096": { "message": "Signe menys encerclat" },
  "encircled_plus_36d8d104": { "message": "Signe més encerclat" },
  "encircled_times_5700096d": { "message": "Vegades que s''ha encerclat" },
  "engineering_icon_f8f3cf43": { "message": "Icona d’enginyeria" },
  "english_icon_25bfe845": { "message": "Icona d’anglès" },
  "enter_at_least_3_characters_to_search_4f037ee0": {
    "message": "Introduïu com a mínim 3 caràcters per cercar"
  },
  "epsilon_54bb8afa": { "message": "Èpsilon" },
  "epsilon_variant_d31f1e77": { "message": "Èpsilon (variant)" },
  "equals_sign_c51bdc58": { "message": "Signe igual" },
  "equation_1c5ac93c": { "message": "Equació" },
  "equation_editor_39fbc3f1": { "message": "Editor d’equacions" },
  "equivalence_class_7b0f11c0": { "message": "Classe d''equivalència" },
  "equivalent_identity_654b3ce5": { "message": "Equivalent (identitat)" },
  "eta_b8828f99": { "message": "Eta" },
  "exists_2e62bdaa": { "message": "Existeix" },
  "expand_preview_by_default_2abbf9f8": {
    "message": "Desplega la visualització prèvia per defecte"
  },
  "expand_to_see_types_f5d29352": { "message": "Desplega per veure { types }" },
  "external_link_d3f9e62a": { "message": "Enllaç extern" },
  "external_tools_6e77821": { "message": "Eines externes" },
  "extra_large_b6cdf1ff": { "message": "Extragran" },
  "extra_small_9ae33252": { "message": "Molt petit" },
  "extracurricular_icon_67c8ca42": { "message": "Icona extracurricular" },
  "f_function_fe422d65": { "message": "F (funció)" },
  "failed_getting_file_contents_e9ea19f4": {
    "message": "No s''ha pogut obtenir el contingut del fitxer"
  },
  "file_storage_quota_exceeded_b7846cd1": {
    "message": "S''ha superat la quota d''emmagatzematge de fitxers"
  },
  "file_url_c12b64be": { "message": "URL del fitxer" },
  "filename_file_icon_602eb5de": { "message": "Icona del fitxer { filename }" },
  "filename_image_preview_6cef8f26": {
    "message": "Visualització prèvia de la imatge { filename }"
  },
  "filename_text_preview_e41ca2d8": {
    "message": "Visualització prèvia del text { filename }"
  },
  "files_c300e900": { "message": "Fitxers" },
  "files_index_af7c662b": { "message": "Índex de fitxers" },
  "flat_music_76d5a5c3": { "message": "Bemoll (música)" },
  "focus_element_options_toolbar_18d993e": {
    "message": "Barra d''eines d''opcions de focus d''element"
  },
  "folder_tree_fbab0726": { "message": "Arbre de carpetes" },
  "for_all_b919f972": { "message": "Per a tots" },
  "format_4247a9c5": { "message": "Format" },
  "formatting_5b143aa8": { "message": "S''està formatant" },
  "forward_slash_3f90f35e": { "message": "Barra inclinada" },
  "found_auto_saved_content_3f6e4ca5": {
    "message": "S''ha trobat contingut desat automàticament"
  },
  "found_count_plural_0_results_one_result_other_resu_46aeaa01": {
    "message": "S''han trobat { count, plural,\n     =0 {# resultats}\n    one {# resultat}\n  other {# resultats}\n}"
  },
  "fraction_41bac7af": { "message": "Fracció" },
  "fullscreen_873bf53f": { "message": "Pantalla completa" },
  "gamma_1767928": { "message": "Gamma" },
  "generating_preview_45b53be0": {
    "message": "S''està generant la visualització prèvia…"
  },
  "gif_png_format_images_larger_than_size_kb_are_not__7af3bdbd": {
    "message": "En l''actualitat, no s’admeten les imatges amb format GIF o PNG més grans de { size } kB."
  },
  "go_to_the_editor_s_menubar_e6674c81": {
    "message": "Ves a la barra de menús de l''editor"
  },
  "go_to_the_editor_s_toolbar_a5cb875f": {
    "message": "Ves a la barra d''eines de l''editor"
  },
  "grades_a61eba0a": { "message": "Notes" },
  "greater_than_e98af662": { "message": "Més gran que" },
  "greater_than_or_equal_b911949a": { "message": "Més gran o igual que" },
  "greek_65c5b3f7": { "message": "Grec" },
  "green_15af4778": { "message": "Verd" },
  "grey_a55dceff": { "message": "Gris" },
  "group_documents_8bfd6ae6": { "message": "Agrupa els documents" },
  "group_files_4324f3df": { "message": "Fitxers del grup" },
  "group_files_82e5dcdb": { "message": "Fitxers del grup" },
  "group_images_98e0ac17": { "message": "Agrupa les imatges" },
  "group_isomorphism_45b1458c": { "message": "Isomorfisme de grup" },
  "group_link_63e626b3": { "message": "Enllaç de grup" },
  "group_links_9493129e": { "message": "Enllaços de grup" },
  "group_media_2f3d128a": { "message": "Agrupa els elements multimèdia" },
  "group_navigation_99f191a": { "message": "Navegació del grup" },
  "h_bar_bb94deae": { "message": "Barra H" },
  "hat_ea321e35": { "message": "Barret" },
  "heading_2_5b84eed2": { "message": "Capçalera 2" },
  "heading_3_2c83de44": { "message": "Capçalera 3" },
  "heading_4_b2e74be7": { "message": "Capçalera 4" },
  "health_icon_8d292eb5": { "message": "Icona de salut" },
  "hearts_suit_e50e04ca": { "message": "Cors (coll de cartes)" },
  "height_69b03e15": { "message": "Altura" },
  "hexagon_d8468e0d": { "message": "Hexàgon" },
  "hide_description_bfb5502e": { "message": "Amaga la descripció" },
  "hide_title_description_caf092ef": {
    "message": "Amaga la descripció de { title }"
  },
  "home_351838cd": { "message": "Inici" },
  "html_code_editor_fd967a44": { "message": "Editor de codi HTML" },
  "html_editor_fb2ab713": { "message": "Editor d''HTML" },
  "i_have_obtained_permission_to_use_this_file_6386f087": {
    "message": "He obtingut permís per utilitzar aquest fitxer."
  },
  "i_hold_the_copyright_71ee91b1": {
    "message": "Soc el titular dels drets d''autor"
  },
  "icon_215a1dc6": { "message": "Icona" },
  "icon_8168b2f8": { "message": "icona" },
  "icon_color_b86dd6d6": { "message": "Color de la icona" },
  "icon_maker_icons_cc560f7e": {
    "message": "Icones de l’eina de creació d’icones"
  },
  "icon_options_7e32746e": { "message": "Opcions d’icona" },
  "icon_options_tray_2b407977": { "message": "Safata d''opcions d’icona" },
  "icon_shape_30b61e7": { "message": "Forma de la icona" },
  "icon_size_9353edea": { "message": "Mida de la icona" },
  "if_left_empty_link_text_will_display_as_course_lin_61087540": {
    "message": "Si es deixa un enllaç buit, el text es mostrarà com a nom de l''enllaç a l’assignatura"
  },
  "if_you_do_not_select_usage_rights_now_this_file_wi_14e07ab5": {
    "message": "Si no seleccioneu els drets d''ús ara, s''anul·larà la publicació d''aquest fitxer un cop s''hagi carregat."
  },
  "image_8ad06": { "message": "Imatge" },
  "image_c1c98202": { "message": "imatge" },
  "image_options_5412d02c": { "message": "Opcions d''imatge" },
  "image_options_tray_90a46006": { "message": "Safata d''opcions d''imatge" },
  "image_to_crop_3a34487d": { "message": "Imatge que cal retallar" },
  "images_7ce26570": { "message": "Imatges" },
  "imaginary_portion_of_complex_number_2c733ffa": {
    "message": "Porció imaginària (d’un número complex)"
  },
  "in_element_of_19ca2f33": { "message": "A (un element de)" },
  "increase_indent_6af90f7c": { "message": "Augmenta la sagnia" },
  "indefinite_integral_6623307e": { "message": "Integral indefinida" },
  "indigo_2035fc55": { "message": "Indi" },
  "inference_fed5c960": { "message": "Inferència" },
  "infinity_7a10f206": { "message": "Infinitat" },
  "insert_593145ef": { "message": "Insereix" },
  "insert_equella_links_49a8dacd": { "message": "Insereix enllaços a Equella" },
  "insert_link_6dc23cae": { "message": "Insereix un enllaç" },
  "insert_math_equation_57c6e767": {
    "message": "Insereix una equació matemàtica"
  },
  "integers_336344e1": { "message": "Números enters" },
  "intersection_cd4590e4": { "message": "Intersecció" },
  "invalid_entry_f7d2a0f5": { "message": "Entrada no vàlida." },
  "invalid_file_c11ba11": { "message": "Fitxer no vàlid" },
  "invalid_file_type_881cc9b2": { "message": "Tipus de fitxer no vàlid" },
  "invalid_url_cbde79f": { "message": "URL no vàlida" },
  "iota_11c932a9": { "message": "Iota" },
  "kappa_2f14c816": { "message": "Kappa" },
  "kappa_variant_eb64574b": { "message": "Kappa (variant)" },
  "keyboard_shortcuts_ed1844bd": { "message": "Dreceres del teclat" },
  "lambda_4f602498": { "message": "Lambda" },
  "language_arts_icon_a798b0f8": { "message": "Icona d''arts lingüístiques" },
  "languages_icon_9d20539": { "message": "Icona d’idiomes" },
  "large_9c5e80e7": { "message": "Gran" },
  "left_align_43d95491": { "message": "Alineació esquerra" },
  "left_angle_bracket_c87a6d07": { "message": "Parèntesi angular esquerre" },
  "left_arrow_4fde1a64": { "message": "Fletxa esquerra" },
  "left_arrow_with_hook_5bfcad93": { "message": "Fletxa esquerra amb ganxo" },
  "left_ceiling_ee9dd88a": { "message": "Valor màxim esquerre" },
  "left_curly_brace_1726fb4": { "message": "Clau esquerra" },
  "left_downard_harpoon_arrow_1d7b3d2e": {
    "message": "Fletxa descendent esquerra amb arpó"
  },
  "left_floor_29ac2274": { "message": "Terra esquerre" },
  "left_to_right_e9b4fd06": { "message": "Esquerra a dreta" },
  "left_upward_harpoon_arrow_3a562a96": {
    "message": "Fletxa ascendent esquerra amb arpó"
  },
  "leftward_arrow_1e4765de": { "message": "Fletxa esquerra" },
  "leftward_pointing_triangle_d14532ce": {
    "message": "Triangle d’orientació esquerra"
  },
  "less_than_a26c0641": { "message": "Menys que" },
  "less_than_or_equal_be5216cb": { "message": "Menys o igual que" },
  "library_icon_ae1e54cf": { "message": "Icona de biblioteca" },
  "light_blue_5374f600": { "message": "Blau clar" },
  "link_7262adec": { "message": "Enllaç" },
  "link_options_a16b758b": { "message": "Opcions d''enllaç" },
  "links_14b70841": { "message": "Enllaços" },
  "links_to_an_external_site_de74145d": {
    "message": "Enllaça a un lloc extern."
  },
  "load_more_35d33c7": { "message": "Carrega''n més" },
  "loading_25990131": { "message": "S''està carregant…" },
  "loading_bde52856": { "message": "S''està carregant" },
  "loading_closed_captions_subtitles_failed_95ceef47": {
    "message": "No s’han pogut carregar les llegendes ni els subtítols tancats."
  },
  "loading_failed_b3524381": { "message": "No s''ha pogut carregar…" },
  "loading_failed_e6a9d8ef": { "message": "No s''ha pogut carregar." },
  "loading_folders_d8b5869e": { "message": "S''estan carregant les carpetes" },
  "loading_please_wait_d276220a": { "message": "S''està carregant, espereu" },
  "loading_preview_9f077aa1": {
    "message": "S’està carregant la visualització prèvia"
  },
  "locked_762f138b": { "message": "Bloquejat" },
  "logical_equivalence_76fca396": { "message": "Equivalència lògica" },
  "logical_equivalence_short_8efd7b4f": {
    "message": "Equivalència lògica (curta)"
  },
  "logical_equivalence_short_and_thick_1e1f654d": {
    "message": "Equivalència lògica (curta i gruixuda)"
  },
  "logical_equivalence_thick_662dd3f2": {
    "message": "Equivalència lògica (gruixuda)"
  },
  "low_horizontal_dots_cc08498e": { "message": "Punts horitzontals baixos" },
  "magenta_4a65993c": { "message": "Magenta" },
  "maps_to_e5ef7382": { "message": "Mapa cap a" },
  "math_icon_ad4e9d03": { "message": "Icona de matemàtiques" },
  "media_af190855": { "message": "Element multimèdia" },
  "media_file_is_processing_please_try_again_later_58a6d49": {
    "message": "S’està processant el fitxer multimèdia. Torneu a provar-ho més endavant."
  },
  "medium_5a8e9ead": { "message": "Mitjà" },
  "middle_27dc1d5": { "message": "Centre" },
  "minimize_file_preview_da911944": {
    "message": "Minimitza la visualització prèvia del fitxer"
  },
  "minimize_video_20aa554b": { "message": "Minimitza el vídeo" },
  "minus_fd961e2e": { "message": "Menys" },
  "minus_plus_3461f637": { "message": "Menys/més" },
  "misc_3b692ea7": { "message": "Miscel·lània" },
  "miscellaneous_e9818229": { "message": "Diversos" },
  "modules_c4325335": { "message": "Continguts" },
  "mu_37223b8b": { "message": "Mu" },
  "multi_color_image_63d7372f": { "message": "Imatge multicolor" },
  "multiplication_sign_15f95c22": { "message": "Signe de la multiplicació" },
  "music_icon_4db5c972": { "message": "Icona de música" },
  "must_be_at_least_percentage_22e373b6": {
    "message": "Ha de ser un { percentage }% com a mínim"
  },
  "must_be_at_least_width_x_height_px_41dc825e": {
    "message": "Ha de ser de { width } × { height }píxels com a mínim"
  },
  "my_files_2f621040": { "message": "Els meus fitxers" },
  "n_th_root_9991a6e4": { "message": "Arrel elevada a la N potència" },
  "nabla_1e216d25": { "message": "Nabla" },
  "name_1aed4a1b": { "message": "Nom" },
  "name_color_ceec76ff": { "message": "{ name } ({ color })" },
  "natural_music_54a70258": { "message": "Natural (música)" },
  "natural_numbers_3da07060": { "message": "Números naturals" },
  "navigate_through_the_menu_or_toolbar_415a4e50": {
    "message": "Navegueu pel menú o per la barra d''eines"
  },
  "nested_greater_than_d852e60d": {
    "message": "Estructura imbricada més gran que"
  },
  "nested_less_than_27d17e58": { "message": "Estructura imbricada inferior a" },
  "next_page_d2a39853": { "message": "Pàgina següent" },
  "no_changes_to_save_d29f6e91": { "message": "No hi ha cap canvi per desar." },
  "no_e16d9132": { "message": "No" },
  "no_file_chosen_9a880793": { "message": "No s''ha triat cap fitxer" },
  "no_preview_is_available_for_this_file_f940114a": {
    "message": "No hi ha cap visualització prèvia disponible per a aquest fitxer."
  },
  "no_results_940393cf": { "message": "Sense resultats." },
  "no_results_found_for_filterterm_ad1b04c8": {
    "message": "No s''ha trobat cap resultat per a { filterTerm }"
  },
  "no_results_found_for_term_1564c08e": {
    "message": "No s''ha trobat cap resultat per a { term }."
  },
  "none_3b5e34d2": { "message": "Cap" },
  "none_selected_b93d56d2": { "message": "No se’n ha seleccionat cap" },
  "not_equal_6e2980e6": { "message": "No és igual que" },
  "not_in_not_an_element_of_fb1ffb54": {
    "message": "No a (no és un element de)"
  },
  "not_negation_1418ebb8": { "message": "No (negació)" },
  "not_subset_dc2b5e84": { "message": "No és un subconjunt" },
  "not_subset_strict_23d282bf": { "message": "No és un subconjunt (estricte)" },
  "not_superset_5556b913": { "message": "No és un superconjunt" },
  "not_superset_strict_24e06f36": {
    "message": "No és un superconjunt (estricte)"
  },
  "nu_1c0f6848": { "message": "Nu" },
  "octagon_e48be9f": { "message": "Octàgon" },
  "olive_6a3e4d6b": { "message": "Oliva" },
  "omega_8f2c3463": { "message": "Omega" },
  "one_of_the_following_styles_must_be_added_to_save__1de769aa": {
    "message": "Per desar una icona, cal afegir un dels estils següents: color de la icona, mida del contorn, text de la icona o imatge."
  },
  "open_circle_e9bd069": { "message": "Cercle obert" },
  "open_this_keyboard_shortcuts_dialog_9658b83a": {
    "message": "Obre aquest quadre de diàleg de dreceres del teclat"
  },
  "open_title_application_fd624fc5": {
    "message": "Obre l’aplicació { title }"
  },
  "operators_a2ef9a93": { "message": "Operadors" },
  "or_9b70ccaa": { "message": "O" },
  "orange_81386a62": { "message": "Taronja" },
  "ordered_and_unordered_lists_cfadfc38": {
    "message": "Llistes ordenades i desordenades"
  },
  "other_editor_shortcuts_may_be_found_at_404aba4a": {
    "message": "Podeu trobar altres dreceres d''editor a"
  },
  "outline_color_3ef2cea7": { "message": "Color del contorn" },
  "outline_size_a6059a21": { "message": "Mida del contorn" },
  "p_is_not_a_valid_protocol_which_must_be_ftp_http_h_adf13fc2": {
    "message": "{ p } no és un protocol vàlid, que ha de ser ftp, http, https, mailto, skype, tel o es pot ometre."
  },
  "pages_e5414c2c": { "message": "Pàgines" },
  "paragraph_5e5ad8eb": { "message": "Paràgraf" },
  "parallel_d55d6e38": { "message": "Paral·lel" },
  "partial_derivative_4a9159df": { "message": "Parcial (derivat)" },
  "pentagon_17d82ea3": { "message": "Pentàgon" },
  "people_b4ebb13c": { "message": "Persones" },
  "percentage_34ab7c2c": { "message": "Percentatge" },
  "percentage_must_be_a_number_8033c341": {
    "message": "El percentatge ha de ser un número."
  },
  "performing_arts_icon_f3497486": {
    "message": "Icona d''arts interpretatives"
  },
  "perpendicular_7c48ede4": { "message": "Perpendicular" },
  "phi_4ac33b6d": { "message": "Fi" },
  "phi_variant_c9bb3ac5": { "message": "Fi (variant)" },
  "physical_education_icon_d7dffd3e": { "message": "Icona d’educació física" },
  "pi_dc4f0bd8": { "message": "Pi" },
  "pi_variant_10f5f520": { "message": "Pi (variant)" },
  "pink_68ad45cb": { "message": "Rosa" },
  "pixels_52ece7d1": { "message": "Píxels" },
  "play_media_comment_35257210": {
    "message": "Reprodueix el comentari multimèdia."
  },
  "play_media_comment_by_name_from_createdat_c230123d": {
    "message": "Reprodueix el comentari multimèdia de { name } enviat el { createdAt }."
  },
  "plus_d43cd4ec": { "message": "Més" },
  "plus_minus_f8be2e83": { "message": "Més/menys" },
  "posted_when_a578f5ab": { "message": "Publicat: { when }" },
  "power_set_4f26f316": { "message": "Conjunt potència" },
  "precedes_196b9aef": { "message": "Precedeix a" },
  "precedes_equal_20701e84": { "message": "El precedent és igual que" },
  "preformatted_d0670862": { "message": "Amb format previ" },
  "preview_53003fd2": { "message": "Visualització prèvia" },
  "preview_in_overlay_ed772c46": {
    "message": "Visualització prèvia en superposició"
  },
  "preview_inline_9787330": { "message": "Visualització prèvia en línia" },
  "previous_page_928fc112": { "message": "Pàgina anterior" },
  "prime_917ea60e": { "message": "Primer" },
  "prime_numbers_13464f61": { "message": "Números primers" },
  "product_39cf144f": { "message": "Producte" },
  "proportional_f02800cc": { "message": "Proporcional" },
  "protocol_must_be_ftp_http_https_mailto_skype_tel_o_73beb4f8": {
    "message": "El protocol ha de ser ftp, http, https, mailto, skype, tel o es pot ometre."
  },
  "psi_e3f5f0f7": { "message": "Psi" },
  "published_c944a23d": { "message": "publicat" },
  "published_when_302d8e23": { "message": "Publicat: { when }" },
  "pumpkin_904428d5": { "message": "Carabassa" },
  "purple_7678a9fc": { "message": "Porpra" },
  "quaternions_877024e0": { "message": "Quaternions" },
  "quizzes_7e598f57": { "message": "Proves" },
  "rational_numbers_80ddaa4a": { "message": "Números racionals" },
  "real_numbers_7c99df94": { "message": "Números reals" },
  "real_portion_of_complex_number_7dad33b5": {
    "message": "Porció real (d’un número complex)"
  },
  "record_7c9448b": { "message": "Enregistra" },
  "record_upload_media_5fdce166": {
    "message": "Enregistra o penja l''element multimèdia"
  },
  "red_8258edf3": { "message": "Vermell" },
  "relationships_6602af70": { "message": "Relacions" },
  "religion_icon_246e0be1": { "message": "Icona de religió" },
  "remove_link_d1f2f4d0": { "message": "Elimina l''enllaç" },
  "replace_e61834a7": { "message": "Substitueix" },
  "reset_95a81614": { "message": "Restableix" },
  "resize_ec83d538": { "message": "Canvia la mida" },
  "restore_auto_save_deccd84b": {
    "message": "Voleu restaurar el contingut desat automàticament?"
  },
  "reverse_turnstile_does_not_yield_7558be06": {
    "message": "Trinquet invers (no produeix)"
  },
  "rho_a0244a36": { "message": "Rho" },
  "rho_variant_415245cd": { "message": "Rho (variant)" },
  "rich_content_editor_2708ef21": { "message": "Editor de contingut enriquit" },
  "rich_text_area_press_alt_0_for_rich_content_editor_9d23437f": {
    "message": "Àrea de text enriquit. Premeu ALT+0 per accedir a les dreceres de l’editor de contingut enriquit."
  },
  "right_align_39e7a32a": { "message": "Alineació dreta" },
  "right_angle_bracket_d704e2d6": { "message": "Parèntesi angular dret" },
  "right_arrow_35e0eddf": { "message": "Fletxa dreta" },
  "right_arrow_with_hook_29d92d31": { "message": "Fletxa dreta amb ganxo" },
  "right_ceiling_839dc744": { "message": "Valor màxim dret" },
  "right_curly_brace_5159d5cd": { "message": "Clau dreta" },
  "right_downward_harpoon_arrow_d71b114f": {
    "message": "Fletxa descendent dreta amb arpó"
  },
  "right_floor_5392d5cf": { "message": "Terra dret" },
  "right_to_left_9cfb092a": { "message": "Dreta a esquerra" },
  "right_upward_harpoon_arrow_f5a34c73": {
    "message": "Fletxa ascendent dreta amb arpó"
  },
  "rightward_arrow_32932107": { "message": "Fletxa ascendent" },
  "rightward_pointing_triangle_60330f5c": {
    "message": "Triangle d’orientació dreta"
  },
  "rotate_image_90_degrees_2ab77c05": { "message": "Gira la imatge -90 graus" },
  "rotate_image_90_degrees_6c92cd42": { "message": "Gira la imatge 90 graus" },
  "rotation_9699c538": { "message": "Rotació" },
  "sadly_the_pretty_html_editor_is_not_keyboard_acces_50da7665": {
    "message": "Malauradament, no es pot accedir a l’editor de dades HTML processades amb el teclat. Accediu a l’editor de dades HTML sense processar aquí."
  },
  "save_11a80ec3": { "message": "Desa" },
  "saved_icon_maker_icons_df86e2a1": {
    "message": "Icones de l’eina de creació d’icones desades"
  },
  "script_l_42a7b254": { "message": "Script L" },
  "search_280d00bd": { "message": "Cerca" },
  "search_term_b2d2235": { "message": "Terme de cerca" },
  "select_crop_shape_d441feeb": {
    "message": "Selecciona l’opció Retalla la forma"
  },
  "select_language_7c93a900": { "message": "Selecciona l''idioma" },
  "selected_274ce24f": { "message": "Seleccionat" },
  "selected_linkfilename_c093b1f2": {
    "message": "{ linkFileName } seleccionat"
  },
  "set_minus_b46e9b88": { "message": "Conjunt menys" },
  "sharp_music_ab956814": { "message": "Sostingut (música)" },
  "shift_o_to_open_the_pretty_html_editor_55ff5a31": {
    "message": "Premeu Maj+O per obrir l''editor de dades HTML processades."
  },
  "show_audio_options_b489926b": { "message": "Mostra les opcions de so" },
  "show_image_options_1e2ecc6b": { "message": "Mostra les opcions d''imatge" },
  "show_link_options_545338fd": { "message": "Mostra les opcions d''enllaç" },
  "show_video_options_6ed3721a": { "message": "Mostra les opcions de vídeo" },
  "sigma_5c35e553": { "message": "Sigma" },
  "sigma_variant_8155625": { "message": "Sigma (variant)" },
  "single_color_image_4e5d4dbc": { "message": "Imatge d’un sol color" },
  "single_color_image_color_95fa9a87": {
    "message": "Color de la imatge d’un sol color"
  },
  "size_b30e1077": { "message": "Mida" },
  "size_of_caption_file_is_greater_than_the_maximum_m_bff5f86e": {
    "message": "La mida del fitxer de subtítols és superior a la mida màxima de { max } kB permesa per als fitxers."
  },
  "small_b070434a": { "message": "Petita" },
  "solid_circle_9f061dfc": { "message": "Cercle sòlid" },
  "something_went_wrong_89195131": { "message": "Alguna cosa no ha anat bé." },
  "something_went_wrong_and_i_don_t_know_what_to_show_e0c54ec8": {
    "message": "Alguna cosa no ha anat bé i no sé què puc mostrar-te."
  },
  "something_went_wrong_check_your_connection_reload__c7868286": {
    "message": "Alguna cosa no ha anat bé. Comproveu la connexió, torneu a carregar la pàgina i proveu-ho de nou."
  },
  "something_went_wrong_d238c551": { "message": "Alguna cosa no ha anat bé" },
  "sort_by_e75f9e3e": { "message": "Ordena per" },
  "spades_suit_b37020c2": { "message": "Piques (coll de cartes)" },
  "square_511eb3b3": { "message": "Quadrat" },
  "square_cap_9ec88646": { "message": "Tapa quadrada" },
  "square_cup_b0665113": { "message": "Tassa quadrada" },
  "square_root_e8bcbc60": { "message": "Arrel quadrada" },
  "square_root_symbol_d0898a53": { "message": "Símbol d’arrel quadrada" },
  "square_subset_17be67cb": { "message": "Subconjunt quadrat" },
  "square_subset_strict_7044e84f": {
    "message": "Subconjunt quadrat (estricte)"
  },
  "square_superset_3be8dae1": { "message": "Superconjunt quadrat" },
  "square_superset_strict_fa4262e4": {
    "message": "Superconjunt quadrat (estricte)"
  },
  "square_unordered_list_b15ce93b": {
    "message": "marca amb un quadrat la llista desordenada"
  },
  "star_8d156e09": { "message": "Marca amb una estrella" },
  "steel_blue_14296f08": { "message": "Blau acer" },
  "styles_2aa721ef": { "message": "Estils" },
  "submit_a3cc6859": { "message": "Entrega" },
  "subscript_59744f96": { "message": "Subíndex" },
  "subset_19c1a92f": { "message": "Subconjunt" },
  "subset_strict_8d8948d6": { "message": "Subconjunt (estricte)" },
  "succeeds_9cc31be9": { "message": "Succeeix a" },
  "succeeds_equal_158e8c3a": { "message": "El succeïdor és igual que" },
  "sum_b0842d31": { "message": "Suma" },
  "superscript_8cb349a2": { "message": "Superíndex" },
  "superscript_and_subscript_37f94a50": { "message": "Superíndex i subíndex" },
  "superset_c4db8a7a": { "message": "Superconjunt" },
  "superset_strict_c77dd6d2": { "message": "Superconjunt (estricte)" },
  "supported_file_types_srt_or_webvtt_7d827ed": {
    "message": "Tipus de fitxer admesos: SRT o WebVTT"
  },
  "switch_to_pretty_html_editor_a3cee15f": {
    "message": "Canvieu a l’editor de dades HTML processades"
  },
  "switch_to_raw_html_editor_f970ae1a": {
    "message": "Canvieu a l’editor de dades HTML sense processar"
  },
  "switch_to_the_html_editor_146dfffd": {
    "message": "Canvia a l’editor d’HTML"
  },
  "switch_to_the_rich_text_editor_63c1ecf6": {
    "message": "Canvia a l’editor de text enriquit"
  },
  "syllabus_f191f65b": { "message": "Temari" },
  "tab_arrows_4cf5abfc": { "message": "TAB/fletxes" },
  "tau_880974b7": { "message": "Tau" },
  "teal_f729a294": { "message": "Verd blavós" },
  "text_7f4593da": { "message": "Text" },
  "text_background_color_16e61c3f": { "message": "Color de fons del text" },
  "text_color_acf75eb6": { "message": "Color del text" },
  "text_optional_384f94f7": { "message": "Text (opcional)" },
  "text_position_8df8c162": { "message": "Posició del text" },
  "text_size_887c2f6": { "message": "Mida del text" },
  "the_document_preview_is_currently_being_processed__7d9ea135": {
    "message": "La visualització prèvia del document s''està processant actualment. Torneu a provar-ho més endavant."
  },
  "the_material_is_in_the_public_domain_279c39a3": {
    "message": "El material és de domini públic"
  },
  "the_material_is_licensed_under_creative_commons_3242cb5e": {
    "message": "El material té una llicència de Creative Commons"
  },
  "the_material_is_subject_to_an_exception_e_g_fair_u_a39c8ca2": {
    "message": "El material està subjecte una excepció: p. ex. ús raonable, dret a quota o d''altres sota les lleis de copyright aplicables"
  },
  "the_pretty_html_editor_is_not_keyboard_accessible__d6d5d2b": {
    "message": "No es pot accedir a l’editor de dades HTML processades amb el teclat. Premeu Maj+O per obrir l''editor de dades HTML sense processar."
  },
  "therefore_d860e024": { "message": "Per tant" },
  "theta_ce2d2350": { "message": "Theta" },
  "theta_variant_fff6da6f": { "message": "Theta (variant)" },
  "thick_downward_arrow_b85add4c": { "message": "Fletxa descendent gruixuda" },
  "thick_left_arrow_d5f3e925": { "message": "Fletxa esquerra gruixuda" },
  "thick_leftward_arrow_6ab89880": { "message": "Fletxa esquerra gruixuda" },
  "thick_right_arrow_3ed5e8f7": { "message": "Fletxa dreta gruixuda" },
  "thick_rightward_arrow_a2e1839e": { "message": "Fletxa dreta gruixuda" },
  "thick_upward_arrow_acd20328": { "message": "Fletxa ascendent gruixuda" },
  "this_document_cannot_be_displayed_within_canvas_7aba77be": {
    "message": "Aquest document no es pot visualitzar al Canvas"
  },
  "this_equation_cannot_be_rendered_in_basic_view_9b6c07ae": {
    "message": "Aquesta equació no es pot renderitzar a la Vista bàsica."
  },
  "this_image_is_currently_unavailable_25c68857": {
    "message": "En aquest moment, aquesta imatge no està disponible."
  },
  "though_your_video_will_have_the_correct_title_in_t_90e427f3": {
    "message": "Tot i que el títol del vídeo que es mostra al explorador és el correcte, no hem pogut actualitzar-lo a la base de dades."
  },
  "title_ee03d132": { "message": "Títol" },
  "to_be_posted_when_d24bf7dc": { "message": "S''ha de publicar: { when }" },
  "to_do_when_2783d78f": { "message": "Tasques pendents: { when }" },
  "toggle_summary_group_413df9ac": { "message": "Commuta el grup { summary }" },
  "toggle_tooltip_d3b7cb86": { "message": "Commuta la informació sobre eines" },
  "tools_2fcf772e": { "message": "Eines" },
  "top_66e0adb6": { "message": "Superior" },
  "totalresults_results_found_numdisplayed_results_cu_a0a44975": {
    "message": "S''han trobat { totalResults } resultats; en aquest moment, es mostren { numDisplayed } resultats"
  },
  "tray_839df38a": { "message": "Safata" },
  "triangle_6072304e": { "message": "Triangle" },
  "turnstile_yields_f9e76df1": { "message": "Trinquet (produeix)" },
  "type_control_f9_to_access_image_options_text_a47e319f": {
    "message": "premeu les tecles Control+F9 per accedir a les opcions d''imatge. { text }"
  },
  "type_control_f9_to_access_link_options_text_4ead9682": {
    "message": "premeu les tecles Control+F9 per accedir a les opcions d''enllaç. { text }"
  },
  "type_control_f9_to_access_table_options_text_92141329": {
    "message": "premeu les tecles Control+F9 per accedir a les opcions de taula. { text }"
  },
  "union_e6b57a53": { "message": "Unió" },
  "unpublished_dfd8801": { "message": "no publicat" },
  "untitled_efdc2d7d": { "message": "sense títol" },
  "up_and_left_diagonal_arrow_e4a74a23": {
    "message": "Fletxa ascendent esquerra en diagonal"
  },
  "up_and_right_diagonal_arrow_935b902e": {
    "message": "Fletxa ascendent dreta en diagonal"
  },
  "upload_document_253f0478": { "message": "Penja un document" },
  "upload_file_fd2361b8": { "message": "Penja el fitxer" },
  "upload_image_6120b609": { "message": "Penja una imatge" },
  "upload_media_ce31135a": { "message": "Penja l''element multimèdia" },
  "upload_record_media_e4207d72": {
    "message": "Penja o enregistra l''element multimèdia"
  },
  "uploading_19e8a4e7": { "message": "S''està penjant" },
  "uppercase_alphabetic_ordered_list_3f5aa6b2": {
    "message": "llista ordenada alfabèticament en majúscules"
  },
  "uppercase_delta_d4f4bc41": { "message": "Delta majúscula" },
  "uppercase_gamma_86f492e9": { "message": "Gamma majúscula" },
  "uppercase_lambda_c78d8ed4": { "message": "Lambda majúscula" },
  "uppercase_omega_8aedfa2": { "message": "Omega majúscula" },
  "uppercase_phi_caa36724": { "message": "Fi majúscula" },
  "uppercase_pi_fcc70f5e": { "message": "Pi majúscula" },
  "uppercase_psi_6395acbe": { "message": "Psi majúscula" },
  "uppercase_roman_numeral_ordered_list_853f292b": {
    "message": "llista ordenada amb numeració romana en majúscules"
  },
  "uppercase_sigma_dbb70e92": { "message": "Sigma majúscula" },
  "uppercase_theta_49afc891": { "message": "Theta majúscula" },
  "uppercase_upsilon_8c1e623e": { "message": "Ípsilon majúscula" },
  "uppercase_xi_341e8556": { "message": "Ksi majúscula" },
  "upsilon_33651634": { "message": "Ípsilon" },
  "upward_and_downward_pointing_arrow_fa90a918": {
    "message": "Fletxa amb orientació ascendent i descendent"
  },
  "upward_and_downward_pointing_arrow_thick_d420fdef": {
    "message": "Fletxa amb orientació ascendent i descendent (gruixuda)"
  },
  "upward_arrow_9992cb2d": { "message": "Fletxa ascendent" },
  "upward_pointing_triangle_d078d7cb": {
    "message": "Triangle d’orientació ascendent"
  },
  "url_22a5f3b8": { "message": "URL" },
  "usage_right_ff96f3e2": { "message": "Dret d''ús:" },
  "usage_rights_required_5fe4dd68": { "message": "Drets d''ús (obligatori)" },
  "use_arrow_keys_to_navigate_options_2021cc50": {
    "message": "Utilitzeu les tecles de fletxes per desplaçar-vos per les opcions."
  },
  "use_arrow_keys_to_select_a_shape_c8eb57ed": {
    "message": "Feu servir les tecles de fletxes per seleccionar una forma."
  },
  "use_arrow_keys_to_select_a_size_699a19f4": {
    "message": "Feu servir les tecles de fletxes per seleccionar una mida."
  },
  "use_arrow_keys_to_select_a_text_position_72f9137c": {
    "message": "Feu servir les tecles de fletxes per seleccionar una posició del text."
  },
  "use_arrow_keys_to_select_a_text_size_65e89336": {
    "message": "Feu servir les tecles de fletxes per seleccionar una mida del text."
  },
  "use_arrow_keys_to_select_an_outline_size_e009d6b0": {
    "message": "Feu servir les tecles de fletxes per seleccionar la mida d’un contorn."
  },
  "used_by_screen_readers_to_describe_the_content_of__4f14b4e4": {
    "message": "Els lectors de pantalla l''utilitzen per descriure el contingut d''un { TYPE }"
  },
  "used_by_screen_readers_to_describe_the_content_of__b1e76d9e": {
    "message": "Els lectors de pantalla l''utilitzen per descriure el contingut d''una imatge"
  },
  "used_by_screen_readers_to_describe_the_video_37ebad25": {
    "message": "Els lectors de pantalla l''utilitzen per descriure el vídeo"
  },
  "user_documents_c206e61f": { "message": "Documents de l''usuari" },
  "user_files_78e21703": { "message": "Fitxers de l''usuari" },
  "user_images_b6490852": { "message": "Imatges de l''usuari" },
  "user_media_14fbf656": { "message": "Elements multimèdia de l''usuari" },
  "vector_notation_cf6086ab": { "message": "Vector (notació)" },
  "vertical_bar_set_builder_notation_4300495f": {
    "message": "Barra vertical (notació del creador de conjunts)"
  },
  "vertical_dots_bfb21f14": { "message": "Punts verticals" },
  "video_options_24ef6e5d": { "message": "Opcions de vídeo" },
  "video_options_tray_3b9809a5": { "message": "Safata d''opcions de vídeo" },
  "video_player_for_9e7d373b": { "message": "Reproductor de vídeo per a " },
  "video_player_for_title_ffd9fbc4": {
    "message": "Reproductor de vídeo per a { title }"
  },
  "view_ba339f93": { "message": "Mostra" },
  "view_description_30446afc": { "message": "Mostra la descripció" },
  "view_keyboard_shortcuts_34d1be0b": {
    "message": "Mostra les dreceres del teclat"
  },
  "view_title_description_67940918": {
    "message": "Mostra la descripció de { title }"
  },
  "white_87fa64fd": { "message": "Blanc" },
  "width_492fec76": { "message": "Amplada" },
  "width_and_height_must_be_numbers_110ab2e3": {
    "message": "L''amplada i l''altura han de ser números"
  },
  "width_x_height_px_ff3ccb93": { "message": "{ width } × { height }píxels" },
  "wiki_home_9cd54d0": { "message": "Pàgina d''inici de Wiki" },
  "wreath_product_200b38ef": { "message": "Producte en espiral" },
  "xi_149681d0": { "message": "Ksi" },
  "yes_dde87d5": { "message": "Sí" },
  "you_have_unsaved_changes_in_the_icon_maker_tray_do_e8cf5f1b": {
    "message": "Teniu canvis sense desar a la safata del Creador d’icones. Voleu continuar sense desar aquests canvis?"
  },
  "you_may_not_upload_an_empty_file_11c31eb2": {
    "message": "No podeu penjar cap fitxer buit."
  },
  "your_image_has_been_compressed_for_icon_maker_imag_2e45cd91": {
    "message": "S’ha comprimit la imatge per a Icon Maker. No es comprimiran les imatges de menys de { size } kB."
  },
  "zeta_5ef24f0e": { "message": "Zeta" },
  "zoom_f3e54d69": { "message": "Zoom" },
  "zoom_in_image_bb97d4f": { "message": "Apropa la imatge" },
  "zoom_out_image_d0a0a2ec": { "message": "Allunya la imatge" }
}


formatMessage.addLocale({ca: locale})
