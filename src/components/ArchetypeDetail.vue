<template>
  <div>
    <!-- Type counts -->
    <div class="mb-4 flex gap-3 text-xs text-gray-500 dark:text-nalika-text-muted">
      <span v-if="unitCards.length">
        UNIT:
        <span class="font-mono font-bold text-gray-700 dark:text-nalika-text">
          {{ unitCards.length }}
        </span>
      </span>
      <span v-if="pilotCards.length">
        PILOT:
        <span class="font-mono font-bold text-gray-700 dark:text-nalika-text">
          {{ pilotCards.length }}
        </span>
      </span>
      <span v-if="commandCards.length">
        COMMAND:
        <span class="font-mono font-bold text-gray-700 dark:text-nalika-text">
          {{ commandCards.length }}
        </span>
      </span>
      <span v-if="baseCards.length">
        BASE:
        <span class="font-mono font-bold text-gray-700 dark:text-nalika-text">
          {{ baseCards.length }}
        </span>
      </span>
    </div>

    <!-- Card grid: Units + Pilots/Commands/Bases -->
    <div class="grid gap-4 md:grid-cols-2">
      <!-- Left: Units -->
      <div class="space-y-4">
        <div>
          <h4 class="mb-2 text-xs font-semibold text-gray-600 dark:text-nalika-text">Unit: Core</h4>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ArchetypeCardItem v-for="card in coreUnits" :key="card.cardId" :card="card" />
          </div>
          <p v-if="!coreUnits.length" class="text-xs text-gray-400 dark:text-gray-500">No cards</p>
        </div>
        <div class="border-t border-gray-200 pt-3 dark:border-gray-700">
          <h4 class="mb-2 text-xs font-semibold text-gray-600 dark:text-nalika-text">
            Unit: Other
          </h4>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ArchetypeCardItem v-for="card in otherUnits" :key="card.cardId" :card="card" />
          </div>
          <p v-if="!otherUnits.length" class="text-xs text-gray-400 dark:text-gray-500">No cards</p>
        </div>
      </div>

      <!-- Right: Pilots, Commands, Bases -->
      <div class="space-y-4">
        <div v-if="pilotCards.length">
          <h4 class="mb-2 text-xs font-semibold text-gray-600 dark:text-nalika-text">Pilot</h4>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ArchetypeCardItem v-for="card in pilotCards" :key="card.cardId" :card="card" />
          </div>
        </div>
        <div v-if="commandCards.length" class="border-t border-gray-200 pt-3 dark:border-gray-700">
          <h4 class="mb-2 text-xs font-semibold text-gray-600 dark:text-nalika-text">Command</h4>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ArchetypeCardItem v-for="card in commandCards" :key="card.cardId" :card="card" />
          </div>
        </div>
        <div v-if="baseCards.length" class="border-t border-gray-200 pt-3 dark:border-gray-700">
          <h4 class="mb-2 text-xs font-semibold text-gray-600 dark:text-nalika-text">Base</h4>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ArchetypeCardItem v-for="card in baseCards" :key="card.cardId" :card="card" />
          </div>
        </div>
      </div>
    </div>

    <!-- Feature badges -->
    <div v-if="archetype.featureBadges?.length" class="mt-4 flex flex-wrap gap-1.5">
      <span
        v-for="[feat, count] in archetype.featureBadges"
        :key="feat"
        class="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
      >
        <span class="mr-1 text-xxs">{{ feat.replace(/[〔〕]/g, '') }}:</span>
        <span class="font-mono text-gray-500 dark:text-gray-400">{{ count }}</span>
      </span>
    </div>

    <!-- Other Cards (collapsible) -->
    <div v-if="filteredByType.length" class="mt-4">
      <button
        class="text-xs font-medium text-primary hover:underline focus:outline-none"
        @click="showOther = !showOther"
      >
        Other Cards ({{ archetype.filteredCards.length }}) {{ showOther ? '−' : '+' }}
      </button>
      <div v-if="showOther" class="mt-2 space-y-4">
        <div v-for="[type, cards] in filteredByType" :key="type">
          <h5 class="mb-2 text-xs font-semibold text-gray-600 dark:text-nalika-text">
            {{ typeLabel[type] || type }}
          </h5>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-8">
            <ArchetypeCardItem v-for="card in cards" :key="card.cardId" :card="card" />
          </div>
        </div>
      </div>
    </div>

    <!-- Deck URLs (hidden, toggle) -->
    <div v-if="archetype.deckUrls?.length" class="mt-4">
      <button
        class="text-xs font-medium text-primary hover:underline focus:outline-none"
        @click="showDeckUrls = !showDeckUrls"
      >
        Deck URLs ({{ archetype.deckUrls.length }}) {{ showDeckUrls ? '−' : '+' }}
      </button>
      <div v-if="showDeckUrls" class="mt-2 space-y-1">
        <div
          class="mb-1 text-xxs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500"
        >
          Winner Decks
        </div>
        <div class="flex flex-wrap gap-x-6 gap-y-3">
          <div v-for="(url, i) in winnerDeckUrls" :key="url" class="flex items-center gap-2">
            <a
              :href="url"
              target="_blank"
              rel="noopener"
              class="text-xs break-all text-primary hover:underline"
            >
              Deck {{ i + 1 }}
            </a>
            <span
              class="rounded bg-yellow-100 px-1 text-[0.55rem] font-medium text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
            >
              W
            </span>
          </div>
        </div>
        <div v-if="!winnerDeckUrls.length" class="text-xs text-gray-400 dark:text-gray-500">
          No winner decks
        </div>
        <div
          class="mt-3 mb-1 text-xxs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500"
        >
          Other Decks
        </div>

        <div class="flex flex-wrap gap-x-6 gap-y-3">
          <div v-for="(url, i) in otherDeckUrls" :key="url">
            <a
              :href="url"
              target="_blank"
              rel="noopener"
              class="text-xs break-all text-primary hover:underline"
            >
              Deck {{ i + 1 }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  archetype: { type: Object, required: true },
})

const showOther = ref(false)
const showDeckUrls = ref(false)

const unitCards = computed(() => props.archetype.cards.filter(c => c.type === 'UNIT'))
const coreUnits = computed(() => unitCards.value.filter(c => (c.inclusionRate ?? 0) >= 0.6))
const otherUnits = computed(() => unitCards.value.filter(c => (c.inclusionRate ?? 0) < 0.6))
const pilotCards = computed(() => props.archetype.cards.filter(c => c.type === 'PILOT'))
const commandCards = computed(() => props.archetype.cards.filter(c => c.type === 'COMMAND'))
const baseCards = computed(() => props.archetype.cards.filter(c => c.type === 'BASE'))

const filteredCards = computed(() => props.archetype.filteredCards || [])

const filteredByType = computed(() => {
  const byType = {}
  for (const card of filteredCards.value) {
    if (!byType[card.type]) {
      byType[card.type] = []
    }
    byType[card.type].push(card)
  }
  return Object.entries(byType)
})

const typeLabel = {
  UNIT: 'Unit',
  PILOT: 'Pilot',
  COMMAND: 'Command',
  BASE: 'Base',
}

const winnerDeckUrls = computed(
  () => props.archetype.deckUrls?.filter((_, i) => props.archetype.deckWinnerFlags?.[i]) ?? [],
)
const otherDeckUrls = computed(
  () => props.archetype.deckUrls?.filter((_, i) => !props.archetype.deckWinnerFlags?.[i]) ?? [],
)
</script>
