import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import * as ss from 'simple-statistics'
import { WINNER, TOP4, COLOR_HEX, TYPE_ORDER, TYPE_PICK_ORDER } from './constants.mjs'

function loadJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

// ── Card lookups ─────────────────────────────────────────────────────────────

// Builds cardId→info map, name→color lookup, and vanilla grouping key.
// Vanilla cards (no effect) are grouped by stats alone (level|cost|ap|hp)
// so functionally identical cards across different colors/names are detected.
function createCardLookups(cardsRaw) {
  const cardMap = {}
  const nameToColor = {}
  const vanillaGroup = {}

  for (const card of cardsRaw) {
    const key = card.cardNo
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
    nameToColor[card.name] ??= card.color
    vanillaGroup[card.cardNo] =
      card.effect === '-'
        ? `${card.level}|${card.cost}|${card.ap}|${card.hp}|-`
        : `${card.color}|${card.level}|${card.cost}|${card.ap}|${card.hp}|${card.effect || '-'}`
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

  return { lookup, nameToColor, vanillaGroup }
}

// ── Deck analysis ────────────────────────────────────────────────────────────

// Sorted unique colors in a deck, used for combo key prefix
function getDeckColors(deck, lookup) {
  const colors = new Set()
  for (const card of deck) {
    colors.add(lookup(card.cardId).color)
  }
  return [...colors].sort()
}

// Identifies 1–2 signature LR UNIT cards per archetype.
// Scored by qty×10 + level×7. Only cards appearing in qty≥2 qualify.
// Single-color signature: pick top 2. Multi-color: pick top 1 per color.
function getSignatureCard(deck, lookup) {
  const best = {}
  for (const card of deck) {
    const info = lookup(card.cardId)
    if (info.type !== 'UNIT' || !info.rarity?.startsWith('LR')) {
      continue
    }
    const lv = parseInt(info.level) || 0
    const score = card.quantity * 10 + lv * 7
    const color = info.color
    best[color] ??= []
    const entry = { name: info.name, color, score, qty: card.quantity }
    best[color].push(entry)
    best[color].sort((a, b) => b.score - a.score)
  }

  const colors = Object.keys(best).sort()
  const qualifiers = {}
  for (const color of colors) {
    qualifiers[color] = best[color].filter(entry => entry.qty >= 2)
  }
  const colorsWith = colors.filter(color => qualifiers[color].length > 0)

  let signatures
  if (colorsWith.length <= 1 && colorsWith.length > 0) {
    const color = colorsWith[0]
    signatures = qualifiers[color].slice(0, 2).map(entry => ({
      name: entry.name,
      color: entry.color,
    }))
  } else {
    signatures = colorsWith.map(color => {
      const entry = qualifiers[color][0]
      return { name: entry.name, color: entry.color }
    })
  }

  return signatures.length > 0 ? signatures : null
}

// Archetype grouping key: "Color1+Color2 (Sig1 / Sig2)"
function buildComboKey(deck, lookup) {
  const colors = getDeckColors(deck, lookup)
  if (colors.length === 0) {
    return null
  }
  const sigData = getSignatureCard(deck, lookup)
  const sigNames = sigData ? sigData.map(sig => sig.name) : []
  return colors.join('+') + (sigNames.length > 0 ? ` (${sigNames.join(' / ')})` : '')
}

// ── Archetype grouping ───────────────────────────────────────────────────────

// Groups decks (all, winners, top4) by combo key into separate maps
function buildArchetypeMaps(allPlayers, winners, top4Players, lookup) {
  const comboArchetypes = {}
  for (const player of allPlayers) {
    const combo = buildComboKey(player.deck, lookup)
    if (!combo) {
      continue
    }
    // Aggregate card stats and pre-serialize decks inline to avoid storing raw deck arrays
    comboArchetypes[combo] ??= {
      count: 0,
      cardAgg: {},
      deckCardIds: [],
      deckUrls: [],
      deckWinnerFlags: [],
    }
    const entry = comboArchetypes[combo]
    entry.count++
    entry.deckCardIds.push(serializeDeckCards(player.deck, lookup))
    const seen = new Set()
    for (const card of player.deck) {
      entry.cardAgg[card.cardId] ??= { totalQty: 0, decksIncluded: 0 }
      entry.cardAgg[card.cardId].totalQty += card.quantity
      if (!seen.has(card.cardId)) {
        entry.cardAgg[card.cardId].decksIncluded++
        seen.add(card.cardId)
      }
    }
    if (player.deckUrl) {
      entry.deckUrls.push(player.deckUrl)
      entry.deckWinnerFlags.push(player.rank === WINNER)
    }
  }

  const winnerComboArchetypes = {}
  for (const winner of winners) {
    const combo = buildComboKey(winner.deck, lookup)
    if (!combo) {
      continue
    }
    // Fold deduped per-card winner counting inline to avoid storing raw deck arrays
    winnerComboArchetypes[combo] ??= { count: 0, cardCounts: {} }
    winnerComboArchetypes[combo].count++
    const seen = new Set()
    for (const card of winner.deck) {
      if (!seen.has(card.cardId)) {
        winnerComboArchetypes[combo].cardCounts[card.cardId] =
          (winnerComboArchetypes[combo].cardCounts[card.cardId] ?? 0) + 1
        seen.add(card.cardId)
      }
    }
  }

  const top4ComboArchetypes = {}
  for (const p of top4Players) {
    const combo = buildComboKey(p.deck, lookup)
    if (!combo) {
      continue
    }
    top4ComboArchetypes[combo] ??= 0
    top4ComboArchetypes[combo]++
  }

  return { comboArchetypes, winnerComboArchetypes, top4ComboArchetypes }
}

// ── Card-level analysis ──────────────────────────────────────────────────────

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

// ── Series metadata ──────────────────────────────────────────────────────────

// Filters out empty decks, splits players into all/winners/top4 buckets
function getSeriesMetadata(series) {
  const allPlayers = series.events.flatMap(e => e.players).filter(p => p.deck.length > 0)
  const winners = allPlayers.filter(p => p.rank === WINNER)
  const top4Players = allPlayers.filter(p => TOP4.includes(p.rank))
  return {
    allPlayers,
    winners,
    top4Players,
    totalWinners: winners.length,
    totalAll: allPlayers.length,
    eventCount: series.events.length,
  }
}

// ── Scoring / tiers ──────────────────────────────────────────────────────────

// Scoring cap = 2× average winner win rate among winning archetypes.
// Prevents runaway scores in low-competition series.
function getSeriesCeiling(series) {
  const rates = series.archetypes
    .filter(a => a.winnerDeckCount > 0)
    .map(a => (a.winnerDeckCount / a.deckCount) * 100)
  if (rates.length === 0) {
    return 50
  }
  return (rates.reduce((a, b) => a + b, 0) / rates.length) * 2
}

// Average top-4 rate across winning archetypes, used as Bayesian prior
function getSeriesAvgTop4Rate(series) {
  const archs = series.archetypes.filter(a => a.winnerDeckCount > 0)
  if (archs.length === 0) {
    return 40
  }
  const totalTop4 = archs.reduce((s, a) => s + (a.top4 ?? 0), 0)
  const totalDecks = archs.reduce((s, a) => s + a.deckCount, 0)
  return totalDecks > 0 ? (totalTop4 / totalDecks) * 100 : 40
}

// Weighted composite score: event win share (0.5), usage rate (0.2),
// Bayesian-smoothed win rate (0.2), Bayesian-smoothed top-4 bonus (0.1).
// K=10 smoothing with prior = ceiling/2 for win rate, series avg top-4 rate for top-4.
// Penalty: archetypes with high usage but low win rate relative to ceiling get dinged.
function archetypeScoreV2(wins, archDecks, totalDecks, totalEvents, top4, ceiling, top4Prior) {
  if (wins === 0) {
    return 0
  }
  const w = [0.5, 0.2, 0.2, 0.1]
  const eventWinShare = totalEvents > 0 ? (wins / totalEvents) * 100 : 0
  const usageRate = totalDecks > 0 ? (archDecks / totalDecks) * 100 : 0
  const ceil = ceiling ?? 50
  const K = 10
  const prior = ceil / 2
  // Bayesian smoothing: (observed + K * prior) / (total + K)
  const archWinRate = archDecks > 0 ? ((wins + (K * prior) / 100) / (archDecks + K)) * 100 : 0
  const top4PriorRate = top4Prior ?? 40
  const top4Bonus = archDecks > 0 ? ((top4 + (K * top4PriorRate) / 100) / (archDecks + K)) * 100 : 0
  const raw = eventWinShare * w[0] + usageRate * w[1] + archWinRate * w[2] + top4Bonus * w[3]
  const penalty = Math.max(0, usageRate * (1 - archWinRate / ceil)) * 0.15
  // Confidence multiplier: archetypes with <10 decks get proportionally reduced scores
  // to prevent small-sample flukes from ranking high.
  const confidence = Math.min(1, archDecks / 10)
  return Math.round((raw - penalty) * 10 * confidence)
}

// ckmeans clustering on archetype scores → tier cutoffs (T1 → T3).
// Falls back to equal-sized buckets if ckmeans fails (e.g. all scores identical).
function computeTierThresholds(series) {
  const ceiling = getSeriesCeiling(series)
  const top4AvgRate = getSeriesAvgTop4Rate(series)
  const allScores = series.archetypes
    .filter(a => a.winnerDeckCount > 0)
    .map(a =>
      archetypeScoreV2(
        a.winnerDeckCount,
        a.deckCount,
        series.totalDecks,
        series.totalEvents,
        a.top4 ?? 0,
        ceiling,
        top4AvgRate,
      ),
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
        decks: a.deckCount,
        wins: a.winnerDeckCount,
        top4: a.top4 ?? 0,
        usePct: `${useRate.toFixed(1)}%`,
        winPerEv: `${winRateEvent.toFixed(1)}%`,
        winPerDk: `${winRateDeck.toFixed(1)}%`,
        t4PerDk: `${(top4PerDeck * 100).toFixed(1)}%`,
        score: a.tierScore,
        tier: a.tierLabel,
      }
    })
    .sort((a, b) => {
      const tA = a.tier === '--' ? 99 : parseFloat(a.tier.slice(1))
      const tB = b.tier === '--' ? 99 : parseFloat(b.tier.slice(1))
      return tA - tB || b.score - a.score
    })
}

