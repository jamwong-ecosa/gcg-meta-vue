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
import { homedir, cpus } from 'node:os'

const dataFile = 'data/tournaments-bandai-all.json'
const IMAGE_BASE = 'https://www.gundam-gcg.com/jp/images/cards/card'
const BASE_URL = 'https://d.bandai-tcg-plus.com/gcgja/tournament'
const fromEnv = Number(process.env.BANDAI_CONCURRENCY)
const CONCURRENCY =
  Number.isInteger(fromEnv) && fromEnv > 0 ? fromEnv : Math.min(6, Math.max(1, cpus().length - 1))
const FORCE = process.env.BANDAI_FORCE === '1'
// A finished series is re-checked for this many days after its end date (late result uploads)
const graceEnv = Number(process.env.BANDAI_GRACE_DAYS)
const GRACE_DAYS = Number.isFinite(graceEnv) && graceEnv >= 0 ? graceEnv : 7
const DAY_MS = 24 * 60 * 60 * 1000

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

// End date of a series, from its label ("…2026/10/1～2026/10/31") or its latest cached event
function seriesEndTime(label, cachedSeries) {
  const m = label.match(/～\s*(\d{4})\/(\d{1,2})\/(\d{1,2})/)
  if (m) {
    return Date.UTC(+m[1], +m[2] - 1, +m[3])
  }
  const dates = (cachedSeries?.events ?? []).map(e => Date.parse(e.date)).filter(Number.isFinite)
  return dates.length > 0 ? Math.max(...dates) : null
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
  const rankMap = { 優勝: 1, 準優勝: 1, '3位': 1 }
  for (let i = 4; i <= 64; i++) {
    rankMap[`${i}位`] = 1
  }
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

// ── Infinite-scroll helper ───────────────────────────────────────────────────
const LINK_SELECTOR = 'a[href*="/tournament/sanctioned/"]'
const PAGE_SIZE = 20 // the site appends links in batches of 20

function readLinks(page) {
  return page.evaluate(sel => {
    return Array.from(document.querySelectorAll(sel)).map(a => ({
      href: a.href,
      text: a.textContent.trim(),
    }))
  }, LINK_SELECTOR)
}

// Scrolls until no more links load. Waits for the link count to grow instead of sleeping,
// stops early on a short batch, or when `shouldStop(newLinks)` says the rest is already known.
async function scrollAllLinks(page, { minLinks = 1, shouldStop } = {}) {
  await page
    .waitForFunction(
      ([sel, min]) => document.querySelectorAll(sel).length >= min,
      [LINK_SELECTOR, minLinks],
      { timeout: 15000 },
    )
    .catch(() => {})
  let links = await readLinks(page)
  let added = links.length
  for (let i = 0; i < 100 && added >= PAGE_SIZE; i++) {
    const prev = links.length
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const grew = await page
      .waitForFunction(
        ([sel, p]) => document.querySelectorAll(sel).length > p,
        [LINK_SELECTOR, prev],
        { timeout: 3000 },
      )
      .then(
        () => true,
        () => false,
      )
    if (!grew) {
      break
    }
    // Let the rest of the batch render before counting it
    await page.waitForTimeout(150)
    links = await readLinks(page)
    added = links.length - prev
    if (shouldStop?.(links.slice(prev))) {
      break
    }
  }
  return links
}

// ── Concurrency helper ───────────────────────────────────────────────────────
async function mapConcurrenly(items, fn, limit) {
  const results = Array.from({ length: items.length })
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
  // Card data comes from <img> attributes, so the images themselves (and fonts,
  // and the OneTrust cookie banner) never need to load
  await context.route('**/*', route => {
    const req = route.request()
    const type = req.resourceType()
    if (
      type === 'image' ||
      type === 'font' ||
      type === 'media' ||
      req.url().includes('onetrust.com')
    ) {
      return route.abort()
    }
    return route.continue()
  })

  // ── Level 1: Find series links ────────────────────────────────────────────
  console.log('1. Navigating to tournament listing (sanctioned tab)...')
  const page = await context.newPage()
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })

  console.log('2. Clicking sanctioned tab...')
  // The tab button is server-rendered before React hydrates, so an early click can be a
  // no-op — keep clicking until series links show up
  for (let attempt = 0; attempt < 10; attempt++) {
    await page.evaluate(() => {
      for (const b of document.querySelectorAll('button')) {
        if (b.textContent.includes('公認大会')) {
          b.click()
          break
        }
      }
    })
    const ok = await page
      .waitForFunction(sel => document.querySelector(sel), LINK_SELECTOR, { timeout: 1500 })
      .then(
        () => true,
        () => false,
      )
    if (ok) {
      break
    }
  }

  console.log('3. Scrolling to load all series...')
  const links = await scrollAllLinks(page)

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
  if (!FORCE) {
    for (const t of cached) {
      for (const ev of t.events ?? []) {
        cachedByUrl.set(ev.url, ev)
      }
    }
  }
  console.log(`  Loaded ${cachedByUrl.size} cached events${FORCE ? ' (force re-scrape)' : ''}`)

  // ── Level 2: For each series, find event links ────────────────────────────
  let fetchedCount = 0
  const allSeries = []

  for (let i = 0; i < parsed.length; i++) {
    const s = parsed[i]
    const cleanLabel = s.label
      .replace(/\d{4}\/\d{1,2}\/\d{1,2}～\d{4}\/\d{1,2}\/\d{1,2}/, '')
      .trim()
    const seriesValue = cleanLabel.replace(/[^a-zA-Z0-9\u3000-\u9fff]/g, '_')

    // Skip finished series we already have \u2014 no need to open and scroll its page
    const cachedSeries = cached.find(c => c.url === s.href || c.value === seriesValue)
    const endTime = seriesEndTime(s.label, cachedSeries)
    if (
      !FORCE &&
      cachedSeries?.events?.length > 0 &&
      endTime !== null &&
      Date.now() - endTime > GRACE_DAYS * DAY_MS
    ) {
      console.log(
        `  [${i + 1}/${parsed.length}] SKIP finished series (${cachedSeries.events.length} cached): ${s.label}`,
      )
      allSeries.push(cachedSeries)
      continue
    }

    console.log(`  [${i + 1}/${parsed.length}] Fetching series: ${s.label}...`)

    const series = { label: cleanLabel, value: seriesValue, url: s.href, events: [] }

    try {
      const sp = await context.newPage()
      await sp.goto(s.href, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})

      // While a series is still running, newest events load first: once two batches in a
      // row are all cached, the older ones are too. After it ends, scan fully (grace period)
      // so late result uploads further down the list are still picked up.
      const running = !FORCE && endTime !== null && Date.now() <= endTime + DAY_MS
      let cachedBatches = 0
      const shopLinks = await scrollAllLinks(sp, {
        shouldStop: running
          ? batch => {
              const allCached = batch.every(l => cachedByUrl.get(l.href)?.players?.length > 0)
              cachedBatches = allCached ? cachedBatches + 1 : 0
              return cachedBatches >= 2
            }
          : undefined,
      })
      await sp.close()

      const eventLinks = shopLinks.filter(l => /\/sanctioned\/[^/]+\/[^/]+/.test(l.href))
      const stoppedEarly = cachedBatches >= 2
      console.log(
        `    Found ${eventLinks.length} shop events in series${stoppedEarly ? ' (stopped at cached events)' : ''}`,
      )

      // Early stop only saw the newest links — keep the older cached events too
      if (stoppedEarly) {
        const seen = new Set(eventLinks.map(l => l.href))
        for (const ev of cachedSeries?.events ?? []) {
          if (!seen.has(ev.url)) {
            series.events.push(ev)
          }
        }
      }

      if (eventLinks.length === 0) {
        allSeries.push(series)
        continue
      }

      // Separate cached vs uncached
      const uncached = []
      for (const ev of eventLinks) {
        if (cachedByUrl.get(ev.href)?.players?.length > 0) {
          series.events.push(cachedByUrl.get(ev.href))
        } else {
          uncached.push(ev)
        }
      }
      console.log(`    ${eventLinks.length - uncached.length} cached, ${uncached.length} to scrape`)

      // Scrape uncached events in parallel
      if (uncached.length > 0) {
        console.log(`    Scraping ${uncached.length} events (concurrency ${CONCURRENCY})...`)
        const results = await mapConcurrenly(
          uncached,
          async ev => {
            const workerPage = await context.newPage()
            try {
              await workerPage.goto(ev.href, { waitUntil: 'domcontentloaded', timeout: 15000 })

              // Wait for deck grid (fast path), with scroll fallback for lazy loading
              const hasGrid = await workerPage
                .waitForSelector('div[class*="grid-tc_repeat"]', { timeout: 6000 })
                .then(() => true)
                .catch(() => false)
              if (!hasGrid) {
                await workerPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
                await workerPage.waitForTimeout(1500)
              }

              // Expand collapsed deck sections (rare — decks are usually shown open)
              const expanded = await workerPage.evaluate(() => {
                let n = 0
                document.querySelectorAll('button').forEach(b => {
                  if (b.textContent.includes('デッキ詳細を開く')) {
                    b.click()
                    n++
                  }
                })
                return n
              })
              if (expanded > 0) {
                await workerPage.waitForTimeout(600)
              }

              // Wait for expanded grids
              await workerPage
                .waitForSelector('div[class*="grid-tc_repeat"] button img', { timeout: 4000 })
                .catch(() => {})
              // The event date (開催日) renders a moment after the deck grid
              await workerPage
                .waitForFunction(
                  () => /開催日[^\n]*\d{4}\/\d{1,2}\/\d{1,2}/.test(document.body.innerText),
                  undefined,
                  {
                    timeout: 3000,
                  },
                )
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
      // Keep previously saved events instead of overwriting them with an empty series
      const prev = cached.find(c => c.value === seriesValue)
      if (prev) {
        console.log(`    Keeping ${prev.events?.length ?? 0} cached events for this series`)
        allSeries.push(prev)
        continue
      }
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
