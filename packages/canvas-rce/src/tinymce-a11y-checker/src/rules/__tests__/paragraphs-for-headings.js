import rule from "../paragraphs-for-headings"

let el

beforeEach(() => {
  el = document.createElement("h2")
})

describe("test", () => {
  test("return true on non-H? element", () => {
    expect(rule.test(document.createElement("div"))).toBeTruthy()
  })

  test("return true if H? length is less than max", () => {
    const moreThanMaxString = Array(rule["max-heading-length"] + 2).join("x")
    el.appendChild(document.createTextNode(moreThanMaxString))
    expect(rule.test(el)).toBeFalsy()
  })

  test("return false if H? length is more than max", () => {
    const lessThanMaxString = "x"
    el.appendChild(document.createTextNode(lessThanMaxString))
    expect(rule.test(el)).toBeTruthy()
  })
})

describe("data", () => {
  test("returns the proper object", () => {
    expect(rule.data()).toMatchSnapshot()
  })
})

describe("form", () => {
  test("returns the appropriate object", () => {
    expect(rule.form()).toMatchSnapshot()
  })
})

describe("update", () => {
  test("returns same element", () => {
    expect(rule.update(el, {})).toBe(el)
  })

  test("returns P elment if 'change' is true", () => {
    document.createElement("body").appendChild(el)
    expect(rule.update(el, { change: true }).tagName).toBe("P")
  })
})

describe("message", () => {
  test("returns the proper message", () => {
    expect(rule.message()).toMatchSnapshot()
  })
})

describe("why", () => {
  test("returns the proper why message", () => {
    expect(rule.why()).toMatchSnapshot()
  })
})
