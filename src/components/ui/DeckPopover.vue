<template>
  <div
    class="deck-popover-trigger relative"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @contextmenu.prevent
    @click="onClick"
  >
    <slot />

    <!-- Desktop hover popover: teleported and fixed so a scrolling modal or an
         overflow-hidden parent can't clip it; sized to fit the viewport -->
    <Teleport to="body">
      <div
        v-if="open && cards.length"
        class="pointer-events-none fixed z-1200 rounded-lg border border-gray-200 bg-white p-2.5 shadow-lg dark:border-gray-600 dark:bg-gray-800"
        :style="{ top: `${pos.top}px`, left: `${pos.left}px` }"
      >
        <div
          class="mb-2 flex items-baseline justify-between gap-4"
          :style="{ height: `${HEADER_H - 8}px` }"
        >
          <span v-if="label" class="truncate text-xs font-medium text-gray-600 dark:text-gray-300">
            {{ label }}
          </span>
          <span class="shrink-0 font-mono text-xxs text-gray-400 tabular-nums">{{ summary }}</span>
        </div>
        <div
          class="grid"
          :style="{
            gridTemplateColumns: `repeat(${pos.cols}, ${pos.cardW}px)`,
            gap: `${GAP}px`,
          }"
        >
          <div
            v-for="card in sortedCards"
            :key="card.cardId"
            class="relative aspect-[3/4] overflow-hidden rounded-md"
            :class="{ 'outline-2 outline-akabeni': isCoreUnit(card) }"
          >
            <img
              :src="`https://jw-assets.imgix.net/gcg-img/${card.cardId}.webp?w=200&auto=format,compress`"
              :alt="card.name"
              class="w-full object-cover"
            />
            <span
              class="absolute top-0 right-0 rounded-bl-md bg-black/65 px-1.5 leading-tight font-bold text-white select-none"
              :class="pos.cardW >= 80 ? 'text-xl' : 'text-sm'"
            >
              {{ card.qty }}
            </span>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Mobile fullscreen overlay -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="mobileOpen"
          class="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50"
          @click="closeMobile"
        >
          <div
            class="mx-2 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-2 shadow-2xl select-none dark:bg-gray-800"
            @click.stop
          >
            <div class="mb-2 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div
                  v-if="label"
                  class="truncate text-xs font-medium text-gray-600 dark:text-gray-300"
                >
                  {{ label }}
                </div>
                <div class="font-mono text-xxs text-gray-400 tabular-nums">{{ summary }}</div>
              </div>
              <div class="flex shrink-0 gap-2">
                <button
                  v-if="url"
                  class="flex h-8 w-12 items-center justify-center rounded-lg bg-ruri/10 text-ruri dark:bg-sora/15 dark:text-sora"
                  aria-label="Open deck page in new tab"
                  @click="openUrl"
                >
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"
                    />
                    <path
                      d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 100-2H5z"
                    />
                  </svg>
                </button>
                <button
                  class="flex h-8 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  aria-label="Close"
                  @click="closeMobile"
                >
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div class="grid grid-cols-4 gap-1.5">
              <div
                v-for="card in sortedCards"
                :key="card.cardId"
                class="relative aspect-[3/4] overflow-hidden rounded-lg"
                :class="{ 'outline-2 outline-akabeni': isCoreUnit(card) }"
              >
                <img
                  :src="`https://jw-assets.imgix.net/gcg-img/${card.cardId}.webp?w=200&auto=format,compress`"
                  :alt="card.name"
                  class="w-full object-cover"
                  loading="lazy"
                />
                <span
                  class="absolute top-0 right-0 rounded-bl-lg bg-black/60 px-1.5 text-2xl leading-tight font-bold text-white select-none"
                >
                  {{ card.qty }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { onKeyStroke, useEventListener } from '@vueuse/core'

const props = defineProps({
  cards: { type: Array, required: true },
  url: { type: String, default: '' },
  label: { type: String, default: '' },
})

const open = ref(false)
const mobileOpen = ref(false)
const pos = ref({ top: 0, left: 0, cols: 8, cardW: 100 })

let showTimer = null

const TYPE_ORDER = { UNIT: 0, PILOT: 1, COMMAND: 2, BASE: 3 }
const TYPE_SHORT = { UNIT: 'U', PILOT: 'P', COMMAND: 'C', BASE: 'B' }

const sortedCards = computed(() =>
  [...props.cards].sort((a, b) => {
    const ta = TYPE_ORDER[a.type] ?? 99
    const tb = TYPE_ORDER[b.type] ?? 99
    if (ta !== tb) {
      return ta - tb
    }
    if (a.color !== b.color) {
      return (a.color ?? '').localeCompare(b.color ?? '')
    }
    const levelDiff = (b.level ?? 0) - (a.level ?? 0)
    if (levelDiff !== 0) {
      return levelDiff
    }
    return (b.cost ?? 0) - (a.cost ?? 0)
  }),
)

// "50 cards · U 24 · P 10 · C 12 · B 4" (copies, not distinct cards)
const summary = computed(() => {
  const byType = {}
  let total = 0
  for (const c of props.cards) {
    byType[c.type] = (byType[c.type] ?? 0) + c.qty
    total += c.qty
  }
  const parts = Object.keys(TYPE_ORDER)
    .filter(t => byType[t])
    .map(t => `${TYPE_SHORT[t]} ${byType[t]}`)
  return [`${total} cards`, ...parts].join(' · ')
})

function isCoreUnit(card) {
  return card.type === 'UNIT' && (card.inclusionRate ?? 0) >= 0.75
}

const MAX_COLS = 8
const MAX_CARD_W = 100
const MIN_CARD_W = 56
const GAP = 6
const PAD = 10
const BORDER = 1
const HEADER_H = 24
const MARGIN = 16
const OFFSET = 4

function popoverSize(cols, rows, cardW) {
  return {
    width: cols * cardW + (cols - 1) * GAP + 2 * (PAD + BORDER),
    height: HEADER_H + (rows * (cardW * 4)) / 3 + (rows - 1) * GAP + 2 * (PAD + BORDER),
  }
}

// Every card is shown: columns fill the viewport width, rows grow as needed, and
// cards shrink when the rows wouldn't fit above or below the trigger
function place(rect) {
  const n = props.cards.length
  const vw = window.innerWidth
  const vh = window.innerHeight
  const fitCols = Math.floor((vw - 2 * MARGIN - 2 * (PAD + BORDER) + GAP) / (MAX_CARD_W + GAP))
  let cols = Math.max(2, Math.min(MAX_COLS, fitCols, n))
  const rows = Math.ceil(n / cols)
  cols = Math.ceil(n / rows)

  const below = vh - rect.bottom - OFFSET - MARGIN
  const above = rect.top - OFFSET - MARGIN
  const full = popoverSize(cols, rows, MAX_CARD_W).height
  const side = full <= below || below >= above ? 'below' : 'above'
  const space = side === 'below' ? below : above
  const fitW = ((space - HEADER_H - (rows - 1) * GAP - 2 * (PAD + BORDER)) / rows) * (3 / 4)
  const cardW = Math.floor(Math.max(MIN_CARD_W, Math.min(MAX_CARD_W, fitW)))
  const { width, height } = popoverSize(cols, rows, cardW)

  const left = Math.min(Math.max(rect.left, MARGIN), vw - width - MARGIN)
  const top = side === 'below' ? rect.bottom + OFFSET : rect.top - OFFSET - height
  pos.value = { top: Math.max(MARGIN, top), left: Math.max(MARGIN, left), cols, cardW }
}

function closeMobile() {
  mobileOpen.value = false
}

function openUrl() {
  if (props.url) {
    window.open(props.url, '_blank', 'noopener')
  }
  mobileOpen.value = false
}

// On phones a tap anywhere on the trigger opens the overlay instead of the link
function onClick(event) {
  if (window.innerWidth >= 768 || !props.cards.length) {
    return
  }
  event.preventDefault()
  mobileOpen.value = true
}

function onEnter(event) {
  if (window.innerWidth < 768) {
    return
  }
  const el = event.currentTarget
  clearTimeout(showTimer)
  showTimer = setTimeout(() => {
    place(el.getBoundingClientRect())
    open.value = true
  }, 250)
}

function onLeave() {
  clearTimeout(showTimer)
  open.value = false
}

// Fixed coordinates go stale once the page or a modal scrolls. Listen only while
// open: a deck list renders hundreds of these
useEventListener(() => (open.value ? window : null), 'scroll', onLeave, {
  capture: true,
  passive: true,
})
onKeyStroke('Escape', () => {
  if (open.value || mobileOpen.value) {
    onLeave()
    closeMobile()
  }
})

onUnmounted(() => clearTimeout(showTimer))
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* No long-press link callout on phones; still lets the list scroll */
.deck-popover-trigger :deep(a) {
  -webkit-touch-callout: none;
  touch-action: manipulation;
}
</style>
