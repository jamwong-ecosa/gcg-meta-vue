<template>
  <div>
    <!-- Average deck: copies per type across all of this archetype's decks -->
    <div
      class="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-nalika-text-muted"
    >
      <span class="font-semibold tracking-wider text-gray-400 uppercase">Avg deck</span>
      <span v-for="t in avgDeck" :key="t.type">
        <span class="font-mono font-bold text-gray-700 tabular-nums dark:text-nalika-text">
          {{ t.copies }}
        </span>
        {{ t.label }}
      </span>
    </div>

    <!-- Staples and flex share one layout: compact cards in one width-filling grid
         per section. Hover a card for its numbers, click to enlarge -->
    <section v-for="sec in cardSections" :key="sec.key" class="mb-5">
      <h4 class="mb-1 flex flex-wrap items-baseline gap-x-2">
        <span class="text-lg font-semibold tracking-wider text-gray-600 dark:text-nalika-text">
          {{ sec.title }}
        </span>
        <span class="text-xs text-gray-400 dark:text-gray-500">{{ sec.subtitle }}</span>
      </h4>
      <!-- Legend, once, under the first heading: short keys, details on hover -->
      <p
        v-if="sec === cardSections[0]"
        class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xxs whitespace-nowrap text-gray-400 dark:text-gray-500"
      >
        <UiHint text="Copies per deck that runs it">
          <b class="font-semibold text-gray-500 dark:text-gray-400">×</b>
          copies
        </UiHint>
        <UiHint
          text="How often this archetype's decks won their event (1st, or 2nd at 16+ players) with the card minus without, in points. Green or red when the gap is clear; grey when it could be chance; hidden when either side has under 20 decks. Shows what winning lists run, not that the card causes wins"
        >
          <b class="font-semibold text-gray-500 dark:text-gray-400">WR ±</b>
          event wins, with card vs without
        </UiHint>
        <UiHint class="flex items-center gap-1" text="Signature card of the archetype">
          <span class="rounded-sm bg-black/70 px-1 font-bold text-yellow-300">★ SIG</span>
        </UiHint>
        <UiHint
          class="flex items-center gap-1"
          text="Top tech pick: uncommon, but its decks win well"
        >
          <span class="rounded-sm bg-yellow-400 px-1 font-bold text-yellow-950">TECH</span>
        </UiHint>
        <UiHint
          v-if="prevCardIds?.size"
          class="flex items-center gap-1"
          text="Not played by this archetype last series"
        >
          <span class="rounded-sm bg-green-600 px-1 font-bold text-white">NEW</span>
        </UiHint>
        <UiHint
          class="flex items-center gap-1"
          text="Same card under another name. “any”: decks running any version; “all”: decks running every version. One WR for the group"
        >
          <span
            class="rounded-sm border border-dashed border-sky-400 px-1 font-mono font-semibold text-sky-700 dark:text-sky-400"
          >
            ≡ %
          </span>
          same card
        </UiHint>
      </p>
      <div v-else class="mb-3" />
      <ArchetypeCardGrid
        :cards="sec.cards"
        :lift-of="winLift"
        :group-lift-of="groupWinLift"
        :deck-count="archetype.deckCount"
        :sig-ids="sigCardIds"
        :is-new="isNewCard"
        @zoom="enlargedCardId = $event"
      />
    </section>

    <CardImageOverlay v-model="enlargedCardId" :z-index="1100" />

    <!-- Deck curve: copies per average deck at each level and cost, by type -->
    <div class="mt-6 grid gap-4 md:grid-cols-2">
      <ChartDeckCurve
        title="Level"
        field="level"
        :cards="allCards"
        :deck-count="archetype.deckCount"
      />
      <ChartDeckCurve
        title="Cost"
        field="cost"
        :cards="allCards"
        :deck-count="archetype.deckCount"
      />
    </div>

    <!-- Traits: copies per average deck carrying each trait -->
    <div v-if="traits.length" class="mt-4">
      <h4 class="mb-1.5 flex flex-wrap items-baseline gap-x-2">
        <span
          class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted"
        >
          Traits
        </span>
        <span class="text-xxs text-gray-400 dark:text-gray-500">
          cards with the trait, among those in {{ FEATURED_MIN * 100 }}%+ of decks
        </span>
      </h4>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="t in traits"
          :key="t.name"
          class="flex items-baseline gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          :title="t.title"
        >
          {{ t.name }}
          <b class="font-mono text-gray-900 tabular-nums dark:text-nalika-text">
            {{ t.names.length }}
          </b>
        </span>
      </div>
    </div>

    <!-- Other Cards (collapsible) -->
    <UiCollapsibleSection
      v-if="otherCards.length"
      :show="showOther"
      :count="otherCards.length"
      title="Other Cards"
      content-class="space-y-4"
      root-class="mt-6"
      @toggle="showOther = !showOther"
    >
      <ArchetypeCardGrid
        :cards="otherCards"
        :lift-of="winLift"
        :group-lift-of="groupWinLift"
        :deck-count="archetype.deckCount"
        :sig-ids="sigCardIds"
        :is-new="isNewCard"
        @zoom="enlargedCardId = $event"
      />
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
      <ArchetypeCardGrid :cards="removedCards" removed @zoom="enlargedCardId = $event" />
    </UiCollapsibleSection>

    <!-- Decks (hidden, toggle) -->
    <UiCollapsibleSection
      v-if="archetype.deckCardIds?.length"
      :show="showDeckUrls"
      :count="archetype.deckCardIds.length"
      title="Decks"
      @toggle="showDeckUrls = !showDeckUrls"
    >
      <ArchetypeDeckList :decks="deckPreviews" :sig-ids="sigCardIds" :is-new="isNewCard" />
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
  (props.archetype.deckCardIds ?? []).map((cardStr, i) => {
    const url = props.archetype.deckUrls?.[i] ?? ''
    const infoMap = cardIdToInfo.value
    const cards = cardStr
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
    const meta = props.archetype.deckMeta?.[i] ?? {}
    return {
      url,
      idx: i,
      isWinner: props.archetype.deckWinnerFlags?.[i] ?? false,
      cards,
      date: meta.date ?? null,
      shop: meta.shop ?? '',
      place: meta.place ?? null,
    }
  }),
)

