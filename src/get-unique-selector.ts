/* eslint-disable */

/**
 * This function has all the code directly pasted from @cypress/unique-selector and its dependency, css.escape.
 */
export function getUniqueSelector(): string {
  const selectors = 'data-testid data-id id class tag attributes nth-child'.split(
    ' ',
  )
  // all imports
  var cssEscape = function (value: any) {
    if (arguments.length == 0) {
      throw new TypeError('`cssEscape` requires an argument.')
    }
    var string = String(value)
    var length = string.length
    var index = -1
    var codeUnit
    var result = ''
    var firstCodeUnit = string.charCodeAt(0)
    while (++index < length) {
      codeUnit = string.charCodeAt(index)
      // Note: there’s no need to special-case astral symbols, surrogate
      // pairs, or lone surrogates.

      // If the character is NULL (U+0000), then the REPLACEMENT CHARACTER
      // (U+FFFD).
      if (codeUnit == 0x0000) {
        result += '\uFFFD'
        continue
      }

      if (
        // If the character is in the range [\1-\1F] (U+0001 to U+001F) or is
        // U+007F, […]
        (codeUnit >= 0x0001 && codeUnit <= 0x001f) ||
        codeUnit == 0x007f ||
        // If the character is the first character and is in the range [0-9]
        // (U+0030 to U+0039), […]
        (index == 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
        // If the character is the second character and is in the range [0-9]
        // (U+0030 to U+0039) and the first character is a `-` (U+002D), […]
        (index == 1 &&
          codeUnit >= 0x0030 &&
          codeUnit <= 0x0039 &&
          firstCodeUnit == 0x002d)
      ) {
        // https://drafts.csswg.org/cssom/#escape-a-character-as-code-point
        result += '\\' + codeUnit.toString(16) + ' '
        continue
      }

      if (
        // If the character is the first character and is a `-` (U+002D), and
        // there is no second character, […]
        index == 0 &&
        length == 1 &&
        codeUnit == 0x002d
      ) {
        result += '\\' + string.charAt(index)
        continue
      }

      // If the character is not handled by one of the above rules and is
      // greater than or equal to U+0080, is `-` (U+002D) or `_` (U+005F), or
      // is in one of the ranges [0-9] (U+0030 to U+0039), [A-Z] (U+0041 to
      // U+005A), or [a-z] (U+0061 to U+007A), […]
      if (
        codeUnit >= 0x0080 ||
        codeUnit == 0x002d ||
        codeUnit == 0x005f ||
        (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
        (codeUnit >= 0x0041 && codeUnit <= 0x005a) ||
        (codeUnit >= 0x0061 && codeUnit <= 0x007a)
      ) {
        // the character itself
        result += string.charAt(index)
        continue
      }

      // Otherwise, the escaped character.
      // https://drafts.csswg.org/cssom/#escape-a-character
      result += '\\' + string.charAt(index)
    }
    return result
  }
  function getAttributes(
    el: any,
    attributesToIgnore = ['id', 'class', 'length'],
  ) {
    const {attributes} = el
    const attrs = [...attributes]

    return attrs.reduce((sum, next) => {
      if (!(attributesToIgnore.indexOf(next.nodeName) > -1)) {
        sum.push(`[${next.nodeName}="${next.value}"]`)
      }
      return sum
    }, [])
  }
  function getClasses(el: any) {
    if (!el.hasAttribute('class')) {
      return []
    }

    try {
      return Array.prototype.slice.call(el.classList)
    } catch (e) {
      let className = el.getAttribute('class')

      // remove duplicate and leading/trailing whitespaces
      className = className.trim().replace(/\s+/g, ' ')

      // split into separate classnames
      return className.split(' ')
    }
  }

  /**
   * Returns the Class selectors of the element
   * @param  { Object } element
   * @return { Array }
   */
  function getClassSelectors(el: any) {
    const classList = getClasses(el).filter(Boolean)
    return classList.map((cl: any) => `.${cssEscape(cl)}`)
  }

  function kCombinations(
    result: any,
    items: any,
    data: any,
    start: any,
    end: any,
    index: any,
    k: any,
  ) {
    if (index === k) {
      result.push(data.slice(0, index).join(''))
      return
    }

    for (let i = start; i <= end && end - i + 1 >= k - index; ++i) {
      data[index] = items[i]
      kCombinations(result, items, data, i + 1, end, index + 1, k)
    }
  }

  /**
   * Returns all the possible selector combinations
   * @param  { Array } items
   * @param  { Number } k
   * @return { Array }
   */
  function getCombinations(items: any, k: any) {
    const result: any = [],
      n = items.length,
      data: any = []

    for (var l = 1; l <= k; ++l) {
      kCombinations(result, items, data, 0, n - 1, 0, l)
    }

    return result
  }
  function needsQuote(v: any) {
    // if the escaped value is different from
    // the non escaped value then we know
    // we need to quote the value
    return v !== cssEscape(v)
  }
  const getData = (selectorType: any, attributes: any) => {
    for (let i = 0; i < attributes.length; i++) {
      // extract node name + value
      const {nodeName, value} = attributes[i]

      // if this matches our selector
      if (nodeName === selectorType) {
        if (value) {
          if (needsQuote(value)) {
            // if we have value that needs quotes
            return `[${nodeName}="${value}"]`
          }

          return `[${nodeName}=${value}]`
        }

        return `[${nodeName}]`
      }
    }

    return null
  }
  function getID(el: any) {
    const id = el.getAttribute('id')

    if (id !== null && id !== '') {
      return `#${cssEscape(id)}`
    }
    return null
  }
  function getNthChild(element: any) {
    let counter = 0
    let k
    let sibling
    const {parentNode} = element

    if (Boolean(parentNode)) {
      const {childNodes} = parentNode
      const len = childNodes.length
      for (k = 0; k < len; k++) {
        sibling = childNodes[k]
        if (isElement(sibling)) {
          counter++
          if (sibling === element) {
            return `:nth-child(${counter})`
          }
        }
      }
    }
    return null
  }
  function getParents(el: any) {
    const parents = []
    let currentElement = el
    while (isElement(currentElement)) {
      parents.push(currentElement)
      currentElement = currentElement.parentNode
    }

    return parents
  }
  function getTag(el: any) {
    return el.tagName.toLowerCase().replace(/:/g, '\\:')
  }
  function isUnique(el: any, selector: any) {
    if (!Boolean(selector)) return false
    const elems = el.ownerDocument.querySelectorAll(selector)
    return elems.length === 1 && elems[0] === el
  }
  function isElement(el: any) {
    let isElem

    if (typeof HTMLElement === 'object') {
      isElem = el instanceof HTMLElement
    } else {
      isElem =
        !!el &&
        typeof el === 'object' &&
        el.nodeType === 1 &&
        typeof el.nodeName === 'string'
    }
    return isElem
  }

  const dataRegex = /^data-(.+)/

  /**
   * Returns all the selectors of the elmenet
   * @param  { Object } element
   * @return { Object }
   */
  function getAllSelectors(el: any, selectors: any, attributesToIgnore: any) {
    const funcs = {
      tag: getTag,
      'nth-child': getNthChild,
      attributes: (elem: any) => getAttributes(elem, attributesToIgnore),
      class: getClassSelectors,
      id: getID,
    } as any

    return selectors
      .filter((selector: any) => !dataRegex.test(selector))
      .reduce((res: any, next: any) => {
        res[next] = funcs[next](el)
        return res
      }, {})
  }

  /**
   * Tests uniqueNess of the element inside its parent
   * @param  { Object } element
   * @param { String } Selectors
   * @return { Boolean }
   */
  function testUniqueness(element: any, selector: any) {
    const {parentNode} = element
    const elements = parentNode.querySelectorAll(selector)
    return elements.length === 1 && elements[0] === element
  }

  /**
   * Tests all selectors for uniqueness and returns the first unique selector.
   * @param  { Object } element
   * @param  { Array } selectors
   * @return { String }
   */
  function getFirstUnique(element: any, selectors: any) {
    return selectors.find(testUniqueness.bind(null, element))
  }

  /**
   * Checks all the possible selectors of an element to find one unique and return it
   * @param  { Object } element
   * @param  { Array } items
   * @param  { String } tag
   * @return { String }
   */
  function getUniqueCombination(element: any, items: any, tag: any) {
    let combinations = getCombinations(items, 3),
      firstUnique = getFirstUnique(element, combinations)

    if (Boolean(firstUnique)) {
      return firstUnique
    }

    if (Boolean(tag)) {
      combinations = combinations.map((combination: any) => tag + combination)
      firstUnique = getFirstUnique(element, combinations)

      if (Boolean(firstUnique)) {
        return firstUnique
      }
    }

    return null
  }

  /**
   * Returns a uniqueSelector based on the passed options
   * @param  { DOM } element
   * @param  { Array } options
   * @return { String }
   */
  function getUniqueSelector(
    element: any,
    selectorTypes: any,
    attributesToIgnore: any,
  ) {
    let foundSelector

    const attributes = [...element.attributes]

    const elementSelectors = getAllSelectors(
      element,
      selectorTypes,
      attributesToIgnore,
    )

    for (let selectorType of selectorTypes) {
      let selector = elementSelectors[selectorType]

      // if we are a data attribute
      if (dataRegex.test(selectorType)) {
        const dataSelector = getData(selectorType, attributes)

        // if we found a selector via data attributes
        if (dataSelector) {
          selector = dataSelector
          selectorType = 'data'
        }
      }

      if (!Boolean(selector)) continue

      switch (selectorType) {
        case 'data':
        case 'id':
        case 'tag':
          if (testUniqueness(element, selector)) {
            return selector
          }
          break
        case 'class':
        case 'attributes':
          if (selector.length) {
            foundSelector = getUniqueCombination(
              element,
              selector,
              elementSelectors.tag,
            )
            if (foundSelector) {
              return foundSelector
            }
          }
          break

        case 'nth-child':
          return selector

        default:
          break
      }
    }
    return '*'
  }

  /**
   * Generate unique CSS selector for given DOM element
   *
   * @param {Element} el
   * @return {String}
   * @api private
   */

  function unique(el: any, options = {}): string {
    const {
      selectorTypes = ['id', 'class', 'tag', 'nth-child'],
      attributesToIgnore = ['id', 'class', 'length'],
    }: any = options
    const allSelectors = []
    const parents = getParents(el)

    for (let elem of parents) {
      const selector = getUniqueSelector(
        elem,
        selectorTypes,
        attributesToIgnore,
      )
      if (Boolean(selector)) {
        allSelectors.push(selector)
      }
    }

    const selectors = []
    for (let it of allSelectors) {
      selectors.unshift(it)
      const selector = selectors.join(' > ')
      if (isUnique(el, selector)) {
        return selector
      }
    }

    return ''
  }

  return unique(document.activeElement, {selectorTypes: selectors})
}
