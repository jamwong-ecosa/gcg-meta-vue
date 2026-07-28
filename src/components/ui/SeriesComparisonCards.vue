<template>
  <div
    class="mb-6 rounded border border-gray-500/10 bg-shironezumi/2 p-2 dark:border-nalika-border dark:bg-nalika-surface"
  >
    <div class="mb-3 flex items-center justify-between max-sm:flex-col max-sm:items-start">
      <h2
        class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted"
      >
        vs Previous Series
      </h2>
      <div v-if="previousSeries" class="text-xs text-gray-500 dark:text-gray-400">
        {{ previousSeries.label }}
      </div>
    </div>
    <div v-if="seriesComparison" class="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <div
        v-for="m in seriesComparison.metrics"
        :key="m.label"
        class="rounded border border-gray-500/10 bg-shironezumi/4 p-2 dark:border-nalika-border dark:bg-nalika-surface"
      >
        <div class="text-xs text-gray-500 dark:text-gray-400">{{ m.label }}</div>
        <div class="mt-1 flex items-center justify-between">
          <span class="text-lg font-bold text-gray-700 dark:text-nalika-text">
            {{ m.format(m.current) }}
          </span>
          <span
            class="text-xs font-medium"
            :class="
              m.format(m.current) === m.format(m.previous)
                ? 'text-gray-500 dark:text-gray-400'
                : m.diff > 0
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-red-600 dark:text-red-500'
            "
          >
            <template v-if="m.format(m.current) === m.format(m.previous)">same</template>
            <template v-else>{{ m.diff > 0 ? '+' : '' }}{{ m.format(m.diff) }}</template>
          </span>
        </div>
        <div class="text-xs text-gray-400 dark:text-gray-500">
          previous: {{ m.format(m.previous) }}
        </div>
      </div>
      <div
        class="rounded border border-gray-500/10 bg-shironezumi/4 p-2 dark:border-nalika-border dark:bg-nalika-surface"
      >
        <div class="text-xs text-gray-500 dark:text-gray-400">Top color</div>
        <div class="mt-1 flex items-center justify-between">
          <span class="text-sm font-bold text-gray-700 dark:text-nalika-text">
            {{ seriesComparison.topColor.current || '—' }}
          </span>
          <span
            v-if="seriesComparison.topColor.current !== seriesComparison.topColor.previous"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            was {{ seriesComparison.topColor.previous || '—' }}
          </span>
          <span v-else class="text-xs text-gray-500 dark:text-gray-400">same</span>
        </div>
      </div>
    </div>
    <p v-else class="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
      No previous series
    </p>
  </div>
</template>

<script setup>
const { currentSeries, previousSeries } = inject('meta')
const { seriesComparison } = useSeriesComparison({ currentSeries, previousSeries })
</script>