const enlargedCardId = ref(null)

// Featured cards are those in more than FEATURED_MIN of decks (see build-tiers);
// at STAPLE_MIN and up a card is a given, so it only gets a thumbnail
const FEATURED_MIN = 0.1
const STAPLE_MIN = 0.9
const TYPES = ['UNIT', 'PILOT', 'COMMAND', 'BASE']

// Same-effect versions (effectGroup, see build-tiers) stay together: each card
// is placed by its group's most-played member, so a 5% version shows beside its
// 85% twin instead of under Other Cards
const allCards = computed(() => [
  ...(props.archetype.cards ?? []),
  ...(props.archetype.filteredCards ?? []),
])
const featuredIds = computed(() => new Set((props.archetype.cards ?? []).map(c => c.cardId)))
const groupLeader = computed(() => {
  const map = new Map()
  for (const c of allCards.value) {
    const id = c.effectGroup?.id
    if (id && (c.inclusionRate ?? 0) > (map.get(id)?.inclusionRate ?? -1)) {
      map.set(id, c)
    }
  }
  return map
})
const anchorOf = card => groupLeader.value.get(card.effectGroup?.id) ?? card
const featured = computed(() =>
  allCards.value.filter(c => featuredIds.value.has(anchorOf(c).cardId)),
)
const otherCards = computed(() =>
  allCards.value.filter(c => !featuredIds.value.has(anchorOf(c).cardId)),
)
const staples = computed(() =>
  featured.value.filter(c => (anchorOf(c).inclusionRate ?? 0) >= STAPLE_MIN),
)
const flex = computed(() =>
  featured.value.filter(c => (anchorOf(c).inclusionRate ?? 0) < STAPLE_MIN),
)
const cardSections = computed(() =>
  [
    {
      key: 'staples',
      title: 'Staples',
      subtitle: `in ${STAPLE_MIN * 100}%+ of decks · ${staples.value.length} cards`,
      cards: staples.value,
    },
    {
      key: 'flex',
      title: 'Flex & tech',
      subtitle: `in ${FEATURED_MIN * 100}–${STAPLE_MIN * 100}% of decks · ${flex.value.length} cards`,
      cards: flex.value,
    },
  ].filter(sec => sec.cards.length),
)

