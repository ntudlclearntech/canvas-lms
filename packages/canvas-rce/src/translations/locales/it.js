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
import '../tinymce/it'

const locale = {
  "access_the_pretty_html_editor_37168efe": {
    "message": "Accedi a Editor HTML sicuro"
  },
  "accessibility_checker_b3af1f6c": { "message": "Verifica accessibilità" },
  "action_to_take_b626a99a": { "message": "Azione da intraprendere:" },
  "add_8523c19b": { "message": "Aggiungi" },
  "add_a_caption_2a915239": { "message": "Aggiungi una didascalia" },
  "add_alt_text_for_the_image_48cd88aa": {
    "message": "Aggiungi testo alternativo per l''immagine"
  },
  "add_another_f4e50d57": { "message": "Aggiungi un altro" },
  "add_cc_subtitles_55f0394e": { "message": "Aggiungi CC/Sottotitoli" },
  "add_image_60b2de07": { "message": "Aggiungi Immagine" },
  "additional_considerations_f3801683": {
    "message": "Ulteriori considerazioni"
  },
  "adjacent_links_with_the_same_url_should_be_a_singl_7a1f7f6c": {
    "message": "I link adiacenti con lo stesso URL devono essere un singolo link."
  },
  "aleph_f4ffd155": { "message": "Aleph" },
  "align_11050992": { "message": "Allinea" },
  "alignment_and_lists_5cebcb69": { "message": "Allineamento ed elenchi" },
  "all_4321c3a1": { "message": "Tutto" },
  "all_apps_a50dea49": { "message": "Tutte le app" },
  "alpha_15d59033": { "message": "Alfa" },
  "alphabetical_55b5b4e0": { "message": "Alfabetico" },
  "alt_attribute_text_should_not_contain_more_than_12_e21d4040": {
    "message": "Il testo alternativo degli attributi non deve contenere più di 120 caratteri."
  },
  "alt_text_611fb322": { "message": "Testo alternativo" },
  "amalg_coproduct_c589fb12": { "message": "Amalg (Coprodotto)" },
  "an_error_occured_reading_the_file_ff48558b": {
    "message": "Si è verificato un errore durante la lettura del file"
  },
  "an_error_occurred_making_a_network_request_d1bda348": {
    "message": "Si è verificato un errore durante la creazione di una richiesta di rete"
  },
  "an_error_occurred_uploading_your_media_71f1444d": {
    "message": "Si è verificato un errore durante il caricamento dei file multimediali."
  },
  "and_7fcc2911": { "message": "E" },
  "angle_c5b4ec50": { "message": "Angolo" },
  "announcement_list_da155734": { "message": "Elenco annuncio" },
  "announcements_a4b8ed4a": { "message": "Annunci" },
  "apply_781a2546": { "message": "Applica" },
  "apply_changes_to_all_instances_of_this_icon_maker__2642f466": {
    "message": "Applica modifiche a tutte le istanze di questo produttore icone nel corso"
  },
  "approaches_the_limit_893aeec9": { "message": "Si avvicina al limite" },
  "approximately_e7965800": { "message": "Circa" },
  "apps_54d24a47": { "message": "App" },
  "are_you_sure_you_want_to_cancel_changes_you_made_m_c5210496": {
    "message": "Vuoi annullare? Le modifiche effettuate potrebbero non essere salvate."
  },
  "arrows_464a3e54": { "message": "Frecce" },
  "art_icon_8e1daad": { "message": "Icona art" },
  "aspect_ratio_will_be_preserved_cb5fdfb8": {
    "message": "Le proporzioni verranno mantenute"
  },
  "assignments_1e02582c": { "message": "Compiti" },
  "asterisk_82255584": { "message": "Asterisco" },
  "attributes_963ba262": { "message": "Attributi" },
  "audio_and_video_recording_not_supported_please_use_5ce3f0d7": {
    "message": "Registrazione audio e video non supportata; usa un altro browser."
  },
  "audio_options_feb58e2c": { "message": "Opzioni audio" },
  "audio_options_tray_33a90711": {
    "message": "Area di notifica opzioni audio"
  },
  "audio_player_for_title_20cc70d": {
    "message": "Riproduttore audio di { title }"
  },
  "auto_saved_content_exists_would_you_like_to_load_t_fee528f2": {
    "message": "Contenuto salvataggio automatico esistente. Caricare al suo posto il contenuto salvato automaticamente?"
  },
  "available_folders_694d0436": { "message": "Cartelle disponibili" },
  "backslash_b2d5442d": { "message": "Barra rovesciata" },
  "bar_ec63ed6": { "message": "Barra" },
  "basic_554cdc0a": { "message": "Base" },
  "because_501841b": { "message": "Perché" },
  "below_81d4dceb": { "message": "Sotto" },
  "beta_cb5f307e": { "message": "Beta" },
  "big_circle_16b2e604": { "message": "Cerchio grande" },
  "binomial_coefficient_ea5b9bb7": { "message": "Coefficiente binomiale" },
  "black_4cb01371": { "message": "Nero" },
  "blue_daf8fea9": { "message": "Blu" },
  "bottom_15a2a9be": { "message": "In fondo" },
  "bottom_third_5f5fec1d": { "message": "Terzo inferiore" },
  "bowtie_5f9629e4": { "message": "Farfallino" },
  "brick_f2656265": { "message": "Mattone" },
  "c_2001_acme_inc_283f7f80": { "message": "(c) 2001 Acme Inc." },
  "cancel_caeb1e68": { "message": "Annulla" },
  "cap_product_3a5265a6": { "message": "Cap-prodotto" },
  "center_align_e68d9997": { "message": "Allineamento al centro" },
  "centered_dot_64d5e378": { "message": "Punto centrato" },
  "centered_horizontal_dots_451c5815": {
    "message": "Punti orizzontali centrati"
  },
  "change_alt_text_92654906": { "message": "Cambia testo alternativo" },
  "change_heading_tag_to_paragraph_a61e3113": {
    "message": "Cambia tag di intestazione in paragrafo"
  },
  "change_only_this_heading_s_level_903cc956": {
    "message": "Cambia solo il livello di questa intestazione"
  },
  "change_text_color_1aecb912": { "message": "Cambia colore del testo" },
  "changes_you_made_may_not_be_saved_4e8db973": {
    "message": "Le modifiche effettuate potrebbero non essere salvate."
  },
  "characters_9d897d1c": { "message": "Caratteri" },
  "characters_no_spaces_485e5367": { "message": "Caratteri (senza spazi)" },
  "check_accessibility_3c78211c": { "message": "Verifica l''accessibilità" },
  "checking_for_accessibility_issues_fac18c6d": {
    "message": "Verifica i problemi di accessibilità"
  },
  "chi_54a32644": { "message": "Chi" },
  "choose_caption_file_9c45bc4e": {
    "message": "Scegli un file di sottotitoli"
  },
  "choose_usage_rights_33683854": {
    "message": "Scegli diritti di utilizzo..."
  },
  "circle_484abe63": { "message": "Cerchio" },
  "circle_unordered_list_9e3a0763": {
    "message": "cerchia elenco non ordinato"
  },
  "clear_2084585f": { "message": "Cancella" },
  "clear_image_3213fe62": { "message": "Cancella immagine" },
  "clear_selected_file_82388e50": { "message": "Cancella file selezionato" },
  "clear_selected_file_filename_2fe8a58e": {
    "message": "Cancella file selezionato: { filename }"
  },
  "click_or_shift_click_for_the_html_editor_25d70bb4": {
    "message": "Fai clic o Maiusc+clic per l’editor html."
  },
  "click_to_embed_imagename_c41ea8df": {
    "message": "Clicca  per incorporare { imageName }"
  },
  "click_to_hide_preview_3c707763": {
    "message": "Fai clic per nascondere anteprima"
  },
  "click_to_insert_a_link_into_the_editor_c19613aa": {
    "message": "Fai clic per inserire un link nell''editor."
  },
  "click_to_show_preview_faa27051": {
    "message": "Fai clic per mostrare anteprima"
  },
  "close_a_menu_or_dialog_also_returns_you_to_the_edi_739079e6": {
    "message": "Chiudere un menu o una finestra di dialogo. Consente anche di tornare all’area dell’editor"
  },
  "close_accessibility_checker_29d1c51e": {
    "message": "Chiudi verifica accessibilità"
  },
  "close_d634289d": { "message": "Chiudi" },
  "closed_caption_file_must_be_less_than_maxkb_kb_5880f752": {
    "message": "Il file dei sottotitoli chiusi deve essere inferiore a { maxKb } kb"
  },
  "closed_captions_subtitles_e6aaa016": {
    "message": "Didascalie/Sottotitoli chiusi"
  },
  "clubs_suit_c1ffedff": { "message": "Fiori (seme)" },
  "collaborations_5c56c15f": { "message": "Collaborazioni" },
  "collapse_to_hide_types_1ab46d2e": {
    "message": "Riduci per nascondere { types }"
  },
  "color_picker_6b359edf": { "message": "Selettore colori" },
  "color_picker_colorname_selected_ad4cf400": {
    "message": "Selettore colori ({ colorName } selezionato/i)"
  },
  "column_e1ae5c64": { "message": "Colonna" },
  "column_group_1c062368": { "message": "Gruppo di colonne" },
  "complex_numbers_a543d004": { "message": "Numeri complessi" },
  "computer_1d7dfa6f": { "message": "Computer" },
  "congruent_5a244acd": { "message": "Congruente" },
  "contains_311f37b7": { "message": "Contiene" },
  "content_1440204b": { "message": "Contenuto" },
  "content_is_still_being_uploaded_if_you_continue_it_8f06d0cb": {
    "message": "Il contenuto è ancora in fase di caricamento, se continui non sarà incorporato correttamente."
  },
  "content_subtype_5ce35e88": { "message": "Sottocategoria di contenuto" },
  "content_type_2cf90d95": { "message": "Tipo di contenuto" },
  "coproduct_e7838082": { "message": "Coprodotto" },
  "copyright_holder_66ee111": { "message": "Titolare del copyright:" },
  "could_not_insert_content_itemtype_items_are_not_cu_638dfecd": {
    "message": "Impossibile inserire il contenuto: Gli elementi \"{ itemType }\" non sono attualmente supportati in Canvas."
  },
  "count_40eced3b": { "message": "Conteggio" },
  "count_plural_0_0_words_one_1_word_other_words_acf32eca": {
    "message": "{ count, plural,\n     =0 {0 parole}\n    one {1 parola}\n  other {# parole}\n}"
  },
  "count_plural_one_item_loaded_other_items_loaded_857023b7": {
    "message": "{ count, plural,\n    one {# elemento caricato}\n  other {# elementi caricati}\n}"
  },
  "course_documents_104d76e0": { "message": "Documenti del corso" },
  "course_files_62deb8f8": { "message": "File del corso" },
  "course_files_a31f97fc": { "message": "File corso" },
  "course_images_f8511d04": { "message": "Immagini del corso" },
  "course_link_b369426": { "message": "Link corso" },
  "course_links_b56959b9": { "message": "Link al corso" },
  "course_media_ec759ad": { "message": "File multimediali del corso" },
  "course_navigation_dd035109": { "message": "Esplorazione corso" },
  "create_icon_110d6463": { "message": "Crea icona" },
  "create_icon_maker_icon_c716bffe": {
    "message": "Crea icona produttore icone"
  },
  "creative_commons_license_725584ae": {
    "message": "Licenza Creative Commons:"
  },
  "crop_image_41bf940c": { "message": "Ritaglia immagine" },
  "crop_image_807ebb08": { "message": "Ritaglia immagine" },
  "cup_product_14174434": { "message": "Cup-prodotto" },
  "current_image_f16c249c": { "message": "Immagine attuale" },
  "current_volume_level_c55ab825": { "message": "Livello di volume corrente" },
  "custom_6979cd81": { "message": "Personalizzato" },
  "cyan_c1d5f68a": { "message": "Ciano" },
  "dagger_57e0f4e5": { "message": "Spada" },
  "date_added_ed5ad465": { "message": "Data aggiunta" },
  "decorative_icon_9a7f3fc3": { "message": "Icona decorativa" },
  "decorative_image_fde98579": { "message": "Immagine decorativa" },
  "decorative_type_upper_f2c95e3": { "message": "{ TYPE_UPPER } decorativo" },
  "decrease_indent_d9cf469d": { "message": "Riduci rientro" },
  "deep_purple_bb3e2907": { "message": "Viola scuro" },
  "default_bulleted_unordered_list_47079da8": {
    "message": "elenco non ordinato puntato predefinito"
  },
  "default_numerical_ordered_list_48dd3548": {
    "message": "elenco ordinato numericamente predefinito"
  },
  "definite_integral_fe7ffed1": { "message": "Integrale definito" },
  "degree_symbol_4a823d5f": { "message": "Simbolo dei gradi" },
  "delimiters_4db4840d": { "message": "Delimitatori" },
  "delta_53765780": { "message": "Delta" },
  "describe_the_icon_f6a18823": { "message": "(Descrivi l’icona)" },
  "describe_the_type_ff448da5": { "message": "(Descrivi { TYPE })" },
  "describe_the_video_2fe8f46a": { "message": "(Descrivi il video)" },
  "description_436c48d7": { "message": "Descrizione" },
  "details_98a31b68": { "message": "Dettagli" },
  "diagonal_dots_7d71b57e": { "message": "Punti diagonali" },
  "diamond_b8dfe7ae": { "message": "Rombo" },
  "diamonds_suit_526abaaf": { "message": "Quadri (seme)" },
  "digamma_258ade94": { "message": "Digamma" },
  "dimension_type_f5fa9170": { "message": "Tipo di dimensione" },
  "dimensions_45ddb7b7": { "message": "Dimensioni" },
  "directionality_26ae9e08": { "message": "Direzionalità" },
  "directly_edit_latex_b7e9235b": { "message": "Modifica direttamente LaTeX" },
  "disable_preview_222bdf72": { "message": "Disabilita anteprima" },
  "discussions_a5f96392": { "message": "Discussioni" },
  "discussions_index_6c36ced": { "message": "Indice discussioni" },
  "disjoint_union_e74351a8": { "message": "Unione non contigua" },
  "display_options_315aba85": { "message": "Visualizza opzioni" },
  "display_text_link_opens_in_a_new_tab_75e9afc9": {
    "message": "Visualizza collegamento testuale (Si apre in una nuova scheda)"
  },
  "division_sign_72190870": { "message": "Segno della divisione" },
  "document_678cd7bf": { "message": "Documento" },
  "documents_81393201": { "message": "Documenti" },
  "done_54e3d4b6": { "message": "Fatto" },
  "double_dagger_faf78681": { "message": "Spada doppia" },
  "down_5831a426": { "message": "Giù" },
  "down_and_left_diagonal_arrow_40ef602c": {
    "message": "Freccia diagonale giù e sinistra"
  },
  "down_and_right_diagonal_arrow_6ea0f460": {
    "message": "Freccia diagonale giù e destra"
  },
  "download_filename_2baae924": { "message": "Scarica { filename }" },
  "downward_arrow_cca52012": { "message": "Freccia giù" },
  "downward_pointing_triangle_2a12a601": {
    "message": "Triangolo che punta verso il basso"
  },
  "drag_a_file_here_1bf656d5": { "message": "Trascina qui un file" },
  "drag_and_drop_or_click_to_browse_your_computer_60772d6d": {
    "message": "Trascina la selezione o fai clic per cercare nel tuo computer"
  },
  "drag_handle_use_up_and_down_arrows_to_resize_e29eae5c": {
    "message": "Trascinare la maniglia. Usa frecce su e giù per ridimensionare"
  },
  "due_multiple_dates_cc0ee3f5": { "message": "Scadenza: Più date" },
  "due_when_7eed10c6": { "message": "Scadenza: { when }" },
  "edit_alt_text_for_this_icon_instance_9c6fc5fd": {
    "message": "Modifica il testo alternativo per questa istanza di icona"
  },
  "edit_c5fbea07": { "message": "Modifica" },
  "edit_course_link_5a5c3c59": { "message": "Modifica collegamento al corso" },
  "edit_equation_f5279959": { "message": "Modifica equazione" },
  "edit_existing_icon_maker_icon_5d0ebb3f": {
    "message": "Modifica icona produttore icone esistente"
  },
  "edit_icon_2c6b0e91": { "message": "Icona di modifica" },
  "edit_link_7f53bebb": { "message": "Modifica collegamento" },
  "editor_statusbar_26ac81fc": { "message": "Barra di stato dell’editor" },
  "element_starting_with_start_91bf4c3b": {
    "message": "Elemento che inizia con { start }"
  },
  "embed_828fac4a": { "message": "Incorpora" },
  "embed_code_314f1bd5": { "message": "Incorpora codice" },
  "embed_content_from_external_tool_3397ad2d": {
    "message": "Nidifica contenuto da strumento esterno"
  },
  "embed_image_1080badc": { "message": "Incorpora immagine" },
  "embed_video_a97a64af": { "message": "Incorpora il video" },
  "embedded_content_aaeb4d3d": { "message": "contenuto incorporato" },
  "empty_set_91a92df4": { "message": "Serie vuota" },
  "encircled_dot_8f5e51c": { "message": "Punto inscritto" },
  "encircled_minus_72745096": { "message": "Meno inscritto" },
  "encircled_plus_36d8d104": { "message": "Più inscritto" },
  "encircled_times_5700096d": { "message": "Tempi inscritti" },
  "engineering_icon_f8f3cf43": { "message": "Icona Progettazione" },
  "english_icon_25bfe845": { "message": "Icona Inglese" },
  "enter_at_least_3_characters_to_search_4f037ee0": {
    "message": "Inserisci almeno 3 caratteri per la ricerca"
  },
  "epsilon_54bb8afa": { "message": "Epsilon" },
  "epsilon_variant_d31f1e77": { "message": "Epsilon (variante)" },
  "equals_sign_c51bdc58": { "message": "Segno uguale" },
  "equation_1c5ac93c": { "message": "Equazione" },
  "equation_editor_39fbc3f1": { "message": "Editor equazione" },
  "equilibrium_6ff3040b": { "message": "Equilibrio" },
  "equivalence_class_7b0f11c0": { "message": "Classe di equivalenza" },
  "equivalent_identity_654b3ce5": { "message": "Equivalente (identità)" },
  "eta_b8828f99": { "message": "Eta" },
  "exists_2e62bdaa": { "message": "Esiste" },
  "exit_fullscreen_b7eb0aa4": { "message": "Esci da modalità schermo intero" },
  "expand_preview_by_default_2abbf9f8": {
    "message": "Espandi anteprima per impostazione predefinita"
  },
  "expand_to_see_types_f5d29352": { "message": "Espandi per vedere { types }" },
  "external_link_d3f9e62a": { "message": "Link esterno" },
  "external_tool_frame_70b32473": { "message": "Frame strumento esterno" },
  "external_tools_6e77821": { "message": "Strumenti esterni" },
  "extra_large_b6cdf1ff": { "message": "Extra Large" },
  "extra_small_9ae33252": { "message": "Extra piccola" },
  "extracurricular_icon_67c8ca42": { "message": "Icona Extracurricolare" },
  "f_function_fe422d65": { "message": "F (funzione)" },
  "failed_getting_file_contents_e9ea19f4": {
    "message": "Impossibile ottenere contenuto file"
  },
  "failed_to_retrieve_content_from_external_tool_5899c213": {
    "message": "Impossibile recuperare il contenuto dallo strumento esterno"
  },
  "file_name_8fd421ff": { "message": "Nome file" },
  "file_storage_quota_exceeded_b7846cd1": {
    "message": "Quota spazio di archiviazione file superata"
  },
  "file_url_c12b64be": { "message": "URL file" },
  "filename_file_icon_602eb5de": { "message": "Icona file { filename }" },
  "filename_image_preview_6cef8f26": {
    "message": "Anteprima immagine { filename }"
  },
  "filename_text_preview_e41ca2d8": {
    "message": "Anteprima testo { filename }"
  },
  "files_c300e900": { "message": "File" },
  "files_index_af7c662b": { "message": "Indice file" },
  "finish_bc343002": { "message": "Termina" },
  "fix_heading_hierarchy_f60884c4": {
    "message": "Correggi gerarchia intestazioni"
  },
  "flat_music_76d5a5c3": { "message": "Bemolle (musica)" },
  "focus_element_options_toolbar_18d993e": {
    "message": "Barra degli strumenti delle opzioni degli elementi di messa a fuoco"
  },
  "folder_tree_fbab0726": { "message": "Struttura ad albero delle cartelle" },
  "for_all_b919f972": { "message": "Per tutti" },
  "format_4247a9c5": { "message": "Formato" },
  "format_as_a_list_142210c3": { "message": "Formatta come elenco" },
  "formatting_5b143aa8": { "message": "Formattazione in corso" },
  "forward_slash_3f90f35e": { "message": "Barra" },
  "found_auto_saved_content_3f6e4ca5": {
    "message": "Trovato contenuto salvato automaticamente"
  },
  "found_count_plural_0_results_one_result_other_resu_46aeaa01": {
    "message": "Trovati { count, plural,\n     =0 {# risultati}\n    one {# risultato}\n  other {# risultati}\n}"
  },
  "fraction_41bac7af": { "message": "Frazione" },
  "fullscreen_873bf53f": { "message": "Tutto schermo" },
  "gamma_1767928": { "message": "Gamma" },
  "generating_preview_45b53be0": {
    "message": "Generazione anteprima in corso..."
  },
  "gif_png_format_images_larger_than_size_kb_are_not__7af3bdbd": {
    "message": "Al momento le immagini in formato GIF/PNG più grandi di { size } KB non sono supportate.."
  },
  "go_to_the_editor_s_menubar_e6674c81": {
    "message": "Vai alla barra dei menu dell''editor"
  },
  "go_to_the_editor_s_toolbar_a5cb875f": {
    "message": "Vai alla barra degli strumenti dell''editor"
  },
  "grades_a61eba0a": { "message": "Voti" },
  "greater_than_e98af662": { "message": "Maggiore di" },
  "greater_than_or_equal_b911949a": { "message": "Maggiore di o uguale a" },
  "greek_65c5b3f7": { "message": "Greco" },
  "green_15af4778": { "message": "Verde" },
  "grey_a55dceff": { "message": "Grigio" },
  "group_documents_8bfd6ae6": { "message": "Documenti di gruppo" },
  "group_files_4324f3df": { "message": "File di gruppo" },
  "group_files_82e5dcdb": { "message": "File gruppo" },
  "group_images_98e0ac17": { "message": "Immagini di gruppo" },
  "group_isomorphism_45b1458c": { "message": "Isomorfismo di gruppo" },
  "group_link_63e626b3": { "message": "Link gruppo" },
  "group_links_9493129e": { "message": "Gruppo link" },
  "group_media_2f3d128a": { "message": "Supporto multimediale di gruppo" },
  "group_navigation_99f191a": { "message": "Esplorazione gruppo" },
  "h_bar_bb94deae": { "message": "Barra H" },
  "hat_ea321e35": { "message": "Hat" },
  "header_column_f27433cb": { "message": "Colonna intestazione" },
  "header_row_and_column_ec5b9ec": {
    "message": "Riga e colonna di intestazione"
  },
  "header_row_f33eb169": { "message": "Riga di intestazione" },
  "heading_2_5b84eed2": { "message": "Intestazione 2" },
  "heading_3_2c83de44": { "message": "Intestazione 3" },
  "heading_4_b2e74be7": { "message": "Intestazione 4" },
  "heading_levels_should_not_be_skipped_3947c0e0": {
    "message": "I livelli di intestazione non devono essere ignorati."
  },
  "heading_starting_with_start_42a3e7f9": {
    "message": "Intestazione che inizia con { start }"
  },
  "headings_should_not_contain_more_than_120_characte_3c0e0cb3": {
    "message": "Le intestazioni non devono contenere più di 120 caratteri."
  },
  "health_icon_8d292eb5": { "message": "Icona Salute" },
  "hearts_suit_e50e04ca": { "message": "Cuori (seme)" },
  "height_69b03e15": { "message": "Altezza" },
  "hexagon_d8468e0d": { "message": "Esagono" },
  "hide_description_bfb5502e": { "message": "Nascondi descrizione" },
  "hide_title_description_caf092ef": {
    "message": "Nascondi descrizione { title }"
  },
  "highlight_an_element_to_activate_the_element_optio_60e1e56b": {
    "message": "Evidenzia un elemento per attivare la barra degli strumenti delle opzioni elemento"
  },
  "home_351838cd": { "message": "Home" },
  "html_code_editor_fd967a44": { "message": "editor codice html" },
  "html_editor_fb2ab713": { "message": "Editor HTML" },
  "i_have_obtained_permission_to_use_this_file_6386f087": {
    "message": "Ho ottenuto l''autorizzazione a utilizzare questo file."
  },
  "i_hold_the_copyright_71ee91b1": {
    "message": "Sono il proprietario del copyright"
  },
  "icon_215a1dc6": { "message": "Icona" },
  "icon_8168b2f8": { "message": "icona" },
  "icon_color_b86dd6d6": { "message": "Icona Colore" },
  "icon_maker_icons_cc560f7e": { "message": "Icone produttore icone" },
  "icon_options_7e32746e": { "message": "Opzioni icona" },
  "icon_options_tray_2b407977": { "message": "Barra delle opzioni icona" },
  "icon_preview_1782a1d9": { "message": "Anteprima icone" },
  "icon_shape_30b61e7": { "message": "Forma icona" },
  "icon_size_9353edea": { "message": "Dimensione icona" },
  "if_left_empty_link_text_will_display_as_course_lin_2a34eedb": {
    "message": "Se lasciato vuoto, il testo del link sarà visualizzato come nome del link del corso"
  },
  "if_usage_rights_are_required_the_file_will_not_pub_841e276e": {
    "message": "Se sono necessari i Diritti di utilizzo, il file non sarà pubblicato finché abilitato nella pagina File."
  },
  "if_you_do_not_select_usage_rights_now_this_file_wi_14e07ab5": {
    "message": "Se non selezioni i diritti di utilizzo ora, questo file sarà in stato \"non pubblicato\" dopo il caricamento."
  },
  "image_8ad06": { "message": "Immagine" },
  "image_c1c98202": { "message": "immagine" },
  "image_filenames_should_not_be_used_as_the_alt_attr_bcfd7780": {
    "message": "I nomi dei file immagine non devono essere utilizzati come attributo alternativo che descrive il contenuto dell''immagine."
  },
  "image_options_5412d02c": { "message": "Opzioni immagine" },
  "image_options_tray_90a46006": { "message": "Barra opzioni immagine" },
  "image_to_crop_3a34487d": { "message": "Immagine da ritagliare" },
  "image_with_filename_file_aacd7180": {
    "message": "Immagine con nome file { file }"
  },
  "images_7ce26570": { "message": "Immagini" },
  "images_should_include_an_alt_attribute_describing__b86d6a86": {
    "message": "Le immagini devono includere un attributo alternativo che descrive il contenuto dell''immagine."
  },
  "imaginary_portion_of_complex_number_2c733ffa": {
    "message": "Porzione immaginaria (di numero complesso)"
  },
  "in_element_of_19ca2f33": { "message": "In (elemento di)" },
  "increase_indent_6af90f7c": { "message": "Aumenta rientro" },
  "indefinite_integral_6623307e": { "message": "Integrale indefinito" },
  "indigo_2035fc55": { "message": "Indaco" },
  "inference_fed5c960": { "message": "Inferenza" },
  "infinity_7a10f206": { "message": "Infinità" },
  "insert_593145ef": { "message": "Inserisci" },
  "insert_link_6dc23cae": { "message": "Inserisci link" },
  "insert_math_equation_57c6e767": {
    "message": "Inserisci equazione matematica"
  },
  "integers_336344e1": { "message": "Numeri interi" },
  "intersection_cd4590e4": { "message": "Intersezione" },
  "invalid_entry_f7d2a0f5": { "message": "Voce non valida." },
  "invalid_file_c11ba11": { "message": "File non valido" },
  "invalid_file_type_881cc9b2": { "message": "Tipo file non valido" },
  "invalid_url_cbde79f": { "message": "URL non valido" },
  "iota_11c932a9": { "message": "Iota" },
  "issue_num_total_f94536cf": { "message": "Problema { num }/{ total }" },
  "kappa_2f14c816": { "message": "Kappa" },
  "kappa_variant_eb64574b": { "message": "Kappa (variante)" },
  "keyboard_shortcuts_ed1844bd": { "message": "Scelte rapide da tastiera" },
  "keyboards_navigate_to_links_using_the_tab_key_two__5fab8c82": {
    "message": "Le tastiere indirizzano ai link utilizzando il tasto TAB. Due link adiacenti che indirizzando alla stessa destinazione possono confondere gli utenti della tastiera."
  },
  "lambda_4f602498": { "message": "Lambda" },
  "language_arts_icon_a798b0f8": { "message": "Icona Studio della lingua" },
  "languages_icon_9d20539": { "message": "Icona Lingue" },
  "large_9c5e80e7": { "message": "Grande" },
  "learn_more_about_adjacent_links_2cb9762c": {
    "message": "Per saperne di più sui link adiacenti"
  },
  "learn_more_about_color_contrast_c019dfb9": {
    "message": "Per saperne di più sul contrasto di colore"
  },
  "learn_more_about_organizing_page_headings_8a7caa2e": {
    "message": "Per saperne di più sull''organizzazione delle intestazioni di pagina"
  },
  "learn_more_about_proper_page_heading_structure_d2959f2d": {
    "message": "Per saperne di più sulla struttura di intestazione pagina appropriata"
  },
  "learn_more_about_table_headers_5f5ee13": {
    "message": "Per saperne di più sulle intestazioni delle tabelle"
  },
  "learn_more_about_using_alt_text_for_images_5698df9a": {
    "message": "Per saperne di più sull''utilizzo di testo alternativo per le immagini"
  },
  "learn_more_about_using_captions_with_tables_36fe496f": {
    "message": "Per saperne di più sull''uso delle didascalie con tabelle"
  },
  "learn_more_about_using_filenames_as_alt_text_264286af": {
    "message": "Per saperne di più sull''utilizzo dei nomi dei file come testo alternativo"
  },
  "learn_more_about_using_lists_4e6eb860": {
    "message": "Per saperne di più sull''uso degli elenchi"
  },
  "learn_more_about_using_scope_attributes_with_table_20df49aa": {
    "message": "Per saperne di più sull''uso degli attributi dell''ambito con le tabelle"
  },
  "leave_as_is_4facfe55": { "message": "Lascia così" },
  "left_3ea9d375": { "message": "Sinistra" },
  "left_align_43d95491": { "message": "Allineamento a sinistra" },
  "left_angle_bracket_c87a6d07": { "message": "Parentesi uncinata aperta" },
  "left_arrow_4fde1a64": { "message": "Freccia sinistra" },
  "left_arrow_with_hook_5bfcad93": { "message": "Freccia sinistra con gancio" },
  "left_ceiling_ee9dd88a": { "message": "Limite massimo sinistro" },
  "left_curly_brace_1726fb4": { "message": "Parentesi graffa aperta" },
  "left_downard_harpoon_arrow_1d7b3d2e": {
    "message": "Mezza freccia sinistra in basso"
  },
  "left_floor_29ac2274": { "message": "Basso sinistro" },
  "left_to_right_e9b4fd06": { "message": "Da sinistra a destra" },
  "left_upward_harpoon_arrow_3a562a96": {
    "message": "Mezza freccia sinistra in alto"
  },
  "leftward_arrow_1e4765de": { "message": "Freccia sinistra" },
  "leftward_pointing_triangle_d14532ce": {
    "message": "Triangolo che punta verso sinistra"
  },
  "less_than_a26c0641": { "message": "Minore di" },
  "less_than_or_equal_be5216cb": { "message": "Minore di o uguale a" },
  "library_icon_ae1e54cf": { "message": "Icona Libreria" },
  "light_blue_5374f600": { "message": "Blu chiaro" },
  "link_7262adec": { "message": "Link" },
  "link_options_a16b758b": { "message": "Opzioni link" },
  "link_with_text_starting_with_start_b3fcbe71": {
    "message": "Link al testo che inizia con { start }"
  },
  "links_14b70841": { "message": "Link" },
  "links_to_an_external_site_de74145d": {
    "message": "Collega a un sito esterno."
  },
  "lists_should_be_formatted_as_lists_f862de8d": {
    "message": "Gli elenchi devono essere formattati come elenchi."
  },
  "load_more_35d33c7": { "message": "Carica altro" },
  "loading_25990131": { "message": "Caricamento in corso..." },
  "loading_bde52856": { "message": "Caricamento" },
  "loading_closed_captions_subtitles_failed_95ceef47": {
    "message": "caricamento didascalie/sottotitoli chiusi non riuscito."
  },
  "loading_external_tool_d839042c": {
    "message": "Caricamento strumento esterno"
  },
  "loading_failed_b3524381": { "message": "Caricamento non riuscito..." },
  "loading_failed_e6a9d8ef": { "message": "Caricamento non riuscito." },
  "loading_folders_d8b5869e": { "message": "Caricamento cartelle" },
  "loading_placeholder_for_filename_792ef5e8": {
    "message": "Caricamento segnaposto per { fileName }"
  },
  "loading_please_wait_d276220a": {
    "message": "Caricamento in corso, attendere"
  },
  "loading_preview_9f077aa1": { "message": "Caricamento dell’anteprima" },
  "locked_762f138b": { "message": "Bloccato" },
  "logical_equivalence_76fca396": { "message": "Equivalenza logica" },
  "logical_equivalence_short_8efd7b4f": {
    "message": "Equivalenza logica (breve)"
  },
  "logical_equivalence_short_and_thick_1e1f654d": {
    "message": "Equivalenza logica (breve e spessa)"
  },
  "logical_equivalence_thick_662dd3f2": {
    "message": "Equivalenza logica (spessa)"
  },
  "low_horizontal_dots_cc08498e": { "message": "Punti orizzontali bassi" },
  "magenta_4a65993c": { "message": "Magenta" },
  "maps_to_e5ef7382": { "message": "Mappe a" },
  "math_icon_ad4e9d03": { "message": "Icona Matematica" },
  "media_af190855": { "message": "Elementi multimediali" },
  "media_file_is_processing_please_try_again_later_58a6d49": {
    "message": "File multimediale in elaborazione. Riprova in seguito."
  },
  "media_title_2112243b": { "message": "Titolo multimediale" },
  "medium_5a8e9ead": { "message": "Medio" },
  "merge_links_2478df96": { "message": "Unisci link" },
  "mic_a7f3d311": { "message": "Microfono" },
  "microphone_disabled_15c83130": { "message": "Microfono disattivato" },
  "middle_27dc1d5": { "message": "Centro" },
  "minimize_file_preview_da911944": {
    "message": "Riduci a icona anteprima file"
  },
  "minimize_video_20aa554b": { "message": "Riduci a icona video" },
  "minus_fd961e2e": { "message": "Meno" },
  "minus_plus_3461f637": { "message": "Meno/Più" },
  "misc_3b692ea7": { "message": "Varie" },
  "miscellaneous_e9818229": { "message": "Varie" },
  "modules_c4325335": { "message": "Moduli" },
  "moving_image_to_crop_directionword_6f66cde2": {
    "message": "Spostamento immagine per ritagliare { directionWord }"
  },
  "mu_37223b8b": { "message": "Mu" },
  "multi_color_image_63d7372f": { "message": "Immagine multicolore" },
  "multiplication_sign_15f95c22": { "message": "Segno della moltiplicazione" },
  "music_icon_4db5c972": { "message": "Icona Musica" },
  "must_be_at_least_percentage_22e373b6": {
    "message": "Deve essere almeno { percentage }%"
  },
  "must_be_at_least_width_x_height_px_41dc825e": {
    "message": "Deve essere almeno { width } x { height }px"
  },
  "my_files_2f621040": { "message": "I miei file" },
  "n_th_root_9991a6e4": { "message": "Radice N" },
  "nabla_1e216d25": { "message": "Nabla" },
  "name_1aed4a1b": { "message": "Nome" },
  "name_color_ceec76ff": { "message": "{ name } ({ color })" },
  "natural_music_54a70258": { "message": "Bequadro (musica)" },
  "natural_numbers_3da07060": { "message": "Numeri naturali" },
  "navigate_through_the_menu_or_toolbar_415a4e50": {
    "message": "Naviga attraverso il menu o la barra degli strumenti"
  },
  "nested_greater_than_d852e60d": { "message": "Nidificato maggiore di" },
  "nested_less_than_27d17e58": { "message": "Nidificato minore di" },
  "next_40e12421": { "message": "Successivo" },
  "no_accessibility_issues_were_detected_f8d3c875": {
    "message": "Nessun problema di accessibilità rilevato."
  },
  "no_changes_to_save_d29f6e91": { "message": "Nessuna modifica da salvare." },
  "no_e16d9132": { "message": "No" },
  "no_file_chosen_9a880793": { "message": "Nessun file scelto" },
  "no_headers_9bc7dc7f": { "message": "Nessuna intestazione" },
  "no_preview_is_available_for_this_file_f940114a": {
    "message": "Nessuna anteprima disponibile per questo file."
  },
  "no_results_940393cf": { "message": "Nessun risultato." },
  "no_results_found_for_filterterm_ad1b04c8": {
    "message": "Nessun risultato trovato per { filterTerm }"
  },
  "no_video_1ed00b26": { "message": "Nessun video" },
  "none_3b5e34d2": { "message": "Nessuno" },
  "none_selected_b93d56d2": { "message": "Nessuna selezionata" },
  "not_equal_6e2980e6": { "message": "Non uguale" },
  "not_in_not_an_element_of_fb1ffb54": {
    "message": "Non in (non un elemento di)"
  },
  "not_negation_1418ebb8": { "message": "Non (negazione)" },
  "not_subset_dc2b5e84": { "message": "Non sottoinsieme" },
  "not_subset_strict_23d282bf": { "message": "Non sottoinsieme (rigido)" },
  "not_superset_5556b913": { "message": "Non sovrainsieme" },
  "not_superset_strict_24e06f36": { "message": "Non sovrainsieme (rigido)" },
  "nu_1c0f6848": { "message": "Nu" },
  "octagon_e48be9f": { "message": "Ottagono" },
  "olive_6a3e4d6b": { "message": "Oliva" },
  "omega_8f2c3463": { "message": "Omega" },
  "one_of_the_following_styles_must_be_added_to_save__1de769aa": {
    "message": "Per salvare un’icona è necessario aggiungere uno dei seguenti stili: Colore icona, Dimensione struttura, Testo icona o Immagine"
  },
  "open_circle_e9bd069": { "message": "Cerchio aperto" },
  "open_this_keyboard_shortcuts_dialog_9658b83a": {
    "message": "Apri questa finestra di dialogo delle scelte rapide da tastiera"
  },
  "open_title_application_fd624fc5": {
    "message": "Apri applicazione { title }"
  },
  "operators_a2ef9a93": { "message": "Operatori" },
  "or_9b70ccaa": { "message": "Oppure" },
  "orange_81386a62": { "message": "Arancione" },
  "ordered_and_unordered_lists_cfadfc38": {
    "message": "Elenchi ordinati e non ordinati"
  },
  "other_editor_shortcuts_may_be_found_at_404aba4a": {
    "message": "Altre scorciatoie dell’editor possono essere trovate in"
  },
  "outline_color_3ef2cea7": { "message": "Colore struttura" },
  "outline_size_a6059a21": { "message": "Dimensione struttura" },
  "p_is_not_a_valid_protocol_which_must_be_ftp_http_h_adf13fc2": {
    "message": "{ p } Non è un protocollo valido che deve essere ftp, http, https, mailto, skype, tel oppure può essere omesso"
  },
  "pages_e5414c2c": { "message": "Pagine" },
  "paragraph_5e5ad8eb": { "message": "Paragrafo" },
  "paragraph_starting_with_start_a59923f8": {
    "message": "Paragrafo che inizia con { start }"
  },
  "parallel_d55d6e38": { "message": "Parallelo" },
  "partial_derivative_4a9159df": { "message": "Parziale (derivato)" },
  "paste_5963d1c1": { "message": "Incolla" },
  "pause_12af3bb4": { "message": "Pausa" },
  "pentagon_17d82ea3": { "message": "Pentagono" },
  "people_b4ebb13c": { "message": "Persone" },
  "percentage_34ab7c2c": { "message": "Percentuale" },
  "percentage_must_be_a_number_8033c341": {
    "message": "La percentuale dev’essere un numero"
  },
  "performing_arts_icon_f3497486": { "message": "Icona Arti dello spettacolo" },
  "perpendicular_7c48ede4": { "message": "Perpendicolare" },
  "phi_4ac33b6d": { "message": "Phi" },
  "phi_variant_c9bb3ac5": { "message": "Phi (variante)" },
  "physical_education_icon_d7dffd3e": { "message": "Icona Educazione fisica" },
  "pi_dc4f0bd8": { "message": "Pi" },
  "pi_variant_10f5f520": { "message": "Pi (variante)" },
  "pink_68ad45cb": { "message": "Rosa" },
  "pixels_52ece7d1": { "message": "Pixel" },
  "play_1a47eaa7": { "message": "Riproduci" },
  "play_media_comment_35257210": {
    "message": "Commento sulla riproduzione del contenuto multimediale."
  },
  "play_media_comment_by_name_from_createdat_c230123d": {
    "message": "Commento sulla riproduzione del contenuto multimediale da parte di { name } da { createdAt }."
  },
  "please_allow_canvas_to_access_your_microphone_and__dc2c3079": {
    "message": "Consenti a Canvas di accedere al tuo microfono e alla tua webcam."
  },
  "plus_d43cd4ec": { "message": "Più" },
  "plus_minus_f8be2e83": { "message": "Più/Meno" },
  "posted_when_a578f5ab": { "message": "Postato: { when }" },
  "power_set_4f26f316": { "message": "Insieme delle parti" },
  "precedes_196b9aef": { "message": "Precede" },
  "precedes_equal_20701e84": { "message": "Precede uguale" },
  "preformatted_d0670862": { "message": "Preformattato" },
  "prev_f82cbc48": { "message": "Precedente" },
  "preview_53003fd2": { "message": "Anteprima" },
  "preview_a3f8f854": { "message": "ANTEPRIMA" },
  "preview_in_overlay_ed772c46": { "message": "Anteprima in sovrapposizione" },
  "preview_inline_9787330": { "message": "Anteprima inline" },
  "prime_917ea60e": { "message": "Primo" },
  "prime_numbers_13464f61": { "message": "Numeri primi" },
  "product_39cf144f": { "message": "Prodotto" },
  "proportional_f02800cc": { "message": "Proporzionale" },
  "protocol_must_be_ftp_http_https_mailto_skype_tel_o_73beb4f8": {
    "message": "Il protocollo deve essere ftp, http, https, mailto, skype, tel oppure può essere omesso"
  },
  "psi_e3f5f0f7": { "message": "Psi" },
  "published_c944a23d": { "message": "pubblicato" },
  "published_when_302d8e23": { "message": "Pubblicato: { when }" },
  "pumpkin_904428d5": { "message": "Zucca" },
  "purple_7678a9fc": { "message": "Viola" },
  "quaternions_877024e0": { "message": "Quaternioni" },
  "quizzes_7e598f57": { "message": "Quiz" },
  "rational_numbers_80ddaa4a": { "message": "Numeri razionali" },
  "real_numbers_7c99df94": { "message": "Numeri reali" },
  "real_portion_of_complex_number_7dad33b5": {
    "message": "Porzione reale (di numero complesso)"
  },
  "record_7c9448b": { "message": "Registra" },
  "record_upload_media_5fdce166": {
    "message": "Registra/Carica file multimediali"
  },
  "recording_98da6bda": { "message": "Registrazione" },
  "red_8258edf3": { "message": "Rosso" },
  "relationships_6602af70": { "message": "Relazioni" },
  "religion_icon_246e0be1": { "message": "Icona Religione" },
  "remove_heading_style_5fdc8855": { "message": "Rimuovi stile intestazione" },
  "remove_link_d1f2f4d0": { "message": "Rimuovi link" },
  "replace_e61834a7": { "message": "Sostituisci" },
  "reset_95a81614": { "message": "Reimposta" },
  "resize_ec83d538": { "message": "Ridimensiona" },
  "restore_auto_save_deccd84b": {
    "message": "Ripristinare salvataggio automatico?"
  },
  "reverse_turnstile_does_not_yield_7558be06": {
    "message": "Barra verticale con barra orizzontale inversa (non si piega)"
  },
  "rho_a0244a36": { "message": "Rho" },
  "rho_variant_415245cd": { "message": "Rho (variante)" },
  "rich_content_editor_2708ef21": { "message": "Editor di contenuti avanzati" },
  "rich_text_area_press_oskey_f8_for_rich_content_edi_c2f651d": {
    "message": "Area di testo RTF. Premere { OSKey }+F8 per scorciatoie di Editor di contenuti avanzati."
  },
  "right_71ffdc4d": { "message": "Destra" },
  "right_align_39e7a32a": { "message": "Allineamento a destra" },
  "right_angle_bracket_d704e2d6": { "message": "Parentesi uncinata chiusa" },
  "right_arrow_35e0eddf": { "message": "Freccia destra" },
  "right_arrow_with_hook_29d92d31": { "message": "Freccia destra con gancio" },
  "right_ceiling_839dc744": { "message": "Limite massimo destro" },
  "right_curly_brace_5159d5cd": { "message": "Parentesi graffa chiusa" },
  "right_downward_harpoon_arrow_d71b114f": {
    "message": "Mezza freccia destra in basso"
  },
  "right_floor_5392d5cf": { "message": "Base destra" },
  "right_to_left_9cfb092a": { "message": "Da destra a sinistra" },
  "right_upward_harpoon_arrow_f5a34c73": {
    "message": "Mezza freccia destra in alto"
  },
  "rightward_arrow_32932107": { "message": "Freccia destra" },
  "rightward_pointing_triangle_60330f5c": {
    "message": "Triangolo che punta verso destra"
  },
  "rotate_image_90_degrees_2ab77c05": {
    "message": "Ruota immagine di -90 gradi"
  },
  "rotate_image_90_degrees_6c92cd42": {
    "message": "Ruota immagine di 90 gradi"
  },
  "rotation_9699c538": { "message": "Rotazione" },
  "row_fc0944a7": { "message": "Riga" },
  "row_group_979f5528": { "message": "Gruppo di righe" },
  "sadly_the_pretty_html_editor_is_not_keyboard_acces_50da7665": {
    "message": "Purtroppo l’editor HTML sicuro non è accessibile dalla tastiera. Accedi qui a editor HTML non elaborato."
  },
  "save_11a80ec3": { "message": "Salva" },
  "save_copy_ca63944e": { "message": "Salva copia" },
  "save_media_cb9e786e": { "message": "Salva file multimediale" },
  "saved_icon_maker_icons_df86e2a1": {
    "message": "Icone produttore icone salvate"
  },
  "screen_readers_cannot_determine_what_is_displayed__6a5842ab": {
    "message": "Gli screen reader non possono determinare cosa viene visualizzato in un''immagine senza testo alternativo e i nomi file sono spesso stringhe di numeri e lettere senza senso che non descrivono il contesto o il significato."
  },
  "screen_readers_cannot_determine_what_is_displayed__6f1ea667": {
    "message": "Gli screen reader non possono determinare cosa viene visualizzato in un''immagine senza testo alternativo, che descrive il contenuto e il significato dell''immagine. Il testo alternativo deve essere semplice e conciso."
  },
  "screen_readers_cannot_determine_what_is_displayed__a57e6723": {
    "message": "Gli screen reader non possono determinare cosa viene visualizzato in un''immagine senza testo alternativo, che descrive il contenuto e il significato dell''immagine."
  },
  "screen_readers_cannot_interpret_tables_without_the_bd861652": {
    "message": "Gli screen reader non possono interpretare le tabelle senza la struttura corretta. Le intestazioni della tabella fornisco indicazioni e ambito del contenuto."
  },
  "screen_readers_cannot_interpret_tables_without_the_e62912d5": {
    "message": "Gli screen reader non possono interpretare le tabelle senza la struttura corretta. Le didascalie della tabella descrivono il contesto e le informazioni generali della tabella."
  },
  "screen_readers_cannot_interpret_tables_without_the_f0bdec0f": {
    "message": "Gli screen reader non possono interpretare le tabelle senza la struttura corretta. Le intestazioni della tabella forniscono indicazioni e panoramica del contenuto."
  },
  "script_l_42a7b254": { "message": "Script L" },
  "search_280d00bd": { "message": "Cerca" },
  "select_audio_source_21043cd5": { "message": "Seleziona sorgente audio" },
  "select_crop_shape_d441feeb": { "message": "Seleziona forma di ritaglio" },
  "select_language_7c93a900": { "message": "Selezionare la lingua" },
  "select_video_source_1b5c9dbe": { "message": "Seleziona sorgente video" },
  "selected_linkfilename_c093b1f2": {
    "message": "{ linkFileName } selezionato"
  },
  "selection_b52c4c5e": { "message": "Selezione" },
  "set_header_scope_8c548f40": { "message": "Imposta ambito di intestazione" },
  "set_minus_b46e9b88": { "message": "Barra inversa" },
  "set_table_header_cfab13a0": { "message": "Imposta intestazione tabella" },
  "sharp_music_ab956814": { "message": "Diesis (musica)" },
  "shift_arrows_4d5785fe": { "message": "MAIUSC+Frecce" },
  "shift_o_to_open_the_pretty_html_editor_55ff5a31": {
    "message": "Maiusc+O per aprire l’editor html sicuro."
  },
  "shortcut_911d6255": { "message": "Scorciatoia" },
  "show_audio_options_b489926b": { "message": "Mostra opzioni audio" },
  "show_image_options_1e2ecc6b": { "message": "Mostra opzioni immagine" },
  "show_link_options_545338fd": { "message": "Mostra opzioni link" },
  "show_studio_media_options_a0c748c6": {
    "message": "Mostra opzioni supporti multimediali Studio"
  },
  "show_video_options_6ed3721a": { "message": "Mostra opzioni video" },
  "sighted_users_browse_web_pages_quickly_looking_for_1d4db0c1": {
    "message": "Gli utenti senza problemi di vista esplorano le pagine web velocemente, cercando intestazioni in grassetto o di grandi dimensioni. Gli utenti di screen reader si affidano alle intestazioni per la comprensione contestuale. Le intestazioni devono utilizzare la struttura appropriata."
  },
  "sighted_users_browse_web_pages_quickly_looking_for_ade806f5": {
    "message": "Gli utenti senza problemi di vista esplorano le pagine web velocemente, cercando intestazioni in grassetto o di grandi dimensioni. Gli utenti di screen reader si affidano alle intestazioni per la comprensione contestuale. Le intestazioni devono essere concise nella struttura appropriata."
  },
  "sigma_5c35e553": { "message": "Sigma" },
  "sigma_variant_8155625": { "message": "Sigma (variante)" },
  "single_color_image_4e5d4dbc": { "message": "Immagine monocolore" },
  "single_color_image_color_95fa9a87": {
    "message": "Colore immagine monocolore"
  },
  "size_b30e1077": { "message": "Dimensioni" },
  "size_of_caption_file_is_greater_than_the_maximum_m_bff5f86e": {
    "message": "La dimensione del file dei sottotitoli è superiore alla dimensione massima consentita di { max } kb."
  },
  "small_b070434a": { "message": "Piccolo" },
  "solid_circle_9f061dfc": { "message": "Cerchio compatto" },
  "something_went_wrong_89195131": { "message": "Si è verificato un errore." },
  "something_went_wrong_accessing_your_webcam_6643b87e": {
    "message": "Si è verificato un errore durante l''accesso alla webcam."
  },
  "something_went_wrong_and_i_don_t_know_what_to_show_e0c54ec8": {
    "message": "Qualcosa è andato storto e non so cosa mostrarti."
  },
  "something_went_wrong_check_your_connection_reload__c7868286": {
    "message": "Si è verificato un errore. Controlla la connessione, ricarica la pagina e riprova."
  },
  "something_went_wrong_d238c551": { "message": "Si è verificato un problema" },
  "something_went_wrong_while_sharing_your_screen_8de579e5": {
    "message": "Si è verificato un problema durante la condivisione della tua schermata."
  },
  "sort_by_e75f9e3e": { "message": "Ordina per" },
  "spades_suit_b37020c2": { "message": "Picche (seme)" },
  "square_511eb3b3": { "message": "Quadrato" },
  "square_cap_9ec88646": { "message": "Intersezione quadra" },
  "square_cup_b0665113": { "message": "Unione quadra" },
  "square_root_e8bcbc60": { "message": "Radice quadrata" },
  "square_root_symbol_d0898a53": { "message": "Simbolo radice quadrata" },
  "square_subset_17be67cb": { "message": "Sottoinsieme quadra" },
  "square_subset_strict_7044e84f": {
    "message": "Sottoinsieme quadra (rigido)"
  },
  "square_superset_3be8dae1": { "message": "Sovrainsieme quadra" },
  "square_superset_strict_fa4262e4": {
    "message": "Sovrainsieme quadra (rigido)"
  },
  "square_unordered_list_b15ce93b": {
    "message": "incornicia elenco non ordinato"
  },
  "star_8d156e09": { "message": "Aggiungi a Speciali" },
  "start_over_f7552aa9": { "message": "Inizia di nuovo" },
  "start_recording_9a65141a": { "message": "Avvia registrazione" },
  "steel_blue_14296f08": { "message": "Blu acciaio" },
  "studio_media_options_ee504361": {
    "message": "Opzioni supporti multimediali Studio"
  },
  "studio_media_options_tray_cfb94654": {
    "message": "Barra delle opzioni supporti multimediali Studio"
  },
  "styles_2aa721ef": { "message": "Stili" },
  "submit_a3cc6859": { "message": "Invia" },
  "subscript_59744f96": { "message": "Pedice" },
  "subset_19c1a92f": { "message": "Sottoinsieme" },
  "subset_strict_8d8948d6": { "message": "Sottoinsieme (rigido)" },
  "succeeds_9cc31be9": { "message": "Segue" },
  "succeeds_equal_158e8c3a": { "message": "Segue uguale" },
  "sum_b0842d31": { "message": "Somma" },
  "superscript_8cb349a2": { "message": "Apice" },
  "superscript_and_subscript_37f94a50": { "message": "Apice e pedice" },
  "superset_c4db8a7a": { "message": "Sovrainsieme" },
  "superset_strict_c77dd6d2": { "message": "Sovrainsieme (rigido)" },
  "supported_file_types_srt_or_webvtt_7d827ed": {
    "message": "Tipi di file supportati: SRT o WebVTT"
  },
  "switch_to_pretty_html_editor_a3cee15f": {
    "message": "Passa a editor HTML sicuro"
  },
  "switch_to_raw_html_editor_f970ae1a": {
    "message": "Passa a editor HTML non elaborato"
  },
  "switch_to_the_html_editor_146dfffd": { "message": "Passa a editor html" },
  "switch_to_the_rich_text_editor_63c1ecf6": {
    "message": "Passa a editor di testo RTF"
  },
  "syllabus_f191f65b": { "message": "Syllabus" },
  "system_audio_allowed_b2508f8c": { "message": "Audio di sistema consentito" },
  "system_audio_disabled_c177bd13": {
    "message": "Audio di sistema disabilitato"
  },
  "tab_arrows_4cf5abfc": { "message": "TAB/Frecce" },
  "table_header_starting_with_start_ffcabba6": {
    "message": "Intestazione tabella che inizia con { start }"
  },
  "table_starting_with_start_e7232848": {
    "message": "Tabella che inizia con { start }"
  },
  "tables_headers_should_specify_scope_5abf3a8e": {
    "message": "Le intestazioni delle tabelle devono specificare l''ambito."
  },
  "tables_should_include_a_caption_describing_the_con_e91e78fc": {
    "message": "Le tabelle devono includere una didascalia che descrive i contenuti della tabella."
  },
  "tables_should_include_at_least_one_header_48779eac": {
    "message": "Le tabelle devono includere almeno un''intestazione."
  },
  "tau_880974b7": { "message": "Tau" },
  "teal_f729a294": { "message": "Verde acqua" },
  "text_7f4593da": { "message": "Testo" },
  "text_background_color_16e61c3f": { "message": "Colore sfondo testo" },
  "text_color_acf75eb6": { "message": "Colore testo" },
  "text_is_difficult_to_read_without_sufficient_contr_69e62bd6": {
    "message": "Il testo è difficile da leggere senza un contrasto sufficiente tra il testo e lo sfondo, specialmente per gli ipovedenti."
  },
  "text_larger_than_18pt_or_bold_14pt_should_display__5c364db6": {
    "message": "Il testo con dimensioni maggiori di 18 pt (o in grassetto 14 pt) deve visualizzare un rapporto di contrasto minimo pari a 3:1."
  },
  "text_optional_384f94f7": { "message": "Testo (opzionale)" },
  "text_position_8df8c162": { "message": "Posizione testo" },
  "text_size_887c2f6": { "message": "Dimensione testo" },
  "text_smaller_than_18pt_or_bold_14pt_should_display_aaffb22b": {
    "message": "Il testo con dimensioni minori di 18 pt (o in grassetto 14 pt) deve visualizzare un rapporto di contrasto minimo pari a 4,5:1."
  },
  "the_document_preview_is_currently_being_processed__7d9ea135": {
    "message": "L''anteprima del documento è attualmente in elaborazione. Riprova in seguito."
  },
  "the_first_heading_on_a_page_should_be_an_h2_859089f2": {
    "message": "La prima intestazione su una pagina deve essere H2."
  },
  "the_following_content_is_partner_provided_ed1da756": {
    "message": "I contenuti seguenti sono forniti dal partner"
  },
  "the_material_is_in_the_public_domain_279c39a3": {
    "message": "Il materiale è nel dominio pubblico"
  },
  "the_material_is_licensed_under_creative_commons_3242cb5e": {
    "message": "Il materiale è concesso in licenza da Creative Commons"
  },
  "the_material_is_subject_to_an_exception_e_g_fair_u_a39c8ca2": {
    "message": "Il materiale è soggetto a eccezioni, per es. l’uso equo, il diritto di citare o altre in base alle leggi applicabili sul diritto d’autore"
  },
  "the_preceding_content_is_partner_provided_d753928c": {
    "message": "I contenuti precedenti sono forniti dal partner"
  },
  "the_pretty_html_editor_is_not_keyboard_accessible__d6d5d2b": {
    "message": "L’editor html sicuro non è accessibile dalla tastiera. Premere Maiusc+O per aprire l’editor html non elaborato."
  },
  "therefore_d860e024": { "message": "Perciò" },
  "theta_ce2d2350": { "message": "Theta" },
  "theta_variant_fff6da6f": { "message": "Theta (variante)" },
  "thick_downward_arrow_b85add4c": { "message": "Freccia giù spessa" },
  "thick_left_arrow_d5f3e925": { "message": "Freccia sinistra spessa" },
  "thick_leftward_arrow_6ab89880": { "message": "Freccia sinistra spessa" },
  "thick_right_arrow_3ed5e8f7": { "message": "Freccia destra spessa" },
  "thick_rightward_arrow_a2e1839e": { "message": "Freccia destra spessa" },
  "thick_upward_arrow_acd20328": { "message": "Freccia su spessa" },
  "this_document_cannot_be_displayed_within_canvas_7aba77be": {
    "message": "Questo documento non può essere visualizzato in Canvas."
  },
  "this_equation_cannot_be_rendered_in_basic_view_9b6c07ae": {
    "message": "Impossibile eseguire il rendering di questa equazione nella visualizzazione base."
  },
  "this_image_is_currently_unavailable_25c68857": {
    "message": "Questa immagine non è attualmente disponibile"
  },
  "though_your_video_will_have_the_correct_title_in_t_90e427f3": {
    "message": "Anche se il tuo video avrà il titolo corretto nel browser, non siamo riusciti ad aggiornarlo nel database."
  },
  "timebar_a4d18443": { "message": "Barra del tempo" },
  "title_ee03d132": { "message": "Titolo" },
  "to_be_posted_when_d24bf7dc": { "message": "Da postare: { when }" },
  "to_do_when_2783d78f": { "message": "Elenco attività: { when }" },
  "toggle_summary_group_413df9ac": {
    "message": "Attiva/Disattiva gruppo { summary }"
  },
  "toggle_tooltip_d3b7cb86": { "message": "Alterna tooltip" },
  "tools_2fcf772e": { "message": "Strumenti" },
  "top_66e0adb6": { "message": "Superiore" },
  "tray_839df38a": { "message": "Barra delle applicazioni" },
  "triangle_6072304e": { "message": "Triangolo" },
  "turnstile_yields_f9e76df1": {
    "message": "Barra verticale con barra orizzontale (si piega)"
  },
  "type_control_f9_to_access_image_options_text_a47e319f": {
    "message": "digita Control F9 per accedere alle opzioni immagine. { text }"
  },
  "type_control_f9_to_access_link_options_text_4ead9682": {
    "message": "digita Control F9 per accedere alle opzioni di collegamento. { text }"
  },
  "type_control_f9_to_access_table_options_text_92141329": {
    "message": "digita Control F9 per accedere alle opzioni di tabella. { text }"
  },
  "unable_to_determine_resource_selection_url_7867e060": {
    "message": "Impossibile determinare l’URL di selezione risorsa"
  },
  "union_e6b57a53": { "message": "Unione" },
  "unpublished_dfd8801": { "message": "non pubblicato" },
  "untitled_16aa4f2b": { "message": "Senza titolo" },
  "untitled_efdc2d7d": { "message": "senza titolo" },
  "up_and_left_diagonal_arrow_e4a74a23": {
    "message": "Freccia diagonale su e sinistra"
  },
  "up_and_right_diagonal_arrow_935b902e": {
    "message": "Freccia diagonale su e destra"
  },
  "up_c553575d": { "message": "Su" },
  "upload_document_253f0478": { "message": "Carica documento" },
  "upload_file_fd2361b8": { "message": "Carica File" },
  "upload_image_6120b609": { "message": "Carica immagine" },
  "upload_media_ce31135a": { "message": "Carica file multimediali" },
  "upload_record_media_e4207d72": {
    "message": "Carica/Registra file multimediali"
  },
  "uploading_19e8a4e7": { "message": "Caricamento" },
  "uppercase_alphabetic_ordered_list_3f5aa6b2": {
    "message": "elenco ordinato per lettera maiuscola"
  },
  "uppercase_delta_d4f4bc41": { "message": "Delta maiuscolo" },
  "uppercase_gamma_86f492e9": { "message": "Gamma maiuscolo" },
  "uppercase_lambda_c78d8ed4": { "message": "Lambda maiuscolo" },
  "uppercase_omega_8aedfa2": { "message": "Omega maiuscolo" },
  "uppercase_phi_caa36724": { "message": "Phi maiuscolo" },
  "uppercase_pi_fcc70f5e": { "message": "Pi maiuscolo" },
  "uppercase_psi_6395acbe": { "message": "Psi maiuscolo" },
  "uppercase_roman_numeral_ordered_list_853f292b": {
    "message": "elenco ordinato per cifra romana maiuscola"
  },
  "uppercase_sigma_dbb70e92": { "message": "Sigma maiuscolo" },
  "uppercase_theta_49afc891": { "message": "Theta maiuscolo" },
  "uppercase_upsilon_8c1e623e": { "message": "Ipsilon maiuscolo" },
  "uppercase_xi_341e8556": { "message": "Xi maiuscolo" },
  "upsilon_33651634": { "message": "Ipsilon" },
  "upward_and_downward_pointing_arrow_fa90a918": {
    "message": "Freccia su e giù"
  },
  "upward_and_downward_pointing_arrow_thick_d420fdef": {
    "message": "Freccia su e giù (spessa)"
  },
  "upward_arrow_9992cb2d": { "message": "Freccia su" },
  "upward_pointing_triangle_d078d7cb": {
    "message": "Triangolo che punta verso l’alto"
  },
  "url_22a5f3b8": { "message": "URL" },
  "usage_right_ff96f3e2": { "message": "Diritto di utilizzo:" },
  "usage_rights_required_5fe4dd68": {
    "message": "Diritti di utilizzo (obbligatori)"
  },
  "use_arrow_keys_to_navigate_options_2021cc50": {
    "message": "Utilizza i tasti freccia per spostarti tra le opzioni."
  },
  "use_arrow_keys_to_select_a_shape_c8eb57ed": {
    "message": "Usa i tasti freccia per selezionare una forma."
  },
  "use_arrow_keys_to_select_a_size_699a19f4": {
    "message": "Usa i tasti freccia per selezionare una dimensione."
  },
  "use_arrow_keys_to_select_a_text_position_72f9137c": {
    "message": "Usa i tasti freccia per selezionare una posizione testo."
  },
  "use_arrow_keys_to_select_a_text_size_65e89336": {
    "message": "Usa i tasti freccia per selezionare una dimensione testo."
  },
  "use_arrow_keys_to_select_an_outline_size_e009d6b0": {
    "message": "Usa i tasti freccia per selezionare una dimensione struttura."
  },
  "used_by_screen_readers_to_describe_the_content_of__4f14b4e4": {
    "message": "Usato dai screen reader per descrivere il contenuto di un { TYPE }"
  },
  "used_by_screen_readers_to_describe_the_content_of__b1e76d9e": {
    "message": "Usato da screen reader per descrivere il contenuto di un’immagine"
  },
  "used_by_screen_readers_to_describe_the_video_37ebad25": {
    "message": "Usato dagli screen reader per descrivere il video"
  },
  "user_documents_c206e61f": { "message": "Documenti utente" },
  "user_files_78e21703": { "message": "File utente" },
  "user_images_b6490852": { "message": "Immagini utente" },
  "user_media_14fbf656": { "message": "Elementi multimediali utente" },
  "vector_notation_cf6086ab": { "message": "Vettore (notazione)" },
  "vertical_bar_set_builder_notation_4300495f": {
    "message": "Barra verticale (notazione set-builder)"
  },
  "vertical_dots_bfb21f14": { "message": "Punti verticali" },
  "video_options_24ef6e5d": { "message": "Opzioni video" },
  "video_options_tray_3b9809a5": { "message": "Barra delle opzioni video" },
  "video_player_b371005": { "message": "Lettore video" },
  "video_player_for_9e7d373b": { "message": "Riproduttore video per " },
  "video_player_for_title_ffd9fbc4": {
    "message": "Riproduttore video per { title }"
  },
  "view_all_e13bf0a6": { "message": "Visualizza tutto" },
  "view_ba339f93": { "message": "Visualizza" },
  "view_description_30446afc": { "message": "Visualizza descrizione" },
  "view_keyboard_shortcuts_34d1be0b": {
    "message": "Visualizza scelte rapide da tastiera"
  },
  "view_title_description_67940918": {
    "message": "Visualizza descrizione { title }"
  },
  "view_word_and_character_counts_a743dd0c": {
    "message": "Visualizza conteggio parole e caratteri"
  },
  "we_couldn_t_detect_a_working_microphone_connected__ceb71c40": {
    "message": "Impossibile rilevare un microfono funzionante collegato al tuo dispositivo."
  },
  "we_couldn_t_detect_a_working_webcam_connected_to_y_6715cc4": {
    "message": "Impossibile rilevare una webcam funzionante collegata al tuo dispositivo."
  },
  "we_couldn_t_detect_a_working_webcam_or_microphone__263b6674": {
    "message": "Impossibile rilevare un microfono o una webcam funzionanti collegati al tuo dispositivo."
  },
  "webcam_disabled_30c66986": { "message": "Webcam disabilitata" },
  "webcam_fe91b20f": { "message": "Webcam" },
  "webpages_should_only_have_a_single_h1_which_is_aut_dc99189e": {
    "message": "Le pagine web devono avere solo un’unica H1, che viene utilizzata automaticamente dal titolo della pagina. La prima intestazione dei contenuti deve essere H2."
  },
  "when_markup_is_used_that_visually_formats_items_as_f941fc1b": {
    "message": "Quando viene utilizzato il markup che formatta visivamente gli elementi come elenco ma non indica la relazione tra gli elenchi, gli utenti potrebbero avere difficoltà a spostarsi tra le informazioni."
  },
  "white_87fa64fd": { "message": "Bianco" },
  "why_523b3d8c": { "message": "Perché" },
  "width_492fec76": { "message": "Larghezza" },
  "width_and_height_must_be_numbers_110ab2e3": {
    "message": "La larghezza e l''altezza devono essere numerici"
  },
  "width_x_height_px_ff3ccb93": { "message": "{ width } x { height }px" },
  "wiki_home_9cd54d0": { "message": "Home page wiki" },
  "word_count_c77fe3a6": { "message": "Conteggio parole" },
  "words_b448b7d5": { "message": "Parole" },
  "wreath_product_200b38ef": { "message": "Tilde verticale" },
  "xi_149681d0": { "message": "Xi" },
  "yes_dde87d5": { "message": "Sì" },
  "you_have_unsaved_changes_in_the_icon_maker_tray_do_e8cf5f1b": {
    "message": "Hai delle modifiche non salvate nella barra del produttore icone. Vuoi continuare senza salvare queste modifiche?"
  },
  "you_may_need_to_adjust_additional_headings_to_main_975f0eee": {
    "message": "Potrebbe essere necessario regolare ulteriori intestazioni per mantenere la gerarchia delle pagine."
  },
  "you_may_not_upload_an_empty_file_11c31eb2": {
    "message": "Non si possono caricare file vuoti"
  },
  "your_image_has_been_compressed_for_icon_maker_imag_2e45cd91": {
    "message": "L''immagine è stata compressa per Icon Maker. Le immagini inferiori a { size } KB non vengono compresse."
  },
  "your_microphone_is_blocked_in_the_browser_settings_42af0ddc": {
    "message": "Il tuo microfono è bloccato nelle impostazioni del browser."
  },
  "your_webcam_and_microphone_are_blocked_in_the_brow_73357dc6": {
    "message": "La tua webcam e il tuo microfono sono bloccati nelle impostazioni del browser."
  },
  "your_webcam_is_blocked_in_the_browser_settings_7f638128": {
    "message": "La tua webcam è bloccata nelle impostazioni del browser."
  },
  "your_webcam_may_already_be_in_use_6cd64c25": {
    "message": "La tua webcam potrebbe già essere in uso."
  },
  "zeta_5ef24f0e": { "message": "Zeta" },
  "zoom_f3e54d69": { "message": "Zoom" },
  "zoom_in_image_bb97d4f": { "message": "Ingrandisci immagine" },
  "zoom_out_image_d0a0a2ec": { "message": "Riduci immagine" }
}


formatMessage.addLocale({it: locale})
