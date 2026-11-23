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
// A deck family's second unit is a core card of its archetype page
const FAMILY_NAME_SHARE = 0.85

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

// Every deck runs every name unit (LRs at 3+ copies), but a deck family's second
// unit, which 85% of its decks play at any copies
test('every deck runs its group’s name units, LRs at 3+ copies', { skip }, () => {
  for (const m of allMonths()) {
    for (const g of month(m).groups) {
      const short = g.sigCardIds.filter(id => {
        const min = rarity(id) === 'LR' ? MIN_LR_COPIES : 1
        return g.members.some(deck => copies(deck, id) < min)
      })
      assert.ok(short.length <= 1, `${m} ${g.key}: ${short.join(', ')} short`)
      for (const id of short) {
        const playing = g.members.filter(deck => copies(deck, id) > 0).length
        const label = `${m} ${g.key}: ${id} in ${playing}`
        assert.ok(playing >= FAMILY_NAME_SHARE * g.members.length, label)
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

// 2026-11: splinters differing only in their second unit join the bigger group
// they're as alike as its own decks, keeping its name
test('2026-11 splinters join their bigger group under its name', { skip }, () => {
  const grouping = month('2026-11')
  const gusion = 'ガンダム・グシオンリベイク'
  assert.equal(named(grouping, 'Green+Purple', 'キュベレイ', gusion).length, 0)
  assert.equal(named(grouping, 'Green+Purple', 'キュベレイ', 'サザビー').length, 1)
  assert.equal(named(grouping, 'Blue+Green', 'νガンダム', 'リ・ガズィ').length, 0)
  assert.equal(named(grouping, 'Blue+Green', 'ガンダム', 'νガンダム').length, 1)
})

// 2026-11 Red+White: ΖΖ with Justice, Altron and Aerial is one deck family,
// named after Altron, in 95% of its decks though at 3+ copies in 77%: the
// bigger group's Justice is in too few, and Aerial is ΖΖ's colour
test('2026-11 the ΖΖ family is one group, ΖΖ / Altron', { skip }, () => {
  const grouping = month('2026-11')
  const family = named(grouping, 'Red+White', 'ΖΖガンダム', 'アルトロンガンダム（EW版）')
  assert.equal(family.length, 1)
  assert.ok(family[0].members.length >= 100, `${family[0].members.length} decks`)
  assert.equal(named(grouping, 'Red+White', 'ΖΖガンダム', 'ジャスティスガンダム').length, 0)
})

// 2026-10 Green+Purple: Qubeley / Gusion Rebake joins Qubeley / Sazabi, which
// keeps Sazabi: in every deck of the family, though some at one or two copies
test('2026-10 the Qubeley family keeps Sazabi', { skip }, () => {
  const grouping = month('2026-10')
  const gusion = 'ガンダム・グシオンリベイク'
  assert.equal(named(grouping, 'Green+Purple', 'キュベレイ', 'サザビー').length, 1)
  assert.equal(named(grouping, 'Green+Purple', 'キュベレイ', gusion).length, 0)
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
