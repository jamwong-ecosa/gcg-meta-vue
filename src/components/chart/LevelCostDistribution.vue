<template>
  <!-- Copies per average deck across the series at each level and cost, by type -->
  <div class="mb-6 grid gap-4 md:grid-cols-2">
    <ChartDeckCurve
      :title="$t('chart.level')"
      field="level"
      :cards="cards"
      :deck-count="totalSeriesDecks"
    />
    <ChartDeckCurve
      :title="$t('chart.cost')"
      field="cost"
      :cards="cards"
      :deck-count="totalSeriesDecks"
    />
  </div>
</template>

<script setup>
const { totalSeriesDecks, aggregationResult } = inject('meta')
const cards = computed(() => aggregationResult.value?.cards ?? [])
</script>
