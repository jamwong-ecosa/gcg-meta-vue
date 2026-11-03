// Per-card stats shown on archetype cards: copies per deck, the win-rate change
// with the card (`lift`, computed by ArchetypeDetail), and a tooltip with both.
// `card` and `lift` are getters so the values follow prop changes.
export function useCardStats(card, lift) {
  // Copies per deck that runs it, rounded to a whole number for the badge and hint
  const copiesExact = computed(() => {
    const { totalQty, decksIncluded, avgQty } = card()
    return totalQty && decksIncluded ? +(totalQty / decksIncluded).toFixed(1) : avgQty
  })
  const copies = computed(() => Math.max(1, Math.round(copiesExact.value)))

  const liftText = computed(() => liftValue(lift()))
  const liftClass = computed(() => liftTone(lift()))

  // Rows for UiHint's `content`
  const statsRows = computed(() => {
    const c = card()
    return [
      { label: 'Decks', value: c.decksIncluded, note: `${(c.inclusionRate * 100).toFixed(1)}%` },
      { label: 'Wins', value: c.winnerDeckCount ?? 0, note: 'events won' },
      liftRow(lift()),
    ].filter(Boolean)
  })

  return { copies, liftText, liftClass, statsRows }
}

// Hint row for the win-rate change; null when there is nothing to say
export function liftRow(lift, vs = 'with it vs without') {
  if (!lift) {
    return null
  }
  if (lift.value === null) {
    return { label: 'WR', value: '—', note: lift.note }
  }
  return {
    label: 'WR',
    value: `${liftValue(lift)} pts`,
    note: lift.significant ? vs : `${vs}, could be chance`,
    class: lift.significant && lift.value ? liftTone(lift) : tw`text-gray-600 dark:text-gray-300`,
  }
}

// Inclusion bar colour: hotter for cards more decks run
export function inclusionBarClass(rate) {
  const pct = (rate ?? 0) * 100
  if (pct >= 90) {
    return tw`bg-red-500 dark:bg-red-700`
  }
  if (pct >= 75) {
    return tw`bg-amber-500 dark:bg-amber-700`
  }
  if (pct >= 50) {
    return tw`bg-yellow-400 dark:bg-yellow-600`
  }
  if (pct >= 25) {
    return tw`bg-green-500 dark:bg-green-700`
  }
  return tw`bg-sky-400 dark:bg-sky-600`
}

// `lift` is ArchetypeDetail's { value, significant } | { value: null, note } | null

// "WR +3.2" for a win-rate change in points; '' when there is none
export function liftLabel(lift) {
  const value = liftValue(lift)
  return value && `WR ${value}`
}

// The signed number alone ("+3.2"), for tight spots where "WR" is implied
export function liftValue(lift) {
  const v = lift?.value
  if (v === null || v === undefined) {
    return ''
  }
  return `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v).toFixed(1)}`
}

// Grey unless the gap is beyond chance
export function liftTone(lift) {
  if (!lift?.significant || !lift.value) {
    return tw`text-gray-400 dark:text-gray-500`
  }
  return lift.value > 0
    ? tw`font-semibold text-green-600 dark:text-green-500`
    : tw`font-semibold text-red-600 dark:text-red-500/90`
}

// Share as a percentage: whole numbers, but one decimal under 1% so a card in a
// few decks doesn't read as 0%
export function sharePct(rate) {
  const pct = (rate ?? 0) * 100
  return pct > 0 && pct < 1 ? pct.toFixed(1) : String(Math.round(pct))
}

// Card tags, styled the same on archetype cards and in deck popovers:
// `tags` is { sig, tech, new, flex } (booleans); `titles` overrides the tooltips
const TAG_BADGES = [
  { key: 'sig', text: '★ SIG', title: 'Signature card', class: tw`bg-black/75 text-yellow-300` },
  {
    key: 'tech',
    text: 'TECH',
    title: 'Top tech pick: uncommon, but its decks win well',
    class: tw`bg-yellow-400 text-yellow-950`,
  },
  {
    key: 'new',
    text: 'NEW',
    title: 'Not played by this archetype last series',
    class: tw`bg-green-600 text-white`,
  },
  { key: 'flex', text: 'FLEX', title: 'Flex slot', class: tw`bg-sky-600 text-white` },
]

export function tagBadges(tags, titles = {}) {
  return TAG_BADGES.filter(b => tags[b.key]).map(b => ({ ...b, title: titles[b.key] ?? b.title }))
}

// Ring drawn behind the card: TECH yellow, NEW green, both split on the diagonal
// (yellow top-left, green bottom-right); '' for neither
export function tagRingClass(tags) {
  if (tags.tech && tags.new) {
    return tw`bg-[linear-gradient(135deg,var(--color-yellow-400)_50%,var(--color-green-500)_50%)]`
  }
  if (tags.tech) {
    return tw`bg-yellow-400 dark:bg-yellow-500`
  }
  return tags.new ? tw`bg-green-500` : ''
}
