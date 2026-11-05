<template>
  <div
    class="mb-6 rounded border border-gray-500/10 bg-shironezumi/3 p-2 dark:border-nalika-border dark:bg-nalika-surface"
  >
    <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-baseline justify-between gap-2">
        <h2
          class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted zh:tracking-normal"
        >
          {{ title }}
        </h2>
        <!-- Mobile only: the cards are one swipeable row; gone after the first swipe -->
        <span
          v-if="overflows"
          class="shrink-0 text-xs text-gray-400 transition-opacity sm:hidden dark:text-gray-500"
          :class="arrivedState.left ? 'opacity-100' : 'opacity-0'"
          aria-hidden="true"
        >
          {{ $t('card.swipeHint') }} →
        </span>
      </div>
      <slot name="tabs" />
    </div>

    <!-- Mobile: one swipeable row, ~4⅓ cards visible so the cut-off one hints at
         more, and the right edge fades until the end is reached -->
    <div
      v-if="cards.length"
      ref="scroller"
      class="-mx-2 flex snap-x scroll-px-2 gap-x-3 overflow-x-auto px-2 pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-y-4 sm:overflow-visible sm:mask-none sm:px-0 sm:pb-0 lg:grid-cols-10 lg:gap-x-4"
      :class="overflows && !arrivedState.right && 'mask-r-from-92%'"
    >
      <CardMetaCardItem
        v-for="(card, i) in cards"
        :key="card.cardId"
        v-memo="[card, ranked]"
        class="w-[22%] shrink-0 snap-start sm:w-auto"
        :card="card"
        :rank="ranked ? i + 1 : 0"
        @toggle-enlarge="$emit('toggle-enlarge', $event)"
      >
        <slot name="footer" :card="card" />
      </CardMetaCardItem>
    </div>
    <p v-else class="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
      {{ emptyText || $t('card.noData') }}
    </p>
    <slot name="bottom" />
  </div>
</template>

<script setup>
import { useElementSize, useScroll } from '@vueuse/core'

const props = defineProps({
  title: { type: String, required: true },
  cards: { type: Array, default: () => [] },
  emptyText: { type: String, default: '' },
  // Show #1, #2… on the cards
  ranked: { type: Boolean, default: false },
})

defineEmits(['toggle-enlarge'])

const scroller = useTemplateRef('scroller')
const { arrivedState, measure } = useScroll(scroller)
const { width } = useElementSize(scroller)

// Only hint when there is something to scroll to (never on the sm+ grid)
const overflows = computed(() => {
  void width.value
  void props.cards.length
  const el = scroller.value
  return !!el && el.scrollWidth > el.clientWidth + 1
})

// Card list or tab changes can shrink the row; recheck the arrived edges
watch(
  () => props.cards,
  () => nextTick(measure),
)
</script>
