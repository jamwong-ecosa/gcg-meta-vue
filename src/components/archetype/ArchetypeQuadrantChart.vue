<template>
  <div class="w-full">
    <div
      class="mb-2 flex max-w-full flex-nowrap gap-1 overflow-x-auto rounded-lg bg-gray-100 p-0.5 xl:w-fit dark:bg-gray-700/70"
    >
      <button
        v-for="mode in MODES"
        :key="mode.key"
        class="rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors"
        :class="
          chartMode === mode.key
            ? 'bg-white text-sumi shadow-xs dark:bg-nalika-surface dark:text-nalika-text'
            : 'text-gray-500 hover:text-sumi dark:text-nalika-text-muted dark:hover:text-nalika-text'
        "
        @click="chartMode = mode.key"
      >
        {{ mode.label }}
      </button>
    </div>
    <p v-if="!items.length" class="py-4 text-center text-xs text-gray-400 dark:text-gray-500">
      No data
    </p>
    <VueApexCharts
      v-else
      :key="`${chartMode}-${renderKey}`"
      type="bubble"
      :height="chartHeight"
      width="100%"
      :options="chartOptions"
      :series="chartSeries"
    />
  </div>
</template>

<script setup>
import { useStorage, useWindowSize } from '@vueuse/core'

import VueApexCharts from 'vue3-apexcharts'

const props = defineProps({
  items: { type: Array, default: () => [] },
})

const TIER_ORDER = ['T1', 'T1.5', 'T2', 'T2.5', 'T3', '--']
const TIER_COLORS = ['#fca5a5', '#fdba74', '#fbbf24', '#86efac', '#93c5fd', '#d1d5db']
const TIER_COLORS_DARK = ['#c53030', '#dd6b20', '#d69e2e', '#2f855a', '#2b6cb0', '#4b5563']

const MODES = [
  {
    key: 'usage-winEv',
    label: 'Usage - Win.Ev',
    xKey: 'usePct',
    yKey: 'winPerEv',
    xLabel: 'Usage Rate (%)',
    yLabel: 'Win Rate / Event (%)',
    xIsPercent: true,
    yIsPercent: true,
    minWins: 3,
  },
  {
    key: 'usage-winDk',
    label: 'Usage - Win.Dk',
    xKey: 'usePct',
    yKey: 'winPerDk',
    xLabel: 'Usage Rate (%)',
    yLabel: 'Win Rate / Deck (%)',
    xIsPercent: true,
    yIsPercent: true,
  },
  {
    key: 'usage-t4',
    label: 'Usage - Top4',
    xKey: 'usePct',
    yKey: 't4PerDk',
    xLabel: 'Usage Rate (%)',
    yLabel: 'Top 4 / Deck (%)',
    xIsPercent: true,
    yIsPercent: true,
  },
  {
    key: 'usage-score',
    label: 'Usage - Score',
    xKey: 'usePct',
    yKey: 'score',
    xLabel: 'Usage Rate (%)',
    yLabel: 'Tier Score',
    xIsPercent: true,
    yIsPercent: false,
  },
  {
    key: 'winDk-winEv',
    label: 'Win.Dk - Win.Ev',
    xKey: 'winPerDk',
    yKey: 'winPerEv',
    xLabel: 'Win Rate / Deck (%)',
    yLabel: 'Win Rate / Event (%)',
    xIsPercent: true,
    yIsPercent: true,
    minWins: 3,
  },
]

const chartMode = useStorage('gcg-quadrant-mode', 'usage-winEv')

const config = computed(() => MODES.find(m => m.key === chartMode.value))

const { width: winWidth } = useWindowSize()
const chartHeight = computed(() => (winWidth.value < 640 ? 350 : 500))
const bubbleRadius = computed(() =>
  winWidth.value < 640 ? { min: 4, max: 12 } : { min: 6, max: 24 },
)

const renderKey = ref(0)

const parsed = computed(() => {
  const cfg = config.value
  if (!cfg) {
    return []
  }
  return props.items
    .filter(item => item.decks >= 3 && item.wins >= (cfg.minWins ?? 1))
    .map(item => {
      const x = parseFloat(item[cfg.xKey])
      const v = item[cfg.yKey]
      const y = cfg.yIsPercent ? parseFloat(v) : Number(v)
      if (isNaN(x) || isNaN(y)) {
        return null
      }
      return { ...item, _x: x, _y: y }
    })
    .filter(Boolean)
})

watch(parsed, val => {
  if (val.length > 0) {
    renderKey.value++
  }
})

const medX = computed(() => median(parsed.value.map(d => d._x)))
const medY = computed(() => median(parsed.value.map(d => d._y)))

const xMax = computed(() => {
  const mx = Math.max(...parsed.value.map(d => d._x), 0)
  return mx === 0 ? 1 : Math.ceil(mx * 1.15)
})

const yMax = computed(() => {
  const mx = Math.max(...parsed.value.map(d => d._y), 0)
  return mx === 0 ? 1 : Math.ceil(mx * 1.15)
})

