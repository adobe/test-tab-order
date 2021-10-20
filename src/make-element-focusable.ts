export default function makeElementFocusable(element: Element): boolean {
  function checkElementIfFocusable(element: Element) {
    const elementTagName = element.tagName
    if (
      ['A', 'LINK'].indexOf(elementTagName) > -1 &&
      element.hasAttribute('href')
    ) {
      return true
    }

    if (
      elementTagName === 'INPUT' &&
      element.getAttribute('type') !== 'hidden'
    ) {
      return true
    }

    return (
      ['BUTTON', 'SELECT', 'TEXTAREA'].indexOf(elementTagName) > -1 ||
      element.hasAttribute('tabindex')
    )
  }

  const isElementFocusable = checkElementIfFocusable(element)

  if (!isElementFocusable) {
    element.setAttribute('tabindex', '-1')
  }

  ;(element as HTMLElement).focus()

  return isElementFocusable
}
