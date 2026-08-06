<template>
  <div
    class="mb-6 rounded border border-gray-500/10 bg-shironezumi/3 p-2 dark:border-nalika-border dark:bg-nalika-surface"
  >
    <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h2
        class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted"
      >
        {{ title }}
      </h2>
      <slot name="tabs" />
    </div>

    <div
      v-if="cards.length"
      class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10"
    >
      <CardMetaCardItem
        v-for="card in cards"
        :key="card.cardId"
        v-memo="[card]"
        :card="card"
        @toggle-enlarge="$emit('toggle-enlarge', $event)"
      >
        <slot name="footer" :card="card" />
      </CardMetaCardItem>
    </div>
    <p v-else class="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
      {{ emptyText }}
    </p>
    <slot name="bottom" />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  cards: { type: Array, default: () => [] },
  emptyText: { type: String, default: 'No data' },
})

defineEmits(['toggle-enlarge'])
</script>
