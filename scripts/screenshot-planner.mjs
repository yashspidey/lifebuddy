import { chromium } from 'playwright'
const base = 'http://localhost:4173'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
page.on('console', (m) => console.log('PAGE:', m.text()))
page.on('pageerror', (e) => console.log('ERR:', e.message))
await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)
await page.getByRole('button', { name: /AI Planner/i }).first().click()
await page.waitForTimeout(600)
await page.getByRole('button', { name: /Generate plan/i }).click()
await page.waitForTimeout(120000)
const text = await page.locator('main').innerText()
console.log(text.slice(-600))
await page.screenshot({ path: 'docs/screenshots/debug.png' })
await browser.close()

