<template>
  <div
    class="mb-6 rounded border border-gray-500/10 bg-shironezumi/2 p-2 dark:border-nalika-border dark:bg-nalika-surface"
  >
    <div class="mb-3 flex items-center justify-between gap-1">
      <h2
        class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted"
      >
        Card stats
      </h2>
      <div v-if="seriesTimeline" class="text-xs text-gray-500 dark:text-gray-400">
        {{ seriesTimeline }}
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
      <span>
        <strong class="text-gray-700 dark:text-nalika-text">{{ totalCardCount }}</strong>
        released
      </span>
      <span>
        <strong class="text-gray-700 dark:text-nalika-text">{{ usedCardCount }}</strong>
        used
      </span>
      <span>
        <strong class="text-gray-700 dark:text-nalika-text">
          {{ totalCardCount - usedCardCount }}
        </strong>
        unused
      </span>
    </div>
    <div v-if="colorCounts.length" class="mt-3 mb-5 flex flex-wrap gap-1.5">
      <span
        v-for="item in colorCounts"
        :key="item.color"
        class="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
      >
        <span class="mr-1 inline-block h-2 w-2 rounded-full" :style="{ background: item.hex }" />
        <span class="mr-1 text-xxs">{{ item.color }}:</span>
        <span class="font-mono font-bold text-gray-500 dark:text-gray-400">{{ item.count }}</span>
      </span>
    </div>
    <div v-if="archetypeProductGroups.length" class="mt-3 space-y-4">
      <div
        v-for="group in archetypeProductGroups"
        :key="group.prefix"
        class="flex flex-wrap gap-1.5"
      >
        <span
          v-for="item in group.items"
          :key="item.name"
          class="rounded-full border px-2 py-0.5 text-xs font-medium"
          :class="
            item.isNew
              ? 'border-green-400 bg-green-50 text-green-700 ring-1 ring-green-400 dark:border-green-500 dark:bg-green-900/20 dark:text-green-300'
              : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
          "
        >
          <span class="mr-1 text-xxs">{{ item.name }}:</span>
          <span class="font-mono font-bold">{{ item.count }}</span>
          <span
            v-if="item.isNew"
            class="ml-1 text-xxs font-semibold text-green-600 dark:text-green-400"
          >
            NEW
          </span>
        </span>
      </div>
    </div>
    <p v-else class="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
      Product info unavailable
    </p>
  </div>
</template>

<script setup>
const {
  aggregationResult,
  cardMeta,
  cardInfoById,
  eventCutoffDate,
  eventMinDate,
  currentSeries,
  seriesTimeline,
} = inject('meta')

const colorFilter = useColorFilter()
const { totalCardCount, usedCardCount } = useCardEligibility({
  cardMeta,
  aggregationResult,
  eventCutoffDate,
  eventMinDate,
  colorFilter,
  currentSeries,
})
const { archetypeProductGroups, colorCounts } = useProductGroups({
  aggregationResult,
  cardInfoById,
  eventMinDate,
  eventCutoffDate,
})
</script>
