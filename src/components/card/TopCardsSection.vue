<template>
  <div>
    <div class="mb-3">
      <div class="overflow-x-auto">
        <UiMetaTabGroup v-model="colorFilter" :options="colorTabOptions" class="xl:w-fit" />
      </div>
    </div>

    <CardMetaCardSection
      title="Top Signature Cards"
      :cards="filteredSigCards"
      @toggle-enlarge="enlargedCard = $event"
    >
      <template #footer="{ card }">
        <div class="mt-2 text-center font-mono text-xs text-gray-500 dark:text-nalika-text-muted">
          {{ card.archetypeCount }} archetypes
        </div>
      </template>
    </CardMetaCardSection>

    <CardMetaCardSection
      title="Top 10 Cards"
      :cards="filteredTopCards"
      empty-text="Select a series to view card data"
      @toggle-enlarge="enlargedCard = $event"
    >
      <template #tabs>
        <div class="ml-auto flex flex-col gap-2 sm:flex-row">
          <div class="flex justify-end overflow-x-auto">
            <UiMetaTabGroup v-model="cardTab" :options="cardMetricOptions" />
          </div>
          <div class="flex justify-end overflow-x-auto">
            <UiMetaTabGroup v-model="typeTab" :options="cardTypeOptions" />
          </div>
        </div>
      </template>
      <template #footer="{ card }">
        <div class="mt-2 flex flex-col items-center justify-center text-xs">
          <span class="font-mono text-gray-500 dark:text-nalika-text-muted" title="Decks included">
            {{ card.totalDecksIncluded }} ({{
              percentOf1(card.totalDecksIncluded, totalSeriesDecks)
            }}%)
          </span>
          <span
            v-if="cardTab === 'archetype'"
            class="font-mono text-blue-500 dark:text-blue-400"
            title="Archetypes"
          >
            {{ card.archetypeCount }}
            <span v-if="card.archetypeCount">
              ({{ percentOf1(card.archetypeCount, totalArchetypes) }}%)
            </span>
          </span>
          <span
            v-else
            class="font-mono text-yellow-600 dark:text-yellow-600"
            title="Champion decks"
          >
            {{ card.totalWinnerDecks }} ({{
              percentOf1(card.totalWinnerDecks, totalSeriesWinnerDecks)
            }}%)
          </span>
        </div>
      </template>
    </CardMetaCardSection>
  </div>
</template>

<script setup>
const {
  aggregationResult,
  totalSeriesDecks,
  totalArchetypes,
  totalSeriesWinnerDecks,
  enlargedCard,
} = inject('meta')

const {
  cardTab,
  typeTab,
  colorFilter,
  colorTabOptions,
  cardMetricOptions,
  cardTypeOptions,
  filteredSigCards,
  filteredTopCards,
} = useCardFiltering(aggregationResult)
</script>
