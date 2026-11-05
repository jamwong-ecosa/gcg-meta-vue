<template>
  <div>
    <!-- Average deck and the key to the card badges, as two labelled rows sharing one
         label column -->
    <dl
      class="mb-4 grid grid-cols-[4.5rem_1fr] items-start gap-x-3 gap-y-3 text-xs text-gray-500 sm:grid-cols-[5.5rem_1fr] sm:items-center dark:text-nalika-text-muted"
    >
      <!-- Average deck: copies per type across all of this archetype's decks, as a
           stacked bar in the deck-curve chart's type colours -->
      <dt class="font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
        Avg deck
      </dt>
      <dd class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <div class="flex h-2 w-40 shrink-0 overflow-hidden rounded-sm sm:w-56" aria-hidden="true">
          <div
            v-for="t in avgDeck"
            :key="t.type"
            :class="t.bar"
            :style="{ width: `${(t.copies / avgDeckTotal) * 100}%` }"
          />
        </div>
        <span class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span v-for="t in avgDeck" :key="t.type" class="flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-sm" :class="t.bar" aria-hidden="true" />
            <b class="font-mono font-bold text-gray-700 tabular-nums dark:text-nalika-text">
              {{ t.copies }}
            </b>
            {{ t.label }}
          </span>
          <span class="text-gray-400 dark:text-gray-500">· {{ avgDeckTotal }} cards</span>
        </span>
      </dd>

      <!-- Key for both card sections: each badge with its meaning, details on hover -->
      <template v-if="cardSections.length">
        <dt class="font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">Key</dt>
        <dd class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <UiHint class="flex items-center gap-1.5" text="Copies per deck that runs it">
            <span class="rounded-sm bg-black/75 px-1 font-mono font-bold text-white">×4</span>
            copies per deck
          </UiHint>
          <UiHint
            class="flex items-center gap-1.5"
            text="How often this archetype's decks won their event (1st, or 2nd at 16+ players) with the card minus without, in points. Green or red when the gap is clear; grey when it could be chance; hidden when either side has under 20 decks or there is no gap. Shows what winning lists run, not that the card causes wins"
          >
            <span class="font-mono font-semibold text-green-600 dark:text-green-400">WR +2.0</span>
            wins with the card vs without
          </UiHint>
          <UiHint class="flex items-center gap-1.5" text="Signature card of the archetype">
            <span class="rounded-sm bg-black/70 px-1 font-bold text-yellow-300">★ SIG</span>
            signature card
          </UiHint>
          <UiHint
            class="flex items-center gap-1.5"
            text="Top tech pick: uncommon, but its decks win well"
          >
            <span class="rounded-sm bg-yellow-400 px-1 font-bold text-yellow-950">TECH</span>
            top tech pick
          </UiHint>
          <UiHint
            v-if="prevCardIds?.size"
            class="flex items-center gap-1.5"
            text="Not played by this archetype last series"
          >
            <span class="rounded-sm bg-green-600 px-1 font-bold text-white">NEW</span>
            new this series
          </UiHint>
          <UiHint
            class="flex items-center gap-1.5"
            text="Same card under another name: one WR for the group, decks running any version vs none. Hover the group for its decks"
          >
            <span
              class="rounded-sm border border-dashed border-sky-400 px-1 font-mono font-semibold text-sky-700 dark:text-sky-400"
            >
              ≡
            </span>
            same card, other name
          </UiHint>
        </dd>
      </template>
    </dl>

    <!-- Staples and flex each get their own tinted panel with a header strip in its
         colour, so the core of the list and the slots builds disagree on read as
         separate blocks.
         Compact cards in one width-filling grid; hover for numbers, click to enlarge -->
    <section
      v-for="sec in cardSections"
      :key="sec.key"
      class="mb-5 overflow-hidden rounded border"
      :class="sec.panelClass"
    >
      <h4
        class="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b px-3 py-2 sm:px-4"
        :class="sec.headClass"
      >
        <span class="text-lg font-semibold tracking-wider" :class="sec.titleClass">
          {{ sec.title }}
        </span>
        <span
          class="rounded-full px-2 py-0.5 font-mono text-xs font-semibold tabular-nums"
          :class="sec.badgeClass"
        >
          {{ sec.range }}
        </span>
        <span class="text-xs text-gray-500 dark:text-nalika-text-muted">
          {{ sec.blurb }} · {{ sec.cards.length }} cards
        </span>
      </h4>
      <ArchetypeCardGrid
        class="p-3 pt-4 sm:p-4"
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

    <!-- Decks: always shown, ahead of the collapsible card lists -->
    <section v-if="archetype.deckCardIds?.length" class="mt-6">
      <h4 class="mb-2 flex items-baseline gap-2">
        <span
          class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted"
        >
          Decks
        </span>
        <span class="font-mono text-xs text-gray-400 tabular-nums dark:text-gray-500">
          {{ archetype.deckCardIds.length }}
        </span>
      </h4>
      <ArchetypeDeckList :decks="deckPreviews" :sig-ids="sigCardIds" :is-new="isNewCard" />
    </section>

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
        class="rounded border border-gray-500/10 bg-gray-50 p-3 sm:p-4 dark:border-nalika-border dark:bg-white/[0.02]"
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
      <ArchetypeCardGrid
        class="rounded border border-gray-500/10 bg-gray-50 p-3 sm:p-4 dark:border-nalika-border dark:bg-white/[0.02]"
        :cards="removedCards"
        removed
        @zoom="enlargedCardId = $event"
      />
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

