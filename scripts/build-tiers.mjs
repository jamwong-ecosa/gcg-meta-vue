import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs'
import * as ss from 'simple-statistics'
import { WINNER, TOP4, COLOR_HEX, TYPE_ORDER, TYPE_PICK_ORDER } from './constants.mjs'

// Winner rule: 優勝 always counts as a win. For events with ≥16 players,
// 準優勝 (2nd place) also counts as a winner.
const TOP2 = '準優勝'
function isWinner(player) {
  return player.rank === WINNER || (player.eventPlayerCount >= 16 && player.rank === TOP2)
}

// 優勝 → 1, 準優勝 → 2, '5位' → 5
function placeNumber(rank) {
  if (rank === WINNER) {
    return 1
  }
  if (rank === TOP2) {
    return 2
  }
  return parseInt(rank) || null
}

// Per-deck details for the deck lists: event date, shop and placement
function deckMeta(player) {
  return {
    date: player.eventDate ?? null,
    shop: player.eventShop ?? '',
    place: placeNumber(player.rank),
  }
}

function loadJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function addDays(dateStr, days) {
  if (!dateStr) {
    return dateStr
  }
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ── Card lookups ─────────────────────────────────────────────────────────────

// Builds cardId→info map, name→color lookup, and vanilla grouping key.
// Vanilla cards (no effect) are grouped by stats alone (level|cost|ap|hp)
// so functionally identical cards across different colors/names are detected.
function createCardLookups(cardsRaw) {
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

  return { lookup, vanillaGroup, functionKey }
}

const cardsRaw = loadJSON('data/cards.json')
const baseCards = cardsRaw.filter(c => !c.id.includes('_p'))
const { lookup, vanillaGroup, functionKey } = createCardLookups(baseCards)

// Write lean card metadata for the meta page
function writeCardMeta() {
  const meta = baseCards.map(c => ({
    id: c.id,
    name: c.name,
    color: c.color,
    type: c.type,
    rarity: c.rarity,
    releaseDate: c.releaseDate,
    acquisitionInfo: c.acquisitionInfo,
    level: c.level,
    cost: c.cost,
  }))
  writeFileSync('data-processed/card-meta.json', JSON.stringify(meta, null, 2))
  console.log(`Saved data-processed/card-meta.json (${meta.length} cards)`)
}

writeCardMeta()

// ── Deck analysis ────────────────────────────────────────────────────────────

// Sorted unique colors in a deck, used for combo key prefix. Plain code-unit
// order (not localeCompare) so existing archetype keys stay the same.
function getDeckColors(deck) {
  return [...new Set(deck.map(card => lookup(card.cardId).color))].sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  )
}

// Identifies 1–2 signature LR UNIT cards per archetype.
// Scored by qty×10 + level×7. Only cards appearing in qty≥2 qualify.
function getSignatureCard(deck) {
  const leadersByColor = {}
  for (const card of deck) {
    if (card.quantity < 2) {
      continue
    }

    const info = lookup(card.cardId)
    if (info.type !== 'UNIT' || !info.rarity?.startsWith('LR')) {
      continue
    }

    const score = card.quantity * 10 + (parseInt(info.level) || 0) * 7
    const group = (leadersByColor[info.color] ??= [])
    group.push({ name: info.name, color: info.color, score, cardId: card.cardId })
  }

  for (const group of Object.values(leadersByColor)) {
    group.sort((a, b) => b.score - a.score)
  }

  const colors = Object.keys(leadersByColor).sort()

  if (colors.length === 0) {
    return null
  }

  // Single color: top 2 signature cards
  if (colors.length === 1) {
    return leadersByColor[colors[0]]
      .slice(0, 2)
      .map(({ name, color, cardId }) => ({ name, color, cardId }))
  }

  // Multiple colors: top signature card per color
  return colors.map(color => {
    const { name, color: c, cardId } = leadersByColor[color][0]
    return { name, color: c, cardId }
  })
}

// Archetype grouping key: "Color1+Color2 (Sig1 / Sig2)"
function buildComboKey(deck) {
  const colors = getDeckColors(deck)
  const sigData = getSignatureCard(deck)
  const sigNames = sigData ? sigData.map(sig => sig.name) : []
  const key = colors.join('+') + (sigNames.length > 0 ? ` (${sigNames.join(' / ')})` : '')
  return { key, sigCardIds: sigData ? sigData.map(s => s.cardId) : [] }
}

// ── Card helpers ───────────────────────────────────────────────────────────────

