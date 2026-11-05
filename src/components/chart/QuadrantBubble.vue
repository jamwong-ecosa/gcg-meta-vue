<template>
  <!-- Annotation labels get an invisible background rect that would swallow bubble hovers -->
  <div ref="root" class="w-full [&_.apexcharts-point-annotations]:pointer-events-none">
    <!-- Parent filters (e.g. card type) share the mode tabs' row from sm up -->
    <div class="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <div v-if="$slots.controls" class="max-w-full overflow-x-auto">
        <slot name="controls" />
      </div>
      <div class="max-w-full overflow-x-auto">
        <UiMetaTabGroup v-model="mode" :options="modeOptions" />
      </div>
    </div>
    <p v-if="note" class="mb-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
      {{ note }}
    </p>
    <p v-if="!points.length" class="py-4 text-center text-xs text-gray-400 dark:text-gray-500">
      {{ $t('chart.noData') }}
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
  // meta → { title, subtitle?, dots?: [hex], badge?: { text, color }, rows: [{ label, value, note? }] }
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

// Quadrant tints in [topRight, topLeft, bottomLeft, bottomRight] order: the good
// corner green, the under-rated corner blue, the over-rated corner red
const QUAD_TINTS = ['#22c55e', '#3b82f6', null, '#ef4444']
const QUAD_TEXT = ['#15803d', '#1d4ed8', '#9ca3af', '#b91c1c']
const QUAD_TEXT_DARK = ['#4ade80', '#60a5fa', '#6b7280', '#f87171']

