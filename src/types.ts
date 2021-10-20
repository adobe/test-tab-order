import * as puppeteer from 'puppeteer'

export interface ConfigureOptions {
  maxRetriesCount: number
  delay: number
  timeout: number
}

export interface TestTabOrderOptions {
  elements?: string[]
  page: puppeteer.Page
  frame?: puppeteer.Frame
  startElement?: string
  maxTabStopsCount?: number
  delay?: number
}

interface CommonTabStopsOptions {
  tabFunction: () => Promise<void>
  frame: puppeteer.Frame | puppeteer.Page
  delay: number
}

export interface GetTabStopsOptions extends CommonTabStopsOptions {
  maxTabStopsCount: number
}

export interface CheckTabStopsOptions extends CommonTabStopsOptions {
  elements: string[]
  maxRetriesCount: number
}