function accumulateCardAgg(cardAgg, deck) {
  for (const card of deck) {
    cardAgg[card.cardId] ??= { totalQty: 0, decksIncluded: 0 }
    cardAgg[card.cardId].totalQty += card.quantity
    cardAgg[card.cardId].decksIncluded++
  }
}

// Decks running each effect in any version (functionKey); a deck counts once
function accumulateEffectAgg(effectAgg, deck) {
  for (const key of new Set(deck.map(card => functionKey(card.cardId)))) {
    effectAgg[key] = (effectAgg[key] ?? 0) + 1
  }
}

// Serializes a deck to "ID:qty|ID:qty" for deck preview dedup comparison
function serializeDeckCards(deck) {
  const cardQty = deck.reduce((acc, card) => {
    acc[card.cardId] = (acc[card.cardId] || 0) + (card.quantity || 1)
    return acc
  }, {})
  const sorted = Object.entries(cardQty).sort(([aId], [bId]) => {
    const typeA = TYPE_ORDER[lookup(aId).type.toLowerCase()] ?? 99
    const typeB = TYPE_ORDER[lookup(bId).type.toLowerCase()] ?? 99
    return typeA !== typeB ? typeA - typeB : aId.localeCompare(bId)
  })
  return sorted.map(([id, qty]) => `${id}:${qty}`).join('|')
}

// ── Archetype helpers ──────────────────────────────────────────────────────────

function groupByCombo(players, { init, accumulate }) {
  const map = {}
  for (const player of players) {
    const { key, sigCardIds } = buildComboKey(player.deck)
    if (!key) {
      continue
    }
    map[key] ??= init(sigCardIds)
    map[key] = accumulate(map[key], player)
  }
  return map
}

// ── Archetype grouping ───────────────────────────────────────────────────────

function buildArchetypeMaps(allPlayers, winners, top4Players) {
  const comboArchetypes = groupByCombo(allPlayers, {
    init: sigCardIds => ({
      sigCardIds,
      count: 0,
      cardAgg: {},
      effectAgg: {},
      deckCardIds: [],
      deckUrls: [],
      deckWinnerFlags: [],
      deckMeta: [],
    }),
    accumulate: (entry, player) => {
      entry.count++
      entry.deckCardIds.push(serializeDeckCards(player.deck))
      accumulateCardAgg(entry.cardAgg, player.deck)
      accumulateEffectAgg(entry.effectAgg, player.deck)
      entry.deckWinnerFlags.push(isWinner(player))
      entry.deckUrls.push(player.deckUrl || player.eventUrl || '')
      entry.deckMeta.push(deckMeta(player))
      return entry
    },
  })

  const winnersByCombo = groupByCombo(winners, {
    init: () => ({ count: 0, cardCounts: {}, effectCounts: {} }),
    accumulate: (entry, winner) => {
      entry.count++
      for (const card of winner.deck) {
        entry.cardCounts[card.cardId] = (entry.cardCounts[card.cardId] ?? 0) + 1
      }
      accumulateEffectAgg(entry.effectCounts, winner.deck)
      return entry
    },
  })

  const top4ByCombo = groupByCombo(top4Players, {
    init: () => 0,
    accumulate: count => count + 1,
  })

  return { comboArchetypes, winnersByCombo, top4ByCombo }
}

// ── Series metadata ──────────────────────────────────────────────────────────

