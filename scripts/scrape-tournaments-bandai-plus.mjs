import { execSync } from 'child_process'
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
import { Buffer } from 'node:buffer'

const dataFile = 'data/tournaments-bandai-all.json'
const IMAGE_BASE = 'https://www.gundam-gcg.com/jp/images/cards/card'
const BASE_URL = 'https://d.bandai-tcg-plus.com/gcgja/tournament'

// agent-browser auto-detects the snap Chromium, which fails to launch in
// containers/VMs (mount namespace errors). Prefer a working Chrome binary:
// honor AGENT_BROWSER_EXECUTABLE_PATH, else use the newest Playwright Chromium.
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

const CHROME = findChromeBinary()

function br(args) {
  const cmd = CHROME
    ? 'agent-browser --executable-path "' + CHROME + '" ' + args + ' 2>&1'
    : 'agent-browser ' + args + ' 2>&1'
  return execSync(cmd, { encoding: 'utf8', timeout: 120000 }).trim()
}

function nav(url) {
  br('open "' + url + '"')
}

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

// Base64-encode JS to avoid all shell escaping issues
// agent-browser eval JSON-encodes the return value, so we parse once
// Use decodeURIComponent(escape(atob(...))) for Unicode support
function pageEval(js) {
  const b64 = Buffer.from(js, 'utf8').toString('base64')
  const output = br('eval "eval(decodeURIComponent(escape(atob(\'' + b64 + '\'))))"')
  try {
    return JSON.parse(output)
  } catch {
    return output
  }
}

function extractCardId(imgSrc) {
  // Handle Next.js proxy URLs: extract the `url` query param and decode it
  // URLs may be double-encoded (e.g. %252B → %2B → +), so decode twice
  let src = imgSrc
  const qm = imgSrc.match(/[?&]url=([^&]+)/)
  if (qm) {
    src = decodeURIComponent(decodeURIComponent(qm[1]))
  }
  // Card IDs look like "GD01-008" or "ST01-005" (set prefix + dash + 3 digits).
  // Bandai+ may use underscore separator ("ST04_015") or have extra digits:
  //   "ST03-0013" = zero-padded 013, "GD04-1018" = card 101 + junk 8.
  // Suffixes like "bp", "+", "para", "_SP", "batch_" prefix — strip those.
  const m = src.match(/([A-Z0-9]{2,6})[-_](\d{3,4})(?:[+a-zA-Z0-9]*)?(?:_|\.|$)/)
  if (!m) {
    return null
  }
  let digits = m[2]
  if (digits.length === 4) {
    // "0013" → leading zero is padding → strip → "013"
    // "1018" → no leading zero → trailing digit is junk → take first 3 → "101"
    digits = digits[0] === '0' ? String(parseInt(digits, 10)).padStart(3, '0') : digits.slice(0, 3)
  }
  return m[1] + '-' + digits
}

function scrollUntilStable(countSelector, maxScrolls) {
  for (let i = 0; i < maxScrolls; i++) {
    const prev = pageEval(countSelector)
    pageEval('window.scrollTo(0, document.body.scrollHeight)')
    br('wait 2000')
    const next = pageEval(countSelector)
    if (next === prev) {
      break
    }
  }
}

function expandDeckSections() {
  pageEval(`
    document.querySelectorAll('button').forEach(function(b) {
      if (b.textContent.indexOf('\u30c7\u30c3\u30ad\u8a73\u7d30\u3092\u958b\u304f') >= 0) b.click();
    });
    'expanded';
  `)
  br('wait 1200')
}

