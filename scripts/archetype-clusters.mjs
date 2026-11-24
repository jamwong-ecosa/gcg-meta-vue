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
//    than the one kept from a group of KEEP_DECKS or more; decks not running it
//    stay where they were
// 6. A group splits when the decks running one of its LR units are another
//    deck, as alike the rest SPLIT_SIMILARITY or less of how alike each part is
//    within; they take that unit and one of the group's name units as their name
// 7. Two groups sharing one name unit, as alike across as within
//    (FAMILY_SIMILARITY), are one deck family and merge whole, named after the
//    shared unit and the bigger group's other name unit when every deck of
//    the family runs it; when not, only the smaller group's decks running it
//    join, the rest staying, else (none do) into the group already named
//    after a LR every deck runs; unless the family's decks are less alike
//    than FAMILY_COHESION or it drops a unit outscoring the shared one from a
//    group of KEEP_DECKS or more
// 8. A group left under minDecks breaks up, its decks joining the most alike
//    group whose name units they run.
//    Every deck in a group runs its one or two name units, its LRs at
//    MIN_LR_COPIES or more (a R at any copies). A deck no step places stays out
//    of the ranked archetypes
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
// A merge never drops a name unit scoring higher than the one kept from a
// group of at least this many decks
const KEEP_DECKS = 5
// The decks running a LR unit are a build of their own when they're, on
// average, at most this share as alike the rest of their group as each part is
// within; well under FAMILY_SIMILARITY, so a family merge doesn't undo it
const SPLIT_SIMILARITY = 0.7
// Two groups sharing a name unit are one deck family when their decks are, on
// average, at least this share as alike across the two as within each (2026-11
// Blue+White: the Akatsuki (Oowashi) decks with Murasame and with Strike Rouge)…
const FAMILY_SIMILARITY = 0.9
// …and the family's decks are at least this alike on average; less is a mixed
// bag sharing a unit (2026-11 Green+Purple: Zeong with Exia Repair and with
// Zaku II (Char), 0.42 together)
const FAMILY_COHESION = 0.5

const baseId = cardId => cardId.replace(/_p\d+$/, '')
// A unit's rarity ('LR', 'R', …), null for other cards; LR+ and LR++ are alt-art LRs
const rarityOf = info => (info.type === 'UNIT' ? (info.rarity?.replace(/\+*$/, '') ?? null) : null)
const level = info => parseInt(info.level) || 0

// A deck as sorted [card key, copies] pairs, for similarity
export function deckVector(deck, cardKey) {
  const copies = new Map()
  for (const card of deck) {
    const key = cardKey(card.cardId)
    copies.set(key, (copies.get(key) ?? 0) + card.quantity)
  }
  return [...copies].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
}

