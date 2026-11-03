<template>
  <div
    ref="rootRef"
    class="rounded border border-gray-500/10 bg-shironezumi/3 p-3 dark:border-nalika-border dark:bg-nalika-surface"
  >
    <div class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h2
        class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted"
      >
        {{ title }}
      </h2>
      <span class="font-mono text-xs text-gray-500 tabular-nums dark:text-nalika-text-muted">
        avg
        <b class="text-gray-700 dark:text-nalika-text">{{ average }}</b>
      </span>
    </div>

    <!-- Stacked bars: copies an average deck runs at each value, split by type.
         Hover (or tap) a bar for the cards behind it -->
    <div
      class="flex items-end gap-1.5 border-b border-gray-300 sm:gap-3 dark:border-gray-600"
      :style="{ height: `${HEIGHT}px` }"
      @mouseleave="hovered = null"
    >
      <button
        v-for="(bar, i) in bars"
        :key="bar.value"
        class="group relative flex h-full flex-1 cursor-default flex-col items-center justify-end"
        :aria-label="`${title} ${bar.value}: ${bar.total.toFixed(1)} copies`"
        @mouseenter="hovered = bar.value"
        @focus="hovered = bar.value"
        @click="pinned = pinned === bar.value ? null : bar.value"
      >
        <span
          v-if="bar.total >= 0.05"
          class="mb-0.5 font-mono text-xxs text-gray-500 tabular-nums dark:text-nalika-text-muted"
          :class="{ 'font-bold text-gray-800 dark:text-nalika-text': bar.value === active }"
        >
          {{ bar.total.toFixed(1) }}
        </span>
        <div
          class="flex w-full flex-col-reverse overflow-hidden rounded-t transition-opacity"
          :class="active !== null && bar.value !== active ? 'opacity-45' : ''"
          :style="{ height: `${barHeight(bar)}px` }"
        >
          <div
            v-for="seg in bar.segments"
            :key="seg.type"
            :class="TYPE_STYLE[seg.type].bar"
            :style="{ height: `${(seg.copies / bar.total) * 100}%` }"
          />
        </div>

        <!-- Popover above the bar: the cards behind it. Edge bars align it to
             their side so it stays inside the chart -->
        <div
          v-if="bar.value === active && bar.cards.length"
          class="pointer-events-none absolute z-20 w-56 rounded-lg border border-gray-200 bg-white p-2 text-left text-xxs shadow-lg dark:border-gray-600 dark:bg-gray-800"
          :class="popoverAlign(i)"
          :style="{ bottom: `${barHeight(bar) + 22}px` }"
        >
          <div class="mb-1 font-semibold text-gray-800 dark:text-nalika-text">
            {{ title }} {{ bar.value }} · {{ bar.total.toFixed(1) }} copies
          </div>
          <div
            v-for="c in bar.cards.slice(0, POPOVER_CARDS)"
            :key="c.cardId"
            class="flex items-baseline gap-1.5 text-gray-600 dark:text-nalika-text-muted"
          >
            <span
              class="inline-block h-2 w-2 shrink-0 rounded-sm"
              :class="TYPE_STYLE[c.type].bar"
            />
            <span class="min-w-0 flex-1 truncate">{{ c.name }}</span>
            <span class="font-mono text-gray-400 tabular-nums">{{ c.copies.toFixed(1) }}</span>
          </div>
          <div v-if="bar.cards.length > POPOVER_CARDS" class="mt-0.5 text-gray-400">
            +{{ bar.cards.length - POPOVER_CARDS }} more
          </div>
        </div>
      </button>
    </div>
    <div class="flex gap-1.5 pt-0.5 sm:gap-3">
      <span
        v-for="bar in bars"
        :key="bar.value"
        class="flex-1 text-center font-mono text-xs text-gray-600 dark:text-nalika-text-muted"
        :class="{ 'font-bold text-gray-900 dark:text-nalika-text': bar.value === active }"
      >
        {{ bar.value }}
      </span>
    </div>

    <div class="mt-2 text-xxs">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500">
        <span v-for="t in usedTypes" :key="t" class="flex items-center gap-1">
          <span class="inline-block h-2.5 w-2.5 rounded-sm" :class="TYPE_STYLE[t].bar" />
          {{ TYPE_STYLE[t].label }}
        </span>
        <span class="text-gray-400">
          · copies per average deck · hover or tap a bar for its cards
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onClickOutside } from '@vueuse/core'

