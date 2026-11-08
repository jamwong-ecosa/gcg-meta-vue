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
  >
    <template v-if="$slots.default" #controls>
      <slot />
    </template>
  </ChartQuadrantBubble>
</template>

<script setup>
import { useStorage, useWindowSize } from '@vueuse/core'

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

// Fewer cards and names on phones, where 40 bubbles pile on top of each other
const { width: winWidth } = useWindowSize()
const isMobile = computed(() => winWidth.value < 640)
const topN = computed(() => (isMobile.value ? 20 : 40))
// Lift is shrunk toward 0 as if each card had this many extra decks at its archetypes' rate
const PRIOR_DECKS = 10
// Tooltip notes only appear when they say something the main value doesn't:
// archetype-predicted rate ≥ 0.5pp off, effective archetypes ≥ 1 below the count
const NOTE_MIN_RATE_DIFF = 0.5
const NOTE_MIN_ARCH_DIFF = 1

const { t } = useI18n()

// Mode keys map to `chart.cardQuad.<i18n>` for labels and quadrant names
const MODE_KEYS = [
  { key: 'card-impact', i18n: 'impact' },
  { key: 'card-versatility', i18n: 'versatility' },
]
const MODES = computed(() =>
  MODE_KEYS.map(({ key, i18n }) => ({
    key,
    i18n,
    label: t(`chart.cardQuad.${i18n}.label`),
    yLabel: t(`chart.cardQuad.${i18n}.yLabel`),
    quadrants: [0, 1, 2, 3].map(i => t(`chart.cardQuad.${i18n}.quadrants[${i}]`)),
  })),
)

const chartMode = useStorage('gcg-card-chart-mode', 'card-impact')
if (!MODE_KEYS.some(m => m.key === chartMode.value)) {
  chartMode.value = MODE_KEYS[0].key
}

const config = computed(() => MODES.value.find(m => m.key === chartMode.value) ?? MODES.value[0])
const isImpact = computed(() => config.value.key === 'card-impact')

const parsed = computed(() =>
  props.cardItems
    .filter(item => isImpact.value || item.archetypeCount > 1)
    .sort((a, b) => b.totalDecksIncluded - a.totalDecksIncluded)
    .slice(0, topN.value)
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
    xLabel: t('chart.cardQuad.xLabel'),
    yLabel: config.value.yLabel,
    xScale: 'sqrt',
    xRef: median(parsed.value.map(c => c.totalDecksIncluded)),
    yRef: isImpact.value ? 0 : median(ys),
    xRefLabel: t('chart.cardQuad.median'),
    yRefLabel: isImpact.value ? t('chart.cardQuad.archetypeAvg') : t('chart.cardQuad.median'),
    yFormat: isImpact.value ? v => (v > 0 ? `+${trim(v)}` : trim(v)) : undefined,
    quadrants: config.value.quadrants,
  }
})

const points = computed(() => {
  const y = yKey.value
  const ref = axes.value.yRef ?? 0
  const byDecks = [...parsed.value].sort((a, b) => b.totalDecksIncluded - a.totalDecksIncluded)
  const byOutlier = [...parsed.value].sort((a, b) => Math.abs(b[y] - ref) - Math.abs(a[y] - ref))
  // Candidates only: names that would overlap a bubble or another name are
  // dropped when the chart places them. Desktop offers every card; phones only
  // the most played and the outliers
  const labeled = new Set(
    (isMobile.value ? [...byDecks.slice(0, 4), ...byOutlier.slice(0, 3)] : parsed.value).map(
      c => c.cardId,
    ),
  )
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
  const scope = props.cardTypeChart
    ? t('chart.cardQuad.scopeType', { n: topN.value, type: cardTypeName(props.cardTypeChart) })
    : t('chart.cardQuad.scope', { n: topN.value })
  return t(`chart.cardQuad.${config.value.i18n}.note`, { scope })
})

function tooltip(c) {
  const sign = c.lift > 0 ? '+' : ''
  return {
    title: c.name,
    subtitle: `${c.cardId} · ${cardTypeName(c.type)}`,
    dots: [COLOR_HEX[c.color] ?? '#718096'],
    rows: [
      { label: t('chart.cardQuad.decks'), value: c.totalDecksIncluded },
      { label: t('chart.cardQuad.winnerDecks'), value: c.totalWinnerDecks },
      {
        label: t('chart.cardQuad.winnerRate'),
        value: `${c.winnerRate.toFixed(1)}%`,
        note:
          Math.abs(c.winnerRate - c.expectedRate) >= NOTE_MIN_RATE_DIFF
            ? t('chart.cardQuad.archRate', { value: c.expectedRate.toFixed(1) })
            : null,
      },
      {
        label: t('chart.cardQuad.lift'),
        value: t('chart.cardQuad.pp', { value: `${sign}${c.lift.toFixed(1)}` }),
      },
      {
        label: t('chart.cardQuad.archetypes'),
        value: c.archetypeCount,
        note:
          c.archetypeCount - c.spread >= NOTE_MIN_ARCH_DIFF
            ? t('chart.cardQuad.effective', { value: c.spread })
            : null,
      },
    ],
  }
}

function trim(v) {
  return String(+v.toFixed(1))
}
</script>
