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
          <h4 class="mb-2 text-lg font-semibold tracking-wider text-gray-600 dark:text-nalika-text">
            Unit: Core
          </h4>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ArchetypeCardItem
              v-for="card in coreUnits"
              :key="card.cardId"
              :card="card"
              :is-sig="sigCardIds.has(card.cardId)"
              :is-new="isNewCard(card.cardId)"
            />
          </div>
          <p v-if="!coreUnits.length" class="text-xs text-gray-400 dark:text-gray-500">No cards</p>
        </div>
        <div class="border-t border-gray-200 pt-3 dark:border-gray-700">
          <h4 class="mb-2 text-lg font-semibold tracking-wider text-gray-600 dark:text-nalika-text">
            Unit: Other
          </h4>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ArchetypeCardItem
              v-for="card in otherUnits"
              :key="card.cardId"
              :card="card"
              :is-sig="sigCardIds.has(card.cardId)"
              :is-new="isNewCard(card.cardId)"
            />
          </div>
          <p v-if="!otherUnits.length" class="text-xs text-gray-400 dark:text-gray-500">No cards</p>
        </div>
      </div>

      <!-- Right: Pilots, Commands, Bases -->
      <div class="space-y-4">
        <div v-if="pilotCards.length">
          <h4 class="mb-2 text-lg font-semibold tracking-wider text-gray-600 dark:text-nalika-text">
            Pilot
          </h4>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ArchetypeCardItem
              v-for="card in pilotCards"
              :key="card.cardId"
              :card="card"
              :is-sig="sigCardIds.has(card.cardId)"
              :is-new="isNewCard(card.cardId)"
            />
          </div>
        </div>
        <div v-if="commandCards.length" class="border-t border-gray-200 pt-3 dark:border-gray-700">
          <h4 class="mb-2 text-lg font-semibold tracking-wider text-gray-600 dark:text-nalika-text">
            Command
          </h4>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ArchetypeCardItem
              v-for="card in commandCards"
              :key="card.cardId"
              :card="card"
              :is-sig="sigCardIds.has(card.cardId)"
              :is-new="isNewCard(card.cardId)"
            />
          </div>
        </div>
        <div v-if="baseCards.length" class="border-t border-gray-200 pt-3 dark:border-gray-700">
          <h4 class="mb-2 text-lg font-semibold tracking-wider text-gray-600 dark:text-nalika-text">
            Base
          </h4>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ArchetypeCardItem
              v-for="card in baseCards"
              :key="card.cardId"
              :card="card"
              :is-sig="sigCardIds.has(card.cardId)"
              :is-new="isNewCard(card.cardId)"
            />
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

    <!-- Level & Cost Distribution -->
    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <ChartDistributionBars title="Level Distribution" :items="levelDist" color="#005caf" />
      <ChartDistributionBars title="Cost Distribution" :items="costDist" color="#0b346e" />
    </div>

    <!-- Other Cards (collapsible) -->
    <UiCollapsibleSection
      v-if="filteredByType.length"
      :show="showOther"
      :count="archetype.filteredCards.length"
      title="Other Cards"
      content-class="space-y-4"
      root-class="mt-6"
      @toggle="showOther = !showOther"
    >
      <div v-for="[type, cards] in filteredByType" :key="type">
        <h5 class="mb-2 text-lg font-semibold tracking-wider text-gray-600 dark:text-nalika-text">
          {{ typeLabel[type] || type }}
        </h5>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-8">
          <ArchetypeCardItem
            v-for="card in cards"
            :key="card.cardId"
            :card="card"
            :is-sig="sigCardIds.has(card.cardId)"
            :is-new="isNewCard(card.cardId)"
          />
        </div>
      </div>
    </UiCollapsibleSection>

    <!-- Removed Cards (collapsible) -->
    <UiCollapsibleSection
      v-if="removedCards.length"
      :show="showRemoved"
      :count="removedCards.length"
      title="Removed Cards"
      content-class="space-y-4"
      @toggle="showRemoved = !showRemoved"
    >
      <div v-for="[type, cards] in removedGrouped" :key="type">
        <h5 class="mb-2 text-lg font-semibold tracking-wider text-gray-600 dark:text-nalika-text">
          {{ typeLabel[type] || type }}
        </h5>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-8">
          <ArchetypeCardItem v-for="card in cards" :key="card.cardId" :card="card" is-removed />
        </div>
      </div>
    </UiCollapsibleSection>

    <!-- Deck URLs (hidden, toggle) -->
    <UiCollapsibleSection
      v-if="archetype.deckUrls?.length"
      :show="showDeckUrls"
      :count="archetype.deckUrls.length"
      title="Deck URLs"
      @toggle="showDeckUrls = !showDeckUrls"
    >
      <div
        class="mb-1 text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500"
      >
        Winner Decks
      </div>
      <div class="flex flex-wrap gap-x-5 gap-y-2.5">
        <UiDeckPopover
          v-for="(d, i) in winnerDeckPreviews"
          :key="d.url"
          :cards="d.cards"
          :url="d.url"
          :label="'Deck ' + (i + 1)"
          class="flex items-center gap-2"
        >
          <a
            :href="d.url"
            target="_blank"
            rel="noopener"
            class="text-xs break-all text-ruri hover:underline dark:text-sora/65"
          >
            Deck {{ i + 1 }}
          </a>
          <span
            class="rounded bg-yellow-100 px-1 text-xxs font-medium text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300/70"
          >
            W
          </span>
        </UiDeckPopover>
      </div>
      <div v-if="!winnerDeckPreviews.length" class="text-xs text-gray-400 dark:text-gray-500">
        No winner decks
      </div>
      <div
        class="mt-3 mb-1 text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500"
      >
        Other Decks
      </div>

      <div class="flex flex-wrap gap-x-5 gap-y-2.5">
        <UiDeckPopover
          v-for="(d, i) in otherDeckPreviews"
          :key="d.url"
          :cards="d.cards"
          :url="d.url"
          :label="'Deck ' + (i + 1)"
        >
          <a
            :href="d.url"
            target="_blank"
            rel="noopener"
            class="text-xs break-all text-ruri hover:underline dark:text-sora/65"
          >
            Deck {{ i + 1 }}
          </a>
        </UiDeckPopover>
      </div>
    </UiCollapsibleSection>
  </div>