const props = defineProps({
  title: { type: String, required: true },
  // 'level' | 'cost'
  field: { type: String, required: true },
  // Cards with level, cost, type, name and totalQty (copies across all decks):
  // an archetype's cards, or a whole series' aggregated cards
  cards: { type: Array, required: true },
  deckCount: { type: Number, required: true },
})

const HEIGHT = 150
// A series-wide bar can hold dozens of cards; the popover lists the biggest
const POPOVER_CARDS = 12
const BAR_MAX = 125

const TYPE_STYLE = {
  UNIT: { label: 'Unit', bar: tw`bg-ruri dark:bg-sky-600` },
  PILOT: { label: 'Pilot', bar: tw`bg-sky-400 dark:bg-sky-300` },
  COMMAND: { label: 'Command', bar: tw`bg-amber-400 dark:bg-amber-500` },
  BASE: { label: 'Base', bar: tw`bg-emerald-500 dark:bg-emerald-600` },
}
const TYPES = Object.keys(TYPE_STYLE)

const hovered = ref(null)
const pinned = ref(null)
const active = computed(() => hovered.value ?? pinned.value)

// Copies per average deck for each card with a numeric value: all its copies
// across the archetype's decks, divided by the number of decks
const entries = computed(() => {
  const decks = props.deckCount || 1
  return props.cards
    .map(c => ({
      cardId: c.cardId,
      name: c.name,
      type: c.type,
      value: parseInt(c[props.field]),
      copies: (c.totalQty ?? 0) / decks,
    }))
    .filter(e => Number.isFinite(e.value) && TYPES.includes(e.type) && e.copies > 0)
})

// Axis covers values with a visible amount (0.05+ copies per deck), so a few
// stray high-level cards don't add empty slots
const MIN_VISIBLE = 0.05
const bars = computed(() => {
  const perValue = new Map()
  for (const e of entries.value) {
    perValue.set(e.value, (perValue.get(e.value) ?? 0) + e.copies)
  }
  const values = [...perValue].filter(([, copies]) => copies >= MIN_VISIBLE).map(([v]) => v)
  if (!values.length) {
    return []
  }
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  return Array.from({ length: hi - lo + 1 }, (_, i) => {
    const value = lo + i
    const here = entries.value.filter(e => e.value === value)
    const segments = TYPES.map(type => ({
      type,
      copies: here.filter(e => e.type === type).reduce((n, e) => n + e.copies, 0),
    })).filter(s => s.copies > 0)
    return {
      value,
      total: segments.reduce((n, s) => n + s.copies, 0),
      segments,
      cards: here.filter(e => e.copies >= 0.05).sort((a, b) => b.copies - a.copies),
    }
  })
})

const maxTotal = computed(() => Math.max(1, ...bars.value.map(b => b.total)))
const barHeight = bar => (bar.total / maxTotal.value) * BAR_MAX

function popoverAlign(i) {
  const n = bars.value.length
  if (i < n / 3) {
    return tw`left-0`
  }
  return i >= (2 * n) / 3 ? tw`right-0` : tw`left-1/2 -translate-x-1/2`
}

// A tapped bar stays open until tapping it again or anywhere else
const rootRef = ref(null)
onClickOutside(rootRef, () => {
  pinned.value = null
})
const usedTypes = computed(() => TYPES.filter(t => entries.value.some(e => e.type === t)))

const average = computed(() => {
  const total = entries.value.reduce((n, e) => n + e.copies, 0)
  if (!total) {
    return '—'
  }
  return (entries.value.reduce((n, e) => n + e.value * e.copies, 0) / total).toFixed(1)
})
</script>
