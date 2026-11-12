<template>
  <!-- Copies per average deck across the series at each level and cost, by type -->
  <ChartDeckCurvePair
    class="mb-6"
    :level-title="$t('chart.level')"
    :cost-title="$t('chart.cost')"
    :cards="cards"
    :deck-count="totalSeriesDecks"
  />
</template>

<script setup>
const { totalSeriesDecks, aggregationResult } = inject('meta')
const cards = computed(() => aggregationResult.value?.cards ?? [])
</script>
