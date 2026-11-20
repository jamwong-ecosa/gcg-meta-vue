// Archetypes by LR pair: decks of the same colours are grouped by the two LR
// units they lean on most, and each group is named after that pair.
//
// 1. Decks are split by colour combo
// 2. Each deck's pair (deckPair): in each colour, of the LR units it runs at
//    least MIN_LR_COPIES of (alt arts counted with the base card), the one
//    scoring highest across the combo (COPY_WEIGHT, LEVEL_WEIGHT). The score
//    is the combo's, not the deck's, so a copy more or less doesn't move
//    near-identical decks apart (2026-11 Green+Purple Qubeley / Sazabi decks
//    run three LRs a colour at three or four copies each). One LR per colour
//    when the deck runs a LR in both, else the top two LRs of one colour. A
//    slot no LR fills takes a R unit the same way (another colour's first, then
//    the named colour's). Never two units of one name (2026-11 Blue+Green: ν
//    Gundam LR ×4, ν Gundam R ×2 and Re-GZ ×4 pair as ν Gundam / Re-GZ)
// 3. Pairs group in the rule's order (assignCombo): one LR per colour, then two
//    LRs of one colour, then pairs taking a R. At each step, decks with such a
//    pair form a group per pair of at least minDecks; then every deck still out
//    joins the group it's most alike on average, if at least ATTACH_SIMILARITY
//    alike, and only one whose two name units it runs (a LR at MIN_LR_COPIES,
//    a R at any copies), before the next step's pairs group
// 4. A deck more alike a bigger group whose name units it runs than the rest of
//    its own moves there
// 5. Two groups sharing one name unit, as alike across as within
//    (MERGE_SIMILARITY), merge under the other name unit of either that
//    MERGE_SHARE of their decks run, unless that drops a unit scoring higher
//    than the one kept; decks not running it stay where they were
// 6. A group left under minDecks breaks up, its decks joining the most alike
//    group whose name units they run.
//    Every deck in a group runs both of its name units, its LRs at
//    MIN_LR_COPIES or more. A deck no step places
//    stays out of the ranked archetypes
//
// Two decks are compared by weighted Jaccard over their cards with copies,
// reprints with the same effect as one card (cardKey): shared copies over total
// copies, 1 = identical lists

// A unit's combo score: copies per deck of the combo × COPY_WEIGHT + level ×
// LEVEL_WEIGHT. A level is worth two copies a deck, so a deck's top unit
// leads over a cheaper staple every deck runs (2026-10 Green+Purple: Qubeley
// Lv7, in half the decks at three or four, over Zeong Lv6 in nearly all)
const COPY_WEIGHT = 10
const LEVEL_WEIGHT = 20
// A LR unit names a deck's group, or lets a deck join a group it names, only
// with at least this many copies in the deck; fewer is a tech pick (2026-10
// Green+Purple: Zeong ×4 with Gusion Rebake ×2 stays out of Zeong / Gusion
// Rebake)
const MIN_LR_COPIES = 3
// A leftover deck joins a group at least this alike on average
const ATTACH_SIMILARITY = 0.3
// Two groups sharing a name unit merge when their decks are, on average, at
// least this share as alike across the two as within each…
const MERGE_SIMILARITY = 0.85
// …and at least this share of their decks run a second unit to name it by
const MERGE_SHARE = 0.9

const baseId = cardId => cardId.replace(/_p\d+$/, '')
// A unit's rarity ('LR', 'R', …), null for other cards; LR+ and LR++ are alt-art LRs
const rarityOf = info => (info.type === 'UNIT' ? (info.rarity?.replace(/\+*$/, '') ?? null) : null)
const level = info => parseInt(info.level) || 0

// Weighted Jaccard over two decks as sorted [id, copies] arrays
function similarity(a, b) {
  let i = 0
  let j = 0
  let shared = 0
  let total = 0
  while (i < a.length || j < b.length) {
    if (j >= b.length || (i < a.length && a[i][0] < b[j][0])) {
      total += a[i++][1]
    } else if (i >= a.length || b[j][0] < a[i][0]) {
      total += b[j++][1]
    } else {
      shared += Math.min(a[i][1], b[j][1])
      total += Math.max(a[i][1], b[j][1])
      i++
      j++
    }
  }
  return total ? shared / total : 0
}

