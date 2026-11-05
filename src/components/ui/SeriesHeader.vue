<template>
  <div class="mb-3">
    <h1 class="text-2xl font-bold text-sumi dark:text-nalika-text">{{ title }}</h1>
    <div
      v-if="visible"
      class="mt-0.5 flex flex-wrap gap-x-1 text-xs text-gray-500 dark:text-nalika-text-muted"
    >
      <span>{{ $t('ui.seriesHeader.events', { n: $n(events) }, events) }}</span>
      <span>· {{ $t('ui.seriesHeader.wins', { n: $n(wins) }, wins) }}</span>
      <span>· {{ $t('ui.seriesHeader.decks', { n: $n(decks) }, decks) }}</span>
      <span>· {{ $t('ui.seriesHeader.archetypes', { n: $n(archetypes) }, archetypes) }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  visible: Boolean,
  events: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  decks: { type: Number, default: 0 },
  archetypes: { type: Number, default: 0 },
})
</script>
