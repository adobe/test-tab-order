import makeElementFocusable from './make-element-focusable'
import checkTabStops from './check-tab-stops'
import getTabStops from './get-tab-stops'
import {getTabFunction} from './utils'
import {ConfigureOptions, TestTabOrderOptions} from './types'

let configOptions: ConfigureOptions = {
  maxRetriesCount: 1,
  delay: 0,
  timeout: 3000,
}

export function configure(options: Partial<ConfigureOptions>): void {
  configOptions = {...configOptions, ...options}
}

export async function testTabOrder(
  options: TestTabOrderOptions,
): Promise<void> {
  const {
    page,
    elements,
    frame = page,
    startElement = frame ? 'body' : null,
    delay = configOptions.delay,
    maxTabStopsCount = 100,
  } = options
  let isStartElementFocusable

  if (startElement) {
    await frame.waitForSelector(startElement, {
      visible: true,
      timeout: configOptions.timeout,
    })
    isStartElementFocusable = await frame.$eval(
      startElement,
      makeElementFocusable,
    )
  }

  if (elements === undefined) {
    console.log(
      'The "elements" prop was not passed, so we went ahead and grabbed them for you:\n',
      await getTabStops({
        frame,
        tabFunction: getTabFunction(page),
        delay,
        maxTabStopsCount,
      }),
    )
  } else {
    await checkTabStops({
      frame,
      tabFunction: getTabFunction(page),
      elements,
      delay,
      maxRetriesCount: configOptions.maxRetriesCount,
    })

    await checkTabStops({
      frame,
      tabFunction: getTabFunction(page, true),
      elements: [...elements].reverse().slice(1),
      delay,
      maxRetriesCount: configOptions.maxRetriesCount,
    })
  }

  if (startElement && !isStartElementFocusable) {
    await frame.$eval(startElement, (el: Element) => {
      el.removeAttribute('tabindex')
    })
  }
}
