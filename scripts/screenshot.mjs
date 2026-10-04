import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'

const base = process.argv[2] ?? 'http://localhost:4173'
await mkdir('docs/screenshots', { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForTimeout(2200)
await page.screenshot({ path: 'docs/screenshots/dashboard.png' })

await page.getByRole('button', { name: /AI Planner/i }).first().click()
await page.waitForTimeout(600)
await page
  .locator('textarea')
  .fill('Finish history essay due tonight\nCalculus problem set due tomorrow\nEmail professor about extension\nBuy groceries\nGroup project slides due Friday')
await page.getByRole('button', { name: /Import tasks/i }).click()
await page.waitForTimeout(2500)
await page.getByRole('button', { name: /Generate plan/i }).click()
await page.waitForTimeout(8000)
await page.screenshot({ path: 'docs/screenshots/planner.png' })

await page.getByRole('button', { name: /Break it down/i }).first().click()
await page.waitForTimeout(600)
await page.locator('select').first().selectOption({ index: 1 })
await page.waitForTimeout(400)
await page.getByRole('button', { name: /Suggest steps/i }).click()
await page.waitForTimeout(6000)
await page.screenshot({ path: 'docs/screenshots/breakdown.png' })

await page.getByRole('button', { name: /Progress/i }).first().click()
await page.waitForTimeout(600)
await page.screenshot({ path: 'docs/screenshots/progress.png' })

await browser.close()
console.log('done')
