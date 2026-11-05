<template>
  <ChartQuadrantBubble
    v-model:mode="chartMode"
    :modes="MODES"
    :axes="axes"
    :points="points"
    :groups="GROUPS"
    :tooltip="tooltip"
    :note="note"
  />
</template>

<script setup>
import { useStorage, useWindowSize } from '@vueuse/core'

const props = defineProps({
  items: { type: Array, default: () => [] },
})

const TIER_ORDER = ['S', 'A', 'B', 'C', 'D', '--']
// One step stronger than the tier pills so bubbles stand out against the quadrant tints
const TIER_COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#9ca3af']
const TIER_COLORS_DARK = ['#c53030', '#dd6b20', '#d69e2e', '#2f855a', '#2b6cb0', '#4b5563']
const GROUPS = TIER_ORDER.map((name, i) => ({
  name,
  color: TIER_COLORS[i],
  colorDark: TIER_COLORS_DARK[i],
}))

// Same prior as the tier score's smoothed conversion (scripts/build-tiers.mjs):
// each archetype is treated as having this many extra decks at the average win rate
const PRIOR_DECKS = 10
// Fewer archetypes and names on phones, where the small ones pile up near the origin
const { width: winWidth } = useWindowSize()
const isMobile = computed(() => winWidth.value < 640)
const labelCount = computed(() => (isMobile.value ? 4 : 8))
// Also name the best under-played winners, the chart's most interesting points
const SLEEPER_LABELS = 2
const MOBILE_MAX_POINTS = 20
// Percentage points between raw and adjusted Win.Dk before the tooltip shows both
const ADJ_NOTE_MIN_DIFF = 0.5
const QUADRANTS = ['Meta', 'Sleeper', 'Niche', 'Trap']

// Usage vs Win.Dk first: Win.Ev grows with usage, so Usage - Win.Ev mostly draws a diagonal
const MODES = [
  { key: 'usage-winDk', label: 'Usage - Win.Dk', x: 'use', y: 'winDk' },
  { key: 'usage-winEv', label: 'Usage - Win.Ev', x: 'use', y: 'winEv', minWins: 3 },
]

// v2 key so everyone lands on the new Usage - Win.Dk default once
const chartMode = useStorage('gcg-quadrant-mode-v2', 'usage-winDk')
// A stored mode may have been removed (e.g. the old Top4/Dk mode)
if (!MODES.some(m => m.key === chartMode.value)) {
  chartMode.value = MODES[0].key
}

const config = computed(() => MODES.find(m => m.key === chartMode.value) ?? MODES[0])

const rows = computed(() =>
  props.items.map(item => ({
    ...item,
    use: parseFloat(item.usePct),
    winEv: parseFloat(item.winPerEv),
    rawWinDk: parseFloat(item.winPerDk),
  })),
)

// Series-wide references: fair share of usage and of event wins is 1/N,
// win rate per deck is total wins ÷ total decks
const fairShare = computed(() => (rows.value.length ? 100 / rows.value.length : null))
const avgWinDk = computed(() => {
  const decks = rows.value.reduce((s, r) => s + r.decks, 0)
  const wins = rows.value.reduce((s, r) => s + r.wins, 0)
  return decks ? (wins / decks) * 100 : null
})

const METRICS = computed(() => ({
  use: { label: 'Usage Rate (%)', scale: 'sqrt', ref: fairShare.value, refLabel: 'fair share' },
  winEv: {
    label: 'Win Rate / Event (%)',
    scale: 'linear',
    ref: fairShare.value,
    refLabel: 'fair share',
  },
  winDk: {
    label: 'Win Rate / Deck (%, adj.)',
    scale: 'linear',
    ref: avgWinDk.value,
    refLabel: 'avg',
  },
}))

