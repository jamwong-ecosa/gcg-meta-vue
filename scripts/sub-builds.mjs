// Sub-builds per archetype: some archetypes are two decks sharing a name, the
// same signature cards with a different package around them (Blue+White
// Strike Freedom / Aile Strike: a Rick Dias build and a GD06 Cannon Ilfut
// build that almost never share a card). Their flex cards then look divisive
// when each build plays its own package as a near-staple.
//
// The decks are split in two by which flex cards they run (k-means on card
// presence), and the split is kept only when both halves are big enough and
// each runs a package of its own the other mostly doesn't.

// Archetypes smaller than this aren't split: too few decks to tell a second
// build from a handful of odd lists
const MIN_DECKS = 24
// Each build needs this many decks and this share of the archetype
const MIN_BUILD_DECKS = 8
const MIN_BUILD_SHARE = 0.2
// Cards in this band across the archetype are what the builds are told apart by
const FLEX_MIN = 0.15
const FLEX_MAX = 0.85
// A key card: played by this much more of its build than of the other
const KEY_GAP = 0.5
// …and by at least this much of its own build
const KEY_MIN_RATE = 0.6
// Key cards across both builds: fewer is a card swap (one Strike Rouge for
// another), a tech choice rather than a second build
const MIN_KEY_CARDS = 4
// Key cards shown per build
const KEY_CARDS_SHOWN = 4
const RESTARTS = 64

// Small seeded PRNG so the split is the same on every run
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const dist = (u, v) => u.reduce((s, x, i) => s + (x - v[i]) ** 2, 0)

// Two-means on 0/1 vectors: the best of RESTARTS seeded starts by total
// squared distance. Returns each vector's group (0 or 1)
function twoMeans(vectors) {
  const rand = mulberry32(vectors.length)
  let best = null
  for (let r = 0; r < RESTARTS; r++) {
    let centres = [0, 1].map(() => vectors[Math.floor(rand() * vectors.length)].slice())
    let labels = []
    for (let it = 0; it < 50; it++) {
      const next = vectors.map(v => (dist(v, centres[1]) < dist(v, centres[0]) ? 1 : 0))
      const settled = next.every((l, i) => l === labels[i])
      labels = next
      centres = centres.map((c, g) => {
        const members = vectors.filter((_, i) => labels[i] === g)
        return members.length
          ? c.map((_, f) => members.reduce((s, v) => s + v[f], 0) / members.length)
          : c
      })
      if (settled) {
        break
      }
    }
    const sse = vectors.reduce((s, v, i) => s + dist(v, centres[labels[i]]), 0)
    if (!best || sse < best.sse) {
      best = { sse, labels }
    }
  }
  return best.labels
}

// `deckCardIds`: the archetype's decks as "ID:qty|ID:qty"; `winnerFlags`: one
// per deck; `keyOf`: card id → its effect key, so reprints count as one card.
// Returns null, or { deckBuild: [0|1 per deck], builds: [{ decks, wins,
// keyCardIds }] } with the bigger build first. A key card id is the version
// that build plays most
export function subBuilds(deckCardIds, winnerFlags, keyOf) {
  const n = deckCardIds.length
  if (n < MIN_DECKS) {
    return null
  }
  // Each deck as effect key → { card id: copies }
  const decks = deckCardIds.map(s => {
    const keys = new Map()
    for (const entry of s.split('|').filter(Boolean)) {
      const [id, qty] = entry.split(':')
      const key = keyOf(id)
      const ids = keys.get(key) ?? {}
      ids[id] = (ids[id] ?? 0) + Number(qty)
      keys.set(key, ids)
    }
    return keys
  })
  const rateOf = (key, members) => members.filter(d => d.has(key)).length / (members.length || 1)
  const allKeys = [...new Set(decks.flatMap(d => [...d.keys()]))]
  const flex = allKeys.filter(k => {
    const r = rateOf(k, decks)
    return r >= FLEX_MIN && r <= FLEX_MAX
  })
  if (flex.length < 2) {
    return null
  }

  const labels = twoMeans(decks.map(d => flex.map(k => (d.has(k) ? 1 : 0))))
  const groups = [0, 1].map(g => decks.filter((_, i) => labels[i] === g))
  const minSize = Math.max(MIN_BUILD_DECKS, Math.ceil(n * MIN_BUILD_SHARE))
  if (groups.some(g => g.length < minSize)) {
    return null
  }

  const builds = groups.map((members, g) => {
    const others = groups[1 - g]
    const keyCards = flex
      .map(k => ({ k, own: rateOf(k, members), gap: rateOf(k, members) - rateOf(k, others) }))
      .filter(c => c.gap >= KEY_GAP && c.own >= KEY_MIN_RATE)
      .sort((a, b) => b.gap - a.gap || a.k.localeCompare(b.k))
      .map(({ k }) => {
        // The version of this effect the build plays most copies of
        const copies = {}
        for (const d of members) {
          for (const [id, q] of Object.entries(d.get(k) ?? {})) {
            copies[id] = (copies[id] ?? 0) + q
          }
        }
        return Object.entries(copies).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]
      })
    return {
      group: g,
      decks: members.length,
      wins: labels.filter((l, i) => l === g && winnerFlags[i]).length,
      keyCardIds: keyCards,
    }
  })
  // Both builds need a package of their own; one with none is just the other
  // build missing a few cards
  if (
    builds.some(b => b.keyCardIds.length === 0) ||
    builds.reduce((sum, b) => sum + b.keyCardIds.length, 0) < MIN_KEY_CARDS
  ) {
    return null
  }

  // Bigger build first, numbered from 0 in that order
  builds.sort((a, b) => b.decks - a.decks || a.group - b.group)
  const renumber = new Map(builds.map((b, i) => [b.group, i]))
  return {
    deckBuild: labels.map(l => renumber.get(l)),
    builds: builds.map(({ decks: d, wins, keyCardIds }) => ({
      decks: d,
      wins,
      keyCardIds: keyCardIds.slice(0, KEY_CARDS_SHOWN),
    })),
  }
}
