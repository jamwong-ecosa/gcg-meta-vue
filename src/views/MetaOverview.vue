<template>
  <div class="mx-auto max-w-340 p-3 max-sm:pb-6 md:p-8">
    <UiSeriesHeader
      title="Meta Overview"
      :visible="!!currentSeries"
      :events="currentSeries?.events ?? 0"
      :wins="currentSeries?.winDecks ?? 0"
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

    <CardStatsSection
      :total-card-count="totalCardCount"
      :used-card-count="usedCardCount"
      :series-timeline="seriesTimeline"
      :color-counts="colorCounts"
      :archetype-product-groups="archetypeProductGroups"
    />

    <ChartDistributionsGrid
      :tier-dist="tierDist"
      :color-dist="colorDist"
      :all-color-dist="allColorDist"
      :win-rate-dist="winRateDist"
      :all-win-rate-dist="allWinRateDist"
      @view-all="viewAllModal = $event"
    />

    <ArchetypeQuadrantsSection :quadrant-data="quadrantData" />

    <UiViewAllModal
      :visible="!!viewAllModal"
      :items="viewAllModal === 'colors' ? allColorDist : allWinRateDist"
      :mode="viewAllModal || 'colors'"
      :title="viewAllModal === 'colors' ? 'Color Distribution' : 'Events Won by Color Combo'"
      @close="viewAllModal = null"
    />

    <UiSeriesComparisonCards
      :series-comparison="seriesComparison"
      :previous-series="previousSeries"
    />

    <CardStateCards :card-state-comparison="cardStateComparison" />

    <ChartLevelCostDistribution :level-dist="levelDist" :cost-dist="costDist" />

    <CardTopCardsSection
      v-model:color-filter="colorFilter"
      v-model:card-tab="cardTab"
      v-model:type-tab="typeTab"
      :filtered-sig-cards="filteredSigCards"
      :filtered-top-cards="filteredTopCards"
      :color-tab-options="colorTabOptions"
      :card-metric-options="cardMetricOptions"
      :card-type-options="cardTypeOptions"
      :percent-of1="percentOf1"
      :total-series-decks="totalSeriesDecks"
      :total-archetypes="totalArchetypes"
      :total-series-winner-decks="totalSeriesWinnerDecks"
      @toggle-enlarge="toggleEnlarge"
    />

    <CardNewcomersSection
      :recently-used-cards="recentlyUsedCards"
      :percent-of1="percentOf1"
      :total-series-decks="totalSeriesDecks"
      :total-series-winner-decks="totalSeriesWinnerDecks"
      @toggle-enlarge="toggleEnlarge"
    />

    <ChartCardQuadrantsSection
      v-model:card-type-chart="cardTypeChart"
      :card-type-options="cardTypeOptions"
      :filtered-card-items="filteredCardItems"
      :selected-key="selectedKey"
    />

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
  percentOf1,
  previousSeries,
  eventCutoffDate,
  eventMinDate,
  seriesTimeline,
  hideFilter,
  allRows,
  totalArchetypes,
  quadrantData,
} = useSeriesState()

const { loadTierData } = useTierData()
const { aggregationResult, cardMeta, cardInfoById, loadCardData } =
  useCardData(selectedKey)
const {
  cardTab,
  typeTab,
  colorFilter,
  cardTypeChart,
  colorTabOptions,
  cardMetricOptions,
  cardTypeOptions,
  filteredCardItems,
  filteredSigCards,
  filteredTopCards,
} = useCardFiltering(aggregationResult)
const { totalCardCount, usedCardCount, recentlyUsedCards } = useCardEligibility({
  cardMeta,
  aggregationResult,
  eventCutoffDate,
  eventMinDate,
  colorFilter,
  currentSeries,
})
const { tierDist, allColorDist, colorDist, allWinRateDist, winRateDist, levelDist, costDist } =
  useDistributionData({
    currentSeries,
    previousSeries,
    allRows,
    totalSeriesDecks,
    totalSeriesWinnerDecks,
    aggregationResult,
  })
const { seriesComparison, cardStateComparison } = useSeriesComparison({
  currentSeries,
  previousSeries,
  allColorDist,
})
const { archetypeProductGroups, colorCounts } = useProductGroups({
  aggregationResult,
  cardInfoById,
  eventMinDate,
  eventCutoffDate,
})

const enlargedCard = ref(null)
const viewAllModal = ref(null)

function toggleEnlarge(cardId) {
  enlargedCard.value = enlargedCard.value === cardId ? null : cardId
}

await loadTierData()
await loadCardData(selectedKey.value)
</script>
