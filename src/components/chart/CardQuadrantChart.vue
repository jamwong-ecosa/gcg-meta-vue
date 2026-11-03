<template>
  <ChartQuadrantBubble
    v-model:mode="chartMode"
    :modes="MODES"
    :axes="axes"
    :points="points"
    :groups="GROUPS"
    :tooltip="tooltip"
    :note="note"
    :chart-key="`${seriesKey}-${cardTypeChart ?? 'all'}`"
  />
</template>

<script setup>
import { useStorage } from '@vueuse/core'

const props = defineProps({
  // Already filtered to cardTypeChart by the parent section
  cardItems: { type: Array, default: () => [] },
  cardTypeChart: { type: String, default: null },
  seriesKey: { type: String, default: '' },
})

const CARD_COLOR_ORDER = ['Blue', 'Green', 'Purple', 'Red', 'White']
const CARD_COLOR_MAP = {
  Blue: '#2b6cb0',
  Green: '#38a169',
  Purple: '#805ad5',
  Red: '#e53e3e',
  White: '#cbd5e1',
}
// White bubbles need a visible outline on the light background
const GROUPS = CARD_COLOR_ORDER.map(name => ({
  name,
  color: CARD_COLOR_MAP[name],
  stroke: name === 'White' ? '#94a3b8' : undefined,
}))

const TOP_N = 40
// Lift is shrunk toward 0 as if each card had this many extra decks at its archetypes' rate
const PRIOR_DECKS = 10

const MODES = [
  {
    key: 'card-impact',
    label: 'Card Impact',
    yLabel: 'Winner Rate vs Archetype (pp)',
    quadrants: ['Elite', 'Hidden Gem', 'Fringe', 'Overplayed'],
  },
  {
    key: 'card-versatility',
    label: 'Card Versatility',
    yLabel: 'Effective Archetypes',
    quadrants: ['Staples', 'Flex Pick', 'Obscure', 'One-Trick'],
  },
]

const chartMode = useStorage('gcg-card-chart-mode', 'card-impact')
if (!MODES.some(m => m.key === chartMode.value)) {
  chartMode.value = MODES[0].key
}

const config = computed(() => MODES.find(m => m.key === chartMode.value) ?? MODES[0])
const isImpact = computed(() => config.value.key === 'card-impact')

const parsed = computed(() =>
  props.cardItems
    .filter(item => isImpact.value || item.archetypeCount > 1)
    .sort((a, b) => b.totalDecksIncluded - a.totalDecksIncluded)
    .slice(0, TOP_N)
    .map(item => {
      const decks = item.totalDecksIncluded
      const expected = item.expectedWinnerDecks ?? 0
      return {
        ...item,
        winnerRate: decks > 0 ? (item.totalWinnerDecks / decks) * 100 : 0,
        expectedRate: decks > 0 ? (expected / decks) * 100 : 0,
        // Positive = winner decks play it more often than their archetypes alone predict
        lift: ((item.totalWinnerDecks - expected) / (decks + PRIOR_DECKS)) * 100,
        spread: item.effectiveArchetypes ?? item.archetypeCount,
      }
    }),
)

const yKey = computed(() => (isImpact.value ? 'lift' : 'spread'))

const axes = computed(() => {
  const ys = parsed.value.map(c => c[yKey.value])
  return {
    xLabel: 'Decks Included',
    yLabel: config.value.yLabel,
    xScale: 'sqrt',
    xRef: median(parsed.value.map(c => c.totalDecksIncluded)),
    yRef: isImpact.value ? 0 : median(ys),
    xRefLabel: 'median',
    yRefLabel: isImpact.value ? 'archetype avg' : 'median',
    yFormat: isImpact.value ? v => (v > 0 ? `+${trim(v)}` : trim(v)) : undefined,
    quadrants: config.value.quadrants,
  }
})

const points = computed(() => {
  const y = yKey.value
  const ref = axes.value.yRef ?? 0
  const byDecks = [...parsed.value].sort((a, b) => b.totalDecksIncluded - a.totalDecksIncluded)
  const byOutlier = [...parsed.value].sort((a, b) => Math.abs(b[y] - ref) - Math.abs(a[y] - ref))
  const labeled = new Set([...byDecks.slice(0, 4), ...byOutlier.slice(0, 3)].map(c => c.cardId))
  return parsed.value.map(c => ({
    x: c.totalDecksIncluded,
    y: c[y],
    size: isImpact.value ? c.archetypeCount : c.totalWinnerDecks,
    group: CARD_COLOR_ORDER.includes(c.color) ? c.color : 'Other',
    label: labeled.has(c.cardId) ? c.name : null,
    meta: c,
  }))
})

const note = computed(() => {
  const scope = `Top ${TOP_N} ${props.cardTypeChart ?? ''} cards by decks included`.replace(
    /\s+/g,
    ' ',
  )
  return isImpact.value
    ? `${scope}. Y = winner rate minus what the archetypes playing it would predict. Bubble size = archetypes.`
    : `${scope}. Y = archetypes the card is spread across, weighted by decks. Bubble size = winner decks.`
})

function tooltip(c) {
  return `<b>${c.name}</b><br/>
    ID: ${c.cardId}.${c.type}<br/>
    Color: ${c.color}<br/>
    Decks: ${c.totalDecksIncluded}<br/>
    Winner Decks: ${c.totalWinnerDecks}<br/>
    Winner Rate: ${c.winnerRate.toFixed(1)}% (archetype ${c.expectedRate.toFixed(1)}%)<br/>
    Lift: ${c.lift > 0 ? '+' : ''}${c.lift.toFixed(1)}pp<br/>
    Archetypes: ${c.archetypeCount} (effective ${c.spread})`
}

function trim(v) {
  return String(+v.toFixed(1))
}
</script>
