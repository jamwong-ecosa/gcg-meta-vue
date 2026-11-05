<template>
  <div
    class="mb-6 rounded border border-gray-500/10 bg-shironezumi/2 p-2 dark:border-nalika-border dark:bg-nalika-surface"
  >
    <div class="mb-3 flex items-center justify-between max-sm:flex-col max-sm:items-start">
      <h2
        class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted zh:tracking-normal"
      >
        {{ $t('ui.compare.title') }}
      </h2>
      <div v-if="previousSeries" class="text-xs text-gray-500 dark:text-gray-400">
        {{ previousSeries.label }}
      </div>
    </div>
    <UiStatCompareGrid
      v-if="seriesComparison"
      :metrics="seriesComparison.metrics"
      :top-color="{ label: $t('ui.compare.topColor'), ...seriesComparison.topColor }"
    />
    <p v-else class="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
      {{ $t('ui.compare.none') }}
    </p>
  </div>
</template>

<script setup>
const { currentSeries, previousSeries } = inject('meta')
const { seriesComparison } = useSeriesComparison({ currentSeries, previousSeries })
</script>
