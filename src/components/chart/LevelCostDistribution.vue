<template>
  <div class="mb-6 grid gap-4 md:grid-cols-2">
    <ChartDistributionBars title="Level Distribution" :items="levelDist" color="#005caf" />
    <ChartDistributionBars title="Cost Distribution" :items="costDist" color="#0b346e" />
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
} = inject('meta')
const { levelDist, costDist } = useDistributionData({
  currentSeries,
  previousSeries,
  allRows,
  totalSeriesDecks,
  totalSeriesWinnerDecks,
  aggregationResult,
})
</script>
