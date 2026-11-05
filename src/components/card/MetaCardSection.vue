<template>
  <div
    class="mb-6 rounded border border-gray-500/10 bg-shironezumi/3 p-2 dark:border-nalika-border dark:bg-nalika-surface"
  >
    <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h2
        class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted zh:tracking-normal"
      >
        {{ title }}
      </h2>
      <slot name="tabs" />
    </div>

    <div
      v-if="cards.length"
      class="grid grid-cols-4 gap-x-3 gap-y-4 sm:grid-cols-5 lg:grid-cols-10 lg:gap-x-4"
    >
      <CardMetaCardItem
        v-for="(card, i) in cards"
        :key="card.cardId"
        v-memo="[card, ranked]"
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
defineProps({
  title: { type: String, required: true },
  cards: { type: Array, default: () => [] },
  emptyText: { type: String, default: '' },
  // Show #1, #2… on the cards
  ranked: { type: Boolean, default: false },
})

defineEmits(['toggle-enlarge'])
</script>
