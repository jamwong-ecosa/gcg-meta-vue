// Renders scripts/og/og-image.html to public/og-image-zh.png (1200×630) with the
// Playwright Chromium already used by the scrapers
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

// Same lookup as the scrapers: an explicit path, else the newest cached Playwright Chromium
function findChrome() {
  if (process.env.AGENT_BROWSER_EXECUTABLE_PATH) {
    return process.env.AGENT_BROWSER_EXECUTABLE_PATH
  }
  const cache = join(homedir(), '.cache', 'ms-playwright')
  const dirs = existsSync(cache) ? readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)) : []
  const bin = dirs
    .sort()
    .reverse()
    .map(d => join(cache, d, 'chrome-linux64', 'chrome'))
    .find(existsSync)
  return bin
}

const html = fileURLToPath(new URL('./og-image.html', import.meta.url))
const out = fileURLToPath(new URL('../../public/og-image-zh.png', import.meta.url))

const browser = await chromium.launch({ executablePath: findChrome() })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto(`file://${html}`)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: out })
await browser.close()
console.log(`Wrote ${out}`)
