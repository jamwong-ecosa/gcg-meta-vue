<template>
  <div ref="root" class="w-full">
    <div class="mb-2 max-w-full overflow-x-auto">
      <UiMetaTabGroup v-model="mode" :options="modeOptions" />
    </div>
    <p v-if="note" class="mb-1 text-xxs tracking-wider text-gray-400 dark:text-nalika-text-muted">
      {{ note }}
    </p>
    <p v-if="!points.length" class="py-4 text-center text-xs text-gray-400 dark:text-gray-500">
      No data
    </p>
    <VueApexCharts
      v-else
      :key="`${chartKey}-${mode}-${renderKey}`"
      type="bubble"
      :height="chartHeight"
      width="100%"
      :options="chartOptions"
      :series="chartSeries"
    />
  </div>
</template>

<script setup>
import { useElementSize, useWindowSize } from '@vueuse/core'

// Core build plus only what these charts use, instead of ApexCharts' full default bundle
import 'apexcharts/bubble'
import 'apexcharts/features/annotations'
import VueApexCharts from 'vue3-apexcharts/core'

// Generic quadrant bubble chart. The parent owns the metrics; this component
// owns layout: √ x-axis for skewed counts, nice ticks, reference lines,
// corner quadrant labels and names next to the highlighted bubbles.
const mode = defineModel('mode', { type: String, required: true })

const props = defineProps({
  modes: { type: Array, required: true },
  // Current mode's axes: { xLabel, yLabel, xScale: 'sqrt' | 'linear', xRef, yRef,
  //   xRefLabel, yRefLabel, quadrants: [topRight, topLeft, bottomLeft, bottomRight],
  //   xFormat, yFormat, yMin }
  axes: { type: Object, required: true },
  // [{ x, y, size, group, label?, meta }] — size is any positive weight, label marks a named bubble
  points: { type: Array, default: () => [] },
  // [{ name, color, colorDark?, stroke? }] in draw order
  groups: { type: Array, required: true },
  tooltip: { type: Function, required: true },
  note: { type: String, default: '' },
  chartKey: { type: String, default: '' },
})

const modeOptions = computed(() => props.modes.map(m => ({ value: m.key, label: m.label })))

const { width: winWidth } = useWindowSize()
const isMobile = computed(() => winWidth.value < 640)
const chartHeight = computed(() => (isMobile.value ? 350 : 500))
const radiusRange = computed(() => (isMobile.value ? { min: 3, max: 11 } : { min: 5, max: 18 }))

const root = useTemplateRef('root')
const { width: rootWidth } = useElementSize(root)

const renderKey = ref(0)
watch(
  () => props.points,
  val => {
    if (val.length > 0) {
      renderKey.value++
    }
  },
)

const isSqrt = computed(() => props.axes.xScale === 'sqrt')
const toPlotX = v => (isSqrt.value ? Math.sqrt(Math.max(v, 0)) : v)
const fromPlotX = v => (isSqrt.value ? v * v : v)

const xRange = computed(() => {
  const xs = props.points.map(p => toPlotX(p.x))
  return niceRange(Math.min(...xs), Math.max(...xs), { integerSteps: isSqrt.value })
})

const yRange = computed(() => {
  const ys = props.points.map(p => p.y)
  return niceRange(props.axes.yMin ?? Math.min(...ys), Math.max(...ys))
})

// Bubble area ∝ size, so radius ∝ √size
const maxSize = computed(() => Math.max(...props.points.map(p => p.size), 1))
const radiusOf = size => {
  const { min, max } = radiusRange.value
  return min + (max - min) * Math.sqrt(Math.max(size, 0) / maxSize.value)
}

const chartSeries = computed(() =>
  props.groups
    .map(g => ({
      name: g.name,
      data: props.points
        .filter(p => p.group === g.name)
        .map(p => ({ x: toPlotX(p.x), y: p.y, z: radiusOf(p.size), meta: p.meta })),
    }))
    .filter(s => s.data.length),
)

const presentGroups = computed(() => {
  const present = new Set(chartSeries.value.map(s => s.name))
  return props.groups.filter(g => present.has(g.name))
})