const { showOther, showRemoved } = useCollapseState()

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
const STAPLE_MIN = 0.85
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
      range: `${STAPLE_MIN * 100}%+`,
      blurb: 'core of the list, in almost every deck',
      cards: staples.value,
      panelClass: tw`border-ruri/15 bg-ruri/[0.03] dark:border-sora/30 dark:bg-sora/[0.07]`,
      headClass: tw`border-ruri/15 bg-ruri/[0.06] dark:border-sora/25 dark:bg-sora/[0.1]`,
      titleClass: tw`text-ruri dark:text-sora`,
      badgeClass: tw`bg-ruri/10 text-ruri dark:bg-sora/15 dark:text-sora`,
    },
    {
      key: 'flex',
      title: 'Flex & tech',
      range: `${FEATURED_MIN * 100}–${STAPLE_MIN * 100}%`,
      blurb: 'where builds differ',
      cards: flex.value,
      panelClass: tw`border-amber-400/30 bg-amber-50/50 dark:border-amber-400/30 dark:bg-amber-400/[0.07]`,
      headClass: tw`border-amber-400/30 bg-amber-100/60 dark:border-amber-400/25 dark:bg-amber-400/[0.1]`,
      titleClass: tw`text-amber-800 dark:text-amber-300`,
      badgeClass: tw`bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300`,
    },
  ].filter(sec => sec.cards.length),
)

// Same colours as the deck-curve chart's type legend
const TYPE_BAR = {
  UNIT: tw`bg-ruri dark:bg-sky-600`,
  PILOT: tw`bg-sky-400 dark:bg-sky-300`,
  COMMAND: tw`bg-amber-400 dark:bg-amber-500`,
  BASE: tw`bg-emerald-500 dark:bg-emerald-600`,
}

const avgDeck = computed(() => {
  const decks = props.archetype.deckCount || 1
  const all = [...(props.archetype.cards ?? []), ...(props.archetype.filteredCards ?? [])]
  return TYPES.map(type => ({
    type,
    label: typeLabel[type],
    bar: TYPE_BAR[type],
    copies: Math.round(
      all.filter(c => c.type === type).reduce((n, c) => n + (c.totalQty ?? 0), 0) / decks,
    ),
  })).filter(t => t.copies > 0)
})
const avgDeckTotal = computed(() => avgDeck.value.reduce((n, t) => n + t.copies, 0) || 1)

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