function extractPlayersAndDecks() {
  return pageEval(`
    (function() {
      var lines = document.body.innerText.split('\\n').filter(function(l) { return l.trim() }).map(function(l) { return l.trim() });

      var sections = document.querySelectorAll('section');
      var deckList = [];
      sections.forEach(function(sec) {
        var grid = sec.querySelector('div[class*="grid-tc_repeat"]');
        if (!grid) return;
        var cards = [];
        var btns = grid.querySelectorAll('button');
        btns.forEach(function(btn) {
          var img = btn.querySelector('img');
          if (!img) return;
          var src = img.getAttribute('srcset') || img.getAttribute('src') || '';
          var qtyEl = btn.querySelector('div[class*="pos_absolute"]');
          var qty = qtyEl ? parseInt(qtyEl.textContent.trim(), 10) : 1;
          if (isNaN(qty)) qty = 1;
          cards.push({ src: src, qty: qty });
        });
        if (cards.length > 0) deckList.push(cards);
      });

      var players = [];
      var rank = '';
      var rankMap = { '\u512a\u52dd': 1, '\u6e96\u512a\u52dd': 1, '3\u4f4d': 1, '4\u4f4d': 1, '5\u4f4d': 1, '6\u4f4d': 1, '7\u4f4d': 1, '8\u4f4d': 1 };
      for (var j = 0; j < lines.length; j++) {
        var l = lines[j];
        if (rankMap[l]) {
          rank = l;
        } else if (l.indexOf('\u9078\u624b') >= 0 && rank) {
          players.push({ rank: rank, name: l.replace('\u9078\u624b', '').trim() });
          rank = '';
        }
      }

      for (var k = 0; k < players.length && k < deckList.length; k++) {
        players[k].deck = deckList[k];
      }

      var date = '';
      var dateLine = lines.filter(function(l) { return l.indexOf('\u958b\u50ac\u65e5') >= 0 })[0] || '';
      var m = dateLine.match(/(\\d{4})\\/(\\d{1,2})\\/(\\d{1,2})/);
      if (m) date = m[1] + '-' + m[2] + '-' + m[3];

      return { players: players, date: date };
    })();
  `)
}