// Each card's score across a colour combo, by base card id: copies per deck of
// the combo ×COPY_WEIGHT + level ×LEVEL_WEIGHT
function comboScores(decks, lookup) {
  const copies = new Map()
  for (const deck of decks) {
    for (const card of deck) {
      const id = baseId(card.cardId)
      copies.set(id, (copies.get(id) ?? 0) + card.quantity)
    }
  }
  return new Map(
    [...copies].map(([id, n]) => [
      id,
      (n / decks.length) * COPY_WEIGHT + level(lookup(id)) * LEVEL_WEIGHT,
    ]),
  )
}

// A deck's units of one rarity, highest combo score first; LR units only at
// MIN_LR_COPIES or more
function rankedUnits(deck, lookup, rarity, scores) {
  const copies = new Map()
  for (const card of deck) {
    const id = baseId(card.cardId)
    copies.set(id, (copies.get(id) ?? 0) + card.quantity)
  }
  return [...copies.keys()]
    .filter(id => rarityOf(lookup(id)) === rarity)
    .filter(id => rarity !== 'LR' || copies.get(id) >= MIN_LR_COPIES)
    .sort((a, b) => scores.get(b) - scores.get(a) || a.localeCompare(b))
}

// The deck's two name units (step 2), or null with fewer than two LR and R
// units. LR units fill the slots first, R units the rest; within each, a
// colour not yet named is taken before a second unit of a named one, and a
// unit named like one taken is skipped
function deckPair(deck, lookup, scores) {
  const pair = []
  for (const rarity of ['LR', 'R']) {
    const units = rankedUnits(deck, lookup, rarity, scores)
    while (pair.length < 2) {
      const named = new Set(pair.map(id => lookup(id).color))
      const names = new Set(pair.map(id => lookup(id).name))
      const free = units.filter(id => !names.has(lookup(id).name))
      const next = free.find(id => !named.has(lookup(id).color)) ?? free[0]
      if (!next) {
        break
      }
      pair.push(next)
    }
  }
  return pair.length === 2 ? pair : null
}

// Name order: the combo's colour order, and for two units of one colour LR
// before R, then more copies across the group, then higher level
function nameOrder(ids, members, decks, colors, lookup) {
  const copies = id =>
    members.reduce(
      (sum, i) =>
        sum +
        decks[i]
          .filter(card => baseId(card.cardId) === id)
          .reduce((s, card) => s + card.quantity, 0),
      0,
    )
  const rank = id => (rarityOf(lookup(id)) === 'LR' ? 0 : 1)
  return [...ids].sort(
    (x, y) =>
      colors.indexOf(lookup(x).color) - colors.indexOf(lookup(y).color) ||
      rank(x) - rank(y) ||
      copies(y) - copies(x) ||
      level(lookup(y)) - level(lookup(x)) ||
      x.localeCompare(y),
  )
}

// How far a pair is from the rule's first choice: 0 one LR per colour (or two
// LRs of a one-colour combo), 1 two LRs of one colour, 2 a pair taking a R
function pairRank(pair, colors, lookup) {
  if (pair.some(id => rarityOf(lookup(id)) !== 'LR')) {
    return 2
  }
  return colors.length > 1 && lookup(pair[0]).color === lookup(pair[1]).color ? 1 : 0
}

