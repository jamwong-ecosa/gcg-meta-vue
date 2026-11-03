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
      ranked
      @toggle-enlarge="enlargedCard = $event"
    >
      <template #tabs>
        <span class="text-xxs text-gray-400 sm:ml-auto dark:text-gray-500">
          by decks in the archetypes built around the card
        </span>
      </template>
      <!-- Share of decks whose archetype is defined by the card -->
      <template #footer="{ card }">
        <div
          class="mt-2 flex flex-col gap-0.5 font-mono text-xs leading-tight whitespace-nowrap tabular-nums"
          :title="`${card.name}\nSignature of ${card.archetypeCount} archetypes with ${card.deckCount ?? '?'} decks`"
        >
          <span class="font-bold text-gray-600 dark:text-gray-400">
            {{ card.deckShare === undefined ? '—' : sharePct(card.deckShare / 100) }}% decks
          </span>
          <span class="truncate text-sky-700 dark:text-sky-400">
            {{ card.archetypeCount }} archetype{{ card.archetypeCount === 1 ? '' : 's' }}
          </span>
        </div>
      </template>
    </CardMetaCardSection>

    <CardMetaCardSection
      title="Top 10 Cards"
      :cards="filteredTopCards"
      ranked
      empty-text="Select a series to view card data"
      @toggle-enlarge="enlargedCard = $event"
    >
      <template #tabs>
        <div class="flex min-w-0 flex-col gap-2 sm:ml-auto sm:flex-row">
          <div class="overflow-x-auto sm:flex sm:justify-end">
            <UiMetaTabGroup v-model="cardTab" :options="cardMetricOptions" />
          </div>
          <div class="overflow-x-auto sm:flex sm:justify-end">
            <UiMetaTabGroup v-model="typeTab" :options="cardTypeOptions" />
          </div>
        </div>
      </template>
      <template #footer="{ card }">
        <CardMetaStats
          :card="card"
          :total-decks="totalSeriesDecks"
          :total-wins="totalSeriesWinnerDecks"
          :show-archetypes="cardTab === 'archetype'"
        />
      </template>
    </CardMetaCardSection>
  </div>
</template>

<script setup>
const { aggregationResult, totalSeriesDecks, totalSeriesWinnerDecks, enlargedCard } = inject('meta')

const {
  cardTab,
  typeTab,
  colorFilter,
  colorTabOptions,
  cardMetricOptions,
  cardTypeOptions,
  filteredSigCards,
  filteredTopCards,
} = useCardFiltering(aggregationResult, totalSeriesDecks)
</script>