const chartOptions = computed(() => {
  const ax = props.axes
  const dark = isDark.value
  const textColor = dark ? '#9ca3af' : '#999'
  const gridColor = dark ? '#374151' : '#e5e7eb'
  const annotColor = dark ? '#6b7280' : '#aaa'
  const quadColor = dark ? '#6b7280' : '#bbb'
  const nameColor = dark ? '#d1d5db' : '#555'
  const fontFamily = "'Roboto Mono', 'Noto Sans TC', monospace"
  const xFmt = ax.xFormat ?? trimNum
  const yFmt = ax.yFormat ?? trimNum
  const xr = xRange.value
  const yr = yRange.value

  const axisStyle = { fontSize: '12px', fontFamily, cssClass: 'tracking-wider' }

  const quadLabel = (x, y, text, anchor, offsetY) => ({
    x,
    y,
    marker: { size: 0 },
    label: {
      text,
      borderWidth: 0,
      textAnchor: anchor,
      offsetX: anchor === 'start' ? 6 : -6,
      offsetY,
      style: {
        background: 'transparent',
        color: quadColor,
        fontSize: '11px',
        fontWeight: 'bold',
        fontFamily,
        cssClass: 'tracking-wider pointer-events-none',
      },
    },
  })

  const [tr, tl, bl, br] = ax.quadrants ?? []
  const quadrantLabels = ax.quadrants
    ? [
        quadLabel(xr.min, yr.max, tl, 'start', 18),
        quadLabel(xr.max, yr.max, tr, 'end', 18),
        quadLabel(xr.min, yr.min, bl, 'start', -4),
        quadLabel(xr.max, yr.min, br, 'end', -4),
      ]
    : []

  const fontSize = isMobile.value ? 9 : 10
  const nameLabels = placeNames(xr, yr, fontSize).map(({ p, offsetY }) => ({
    x: toPlotX(p.x),
    y: p.y,
    marker: { size: 0 },
    label: {
      text: p.label,
      borderWidth: 0,
      textAnchor: 'middle',
      offsetY,
      style: {
        background: 'transparent',
        color: nameColor,
        fontSize: `${fontSize}px`,
        fontFamily,
        cssClass: 'pointer-events-none',
      },
    },
  }))

  const refLine = (value, text, axis) => ({
    [axis]: value,
    strokeDashArray: 4,
    borderColor: annotColor,
    borderWidth: 1,
    label: text
      ? {
          text,
          borderWidth: 0,
          ...(axis === 'x'
            ? { orientation: 'horizontal', position: 'top', textAnchor: 'start', offsetX: 4 }
            : { position: 'right', textAnchor: 'end', offsetY: -2 }),
          style: {
            background: 'transparent',
            color: annotColor,
            fontSize: '10px',
            fontFamily,
            cssClass: 'pointer-events-none',
          },
        }
      : undefined,
  })

  return {
    theme: { mode: dark ? 'dark' : 'light' },
    chart: {
      type: 'bubble',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: presentGroups.value.map(g => (dark && g.colorDark) || g.color),
    fill: { opacity: 0.8 },
    dataLabels: { enabled: false },
    // z is already the pixel radius
    plotOptions: { bubble: { zScaling: false } },
    markers: {
      strokeColors: presentGroups.value.map(g => g.stroke ?? (dark ? '#111827' : '#fff')),
      strokeWidth: 1,
    },
    xaxis: {
      type: 'numeric',
      min: xr.min,
      max: xr.max,
      tickAmount: xr.tickAmount,
      title: { text: ax.xLabel, style: { ...axisStyle, color: textColor } },
      labels: {
        formatter: v => xFmt(fromPlotX(Number(v))),
        style: { ...axisStyle, colors: textColor },
      },
      tooltip: { enabled: false },
    },
    yaxis: {
      min: yr.min,
      max: yr.max,
      tickAmount: yr.tickAmount,
      title: { text: ax.yLabel, style: { ...axisStyle, color: textColor } },
      labels: {
        formatter: v => yFmt(Number(v)),
        style: { ...axisStyle, colors: textColor },
      },
    },
    tooltip: {
      custom({ seriesIndex, dataPointIndex, w }) {
        const d = w.config.series[seriesIndex].data[dataPointIndex]
        return `<div class="${tw`max-w-60 truncate px-1.5 py-0.5 text-xxs leading-snug break-words sm:max-w-72 sm:px-2 sm:py-1 sm:text-xs`}">${props.tooltip(d.meta)}</div>`
      },
    },
    annotations: {
      position: 'back',
      xaxis: ax.xRef != null ? [refLine(toPlotX(ax.xRef), ax.xRefLabel, 'x')] : [],
      yaxis: ax.yRef != null ? [refLine(ax.yRef, ax.yRefLabel, 'y')] : [],
      points: [...quadrantLabels, ...nameLabels],
    },
    grid: { borderColor: gridColor },
    legend: { show: false },
  }
})

// Greedy name placement in approximate pixel space: biggest bubbles first, each
// name goes above its bubble, else below, else is dropped (the tooltip still has it)
function placeNames(xr, yr, fontSize) {
  // Rough plot area inside ApexCharts' axis titles and tick labels
  const plotW = Math.max(rootWidth.value - 80, 100)
  const plotH = chartHeight.value - 80
  const toPx = p => ({
    cx: ((toPlotX(p.x) - xr.min) / (xr.max - xr.min)) * plotW,
    cy: ((yr.max - p.y) / (yr.max - yr.min)) * plotH,
  })
  // CJK glyphs are about 1em wide, Latin about 0.6em
  const textWidth = text =>
    [...text].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e80 ? 1 : 0.6) * fontSize, 0)
  const h = fontSize + 3
  const placed = []
  const overlaps = box => placed.some(b => box.l < b.r && box.r > b.l && box.t < b.b && box.b > b.t)

  return props.points
    .filter(p => p.label)
    .sort((a, b) => b.size - a.size)
    .flatMap(p => {
      const { cx, cy } = toPx(p)
      const r = radiusOf(p.size)
      const w = textWidth(p.label)
      // offsetY = -r + 4 puts the text just above the bubble (ApexCharts draws
      // point labels above their anchor); r + h + 6 drops it just below
      const candidates = [
        { offsetY: -r + 4, t: cy - r - h, b: cy - r },
        { offsetY: r + h + 6, t: cy + r + 2, b: cy + r + 2 + h },
      ]
      const spot = candidates
        .map(c => ({ ...c, l: cx - w / 2, r: cx + w / 2 }))
        .find(c => c.t >= 0 && c.b <= plotH && !overlaps(c))
      if (!spot) {
        return []
      }
      placed.push(spot)
      return [{ p, offsetY: spot.offsetY }]
    })
}

