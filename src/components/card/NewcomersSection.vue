<template>
  <CardMetaCardSection
    title="Newcomers"
    :cards="recentlyUsedCards"
    empty-text="No new cards used"
    @toggle-enlarge="enlargedCard = $event"
  >
    <template #footer="{ card }">
      <div class="mt-2 flex flex-col items-center justify-center text-xs">
        <span class="font-mono text-gray-500 dark:text-nalika-text-muted" title="Decks included">
          {{ card.totalDecksIncluded }} ({{
            percentOf1(card.totalDecksIncluded, totalSeriesDecks)
          }}%)
        </span>
        <span class="font-mono text-yellow-600 dark:text-yellow-600" title="Champion decks">
          {{ card.totalWinnerDecks }} ({{
            percentOf1(card.totalWinnerDecks, totalSeriesWinnerDecks)
          }}%)
        </span>
      </div>
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