// ApexCharts has no rectangle annotation, so the tints are drawn straight into
// the plot group, behind the grid, after every render
function shadeQuadrants(ctx) {
  const ax = props.axes
  const plot = ctx.el.querySelector('.apexcharts-graphical')
  if (!plot) {
    return
  }
  plot.querySelector('.quad-shade')?.remove()
  if (!ax.quadrants || ax.xRef == null || ax.yRef == null) {
    return
  }
  const { gridWidth: w, gridHeight: h } = ctx.w.globals
  const xr = xRange.value
  const yr = yRange.value
  const clamp = v => Math.min(Math.max(v, 0), 1)
  const fx = clamp((toPlotX(ax.xRef) - xr.min) / (xr.max - xr.min)) * w
  const fy = clamp((yr.max - ax.yRef) / (yr.max - yr.min)) * h
  const rects = [
    [fx, 0, w - fx, fy],
    [0, 0, fx, fy],
    [0, fy, fx, h - fy],
    [fx, fy, w - fx, h - fy],
  ]
  const ns = 'http://www.w3.org/2000/svg'
  const group = document.createElementNS(ns, 'g')
  group.setAttribute('class', 'quad-shade')
  group.setAttribute('pointer-events', 'none')
  rects.forEach(([x, y, rw, rh], i) => {
    if (!QUAD_TINTS[i] || rw <= 0 || rh <= 0) {
      return
    }
    const rect = document.createElementNS(ns, 'rect')
    Object.entries({ x, y, width: rw, height: rh, fill: QUAD_TINTS[i] }).forEach(([k, v]) =>
      rect.setAttribute(k, v),
    )
    rect.setAttribute('fill-opacity', isDark.value ? 0.09 : 0.07)
    group.append(rect)
  })
  plot.insertBefore(group, plot.firstChild)
}

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
  const quadColors = dark ? QUAD_TEXT_DARK : QUAD_TEXT
  const nameColor = dark ? '#d1d5db' : '#555'
  const fontFamily = "'Roboto Mono', 'Noto Sans TC', monospace"
  const xFmt = ax.xFormat ?? trimNum
  const yFmt = ax.yFormat ?? trimNum
  const xr = xRange.value
  const yr = yRange.value

  const axisStyle = { fontSize: '12px', fontFamily, cssClass: 'tracking-wider' }

  const quadLabel = (x, y, text, anchor, offsetY, color) => ({
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
        color,
        fontSize: '12px',
        fontWeight: 'bold',
        fontFamily,
        cssClass: 'tracking-wider pointer-events-none',
      },
    },
  })

  const [tr, tl, bl, br] = ax.quadrants ?? []
  // ApexCharts drops a point annotation it computes as past the grid edge, and an
  // anchor exactly on an axis bound can round a hair past it (e.g. y = +2 on a
  // −2…+2 axis), so the corner labels sit a tiny step inside the range
  const ex = (xr.max - xr.min) * 1e-4
  const ey = (yr.max - yr.min) * 1e-4
  const quadrantLabels = ax.quadrants
    ? [
        quadLabel(xr.min + ex, yr.max - ey, tl, 'start', 18, quadColors[1]),
        quadLabel(xr.max - ex, yr.max - ey, tr, 'end', 18, quadColors[0]),
        quadLabel(xr.min + ex, yr.min + ey, bl, 'start', -4, quadColors[2]),
        quadLabel(xr.max - ex, yr.min + ey, br, 'end', -4, quadColors[3]),
      ]
    : []

  const fontSize = isMobile.value ? 9 : 10
  const nameLabels = placeNames(xr, yr, fontSize).map(({ p, anchor, offsetX, offsetY }) => ({
    x: toPlotX(p.x),
    y: p.y,
    marker: { size: 0 },
    label: {
      text: p.label,
      borderWidth: 0,
      textAnchor: anchor,
      offsetX,
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
      events: { mounted: shadeQuadrants, updated: shadeQuadrants },
    },
    colors: presentGroups.value.map(g => (dark && g.colorDark) || g.color),
    fill: { opacity: 0.85 },
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
        return renderTooltip(props.tooltip(d.meta))
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

function renderTooltip({ title, subtitle, dots = [], badge, rows = [] }) {
  const badgeHtml = badge
    ? `<span class="${tw`shrink-0 rounded px-1.5 font-mono text-xxs leading-4 font-bold text-gray-900`}" style="background:${badge.color}">${esc(badge.text)}</span>`
    : ''
  const dotsHtml = dots
    .map(
      hex => `<span class="${tw`h-2 w-2 shrink-0 rounded-full`}" style="background:${hex}"></span>`,
    )
    .join('')
  const subtitleHtml =
    subtitle || dots.length
      ? `<div class="${tw`mt-1 flex items-center gap-1 text-xxs text-gray-500 dark:text-gray-400`}">${dotsHtml}<span class="${tw`ml-0.5`}">${esc(subtitle ?? '')}</span></div>`
      : ''
  const rowsHtml = rows
    .map(
      row =>
        `<dt class="${tw`text-gray-500 dark:text-gray-400`}">${esc(row.label)}</dt>` +
        `<dd class="${tw`text-right font-mono font-semibold text-gray-800 tabular-nums dark:text-gray-100`}">${esc(row.value)}` +
        (row.note
          ? `<span class="${tw`ml-1 font-normal text-gray-400 dark:text-gray-500`}">${esc(row.note)}</span>`
          : '') +
        '</dd>',
    )
    .join('')
  return `<div class="${tw`w-56 px-3 py-2 text-xs leading-snug sm:w-64`}">
    <div class="${tw`flex items-start gap-2`}">
      <div class="${tw`min-w-0 flex-1 font-semibold break-words whitespace-normal text-gray-800 dark:text-gray-100`}">${esc(title)}</div>
      ${badgeHtml}
    </div>
    ${subtitleHtml}
    <dl class="${tw`mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 border-t border-gray-200 pt-2 dark:border-gray-700`}">${rowsHtml}</dl>
  </div>`
}

function esc(v) {
  return String(v).replace(
    /[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  )
}

// Greedy name placement in approximate pixel space: biggest bubbles first, each
// name tries above, below, right, then left of its bubble and takes the first
// spot clear of every bubble and every placed name; with none free it is dropped
// (the tooltip still has it)
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
  const gap = 3

  const bubbles = props.points.map(p => {
    const { cx, cy } = toPx(p)
    const r = radiusOf(p.size)
    return { l: cx - r, r: cx + r, t: cy - r, b: cy + r }
  })
  const placed = []
  const hits = box => b => box.l < b.r && box.r > b.l && box.t < b.b && box.b > b.t
  const isFree = box =>
    box.t >= 0 &&
    box.b <= plotH &&
    box.l >= 0 &&
    box.r <= plotW &&
    !placed.some(hits(box)) &&
    !bubbles.some(hits(box))

  return props.points
    .filter(p => p.label)
    .sort((a, b) => b.size - a.size)
    .flatMap(p => {
      const { cx, cy } = toPx(p)
      const r = radiusOf(p.size)
      const w = textWidth(p.label)
      // ApexCharts draws a point label with its bottom ~4px above the anchor
      // plus offsetY, so offsetY = -r + 4 sits the text right on the bubble's top
      const candidates = [
        { anchor: 'middle', offsetX: 0, offsetY: -r + 4, l: cx - w / 2, t: cy - r - h },
        { anchor: 'middle', offsetX: 0, offsetY: r + h + 6, l: cx - w / 2, t: cy + r + gap },
        { anchor: 'start', offsetX: r + gap, offsetY: h / 2 + 4, l: cx + r + gap, t: cy - h / 2 },
        {
          anchor: 'end',
          offsetX: -r - gap,
          offsetY: h / 2 + 4,
          l: cx - r - gap - w,
          t: cy - h / 2,
        },
      ].map(c => ({ ...c, r: c.l + w, b: c.t + h }))
      const spot = candidates.find(isFree)
      if (!spot) {
        return []
      }
      placed.push(spot)
      return [{ p, ...spot }]
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
