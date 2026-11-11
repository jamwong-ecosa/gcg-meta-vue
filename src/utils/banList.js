import cardMeta from '$data/card-meta.json'

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
// banned pair, so a deck runs one kind only, up to 4 copies. Read from the card
// data so units from new sets are covered without editing this file
const VANILLA_UNITS = new Set(
  cardMeta
    .filter(
      c =>
        c.type === 'UNIT' &&
        c.noEffect &&
        c.level === '2' &&
        c.cost === '1' &&
        c.ap === '2' &&
        c.hp === '2',
    )
    .map(c => c.id),
)

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
