<template>
  <div
    v-if="chartSlices.length"
    class="flex flex-col items-center justify-center gap-3 md:flex-row md:gap-4"
  >
    <svg :viewBox="VIEWBOX" class="h-72 w-72 shrink-0 md:h-[26rem] md:w-[26rem]">
      <defs>
        <clipPath v-for="(s, i) in chartSlices" :id="`${uid}-clip-${i}`" :key="`clip-${i}`">
          <path :d="s.path" />
        </clipPath>
      </defs>
      <g
        v-for="(s, i) in chartSlices"
        :key="i"
        class="cursor-pointer"
        :opacity="hovered === null || hovered === i ? 1 : 0.55"
        @mouseenter="hovered = i"
        @mouseleave="hovered = null"
      >
        <path :d="s.path" :fill="s.color" />
        <image
          v-if="s.showImage"
          :href="s.img.url"
          :x="s.img.x"
          :y="s.img.y"
          :width="s.img.size"
          :height="s.img.size"
          :clip-path="`url(#${uid}-clip-${i})`"
          preserveAspectRatio="xMidYMid slice"
        />
        <path
          :d="s.path"
          fill="none"
          class="stroke-white dark:stroke-nalika-surface"
          stroke-width="2"
          stroke-linejoin="round"
        />
      </g>
      <!-- Each slice carries its own colors and share, so it reads without the legend -->
      <g v-for="(l, i) in sliceLabels" :key="`label-${i}`" class="pointer-events-none">
        <rect
          :x="l.x - l.w / 2"
          :y="l.y - 8"
          :width="l.w"
          height="16"
          rx="8"
          fill="#000"
          fill-opacity="0.65"
        />
        <circle
          v-for="(hex, di) in l.dots"
          :key="di"
          :cx="l.x - l.w / 2 + 8 + di * 8"
          :cy="l.y"
          r="3"
          :fill="hex"
          stroke="#fff"
          stroke-width="0.75"
        />
        <text
          :x="l.x + l.w / 2 - 6"
          :y="l.y"
          text-anchor="end"
          dominant-baseline="central"
          fill="#fff"
          font-size="9"
          font-weight="700"
          class="font-mono"
        >
          {{ l.text }}
        </text>
      </g>
    </svg>
    <div class="w-full max-w-80 min-w-0 space-y-1 md:max-w-xs">
      <div
        v-for="(s, i) in chartSlices"
        :key="i"
        class="flex cursor-pointer items-center gap-2 rounded px-1.5 py-0.5 text-xs transition-colors"
        :class="hovered === i ? 'bg-gray-100 dark:bg-gray-800' : ''"
        @mouseenter="hovered = i"
        @mouseleave="hovered = null"
      >
        <span class="flex shrink-0 gap-0.5">
          <span
            v-for="(c, ci) in s.label === 'Other' ? ['Other'] : s.label.split('+')"
            :key="ci"
            class="inline-block h-2.5 w-2.5 rounded-full"
            :style="{ background: COLOR_HEX[c] || '#9ca3af' }"
          />
        </span>
        <span class="truncate text-gray-700 dark:text-gray-300">{{ comboName(s.label) }}</span>
        <span
          class="ml-auto shrink-0 text-right font-mono text-gray-500 tabular-nums dark:text-gray-400"
        >
          {{ s.decks }} ({{ s.pct }}%)
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  rows: { type: Array, required: true },
  seriesDecks: { type: Number, default: null },
  colorComboData: { type: Array, default: null },
})

const CX = 120
const CY = 120
const OUTER_R = 100
// Image pixels per viewBox unit: the chart is up to 26rem (416px) wide for a
// ~204-unit viewBox, times 2 for high-density screens
const PX_PER_UNIT = 4
// Crop the viewBox to the circle (plus room for the stroke) so the pie fills its box
const VIEWBOX = `${CX - OUTER_R - 2} ${CY - OUTER_R - 2} ${OUTER_R * 2 + 4} ${OUTER_R * 2 + 4}`
const uid = `pie-${Math.random().toString(36).slice(2, 8)}`
const hovered = ref(null)

const { t } = useI18n()

// "Red+White" → "紅+白" in Chinese; 'Other' is the bucket for the rest
const comboName = label =>
  label === 'Other' ? t('chart.other') : label.split('+').map(colorName).join('+')

function polarToCartesian(r, angle) {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
}

