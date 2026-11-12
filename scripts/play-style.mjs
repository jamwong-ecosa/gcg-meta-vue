// Play style per archetype (aggro / midrange / control / combo), worked out
// from what an average deck of the archetype runs: its level curve, its mix of
// card types and what its cards' effects do. There is no official field for
// this; the thresholds were tuned by eye against the 2026-03 → 2026-11 series,
// so an archetype the rules get wrong goes in OVERRIDES rather than bending them.

// Archetype (the combo key, e.g. 'Blue+Green (ガンダム / νガンダム)') → style
const OVERRIDES = {}

// Reminder text in brackets repeats words the signals look for (《ブロッカー》's
// reminder says レストにする), so it is dropped before matching
const stripReminders = effect => (effect ?? '').replace(/\n?[(（][^)）]*[)）]/g, '')

// What a card's effect does. The opponent-unit patterns reach across a sentence
// break ("相手のユニット1つを選ぶ。それに2ダメージを与える") but not into the
// next 【timing】 block
const SIGNALS = {
  draw: /ドロー/,
  blocker: /《ブロッカー》(?!を持つ)/,
  removal:
    /相手の[^【]{0,25}ユニット[^【]{0,45}?(ダメージを与える|破壊する)|ユニットすべてに[^。]{0,12}ダメージ/,
  rest: /相手の[^【]{0,25}ユニット[^【]{0,35}?レストに/,
  bounce: /相手の[^【]{0,25}ユニット[^【]{0,35}?手札に戻す/,
}

// Copies per average deck: how many are low or high level, of each type, and
// carrying each signal. `cards` have cardId, type, level and totalQty (copies
// across all the archetype's decks); `lookup` gives a card's effect text
function deckProfile(cards, deckCount, lookup) {
  const p = { total: 0, levelSum: 0, low: 0, UNIT: 0, COMMAND: 0 }
  for (const key of Object.keys(SIGNALS)) {
    p[key] = 0
  }
  for (const card of cards) {
    const copies = (card.totalQty ?? 0) / deckCount
    const level = parseInt(card.level)
    p.total += copies
    if (Number.isFinite(level)) {
      p.levelSum += level * copies
      if (level <= 3) {
        p.low += copies
      }
    }
    if (card.type in p) {
      p[card.type] += copies
    }
    const effect = stripReminders(lookup(card.cardId).effect)
    for (const [key, pattern] of Object.entries(SIGNALS)) {
      if (pattern.test(effect)) {
        p[key] += copies
      }
    }
  }
  p.level = p.total ? p.levelSum / p.total : 0
  return p
}

export function playStyle(combo, cards, deckCount, lookup) {
  if (OVERRIDES[combo]) {
    return OVERRIDES[combo]
  }
  if (!deckCount) {
    return null
  }
  const p = deckProfile(cards, deckCount, lookup)
  // Combo: built on commands and the draw to find them, not on units
  if (p.COMMAND >= 15 && p.draw >= 12) {
    return 'combo'
  }
  // Aggro: wins through its units on a low curve. Either the deck is mostly
  // low-level cards, or it is unit-heavy (two thirds of the deck) with an
  // average level of 3.7 or less; what else those units do (removal, evasion,
  // trash synergy) doesn't change that
  if (p.low >= 28 && p.level <= 3.4) {
    return 'aggro'
  }
  if (p.UNIT >= 33 && p.level <= 3.7) {
    return 'aggro'
  }
  // Control: a higher curve behind blockers and removal. A deck with a moderate
  // number of answers also needs draw to keep going; one stacked with them
  // doesn't (the 2026-03 → 2026-06 card pool had little draw to run)
  const answers = p.blocker + p.removal + p.rest + p.bounce
  if (p.level >= 3.9 && ((answers >= 14 && p.draw >= 9) || answers >= 22)) {
    return 'control'
  }
  return 'midrange'
}
