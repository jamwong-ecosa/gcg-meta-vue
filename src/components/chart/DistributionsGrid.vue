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

      <!-- Phones: one stacked bar and a key, instead of a bar per tier -->
      <div class="md:hidden">
        <div class="flex h-2 gap-px overflow-hidden rounded-full">
          <span
            v-for="item in tierDist"
            :key="item.tier"
            :class="tierBarClass(item.tier)"
            :style="{ flexGrow: item.count }"
          />
        </div>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <li v-for="item in tierDist" :key="item.tier" class="flex items-center gap-1.5">
            <span
              class="w-5 rounded text-center text-xxs font-bold"
              :class="tierPillClass(item.tier)"
            >
              {{ item.tier }}
            </span>
            <span class="font-mono font-bold text-gray-700 tabular-nums dark:text-nalika-text">
              {{ item.count }}
            </span>
          </li>
        </ul>
      </div>

      <div class="space-y-2 max-md:hidden">
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

    <!-- Usage and wins by colour combo: two cards from md up; on phones one card
         with a switch between them, since they are the same kind of chart -->
    <div
      v-for="panel in panels"
      :key="panel.key"
      class="rounded border border-gray-500/10 bg-shironezumi/3 p-2 dark:border-nalika-border dark:bg-nalika-surface"
      :class="panel.key !== activePanel && 'max-md:hidden'"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <h2
          class="text-sm font-bold tracking-wider text-gray-600 uppercase max-md:hidden dark:text-nalika-text-muted zh:tracking-normal"
        >
          {{ panel.title }}
        </h2>
        <UiMetaTabGroup v-model="activePanel" class="md:hidden" :options="panelOptions" />
        <button
          v-if="panel.hasMore"
          class="text-xxs font-medium text-ruri hover:underline"
          @click="viewAllModal = panel.modal"
        >
          {{ $t('chart.dist.viewAll') }}
        </button>
      </div>
      <div v-if="panel.rows.length" class="space-y-2.5 md:space-y-2">
        <div v-for="row in panel.rows" :key="row.key" class="flex items-center gap-2">
          <!-- Fixed width, so the bars line up whether a row has one dot or two -->
          <div class="flex w-14 shrink-0 items-center gap-1.5">
            <span class="flex w-5 shrink-0 gap-0.5">
              <span
                v-for="dot in row.dots"
                :key="dot.name"
                class="inline-block size-2 rounded-full md:size-2.5"
                :style="{ background: dot.hex }"
              />
            </span>
            <span class="text-xs font-medium text-aisumicha dark:text-nalika-text">
              {{ row.label }}
            </span>
          </div>
          <div
            class="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 md:h-5 dark:bg-gray-700/70"
          >
            <div
              class="h-full rounded-full"
              :style="{ width: `${row.barPercent}%`, background: row.gradient }"
            />
          </div>
          <span
            class="w-12 text-right font-mono text-xs font-bold text-gray-600 dark:text-nalika-text-muted"
          >
            {{ row.value.toFixed(1) }}%
          </span>
          <span
            v-if="row.diff !== undefined"
            class="w-3 shrink-0 text-center text-xs font-bold"
            :class="
              row.diff === 0
                ? 'invisible'
                : row.diff > 0
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-red-600 dark:text-red-500/90'
            "
          >
            {{ row.diff === 0 ? '–' : row.diff > 0 ? '▲' : '▼' }}
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

const { t } = useI18n()

// Phones only: which of the two colour-combo charts is showing
const activePanel = ref('colors')
const panelOptions = computed(() => [
  { value: 'colors', label: t('chart.dist.colorTab') },
  { value: 'wins', label: t('chart.dist.winsTab') },
])

const comboLabel = dots => dots.map(d => (d.name ? colorName(d.name)[0] : '')).join('')

// Both charts as the same row shape, so one template draws either
const panels = computed(() => [
  {
    key: 'colors',
    modal: 'colors',
    title: t('chart.dist.color'),
    hasMore: allColorDist.value.length > colorDist.value.length,
    rows: colorDist.value.map(item => ({
      key: item.colors,
      dots: item.colorDots,
      label: item.isOther ? t('chart.other') : comboLabel(item.colorDots),
      barPercent: item.percent,
      gradient: item.barGradient,
      value: item.rate,
      diff: item.rateDiff,
    })),
  },
  {
    key: 'wins',
    modal: 'winrate',
    title: t('chart.dist.wins'),
    hasMore: allWinRateDist.value.length > winRateDist.value.length,
    rows: winRateDist.value.map(item => ({
      key: item.colors,
      dots: item.colorDots,
      label: comboLabel(item.colorDots),
      barPercent: item.barPercent,
      gradient: item.barGradient,
      value: item.winRate,
      diff: item.winRateDiff,
    })),
  },
])
</script>
