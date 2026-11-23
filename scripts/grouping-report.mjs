// How well archetype-clusters.mjs groups each month's decks, to check a change
// to the grouping against. Groups are scored on deck lists alone (weighted
// Jaccard, as the grouping compares decks), so the numbers don't depend on how
// groups are named.
//
//   npm run report:grouping                            every month
//   npm run report:grouping -- --month 2026-11         one month's groups
//   npm run report:grouping -- --save before.json      keep this run…
//   npm run report:grouping -- --compare before.json   …and diff a later one
//
// Per month:
// - ranked %: decks in an archetype the tier list ranks (MIN_ARCHETYPE_DECKS+)
// - cohesion: a deck's average similarity to the rest of its group, averaged
//   over ranked decks
// - silhouette: per deck (own group − most alike other group of its colours) ÷
//   the larger, averaged over decks in combos with two or more groups. Near 0 is
//   groups that overlap, 1 is groups that share nothing
// - small: groups under SMALL_GROUP decks, mostly D tier on their sample alone
// - loose: groups whose cohesion is under LOOSE_GROUP, a mixed bag of lists
// - near-dup: pairs of same-colour groups whose decks are at least NEAR_DUP as
//   alike across the two as within each, one deck shown as two archetypes
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { createClusterResolver, deckVector, similarity } from './archetype-clusters.mjs'
import { loadJSON, createCardLookups, loadMonthlySeries, seriesPlayers } from './series-data.mjs'

// The smallest archetype build-tiers.mjs ranks
const MIN_ARCHETYPE_DECKS = 3
const SMALL_GROUP = 10
const LOOSE_GROUP = 0.45
const NEAR_DUP = 0.85

// Card lookups and the monthly series, as build-tiers.mjs reads them
export function loadData() {
  const baseCards = loadJSON('data/cards.json').filter(c => !c.id.includes('_p'))
  return { helpers: createCardLookups(baseCards), series: loadMonthlySeries() }
}

const monthOf = series => series.label.match(/^\d{4}-\d{2}/)?.[0] ?? series.value

// One series grouped as build-tiers.mjs groups it: { month, decks, groups:
// [{ key, combo, sigCardIds, members: [deck] }], unassigned: [deck] }
export function groupSeries(series, { lookup, getDeckColors, buildCardKey }) {
  const players = seriesPlayers(series)
  const keyOf = createClusterResolver(players, {
    lookup,
    colorsOf: getDeckColors,
    cardKey: buildCardKey,
    minDecks: MIN_ARCHETYPE_DECKS,
  })
  const byKey = new Map()
  const unassigned = []
  for (const { deck } of players) {
    const { key, sigCardIds } = keyOf(deck)
    if (sigCardIds.length === 0) {
      unassigned.push(deck)
      continue
    }
    const group = byKey.get(key) ?? {
      key,
      combo: getDeckColors(deck).join('+'),
      sigCardIds,
      members: [],
    }
    group.members.push(deck)
    byKey.set(key, group)
  }
  const groups = [...byKey.values()].filter(g => g.members.length >= MIN_ARCHETYPE_DECKS)
  unassigned.push(...[...byKey.values()].filter(g => !groups.includes(g)).flatMap(g => g.members))
  return { month: monthOf(series), decks: players.length, groups, unassigned }
}

