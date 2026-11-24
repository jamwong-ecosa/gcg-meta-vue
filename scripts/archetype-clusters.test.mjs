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

// Every deck runs every name unit, LRs at 3+ copies, deck families too
test('every deck runs its group’s name units, LRs at 3+ copies', { skip }, () => {
  for (const m of allMonths()) {
    for (const g of month(m).groups) {
      for (const id of g.sigCardIds) {
        const min = rarity(id) === 'LR' ? MIN_LR_COPIES : 1
        const short = g.members.filter(deck => copies(deck, id) < min).length
        assert.equal(short, 0, `${m} ${g.key}: ${id} short in ${short}`)
      }
    }
  }
})

test('a group is named after one or two units of different names', { skip }, () => {
  for (const m of allMonths()) {
    for (const g of month(m).groups) {
      assert.ok([1, 2].includes(g.sigCardIds.length), `${m} ${g.key}`)
      assert.equal(new Set(g.sigCardIds.map(nameOf)).size, g.sigCardIds.length, `${m} ${g.key}`)
    }
  }
})

// 2026-11: splinters differing only in their second unit don't rename the
// bigger group; they join it only when they run its name units ×3+
test('2026-11 splinters keep their bigger group’s name', { skip }, () => {
  const grouping = month('2026-11')
  assert.equal(named(grouping, 'Green+Purple', 'キュベレイ', 'サザビー').length, 1)
  assert.equal(named(grouping, 'Blue+Green', 'ガンダム', 'νガンダム').length, 1)
})

// 2026-11 Red+White: ΖΖ / Justice and ΖΖ / Altron are as alike as one deck
// family, but not every deck runs Justice ×3+: the ΖΖ / Altron decks that do
// join ΖΖ / Justice, and the rest stay ΖΖ / Altron
test('2026-11 the ΖΖ decks split by Justice', { skip }, () => {
  const grouping = month('2026-11')
  const [justice] = named(grouping, 'Red+White', 'ΖΖガンダム', 'ジャスティスガンダム')
  const [altron] = named(grouping, 'Red+White', 'ΖΖガンダム', 'アルトロンガンダム（EW版）')
  assert.ok(justice?.members.length >= 100, `${justice?.members.length} ΖΖ / Justice decks`)
  assert.ok(altron, 'no ΖΖ / Altron group')
  assert.ok(altron.members.every(deck => copies(deck, 'GD01-066') < MIN_LR_COPIES))
})

// 2026-10 Green+Purple: Qubeley / Sazabi and Qubeley / Gusion Rebake are as
// alike as one deck family, but Sazabi ×3+ is in 69% of their decks: they stay
// apart, Qubeley / Sazabi keeping its name rather than taking Zaku II (Char),
// ×3+ in every deck but a staple of the colours
test('2026-10 Qubeley / Sazabi keeps its name', { skip }, () => {
  const grouping = month('2026-10')
  const zaku = 'ザクⅡ（シャア・アズナブル機）'
  assert.equal(named(grouping, 'Green+Purple', 'キュベレイ', 'サザビー').length, 1)
  assert.equal(named(grouping, 'Green+Purple', zaku, 'キュベレイ').length, 0)
})

// A family's second name is a core card of its page when one of its groups' name
// units is: 2026-06 Blue+White Gundam, in 86% of the Unicorn (Awakened) decks;
// 2026-09 Green+Purple Zaku II (Char), Zeong's colour but the only one
test('a family is named after a core card of its decks', { skip }, () => {
  const awakened = 'ユニコーンガンダム（覚醒）'
  assert.equal(named(month('2026-06'), 'Blue+White', 'ガンダム', awakened).length, 1)
  const zaku = 'ザクⅡ（シャア・アズナブル機）'
  assert.equal(named(month('2026-09'), 'Green+Purple', zaku, 'ジオング').length, 1)
  const zeongAlone = month('2026-09').groups.filter(g => g.key === 'Green+Purple (ジオング)')
  assert.equal(zeongAlone.length, 0)
})

// 2026-11 Green+Purple: Zeong with Barbatos and with Exia Repair, neither in
// 85% of the decks, is named after Zaku II (Char), run ×3+ in every deck, not
// Zeong alone, and takes in the Zaku II (Char) / Zeong group, but not Zaku II
// (Char) / Barbatos, most of whose decks run no Zeong
test('2026-11 the Zeong family is named after the LR all its decks run', { skip }, () => {
  const grouping = month('2026-11')
  const zaku = 'ザクⅡ（シャア・アズナブル機）'
  const family = named(grouping, 'Green+Purple', zaku, 'ジオング')
  assert.equal(family.length, 1)
  const noZeong = family[0].members.filter(deck => copies(deck, 'GD04-017') === 0)
  assert.equal(noZeong.length, 0, `${noZeong.length} decks without Zeong`)
  const barbatos = 'ガンダム・バルバトス（第1形態）'
  assert.equal(named(grouping, 'Green+Purple', zaku, barbatos).length, 1)
  const zeongAlone = grouping.groups.filter(g => g.key === 'Green+Purple (ジオング)')
  assert.equal(zeongAlone.length, 0)
})

// 2026-09 Blue+White: the V Gundam decks are two builds of their own, not part
// of Strike Freedom / Aile Strike or a Strike Freedom family: with Aile Strike
// (11 wins) and without
test('2026-09 the V Gundam builds are their own archetypes', { skip }, () => {
  const grouping = month('2026-09')
  const [vGundam, aileStrike, strikeFreedom] = [
    'Vガンダム',
    'エールストライクガンダム',
    'ストライクフリーダムガンダム',
  ]
  const withAile = named(grouping, 'Blue+White', vGundam, aileStrike)
  const withoutAile = named(grouping, 'Blue+White', vGundam, strikeFreedom)
  assert.equal(withAile.length, 1)
  assert.equal(withoutAile.length, 1)
  const aile = named(grouping, 'Blue+White', strikeFreedom, aileStrike)
  const vInAile = aile[0].members.filter(deck => copies(deck, 'GD04-003') >= MIN_LR_COPIES)
  assert.ok(vInAile.length < 5, `${vInAile.length} V Gundam decks left in SF / Aile`)
})

// 2026-10 Green+Purple: Qubeley Lv7, in half the decks at three or four, leads
// over Zeong Lv6 in nearly all
test('2026-10 Green+Purple Qubeley decks are named after Qubeley', { skip }, () => {
  const grouping = month('2026-10')
  const size = (...names) =>
    named(grouping, 'Green+Purple', ...names).reduce((sum, g) => sum + g.members.length, 0)
  const [qubeley, zeong] = [size('キュベレイ'), size('ジオング', 'サザビー')]
  assert.ok(qubeley > 4 * zeong, `Qubeley ${qubeley} vs Zeong / Sazabi ${zeong}`)
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
