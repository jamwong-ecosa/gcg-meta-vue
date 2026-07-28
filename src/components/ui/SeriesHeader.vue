<template>
  <div class="mb-3">
    <h1 class="text-2xl font-bold text-sumi dark:text-nalika-text">Meta Overview</h1>
    <div
      v-if="visible"
      class="mt-0.5 flex flex-wrap gap-x-1 text-xs text-gray-500 dark:text-nalika-text-muted"
    >
      <span>{{ events }} events</span>
      <span>· {{ wins }} wins</span>
      <span>· {{ decks.toLocaleString() }} decks</span>
      <span>· {{ archetypes }} archetypes</span>
    </div>
  </div>
</template>

<script setup>
const { currentSeries, allRows } = inject('meta')

const visible = computed(() => !!currentSeries)
const events = computed(() => currentSeries.value?.events ?? 0)
const wins = computed(() => currentSeries.value?.winDecks ?? 0)
const decks = computed(() => currentSeries.value?.totalDecks ?? 0)
const archetypes = computed(() => allRows.value.length)
</script>
