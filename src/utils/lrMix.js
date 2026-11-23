// The archetype's LR units by copies per deck: how many decks run each at 3–4,
// at 1–2 or not at all. The name only carries two units, and a card tile only
// the average copies, so a third LR some decks play as a 3–4 copy core (Freedom
// in Strike Freedom / Aile Strike) would otherwise read as a ×2 flex card.

// Copies that count as running a card as core
export const LR_HEAVY = 3
// A non-signature LR gets a row when this many decks run it at 3–4 (at least
// LR_MIN_HEAVY_DECKS), or when it is in this share of decks at any count
const LR_MIN_HEAVY_SHARE = 0.05
const LR_MIN_HEAVY_DECKS = 3
const LR_MIN_SHARE = 0.15
// Under this many 3–4 decks a win rate says nothing
export const LR_MIN_WR_DECKS = 5

// Whether a deck ("ID:qty|…") runs `cardId` at 3–4
export const runsHeavy = (deck, cardId) => (parseDeck(deck).get(cardId) ?? 0) >= LR_HEAVY

// Rows for the signature units (always, first) and the LR units that pass the
// bar above; [] when no LR beyond the signature cards does, as the strip would
// then only repeat the name
export function lrMix(archetype) {
  const decks = (archetype.deckCardIds ?? []).map(parseDeck)
  const n = decks.length
  if (!n) {
    return []
  }
  const won = archetype.deckWinnerFlags ?? []
  const sigIds = archetype.sigCardIds ?? []
  const cards = [...(archetype.cards ?? []), ...(archetype.filteredCards ?? [])]

  const rows = cards
    .filter(c => c.type === 'UNIT' && (sigIds.includes(c.cardId) || c.rarity?.startsWith('LR')))
    .map(c => {
      const sig = sigIds.includes(c.cardId)
      let light = 0
      let heavy = 0
      let heavyWins = 0
      let outCopies = 0
      decks.forEach((d, i) => {
        const q = d.get(c.cardId) ?? 0
        if (!q) {
          return
        }
        if (q >= LR_HEAVY) {
          heavy++
          if (won[i]) {
            heavyWins++
          }
        } else {
          light++
        }
        if (!sig && sigIds.some(id => q > (d.get(id) ?? 0))) {
          outCopies++
        }
      })
      return {
        cardId: c.cardId,
        name: c.name,
        level: c.level,
        color: c.color,
        sig,
        heavy,
        light,
        none: n - heavy - light,
        heavyWins,
        outCopies,
      }
    })

  const shown = r =>
    r.sig ||
    r.heavy >= Math.max(LR_MIN_HEAVY_DECKS, Math.ceil(n * LR_MIN_HEAVY_SHARE)) ||
    (r.heavy + r.light) / n >= LR_MIN_SHARE
  const picked = rows.filter(shown)
  if (!picked.some(r => !r.sig)) {
    return []
  }
  return picked.sort(
    (a, b) =>
      b.sig - a.sig ||
      (a.sig ? sigIds.indexOf(a.cardId) - sigIds.indexOf(b.cardId) : 0) ||
      b.heavy - a.heavy ||
      b.heavy + b.light - (a.heavy + a.light),
  )
}