function formatPlayers(extractResult) {
  return (extractResult.players || []).map(p => {
    // Deduplicate: the page has collapsed + expanded grids both matching
    // div[class*="grid-tc_repeat"], so the same card can appear multiple times.
    // Merge by cardId, summing quantities.
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

async function scrape() {
  console.log('1. Navigating to tournament listing (sanctioned tab)...')
  nav(BASE_URL)
  br('wait 3000')

  // Click the "sanctioned" tab (公認大会)
  console.log('2. Clicking sanctioned tab...')
  pageEval(`
    (function() {
      var buttons = document.querySelectorAll('button');
      for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].textContent.indexOf('\u516c\u8a8d\u5927\u4f1a') >= 0) {
          buttons[i].click();
          return 'clicked';
        }
      }
      return 'not found';
    })();
  `)
  br('wait 3000')

  // Scroll to load all series via infinite scroll
  console.log('3. Scrolling to load all series...')
  scrollUntilStable('document.querySelectorAll(\'a[href*="/tournament/sanctioned/"]\').length', 20)

  // Extract series links from the listing page
  console.log('4. Extracting series links...')
  const linksRaw = pageEval(`
    Array.from(document.querySelectorAll('a[href*="/tournament/sanctioned/"]')).map(function(a) {
      return { href: a.href, text: a.textContent.trim() }
    });
  `)

  const links = Array.isArray(linksRaw) ? linksRaw : []
  if (!links.length) {
    console.log('No sanctioned series found.')
    return
  }
  console.log('  Found ' + links.length + ' sanctioned series')

  const parsed = links
    .map(l => {
      const id = l.href.match(/\/sanctioned\/([^/]+)/)?.[1] ?? ''
      return { href: l.href, label: l.text, id }
    })
    .filter(l =>
      l.label.includes(
        '\u30cb\u30e5\u30fc\u30bf\u30a4\u30d7\u30c1\u30e3\u30ec\u30f3\u30b8 2026 MISSION4',
      ),
    )

  const cached = loadCached()
  const cachedByUrl = new Map()
  for (const t of cached) {
    for (const ev of t.events ?? []) {
      cachedByUrl.set(ev.url, ev)
    }
  }
  console.log('  Loaded ' + cachedByUrl.size + ' cached events')

  const cachedByValue = new Map()
  for (const t of cached) {
    cachedByValue.set(t.value, t)
  }

  let fetchedCount = 0
  let skippedCount = 0
  const allSeries = []

  for (let i = 0; i < parsed.length; i++) {
    const s = parsed[i]
    const cleanLabel = s.label
      .replace(/\d{4}\/\d{1,2}\/\d{1,2}\uFF5E\d{4}\/\d{1,2}\/\d{1,2}/, '')
      .trim()
    const seriesValue = cleanLabel.replace(/[^a-zA-Z0-9\u3000-\u9fff]/g, '_')

    // Check if this entire series is already cached with data
    const cachedSeries = cachedByValue.get(seriesValue)
    if (cachedSeries && cachedSeries.events?.length > 0) {
      const cachedEventsWithData = cachedSeries.events.filter(e => e.players?.length > 0)
      if (cachedEventsWithData.length > 0) {
        allSeries.push(cachedSeries)
        skippedCount++
        console.log(
          '  [' +
            (i + 1) +
            '/' +
            parsed.length +
            '] SKIP ' +
            s.label +
            ' (' +
            cachedSeries.events.length +
            ' events cached)',
        )
        continue
      }
    }

    console.log('  [' + (i + 1) + '/' + parsed.length + '] Fetching series: ' + s.label + '...')

    const series = {
      label: cleanLabel,
      value: seriesValue,
      url: s.href,
      events: [],
    }

    try {
      // Level 2: Navigate to series detail page (list of shop events)
      nav(s.href)
      br('wait 3000')

      // Scroll to load all shop events
      scrollUntilStable(
        'document.querySelectorAll(\'a[href*="/tournament/sanctioned/"]\').length',
        15,
      )

      // Extract shop event links (deeper links with /{shopId}/single or /{shopId}/team)
      const shopLinksRaw = pageEval(`
        Array.from(document.querySelectorAll('a[href*="/tournament/sanctioned/"]')).map(function(a) {
          return { href: a.href, text: a.textContent.trim() }
        });
      `)

      const shopLinks = Array.isArray(shopLinksRaw) ? shopLinksRaw : []
      // Filter to only shop detail links (contain 3 path segments after /sanctioned/)
      const eventLinks = shopLinks.filter(l => {
        const m = l.href.match(/\/sanctioned\/[^/]+\/[^/]+/)
        return m !== null
      })

      console.log('    Found ' + eventLinks.length + ' shop events in series')

      if (eventLinks.length === 0) {
        console.log('    No shop event links found, skipping series')
        allSeries.push(series)
        continue
      }

      for (let j = 0; j < eventLinks.length; j++) {
        const ev = eventLinks[j]

        if (cachedByUrl.get(ev.href)?.players?.length > 0) {
          series.events.push(cachedByUrl.get(ev.href))
          console.log('      [' + (j + 1) + '/' + eventLinks.length + '] SKIP (cached)')
          continue
        }

        console.log('      [' + (j + 1) + '/' + eventLinks.length + '] Fetching ' + ev.text + '...')

        try {
          // Level 3: Navigate to individual shop event detail
          nav(ev.href)
          br('wait 3000')

          expandDeckSections()

          const extractResult = extractPlayersAndDecks()

          if (extractResult && extractResult.players && extractResult.players.length > 0) {
            const formattedPlayers = formatPlayers(extractResult)

            series.events.push({
              date: extractResult.date || '',
              shop: ev.text || '',
              url: ev.href,
              players: formattedPlayers,
            })

            const totalCards = formattedPlayers.reduce((s, p) => s + p.deck.length, 0)
            console.log('        ' + formattedPlayers.length + ' players, ' + totalCards + ' cards')
            fetchedCount++
          } else {
            console.log('        Failed to extract data')
          }
        } catch (err) {
          console.log('        Error: ' + err.message)
        }
      }
    } catch (err) {
      console.log('    Error: ' + err.message)
    }

    allSeries.push(series)
  }

  console.log('')
  console.log('Done. ' + fetchedCount + ' fetched, ' + skippedCount + ' cached')

  if (allSeries.length === 0) {
    console.log('No series to save.')
    return
  }

  const newValueSet = new Set(allSeries.map(s => s.value))
  const existingOther = cached.filter(s => !newValueSet.has(s.value))
  const merged = [...existingOther, ...allSeries]

  if (existsSync(dataFile)) {
    copyFileSync(dataFile, dataFile + '.bak')
    console.log('Backed up to ' + dataFile + '.bak')
  }
  writeFileSync(dataFile, JSON.stringify(merged, null, 2))
  console.log('Saved to ' + dataFile)

  mkdirSync('data/tournaments', { recursive: true })
  for (const s of allSeries) {
    if (s.events.length > 0) {
      writeFileSync('data/tournaments/' + s.value + '.json', JSON.stringify(s, null, 2))
      console.log('Saved data/tournaments/' + s.value + '.json')
    }
  }
}

scrape().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
