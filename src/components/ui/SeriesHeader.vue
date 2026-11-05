<template>
  <div class="mb-3">
    <h1 class="text-2xl font-bold text-sumi dark:text-nalika-text">{{ title }}</h1>
    <!-- Numbers bold and dark, units light, stats spaced apart: the small grey
         run-on line was hard to scan, in Chinese most of all -->
    <ul
      v-if="visible"
      class="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-nalika-text-muted"
    >
      <li v-for="s in stats" :key="s.key">
        <i18n-t :keypath="`ui.seriesHeader.${s.key}`" :plural="s.value" scope="global">
          <template #n>
            <b class="text-sm font-bold text-sumi tabular-nums dark:text-nalika-text">
              {{ $n(s.value) }}
            </b>
          </template>
        </i18n-t>
      </li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: '' },
  visible: Boolean,
  events: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  decks: { type: Number, default: 0 },
  archetypes: { type: Number, default: 0 },
})

const stats = computed(() => [
  { key: 'events', value: props.events },
  { key: 'wins', value: props.wins },
  { key: 'decks', value: props.decks },
  { key: 'archetypes', value: props.archetypes },
])
</script>
