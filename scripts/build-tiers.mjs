import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import * as ss from 'simple-statistics'
import { WINNER, TOP4, COLOR_HEX, TYPE_ORDER, TYPE_PICK_ORDER } from './constants.mjs'

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

  return { lookup, vanillaGroup }
}

const cardsRaw = loadJSON('data/cards.json')
const baseCards = cardsRaw.filter(c => !c.id.includes('_p'))
const { lookup, vanillaGroup } = createCardLookups(baseCards)

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

// Sorted unique colors in a deck, used for combo key prefix
function getDeckColors(deck) {
  return [...new Set(deck.map(card => lookup(card.cardId).color))].sort()
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
      deckCardIds: [],
      deckUrls: [],
      deckWinnerFlags: [],
    }),
    accumulate: (entry, player) => {
      entry.count++
      entry.deckCardIds.push(serializeDeckCards(player.deck))
      accumulateCardAgg(entry.cardAgg, player.deck)
      if (player.deckUrl) {
        entry.deckUrls.push(player.deckUrl)
        entry.deckWinnerFlags.push(player.rank === WINNER)
      }
      return entry
    },
  })

  const winnersByCombo = groupByCombo(winners, {
    init: () => ({ count: 0, cardCounts: {} }),
    accumulate: (entry, winner) => {
      entry.count++
      for (const card of winner.deck) {
        entry.cardCounts[card.cardId] = (entry.cardCounts[card.cardId] ?? 0) + 1
      }
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
  const allPlayers = series.events.flatMap(e => e.players).filter(p => p.deck.length > 0)
  const winners = allPlayers.filter(p => p.rank === WINNER)
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

// Average win rate across winning archetypes, used as Bayesian prior.
function getSeriesAvgDeckWinRate(series) {
  const rates = series.archetypes
    .filter(a => a.winnerDeckCount > 0)
    .map(a => (a.winnerDeckCount / a.deckCount) * 100)
  if (rates.length === 0) {
    return 25
  }
  return rates.reduce((a, b) => a + b, 0) / rates.length
}

// Average top-4 rate across winning archetypes, used as Bayesian prior
function getSeriesAvgDeckTop4Rate(series) {
  const archs = series.archetypes.filter(a => a.winnerDeckCount > 0)
  if (archs.length === 0) {
    return 40
  }
  const totalTop4 = archs.reduce((s, a) => s + (a.top4 ?? 0), 0)
  const totalDecks = archs.reduce((s, a) => s + a.deckCount, 0)
  return totalDecks > 0 ? (totalTop4 / totalDecks) * 100 : 40
}

// Bayesian smoothing with dynamic K:
//   K = baseK × (1 + deviation × 0.6) ÷ (1 + √total / 5), clamped to [4, 22]
//   more data → less shrinkage; larger deviation → more shrinkage
function bayesianRate(observed, total, avgRate, baseK = 15) {
  if (total <= 0) {
    return 0
  }

  const observedRate = (observed / total) * 100
  const deviation = avgRate > 0 ? Math.abs(observedRate - avgRate) / avgRate : 0

  let dynamicK = baseK * (1 + deviation * 0.6)
  dynamicK = dynamicK / (1 + Math.sqrt(total) / 5)
  dynamicK = Math.max(4, Math.min(22, dynamicK))

  return ((observed + (dynamicK * avgRate) / 100) / (total + dynamicK)) * 100
}

// Confidence multiplier: requires more deck evidence when an archetype's
// performance deviates from the series average. Baseline 10 decks, deviation
// penalty reduced by divisor /3.
function computeConfidence(archDecks, smoothedRate, avgRate) {
  const deviation = avgRate > 0 ? Math.abs(smoothedRate - avgRate) / avgRate : 0
  return Math.min(1, archDecks / (10 * (1 + deviation / 3)))
}

// Penalty: usageRate × gap × 0.15 — penalizes archetypes with high usage rate
// AND low win rate relative to the cap (capMultiplier × series average). Losses
// are proportional to both popularity and performance gap.
// Self-regulates: strong archetypes get gap≈0 → penalty≈0.
function computePenalty(usageRate, archWinRate, seriesAvgDeckWinRate, capMultiplier = 1.5) {
  const deckWinRateCap = seriesAvgDeckWinRate * capMultiplier
  const gap = Math.max(0, 1 - archWinRate / deckWinRateCap)
  return usageRate * gap * 0.15
}

// Weighted composite score: event win share (0.5), usage rate (0.3),
// Bayesian-smoothed win rate (0.1), Bayesian-smoothed top-4 bonus (0.1).
// K=15 smoothing with prior = series avg deck win rate / top-4 rate.
function archetypeScore({
  wins,
  archDecks,
  totalDecks,
  totalEvents,
  top4,
  seriesAvgDeckWinRate,
  seriesAvgDeckTop4Rate,
}) {
  if (wins === 0) {
    return 0
  }

  const eventWinShare = (wins / totalEvents) * 100
  const usageRate = (archDecks / totalDecks) * 100
  const archWinRate = bayesianRate(wins, archDecks, seriesAvgDeckWinRate)
  const top4Bonus = bayesianRate(top4, archDecks, seriesAvgDeckTop4Rate)

  const raw = eventWinShare * 0.5 + usageRate * 0.3 + archWinRate * 0.1 + top4Bonus * 0.1
  const penalty = computePenalty(usageRate, archWinRate, seriesAvgDeckWinRate)
  const confidence = computeConfidence(archDecks, archWinRate, seriesAvgDeckWinRate)

  return Math.round((raw - penalty) * 10 * confidence)
}

// ckmeans clustering on archetype scores → tier cutoffs (T1 → T3).
// Falls back to equal-sized buckets if ckmeans fails (e.g. all scores identical).
function computeTierThresholds(series) {
  const seriesAvgDeckWinRate = getSeriesAvgDeckWinRate(series)
  const seriesAvgDeckTop4Rate = getSeriesAvgDeckTop4Rate(series)
  const allScores = series.archetypes
    .filter(a => a.winnerDeckCount > 0)
    .map(a =>
      archetypeScore({
        wins: a.winnerDeckCount,
        archDecks: a.deckCount,
        totalDecks: series.totalDecks,
        totalEvents: series.totalEvents,
        top4: a.top4 ?? 0,
        seriesAvgDeckWinRate,
        seriesAvgDeckTop4Rate,
      }),
    )
    .sort((a, b) => b - a)

  const k = Math.min(5, allScores.length)
  let clusters
  try {
    clusters = ss.ckmeans(allScores, Math.max(1, k))
  } catch {
    const n = Math.max(1, k)
    clusters = Array.from({ length: n }, (_, i) => {
      const start = Math.floor((i * allScores.length) / n)
      const end = Math.floor(((i + 1) * allScores.length) / n)
      return allScores.slice(start, end)
    })
  }

  const clusterMins = clusters.map(cluster => cluster[0]).reverse()
  const allTierIds = ['1', '1-5', '2', '2-5', '3']
  const usedTierIds = allTierIds.slice(0, clusterMins.length)

  const thresholds = clusterMins.map((val, idx) => ({
    id: usedTierIds[idx],
    min: val,
    label: `T${usedTierIds[idx].replace('-', '.')}`,
  }))

  // Unranked archetypes (no wins) get a fallback tier below the lowest cluster
  const fallbackId = allTierIds[clusterMins.length] || '4'
  thresholds.push({ id: fallbackId, min: 0, label: `T${fallbackId.replace('-', '.')}` })

  return thresholds
}

// Highest threshold the score meets; falls back to lowest tier
function getDeckTier(score, thresholds) {
  return thresholds.find(t => score >= t.min) || thresholds.at(-1)
}

// ── Output formatting ────────────────────────────────────────────────────────

// Maps "Blue+Purple" → [{name, hex}] for UI dot rendering
function colorDots(colors) {
  return colors.split('+').map(name => ({ name, hex: COLOR_HEX[name] || '#718096' }))
}

// Formats archetype data into display rows for tiers.json.
// Converts ASCII parens in combo keys to fullwidth for Japanese display.
// Sorted by tier rank then score descending.
function formatTierRows(series) {
  return series.archetypes
    .filter(a => a.deckCount > 0)
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
    .sort((a, b) => {
      const tA = a.tier === '--' ? 99 : parseFloat(a.tier.slice(1))
      const tB = b.tier === '--' ? 99 : parseFloat(b.tier.slice(1))
      return tA - tB || b.score - a.score
    })
}

// ── Phase: Build archetype details (card analysis) ───────────────────────────

// ── Card-level analysis ──

// Rewards cards with moderate inclusion (15–40%) and strong winner association (≥2 wins).
// Higher win/deck ratio with lower inclusion = more "techy".
function calculateTechScore(wins, decks, totalArchetypeDecks, isVanilla = false) {
  if (isVanilla) {
    return 0
  }
  const inclusionRate = decks / totalArchetypeDecks
  if (inclusionRate > 0.4 || inclusionRate <= 0.1) {
    return 0
  }
  if (wins < 2) {
    return 0
  }
  return Math.round((wins / decks) * (1 - inclusionRate) * 1000) / 1000
}

// Two-pass featured-card selection:
//   1) Guarantee type coverage (4 each of UNIT/PILOT/COMMAND/BASE)
//   2) Fill remaining slots with cards above 15% inclusion, capped at 4 per non-UNIT type
function selectTopCards(allCards) {
  const perType = {}
  for (const card of allCards) {
    perType[card.type] ??= []
    perType[card.type].push(card)
  }

  const selectedIds = new Set()
  const selected = []

  // First pass: guarantee minimum cards per type regardless of inclusion rate
  for (const type of TYPE_PICK_ORDER) {
    const sliceSize = 4
    for (const card of (perType[type] || []).slice(0, sliceSize)) {
      selected.push(card)
      selectedIds.add(card.cardId)
    }
  }

  // Second pass: fill with high-inclusion cards up to 4 per non-UNIT type
  for (const card of allCards) {
    if (!TYPE_PICK_ORDER.includes(card.type) || selectedIds.has(card.cardId)) {
      continue
    }
    if (card.type !== 'UNIT') {
      const typeCount = selected.filter(tc => tc.type === card.type).length
      if (typeCount >= 4) {
        continue
      }
    }
    if (card.inclusionRate <= 0.1) {
      continue
    }
    selected.push(card)
    selectedIds.add(card.cardId)
  }

  return selected
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
        ),
      }
    })

    // Top 3 tech cards get the winner ribbon in the UI
    const topTechCards = allCards
      .filter(c => c.techScore > 0)
      .sort((a, b) => b.techScore - a.techScore)
      .slice(0, 3)
    for (const card of topTechCards) {
      card.inWinner = true
    }

    // Sort: type order, then inclusion rate, rarity, card ID, color
    const rarityScore = rarity =>
      rarity?.startsWith('LR') ? 100 : rarity?.startsWith('R') ? 50 : 0
    allCards.sort(
      (a, b) =>
        (TYPE_ORDER[a.type.toLowerCase()] ?? 9) - (TYPE_ORDER[b.type.toLowerCase()] ?? 9) ||
        b.inclusionRate - a.inclusionRate ||
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
      deckCardIds,
    }
  })
}

