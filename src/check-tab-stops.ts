import {getUniqueSelector} from './get-unique-selector'
import {CheckTabStopsOptions} from './types'
import {getActiveElement} from './utils'

export default async function checkTabStops(
  options: CheckTabStopsOptions,
): Promise<void> {
  const {tabFunction, elements, frame, delay, maxRetriesCount} = options
  const tabStopsCount = elements.length
  let previousActiveElementHandle = await getActiveElement(frame)
  let retriesCount = 0

  for (let index = 0; index < tabStopsCount; index++) {
    const expectedSelector = elements[index]
    await frame.waitForSelector(expectedSelector, {visible: true})

    await tabFunction()

    const actualActiveElement = await getActiveElement(frame)
    const expectedActiveElement = await frame.$(expectedSelector)

    const isSameElement = await frame.evaluate(
      (e1, e2) => e1 === e2,
      actualActiveElement,
      expectedActiveElement,
    )

    if (!isSameElement) {
      const lostFocusToBody = await frame.evaluate(() => {
        if (document.activeElement === document.body) {
          return true
        }
        return false
      })

      if (lostFocusToBody) {
        if (retriesCount++ < maxRetriesCount) {
          index-- // retry iteration

          console.warn(
            `Lost focus when checking ${expectedSelector}. Retrying.`,
          )
          await previousActiveElementHandle.focus()
        } else {
          throw new Error(
            `Focused was lost for some reason and the maxRetriesCount was exceeded.`,
          )
        }
      } else {
        throw new Error(
          `Expected element "${expectedSelector}" but found "${await frame.evaluate(
            getUniqueSelector,
          )}"`,
        )
      }
    }

    previousActiveElementHandle = actualActiveElement
    await frame.waitForTimeout(delay)
  }
}
