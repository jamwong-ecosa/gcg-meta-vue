// The official ban & restricted list currently in force:
// https://www.gundam-gcg.com/zh-tw/news/01_279.html (page dated 2026-09-25).
// Checked at display time against today's list: the decks in our data were
// played before it, so a hit means "can't be played like this now", not
// "was illegal at the event". Update here when the list changes

// Not allowed in a deck at all
const BANNED = new Set(['GD01-020'])

// Allowed only up to this many copies
const LIMITED = new Map([['ST02-016', 2]])

// The two cards of a pair can't be in the same deck
const BANNED_PAIRS = [
  ['ST01-010', 'ST05-010'],
  ['GD01-008', 'GD05-015'],
]

// Lv.2, cost 1, AP2, HP2 units with no effect text: any two of them are a
// banned pair, so a deck runs one kind only, up to 4 copies
const VANILLA_UNITS = new Set([
  'GD01-035',
  'GD01-060',
  'GD01-085',
  'GD02-013',
  'GD02-080',
  'GD03-032',
  'GD03-063',
  'GD04-078',
  'GD05-014',
  'GD05-027',
  'GD05-042',
  'GD05-062',
  'GD05-077',
  'ST01-005',
  'ST04-008',
  'ST05-004',
  'ST05-009',
  'ST06-004',
  'ST09-005',
  'ST10-005',
  'ST11-008',
  'ST12-010',
])

// What breaks the current list in a deck of [{ cardId, qty }]:
// [{ kind: 'banned' | 'limited' | 'pair' | 'vanilla', cardIds, limit? }],
// empty when the deck can be played as it is
export function banListHits(cards) {
  const qty = new Map()
  for (const c of cards) {
    qty.set(c.cardId, (qty.get(c.cardId) ?? 0) + c.qty)
  }
  const hits = []
  for (const [cardId, n] of qty) {
    if (BANNED.has(cardId)) {
      hits.push({ kind: 'banned', cardIds: [cardId] })
    }
    const limit = LIMITED.get(cardId)
    if (limit != null && n > limit) {
      hits.push({ kind: 'limited', cardIds: [cardId], limit })
    }
  }
  for (const pair of BANNED_PAIRS) {
    if (pair.every(id => qty.has(id))) {
      hits.push({ kind: 'pair', cardIds: pair })
    }
  }
  const vanilla = [...qty.keys()].filter(id => VANILLA_UNITS.has(id))
  if (vanilla.length > 1) {
    hits.push({ kind: 'vanilla', cardIds: vanilla })
  }
  return hits
}

// A card's own entry on the list, whatever deck it's in:
// { kind, limit? , partnerIds? } or null when it isn't on the list
export function banListRule(cardId) {
  if (BANNED.has(cardId)) {
    return { kind: 'banned' }
  }
  if (LIMITED.has(cardId)) {
    return { kind: 'limited', limit: LIMITED.get(cardId) }
  }
  const partnerIds = BANNED_PAIRS.filter(pair => pair.includes(cardId)).map(pair =>
    pair.find(id => id !== cardId),
  )
  if (partnerIds.length) {
    return { kind: 'pair', partnerIds }
  }
  return VANILLA_UNITS.has(cardId) ? { kind: 'vanilla' } : null
}

// cardId → the kind of hit it's part of, for tagging cards in a deck's popover
export function banListCardKinds(hits) {
  const kinds = new Map()
  for (const hit of hits) {
    for (const id of hit.cardIds) {
      kinds.set(id, hit.kind)
    }
  }
  return kinds
}
