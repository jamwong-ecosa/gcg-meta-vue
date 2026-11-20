// Checks on archetype-clusters.mjs against the scraped data: the rules every
// group keeps, and the cases its comments were written for. Needs data/ (run
// `npm run data` first); skipped without it. `npm test`
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { loadData, groupSeries } from './grouping-report.mjs'

const hasData = existsSync('data/cards.json') && existsSync('data/tournaments-all.json')
const skip = !hasData && 'no scraped data in data/'
const MIN_LR_COPIES = 3

const data = hasData ? loadData() : null
const groupings = new Map()
// One month's grouping, by its YYYY-MM, run once
function month(m) {
  if (!groupings.has(m)) {
    const series = data.series.find(s => s.label.startsWith(m))
    assert.ok(series, `no ${m} series in the data`)
    groupings.set(m, groupSeries(series, data.helpers))
  }
  return groupings.get(m)
}
const allMonths = () =>
  (data?.series ?? []).map(s => s.label.match(/^\d{4}-\d{2}/)?.[0]).filter(Boolean)

const baseId = cardId => cardId.replace(/_p\d+$/, '')
const copies = (deck, id) =>
  deck.filter(card => baseId(card.cardId) === id).reduce((sum, card) => sum + card.quantity, 0)
const rarity = id => data.helpers.lookup(id).rarity.replace(/\+*$/, '')
const nameOf = id => data.helpers.lookup(id).name
// Groups of one colour combo whose name units have these names (any order)
const named = (grouping, combo, ...names) =>
  grouping.groups.filter(
    g => g.combo === combo && names.every(name => g.sigCardIds.some(id => nameOf(id) === name)),
  )
const groupOf = (grouping, deck) => grouping.groups.find(g => g.members.includes(deck))

test('every deck runs its group’s name units, LRs at 3+ copies', { skip }, () => {
  for (const m of allMonths()) {
    for (const g of month(m).groups) {
      for (const id of g.sigCardIds) {
        const min = rarity(id) === 'LR' ? MIN_LR_COPIES : 1
        const short = g.members.filter(deck => copies(deck, id) < min)
        assert.equal(short.length, 0, `${m} ${g.key}: ${short.length} decks run ${id} under ${min}`)
      }
    }
  }
})

test('a group is named after two units of different names', { skip }, () => {
  for (const m of allMonths()) {
    for (const g of month(m).groups) {
      assert.equal(g.sigCardIds.length, 2, `${m} ${g.key}`)
      assert.notEqual(nameOf(g.sigCardIds[0]), nameOf(g.sigCardIds[1]), `${m} ${g.key}`)
    }
  }
})

// 2026-10 Green+Purple: Qubeley Lv7, in half the decks at three or four, leads
// over Zeong Lv6 in nearly all
test('2026-10 Green+Purple Qubeley / Sazabi is named after Qubeley', { skip }, () => {
  const grouping = month('2026-10')
  const size = name => named(grouping, 'Green+Purple', name, 'サザビー')[0]?.members.length ?? 0
  const [qubeley, zeong] = [size('キュベレイ'), size('ジオング')]
  assert.ok(qubeley > 4 * zeong, `Qubeley / Sazabi ${qubeley} vs Zeong / Sazabi ${zeong}`)
})

// 2026-11 Green+Purple: Zeong / Barbatos stays apart from Zaku II (Char) / Barbatos
test('2026-11 Zeong / Barbatos stays apart from Zaku II (Char) / Barbatos', { skip }, () => {
  const grouping = month('2026-11')
  const barbatos = 'ガンダム・バルバトス（第1形態）'
  const zaku = 'ザクⅡ（シャア・アズナブル機）'
  assert.equal(named(grouping, 'Green+Purple', 'ジオング', barbatos).length, 1)
  assert.equal(named(grouping, 'Green+Purple', zaku, barbatos).length, 1)
})

// 2026-11 Red+White: the ΖΖ decks adding Gold Smo Lv6 at three or more stay
// with ΖΖ, not in a Gold Smo group of their own
test('2026-11 ΖΖ decks with Gold Smo stay in a ΖΖ group', { skip }, () => {
  const grouping = month('2026-11')
  const goldSmo = 'GD06-065'
  const decks = [...grouping.groups.flatMap(g => g.members), ...grouping.unassigned].filter(
    deck => copies(deck, 'GD06-033') >= MIN_LR_COPIES && copies(deck, goldSmo) >= MIN_LR_COPIES,
  )
  assert.ok(decks.length > 0, 'no ΖΖ + Gold Smo decks found')
  for (const deck of decks) {
    const g = groupOf(grouping, deck)
    assert.ok(g?.sigCardIds.includes('GD06-033'), `in ${g?.key ?? 'no group'}`)
    assert.ok(!g.sigCardIds.includes(goldSmo), `in ${g.key}`)
  }
})

// 2026-09 Green+Red: the Gundam Exia decks, all running Gundam Schwarzette at
// three or more, join the Schwarzette group
test('2026-09 Green+Red Exia decks join the Schwarzette group', { skip }, () => {
  const grouping = month('2026-09')
  const exia = 'GD04-038'
  const schwarzette = 'GD05-022'
  const decks = grouping.groups
    .flatMap(g => g.members)
    .filter(deck => copies(deck, exia) > 0 && copies(deck, schwarzette) >= 3)
  assert.ok(decks.length > 0, 'no Exia + Schwarzette decks found')
  for (const deck of decks) {
    const g = groupOf(grouping, deck)
    assert.ok(g.sigCardIds.includes(schwarzette) && !g.sigCardIds.includes(exia), g.key)
  }
})