function slicePath(startAngle, endAngle) {
  const start = polarToCartesian(OUTER_R, startAngle)
  const end = polarToCartesian(OUTER_R, endAngle)
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
  return [
    `M ${CX} ${CY}`,
    `L ${start.x} ${start.y}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

// A slice's card art: a square crop around the unit's face (see cardFace).
// The square is a little bigger than the slice so it can shift, and slides as
// close as it can to putting the face at the slice's visual centre while still
// covering the whole slice. A face near the edge of its crop ends up off-centre
// rather than the art being blown up. Fetched at its display size
const FACE_R = 0.45
// Image size as a multiple of the slice's bounding box: the smallest that lands
// the face inside the slice wins, so the art is only enlarged when it must be
const SLACKS = [1.3, 1.5, 1.8]
function sliceImage(cardId, startAngle, endAngle) {
  const points = [
    { x: CX, y: CY },
    polarToCartesian(OUTER_R, startAngle),
    polarToCartesian(OUTER_R, endAngle),
  ]
  // The arc bulges out to the circle's edge wherever it passes a right angle
  for (let k = Math.ceil(startAngle / (Math.PI / 2)); k * (Math.PI / 2) <= endAngle; k++) {
    points.push(polarToCartesian(OUTER_R, k * (Math.PI / 2)))
  }
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const box = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
  const boxSize = Math.max(box.x1 - box.x0, box.y1 - box.y0)
  // Where the face is in the crop (0–1), and where it should go in the slice
  const { u, v } = cardFace(cardId, 0)
  const target = polarToCartesian(OUTER_R * FACE_R, (startAngle + endAngle) / 2)
  // Is a point inside the slice, clear of the rim?
  const inSlice = ({ x, y }) => {
    if (Math.hypot(x - CX, y - CY) > OUTER_R * 0.85) {
      return false
    }
    let angle = Math.atan2(y - CY, x - CX)
    while (angle < startAngle) {
      angle += 2 * Math.PI
    }
    return angle <= endAngle
  }
  // Put the face on the target, then pull the square back until it covers the slice
  const place = size => {
    const fit = (want, lo, hi) => Math.min(lo, Math.max(hi - size, want))
    const x = fit(target.x - u * size, box.x0, box.x1)
    const y = fit(target.y - v * size, box.y0, box.y1)
    return { x, y, size, face: { x: x + u * size, y: y + v * size } }
  }
  const spots = SLACKS.map(k => place(boxSize * k))
  const { x, y, size } = spots.find(p => inSlice(p.face)) ?? spots.at(-1)
  const px = Math.min(800, Math.ceil((size * PX_PER_UNIT) / 50) * 50)
  return { x, y, size, url: cardFace(cardId, px).url }
}

const totalDecks = computed(() => props.rows.reduce((s, r) => s + r.decks, 0))

const grouped = computed(() => {
  if (props.colorComboData) {
    const top = props.colorComboData.slice(0, 5)
    const restDecks = props.colorComboData.slice(5).reduce((s, g) => s + g.decks, 0)
    if (restDecks > 0) {
      top.push({ colors: 'Other', decks: restDecks, sigCardIds: null })
    }
    return top
  }

  const groups = {}
  for (const row of props.rows) {
    const key = row.colors
    if (!groups[key]) {
      groups[key] = { colors: key, decks: 0, topRow: row }
    }
    const g = groups[key]
    g.decks += row.decks
    if (row.score > (g.topRow?.score ?? 0)) {
      g.topRow = row
    }
  }
  const sorted = Object.values(groups).sort((a, b) => b.decks - a.decks)
  const top = sorted.slice(0, 5)
  const restDecks = sorted.slice(5).reduce((s, g) => s + g.decks, 0)

  const unassigned = Math.max(0, (props.seriesDecks ?? totalDecks.value) - totalDecks.value)
  const otherDecks = restDecks + unassigned
  if (otherDecks > 0) {
    top.push({ colors: 'Other', decks: otherDecks, topRow: null })
  }
  return top
})

const chartSlices = computed(() => {
  const total = props.seriesDecks ?? totalDecks.value
  if (!total) {
    return []
  }
  const MIN_SWEEP = 0.05
  let currentAngle = -Math.PI / 2
  const usedSigIds = new Set()
  const slices = grouped.value.map(g => {
    const sweep = (g.decks / total) * 2 * Math.PI
    const endAngle = currentAngle + sweep
    const path = slicePath(currentAngle, endAngle)
    const isOther = g.colors === 'Other'
    const firstColor = isOther ? null : g.colors.split('+')[0]
    const color = firstColor ? COLOR_HEX[firstColor] || '#9ca3af' : '#9ca3af'
    const pct = ((g.decks / total) * 100).toFixed(1)
    let img = null
    let sigCardId
    if (isOther) {
      sigCardId = 'EXRP-002'
    } else if (g.sigCardIds?.length) {
      sigCardId = g.sigCardIds.find(id => !usedSigIds.has(id)) ?? g.sigCardIds[0] ?? null
    } else {
      const sigIds = g.topRow?.sigCardIds ?? []
      sigCardId = sigIds.find(id => !usedSigIds.has(id)) ?? sigIds[0] ?? null
    }
    if (sigCardId) {
      usedSigIds.add(sigCardId)
    }
    if (sigCardId) {
      img = sliceImage(sigCardId, currentAngle, endAngle)
    }
    const slice = {
      path,
      color,
      img,
      label: g.colors,
      decks: g.decks,
      pct,
      startAngle: currentAngle,
      endAngle,
      showImage: !!img && sweep > MIN_SWEEP,
      sigCardId,
    }
    currentAngle = endAngle
    return slice
  })
  return slices
})

const sliceLabels = computed(() =>
  chartSlices.value
    .filter(s => s.endAngle - s.startAngle > 0.3)
    .map(s => {
      const mid = (s.startAngle + s.endAngle) / 2
      const pos = polarToCartesian(OUTER_R * 0.68, mid)
      const colors = s.label === 'Other' ? [] : s.label.split('+')
      const pct = Math.round(s.pct)
      const text = s.label === 'Other' ? t('chart.pie.other', { pct }) : `${pct}%`
      // pill: padding + 8 per dot + ~5.5 per Latin glyph (~9 per CJK one) at font-size 9
      const textW = [...text].reduce((n, ch) => n + (ch.charCodeAt(0) > 0x2e80 ? 9 : 5.5), 0)
      const w = 12 + colors.length * 8 + textW
      return {
        x: pos.x,
        y: pos.y,
        w,
        text,
        dots: colors.map(c => COLOR_HEX[c] || '#9ca3af'),
      }
    }),
)
</script>