// One colour combo's groups as { members: deck indexes, ids: name pair }, ids
// empty for the decks left out of every group
function assignCombo({ decks, colors, vectors, minDecks, lookup }) {
  const scores = comboScores(decks, lookup)
  const copies = decks.map(deck => {
    const n = new Map()
    for (const card of deck) {
      const id = baseId(card.cardId)
      n.set(id, (n.get(id) ?? 0) + card.quantity)
    }
    return n
  })
  // Whether a deck runs a name unit: a LR at MIN_LR_COPIES or more, a R at all
  const runsUnit = (i, id) =>
    (copies[i].get(id) ?? 0) >= (rarityOf(lookup(id)) === 'LR' ? MIN_LR_COPIES : 1)
  const pairs = decks.map(deck => deckPair(deck, lookup, scores))
  const ranks = pairs.map(pair => (pair ? pairRank(pair, colors, lookup) : Infinity))
  // A pair's key, whatever order its units are in
  const pairKey = ids => [...ids].sort((a, b) => a.localeCompare(b)).join()
  // A deck's average similarity to a group's other decks
  const avgSim = (i, members) =>
    members.reduce((sum, j) => (j === i ? sum : sum + similarity(vectors[i], vectors[j])), 0) /
    (members.length - (members.includes(i) ? 1 : 0))
  // The index of the group in `among` the deck is most alike, of those whose
  // name units it runs (runsUnit) and at least `floor` alike; -1 for none
  const mostAlike = (i, among, floor, skip = () => false) => {
    let best = -1
    let bestSim = floor
    among.forEach((group, g) => {
      if (skip(group) || !group.ids.every(id => runsUnit(i, id))) {
        return
      }
      const sim = avgSim(i, group.members)
      if (sim > bestSim || (sim === bestSim && best < 0)) {
        best = g
        bestSim = sim
      }
    })
    return best
  }

  let groups = []
  let pool = decks.map((_, i) => i)
  for (const rank of [0, 1, 2]) {
    // Decks whose pair is this far from the first choice group by it…
    const byPair = new Map()
    for (const i of pool.filter(i => ranks[i] === rank)) {
      const key = pairKey(pairs[i])
      const group = byPair.get(key) ?? { members: [], ids: pairs[i] }
      group.members.push(i)
      byPair.set(key, group)
    }
    for (const group of byPair.values()) {
      if (group.members.length >= minDecks) {
        group.ids = nameOrder(group.ids, group.members, decks, colors, lookup)
        groups.push(group)
      }
    }
    // …then every deck still out joins the most alike group whose name units
    // it runs, against the groups as they stood before any leftover joined,
    // before a pair further from the rule groups it
    const grouped = new Set(groups.flatMap(g => g.members))
    const joins = groups.map(() => [])
    for (const i of pool.filter(i => !grouped.has(i))) {
      joins[mostAlike(i, groups, ATTACH_SIMILARITY)]?.push(i)
    }
    groups.forEach((group, g) => group.members.push(...joins[g]))
    const placed = new Set(groups.flatMap(g => g.members))
    pool = pool.filter(i => !placed.has(i))
  }

  // A deck more alike a bigger group whose name units it runs than the rest of
  // its own moves there, against the groups as they stood before any deck moved
  const moves = groups.map(() => [])
  for (const group of groups) {
    const size = group.members.length
    group.kept = group.members.filter(i => {
      const floor = Math.max(avgSim(i, group.members), ATTACH_SIMILARITY)
      const best = mostAlike(i, groups, floor, other => other.members.length <= size)
      moves[best]?.push(i)
      return best < 0
    })
  }
  groups = groups.map((group, g) => ({ ids: group.ids, members: [...group.kept, ...moves[g]] }))

  // Two groups sharing one name unit, their decks about as alike across as
  // within, merge under the shared unit and the one most of their decks run
  // (2026-09 Green+Red: the Gundam Exia decks, all running Gundam Schwarzette at
  // three or more, join the Schwarzette group). Decks not running the new name
  // units stay in their own group
  const within = new WeakMap()
  const withinSim = group => {
    if (!within.has(group)) {
      const { members } = group
      within.set(group, members.reduce((sum, i) => sum + avgSim(i, members), 0) / members.length)
    }
    return within.get(group)
  }
  const acrossSim = (a, b) =>
    a.members.reduce((sum, i) => sum + avgSim(i, b.members), 0) / a.members.length
  // The merged name: the shared unit, and of the two groups' other name units
  // the one at least MERGE_SHARE of their decks run (runsUnit) and no further
  // from the rule's first choice than the better of the two names, in the
  // rule's order, then by combo score as a deck's pair is chosen. Only their own
  // name units, and not the most run, so a staple every deck of the combo runs
  // can't take over
  const rank = group => pairRank(group.ids, colors, lookup)
  const mergeName = ([a, b]) => {
    const shared = a.ids.find(id => b.ids.includes(id))
    const members = [...a.members, ...b.members]
    const [best] = [a, b]
      .map(g => g.ids.find(id => id !== shared))
      .map(id => [id, members.filter(i => runsUnit(i, id)).length])
      .filter(([, n]) => n >= MERGE_SHARE * members.length)
      .filter(([id]) => pairRank([shared, id], colors, lookup) <= Math.min(rank(a), rank(b)))
      .sort(
        ([x, n], [y, m]) =>
          pairRank([shared, x], colors, lookup) - pairRank([shared, y], colors, lookup) ||
          scores.get(y) - scores.get(x) ||
          m - n ||
          x.localeCompare(y),
      )
    return best ? [shared, best[0]] : null
  }
  for (let round = 0; round < 100; round++) {
    const sized = groups
      .filter(g => g.members.length >= minDecks)
      .sort((a, b) => b.members.length - a.members.length)
    let next = null
    for (const [a, b] of sized.flatMap((a, k) => sized.slice(k + 1).map(b => [a, b]))) {
      if (a.ids.filter(id => b.ids.includes(id)).length !== 1) {
        continue
      }
      const name = mergeName([a, b])
      if (!name) {
        continue
      }
      // The group already so named takes the other's decks running its units,
      // unless the other's own unit outscores the one named (2026-11
      // Green+Purple: Zeong / Barbatos, Zeong Lv6 in most but not MERGE_SHARE of
      // the decks, stays apart from Zaku II (Char) / Barbatos)
      const [into, from] = pairKey(a.ids) === pairKey(name) ? [a, b] : [b, a]
      const lost = from.ids.find(id => !into.ids.includes(id))
      const kept = into.ids.find(id => !from.ids.includes(id))
      const runs = i => into.ids.every(id => runsUnit(i, id))
      if (
        scores.get(lost) <= scores.get(kept) &&
        from.members.some(runs) &&
        acrossSim(a, b) >= MERGE_SIMILARITY * ((withinSim(a) + withinSim(b)) / 2)
      ) {
        next = { into, from, runs }
        break
      }
    }
    if (!next) {
      break
    }
    const { into, from, runs } = next
    groups = groups
      .map(g =>
        g === into
          ? { ids: g.ids, members: [...g.members, ...from.members.filter(runs)] }
          : g === from
            ? { ids: g.ids, members: g.members.filter(i => !runs(i)) }
            : g,
      )
      .filter(g => g.members.length > 0)
  }

  // A group left under minDecks breaks up, its decks joining the most alike
  // group whose name units they run
  const broken = groups.filter(g => g.members.length < minDecks).flatMap(g => g.members)
  groups = groups.filter(g => g.members.length >= minDecks)
  const rejoins = groups.map(() => [])
  for (const i of broken) {
    const best = mostAlike(i, groups, ATTACH_SIMILARITY)
    if (best >= 0) {
      rejoins[best].push(i)
    } else {
      pool.push(i)
    }
  }
  groups.forEach((group, g) => group.members.push(...rejoins[g]))
  return [...groups, { members: pool, ids: [] }]
}

