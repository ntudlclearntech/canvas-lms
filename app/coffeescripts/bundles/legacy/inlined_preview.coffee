#
# Copyright (C) 2014 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.

define [
  "jquery",
  "jquery.instructure_misc_plugins",
  "jquery.templateData"
], ($) ->
  $(document).ready ->
    $(window).resize(->
      top = $("#file_content").offset().top
      height = $(window).height()
      $("#content_preview").height height - top
      $("#modules").height height - top
    ).triggerHandler "resize"
    maxWidth = 0
    $(".context_module_item").each ->
      maxWidth = Math.max(maxWidth, $(this).width())

    $(".context_module_item").width maxWidth
    $("#modules .context_module_item.attachment a.title,#modules .context_module_item.external_url a.title").each ->
      $(this).attr "href", $(this).attr("href") + "?already_inline=1"

    $("#modules .context_module_item").filter(".attachment,.external_url").find("a.title").each(->
      $(this).attr "target", "content_preview"
    ).click (event) ->
      event.preventDefault()
      $("#file_display_name").text $(this).text()
      id = $(this).parents(".context_module_item").getTemplateData(textValues: ["id"]).id
      location.replace "#tag_" + id

    $(document).fragmentChange (event, hash) ->
      if hash.match(/^#tag_/)
        id = hash.substring(5)
        if id and id isnt $("#current_item_id").text() and $("#context_module_item_" + id + " a.title").length > 0
          $("#current_item_id").text id
          $("#content_preview").attr "src", $("#context_module_item_" + id + " a.title").attr("href")
          $("#modules .context_module_item").removeClass "selected"
          $("#context_module_item_" + id).addClass "selected"
          $("#context_module_item_" + id + " a.title").click()

    $("#context_module_item_" + $("#current_item_id").text()).addClass "selected"
    $("#frameless_link").click (event) ->
      event.preventDefault()
      location.href = $("#content_preview").attr("src")

    $(".hide_sidebar_link").click (event) ->
      event.preventDefault()
      $("#modules").parent().hide()

    $("body").css "overflow", "hidden"

