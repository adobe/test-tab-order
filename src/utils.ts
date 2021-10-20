import {ElementHandle, Frame, Page} from 'puppeteer'

export async function getActiveElement(
  frame: Frame | Page,
): Promise<ElementHandle> {
  const element = await frame.evaluateHandle<ElementHandle>(
    () => document.activeElement,
  )

  return element
}

export function getTabFunction(
  page: Page,
  backwards = false,
): () => Promise<void> {
  if (backwards) {
    return async function () {
      await page.keyboard.down('Shift')
      await page.keyboard.press('Tab')
      await page.keyboard.up('Shift')
    }
  } else {
    return async function () {
      await page.keyboard.press('Tab')
    }
  }
}