const chartSeries = computed(() => {
  const cfg = config.value
  if (!cfg) {
    return []
  }
  const groups = {}
  for (const item of parsed.value) {
    const group = (groups[item.tier] ??= [])
    group.push({
      x: item._x,
      y: item._y,
      z: item.wins,
      meta: {
        archetype: item.archetype,
        usePct: item.usePct,
        winPerDk: item.winPerDk,
        winPerEv: item.winPerEv,
        t4PerDk: item.t4PerDk,
        decks: item.decks,
        wins: item.wins,
        top4: item.top4,
        score: item.score,
      },
    })
  }
  return TIER_ORDER.filter(t => groups[t]).map(t => ({ name: t, data: groups[t] }))
})

const seriesColors = computed(() => {
  const present = new Set(chartSeries.value.map(s => s.name))
  const base = isDark.value ? TIER_COLORS_DARK : TIER_COLORS
  return TIER_ORDER.filter(t => present.has(t)).map((_, i) => base[i])
})

const chartOptions = computed(() => {
  const cfg = config.value
  if (!cfg) {
    return {}
  }
  const dark = isDark.value
  const textColor = dark ? '#9ca3af' : '#999'
  const gridColor = dark ? '#374151' : '#e5e7eb'
  const annotColor = dark ? '#6b7280' : '#999'
  const labelColor = dark ? '#6b7280' : '#bbb'
  const fontFamily = "'Roboto Mono', 'Noto Sans TC', monospace"

  const fmtX = v => Number(v).toFixed(0)
  const fmtY = v => Number(v).toFixed(0)

  const qLabels = []
  if (medX.value !== null && medY.value !== null) {
    qLabels.push(
      { x: (medX.value + xMax.value) / 2, y: (medY.value + yMax.value) / 2, text: 'Meta' },
      { x: medX.value / 2, y: (medY.value + yMax.value) / 2, text: 'Sleeper' },
      { x: medX.value / 2, y: medY.value / 2, text: 'Niche' },
      { x: (medX.value + xMax.value) / 2, y: medY.value / 2, text: 'Trap' },
    )
  }

  return {
    theme: { mode: dark ? 'dark' : 'light' },
    chart: {
      type: 'bubble',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: seriesColors.value,
    dataLabels: { enabled: false },
    plotOptions: {
      bubble: {
        minBubbleRadius: bubbleRadius.value.min,
        maxBubbleRadius: bubbleRadius.value.max,
      },
    },
    markers: {
      strokeColor: '#fff',
      strokeWidth: 0.5,
    },
    xaxis: {
      min: 0,
      max: xMax.value,
      tickAmount: 5,
      forceNiceScale: true,
      title: {
        text: cfg.xLabel,
        style: { fontSize: '12px', color: textColor, fontFamily, cssClass: 'tracking-wider' },
      },
      labels: {
        formatter: fmtX,
        style: { fontSize: '12px', colors: textColor, fontFamily, cssClass: 'tracking-wider' },
      },
    },
    yaxis: {
      min: 0,
      max: yMax.value,
      tickAmount: 5,
      forceNiceScale: true,
      title: {
        text: cfg.yLabel,
        style: { fontSize: '12px', color: textColor, fontFamily, cssClass: 'tracking-wider' },
      },
      labels: {
        formatter: fmtY,
        style: { fontSize: '12px', colors: textColor, fontFamily, cssClass: 'tracking-wider' },
      },
    },
    tooltip: {
      custom({ seriesIndex, dataPointIndex, w }) {
        const d = w.config.series[seriesIndex].data[dataPointIndex]
        return `<div class="${tw`max-w-60 truncate px-1.5 py-0.5 text-xxs leading-snug break-words sm:max-w-72 sm:px-2 sm:py-1 sm:text-xs`}">
          <b>${d.meta.archetype}</b><br/>
          Use: ${d.meta.usePct}<br/>
          Win/Dk: ${d.meta.winPerDk}<br/>
          Win/Ev: ${d.meta.winPerEv}<br/>
          Top4/Dk: ${d.meta.t4PerDk}<br/>
          Score: ${d.meta.score}<br/>
          Decks: ${d.meta.decks}<br/>
          Wins: ${d.meta.wins}<br/>
          Top4: ${d.meta.top4}
        </div>`
      },
    },
    annotations: {
      position: 'back',
      xaxis:
        medX.value !== null
          ? [{ x: medX.value, strokeDashArray: 4, borderColor: annotColor, borderWidth: 1 }]
          : [],
      yaxis:
        medY.value !== null
          ? [{ y: medY.value, strokeDashArray: 4, borderColor: annotColor, borderWidth: 1 }]
          : [],
      points: qLabels.map(q => ({
        x: q.x,
        y: q.y,
        marker: { size: 0 },
        label: {
          text: q.text,
          borderWidth: 0,
          textAnchor: 'middle',
          offsetX: 0,
          offsetY: 0,
          style: {
            background: 'transparent',
            color: labelColor,
            fontSize: '11px',
            fontWeight: 'bold',
            fontFamily,
            pointerEvents: 'none',
            cssClass: 'tracking-wider',
          },
        },
      })),
    },
    grid: { borderColor: gridColor },
    legend: { show: false },
  }
})

function median(arr) {
  if (!arr.length) {
    return null
  }
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}
</script>
