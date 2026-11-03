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
import { useStorage } from '@vueuse/core'

const props = defineProps({
  items: { type: Array, default: () => [] },
})

const TIER_ORDER = ['S', 'A', 'B', 'C', 'D', '--']
const TIER_COLORS = ['#fca5a5', '#fdba74', '#fbbf24', '#86efac', '#93c5fd', '#d1d5db']
const TIER_COLORS_DARK = ['#c53030', '#dd6b20', '#d69e2e', '#2f855a', '#2b6cb0', '#4b5563']
const GROUPS = TIER_ORDER.map((name, i) => ({
  name,
  color: TIER_COLORS[i],
  colorDark: TIER_COLORS_DARK[i],
}))

// Same prior as the tier score's smoothed conversion (scripts/build-tiers.mjs):
// each archetype is treated as having this many extra decks at the average win rate
const PRIOR_DECKS = 10
const LABEL_COUNT = 6
const QUADRANTS = ['Meta', 'Sleeper', 'Niche', 'Trap']

const MODES = [
  { key: 'usage-winEv', label: 'Usage - Win.Ev', x: 'use', y: 'winEv', minWins: 3 },
  { key: 'usage-winDk', label: 'Usage - Win.Dk', x: 'use', y: 'winDk' },
  { key: 'usage-score', label: 'Usage - Score', x: 'use', y: 'score' },
  { key: 'winDk-winEv', label: 'Win.Dk - Win.Ev', x: 'winDk', y: 'winEv', minWins: 3 },
]

const chartMode = useStorage('gcg-quadrant-mode', 'usage-winEv')
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
    score: Number(item.score),
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
  score: { label: 'Tier Score', scale: 'linear', ref: null, refLabel: 'median' },
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
  const labeled = new Set(
    [...parsed.value]
      .sort((a, b) => b.decks - a.decks)
      .slice(0, LABEL_COUNT)
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
    `Bubble size = decks. Win.Dk is shrunk toward the ${avgWinDk.value?.toFixed(1) ?? '–'}% average (${PRIOR_DECKS}-deck prior).`,
)

function tooltip(r) {
  return `<b>${r.archetype}</b><br/>
    Use: ${r.usePct}<br/>
    Win/Dk: ${r.winPerDk} (adj. ${r.winDk.toFixed(1)}%)<br/>
    Win/Ev: ${r.winPerEv}<br/>
    Score: ${r.score}<br/>
    Decks: ${r.decks}<br/>
    Wins: ${r.wins}<br/>
    Top4: ${r.top4}`
}

// "Red+White（マスターガンダム / シャイニングガンダム）" → "マスターガンダム"
function shortName(archetype) {
  return archetype.match(/（(.+?)）/)?.[1].split(' / ')[0] ?? archetype
}
</script>
