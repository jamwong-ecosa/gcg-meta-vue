<template>
  <div class="relative" @mouseenter="onEnter" @mouseleave="onLeave">
    <slot />

    <div
      v-if="open && cards.length"
      class="absolute z-50 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-600 dark:bg-gray-800"
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
              class="w-full rounded object-cover"
              loading="lazy"
            />
            <span
              class="absolute top-0 right-0 rounded-bl bg-black/60 px-1.5 text-base leading-tight font-bold text-white"
            >
              {{ card.qty }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  cards: { type: Array, required: true },
})

const open = ref(false)
const anchor = ref('bottom')
const hPos = ref('left')

const cardRows = computed(() => {
  const n = props.cards.length
  if (n <= 8) {
    return [props.cards]
  }
  const maxPerRow = Math.ceil(n / 3)
  const rows = []
  let remaining = n
  for (let i = 0; i < 3; i++) {
    const size = Math.min(maxPerRow, remaining)
    rows.push(props.cards.slice(n - remaining, n - remaining + size))
    remaining -= size
  }
  return rows
})

const maxCols = computed(() => cardRows.value.reduce((m, r) => Math.max(m, r.length), 0))

function onEnter(event) {
  if (window.innerWidth < 768) {
    return
  }
  open.value = true
  const rect = event.currentTarget.getBoundingClientRect()
  const n = props.cards.length
  const rows = n <= 8 ? 1 : 3
  const perRow = rows === 1 ? Math.min(n, 8) : Math.ceil(n / 3)
  const estimatedWidth = perRow * 120 + (perRow - 1) * 4 + 16
  const estimatedHeight = rows * 185 + 16
  anchor.value =
    estimatedHeight > window.innerHeight - rect.bottom && rect.top > estimatedHeight
      ? 'top'
      : 'bottom'
  hPos.value = rect.left + estimatedWidth > window.innerWidth ? 'right' : 'left'
}

function onLeave() {
  open.value = false
}
</script>
