<template>
  <div
    v-if="cardStateComparison"
    class="mb-6 rounded border border-gray-500/10 bg-shironezumi/2 p-2 dark:border-nalika-border dark:bg-nalika-surface"
  >
    <div class="mb-3 flex items-center justify-between max-sm:flex-col max-sm:items-start">
      <h2
        class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted zh:tracking-normal"
      >
        {{ $t('card.state.title') }}
      </h2>
    </div>
    <UiStatCompareGrid
      :metrics="cardStateComparison.metrics"
      :top-color="{ label: $t('card.state.topUsedColor'), ...cardStateComparison.topColor }"
    />
  </div>
</template>

<script setup>
const { currentSeries, previousSeries } = inject('meta')
const { cardStateComparison } = useSeriesComparison({ currentSeries, previousSeries })
</script>
