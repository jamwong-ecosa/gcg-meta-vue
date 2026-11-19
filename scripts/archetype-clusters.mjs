// Archetypes by deck list: decks of the same colours are grouped by how alike
// their whole lists are, and each group is then named after the cards it plays
// most. A deck's name used to come from its own copy counts (the LR unit with
// the most copies), so near-identical decks landed under different names when
// one ran a copy more of a second LR unit (Strike Freedom / Aile Strike vs
// Strike Freedom / Justice), and merge, rename and reassign rules had to patch
// that up after the fact.
//
// 1. Each deck is its cards with copies, reprints with the same effect as one
//    card (cardKey). Two decks are compared by weighted Jaccard: shared copies
//    over total copies, 1 = identical lists
// 2. Decks of each colour combo are clustered bottom-up, average linkage: the
//    two most alike groups merge first, until no two groups are CLUSTER_SIMILARITY
//    alike on average. A flex slot (Justice in place of Freedom) is a few cards
//    of fifty and doesn't split a group; a package of its own does
// 3. Groups under minDecks are a handful of odd lists. Each of their decks joins
//    the large group it's most alike, if at least ATTACH_SIMILARITY alike on
//    average, and otherwise stays out of the ranked archetypes
// 4. Each group is named (nameCluster) after a LR unit most of its decks run in
//    each colour (or a R unit nearly all do), with at least one card not naming
//    a bigger group, so one deck's copy counts can't change the name

// Groups merge while their decks are at least this alike on average
const CLUSTER_SIMILARITY = 0.4
// A deck from a group too small to rank joins a large group at least this alike
const ATTACH_SIMILARITY = 0.3
// A name card: a LR unit in at least this share of the group's decks…
const NAME_LR_SHARE = 0.5
// …or, with no such LR in the colour, a R unit in at least this share
const NAME_STAPLE_SHARE = 0.8
// No unit that common in a colour: the colour's unit in the most decks, in at
// least this share of them, names it instead
const NAME_UNIT_SHARE = 0.25
// LR+ and LR++ are alt-art LRs
const RARITY_RANK = { LR: 2, R: 1 }
const level = u => parseInt(u.info.level) || 0
const staple = u => (u.share >= NAME_STAPLE_SHARE ? 1 : 0)
const rarityRank = info => RARITY_RANK[info.rarity?.replace(/\+*$/, '')] ?? 0

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

// Average-linkage clustering by nearest-neighbour chain: follows each group to
// its most alike group until two are each other's most alike, and merges them.
// Returns the merges as [a, b, similarity], a group named after its first deck
function averageLinkage(sim, n) {
  const row = Float64Array.from(sim)
  const size = Array.from({ length: n }, () => 1)
  const active = Array.from({ length: n }, () => true)
  const merges = []
  const chain = []
  let remaining = n
  while (remaining > 1) {
    if (chain.length === 0) {
      chain.push(active.indexOf(true))
    }
    const a = chain.at(-1)
    const prev = chain.length > 1 ? chain.at(-2) : -1
    let best = prev
    let bestSim = prev >= 0 ? row[a * n + prev] : -1
    for (let c = 0; c < n; c++) {
      if (active[c] && c !== a && row[a * n + c] > bestSim) {
        best = c
        bestSim = row[a * n + c]
      }
    }
    if (best !== prev) {
      chain.push(best)
      continue
    }
    chain.length -= 2
    merges.push([a, best, bestSim])
    const [na, nb] = [size[a], size[best]]
    for (let c = 0; c < n; c++) {
      if (active[c] && c !== a && c !== best) {
        const merged = (na * row[a * n + c] + nb * row[best * n + c]) / (na + nb)
        row[a * n + c] = merged
        row[c * n + a] = merged
      }
    }
    size[a] += nb
    active[best] = false
    remaining--
  }
  return merges
}

