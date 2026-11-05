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

  const liftText = computed(() => liftBadge(lift()))
  const liftClass = computed(() => liftTone(lift()))

  // Rows for UiHint's `content`
  const statsRows = computed(() => {
    const c = card()
    return [
      {
        label: translate('card.stat.decks'),
        value: c.decksIncluded,
        note: `${(c.inclusionRate * 100).toFixed(1)}%`,
      },
      {
        label: translate('card.stat.wins'),
        value: c.winnerDeckCount ?? 0,
        note: translate('card.stat.eventsWon'),
      },
      liftRow(lift()),
    ].filter(Boolean)
  })

  return { copies, liftText, liftClass, statsRows }
}

// Hint row for the win-rate change; null when there is nothing to say
// `vs` is already translated by the caller
export function liftRow(lift, vs = translate('card.stat.withVsWithout')) {
  if (!lift) {
    return null
  }
  if (lift.value === null) {
    return { label: translate('card.stat.wr'), value: '—', note: lift.note }
  }
  return {
    label: translate('card.stat.wr'),
    value: translate('card.stat.pts', { value: liftValue(lift) }),
    note: lift.significant ? vs : translate('card.stat.couldBeChance', { vs }),
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
  return value && `${translate('card.stat.wr')} ${value}`
}

// The signed number alone ("+3.2"), for tight spots where "WR" is implied
export function liftValue(lift) {
  const v = lift?.value
  if (v === null || v === undefined) {
    return ''
  }
  return `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v).toFixed(1)}`
}

// For the short label under a card: a gap that rounds to ±0.0 says nothing, so it's
// left out there (the hover still shows it)
export function liftBadge(lift) {
  return Math.abs(lift?.value ?? 0) < 0.05 ? '' : liftValue(lift)
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
// Text and default tooltip come from `card.tag.<key>`
const TAG_BADGES = [
  { key: 'sig', class: tw`bg-black/75 text-yellow-300` },
  { key: 'tech', class: tw`bg-yellow-400 text-yellow-950` },
  { key: 'new', class: tw`bg-green-600 text-white` },
  // Deck lists only, in their row chips' colours: a card some of the archetype's
  // decks play (flex), and one few of them play (uncommon)
  { key: 'flex', class: tw`bg-gray-600 text-white` },
  { key: 'uncommon', class: tw`bg-ruri text-white` },
]

export function tagBadges(tags, titles = {}) {
  return TAG_BADGES.filter(b => tags[b.key]).map(b => ({
    ...b,
    text: translate(`card.tag.${b.key}.text`),
    title: titles[b.key] ?? translate(`card.tag.${b.key}.title`),
  }))
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
