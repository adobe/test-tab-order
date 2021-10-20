import * as path from 'path'
import * as puppeteer from 'puppeteer'

import {configure, testTabOrder} from '../src'
import {elements} from './test-utils'

let browser: puppeteer.Browser
let page: puppeteer.Page

jest.setTimeout(60000)

beforeAll(async () => {
  browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  })
  page = await browser.newPage()
  await page.goto(`file://${path.join(__dirname, 'fixtures/page.html')}`)
})

afterAll(async () => {
  await browser.close()
})

afterEach(jest.restoreAllMocks)

test('should print to console the elements if they are not passed', async () => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  jest.spyOn(console, 'log').mockImplementation(() => {})
  await testTabOrder({page})

  expect(console.log).toHaveBeenCalledTimes(1)
  expect((console.log as jest.Mock).mock.calls[0]).toMatchSnapshot()
})

test('should show an error if elements are not passed and maxTabStops is too small', async () => {
  await expect(
    testTabOrder({
      page,
      maxTabStopsCount: 2,
    }),
  ).rejects.toThrowErrorMatchingSnapshot()
})

test('should check the tab order is correct', async () => {
  await expect(
    testTabOrder({
      page,
      elements,
    }),
  ).resolves.not.toThrow()
})

test('should throw an error if tab order is not correct', async () => {
  await expect(
    testTabOrder({
      page,
      elements: [elements[0], elements[2]],
    }),
  ).rejects.toThrowErrorMatchingSnapshot()
})

test('should start tab order testing from a specific element', async () => {
  await expect(
    testTabOrder({
      page,
      startElement: elements[2],
      elements: elements.slice(3),
    }),
  ).resolves.not.toThrow()
})

test('should wait for element to become visible before testing', async () => {
  await page.evaluate(elementToHide => {
    document.querySelector<HTMLElement>(elementToHide).style.display = 'none'
  }, elements[0])
  const testTabOrderPromise = testTabOrder({
    page,
    elements,
  })
  await page.evaluate(elementToHide => {
    document.querySelector<HTMLElement>(elementToHide).style.display = 'inline'
  }, elements[0])

  await expect(testTabOrderPromise).resolves.not.toThrow()
})

test('delay parameter should be used in waitForTimeout', async () => {
  const delay = 600
  const waitForTimeoutSpy = jest
    .spyOn(page, 'waitForTimeout')
    .mockResolvedValue()
  const waitForTimeoutTimesCalled = elements.length * 2 - 1

  await testTabOrder({
    page,
    elements,
    delay,
  })

  expect(waitForTimeoutSpy).toHaveBeenCalledTimes(waitForTimeoutTimesCalled)
  for (let index = 1; index <= waitForTimeoutTimesCalled; index++) {
    expect(waitForTimeoutSpy).toHaveBeenNthCalledWith(index, delay)
  }
})

test('should throw error if focus is lost more than maxRetriesCount allows', async () => {
  const consoleWarnSpy = jest
    .spyOn(console, 'warn')
    .mockImplementationOnce(() => {
      // nothing
    })
  configure({maxRetriesCount: 0})

  jest.spyOn(page.keyboard, 'press').mockImplementation(async () => {
    document.body.focus()

    return Promise.resolve()
  })

  await expect(
    testTabOrder({
      page,
      elements,
    }),
  ).rejects.toThrowErrorMatchingSnapshot()
  expect(consoleWarnSpy).not.toHaveBeenCalled()
})

test('should show warning if focus is lost less than maxRetriesCount allows', async () => {
  const consoleWarnSpy = jest
    .spyOn(console, 'warn')
    .mockImplementationOnce(() => {
      // nothing
    })
  configure({maxRetriesCount: 1})

  jest.spyOn(page.keyboard, 'press').mockImplementationOnce(async () => {
    document.body.focus()

    return Promise.resolve()
  })

  await expect(
    testTabOrder({
      page,
      elements,
    }),
  ).resolves.not.toThrow()
  expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
  expect(consoleWarnSpy.mock.calls[0]).toMatchSnapshot()
})