// Decks of one colour combo → groups of deck indexes, biggest first
function clusterCombo(vectors, minDecks) {
  const n = vectors.length
  const sim = new Float64Array(n * n)
  for (let i = 0; i < n; i++) {
    sim[i * n + i] = 1
    for (let j = i + 1; j < n; j++) {
      const s = similarity(vectors[i], vectors[j])
      sim[i * n + j] = s
      sim[j * n + i] = s
    }
  }

  // Average linkage has no inversions, so the merges at or above the cut-off
  // are exactly the groups cut there
  const parent = Array.from({ length: n }, (_, i) => i)
  const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  for (const [a, b, s] of averageLinkage(sim, n)) {
    if (s >= CLUSTER_SIMILARITY) {
      parent[find(b)] = find(a)
    }
  }
  const byRoot = new Map()
  for (let i = 0; i < n; i++) {
    byRoot.set(find(i), [...(byRoot.get(find(i)) ?? []), i])
  }
  const groups = [...byRoot.values()].sort((a, b) => b.length - a.length || a[0] - b[0])
  const large = groups.filter(g => g.length >= minDecks)
  const small = groups.filter(g => g.length < minDecks)

  // Odd lists join the large group they're most alike on average
  const joins = large.map(() => [])
  for (const group of small) {
    for (const i of group) {
      let best = -1
      let bestSim = ATTACH_SIMILARITY
      large.forEach((members, g) => {
        const avg = members.reduce((s, j) => s + sim[i * n + j], 0) / members.length
        if (avg >= bestSim) {
          best = g
          bestSim = avg
        }
      })
      if (best >= 0) {
        joins[best].push(i)
        group.splice(group.indexOf(i), 1, -1)
      }
    }
  }
  return [
    ...large.map((members, g) => [...members, ...joins[g]]),
    ...small.map(g => g.filter(i => i >= 0)).filter(g => g.length > 0),
  ]
}

// Units across a group: per base card id, the share of decks running it and
// its signature score (average copies where played ×10 + level ×7, as a deck
// used to be named by)
function groupUnits(decks, lookup) {
  const units = new Map()
  for (const deck of decks) {
    const seen = new Set()
    for (const card of deck) {
      const id = card.cardId.replace(/_p\d+$/, '')
      const info = lookup(id)
      if (info.type !== 'UNIT') {
        continue
      }
      const u = units.get(id) ?? { cardId: id, info, decks: 0, copies: 0 }
      u.copies += card.quantity
      if (!seen.has(id)) {
        u.decks++
        seen.add(id)
      }
      units.set(id, u)
    }
  }
  return [...units.values()].map(u => ({
    ...u,
    share: u.decks / decks.length,
    score: (u.copies / u.decks) * 10 + (parseInt(u.info.level) || 0) * 7,
  }))
}

// Name candidates for one colour, best first: LR units in at least
// NAME_LR_SHARE of decks, those in at least NAME_STAPLE_SHARE first, then
// highest level first, then R units in at least
// NAME_STAPLE_SHARE, by share × score, then any in at least NAME_UNIT_SHARE, most common first. Each
// candidate carries its tier (0 LR, 1 R, 2 the rest)
function colourCandidates(units, color) {
  const own = units.filter(u => u.info.color === color)
  const byValue = (a, b) =>
    b.share * b.score - a.share * a.score || a.cardId.localeCompare(b.cardId)
  const byLevel = (a, b) => staple(b) - staple(a) || level(b) - level(a) || byValue(a, b)
  const lrs = own.filter(u => rarityRank(u.info) === 2 && u.share >= NAME_LR_SHARE).sort(byLevel)
  const rs = own.filter(u => rarityRank(u.info) === 1 && u.share >= NAME_STAPLE_SHARE).sort(byValue)
  const rest = own
    .filter(u => !lrs.includes(u) && !rs.includes(u) && u.share >= NAME_UNIT_SHARE)
    .sort((a, b) => b.share - a.share || rarityRank(b.info) - rarityRank(a.info) || byValue(a, b))
  return [
    ...lrs.map(u => ({ ...u, tier: 0 })),
    ...rs.map(u => ({ ...u, tier: 1 })),
    ...rest.map(u => ({ ...u, tier: 2 })),
  ]
}

