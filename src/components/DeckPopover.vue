<template>
  <div
    class="relative"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @contextmenu.prevent
    @click="onClick"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @touchmove="cancelLongPress"
  >
    <slot />

    <!-- Desktop hover popover -->
    <div
      v-if="open && cards.length"
      class="absolute z-1000 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-600 dark:bg-gray-800"
      :class="[
        anchor === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
        hPos === 'right' ? 'right-0' : 'left-0',
      ]"
    >
      <div class="flex flex-col gap-1">
        <div
          v-for="(row, ri) in cardRows"
          :key="ri"
          class="grid gap-1"
          :style="{ gridTemplateColumns: `repeat(${maxCols}, 120px)` }"
        >
          <div v-for="card in row" :key="card.cardId" class="relative">
            <img
              :src="`https://jw-assets.imgix.net/gcg-img/${card.cardId}.webp?w=120`"
              :alt="card.name"
              class="w-full object-cover"
              loading="lazy"
              @contextmenu.prevent
            />
            <span
              class="absolute top-0 right-0 rounded-bl-lg bg-black/60 px-1.5 text-2xl leading-tight font-bold text-white"
            >
              {{ card.qty }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile fullscreen overlay (long-press) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="mobileOpen"
          class="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50"
          @click="closeMobile"
        >
          <div
            class="mx-2 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-2 shadow-2xl dark:bg-gray-800"
            @click.stop
          >
            <div class="grid grid-cols-4 gap-1">
              <div v-for="card in cards" :key="card.cardId" class="relative">
                <img
                  :src="`https://jw-assets.imgix.net/gcg-img/${card.cardId}.webp?w=200`"
                  :alt="card.name"
                  class="w-full object-cover"
                  loading="lazy"
                  @contextmenu.prevent
                />
                <span
                  class="absolute top-0 right-0 rounded-bl-lg bg-black/60 px-1.5 text-2xl leading-tight font-bold text-white"
                >
                  {{ card.qty }}
                </span>
              </div>
            </div>
            <button
              class="mt-3 w-full rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              @click="closeMobile"
            >
              Close
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
const props = defineProps({
  cards: { type: Array, required: true },
})

const open = ref(false)
const mobileOpen = ref(false)
const anchor = ref('bottom')
const hPos = ref('left')
let longPressTimer = null
const preventNextClick = ref(false)

const MAX_COLS = 8
const CARD_W = 120
const GAP = 4
const PAD = 20
const BORDER = 2

// Max grid columns, recalculated on hover to fit viewport
const cols = ref(MAX_COLS)

const cardRows = computed(() => {
  const n = props.cards.length
  if (n <= MAX_COLS) {
    return [props.cards]
  }
  // 3-row ceiling distribution, capped at viewport-fit columns
  const perRow = Math.min(cols.value, Math.ceil(n / 3))
  const rows = []
  let remaining = n
  for (let i = 0; i < 3; i++) {
    const size = Math.min(perRow, remaining)
    if (size <= 0) {
      break
    }
    rows.push(props.cards.slice(n - remaining, n - remaining + size))
    remaining -= size
  }
  return rows
})

const maxCols = computed(() => cardRows.value.reduce((m, r) => Math.max(m, r.length), 0))

function closeMobile() {
  mobileOpen.value = false
}

function onClick(event) {
  if (!preventNextClick.value || !event.target.closest('a')) {
    return
  }
  preventNextClick.value = false
  event.preventDefault()
}

function onTouchStart(event) {
  if (window.innerWidth >= 768 || !event.target.closest('a')) {
    return
  }
  longPressTimer = setTimeout(() => {
    preventNextClick.value = true
    mobileOpen.value = true
  }, 500)
}

function onTouchEnd() {
  clearTimeout(longPressTimer)
}

function cancelLongPress() {
  clearTimeout(longPressTimer)
}

// Max columns that fit viewport with 20px margin each side
function calcFitCols() {
  const maxAvail = window.innerWidth - 32
  return Math.max(
    2,
    Math.min(MAX_COLS, Math.floor((maxAvail - PAD - BORDER + GAP) / (CARD_W + GAP))),
  )
}

function onEnter(event) {
  if (window.innerWidth < 768) {
    return
  }
  open.value = true
  // Constrain grid width to viewport before measuring trigger position
  const viewportCols = calcFitCols()
  cols.value = viewportCols
  const rect = event.currentTarget.getBoundingClientRect()
  const n = props.cards.length
  const perRow = n <= viewportCols ? n : Math.min(viewportCols, Math.ceil(n / 3))
  const rows = n <= viewportCols ? 1 : 3
  const estimatedWidth = perRow * CARD_W + (perRow - 1) * GAP + PAD + BORDER
  const estimatedHeight = rows * 185 + PAD + BORDER

  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  // Flip above when popover doesn't fit below and there's room above
  if (estimatedHeight <= spaceBelow) {
    anchor.value = 'bottom'
  } else if (estimatedHeight <= spaceAbove) {
    anchor.value = 'top'
  } else {
    // Neither side fits — pick the one with more room
    anchor.value = spaceBelow >= spaceAbove ? 'bottom' : 'top'
  }

  // Horizontal: flip right when left-aligned would overflow right,
  // flip left when right-aligned would overflow left.
  // When both overflow, pick the side that keeps more visible.
  const canLeft = rect.left + estimatedWidth <= window.innerWidth
  const canRight = rect.right >= estimatedWidth
  if (!canLeft && canRight) {
    hPos.value = 'right'
  } else if (!canRight && canLeft) {
    hPos.value = 'left'
  } else if (!canLeft && !canRight) {
    hPos.value = rect.left + rect.right < window.innerWidth ? 'left' : 'right'
  }
}

function onLeave() {
  open.value = false
}
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

.relative a {
  -webkit-touch-callout: none;
  touch-action: none;
}
</style>
