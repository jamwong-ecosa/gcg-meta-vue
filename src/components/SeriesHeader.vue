<template>
  <div class="mb-3">
    <h1 class="text-2xl font-bold text-sumi dark:text-nalika-text">{{ title }}</h1>
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
defineProps({
  title: { type: String, required: true },
  visible: { type: Boolean, default: false },
  events: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  decks: { type: Number, default: 0 },
  archetypes: { type: Number, default: 0 },
})
</script>
