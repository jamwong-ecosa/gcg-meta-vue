<template>
  <div class="mx-auto max-w-340 p-3 max-sm:pb-6 md:p-8">
    <UiSeriesHeader
      title="Meta Overview"
      :visible="!!currentSeries"
      :events="currentSeries?.events ?? 0"
      :wins="totalSeriesWinnerDecks"
      :decks="currentSeries?.totalDecks ?? 0"
      :archetypes="allRows.length"
    />

    <div
      class="sticky top-12 z-40 -mx-3 mb-3 bg-white px-3 py-3 transition-transform duration-300 md:-mx-8 md:px-8 dark:bg-nalika-bg"
      :class="hideFilter ? '-translate-y-full' : 'translate-y-0'"
    >
      <UiGeneralDropdown
        v-model="selectedKey"
        class="ml-auto w-fit md:max-w-md"
        :options="seriesOptions"
      />
    </div>

    <CardStatsSection />

    <ChartDistributionsGrid />

    <ArchetypeQuadrantsSection />

    <UiViewAllModal
      :visible="!!viewAllModal"
      :items="viewAllModal === 'colors' ? allColorDist : allWinRateDist"
      :mode="viewAllModal || 'colors'"
      :title="viewAllModal === 'colors' ? 'Color Distribution' : 'Events Won by Color Combo'"
      @close="viewAllModal = null"
    />

    <UiSeriesComparisonCards />

    <CardStateCards />

    <ChartLevelCostDistribution />

    <CardTopCardsSection />

    <CardNewcomersSection />

    <ChartCardQuadrantsSection />

    <CardImageOverlay v-model="enlargedCard" />
  </div>
</template>

<script setup>
const {
  seriesOptions,
  selectedKey,
  currentSeries,
  totalSeriesDecks,
  totalSeriesWinnerDecks,
  previousSeries,
  eventCutoffDate,
  eventMinDate,
  seriesTimeline,
  hideFilter,
  allRows,
  totalArchetypes,
  quadrantData,
} = useSeriesState()

const { aggregationResult, cardMeta, cardInfoById, loadCardData } = useCardData(selectedKey)

const { loadTierData } = useTierData()

const enlargedCard = ref(null)
const viewAllModal = ref(null)

provide('meta', {
  seriesOptions,
  selectedKey,
  currentSeries,
  totalSeriesDecks,
  totalSeriesWinnerDecks,
  previousSeries,
  eventCutoffDate,
  eventMinDate,
  seriesTimeline,
  allRows,
  totalArchetypes,
  quadrantData,
  aggregationResult,
  cardMeta,
  cardInfoById,
  enlargedCard,
  viewAllModal,
})

const { allColorDist, allWinRateDist } = useDistributionData({
  currentSeries,
  previousSeries,
  allRows,
  totalSeriesDecks,
  totalSeriesWinnerDecks,
  aggregationResult,
})

await loadTierData()
await loadCardData(selectedKey.value)
</script>