// Filters out empty decks, splits players into all/winners/top4 buckets
function getSeriesMetadata(series) {
  const allPlayers = series.events.flatMap(e =>
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
  const winners = allPlayers.filter(isWinner)
  const top4Players = allPlayers.filter(p => TOP4.includes(p.rank))
  return { allPlayers, winners, top4Players }
}

function getSeriesEventDateRange(series) {
  const dates = series.events
    .map(event => event.date)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
  return {
    eventMinDate: dates[0] ?? null,
    eventMaxDate: dates.at(-1) ?? null,
  }
}

// ── Scoring / tiers ──────────────────────────────────────────────────────────

// Series with fewer events get tiers flagged as preliminary in the UI
const MIN_EVENTS_FOR_TIERS = 50
// Aim for at least this many archetypes per tier when choosing the tier count
const ARCHETYPES_PER_TIER = 4
const TIER_LABELS = ['S', 'A', 'B', 'C', 'D']

// Wins per placed deck, shrunk toward the series average as if every archetype
// had this many extra placed decks at the average rate
const CONVERSION_PRIOR_DECKS = 10

function smoothedConversion(wins, archDecks, avgConversion) {
  return (wins + CONVERSION_PRIOR_DECKS * avgConversion) / (archDecks + CONVERSION_PRIOR_DECKS)
}

// Results only list each event's placed decks (top 8, or top 16 for larger
// events), so placement share (an archetype's placed decks ÷ all placed decks)
// is itself a performance measure, and it is stable from one series to the next.
// 9th–16th places count like 1st–8th: dropping them barely changed tiers and
// backtested slightly worse. How well an archetype converts placements into wins
// carries over less, but placing without winning should still cost: placement
// share × (smoothed conversion ÷ series average). Converting at 60% of average
// costs 40%; 15 placed decks with no wins keep 40%. Strength is the square root
// of that, because shares are
// heavily skewed (a few archetypes hold most placements) and the root spreads the
// long tail for tiering and display.
function archetypeStrength({ wins, archDecks, totalDecks, avgConversion }) {
  const placementShare = (archDecks / totalDecks) * 100
  const conversionFactor = smoothedConversion(wins, archDecks, avgConversion) / avgConversion
  return Math.sqrt(placementShare * conversionFactor)
}

// Displayed score: strength as 0–100 of the series' strongest archetype
function strengthIndex(strength, maxStrength) {
  return maxStrength > 0 ? Math.round((strength / maxStrength) * 100) : 0
}

// ckmeans clustering on strength → tier cutoffs (S → D).
// Falls back to equal-sized buckets if ckmeans fails (e.g. all scores identical).
// The tier count comes from every archetype in the series (`archetypeCount`), so
// leaving some out of the clustering doesn't drop tiers.
function computeTierThresholds(strengths, archetypeCount = strengths.length) {
  const sorted = [...strengths].sort((a, b) => a - b)
  const k = Math.max(
    1,
    Math.min(5, sorted.length, Math.floor(archetypeCount / ARCHETYPES_PER_TIER)),
  )
  let clusters
  try {
    clusters = ss.ckmeans(sorted, k)
  } catch {
    clusters = Array.from({ length: k }, (_, i) => {
      const start = Math.floor((i * sorted.length) / k)
      const end = Math.floor(((i + 1) * sorted.length) / k)
      return sorted.slice(start, end)
    })
  }

  const clusterMins = clusters.map(cluster => cluster[0]).reverse()

  return clusterMins.map((val, idx) => ({
    id: TIER_LABELS[idx].toLowerCase(),
    min: val,
    label: TIER_LABELS[idx],
  }))
}

// Tier order, then strength: the order of the tier list, and so the rank
function compareTierRank(a, b) {
  return (
    TIER_LABELS.indexOf(a.tierLabel) - TIER_LABELS.indexOf(b.tierLabel) ||
    b.tierStrength - a.tierStrength
  )
}

// Highest threshold the strength meets; falls back to lowest tier
function getDeckTier(strength, thresholds) {
  return thresholds.find(t => strength >= t.min) || thresholds.at(-1)
}

// ── Output formatting ────────────────────────────────────────────────────────

// Maps "Blue+Purple" → [{name, hex}] for UI dot rendering
function colorDots(colors) {
  return colors.split('+').map(name => ({ name, hex: COLOR_HEX[name] || '#718096' }))
}

// Formats archetype data into display rows for tiers.json.
// Converts ASCII parens in combo keys to fullwidth for Japanese display.
// Sorted by tier, then strength (see compareTierRank).
function formatTierRows(series) {
  return series.archetypes
    .filter(a => a.deckCount > 0)
    .sort(compareTierRank)
    .map(a => {
      const useRate = (a.deckCount / series.totalDecks) * 100
      const winRateEvent = (a.winnerDeckCount / series.totalEvents) * 100
      const winRateDeck = (a.winnerDeckCount / a.deckCount) * 100
      const top4PerDeck = a.deckCount > 0 ? (a.top4 ?? 0) / a.deckCount : 0
      const baseCombo = a.combo.split(' (')[0]
      const sigPart = a.combo.match(/\((.+)\)/)?.[1]
      // Fullwidth parens for display consistency in Japanese UI
      const archetypeName = sigPart ? `${baseCombo}（${sigPart}）` : baseCombo

      return {
        archetype: archetypeName,
        colors: baseCombo,
        colorDots: colorDots(baseCombo),
        sigCards: a.sigCards,
        sigCardIds: a.sigCardIds,
        // Each signature card's total copies across the archetype's decks and its
        // level, in sigCardIds order, so the UI can pick which card's art to show
        sigCardStats: a.sigCardIds.map(id => {
          const card = [...(a.cards ?? []), ...(a.filteredCards ?? [])].find(c => c.cardId === id)
          return { copies: card?.totalQty ?? 0, level: Number(card?.level) || 0 }
        }),
        // Every card the archetype's decks play, for card-number search; moved
        // out to tier-card-ids.json before tiers.json is written
        cardIds: [...new Set([...(a.cards ?? []), ...(a.filteredCards ?? [])].map(c => c.cardId))],
        decks: a.deckCount,
        wins: a.winnerDeckCount,
        top4: a.top4 ?? 0,
        usePct: `${useRate.toFixed(1)}%`,
        winPerEv: `${winRateEvent.toFixed(1)}%`,
        winPerDk: `${winRateDeck.toFixed(1)}%`,
        t4PerDk: `${(top4PerDeck * 100).toFixed(1)}%`,
        score: a.tierScore,
        tier: a.tierLabel,
        darkHorse: a.darkHorse ?? false,
      }
    })
}

// ── Phase: Build archetype details (card analysis) ───────────────────────────

// ── Card-level analysis ──

// Rewards cards with moderate inclusion (15–40%) and strong winner association (≥2 wins).
// Higher win/deck ratio with lower inclusion = more "techy".
// `effectDecks`: decks running this card's effect in any version. A rarely-used
// version of a common effect (11% M1アストレイ beside 85% ガンタンク) isn't a
// tech choice, so the upper bound checks the effect, not just this printing.
// `archetypeWins`: the archetype's winning decks. Decks with the card must win
// more often than the archetype as a whole, so a tech pick never shows a
// negative win-rate change (with vs without) in the UI.
function calculateTechScore(
  wins,
  decks,
  totalArchetypeDecks,
  isVanilla = false,
  effectDecks = decks,
  archetypeWins = 0,
) {
  if (isVanilla) {
    return 0
  }
  const inclusionRate = decks / totalArchetypeDecks
  if (effectDecks / totalArchetypeDecks > 0.4 || inclusionRate <= 0.1) {
    return 0
  }
  if (wins < 2) {
    return 0
  }
  if (wins / decks <= archetypeWins / totalArchetypeDecks) {
    return 0
  }
  return Math.round((wins / decks) * (1 - inclusionRate) * 1000) / 1000
}

// Featured cards: everything in more than 10% of the archetype's decks. Rarer
// cards go to "Other Cards" — no per-type quota, so a pilot in 3 decks isn't
// featured beside the staples just to fill a slot.
const FEATURED_MIN_INCLUSION = 0.1
function selectTopCards(allCards) {
  return allCards.filter(
    c => TYPE_PICK_ORDER.includes(c.type) && c.inclusionRate > FEATURED_MIN_INCLUSION,
  )
}

// Counts feature keyword frequency across featured cards for UI badges
function computeFeatureBadges(topCards) {
  const featureCounts = {}
  for (const card of topCards) {
    if (!TYPE_PICK_ORDER.includes(card.type) || !card.features) {
      continue
    }
    for (const feature of card.features
      .split(' ')
      .map(s => s.trim())
      .filter(Boolean)) {
      if (feature === '-') {
        continue
      }
      featureCounts[feature] = (featureCounts[feature] || 0) + 1
    }
  }
  return Object.entries(featureCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

// Full card analysis per archetype: aggregates card stats, computes tech scores,
// selects featured cards, extracts signature cards from combo key.
function buildArchetypeDetails(comboArchetypes, winnersByCombo, top4ByCombo, totalAll) {
  return Object.entries(comboArchetypes).map(([combo, group]) => {
    const winnerInfo = winnersByCombo[combo]
    const top4Count = top4ByCombo[combo] ?? 0
    const count = group.count
    const cardAgg = group.cardAgg

    const winnerCounts = winnerInfo?.cardCounts ?? {}

    const allCards = Object.entries(cardAgg).map(([cardId, cardData]) => {
      const info = lookup(cardId)
      // Vanilla cards (no effect) get techScore=0 — still show counts but never get winner ribbon
      const isVanilla = vanillaGroup[cardId] ?? false
      return {
        cardId,
        name: info.name,
        color: info.color,
        type: info.type,
        cost: info.cost,
        level: info.level,
        ap: info.ap,
        hp: info.hp,
        features: info.features,
        rarity: info.rarity,
        decksIncluded: cardData.decksIncluded,
        inclusionRate: +(cardData.decksIncluded / count).toFixed(4),
        winnerDeckCount: winnerCounts[cardId] || 0,
        avgQty: Math.round(cardData.totalQty / cardData.decksIncluded),
        totalQty: cardData.totalQty,
        inWinner: false,
        techScore: calculateTechScore(
          winnerCounts[cardId] || 0,
          cardData.decksIncluded,
          count,
          isVanilla,
          group.effectAgg[functionKey(cardId)] ?? cardData.decksIncluded,
          winnerInfo?.count ?? 0,
        ),
      }
    })

    // Same-effect groups: cards here that play the same under different names.
    // Each member keeps its own stats and gets `effectGroup` with the group's
    // decks and winning decks (any version), and decks running every version,
    // which the UI shows them under.
    const membersByKey = {}
    for (const c of allCards) {
      ;(membersByKey[functionKey(c.cardId)] ??= []).push(c.cardId)
    }
    const deckIdSets = group.deckCardIds.map(
      s => new Set(s.split('|').map(entry => entry.split(':')[0])),
    )
    const decksWithAll = ids => deckIdSets.filter(set => ids.every(id => set.has(id))).length
    for (const c of allCards) {
      const key = functionKey(c.cardId)
      const ids = membersByKey[key]
      if (ids.length > 1) {
        c.effectGroup = {
          id: [...ids].sort((a, b) => a.localeCompare(b)).join('+'),
          decks: group.effectAgg[key] ?? 0,
          wins: winnerInfo?.effectCounts?.[key] ?? 0,
          allDecks: decksWithAll(ids),
        }
      }
    }

    // Top 3 tech cards get the winner ribbon in the UI
    const topTechCards = allCards
      .filter(c => c.techScore > 0)
      .sort((a, b) => b.techScore - a.techScore)
      .slice(0, 3)
    for (const card of topTechCards) {
      card.inWinner = true
    }

    // Sort: type order, then inclusion rate, signature cards, rarity, card ID, color
    const rarityScore = rarity =>
      rarity?.startsWith('LR') ? 100 : rarity?.startsWith('R') ? 50 : 0
    const sigSet = new Set(group.sigCardIds ?? [])
    allCards.sort(
      (a, b) =>
        (TYPE_ORDER[a.type.toLowerCase()] ?? 9) - (TYPE_ORDER[b.type.toLowerCase()] ?? 9) ||
        b.inclusionRate - a.inclusionRate ||
        sigSet.has(b.cardId) - sigSet.has(a.cardId) ||
        rarityScore(b.rarity) - rarityScore(a.rarity) ||
        a.cardId.localeCompare(b.cardId) ||
        a.color.localeCompare(b.color),
    )

    const topCards = selectTopCards(allCards)
    const topCardIds = new Set(topCards.map(c => c.cardId))
    const filteredCards = allCards.filter(c => !topCardIds.has(c.cardId))
    const featureBadges = computeFeatureBadges(topCards)

    const sigCardIds = group.sigCardIds ?? []
    const sigCards = sigCardIds.map(cardId => {
      const card = allCards.find(c => c.cardId === cardId)
      return { name: card?.name ?? '?', color: card?.color ?? 'inherit' }
    })

    const deckCardIds = group.deckCardIds

    return {
      combo,
      sigCards,
      sigCardIds,
      cardCount: allCards.length,
      deckCount: count,
      percent: +((count / totalAll) * 100).toFixed(1),
      winnerDeckCount: winnerInfo?.count ?? 0,
      top4: top4Count,
      cards: topCards,
      filteredCards,
      featureBadges,
      deckUrls: group.deckUrls,
      deckWinnerFlags: group.deckWinnerFlags,
      deckMeta: group.deckMeta,
      deckCardIds,
    }
  })
}

// ── Card state ────────────────────────────────────────────────────────────

function buildCardState(mainDetails, eventMaxDate) {
  const usedCardIds = new Set()
  for (const arch of mainDetails) {
    for (const card of arch.cards) {
      if (!card.cardId) {
        continue
      }
      usedCardIds.add(card.cardId)
    }
    for (const card of arch.filteredCards) {
      if (!card.cardId) {
        continue
      }
      usedCardIds.add(card.cardId)
    }
  }

  const usedByColor = {}
  const cardMap = new Map(baseCards.map(c => [c.id, c]))
  for (const id of usedCardIds) {
    const color = cardMap.get(id)?.color || '?'
    usedByColor[color] = (usedByColor[color] || 0) + 1
  }

  const releasedCards = baseCards.filter(
    c =>
      TYPE_PICK_ORDER.includes(c.type) &&
      c.releaseDate &&
      addDays(c.releaseDate, 7) <= eventMaxDate,
  ).length

  return {
    releasedCards,
    usedCards: usedCardIds.size,
    unusedCards: releasedCards - usedCardIds.size,
    usedByColor,
  }
}

// ── Phase: Process one series ────────────────────────────────────────────────

function processSeries(series) {
  const { allPlayers, winners, top4Players } = getSeriesMetadata(series)
  const { eventMinDate, eventMaxDate } = getSeriesEventDateRange(series)

  const { comboArchetypes, winnersByCombo, top4ByCombo } = buildArchetypeMaps(
    allPlayers,
    winners,
    top4Players,
  )

  const archetypeDetails = buildArchetypeDetails(
    comboArchetypes,
    winnersByCombo,
    top4ByCombo,
    allPlayers.length,
  )

  // Filter to archetypes with at least 3 decks
  const minSize = 3
  const mainDetails = archetypeDetails
    .filter(a => a.deckCount >= minSize)
    .sort((a, b) => b.deckCount - a.deckCount)

  // Collect unassigned decks: no sig card OR filtered-out archetype (< minSize decks)
  const smallArchKeys = new Set(
    archetypeDetails.filter(a => a.deckCount < minSize).map(a => a.combo),
  )
  const unassignedDeckData = allPlayers
    .filter(p => {
      const { key, sigCardIds } = buildComboKey(p.deck)
      return (sigCardIds.length === 0 || smallArchKeys.has(key)) && !!(p.deckUrl || p.eventUrl)
    })
    .map(p => ({
      deckUrl: p.deckUrl || p.eventUrl,
      isWinner: isWinner(p),
      deckCardIds: serializeDeckCards(p.deck),
      meta: deckMeta(p),
    }))

  // Aggregate all decks by color combo for the pie chart
  const colorComboMap = {}
  for (const p of allPlayers) {
    const colors = getDeckColors(p.deck).join('+')
    if (!colorComboMap[colors]) {
      colorComboMap[colors] = { colors, decks: 0, wins: 0, sigCardIds: {} }
    }
    const c = colorComboMap[colors]
    c.decks++
    if (isWinner(p)) {
      c.wins++
    }
    const sigData = getSignatureCard(p.deck)
    if (sigData) {
      for (const sig of sigData) {
        c.sigCardIds[sig.cardId] = (c.sigCardIds[sig.cardId] || 0) + 1
      }
    }
  }
  const colorComboData = Object.values(colorComboMap)
    .map(c => {
      const sorted = Object.entries(c.sigCardIds).sort((a, b) => b[1] - a[1])
      return {
        colors: c.colors,
        decks: c.decks,
        wins: c.wins,
        sigCardIds: sorted.map(([id]) => id),
      }
    })
    .sort((a, b) => b.decks - a.decks)

  // Write per-archetype detail files (lazy-loaded by UI)
  const seriesDir = `data-processed/archetypes/${series.value}`
  mkdirSync(seriesDir, { recursive: true })
  for (const [idx, arch] of mainDetails.entries()) {
    const file = `${seriesDir}/${idx}.json`
    writeFileSync(file, JSON.stringify(arch, null, 2))
  }

  // Pre-aggregated card data for MetaOverview (eliminates 73 runtime imports)
  const cardMap = {}
  const sigCardCounts = {}
  // expectedWinnerDecks: winner decks the card would have if it won at the rate of
  // each archetype that plays it, so the chart can show the card's own lift.
  // sumSqDecks feeds the effective archetype count (inverse Simpson index).
  const accumulateCard = (card, arch) => {
    if (!card.cardId) {
      return
    }
    const expected = card.decksIncluded * (arch.winnerDeckCount / arch.deckCount)
    const c = cardMap[card.cardId]
    if (c) {
      c.totalDecksIncluded += card.decksIncluded
      c.totalWinnerDecks += card.winnerDeckCount
      c.totalQty += card.totalQty
      c.archetypeCount += 1
      c.expectedWinnerDecks += expected
      c.sumSqDecks += card.decksIncluded ** 2
    } else {
      const info = lookup(card.cardId)
      cardMap[card.cardId] = {
        cardId: card.cardId,
        name: card.name,
        color: card.color,
        type: card.type,
        rarity: card.rarity,
        cost: info.cost,
        level: info.level,
        totalDecksIncluded: card.decksIncluded,
        totalWinnerDecks: card.winnerDeckCount,
        totalQty: card.totalQty,
        archetypeCount: 1,
        expectedWinnerDecks: expected,
        sumSqDecks: card.decksIncluded ** 2,
      }
    }
  }
  for (const arch of mainDetails) {
    for (const card of arch.cards) {
      accumulateCard(card, arch)
    }
    for (const card of arch.filteredCards) {
      accumulateCard(card, arch)
    }
    for (const sigId of arch.sigCardIds ?? []) {
      const sig = (sigCardCounts[sigId] ??= { archetypes: 0, decks: 0 })
      sig.archetypes++
      sig.decks += arch.deckCount
    }
  }

  const cards = Object.values(cardMap)
  for (const card of cards) {
    card.avgQty = Math.round(card.totalQty / card.totalDecksIncluded)
    card.expectedWinnerDecks = +card.expectedWinnerDecks.toFixed(2)
    // How many archetypes the card is spread across if they all played it equally
    card.effectiveArchetypes = +(card.totalDecksIncluded ** 2 / card.sumSqDecks).toFixed(1)
    delete card.sumSqDecks
  }
  // Signature cards ranked by the decks of the archetypes built around them, so
  // one 300-deck archetype outweighs several 3-deck ones
  const sigCards = Object.entries(sigCardCounts)
    .map(([cardId, sig]) => {
      const info = cardMap[cardId] || {}
      return {
        cardId,
        name: info.name || '?',
        color: info.color || 'inherit',
        rarity: info.rarity || '',
        archetypeCount: sig.archetypes,
        deckCount: sig.decks,
        deckShare: +((sig.decks / allPlayers.length) * 100).toFixed(1),
        avgQty: info.avgQty || 0,
      }
    })
    .sort((a, b) => b.deckCount - a.deckCount || b.archetypeCount - a.archetypeCount)

  const aggregatedCards = {
    cards,
    topPlayed: [...cards].sort((a, b) => b.totalDecksIncluded - a.totalDecksIncluded).slice(0, 10),
    topWinner: [...cards].sort((a, b) => b.totalWinnerDecks - a.totalWinnerDecks).slice(0, 10),
    topSigCards: sigCards.slice(0, 10),
    sigCards,
  }

  writeFileSync(`${seriesDir}/_cards.json`, JSON.stringify(aggregatedCards, null, 2))

  // Compute tier scores and thresholds
  const seriesProcessed = {
    value: series.value,
    label: series.label,
    totalEvents: series.events.length,
    totalDecks: allPlayers.length,
    archetypes: mainDetails,
  }

  // Score each archetype and assign a tier label
  const avgConversion = winners.length / allPlayers.length
  for (const a of seriesProcessed.archetypes) {
    a.tierStrength = archetypeStrength({
      wins: a.winnerDeckCount,
      archDecks: a.deckCount,
      totalDecks: allPlayers.length,
      avgConversion,
    })
  }
  const strengths = seriesProcessed.archetypes.map(a => a.tierStrength)
  const maxStrength = Math.max(0, ...strengths)
  // Cluster only archetypes that won: 0-win ones go to D regardless (below), and
  // their placement-only strengths would otherwise pull the cutoffs around
  const winnerStrengths = seriesProcessed.archetypes
    .filter(a => a.winnerDeckCount > 0)
    .map(a => a.tierStrength)
  seriesProcessed.tierThresholds = computeTierThresholds(
    winnerStrengths.length ? winnerStrengths : strengths,
    strengths.length,
  )
  for (const a of seriesProcessed.archetypes) {
    a.tierScore = strengthIndex(a.tierStrength, maxStrength)
    // No wins means no tier above D, even in small series whose clustering
    // only produces S–B: placing alone isn't enough to call a deck good
    a.tierLabel =
      a.winnerDeckCount === 0
        ? 'D'
        : getDeckTier(a.tierStrength, seriesProcessed.tierThresholds).label
  }
  const rankOf = new Map(
    seriesProcessed.archetypes
      .filter(a => a.deckCount > 0)
      .sort(compareTierRank)
      .map((a, i) => [a.combo, i + 1]),
  )

  // Mark dark horses: under-the-radar archetypes (< 2% of placed decks) that convert
  // placements into wins well above the series average. The smoothing keeps a
  // 2-for-5 run from dominating.
  const conversion = a => smoothedConversion(a.winnerDeckCount, a.deckCount, avgConversion)
  const darkHorses = seriesProcessed.archetypes
    .filter(
      a =>
        a.deckCount >= 5 &&
        a.winnerDeckCount >= 2 &&
        a.deckCount / allPlayers.length < 0.02 &&
        conversion(a) >= avgConversion * 1.3,
    )
    .sort((a, b) => conversion(b) - conversion(a))
    .slice(0, 3)
  const darkHorseSet = new Set(darkHorses.map(a => a.combo))
  for (const a of seriesProcessed.archetypes) {
    a.darkHorse = darkHorseSet.has(a.combo)
  }

  // Lightweight manifest for dropdown navigation — no card/feature details, no top4
  const manifestEntry = {
    value: series.value,
    label: series.label,
    eventMinDate,
    eventMaxDate,
    winDecks: winners.length,
    archetypes: mainDetails.map(a => ({
      combo: a.combo,
      sigCards: a.sigCards,
      cardCount: a.cards.length,
      deckCount: a.deckCount,
      percent: a.percent,
      winnerDeckCount: a.winnerDeckCount,
      tier: a.tierLabel,
      rank: rankOf.get(a.combo) ?? null,
      darkHorse: a.darkHorse ?? false,
    })),
  }

  // Card state for current series
  const cardState = buildCardState(mainDetails, eventMaxDate)

  // Build tiers.json rows
  const tierEntry = {
    value: series.value,
    label: series.label,
    events: series.events.length,
    preliminary: series.events.length < MIN_EVENTS_FOR_TIERS,
    eventMinDate,
    eventMaxDate,
    winDecks: winners.length,
    totalDecks: allPlayers.length,
    rows: formatTierRows(seriesProcessed),
    cardState,
    unassignedDecks: {
      count: unassignedDeckData.length,
      deckUrls: unassignedDeckData.map(d => d.deckUrl),
      deckCardIds: unassignedDeckData.map(d => d.deckCardIds),
      deckWinnerFlags: unassignedDeckData.map(d => d.isWinner),
      deckMeta: unassignedDeckData.map(d => d.meta),
    },
    colorComboData,
  }

  return { tierEntry, manifestEntry }
}

// ── Main ─────────────────────────────────────────────────────────────────────

// Load scraped data, process each series, write outputs
// Merge official (tournaments-all.json) + Bandai+ (tournaments-bandai-all.json) series
const tournaments = [...loadJSON('data/tournaments-all.json')]

if (existsSync('data/tournaments-bandai-all.json')) {
  tournaments.push(...loadJSON('data/tournaments-bandai-all.json'))
}

mkdirSync('data-processed/archetypes', { recursive: true })

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

// Every monthly entry gets a short label, e.g. "2026-11 (NTC M5)" or
// "2026-09 (NTC M4 + Serial)". Single-series months keep their original value so
// existing ?series= links still work.
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

// Remove stale archetype folders from previous runs that no longer match any
// series value in this build (e.g. pre-merge per-format folders).
const keepValues = new Set(mergedSeries.map(s => s.value))
for (const dir of readdirSync('data-processed/archetypes', { withFileTypes: true })) {
  if (dir.isDirectory() && !keepValues.has(dir.name)) {
    rmSync(`data-processed/archetypes/${dir.name}`, { recursive: true, force: true })
    console.log(`Removed stale archetype folder: ${dir.name}`)
  }
}

const tierData = []
const manifest = []

for (const series of mergedSeries) {
  console.log(`Processing: ${series.label}`)
  const result = processSeries(series)
  tierData.push(result.tierEntry)
  manifest.push(result.manifestEntry)
}

tierData.sort((a, b) => (b.eventMaxDate || '').localeCompare(a.eventMaxDate || ''))
manifest.sort((a, b) => (b.eventMaxDate || '').localeCompare(a.eventMaxDate || ''))

// Card numbers per archetype go to their own file, which the tier page loads
// only when someone searches by card number, so tiers.json stays small for
// every page: { [series]: { [archetype]: [cardId, …] } }
const cardIdIndex = {}
for (const entry of tierData) {
  cardIdIndex[entry.value] = {}
  for (const row of entry.rows) {
    cardIdIndex[entry.value][row.archetype] = row.cardIds
    delete row.cardIds
  }
}
writeFileSync('data-processed/tier-card-ids.json', JSON.stringify(cardIdIndex))
console.log('Saved data-processed/tier-card-ids.json')

writeFileSync('data-processed/tiers.json', JSON.stringify(tierData, null, 2))
console.log(
  `Saved data-processed/tiers.json (${tierData.length} series, ${tierData.reduce((s, t) => s + t.rows.length, 0)} archetype rows)`,
)

writeFileSync('data-processed/archetypes/index.json', JSON.stringify(manifest, null, 2))
console.log(
  `Saved data-processed/archetypes/index.json (${manifest.length} series, ${manifest.reduce((s, t) => s + t.archetypes.length, 0)} archetypes)`,
)
