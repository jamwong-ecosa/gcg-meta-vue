import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs'
import { Buffer } from 'node:buffer'

const dataFile = 'data/tournaments-bandai-all.json'
const IMAGE_BASE = 'https://www.gundam-gcg.com/jp/images/cards/card'
const BASE_URL = 'https://d.bandai-tcg-plus.com/gcgja/tournament'

function br(args) {
  return execSync('agent-browser ' + args + ' 2>&1', { encoding: 'utf8', timeout: 120000 }).trim()
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

function longestCommonPrefix(strings) {
  if (!strings.length) {
    return ''
  }
  let prefix = strings[0]
  for (let i = 1; i < strings.length; i++) {
    while (strings[i].indexOf(prefix) !== 0) {
      prefix = prefix.slice(0, -1)
      if (!prefix) {
        return ''
      }
    }
  }
  return prefix
}

function extractCardId(imgSrc) {
  // Handle Next.js proxy URLs: extract the `url` query param and decode it
  let src = imgSrc
  const qm = imgSrc.match(/[?&]url=([^&]+)/)
  if (qm) {
    src = decodeURIComponent(qm[1])
  }
  // Card IDs look like "GD01-008" or "ST01-005" (set prefix + dash + digits).
  // Bandai+ may have suffixes like "bp", "BP", "para", "_SP", "batch_" prefix — strip those.
  const m = src.match(/([A-Z0-9]{2,6}-\d+)(?:[a-zA-Z]+)?(?:_|\.|$)/)
  return m ? m[1] : null
}

async function scrape() {
  console.log('1. Navigating to tournament listing...')
  nav(BASE_URL)
  br('wait 3000')

  console.log('2. Extracting event links...')
  const linksRaw = pageEval(`
    Array.from(document.querySelectorAll('a[href*="/tournament/single/"]')).map(function(a) {
      return { href: a.href, text: a.textContent.trim() }
    });
  `)

  const links = Array.isArray(linksRaw) ? linksRaw : []
  if (!links.length) {
    console.log('No events found.')
    return
  }
  console.log('  Found ' + links.length + ' events')

  const parsed = links.map(l => {
    const date = l.text.slice(-10)
    const label = l.text.slice(0, -10).replace(/\s+$/, '')
    const id = l.href.match(/\/single\/([^/]+)/)?.[1] ?? ''
    return { href: l.href, label, date: date.replace(/\//g, '-'), id }
  })

  const labels = parsed.map(p => p.label)
  const common = longestCommonPrefix(labels).replace(/\s+$/, '')
  console.log('  Common prefix: "' + common + '"')

  const seriesValue = common.replace(/[^a-zA-Z0-9\u3000-\u9fff]/g, '_')
  const series = {
    label: common,
    value: seriesValue,
    url: BASE_URL,
    events: [],
  }

  const cached = loadCached()
  const cachedByUrl = new Map()
  for (const t of cached) {
    for (const ev of t.events ?? []) {
      cachedByUrl.set(ev.url, ev)
    }
  }
  console.log('  Loaded ' + cachedByUrl.size + ' cached events')

  let fetchedCount = 0
  let skippedCount = 0

  for (let i = 0; i < parsed.length; i++) {
    const ev = parsed[i]
    const cachedEv = cachedByUrl.get(ev.href)

    if (cachedEv?.players?.length > 0) {
      series.events.push(cachedEv)
      skippedCount++
      console.log(
        '  [' + (i + 1) + '/' + parsed.length + '] SKIP ' + ev.label + ' (' + ev.date + ')',
      )
      continue
    }

    console.log(
      '  [' + (i + 1) + '/' + parsed.length + '] Fetching ' + ev.label + ' (' + ev.date + ')...',
    )

    try {
      nav(ev.href)
      br('wait 3000')

      // Click all expand buttons for collapsed sections
      pageEval(`
        var buttons = document.querySelectorAll('button');
        buttons.forEach(function(b) {
          if (b.textContent.indexOf('\u30c7\u30c3\u30ad\u8a73\u7d30\u3092\u958b\u304f') >= 0) b.click();
        });
        'expanded';
      `)

      br('wait 1200')

      // Extract structured data
      const extractResult = pageEval(`
        (function() {
          var lines = document.body.innerText.split('\\n').filter(function(l) { return l.trim() }).map(function(l) { return l.trim() });

          // Collect card data from each deck section
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

          // Parse player names and ranks from text
          var players = [];
          var rank = '';
          var rankMap = { '\u512a\u52dd': 1, '\u6e96\u512a\u52dd': 1, '3\u4f4d': 1, '4\u4f4d': 1, '5\u4f4d': 1 };
          for (var j = 0; j < lines.length; j++) {
            var l = lines[j];
            if (rankMap[l]) {
              rank = l;
            } else if (l.indexOf('\u9078\u624b') >= 0 && rank) {
              players.push({ rank: rank, name: l.replace('\u9078\u624b', '').trim() });
              rank = '';
            }
          }

          // Assign card data by index
          for (var k = 0; k < players.length && k < deckList.length; k++) {
            players[k].deck = deckList[k];
          }

          // Extract date
          var date = '';
          var dateLine = lines.filter(function(l) { return l.indexOf('\u958b\u50ac\u65e5') >= 0 })[0] || '';
          var m = dateLine.match(/(\\d{4})\\/(\\d{1,2})\\/(\\d{1,2})/);
          if (m) date = m[1] + '-' + m[2] + '-' + m[3];

          return { players: players, date: date };
        })();
      `)

      if (extractResult && extractResult.players && extractResult.players.length > 0) {
        const formattedPlayers = extractResult.players.map(p => ({
          rank: p.rank || '',
          name: p.name || '',
          deckUrl: '',
          deck: (p.deck || []).map(c => ({
            cardId: extractCardId(c.src) || '',
            quantity: c.qty || 1,
            imageUrl: extractCardId(c.src) ? IMAGE_BASE + '/' + extractCardId(c.src) + '.webp' : '',
          })),
        }))

        series.events.push({
          date: extractResult.date || ev.date,
          shop: '',
          url: ev.href,
          players: formattedPlayers,
        })

        const totalCards = formattedPlayers.reduce((s, p) => s + p.deck.length, 0)
        console.log('    ' + formattedPlayers.length + ' players, ' + totalCards + ' cards')
        fetchedCount++
      } else {
        console.log('    Failed to extract data')
      }
    } catch (err) {
      console.log('    Error: ' + err.message)
    }
  }

  console.log('')
  console.log('Done. ' + fetchedCount + ' fetched, ' + skippedCount + ' cached')

  if (series.events.length === 0) {
    console.log('No events to save.')
    return
  }

  const existingSeries = cached.filter(s => s.value !== seriesValue)
  const merged = [...existingSeries, series]

  if (existsSync(dataFile)) {
    copyFileSync(dataFile, dataFile + '.bak')
    console.log('Backed up to ' + dataFile + '.bak')
  }
  writeFileSync(dataFile, JSON.stringify(merged, null, 2))
  console.log('Saved to ' + dataFile)

  mkdirSync('data/tournaments', { recursive: true })
  writeFileSync('data/tournaments/' + series.value + '.json', JSON.stringify(series, null, 2))
  console.log('Saved data/tournaments/' + series.value + '.json')
}

scrape().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