// ── Card state ────────────────────────────────────────────────────────────

function buildCardState(mainDetails, eventMaxDate) {
  const usedCardIds = new Set()
  for (const arch of mainDetails) {
    for (const card of arch.cards) {
      usedCardIds.add(card.cardId)
    }
    for (const card of arch.filteredCards) {
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
      return (sigCardIds.length === 0 || smallArchKeys.has(key)) && !!p.deckUrl
    })
    .map(p => ({
      deckUrl: p.deckUrl,
      isWinner: p.rank === WINNER,
      deckCardIds: serializeDeckCards(p.deck),
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
    if (p.rank === WINNER) {
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
  for (const arch of mainDetails) {
    for (const card of arch.cards) {
      const c = cardMap[card.cardId]
      if (c) {
        c.totalDecksIncluded += card.decksIncluded
        c.totalWinnerDecks += card.winnerDeckCount
        c.totalQty += card.totalQty
        c.archetypeCount += 1
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
        }
      }
    }
    for (const sigId of arch.sigCardIds ?? []) {
      sigCardCounts[sigId] = (sigCardCounts[sigId] || 0) + 1
    }
  }

  const cards = Object.values(cardMap)
  for (const card of cards) {
    card.avgQty = Math.round(card.totalQty / card.totalDecksIncluded)
  }
  const sigCards = Object.entries(sigCardCounts)
    .map(([cardId, count]) => {
      const info = cardMap[cardId] || {}
      return {
        cardId,
        name: info.name || '?',
        color: info.color || 'inherit',
        rarity: info.rarity || '',
        archetypeCount: count,
        avgQty: info.avgQty || 0,
      }
    })
    .sort((a, b) => b.archetypeCount - a.archetypeCount)

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

  seriesProcessed.tierThresholds = computeTierThresholds(seriesProcessed)
  const seriesAvgDeckWinRate = getSeriesAvgDeckWinRate(seriesProcessed)
  const seriesAvgDeckTop4Rate = getSeriesAvgDeckTop4Rate(seriesProcessed)

  // Score each archetype and assign a tier label
  for (const a of seriesProcessed.archetypes) {
    a.tierScore = archetypeScore({
      wins: a.winnerDeckCount,
      archDecks: a.deckCount,
      totalDecks: allPlayers.length,
      totalEvents: series.events.length,
      top4: a.top4 ?? 0,
      seriesAvgDeckWinRate,
      seriesAvgDeckTop4Rate,
    })
    a.tierLabel =
      a.winnerDeckCount > 0 ? getDeckTier(a.tierScore, seriesProcessed.tierThresholds).label : '--'
  }

  // Mark dark horses: low-usage archetypes that punch above their weight into competitive tiers
  const tierRank = { T1: 1, 'T1.5': 1.5, T2: 2 }
  const winningArchs = seriesProcessed.archetypes.filter(a => a.winnerDeckCount > 0)
  const medDecks = winningArchs.map(a => a.deckCount).sort((a, b) => a - b)[
    Math.floor(winningArchs.length / 2)
  ]
  const medScore = winningArchs.map(a => a.tierScore).sort((a, b) => a - b)[
    Math.floor(winningArchs.length / 2)
  ]
  const darkHorses = winningArchs
    .filter(
      a =>
        a.deckCount >= 5 &&
        a.deckCount < medDecks &&
        a.tierScore > medScore &&
        tierRank[a.tierLabel] !== undefined,
    )
    .sort((a, b) => b.tierScore / b.deckCount - a.tierScore / a.deckCount)
    .slice(0, 3)
  const darkHorseSet = new Set(darkHorses.map(a => a.combo))
  for (const a of seriesProcessed.archetypes) {
    a.darkHorse = darkHorseSet.has(a.combo)
  }

  // Lightweight manifest for dropdown navigation — no card/feature details, no top4
  const manifestEntry = {
    value: series.value,
    label: series.label,
    winDecks: winners.length,
    archetypes: mainDetails.map(a => ({
      combo: a.combo,
      sigCards: a.sigCards,
      cardCount: a.cards.length,
      deckCount: a.deckCount,
      percent: a.percent,
      winnerDeckCount: a.winnerDeckCount,
      tier: a.tierLabel,
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
    },
    colorComboData,
  }

  return { tierEntry, manifestEntry }
}

// ── Main ─────────────────────────────────────────────────────────────────────

// Load scraped data, process each series, write outputs
const tournaments = loadJSON('data/tournaments-all.json')

mkdirSync('data-processed/archetypes', { recursive: true })

const tierData = []
const manifest = []

for (const series of tournaments) {
  console.log(`Processing: ${series.label}`)
  const result = processSeries(series)
  tierData.push(result.tierEntry)
  manifest.push(result.manifestEntry)
}

writeFileSync('data-processed/tiers.json', JSON.stringify(tierData, null, 2))
console.log(
  `Saved data-processed/tiers.json (${tierData.length} series, ${tierData.reduce((s, t) => s + t.rows.length, 0)} archetype rows)`,
)

writeFileSync('data-processed/archetypes/index.json', JSON.stringify(manifest, null, 2))
console.log(
  `Saved data-processed/archetypes/index.json (${manifest.length} series, ${manifest.reduce((s, t) => s + t.archetypes.length, 0)} archetypes)`,
)