// Axis bounds on a 1/2/5 step so ticks read 0, 10, 20… instead of 0, 12, 23…
// A little headroom keeps edge bubbles from being clipped.
// Positive data that starts near 0 keeps a 0 baseline; data clustered far from 0
// (e.g. cards all in 400–1300 decks) gets a tight range instead of empty space.
function niceRange(lo, hi, { maxTicks = 6, integerSteps = false } = {}) {
  if (lo >= 0 && lo < hi * 0.25) {
    lo = 0
  }
  if (hi <= lo) {
    hi = lo + 1
  }
  const pad = (hi - lo) * 0.06
  const padLo = lo === 0 ? 0 : lo - pad
  const padHi = hi + pad
  const raw = (padHi - padLo) / maxTicks
  const mag = 10 ** Math.floor(Math.log10(raw))
  let step = [1, 2, 5, 10].map(m => m * mag).find(s => s >= raw)
  if (integerSteps) {
    // √ axis: integer steps square to whole-number labels (0, 1, 4, 9…)
    step = Math.max(1, Math.round(step))
  }
  const min = Math.floor(padLo / step) * step
  const max = Math.ceil(padHi / step) * step
  return { min, max, tickAmount: Math.round((max - min) / step) }
}

function trimNum(v) {
  return Number.isInteger(v) ? String(v) : String(+v.toFixed(1))
}
</script>