const avgDeck = computed(() => {
  const decks = props.archetype.deckCount || 1
  const all = [...(props.archetype.cards ?? []), ...(props.archetype.filteredCards ?? [])]
  return TYPES.map(type => ({
    type,
    label: typeLabel[type],
    copies: Math.round(
      all.filter(c => c.type === type).reduce((n, c) => n + (c.totalQty ?? 0), 0) / decks,
    ),
  })).filter(t => t.copies > 0)
})

// Win rate of this archetype's decks with the card minus those without, in
// points, as { value, significant } or { value: null, note }.
// - Both sides are shrunk toward the archetype's rate as if they had
//   LIFT_PRIOR_DECKS more decks, so small samples lean toward 0.
// - Under LIFT_MIN_SIDE decks on either side there's nothing to compare (a 96%
//   staple's "without" side is a few odd builds), so no value, just a note.
// - `significant`: the raw gap is beyond chance (two-proportion z-test, 95%);
//   otherwise the UI greys it out.
// Null when the archetype has too few wins to compare at all.
const LIFT_PRIOR_DECKS = 10
const LIFT_MIN_WINS = 3
const LIFT_MIN_SIDE = 20
const LIFT_Z = 1.96
function liftFor(withDecks, withWins) {
  const decks = props.archetype.deckCount ?? 0
  const wins = props.archetype.winnerDeckCount ?? 0
  const withoutDecks = decks - withDecks
  if (wins < LIFT_MIN_WINS || !withDecks) {
    return null
  }
  if (withoutDecks === 0) {
    return { value: null, note: 'Every deck runs it: nothing to compare' }
  }
  if (withoutDecks < LIFT_MIN_SIDE) {
    return { value: null, note: `Only ${withoutDecks} decks without it: too few to compare` }
  }
  if (withDecks < LIFT_MIN_SIDE) {
    return { value: null, note: `Only ${withDecks} decks with it: too few to compare` }
  }
  const base = wins / decks
  const withoutWins = wins - withWins
  const rate = (w, d) => (w + LIFT_PRIOR_DECKS * base) / (d + LIFT_PRIOR_DECKS)
  const value = +((rate(withWins, withDecks) - rate(withoutWins, withoutDecks)) * 100).toFixed(1)
  const se = Math.sqrt(base * (1 - base) * (1 / withDecks + 1 / withoutDecks))
  const gap = withWins / withDecks - withoutWins / withoutDecks
  return { value, significant: se > 0 && Math.abs(gap) / se >= LIFT_Z }
}
const winLift = card => liftFor(card.decksIncluded ?? 0, card.winnerDeckCount ?? 0)
// For a same-effect group: decks running any version vs decks running none.
// Per card it would compare against decks running the other version instead.
const groupWinLift = g => liftFor(g.decks, g.wins)

const typeLabel = {
  UNIT: 'Unit',
  PILOT: 'Pilot',
  COMMAND: 'Command',
  BASE: 'Base',
}

// Traits by how many different cards carry them, among the featured cards
// (staples and flex); ties go to the trait with more copies per deck
const traits = computed(() => {
  const decks = props.archetype.deckCount || 1
  const map = new Map()
  for (const c of featured.value) {
    const names = (c.features ?? '')
      .split(/\s+/)
      .map(f => f.replace(/[〔〕]/g, ''))
      .filter(f => f && f !== '-')
    for (const name of new Set(names)) {
      const t = map.get(name) ?? { name, copies: 0, names: [] }
      t.copies += (c.totalQty ?? 0) / decks
      t.names.push(c.name)
      map.set(name, t)
    }
  }
  return [...map.values()]
    .sort((a, b) => b.names.length - a.names.length || b.copies - a.copies)
    .map(t => ({
      ...t,
      title: [
        `${t.name}: ${t.names.length} card${t.names.length === 1 ? '' : 's'}, ${t.copies.toFixed(1)} copies per deck`,
        ...t.names,
      ].join('\n'),
    }))
})
</script>