// The month's scores (see the top of the file), each group's cohesion and the
// near-duplicate pairs
export function measure({ month, decks, groups, unassigned }, cardKey) {
  const byCombo = Map.groupBy(groups, g => g.combo)
  const cohesion = new Map()
  const nearDups = []
  let ranked = 0
  let cohesionSum = 0
  let silhouetteSum = 0
  let silhouetteDecks = 0
  for (const combo of byCombo.values()) {
    // Similarities between every two ranked decks of these colours
    const vectors = combo.flatMap(g => g.members.map(deck => deckVector(deck, cardKey)))
    const n = vectors.length
    const sims = new Float64Array(n * n)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        sims[i * n + j] = sims[j * n + i] = similarity(vectors[i], vectors[j])
      }
    }
    const starts = []
    let start = 0
    for (const g of combo) {
      starts.push(start)
      start += g.members.length
    }
    // Deck i's average similarity to group h, itself left out
    const avg = (i, h) => {
      const from = starts[h]
      const size = combo[h].members.length
      let sum = 0
      for (let j = from; j < from + size; j++) {
        sum += sims[i * n + j]
      }
      const own = i >= from && i < from + size
      return own ? (size > 1 ? sum / (size - 1) : 0) : sum / size
    }
    // across[h][k]: group h's decks' average similarity to group k
    const across = combo.map(() => combo.map(() => 0))
    combo.forEach((g, h) => {
      let groupSum = 0
      for (let i = starts[h]; i < starts[h] + g.members.length; i++) {
        const own = avg(i, h)
        groupSum += own
        let other = 0
        combo.forEach((_, k) => {
          if (k !== h) {
            const sim = avg(i, k)
            across[h][k] += sim / g.members.length
            other = Math.max(other, sim)
          }
        })
        if (combo.length > 1) {
          silhouetteSum += (own - other) / Math.max(own, other)
          silhouetteDecks++
        }
      }
      cohesion.set(g.key, groupSum / g.members.length)
      ranked += g.members.length
      cohesionSum += groupSum
    })
    combo.forEach((a, h) => {
      combo.forEach((b, k) => {
        if (k <= h) {
          return
        }
        const ratio = across[h][k] / ((cohesion.get(a.key) + cohesion.get(b.key)) / 2)
        if (ratio >= NEAR_DUP) {
          nearDups.push({ a: a.key, b: b.key, sizes: [a.members.length, b.members.length], ratio })
        }
      })
    })
  }
  const small = groups.filter(g => g.members.length < SMALL_GROUP)
  return {
    scores: {
      month,
      decks,
      groups: groups.length,
      'ranked %': round((100 * ranked) / decks, 1),
      unassigned: unassigned.length,
      cohesion: round(cohesionSum / ranked, 3),
      silhouette: round(silhouetteSum / silhouetteDecks, 3),
      [`small <${SMALL_GROUP}`]: small.length,
      [`loose <${LOOSE_GROUP}`]: groups.filter(g => cohesion.get(g.key) < LOOSE_GROUP).length,
      'near-dup': nearDups.length,
    },
    cohesion,
    nearDups: nearDups.sort((x, y) => y.ratio - x.ratio),
  }
}

const round = (x, digits) => +x.toFixed(digits)

function printMonth(grouping, result) {
  const { groups } = grouping
  const { cohesion, nearDups } = result
  console.log(`\n${grouping.month}: groups by size (decks, cohesion)`)
  for (const g of [...groups].sort((a, b) => b.members.length - a.members.length)) {
    const size = String(g.members.length).padStart(4)
    const loose = cohesion.get(g.key) < LOOSE_GROUP ? '  ← loose' : ''
    console.log(`  ${size}  ${cohesion.get(g.key).toFixed(2)}  ${g.key}${loose}`)
  }
  console.log(`\nNear-duplicate pairs (across ÷ within ≥ ${NEAR_DUP})`)
  for (const d of nearDups) {
    console.log(`  ${d.ratio.toFixed(2)}  ${d.a} (${d.sizes[0]})  ~  ${d.b} (${d.sizes[1]})`)
  }
}

// What changed since a saved run: each month's scores before → after, and the
// groups that appeared, went or changed size
function printCompare(saved, runs) {
  const rows = runs.map(({ scores }) => {
    const before = saved[scores.month]?.scores ?? {}
    return Object.fromEntries(
      Object.entries(scores).map(([k, v]) =>
        k === 'month' || before[k] === undefined || before[k] === v
          ? [k, v]
          : [k, `${before[k]} → ${v}`],
      ),
    )
  })
  console.table(rows)
  for (const { scores, sizes } of runs) {
    const before = saved[scores.month]?.groups ?? {}
    const lines = []
    for (const key of new Set([...Object.keys(before), ...Object.keys(sizes)])) {
      if (before[key] !== sizes[key]) {
        const [from, to] = [before[key], sizes[key]].map(n => String(n ?? '–'))
        lines.push(`  ${from.padStart(4)} → ${to.padEnd(4)} ${key}`)
      }
    }
    if (lines.length > 0) {
      console.log(`\n${scores.month}: groups changed (decks before → after)`)
      console.log(lines.sort().join('\n'))
    }
  }
}

function main() {
  const args = process.argv.slice(2)
  const option = name => (args.includes(name) ? args[args.indexOf(name) + 1] : null)
  const month = option('--month')
  const { helpers, series } = loadData()
  const runs = series
    .filter(s => !month || monthOf(s) === month)
    .sort((a, b) => monthOf(a).localeCompare(monthOf(b)))
    .map(s => {
      const grouping = groupSeries(s, helpers)
      const result = measure(grouping, helpers.buildCardKey)
      if (month) {
        printMonth(grouping, result)
      }
      const sizes = Object.fromEntries(grouping.groups.map(g => [g.key, g.members.length]))
      return { scores: result.scores, sizes }
    })

  if (option('--compare')) {
    printCompare(loadJSON(option('--compare')), runs)
  } else {
    console.table(runs.map(r => r.scores))
  }
  if (option('--save')) {
    const saved = Object.fromEntries(
      runs.map(({ scores, sizes }) => [scores.month, { scores, groups: sizes }]),
    )
    writeFileSync(option('--save'), JSON.stringify(saved, null, 2))
    console.log(`Saved ${option('--save')}`)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
