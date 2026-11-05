<template>
  <CardMetaCardSection
    :title="$t('card.newcomers.title')"
    :cards="recentlyUsedCards"
    :empty-text="$t('card.newcomers.empty')"
    @toggle-enlarge="enlargedCard = $event"
  >
    <template #footer="{ card }">
      <CardMetaStats
        :card="card"
        :total-decks="totalSeriesDecks"
        :total-wins="totalSeriesWinnerDecks"
      />
    </template>
  </CardMetaCardSection>
</template>

<script setup>
const {
  cardMeta,
  aggregationResult,
  eventCutoffDate,
  eventMinDate,
  currentSeries,
  totalSeriesDecks,
  totalSeriesWinnerDecks,
  enlargedCard,
} = inject('meta')

const colorFilter = useColorFilter()
const { recentlyUsedCards } = useCardEligibility({
  cardMeta,
  aggregationResult,
  eventCutoffDate,
  eventMinDate,
  colorFilter,
  currentSeries,
})
</script>