// `players`: the series' decks. Returns keyOf(deck) → { key, sigCardIds } for
// every deck in `players`; a deck outside a ranked group gets its colours as
// key and no signature cards, so it's listed with the unassigned decks.
// `helpers`: { lookup, colorsOf, cardKey, minDecks }
export function createClusterResolver(players, { lookup, colorsOf, cardKey, minDecks }) {
  const byCombo = new Map()
  for (const player of players) {
    const colors = colorsOf(player.deck)
    const combo = colors.join('+')
    const entry = byCombo.get(combo) ?? { colors, decks: [] }
    entry.decks.push(player.deck)
    byCombo.set(combo, entry)
  }

  const assigned = new Map()
  for (const [combo, { colors, decks }] of byCombo) {
    const vectors = decks.map(deck => {
      const copies = new Map()
      for (const card of deck) {
        const key = cardKey(card.cardId)
        copies.set(key, (copies.get(key) ?? 0) + card.quantity)
      }
      return [...copies].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    })
    const groups = assignCombo({ decks, colors, vectors, minDecks, lookup })
    // Two cards can share a name (GD02-038 / GD03-034 GQuuuuuuX（オメガ・サイコミュ
    // 起動時）); pairs that would read the same name their differing card by number
    const plainKey = ids => `${combo} (${ids.map(id => lookup(id).name).join(' / ')})`
    const sameName = new Map()
    for (const { ids } of groups.filter(g => g.ids.length > 0)) {
      sameName.set(plainKey(ids), [...(sameName.get(plainKey(ids)) ?? []), ids])
    }
    const keyFor = ids => {
      const clash = sameName.get(plainKey(ids))
      const shared = id => clash.every(other => other.includes(id))
      const label = id =>
        clash.length > 1 && !shared(id) ? `${lookup(id).name} ${id}` : lookup(id).name
      return `${combo} (${ids.map(label).join(' / ')})`
    }
    for (const { members, ids } of groups) {
      const result =
        ids.length > 0 ? { key: keyFor(ids), sigCardIds: ids } : { key: combo, sigCardIds: [] }
      for (const i of members) {
        assigned.set(decks[i], result)
      }
    }
  }

  return deck => assigned.get(deck) ?? { key: colorsOf(deck).join('+'), sigCardIds: [] }
}
