// The scraped data as the pipeline reads it: card lookups and the tournament
// series merged by month. Shared by build-tiers.mjs and the grouping report and
// tests, so they all see the same decks the same way
import { readFileSync, existsSync } from 'node:fs'

export function loadJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

// ── Card lookups ─────────────────────────────────────────────────────────────

// Builds cardId→info map, name→color lookup, and vanilla grouping key.
// Vanilla cards (no effect) are grouped by stats alone (level|cost|ap|hp)
// so functionally identical cards across different colors/names are detected.
export function createCardLookups(cardsRaw) {
  const cardMap = {}
  const vanillaGroup = {}

  for (const card of cardsRaw) {
    const key = card.id
    cardMap[key] ??= {
      name: card.name,
      color: card.color,
      type: card.type,
      cost: card.cost,
      level: card.level,
      ap: card.ap,
      hp: card.hp,
      features: card.features,
      rarity: card.rarity,
      effect: card.effect,
      link: card.link,
    }
    vanillaGroup[key] = card.effect === '-'
  }

  const lookup = cardId =>
    cardMap[cardId] ?? {
      name: '?',
      color: '?',
      type: '?',
      cost: '?',
      level: '?',
      ap: '?',
      hp: '?',
      features: '?',
      rarity: '?',
      effect: '?',
    }

  // Cards that play the same: same type, colour, level, cost, AP, HP, effect and
  // pilot link (GD01-008 ガンタンク / GD05-015 M1アストレイ); cards with no effect
  // only need the same type, level, cost, AP, HP and link (a different link pairs
  // with different pilots: GD05-009 vs GD05-010). Name and traits don't count.
  // Cards keep their own stats; the key groups them in the UI and keeps a
  // version of a common effect from looking like a rare tech pick.
  const functionKey = cardId => {
    const c = cardMap[cardId]
    if (!c) {
      return cardId
    }
    return c.effect === '-'
      ? ['vanilla', c.type, c.level, c.cost, c.ap, c.hp, c.link].join('|')
      : [c.type, c.color, c.level, c.cost, c.ap, c.hp, c.effect, c.link].join('|')
  }

  // Sorted unique colors in a deck, used for combo key prefix. Plain code-unit
  // order (not localeCompare) so existing archetype keys stay the same.
  const getDeckColors = deck =>
    [...new Set(deck.map(card => lookup(card.cardId).color))].sort((a, b) =>
      a < b ? -1 : a > b ? 1 : 0,
    )

  // Card identity for telling sub-builds apart: reprints with the same effect
  // are one card, but vanilla units stay apart, since functionKey would merge
  // every vanilla unit with the same stats (リック・ディアス with ST01-010) and
  // blur the packages that set the builds apart
  const buildCardKey = cardId => {
    const id = cardId.replace(/_p\d+$/, '')
    return vanillaGroup[id] ? id : functionKey(id)
  }

  return { lookup, vanillaGroup, functionKey, getDeckColors, buildCardKey }
}

// ── Series ───────────────────────────────────────────────────────────────────

export function getSeriesEventDateRange(series) {
  const dates = series.events
    .map(event => event.date)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
  return {
    eventMinDate: dates[0] ?? null,
    eventMaxDate: dates.at(-1) ?? null,
  }
}

// Group series that were scraped in separate formats by their calendar month
// (YYYY-MM), merging all member series into a single monthly entry.
function getSeriesMonth(series) {
  const { eventMinDate } = getSeriesEventDateRange(series)
  return eventMinDate ? eventMinDate.slice(0, 7) : null
}

// Short display name for a series used in merged month labels.
const SERIES_SHORT_NAMES = [
  [/ニュータイプチャレンジ/, 'NTC'],
  [/シリアルカードチャレンジ/, 'Serial'],
]
function getSeriesShortName(series) {
  for (const [re, short] of SERIES_SHORT_NAMES) {
    if (re.test(series.label)) {
      // Keep the mission number, e.g. "MISSION5" → "NTC M5"
      const mission = series.label.match(/MISSION\s*(\d+)/i)?.[1]
      return mission ? `${short} M${mission}` : short
    }
  }
  const cleaned = series.label
    .replace(/（\d+月開催）/, '')
    .replace(/[\s【】（）()]/g, '')
    .trim()
  return cleaned ? cleaned.slice(0, 10) : series.value.slice(0, 10)
}

// Official (tournaments-all.json) + Bandai+ (tournaments-bandai-all.json)
// series, one entry per month. Every monthly entry gets a short label, e.g.
// "2026-11 (NTC M5)" or "2026-09 (NTC M4 + Serial)". Single-series months keep
// their original value so existing ?series= links still work.
export function loadMonthlySeries() {
  const tournaments = [...loadJSON('data/tournaments-all.json')]
  if (existsSync('data/tournaments-bandai-all.json')) {
    tournaments.push(...loadJSON('data/tournaments-bandai-all.json'))
  }

  const byMonth = new Map()
  const monthlessSeries = []
  for (const series of tournaments) {
    const month = getSeriesMonth(series)
    if (month === null) {
      monthlessSeries.push(series)
      continue
    }
    if (!byMonth.has(month)) {
      byMonth.set(month, [])
    }
    byMonth.get(month).push(series)
  }

  const mergedSeries = [...monthlessSeries]
  for (const [month, seriesList] of byMonth) {
    const label = `${month} (${seriesList.map(getSeriesShortName).join(' + ')})`
    if (seriesList.length === 1) {
      mergedSeries.push({ ...seriesList[0], label })
      continue
    }
    mergedSeries.push({
      value: month,
      label,
      url: '',
      events: seriesList.flatMap(s => s.events),
    })
  }
  return mergedSeries
}

// A series' placed decks: players with a deck list, with their event's details
export function seriesPlayers(series) {
  return series.events.flatMap(e =>
    e.players
      .filter(p => p.deck.length > 0)
      .map(p => ({
        ...p,
        eventPlayerCount: e.players.length,
        eventUrl: e.url,
        eventDate: e.date,
        eventShop: e.shop,
      })),
  )
}
