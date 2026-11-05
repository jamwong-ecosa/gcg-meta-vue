<template>
  <div class="mb-6 grid gap-4 md:grid-cols-3">
    <div
      class="rounded border border-gray-500/10 bg-shironezumi/3 p-2 dark:border-nalika-border dark:bg-nalika-surface"
    >
      <h2
        class="mb-3 text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted zh:tracking-normal"
      >
        {{ $t('chart.dist.tier') }}
      </h2>
      <div class="space-y-2">
        <div v-for="item in tierDist" :key="item.tier" class="flex items-center gap-2">
          <span
            class="w-10 rounded px-1.5 py-0.5 text-center text-xs font-bold"
            :class="tierPillClass(item.tier)"
          >
            {{ item.tier }}
          </span>
          <div class="h-5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/70">
            <div
              class="h-full rounded-full transition-all"
              :class="tierBarClass(item.tier)"
              :style="{ width: `${item.percent}%` }"
            />
          </div>
          <span
            class="w-8 text-right font-mono text-xs font-bold text-gray-600 dark:text-nalika-text-muted"
          >
            {{ item.count }}
          </span>
        </div>
      </div>
    </div>

    <div
      class="rounded border border-gray-500/10 bg-shironezumi/3 p-2 dark:border-nalika-border dark:bg-nalika-surface"
    >
      <div class="mb-3 flex items-center justify-between">
        <h2
          class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted zh:tracking-normal"
        >
          {{ $t('chart.dist.color') }}
        </h2>
        <button
          v-if="allColorDist.length > colorDist.length"
          class="text-xxs font-medium text-ruri hover:underline"
          @click="viewAllModal = 'colors'"
        >
          {{ $t('chart.dist.viewAll') }}
        </button>
      </div>
      <div v-if="colorDist.length" class="space-y-2">
        <div v-for="item in colorDist" :key="item.colors" class="flex items-center gap-2">
          <div class="flex shrink-0 items-center gap-0.5">
            <div
              v-for="dot in item.colorDots"
              :key="dot.name"
              class="inline-block h-2.5 w-2.5 rounded-full"
              :style="{ background: dot.hex }"
            />
          </div>
          <span
            class="w-7 shrink-0 text-center text-xs font-medium text-aisumicha dark:text-nalika-text"
          >
            {{
              item.isOther
                ? $t('chart.other')
                : item.colorDots.map(d => colorName(d.name)[0]).join('')
            }}
          </span>
          <div class="h-5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/70">
            <div
              class="h-full rounded-full"
              :style="{ width: `${item.percent}%`, background: item.barGradient }"
            />
          </div>
          <span
            class="w-12 text-right font-mono text-xs font-bold text-gray-600 dark:text-nalika-text-muted"
          >
            {{ item.rate.toFixed(1) }}%
          </span>
          <span
            v-if="item.rateDiff !== undefined"
            class="w-3 shrink-0 text-center text-xs font-bold"
            :class="
              item.rateDiff === 0
                ? 'invisible'
                : item.rateDiff > 0
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-red-600 dark:text-red-500/90'
            "
          >
            {{ item.rateDiff === 0 ? '–' : item.rateDiff > 0 ? '▲' : '▼' }}
          </span>
        </div>
      </div>
      <p v-else class="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
        {{ $t('chart.noData') }}
      </p>
    </div>

    <div
      class="rounded border border-gray-500/10 bg-shironezumi/3 p-2 dark:border-nalika-border dark:bg-nalika-surface"
    >
      <div class="mb-3 flex items-center justify-between">
        <h2
          class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted zh:tracking-normal"
        >
          {{ $t('chart.dist.wins') }}
        </h2>
        <button
          v-if="allWinRateDist.length > winRateDist.length"
          class="text-xxs font-medium text-ruri hover:underline"
          @click="viewAllModal = 'winrate'"
        >
          {{ $t('chart.dist.viewAll') }}
        </button>
      </div>
      <div v-if="winRateDist.length" class="space-y-2">
        <div v-for="item in winRateDist" :key="item.colors" class="flex items-center gap-2">
          <div class="flex shrink-0 items-center gap-0.5">
            <div
              v-for="dot in item.colorDots"
              :key="dot.name"
              class="inline-block h-2.5 w-2.5 rounded-full"
              :style="{ background: dot.hex }"
            />
          </div>
          <span
            class="w-6 shrink-0 text-center text-xs font-medium text-aisumicha dark:text-nalika-text"
          >
            {{ item.colorDots.map(d => (d.name ? colorName(d.name)[0] : '')).join('') }}
          </span>
          <div class="h-5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/70">
            <div
              class="h-full rounded-full"
              :style="{ width: `${item.barPercent}%`, background: item.barGradient }"
            />
          </div>
          <span
            class="w-12 text-right font-mono text-xs font-bold text-gray-600 dark:text-nalika-text-muted"
          >
            {{ item.winRate.toFixed(1) }}%
          </span>
          <span
            v-if="item.winRateDiff !== undefined"
            class="w-3 shrink-0 text-center text-xs font-bold"
            :class="
              item.winRateDiff === 0
                ? 'invisible'
                : item.winRateDiff > 0
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-red-600 dark:text-red-500/90'
            "
          >
            {{ item.winRateDiff === 0 ? '–' : item.winRateDiff > 0 ? '▲' : '▼' }}
          </span>
        </div>
      </div>
      <p v-else class="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
        {{ $t('chart.noData') }}
      </p>
    </div>
  </div>
</template>

<script setup>
const {
  currentSeries,
  previousSeries,
  allRows,
  totalSeriesDecks,
  totalSeriesWinnerDecks,
  aggregationResult,
  viewAllModal,
} = inject('meta')

const { tierDist, allColorDist, colorDist, allWinRateDist, winRateDist } = useDistributionData({
  currentSeries,
  previousSeries,
  allRows,
  totalSeriesDecks,
  totalSeriesWinnerDecks,
})
</script>
