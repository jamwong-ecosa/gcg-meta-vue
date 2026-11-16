// One sub-build of an archetype (subBuilds, see scripts/sub-builds.mjs) as an
// archetype of its own: only that build's decks, with every card's use rate,
// copies and wins worked out over them, so the archetype page shows what the
// build plays rather than the blend of both

// Same cut as build-tiers' FEATURED_MIN_INCLUSION
const FEATURED_MIN = 0.15
const TYPES = ['UNIT', 'PILOT', 'COMMAND', 'BASE']

// "ID:qty|ID:qty" → Map(id → copies)
const parseDeck = s =>
  new Map(
    s
      .split('|')
      .filter(Boolean)
      .map(part => {
        const [id, qty] = part.split(':')
        return [id, Number(qty)]
      }),
  )

export function archetypeBuild(archetype, buildIdx) {
  const sb = archetype.subBuilds
  if (!sb || buildIdx == null || !sb.builds[buildIdx]) {
    return archetype
  }
  const idx = sb.deckBuild.flatMap((b, i) => (b === buildIdx ? [i] : []))
  const n = idx.length
  const decks = idx.map(i => parseDeck(archetype.deckCardIds[i]))
  const won = idx.map(i => archetype.deckWinnerFlags?.[i] ?? false)

  // Decks, wins and copies of any card in `ids`, plus decks running all of them
  // and the middle half of copies per deck, as build-tiers works out effectGroup
  function tally(ids) {
    let deckCount = 0
    let wins = 0
    let allDecks = 0
    let totalQty = 0
    const totals = []
    decks.forEach((d, j) => {
      const held = ids.filter(id => d.has(id))
      if (!held.length) {
        return
      }
      const copies = held.reduce((sum, id) => sum + d.get(id), 0)
      deckCount++
      totalQty += copies
      totals.push(copies)
      if (won[j]) {
        wins++
      }
      if (held.length === ids.length) {
        allDecks++
      }
    })
    totals.sort((a, b) => a - b)
    const at = p => totals[Math.round((totals.length - 1) * p)] ?? 0
    return { deckCount, wins, allDecks, totalQty, copiesLow: at(0.25), copiesHigh: at(0.75) }
  }

  const cards = [...(archetype.cards ?? []), ...(archetype.filteredCards ?? [])]
    .map(c => {
      const own = tally([c.cardId])
      if (!own.deckCount) {
        return null
      }
      const card = {
        ...c,
        decksIncluded: own.deckCount,
        inclusionRate: +(own.deckCount / n).toFixed(4),
        winnerDeckCount: own.wins,
        totalQty: own.totalQty,
        avgQty: Math.round(own.totalQty / own.deckCount),
      }
      if (c.effectGroup) {
        const g = tally(c.effectGroup.id.split('+'))
        card.effectGroup = {
          ...c.effectGroup,
          decks: g.deckCount,
          wins: g.wins,
          allDecks: g.allDecks,
          copiesLow: g.copiesLow,
          copiesHigh: g.copiesHigh,
        }
      }
      return card
    })
    .filter(Boolean)
    .sort(
      (a, b) => TYPES.indexOf(a.type) - TYPES.indexOf(b.type) || b.inclusionRate - a.inclusionRate,
    )

  const pick = arr => (arr ? idx.map(i => arr[i]) : arr)
  return {
    ...archetype,
    deckCount: n,
    winnerDeckCount: won.filter(Boolean).length,
    cards: cards.filter(c => c.inclusionRate > FEATURED_MIN),
    filteredCards: cards.filter(c => c.inclusionRate <= FEATURED_MIN),
    deckUrls: pick(archetype.deckUrls),
    deckWinnerFlags: pick(archetype.deckWinnerFlags),
    deckMeta: pick(archetype.deckMeta),
    deckCardIds: pick(archetype.deckCardIds),
  }
}
