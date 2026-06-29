import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import * as ss from 'simple-statistics'

const WINNER = '優勝'
const TOP4 = ['優勝', '準優勝', '3位', '4位']
const COLOR_HEX = {
  Blue: '#2b6cb0',
  White: '#cbd5e0',
  Purple: '#805ad5',
  Red: '#e53e3e',
  Green: '#38a169',
  Black: '#1a202c',
  Yellow: '#d69e2e',
}
const TYPE_ORDER = { unit: 0, pilot: 1, command: 2, base: 3 }

function loadJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function createCardLookups(cardsRaw) {
  const cardMap = {}
  const nameToColor = {}
  const cardToGroup = {}

  for (const card of cardsRaw) {
    const key = card.cardNo
    if (!cardMap[key]) {
      cardMap[key] = {
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
    }
    if (!nameToColor[card.name]) {
      nameToColor[card.name] = card.color
    }
    cardToGroup[card.cardNo] =
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

  return { lookup, nameToColor, cardToGroup }
}

function getDeckColors(deck, lookup) {
  const colors = new Set()
  for (const card of deck) {
    colors.add(lookup(card.cardId).color)
  }
  return [...colors].sort()
}

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
    if (!best[color]) {
      best[color] = []
    }
    const entry = { name: info.name, color, score, qty: card.quantity }
    best[color].push(entry)
    best[color].sort((a, b) => b.score - a.score)
    if (best[color].length > 2) {
      best[color].length = 2
    }
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

function buildComboKey(deck, lookup, useSig = true) {
  const colors = getDeckColors(deck, lookup)
  if (colors.length === 0) {
    return null
  }
  if (!useSig) {
    return colors.join('+')
  }
  const sigData = getSignatureCard(deck, lookup)
  const sigNames = sigData ? sigData.map(sig => sig.name) : []
  return colors.join('+') + (sigNames.length > 0 ? ` (${sigNames.join(' / ')})` : '')
}

function buildArchetypeMaps(allPlayers, winners, top4Players, lookup, useSig = true) {
  const comboArchetypes = {}
  for (const player of allPlayers) {
    const combo = buildComboKey(player.deck, lookup, useSig)
    if (!combo) {
      continue
    }
    if (!comboArchetypes[combo]) {
      comboArchetypes[combo] = {
        decks: [],
        deckUrls: [],
        deckWinnerFlags: [],
      }
    }
    comboArchetypes[combo].decks.push(player.deck)
    if (player.deckUrl) {
      comboArchetypes[combo].deckUrls.push(player.deckUrl)
      comboArchetypes[combo].deckWinnerFlags.push(player.rank === WINNER)
    }
  }

  const winnerComboArchetypes = {}
  for (const winner of winners) {
    const combo = buildComboKey(winner.deck, lookup, useSig)
    if (!combo) {
      continue
    }
    if (!winnerComboArchetypes[combo]) {
      winnerComboArchetypes[combo] = { decks: [] }
    }
    winnerComboArchetypes[combo].decks.push(winner.deck)
  }

  const top4ComboArchetypes = {}
  for (const p of top4Players) {
    const combo = buildComboKey(p.deck, lookup, useSig)
    if (!combo) {
      continue
    }
    if (!top4ComboArchetypes[combo]) {
      top4ComboArchetypes[combo] = { decks: [] }
    }
    top4ComboArchetypes[combo].decks.push(p.deck)
  }

  return { comboArchetypes, winnerComboArchetypes, top4ComboArchetypes }
}

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
  }
}

function getSeriesCeiling(series) {
  const rates = series.archetypes
    .filter(a => a.winnerDeckCount > 0)
    .map(a => (a.winnerDeckCount / a.deckCount) * 100)
  if (rates.length === 0) {
    return 50
  }
  const avg = rates.reduce((a, b) => a + b, 0) / rates.length
  return avg * 2
}

function getSeriesAvgTop4Rate(series) {
  const archs = series.archetypes.filter(a => a.winnerDeckCount > 0)
  if (archs.length === 0) {
    return 40
  }
  const totalTop4 = archs.reduce((s, a) => s + (a.top4 ?? 0), 0)
  const totalDecks = archs.reduce((s, a) => s + a.deckCount, 0)
  return totalDecks > 0 ? (totalTop4 / totalDecks) * 100 : 40
}

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
  const archWinRate = archDecks > 0 ? ((wins + (K * prior) / 100) / (archDecks + K)) * 100 : 0
  const top4PriorRate = top4Prior ?? 40
  const top4Bonus = archDecks > 0 ? ((top4 + (K * top4PriorRate) / 100) / (archDecks + K)) * 100 : 0
  const raw = eventWinShare * w[0] + usageRate * w[1] + archWinRate * w[2] + top4Bonus * w[3]
  const penalty = Math.max(0, usageRate * (1 - archWinRate / ceil)) * 0.15
  return Math.round((raw - penalty) * 10)
}

