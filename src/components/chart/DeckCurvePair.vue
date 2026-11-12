<template>
  <!-- Copies per average deck at each level and cost, by type. The colour key
       and the how-to-read line sit once above the pair, not under each chart -->
  <div>
    <div
      class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-300"
    >
      <span v-for="type in usedTypes" :key="type" class="flex items-center gap-1">
        <span class="inline-block h-2.5 w-2.5 rounded-sm" :class="CURVE_TYPE_STYLE[type].bar" />
        {{ cardTypeName(type) }}
      </span>
      <span class="text-gray-500 dark:text-gray-400">
        {{ $t('chart.curve.legend') }}
      </span>
    </div>
    <div class="grid gap-4 md:grid-cols-2">
      <ChartDeckCurve :title="levelTitle" field="level" :cards="cards" :deck-count="deckCount" />
      <ChartDeckCurve :title="costTitle" field="cost" :cards="cards" :deck-count="deckCount" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  levelTitle: { type: String, required: true },
  costTitle: { type: String, required: true },
  // Cards with level, cost, type, name and totalQty (see ChartDeckCurve)
  cards: { type: Array, required: true },
  deckCount: { type: Number, required: true },
})

const usedTypes = computed(() =>
  CURVE_TYPES.filter(type => props.cards.some(c => c.type === type && (c.totalQty ?? 0) > 0)),
)
</script>