</template>

<script setup>
const props = defineProps({
  archetype: { type: Object, required: true },
  prevCardIds: { type: Set, default: null },
  removedCards: { type: Array, default: () => [] },
})

const isNewCard = cardId => props.prevCardIds?.size > 0 && !props.prevCardIds.has(cardId)

const { showOther, showDeckUrls, showRemoved } = useCollapseState()

const sigCardIds = computed(() => new Set(props.archetype.sigCardIds ?? []))

const cardIdToName = computed(() => {
  const map = new Map()
  for (const c of props.archetype.cards ?? []) {
    map.set(c.cardId, c.name)
  }
  for (const c of props.archetype.filteredCards ?? []) {
    map.set(c.cardId, c.name)
  }
  return map
})

const cardIdToInfo = computed(() => {
  const map = new Map()
  for (const c of props.archetype.cards ?? []) {
    map.set(c.cardId, {
      type: c.type,
      color: c.color,
      level: Number(c.level),
      cost: Number(c.cost),
      inclusionRate: c.inclusionRate ?? 0,
    })
  }
  for (const c of props.archetype.filteredCards ?? []) {
    map.set(c.cardId, {
      type: c.type,
      color: c.color,
      level: Number(c.level),
      cost: Number(c.cost),
      inclusionRate: c.inclusionRate ?? 0,
    })
  }
  return map
})

const deckPreviews = computed(() =>
  (props.archetype.deckUrls ?? []).map((url, i) => {
    const infoMap = cardIdToInfo.value
    const cards = (props.archetype.deckCardIds?.[i] ?? '')
      .split('|')
      .filter(Boolean)
      .map(part => {
        const [cardId, qty] = part.split(':')
        const info = infoMap.get(cardId)
        return {
          cardId,
          qty: Number(qty),
          name: cardIdToName.value.get(cardId) ?? cardId,
          type: info?.type ?? 'UNIT',
          color: info?.color ?? '',
          level: info?.level ?? 0,
          cost: info?.cost ?? 0,
          inclusionRate: info?.inclusionRate ?? 0,
        }
      })
    return { url, idx: i, isWinner: props.archetype.deckWinnerFlags?.[i] ?? false, cards }
  }),
)

const unitCards = computed(() => props.archetype.cards.filter(c => c.type === 'UNIT'))
const coreUnits = computed(() => unitCards.value.filter(c => (c.inclusionRate ?? 0) >= 0.75))
const otherUnits = computed(() => unitCards.value.filter(c => (c.inclusionRate ?? 0) < 0.75))
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

const removedGrouped = computed(() => {
  const byType = {}
  for (const card of props.removedCards) {
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

const winnerDeckPreviews = computed(() => deckPreviews.value.filter(d => d.isWinner))
const otherDeckPreviews = computed(() => deckPreviews.value.filter(d => !d.isWinner))

const levelDist = computed(() => {
  const cards = props.archetype.cards ?? []
  const counts = {}
  const qtySums = {}
  for (const card of cards) {
    const lv = parseInt(card.level)
    if (lv >= 1 && lv <= 9) {
      counts[lv] = (counts[lv] || 0) + 1
      qtySums[lv] = (qtySums[lv] || 0) + (card.avgQty || 0)
    }
  }
  return Array.from({ length: 9 }, (_, i) => ({
    label: i + 1,
    count: counts[i + 1] || 0,
    sumAvgQty: Math.round(qtySums[i + 1] || 0),
  }))
})

const costDist = computed(() => {
  const cards = props.archetype.cards ?? []
  const counts = {}
  const qtySums = {}
  for (const card of cards) {
    const c = parseInt(card.cost)
    if (c >= 1 && c <= 9) {
      counts[c] = (counts[c] || 0) + 1
      qtySums[c] = (qtySums[c] || 0) + (card.avgQty || 0)
    }
  }
  return Array.from({ length: 9 }, (_, i) => ({
    label: i + 1,
    count: counts[i + 1] || 0,
    sumAvgQty: Math.round(qtySums[i + 1] || 0),
  }))
})
</script>
