import { chromium } from 'playwright-core'
import {
  readFileSync,
  writeFileSync,
  existsSync,
  copyFileSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const dataFile = 'data/tournaments-bandai-all.json'
const IMAGE_BASE = 'https://www.gundam-gcg.com/jp/images/cards/card'
const BASE_URL = 'https://d.bandai-tcg-plus.com/gcgja/tournament'
const CONCURRENCY = 4

// ── Chrome binary detection ──────────────────────────────────────────────────
function findChromeBinary() {
  const override = process.env.AGENT_BROWSER_EXECUTABLE_PATH
  if (override) {
    return override
  }
  const cacheDir = join(homedir(), '.cache', 'ms-playwright')
  if (!existsSync(cacheDir)) {
    return null
  }
  let best = null
  for (const entry of readdirSync(cacheDir)) {
    if (!entry.startsWith('chromium-')) {
      continue
    }
    const versionDir = join(cacheDir, entry)
    if (!statSync(versionDir).isDirectory()) {
      continue
    }
    for (const sub of readdirSync(versionDir)) {
      if (!sub.startsWith('chrome-')) {
        continue
      }
      const candidate = join(versionDir, sub, 'chrome')
      if (existsSync(candidate)) {
        best = candidate
      }
    }
  }
  return best
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function loadCached() {
  if (!existsSync(dataFile)) {
    return []
  }
  try {
    return JSON.parse(readFileSync(dataFile, 'utf8'))
  } catch {
    return []
  }
}

function extractCardId(imgSrc) {
  let src = imgSrc
  const qm = imgSrc.match(/[?&]url=([^&]+)/)
  if (qm) {
    src = decodeURIComponent(decodeURIComponent(qm[1]))
  }
  const m = src.match(/([A-Z0-9]{2,6})[-_](\d{3,4})(?:[+a-zA-Z0-9]*)?(?:_|\.|$)/)
  if (!m) {
    return null
  }
  let digits = m[2]
  if (digits.length === 4) {
    digits = digits[0] === '0' ? String(parseInt(digits, 10)).padStart(3, '0') : digits.slice(0, 3)
  }
  return m[1] + '-' + digits
}

function formatPlayers(extractResult) {
  return (extractResult.players || []).map(p => {
    const merged = new Map()
    for (const c of p.deck || []) {
      const cardId = extractCardId(c.src) || ''
      if (!cardId) {
        continue
      }
      if (merged.has(cardId)) {
        merged.get(cardId).qty += c.qty || 1
      } else {
        merged.set(cardId, { cardId, qty: c.qty || 1, src: c.src })
      }
    }
    return {
      rank: p.rank || '',
      name: p.name || '',
      deckUrl: '',
      deck: [...merged.values()].map(c => ({
        cardId: c.cardId,
        quantity: c.qty,
        imageUrl: IMAGE_BASE + '/' + c.cardId + '.webp',
      })),
    }
  })
}

// ── Page-level extraction (runs in browser) ──────────────────────────────────
function extractPlayersAndDecksJS() {
  const lines = document.body.innerText
    .split('\n')
    .filter(l => l.trim())
    .map(l => l.trim())

  const sections = document.querySelectorAll('section')
  const deckList = []
  sections.forEach(sec => {
    const grid = sec.querySelector('div[class*="grid-tc_repeat"]')
    if (!grid) {
      return
    }
    const cards = []
    grid.querySelectorAll('button').forEach(btn => {
      const img = btn.querySelector('img')
      if (!img) {
        return
      }
      const src = img.getAttribute('srcset') || img.getAttribute('src') || ''
      const qtyEl = btn.querySelector('div[class*="pos_absolute"]')
      let qty = qtyEl ? parseInt(qtyEl.textContent.trim(), 10) : 1
      if (isNaN(qty)) {
        qty = 1
      }
      cards.push({ src, qty })
    })
    if (cards.length > 0) {
      deckList.push(cards)
    }
  })

  const players = []
  let rank = ''
  const rankMap = { 優勝: 1, 準優勝: 1, '3位': 1, '4位': 1, '5位': 1, '6位': 1, '7位': 1, '8位': 1 }
  for (const l of lines) {
    if (rankMap[l]) {
      rank = l
    } else if (l.indexOf('選手') >= 0 && rank) {
      players.push({ rank, name: l.replace('選手', '').trim() })
      rank = ''
    }
  }

  for (let k = 0; k < players.length && k < deckList.length; k++) {
    players[k].deck = deckList[k]
  }

  let date = ''
  const dateLine = lines.find(l => l.indexOf('開催日') >= 0) || ''
  const dm = dateLine.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/)
  if (dm) {
    date = dm[1] + '-' + dm[2] + '-' + dm[3]
  }

  return { players, date }
}

// ── Concurrency helper ───────────────────────────────────────────────────────
async function mapConcurrenly(items, fn, limit) {
  const results = new Array(items.length)
  let nextIdx = 0
  async function worker() {
    while (nextIdx < items.length) {
      const i = nextIdx++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
  return results
}

// ── Main scrape ──────────────────────────────────────────────────────────────
async function scrape() {
  const CHROME = findChromeBinary()
  if (!CHROME) {
    console.error('No Chrome binary found')
    process.exit(1)
  }
  console.log('Chrome:', CHROME)

  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const context = await browser.newContext()

  // ── Level 1: Find series links ────────────────────────────────────────────
  console.log('1. Navigating to tournament listing (sanctioned tab)...')
  const page = await context.newPage()
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(3000)

  console.log('2. Clicking sanctioned tab...')
  // Dismiss cookie banners (may have multiple layers)
  for (let attempt = 0; attempt < 3; attempt++) {
    await page
      .evaluate(() => {
        for (const b of document.querySelectorAll('button')) {
          const t = b.textContent.trim()
          if (t.includes('Accept All') || t === 'Allow All' || t === 'Reject All Cookies') {
            b.click()
            break
          }
        }
      })
      .catch(() => {})
    await page.waitForTimeout(500)
  }

  // Wait for SPA tab buttons to appear
  await page
    .waitForFunction(
      () => {
        for (const b of document.querySelectorAll('button')) {
          if (b.textContent.includes('公認大会')) {
            return true
          }
        }
        return false
      },
      { timeout: 15000 },
    )
    .catch(() => {})

  await page.evaluate(() => {
    for (const b of document.querySelectorAll('button')) {
      if (b.textContent.includes('公認大会')) {
        b.click()
        break
      }
    }
  })
  await page.waitForTimeout(2000)

  console.log('3. Scrolling to load all series...')
  for (let i = 0; i < 20; i++) {
    const prev = await page.evaluate(
      () => document.querySelectorAll('a[href*="/tournament/sanctioned/"]').length,
    )
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1500)
    const next = await page.evaluate(
      () => document.querySelectorAll('a[href*="/tournament/sanctioned/"]').length,
    )
    if (next === prev) {
      break
    }
  }

  console.log('4. Extracting series links...')
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/tournament/sanctioned/"]')).map(a => ({
      href: a.href,
      text: a.textContent.trim(),
    })),
  )

  const parsed = links.map(l => ({
    href: l.href,
    label: l.text,
    id: (l.href.match(/\/sanctioned\/([^/]+)/) || [])[1] ?? '',
  }))

  console.log(`  Found ${parsed.length} sanctioned series`)
  await page.close()

  // ── Cache setup ───────────────────────────────────────────────────────────
  const cached = loadCached()
  const cachedByUrl = new Map()
  for (const t of cached) {
    for (const ev of t.events ?? []) {
      cachedByUrl.set(ev.url, ev)
    }
  }
  console.log(`  Loaded ${cachedByUrl.size} cached events`)

  // ── Level 2: For each series, find event links ────────────────────────────
  let fetchedCount = 0
  const allSeries = []

  for (let i = 0; i < parsed.length; i++) {
    const s = parsed[i]
    const cleanLabel = s.label
      .replace(/\d{4}\/\d{1,2}\/\d{1,2}～\d{4}\/\d{1,2}\/\d{1,2}/, '')
      .trim()
    const seriesValue = cleanLabel.replace(/[^a-zA-Z0-9\u3000-\u9fff]/g, '_')

    console.log(`  [${i + 1}/${parsed.length}] Fetching series: ${s.label}...`)

    const series = { label: cleanLabel, value: seriesValue, url: s.href, events: [] }

    try {
      const sp = await context.newPage()
      await sp.goto(s.href, { waitUntil: 'load', timeout: 30000 }).catch(() => {})
      await sp.waitForTimeout(2000)

      // Dismiss cookie banner if present
      await sp
        .evaluate(() => {
          for (const b of document.querySelectorAll('button')) {
            if (b.textContent.includes('Accept All')) {
              b.click()
              break
            }
          }
        })
        .catch(() => {})
      await sp.waitForTimeout(500)

      // Scroll to load all events
      for (let j = 0; j < 20; j++) {
        const prev = await sp.evaluate(
          () => document.querySelectorAll('a[href*="/tournament/sanctioned/"]').length,
        )
        await sp.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
        await sp.waitForTimeout(1500)
        const next = await sp.evaluate(
          () => document.querySelectorAll('a[href*="/tournament/sanctioned/"]').length,
        )
        if (next === prev) {
          break
        }
      }

      const shopLinks = await sp.evaluate(() =>
        Array.from(document.querySelectorAll('a[href*="/tournament/sanctioned/"]')).map(a => ({
          href: a.href,
          text: a.textContent.trim(),
        })),
      )
      await sp.close()

      const eventLinks = shopLinks.filter(l => /\/sanctioned\/[^/]+\/[^/]+/.test(l.href))
      console.log(`    Found ${eventLinks.length} shop events in series`)

      if (eventLinks.length === 0) {
        allSeries.push(series)
        continue
      }

      // Separate cached vs uncached
      const uncached = []
      for (const ev of eventLinks) {
        if (cachedByUrl.get(ev.href)?.players?.length > 0) {
          series.events.push(cachedByUrl.get(ev.href))
          console.log(`      [${series.events.length}/${eventLinks.length}] SKIP (cached)`)
        } else {
          uncached.push(ev)
        }
      }

      // Scrape uncached events in parallel
      if (uncached.length > 0) {
        console.log(`    Scraping ${uncached.length} events (concurrency ${CONCURRENCY})...`)
        const results = await mapConcurrenly(
          uncached,
          async ev => {
            const workerPage = await context.newPage()
            try {
              await workerPage.goto(ev.href, { waitUntil: 'domcontentloaded', timeout: 15000 })

              // Dismiss cookie banner if present
              await workerPage
                .evaluate(() => {
                  for (const b of document.querySelectorAll('button')) {
                    if (b.textContent.includes('Accept All')) {
                      b.click()
                      break
                    }
                  }
                })
                .catch(() => {})

              // Wait for deck grid (fast path), with scroll fallback for lazy loading
              const hasGrid = await workerPage
                .waitForSelector('div[class*="grid-tc_repeat"]', { timeout: 6000 })
                .then(() => true)
                .catch(() => false)
              if (!hasGrid) {
                await workerPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
                await workerPage.waitForTimeout(1500)
              }

              // Expand deck sections
              await workerPage.evaluate(() => {
                document.querySelectorAll('button').forEach(b => {
                  if (b.textContent.includes('デッキ詳細を開く')) {
                    b.click()
                  }
                })
              })
              await workerPage.waitForTimeout(600)

              // Wait for expanded grids
              await workerPage
                .waitForSelector('div[class*="grid-tc_repeat"] button img', { timeout: 4000 })
                .catch(() => {})

              const extractResult = await workerPage.evaluate(extractPlayersAndDecksJS)

              if (extractResult?.players?.length > 0) {
                const formattedPlayers = formatPlayers(extractResult)
                return {
                  date: extractResult.date || '',
                  shop: ev.text || '',
                  url: ev.href,
                  players: formattedPlayers,
                }
              }
              return null
            } catch {
              return null
            } finally {
              await workerPage.close()
            }
          },
          CONCURRENCY,
        )

        for (const r of results) {
          if (r) {
            series.events.push(r)
            fetchedCount++
          }
        }
        console.log(`      Scraped ${results.filter(Boolean).length}/${uncached.length} events`)
      }
    } catch (err) {
      console.log(`    Error: ${err.message}`)
    }

    allSeries.push(series)
  }

  await browser.close()

  // ── Save ──────────────────────────────────────────────────────────────────
  console.log('')
  console.log(`Done. ${fetchedCount} fetched`)

  if (allSeries.length === 0) {
    console.log('No series to save.')
    return
  }

  const newValueSet = new Set(allSeries.map(s => s.value))
  const existingOther = cached.filter(s => !newValueSet.has(s.value))
  const merged = [...existingOther, ...allSeries]

  if (existsSync(dataFile)) {
    copyFileSync(dataFile, dataFile + '.bak')
    console.log(`Backed up to ${dataFile}.bak`)
  }
  writeFileSync(dataFile, JSON.stringify(merged, null, 2))
  console.log(`Saved to ${dataFile}`)

  mkdirSync('data/tournaments', { recursive: true })
  for (const s of allSeries) {
    if (s.events.length > 0) {
      writeFileSync(`data/tournaments/${s.value}.json`, JSON.stringify(s, null, 2))
      console.log(`Saved data/tournaments/${s.value}.json`)
    }
  }
}

scrape().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
