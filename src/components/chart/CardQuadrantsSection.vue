<template>
  <div
    class="mb-6 rounded border border-gray-500/10 bg-shironezumi/3 p-2 dark:border-nalika-border dark:bg-nalika-surface"
  >
    <h2
      class="mb-3 text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted"
    >
      Card Quadrants
    </h2>
    <div class="mb-3 overflow-x-auto">
      <UiMetaTabGroup v-model="cardTypeChart" :options="cardTypeOptions" />
    </div>
    <ChartCardQuadrantChart
      :card-items="filteredCardItems"
      :card-type-chart="cardTypeChart"
      :series-key="selectedKey"
    />
  </div>
</template>

<script setup>
const ChartCardQuadrantChart = defineAsyncComponent(
  () => import('@/components/chart/CardQuadrantChart.vue'),
)

const { aggregationResult, selectedKey } = inject('meta')

const { cardTypeChart, cardTypeOptions, filteredCardItems } = useCardFiltering(aggregationResult)
</script>
