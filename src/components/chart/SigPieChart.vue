<template>
  <div
    v-if="chartSlices.length"
    class="flex flex-col items-center justify-center gap-3 md:flex-row md:gap-4"
  >
    <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="h-80 w-80 shrink-0 md:h-[28rem] md:w-[28rem]">
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
          :href="s.imgUrl"
          :x="s.imgX"
          :y="s.imgY"
          :width="SIZE * s.imgScale"
          :height="SIZE * s.imgScale"
          :clip-path="`url(#${uid}-clip-${i})`"
          preserveAspectRatio="xMidYMid slice"
        />
        <path :d="s.path" fill="none" stroke="#000" stroke-width="2" />
      </g>
      <g v-for="(dot, i) in colorDots" :key="`dot-${i}`">
        <circle :cx="dot.x" :cy="dot.y" :r="4" :fill="dot.hex" stroke="#000" stroke-width="1" />
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
        <span class="truncate text-gray-700 dark:text-gray-300">{{ s.label }}</span>
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
const SIZE = 240
const IMG_SCALE = 0.8
const uid = `pie-${Math.random().toString(36).slice(2, 8)}`
const hovered = ref(null)

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
    let imgUrl = null
    let imgX = null
    let imgY = null
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
      const midAngle = (currentAngle + endAngle) / 2
      const imageCenterDistance = OUTER_R * 0.35
      const cropShift =
        10 + // baseline — all slices shift at least 10px outward
        20 * (0.5 - 0.5 * Math.cos(midAngle)) + // more shift on left side (cos < 0)
        15 * Math.sin(midAngle) * Math.max(0, Math.cos(midAngle)) // extra for bottom-right
      // Final cropShift values at cardinal directions:
      //   Left=30  Top=20  Right=10  Bottom=20
      //   Bottom-right=44  Bottom-left=36  Top-left=28  Top-right=10
      const extraX =
        -70 * Math.max(0, Math.cos(midAngle)) * Math.max(0, Math.sin(midAngle)) + // bottom-right: shift left
        -80 * Math.max(0, -Math.cos(midAngle)) * Math.max(0, Math.sin(midAngle)) // bottom-left: shift left
      imgX =
        CX +
        (imageCenterDistance + cropShift) * Math.cos(midAngle) -
        SIZE / 2 +
        extraX +
        (SIZE * (1 - IMG_SCALE)) / 2
      const extraY =
        -30 * Math.max(0, Math.cos(midAngle)) * Math.max(0, Math.sin(midAngle)) + // bottom-right: shift up
        25 * Math.max(0, -Math.cos(midAngle)) * Math.max(0, Math.sin(midAngle)) // bottom-left: shift down
      imgY =
        CY +
        (imageCenterDistance + cropShift) * Math.sin(midAngle) -
        SIZE / 2 +
        extraY +
        (SIZE * (1 - IMG_SCALE)) / 2
      imgUrl = `https://jw-assets.imgix.net/gcg-img/${sigCardId}.webp?w=600&fit=crop&ar=3:2&crop=faces,focalpoint&fp-x=0.5&fp-y=0.1&auto=format,compress`
    }
    const slice = {
      path,
      color,
      imgUrl,
      imgX,
      imgY,
      label: g.colors,
      decks: g.decks,
      pct,
      startAngle: currentAngle,
      endAngle,
      showImage: !!imgUrl && sweep > MIN_SWEEP,
      imgScale: IMG_SCALE,
      sigCardId,
    }
    currentAngle = endAngle
    return slice
  })
  return slices
})

const colorDots = computed(() => {
  const dots = []
  const SPACING = 0.12
  const RADIUS = OUTER_R - 8
  const LEFT_GAP = 0.1

  for (const s of chartSlices.value) {
    if (s.label === 'Other') {
      continue
    }
    const colors = s.label.split('+')
    const count = colors.length
    const firstAngle = s.startAngle + LEFT_GAP
    for (let i = 0; i < count; i++) {
      const angle = firstAngle + i * SPACING
      const pos = polarToCartesian(RADIUS, angle)
      const colorName = colors[i]
      dots.push({
        x: pos.x,
        y: pos.y,
        hex: COLOR_HEX[colorName] || '#9ca3af',
      })
    }
  }
  return dots
})
</script>
