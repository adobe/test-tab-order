import {getUniqueSelector} from './get-unique-selector'
import {GetTabStopsOptions} from './types'

export default async function getTabStops(
  options: GetTabStopsOptions,
): Promise<string[]> {
  const tabStopsSlectors: string[] = []
  const {tabFunction, frame, delay, maxTabStopsCount} = options

  for (let index = 0; index < maxTabStopsCount; index++) {
    await tabFunction()

    const elementSelector = await frame.evaluate(getUniqueSelector)

    if (elementSelector === 'body') {
      return tabStopsSlectors
    } else {
      tabStopsSlectors.push(elementSelector)
    }

    await frame.waitForTimeout(delay)
  }

  if ((await frame.evaluate(getUniqueSelector)) !== 'body') {
    throw new Error(
      `We are generating selectors but we did not reach the end of the page. Consider increasing maxTabStopsCount currently at ${maxTabStopsCount}`,
    )
  }

  return tabStopsSlectors
}