function computeTierThresholds(series) {
  const ceiling = getSeriesCeiling(series)
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
        getSeriesAvgTop4Rate(series),
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

  const fallbackId = allTierIds[clusterMins.length] || '4'
  thresholds.push({
    id: fallbackId,
    min: 0,
    label: `T${fallbackId.replace('-', '.')}`,
  })

  return thresholds
}

function getDeckTier(score, thresholds) {
  return thresholds.find(t => score >= t.min) || thresholds[thresholds.length - 1]
}

function colorDots(colors) {
  return colors.split('+').map(name => ({
    name,
    hex: COLOR_HEX[name] || '#718096',
  }))
}

// ─── Card-level analysis ─────────────────────────────────────────────────────

function countWinnerCards(winnerGroup) {
  const counts = {}
  if (!winnerGroup) {
    return counts
  }
  for (const deck of winnerGroup.decks) {
    const seen = new Set()
    for (const card of deck) {
      if (!seen.has(card.cardId)) {
        counts[card.cardId] = (counts[card.cardId] || 0) + 1
        seen.add(card.cardId)
      }
    }
  }
  return counts
}

function aggregateCards(groupDecks) {
  const cardStats = {}
  for (const deck of groupDecks) {
    const seen = new Set()
    for (const card of deck) {
      if (!cardStats[card.cardId]) {
        cardStats[card.cardId] = { totalQty: 0, decksIncluded: 0 }
      }
      cardStats[card.cardId].totalQty += card.quantity
      if (!seen.has(card.cardId)) {
        cardStats[card.cardId].decksIncluded++
        seen.add(card.cardId)
      }
    }
  }
  return cardStats
}

function calculateTechScore(wins, decks, totalArchetypeDecks) {
  const inclusionRate = decks / totalArchetypeDecks
  if (inclusionRate > 0.4 || inclusionRate <= 0.1) {
    return 0
  }
  if (wins < 2) {
    return 0
  }
  const score = (wins / decks) * (1 - inclusionRate)
  return Math.round(score * 1000) / 1000
}

function selectTopCards(allCards) {
  const perType = {}
  for (const card of allCards) {
    if (!perType[card.type]) {
      perType[card.type] = []
    }
    perType[card.type].push(card)
  }
  const typePickOrder = ['UNIT', 'PILOT', 'COMMAND', 'BASE']
  const selectedIds = new Set()
  const selected = []
  for (const type of typePickOrder) {
    const sliceSize = type === 'UNIT' ? 4 : 2
    for (const card of (perType[type] || []).slice(0, sliceSize)) {
      selected.push(card)
      selectedIds.add(card.cardId)
    }
  }
  for (const card of allCards) {
    if (!typePickOrder.includes(card.type)) {
      continue
    }
    if (card.type !== 'UNIT') {
      const typeCount = selected.filter(tc => tc.type === card.type).length
      if (typeCount >= 4) {
        continue
      }
    }
    if (selectedIds.has(card.cardId)) {
      continue
    }
    if (card.inclusionRate <= 0.1) {
      continue
    }
    selected.push(card)
    selectedIds.add(card.cardId)
  }
  return selected
}