// Weighted Jaccard over two decks as sorted [id, copies] arrays
export function similarity(a, b) {
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
  // Two decks' similarity, worked out once per two decks (it's symmetric)
  const sims = new Float64Array(decks.length * decks.length).fill(-1)
  const sim = (i, j) => {
    const k = i < j ? i * decks.length + j : j * decks.length + i
    if (sims[k] < 0) {
      sims[k] = similarity(vectors[i], vectors[j])
    }
    return sims[k]
  }
  const pairs = decks.map(deck => deckPair(deck, lookup, scores))
  const ranks = pairs.map(pair => (pair ? pairRank(pair, colors, lookup) : Infinity))
  // A pair's key, whatever order its units are in
  const pairKey = ids => [...ids].sort((a, b) => a.localeCompare(b)).join()
  // A deck's average similarity to a group's other decks
  const avgSim = (i, members) =>
    members.reduce((sum, j) => (j === i ? sum : sum + sim(i, j)), 0) /
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
  // Kept per pair of groups, as withinSim per group: a merge makes new groups
  // rather than changing the old ones
  const across = new WeakMap()
  const acrossSim = (a, b) => {
    if (!across.has(a)) {
      across.set(a, new WeakMap())
    }
    const known = across.get(a)
    if (!known.has(b)) {
      known.set(b, a.members.reduce((sum, i) => sum + avgSim(i, b.members), 0) / a.members.length)
    }
    return known.get(b)
  }
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
      // unless the other's own unit outscores the one named and the other has
      // KEEP_DECKS or more (2026-11 Green+Purple: Zeong / Barbatos stays apart
      // from Zaku II (Char) / Barbatos; 2026-11 Red+White: the three ΖΖ / Gold
      // Smo decks, Gold Smo Lv6 added to Altron ×4, join ΖΖ / Altron)
      const [into, from] = pairKey(a.ids) === pairKey(name) ? [a, b] : [b, a]
      const lost = from.ids.find(id => !into.ids.includes(id))
      const kept = into.ids.find(id => !from.ids.includes(id))
      const runs = i => into.ids.every(id => runsUnit(i, id))
      const keepsApart = scores.get(lost) > scores.get(kept) && from.members.length >= KEEP_DECKS
      if (
        !keepsApart &&
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

  // Builds: a group splits when the decks running one of its LR units (at
  // MIN_LR_COPIES), not one it's named after, are another deck: as alike the
  // rest of the group as SPLIT_SIMILARITY or less of how alike each part is
  // within. The pair rule takes one LR per colour, highest level first, so a
  // build's own unit can hide behind the colour's bigger one (2026-09
  // Blue+White: the V Gundam decks, Lv4, under Strike Freedom / Aile Strike).
  // Its decks are named after it and the group's name unit they all run, of
  // another colour first as a deck's pair is chosen, then the highest-scoring
  // (2026-09 Blue+White: V Gundam / Aile Strike, 11 wins, apart from V Gundam /
  // Strike Freedom, the V Gundam decks without Aile Strike), and join the group
  // already so named only when as alike it as a family (FAMILY_SIMILARITY), or
  // don't split; the rest keep the name.
  // Both parts need KEEP_DECKS or more. Only LR units, so a support unit nearly
  // every deck runs can't rename the group (2026-10 Green+Purple: Barbatos
  // Adapt, R, in 259 of the 265 Qubeley / Sazabi decks). The most distinct
  // split first, until none is left
  for (let round = 0; round < 100; round++) {
    let next = null
    for (const group of groups.filter(g => g.members.length >= 2 * KEEP_DECKS)) {
      const names = new Set(group.ids.map(id => lookup(id).name))
      const units = new Set(group.members.flatMap(i => [...copies[i].keys()]))
      for (const unit of units) {
        if (rarityOf(lookup(unit)) !== 'LR' || names.has(lookup(unit).name)) {
          continue
        }
        const build = { ids: [], members: group.members.filter(i => runsUnit(i, unit)) }
        const rest = { ids: group.ids, members: group.members.filter(i => !runsUnit(i, unit)) }
        if (build.members.length < KEEP_DECKS || rest.members.length < KEEP_DECKS) {
          continue
        }
        const ratio = acrossSim(build, rest) / ((withinSim(build) + withinSim(rest)) / 2)
        if (ratio > SPLIT_SIMILARITY || ratio >= (next?.ratio ?? Infinity)) {
          continue
        }
        const sameColour = id => (lookup(id).color === lookup(unit).color ? 1 : 0)
        const [kept] = group.ids
          .filter(id => build.members.every(i => runsUnit(i, id)))
          .sort(
            (x, y) =>
              sameColour(x) - sameColour(y) || scores.get(y) - scores.get(x) || x.localeCompare(y),
          )
        const ids = nameOrder([kept, unit], build.members, decks, colors, lookup)
        const home = groups.find(g => g !== group && pairKey(g.ids) === pairKey(ids))
        const homeRatio = home
          ? acrossSim(build, home) / ((withinSim(build) + withinSim(home)) / 2)
          : Infinity
        if (homeRatio >= FAMILY_SIMILARITY) {
          next = { group, build, rest, ids, home, ratio }
        }
      }
    }
    if (!next) {
      break
    }
    const { group, build, rest, ids, home } = next
    groups = [
      ...groups.filter(g => g !== group && g !== home),
      rest,
      { ids, members: [...(home?.members ?? []), ...build.members] },
    ]
  }

  // Deck families: two groups sharing one name unit, their decks as alike across
  // as within, are one deck with a different second unit, and merge whole. The
  // most alike pair first, until none is left. The family is named after the
  // shared unit, its core, and the bigger group's other name unit when every
  // deck runs it (runsUnit: a LR at MIN_LR_COPIES), so a splinter joining a
  // bigger group doesn't rename it. When not every deck does, only the smaller
  // group's decks running it join and the rest stay, so the bigger group keeps
  // its name and no deck sits under a name card it doesn't run ×3+ (2026-11
  // Red+White: ΖΖ / Altron's decks with Justice ×3+ join ΖΖ / Justice, Justice
  // ×3+ in 70% of the two). Only the bigger group's own unit, so a staple of
  // the colours can't name it (Silver Bullet, in 94% of Red+White decks). Not when the
  // family's decks are less alike than FAMILY_COHESION, when another group
  // already has the name, or when it drops a unit outscoring the core from a
  // group of KEEP_DECKS or more, a different deck sharing a support unit
  // (2026-11 Green+Purple: Zeong / Barbatos stays apart from Zaku II (Char) /
  // Barbatos)
  //
  // A group's name units; a family's are those of every group it grew from
  const unitsOf = g => g.units ?? g.ids
  const familyName = (a, b, shared) => {
    const members = [...a.members, ...b.members]
    // The core is run by every deck, a LR at MIN_LR_COPIES
    if (members.some(i => !runsUnit(i, shared))) {
      return null
    }
    const runByAll = id => members.every(i => runsUnit(i, id))
    const [bigger] = [a, b].sort((x, y) => y.members.length - x.members.length)
    const partner = bigger.ids.find(id => id !== shared)
    // Another colour's unit first, as a deck's pair is chosen, then by score
    const rank = id => pairRank([shared, id], colors, lookup)
    const second = partner && runByAll(partner) ? partner : undefined
    // Not every deck: the smaller group's decks running the bigger one's unit
    // join it, the rest stay, so the bigger group keeps its name (2026-11
    // Red+White: ΖΖ / Justice takes the ΖΖ / Altron decks with Justice ×3+, and
    // ΖΖ / Altron keeps the rest)
    const smaller = bigger === a ? b : a
    const joining = partner && !second ? smaller.members.filter(i => runsUnit(i, partner)) : []
    if (joining.length > 0) {
      return { into: bigger, from: smaller, joining }
    }
    // None of them: a LR unit every deck runs at MIN_LR_COPIES, so a family
    // whose name units are its builds' tech picks is named after the LR every
    // build runs, not its core alone (2026-11 Green+Purple: Zeong with Barbatos
    // and with Exia Repair, Zaku II (Char) ×4 in every deck, is Zaku II (Char) /
    // Zeong)
    const [fallback] = second
      ? []
      : [...new Set(members.flatMap(i => [...copies[i].keys()]))]
          .filter(id => rarityOf(lookup(id)) === 'LR')
          .filter(id => lookup(id).name !== lookup(shared).name)
          .filter(runByAll)
          .sort((x, y) => rank(x) - rank(y) || scores.get(y) - scores.get(x) || x.localeCompare(y))
    const named = second ?? fallback
    if (!named) {
      return null
    }
    const ids = nameOrder(named ? [shared, named] : [shared], members, decks, colors, lookup)
    // A group already so named is one deck with the family when the name is
    // the fallback, a LR all of them run, and joins it; else the name is taken
    const owner = groups.find(g => g !== a && g !== b && pairKey(g.ids) === pairKey(ids))
    const dropsStronger = [a, b].some(
      g =>
        g.members.length >= KEEP_DECKS &&
        g.ids.some(id => !ids.includes(id) && scores.get(id) > scores.get(shared)),
    )
    // A fallback renames the bigger group only into a group already so named,
    // never a new name from a staple (2026-10 Green+Purple: Qubeley / Sazabi,
    // Zaku II (Char) ×3+ in every deck but Sazabi in 69%, stays apart from
    // Qubeley / Gusion Rebake rather than become Zaku II (Char) / Qubeley)
    const renames = fallback && partner && !owner
    return (owner && !fallback) || dropsStronger || renames
      ? null
      : { ids, absorb: owner, fallback }
  }
  const familyCohesion = (a, b) => {
    // Every two decks' similarity summed within each group and across the two
    const sumWithin = g => withinSim(g) * g.members.length * (g.members.length - 1)
    const sumAcross = 2 * acrossSim(a, b) * a.members.length * b.members.length
    const n = a.members.length + b.members.length
    return (sumWithin(a) + sumWithin(b) + sumAcross) / (n * (n - 1))
  }
  for (;;) {
    const sized = groups.filter(g => g.members.length >= minDecks)
    let next = null
    for (const [a, b] of sized.flatMap((a, k) => sized.slice(k + 1).map(b => [a, b]))) {
      // A family's fallback unit names it but isn't its core, so it doesn't
      // draw in other groups of that unit (2026-11 Green+Purple: Zaku II
      // (Char) / Barbatos, 9 of 15 decks without Zeong, stays apart from Zaku
      // II (Char) / Zeong)
      const core = id => id !== a.fallback && id !== b.fallback
      const shared = a.ids.filter(id => b.ids.includes(id) && core(id))
      const name = shared.length === 1 ? familyName(a, b, shared[0]) : null
      if (!name) {
        continue
      }
      const ratio = acrossSim(a, b) / ((withinSim(a) + withinSim(b)) / 2)
      if (
        ratio >= FAMILY_SIMILARITY &&
        ratio > (next?.ratio ?? 0) &&
        familyCohesion(a, b) >= FAMILY_COHESION
      ) {
        next = { a, b, ...name, ratio }
      }
    }
    if (!next) {
      break
    }
    if (next.joining) {
      const { into, from, joining } = next
      const rest = from.members.filter(i => !joining.includes(i))
      groups = [
        ...groups.filter(g => g !== into && g !== from),
        { ...into, members: [...into.members, ...joining] },
        ...(rest.length > 0 ? [{ ...from, members: rest }] : []),
      ]
      continue
    }
    const parts = [next.a, next.b, ...(next.absorb ? [next.absorb] : [])]
    const family = {
      ids: next.ids,
      members: parts.flatMap(g => g.members),
      units: [...new Set(parts.flatMap(unitsOf))],
      fallback: next.fallback,
    }
    groups = [...groups.filter(g => !parts.includes(g)), family]
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
    const vectors = decks.map(deck => deckVector(deck, cardKey))
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