const parsed = computed(() => {
  const cfg = config.value
  const avg = (avgWinDk.value ?? 0) / 100
  return rows.value
    .filter(r => r.decks >= 3 && r.wins >= (cfg.minWins ?? 1))
    .map(r => ({
      ...r,
      // Shrunk toward the average so 3-deck archetypes with 1 win don't top the chart
      winDk: ((r.wins + PRIOR_DECKS * avg) / (r.decks + PRIOR_DECKS)) * 100,
    }))
    .filter(r => !isNaN(r[cfg.x]) && !isNaN(r[cfg.y]))
    .sort((a, b) => b.decks - a.decks)
    .slice(0, isMobile.value ? MOBILE_MAX_POINTS : undefined)
})

const axes = computed(() => {
  const cfg = config.value
  const mx = METRICS.value[cfg.x]
  const my = METRICS.value[cfg.y]
  return {
    xLabel: mx.label,
    yLabel: my.label,
    xScale: mx.scale,
    xRef: mx.ref ?? median(parsed.value.map(r => r[cfg.x])),
    yRef: my.ref ?? median(parsed.value.map(r => r[cfg.y])),
    xRefLabel: mx.refLabel,
    yRefLabel: my.refLabel,
    quadrants: QUADRANTS,
  }
})

const points = computed(() => {
  const cfg = config.value
  const { xRef, yRef } = axes.value
  const sleepers = parsed.value
    .filter(r => r[cfg.x] < xRef && r[cfg.y] > yRef)
    .sort((a, b) => b[cfg.y] - a[cfg.y])
    .slice(0, SLEEPER_LABELS)
  const labeled = new Set(
    [...parsed.value]
      .sort((a, b) => b.decks - a.decks)
      .slice(0, labelCount.value)
      .concat(sleepers)
      .map(r => r.archetype),
  )
  // Archetypes can share a lead signature card; add their colors to tell them apart
  const names = parsed.value.filter(r => labeled.has(r.archetype)).map(r => shortName(r.archetype))
  const dupes = new Set(names.filter((n, i) => names.indexOf(n) !== i))
  const labelOf = r => {
    const name = shortName(r.archetype)
    return dupes.has(name) ? `${name} (${r.archetype.split('（')[0]})` : name
  }
  return parsed.value.map(r => ({
    x: r[cfg.x],
    y: r[cfg.y],
    size: r.decks,
    group: r.tier,
    label: labeled.has(r.archetype) ? labelOf(r) : null,
    meta: r,
  }))
})

const note = computed(
  () =>
    `${isMobile.value ? `Top ${MOBILE_MAX_POINTS} archetypes by decks. ` : ''}Meta = popular and winning, Sleeper = winning but under-played, Trap = popular but under-performing. Bubble size = decks. Win.Dk is shrunk toward the ${avgWinDk.value?.toFixed(1) ?? '–'}% average (${PRIOR_DECKS}-deck prior).`,
)

function tooltip(r) {
  const colors = r.archetype.split('（')[0]
  const tierIdx = TIER_ORDER.indexOf(r.tier)
  return {
    title: r.archetype.match(/（(.+?)）/)?.[1] ?? colors,
    subtitle: colors,
    dots: colors.split('+').map(c => COLOR_HEX[c] ?? '#718096'),
    badge: tierIdx >= 0 ? { text: r.tier, color: TIER_COLORS[tierIdx] } : null,
    rows: [
      { label: 'Usage', value: r.usePct },
      {
        label: 'Win / deck',
        value: r.winPerDk,
        // Only worth showing when the shrinkage moved it, i.e. for small archetypes
        note:
          Math.abs(r.winDk - r.rawWinDk) >= ADJ_NOTE_MIN_DIFF
            ? `adj. ${r.winDk.toFixed(1)}%`
            : null,
      },
      { label: 'Win / event', value: r.winPerEv },
      { label: 'Tier score', value: r.score },
      { label: 'Decks', value: r.decks },
      { label: 'Wins', value: r.wins },
      { label: 'Top 4', value: r.top4 },
    ],
  }
}

// "Red+White（マスターガンダム / シャイニングガンダム）" → "マスターガンダム"
function shortName(archetype) {
  return archetype.match(/（(.+?)）/)?.[1].split(' / ')[0] ?? archetype
}
</script>
