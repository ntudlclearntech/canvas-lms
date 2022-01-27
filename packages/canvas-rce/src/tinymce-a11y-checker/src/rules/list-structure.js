import formatMessage from "../format-message"

/**
 * Handles:
 * * list item
 * - list item
 * 1. list item
 * 1) list item
 * i. list item
 * a. list Item
 */

const orderedChars = ["[A-Z]", "[a-z]", "[0-9]"].map(pattern => pattern + "{1,4}").join("|")
const bulletMarkers = ["*", "-"].map(c => "\\" + c).join("|")
const orderedMarkers = [".", ")"].map(c => "\\" + c).join("|")

const listLikeRegex = new RegExp(
  `^\\s*(?:(?:[${bulletMarkers}])|(?:(${orderedChars})[${orderedMarkers}]))\\s+`
)

const isTextList = elem =>
  elem.tagName === "P" && listLikeRegex.test(elem.textContent)

const cleanListItem = elem => {
  if (elem.nodeType === Node.TEXT_NODE) {
    elem.textContent = elem.textContent.replace(listLikeRegex, "")
    return true
  }

  for (let childElement of elem.childNodes) {
    let found = cleanListItem(childElement)
    if (found) return true
  }

  return false
}

const moveContents = (from, to) => {
  while (from.firstChild) to.appendChild(from.firstChild)
}

const splitParagraphsByBreak = paragraph => {
  let appended = []
  let child = paragraph.firstChild

  while (child) {
    let currentParent = appended[appended.length - 1]

    if (child.tagName === "BR") {
      appended.push(document.createElement("p"))
      child = child.nextSibling
      continue
    }

    if (currentParent) currentParent.appendChild(child)

    child = child.nextSibling
  }

  const nextNode = paragraph.nextSibling

  appended.forEach(newParagraph => {
    paragraph.parentNode.insertBefore(newParagraph, nextNode)
  })
}

export default {
  id: "list-structure",
  test: function (elem) {
    const isList = isTextList(elem)
    const isFirst = elem.previousElementSibling
      ? !isTextList(elem.previousElementSibling)
      : true

    return !(isList && isFirst)
  },

  data: elem => {
    const match = elem.textContent.match(listLikeRegex)
    return {
      orderedStart: match[1] ? match[1] : null,
      formatAsList: false
    }
  },

  form: () => [
    {
      label: formatMessage("Format as a list"),
      checkbox: true,
      dataKey: "formatAsList"
    }
  ],

  update: function (elem, data) {
    const rootElem = elem.parentNode

    if (data.formatAsList) {
      const isOrdered = Boolean(data.orderedStart)
      const listContainer = document.createElement(isOrdered ? "ol" : "ul")

      if (isOrdered) {
        listContainer.setAttribute("type", data.orderedStart)
        listContainer.setAttribute("start", data.orderedStart)
      }

      let cursor = elem
      while (cursor) {
        if (!isTextList(cursor)) break
        const nextIsOrdered = Boolean(
          cursor.textContent.match(listLikeRegex)[1]
        )

        if (isOrdered !== nextIsOrdered) break

        splitParagraphsByBreak(cursor)

        const li = document.createElement("li")
        listContainer.appendChild(li)

        moveContents(cursor, li)

        let nextSibling = cursor.nextElementSibling

        // Remove the now empty siblings
        // Skip elem because elem is replaced later.
        if (cursor !== elem) cursor.parentNode.removeChild(cursor)

        cursor = nextSibling

        cleanListItem(li)
      }

      rootElem.replaceChild(listContainer, elem)
      return listContainer
    }

    return elem
  },

  rootNode: function (elem) {
    return elem.parentNode
  },

  message: () => formatMessage("Lists should be formatted as lists."),

  why: () =>
    formatMessage(
      "When markup is used that visually formats items as a list but does not indicate the list relationship, users may have difficulty in navigating the information."
    ),

  link: "https://www.w3.org/TR/2016/NOTE-WCAG20-TECHS-20161007/H48",
  linkText: () => formatMessage("Learn more about using lists")
}
