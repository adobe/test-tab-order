# Test Tab Order
<img src="https://github.com/adobe/test-tab-order/blob/main/other/public/logo/test-tab-order.svg" alt="test tab order logo" title="test tab order logo" width="300">

Tool to test the Tab Order of the elements within a page, automatically, as part
of the Continous Integration process.

## The problem

You need a way to test the Tab Order that is easy to use and to be integrated
within your CI build pipeline. You also want it to use the latest testing tools
available for JavaScript applications. Finally, it should be robust and whithout
high maintenance overhead costs.

## This solution

Test Tab Order is a library that offers a Puppetteer-based function to be used
in your e2e tests suite. It is able to check the Tab Order of the elements
within a Page or a Frame (`iframe`) and can also generate the selectors of the
elements it finds while Tabbing within the page. It is also customizable to
start testing at different elements within the DOM, depending on your use case.
As an example, you could have a full page test with the Heading and Navigation
as part of the test, then you want to continue checking the Tab Order for the
other pages without the already-tested Heading and Navigation elements.

Every Accessibility enthusiast will mention that Tabbing once in a while through
your application pages is a good idea. Although we also consider this to be
important, we acknowledge that, in most cases, it's not enought due to the fact
that:

- Continous Integration is better than once in a while.
- Automated is (way) better than Manual.
- You need to remember the previous correct Tab Order in order to test
  effectively.
- You don't always test with the DevTools open, which means that if now your
  element wrapper receives focus, and not the elmenet itself, you might not
  notice this, but it can have be a false positive which impacts keyboard
  handlers and screen readers.

What we recommend is that you do both: check the keyboard navigation and
operation in your application manually, as often as possible, but also use
`testTabOrder` to avoid unwanted regressions in your app and spot them early, at
CI.

## Table of Contents

## Installation

Can be installed using either npm or yarn.

```
npm install --save-dev test-tab-order
```

```
yarn add --dev test-tab-order
```

## Usage

For a given page whose HTML is the following:

```html
<!-- ./fixtures/page.html -->
<html>
  <body>
    <h1 data-testid="first-level-header">Tests</h1>
    <h2 data-testid="second-level-header">Tabbable Elements</h2>
    <button data-testid="click-me-button">Click me</button>
    <button data-testid="ok-button">Ok</button>
    <a href="#" data-testid="this-page-link">Go here...</a>
  </body>
</html>
```

We have the followint Tab Order test in our Puppeteer test suite:

```ts
/** ./test/index.test.tsx */
beforeAll(async () => {
  import * as path from 'path'
  import * as puppeteer from 'puppeteer'
  import {configure, testTabOrder} from '../src'

  let browser: puppeteer.Browser
  let page: puppeteer.Page

  jest.setTimeout(60000)
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

test('should check the tab order is correct', async () => {
  await expect(
    testTabOrder({
      page,
      elements: [
        '[data-testid=click-me-button]',
        '[data-testid=ok-button]',
        '[data-testid=this-page-link]',
      ],
    }),
  ).resolves.not.toThrow()
})
```

## Usage Details

In the suite above, `testTabOrder` will receive the page argument from Puppeteer
and will check that the Tab Order is made of 3 elements: the two buttons and the
link. The check is made by starting with the focus on `<body>` and pressing Tab,
for each item in the `elements` array. After pressing Tab, it will get the
`document.activeElement` and check if it's the element with the selector passed
in the array. If so, it will move to the next iteration, otherwise it will throw
an error.

After going through all the elements, it will start the same process all over
again, but with Shift+Tab and moving backwards all the way to the starting
element, in this case, the `<body>`. Tab Order should be correct both forwards
and backwards.

## Basic Props

Below are the `testTabOrder` props that are going to be mandatory in your tests.

### page

> `puppeteer.Page` | required

The `page` object from puppeteer which corresponds to the Page under Test.

### elements

> `Array[string]` | optional

The array of elements which are expected to be in the Tab Order.