function computeFeatureBadges(topCards) {
  const featureCounts = {}
  for (const card of topCards) {
    if (!['UNIT', 'PILOT', 'COMMAND', 'BASE'].includes(card.type)) {
      continue
    }
    if (card.features) {
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
  }
  return Object.entries(featureCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

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

// ─── Main ────────────────────────────────────────────────────────────────────

const tournaments = loadJSON('data/tournaments-all.json')
const cardsRaw = loadJSON('data/cards.json')

const { lookup, nameToColor } = createCardLookups(cardsRaw)

mkdirSync('data-processed/archetypes', { recursive: true })

const tierData = []
const manifest = []

for (const series of tournaments) {
  console.log(`Processing: ${series.label}`)

  const { allPlayers, winners, top4Players, totalWinners, totalAll } = getSeriesMetadata(series)

  const { comboArchetypes, winnerComboArchetypes, top4ComboArchetypes } = buildArchetypeMaps(
    allPlayers,
    winners,
    top4Players,
    lookup,
    true,
  )

  // --- Card-level analysis per archetype ---

  const archetypeDetails = Object.entries(comboArchetypes).map(([combo, group]) => {
    const winnerGroup = winnerComboArchetypes[combo]
    const top4Group = top4ComboArchetypes[combo]
    const groupDecks = group.decks
    const count = groupDecks.length

    const winnerCounts = countWinnerCards(winnerGroup)
    const cardAgg = aggregateCards(groupDecks)

    const allCards = Object.entries(cardAgg).map(([cardId, cardData]) => {
      const info = lookup(cardId)
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
        techScore: calculateTechScore(winnerCounts[cardId] || 0, cardData.decksIncluded, count),
      }
    })

    const topTechCards = allCards
      .filter(c => c.techScore > 0)
      .sort((a, b) => b.techScore - a.techScore)
      .slice(0, 3)
    for (const card of topTechCards) {
      card.inWinner = true
    }

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

    const deckCardIds = groupDecks.map(deck => serializeDeckCards(deck, lookup))

    const sigMatch = combo.match(/\((.+)\)/)
    const sigStr = sigMatch ? sigMatch[1] : null
    const sigCards = sigStr
      ? sigStr.split(' / ').map(name => ({
          name: name.trim(),
          color: nameToColor[name.trim()] || 'inherit',
        }))
      : []

    return {
      combo,
      sigCards,
      cardCount: allCards.length,
      deckCount: count,
      percent: +((count / totalAll) * 100).toFixed(1),
      winnerDeckCount: winnerGroup ? winnerGroup.decks.length : 0,
      top4: top4Group ? top4Group.decks.length : 0,
      cards: topCards,
      filteredCards,
      featureBadges,
      deckUrls: group.deckUrls,
      deckWinnerFlags: group.deckWinnerFlags,
      deckCardIds,
    }
  })

  // --- Threshold archetypes (same minSize filter as tiers) ---

  const minSize = Math.max(Math.ceil(totalAll * 0.01), Math.min(12, Math.ceil(totalAll * 0.05)))

  const mainDetails = archetypeDetails
    .filter(a => a.deckCount >= minSize)
    .sort((a, b) => b.deckCount - a.deckCount)

  // --- Write per-archetype files for lazy loading ---

  const seriesDir = `data-processed/archetypes/${series.value}`
  mkdirSync(seriesDir, { recursive: true })

  mainDetails.forEach((arch, idx) => {
    const file = `${seriesDir}/${idx}.json`
    writeFileSync(file, JSON.stringify(arch, null, 2))
  })

  // --- Build tier rows ---

  const seriesProcessed = {
    value: series.value,
    label: series.label,
    totalEvents: totalWinners,
    totalDecks: totalAll,
    archetypes: mainDetails,
  }

  seriesProcessed.tierThresholds = computeTierThresholds(seriesProcessed)

  const ceiling = getSeriesCeiling(seriesProcessed)
  const top4AvgRate = getSeriesAvgTop4Rate(seriesProcessed)
  for (const a of seriesProcessed.archetypes) {
    const score = archetypeScoreV2(
      a.winnerDeckCount,
      a.deckCount,
      seriesProcessed.totalDecks,
      seriesProcessed.totalEvents,
      a.top4 ?? 0,
      ceiling,
      top4AvgRate,
    )
    a.tierScore = score
    a.tierLabel =
      a.winnerDeckCount > 0 ? getDeckTier(score, seriesProcessed.tierThresholds).label : '--'
  }

  manifest.push({
    value: series.value,
    label: series.label,
    archetypes: mainDetails.map(a => ({
      combo: a.combo,
      sigCards: a.sigCards,
      cardCount: a.cardCount,
      deckCount: a.deckCount,
      percent: a.percent,
      winnerDeckCount: a.winnerDeckCount,
      top4: a.top4,
      tier: a.tierLabel,
    })),
  })

  const rows = seriesProcessed.archetypes
    .filter(a => a.deckCount > 0)
    .map(a => {
      const useRate = (a.deckCount / seriesProcessed.totalDecks) * 100
      const winRateEvent = (a.winnerDeckCount / seriesProcessed.totalEvents) * 100
      const winRateDeck = (a.winnerDeckCount / a.deckCount) * 100
      const top4PerDeck = a.deckCount > 0 ? (a.top4 ?? 0) / a.deckCount : 0
      const baseCombo = a.combo.split(' (')[0]
      const sigPart = a.combo.match(/\((.+)\)/)?.[1]
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

  tierData.push({
    value: series.value,
    label: series.label,
    events: seriesProcessed.totalEvents,
    totalDecks: seriesProcessed.totalDecks,
    rows,
  })
}

writeFileSync('data-processed/tiers.json', JSON.stringify(tierData, null, 2))
console.log(
  `Saved data-processed/tiers.json (${tierData.length} series, ${tierData.reduce((s, t) => s + t.rows.length, 0)} archetype rows)`,
)

writeFileSync('data-processed/archetypes/index.json', JSON.stringify(manifest, null, 2))
console.log(
  `Saved data-processed/archetypes/index.json (${manifest.length} series, ${manifest.reduce((s, t) => s + t.archetypes.length, 0)} archetypes)`,
)
