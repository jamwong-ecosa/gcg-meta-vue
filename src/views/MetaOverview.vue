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