// The group's name cards: one per colour, or the top two of a one-colour group
// or of a main colour with two LR units in at least NAME_STAPLE_SHARE of decks
// when the other colour, a splash, has none (2026-08 V Gundam build: V Gundam
// and Strike Freedom in nearly every deck, Aile Strike in half),
// from its LR and R units only; a colour with neither common enough goes
// unnamed, and a group with no common LR or R unit at all is named from any unit.
// `taken` holds names already given to bigger groups, `used` their name cards.
// The name needs a card of its own, not naming a bigger group, so a splash LR
// every deck of the colours runs doesn't hide the one that sets the group apart
// (2026-09 V Gundam build: V Gundam and Strike Freedom in every deck, Strike
// Freedom / Aile Strike already a bigger group's name). Without one, one slot
// swaps to its strongest such candidate (tier, then in at least
// NAME_STAPLE_SHARE of decks, then level for a LR, then share × score)
function nameCluster(decks, colors, lookup, keyFor, taken, used) {
  const units = groupUnits(decks, lookup)
  const stapleLRs = color =>
    units.filter(u => u.info.color === color && rarityRank(u.info) === 2 && staple(u)).length
  const main =
    colors.length === 1
      ? colors[0]
      : colors.find(c => stapleLRs(c) >= 2 && colors.every(o => o === c || stapleLRs(o) === 0))
  const slotsFrom = pool =>
    main
      ? (() => {
          const c = colourCandidates(pool, main)
          return [c, c.slice(1)]
        })()
      : colors.map(color => colourCandidates(pool, color))
  const keySlots = slotsFrom(units.filter(u => rarityRank(u.info) > 0))
  const slots = keySlots.some(s => s.length > 0) ? keySlots : slotsFrom(units)
  const filled = slots.filter(s => s.length > 0)
  if (filled.length === 0) {
    return []
  }
  const first = filled.map(s => s[0])
  const swaps = filled
    .flatMap((s, k) => s.slice(1).map(u => first.map((v, m) => (m === k ? u : v))))
    .sort((a, b) => {
      const swapped = names => names.find((u, k) => u !== first[k])
      const [x, y] = [swapped(a), swapped(b)]
      return (
        x.tier - y.tier ||
        staple(y) - staple(x) ||
        (x.tier === 0 ? level(y) - level(x) : 0) ||
        y.share * y.score - x.share * x.score
      )
    })
  const ids = names => names.map(u => u.cardId)
  const free = names => new Set(ids(names)).size === names.length && !taken.has(keyFor(ids(names)))
  const own = names => names.some(u => !used.has(u.cardId))
  const best =
    [first, ...swaps].find(names => free(names) && own(names)) ??
    [first, ...swaps].find(free) ??
    first
  // Two cards of one colour: the one not naming a bigger group leads
  const ordered = main ? [...best].sort((a, b) => used.has(a.cardId) - used.has(b.cardId)) : best
  return ids(ordered)
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
    const keyFor = ids => `${combo} (${ids.map(id => lookup(id).name).join(' / ')})`
    const taken = new Set()
    const used = new Set()
    for (const members of clusterCombo(vectors, minDecks)) {
      const groupDecks = members.map(i => decks[i])
      let result = { key: combo, sigCardIds: [] }
      if (members.length >= minDecks) {
        const ids = nameCluster(groupDecks, colors, lookup, keyFor, taken, used)
        if (ids.length > 0) {
          result = { key: keyFor(ids), sigCardIds: ids }
          if (taken.has(result.key)) {
            console.log(`  no free name for ${members.length} decks, counted as ${result.key}`)
          }
          taken.add(result.key)
          ids.forEach(id => used.add(id))
        }
      }
      for (const deck of groupDecks) {
        assigned.set(deck, result)
      }
    }
  }

  return deck => assigned.get(deck) ?? { key: colorsOf(deck).join('+'), sigCardIds: [] }
}