// Serializes a deck to "ID:qty|ID:qty" for deck preview dedup comparison
function serializeDeckCards(deck, lookup) {
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

// ── Phase: Build archetype details (card analysis) ───────────────────────────

// Full card analysis per archetype: aggregates card stats, computes tech scores,
// selects featured cards, extracts signature cards from combo key.
function buildArchetypeDetails(
  comboArchetypes,
  winnerComboArchetypes,
  top4ComboArchetypes,
  totalAll,
  lookup,
  nameToColor,
  vanillaGroup,
) {
  return Object.entries(comboArchetypes).map(([combo, group]) => {
    const winnerInfo = winnerComboArchetypes[combo]
    const top4Count = top4ComboArchetypes[combo] ?? 0
    const count = group.count
    const cardAgg = group.cardAgg

    const winnerCounts = winnerInfo?.cardCounts ?? {}

    const allCards = Object.entries(cardAgg).map(([cardId, cardData]) => {
      const info = lookup(cardId)
      // Vanilla cards (no effect) get techScore=0 — still show counts but never get winner ribbon
      const isVanilla = vanillaGroup[cardId]?.endsWith('|-') ?? false
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

    const sigMatch = combo.match(/\((.+)\)/)
    const sigStr = sigMatch ? sigMatch[1] : null
    const sigCards = sigStr
      ? sigStr.split(' / ').map(name => ({
          name: name.trim(),
          color: nameToColor[name.trim()] || 'inherit',
        }))
      : []

    const sigCardIds = sigCards
      .map(s => allCards.find(c => c.name === s.name))
      .filter(Boolean)
      .map(c => c.cardId)

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

// ── Phase: Process one series ────────────────────────────────────────────────

function processSeries(series, lookup, nameToColor, vanillaGroup) {
  const { allPlayers, winners, top4Players, totalWinners, totalAll, eventCount } =
    getSeriesMetadata(series)

  const { comboArchetypes, winnerComboArchetypes, top4ComboArchetypes } = buildArchetypeMaps(
    allPlayers,
    winners,
    top4Players,
    lookup,
  )

  const archetypeDetails = buildArchetypeDetails(
    comboArchetypes,
    winnerComboArchetypes,
    top4ComboArchetypes,
    totalAll,
    lookup,
    nameToColor,
    vanillaGroup,
  )

  // Filter to archetypes with at least 3 decks
  const minSize = 3
  const mainDetails = archetypeDetails
    .filter(a => a.deckCount >= minSize)
    .sort((a, b) => b.deckCount - a.deckCount)

  // Write per-archetype detail files (lazy-loaded by UI)
  const seriesDir = `data-processed/archetypes/${series.value}`
  mkdirSync(seriesDir, { recursive: true })
  for (const [idx, arch] of mainDetails.entries()) {
    const file = `${seriesDir}/${idx}.json`
    writeFileSync(file, JSON.stringify(arch, null, 2))
  }

  // Compute tier scores and thresholds
  const seriesProcessed = {
    value: series.value,
    label: series.label,
    totalEvents: eventCount,
    totalDecks: totalAll,
    archetypes: mainDetails,
  }

  seriesProcessed.tierThresholds = computeTierThresholds(seriesProcessed)
  const ceiling = getSeriesCeiling(seriesProcessed)
  const top4AvgRate = getSeriesAvgTop4Rate(seriesProcessed)

  // Score each archetype and assign a tier label
  for (const a of seriesProcessed.archetypes) {
    a.tierScore = archetypeScoreV2(
      a.winnerDeckCount,
      a.deckCount,
      totalAll,
      totalWinners,
      a.top4 ?? 0,
      ceiling,
      top4AvgRate,
    )
    a.tierLabel =
      a.winnerDeckCount > 0 ? getDeckTier(a.tierScore, seriesProcessed.tierThresholds).label : '--'
  }

  // Lightweight manifest for dropdown navigation — no card/feature details, no top4
  const manifestEntry = {
    value: series.value,
    label: series.label,
    archetypes: mainDetails.map(a => ({
      combo: a.combo,
      sigCards: a.sigCards,
      cardCount: a.cardCount,
      deckCount: a.deckCount,
      percent: a.percent,
      winnerDeckCount: a.winnerDeckCount,
      tier: a.tierLabel,
    })),
  }

  // Build tiers.json rows
  const tierEntry = {
    value: series.value,
    label: series.label,
    events: eventCount,
    winDecks: totalWinners,
    totalDecks: totalAll,
    rows: formatTierRows(seriesProcessed),
  }

  return { tierEntry, manifestEntry }
}

// ── Main ─────────────────────────────────────────────────────────────────────

// Load scraped data, build lookups, process each series, write outputs
const tournaments = loadJSON('data/tournaments-all.json')
const cardsRaw = loadJSON('data/cards.json')
const { lookup, nameToColor, vanillaGroup } = createCardLookups(cardsRaw)

mkdirSync('data-processed/archetypes', { recursive: true })

const tierData = []
const manifest = []

for (const series of tournaments) {
  console.log(`Processing: ${series.label}`)
  const result = processSeries(series, lookup, nameToColor, vanillaGroup)
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