There are cases when the number of elements on the page you want to check for
correct Tab Order is just too much. You could have tens of elements in the Tab
Order, maybe more than 100. For this specific case, `testTabOrder` can be run
without the `elements` parameter. As a result, it will still navigate with Tab
through the page and, for each tabbable element it encounters, it will collect
its CSS selector. Finally, once it reaches the end of the page, it will return
with a resolved promise and print the array of selectors it found on the page.

```ts
await testTabOrder({page})
```

After this function runs on the HTML above, it will output to the console:

```
The "elements" prop was not passed, so we went ahead and grabbed them for you:
    [
    '[data-testid=click-me-button]',
    '[data-testid=ok-button]',
    '[data-testid=this-page-link]',
]
```

Consequently, all you need to do is to check that the selectors printed are
correct in relation to the Tab Order. Afterwards, you could just copy-paste the
Array of selector strings and pass them as the `elements` argument in your test.
And voilà, you're done. This test will now run to check the Tab Order for that
page, both with Tab and with Shift+Tab.

## Advanced Props

Below are the `testTabOrder` props that are going to be optional in your tests.

### frame

> `puppeteer.Frame` | optional

The `<iframe>` Frame element returned by puppeteer.

When it comes to applications or experiences embedded into `<iframe>` elements,
`testTabOrder` needs to receive the corresponding Frame as parameter. The reason
for this is that the element queries and function evaluations need to be
executed within that Frame.

As a result, when you want to check the Tab Order for elements in an `<iframe>`
element, you run the tests like below:

```ts
test('should check the tab order in the iframe is correct', async () => {
  const elementHandle = await page.$('iframe[title="Main Content"]')
  const frame = await elementHandle.contentFrame()

  await expect(
    testTabOrder({
      page,
      frame,
      elements: [
        '[data-testid=click-me-button]',
        '[data-testid=ok-button]',
        '[data-testid=this-page-link]',
      ],
    }),
  ).resolves.not.toThrow()
})
```

### startElement

> `string` | defaults to `'body'`

Sometimes you just want to start your Tab Order testing from a specific HTML
element, rather than from the `<body>` of the page or iframe. For instance, you
already tested the navigation Tab Order in the first test, and you want to skip
this part in your other tests. For this case, use the `startElement` property:

```ts
test('should start tab order testing from a specific element', async () => {
  await expect(
    testTabOrder({
      page,
      startElement: '[data-testid=click-me-button]',
      elements: ['[data-testid=ok-button]', '[data-testid=this-page-link]'],
    }),
  ).resolves.not.toThrow()
})
```

### delay

> `number` | defaults to `configOptions.delay`

Delay, in miliseconds, between each Tab key. Useful when you need to debug
yourself what is happening while the test runs. By default, the test should run
almost instantly, so it's impossible to follow manually the focus ring movement
between the elements.

### maxTabStopsCount

> `number` | defaults to 100

When using `testTabOrder` without selectors, to generate the array of selectors
instead of checking them, it might be useful to pass the `maxTabStopsCount` in
case you want the function to stop checking before it reaches the end of the
document. This is also useful to avoid possible issues with timeouts.

## Configure Function Props

Below are the `configure` props that are going help set up global Test Tab Order
`configOptions` values.

### delay

> `number` | defaults to 0

Same as the [delay from testTabOrder](#delay).

### maxRetriesCount

> `number` | defaults to 1

In the (hopefully unlikely) event of your app might lose focus unexpectedly
because of some re-render or something similar, `testTabOrder` will forgive this
for `maxRetriesCount` times and only display you a warning after each time it
loses focus unexpectedly. It won't fail your test unless focus is lost more than
`maxRetriesCount` times.

After displaying the warning, the test will 'recover', and programatically focus
the last element it encountered while testing and continue to test the Tab
Order.

If you don't expect any unexpected focus loss, set `maxRetriesCount` to 0.

```ts
configure({maxRetriesCount: 0})
```

### timeout

> `number` | defaults to 3000

Timeout used for waiting functions, like waiting for an element to be visible
on the screen.

## Develop

Clone the repository and run:

```
npm run setup
```

This will install the dependencies and run the validate script, which contains
the lint and test checks, and also runs the build script.
