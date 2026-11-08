<template>
  <div>
    <!-- Average deck and the key to the card badges, as two labelled rows sharing one
         label column -->
    <dl
      class="mb-4 grid grid-cols-[4.5rem_1fr] items-start gap-x-3 gap-y-3 text-xs text-gray-500 sm:grid-cols-[5.5rem_1fr] sm:items-center dark:text-nalika-text-muted"
    >
      <!-- Average deck: copies per type across all of this archetype's decks, as a
           stacked bar in the deck-curve chart's type colours -->
      <dt
        class="font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500 zh:tracking-normal zh:text-gray-500"
      >
        {{ $t('archetype.detail.avgDeck') }}
      </dt>
      <dd class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <div class="flex h-2 w-full shrink-0 overflow-hidden rounded-sm sm:w-56" aria-hidden="true">
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
        </span>
      </dd>

      <!-- Key for both card sections: each badge with its meaning, details on hover -->
      <template v-if="cardSections.length">
        <dt
          class="font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500 zh:tracking-normal zh:text-gray-500"
        >
          {{ $t('archetype.detail.key') }}
        </dt>
        <dd>
          <!-- Mobile: folded behind a toggle, and when open one badge per row with
               the badges in a fixed column so the meanings line up -->
          <button
            class="flex cursor-pointer items-center gap-1 font-medium text-ruri sm:hidden"
            :aria-expanded="keyOpen"
            @click="keyOpen = !keyOpen"
          >
            {{ keyOpen ? $t('archetype.detail.keyHide') : $t('archetype.detail.keyShow') }}
            <svg
              class="size-3.5 transition-transform"
              :class="keyOpen && 'rotate-180'"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          <div
            class="flex-wrap items-center gap-x-4 gap-y-1.5 max-sm:mt-2 max-sm:flex-col max-sm:items-start max-sm:gap-y-2 sm:flex"
            :class="keyOpen ? 'flex' : 'hidden'"
          >
            <UiHint :class="KEY_ITEM" :text="$t('archetype.detail.copiesHint')">
              <span :class="KEY_BADGE">
                <span class="rounded-sm bg-black/75 px-1 font-mono font-bold text-white">×4</span>
              </span>
              {{ $t('archetype.detail.copies') }}
            </UiHint>
            <UiHint :class="KEY_ITEM" :text="$t('archetype.detail.wrHint')">
              <span :class="KEY_BADGE">
                <span class="font-mono font-semibold text-green-600 dark:text-green-400">
                  {{ $t('archetype.badge.wr') }} +2.0
                </span>
              </span>
              {{ $t('archetype.detail.wr') }}
            </UiHint>
            <UiHint :class="KEY_ITEM" :text="$t('archetype.detail.sigHint')">
              <span :class="KEY_BADGE">
                <span class="rounded-sm bg-black/70 px-1 font-bold text-yellow-300">
                  ★ {{ $t('archetype.badge.sig') }}
                </span>
              </span>
              {{ $t('archetype.detail.sig') }}
            </UiHint>
            <UiHint :class="KEY_ITEM" :text="$t('archetype.detail.techHint')">
              <span :class="KEY_BADGE">
                <span class="rounded-sm bg-yellow-400 px-1 font-bold text-yellow-950">
                  {{ $t('archetype.badge.tech') }}
                </span>
              </span>
              {{ $t('archetype.detail.tech') }}
            </UiHint>
            <UiHint
              v-if="prevCardIds?.size"
              :class="KEY_ITEM"
              :text="$t('archetype.detail.newHint')"
            >
              <span :class="KEY_BADGE">
                <span class="rounded-sm bg-green-600 px-1 font-bold text-white">
                  {{ $t('archetype.badge.new') }}
                </span>
              </span>
              {{ $t('archetype.detail.new') }}
            </UiHint>
            <UiHint :class="KEY_ITEM" :text="$t('archetype.detail.sameHint')">
              <span :class="KEY_BADGE">
                <span
                  class="rounded-sm border border-dashed border-sky-400 px-1 font-mono font-semibold text-sky-700 dark:text-sky-400"
                >
                  ≡
                </span>
              </span>
              {{ $t('archetype.detail.same') }}
            </UiHint>
          </div>
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
        <!-- Own row on mobile, so every section's header has the same shape -->
        <span class="text-xs text-gray-500 max-sm:basis-full dark:text-nalika-text-muted">
          {{ sec.blurb }} · {{ $t('archetype.cardCount', sec.cards.length) }}
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
        @zoom="onZoom"
      />
    </section>

    <CardImageOverlay v-model="enlargedCardId" :info="enlargedInfo" :z-index="1100" />

    <!-- Deck curve: copies per average deck at each level and cost, by type -->
    <div class="mt-6 grid gap-4 md:grid-cols-2">
      <ChartDeckCurve
        :title="$t('archetype.detail.level')"
        field="level"
        :cards="allCards"
        :deck-count="archetype.deckCount"
      />
      <ChartDeckCurve
        :title="$t('archetype.detail.cost')"
        field="cost"
        :cards="allCards"
        :deck-count="archetype.deckCount"
      />
    </div>

    <!-- Traits: copies per average deck carrying each trait -->
    <div v-if="traits.length" class="mt-4">
      <h4 class="mb-1.5 flex flex-wrap items-baseline gap-x-2">
        <span
          class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted zh:tracking-normal"
        >
          {{ $t('archetype.detail.traits') }}
        </span>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ $t('archetype.detail.traitsNote', { pct: FEATURED_MIN * 100 }) }}
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
          class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted zh:tracking-normal"
        >
          {{ $t('archetype.detail.decks') }}
        </span>
        <span class="font-mono text-xs text-gray-400 tabular-nums dark:text-gray-500">
          {{ archetype.deckCardIds.length }}
        </span>
      </h4>
      <ArchetypeDeckList
        :decks="deckPreviews"
        :sig-ids="sigCardIds"
        :tech-ids="techCardIds"
        :is-new="isNewCard"
        :group-of="effectGroupOf"
      />
    </section>

    <!-- Other Cards (collapsible) -->
    <UiCollapsibleSection
      v-if="otherCards.length"
      :show="showOther"
      :count="otherCards.length"
      :title="$t('archetype.detail.otherCards')"
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
        @zoom="onZoom"
      />
    </UiCollapsibleSection>

    <!-- Removed Cards (collapsible) -->
    <UiCollapsibleSection
      v-if="removedCards.length"
      :show="showRemoved"
      :count="removedCards.length"
      :title="$t('archetype.detail.removedCards')"
      content-class="space-y-4"
      @toggle="showRemoved = !showRemoved"
    >
      <ArchetypeCardGrid
        class="rounded border border-gray-500/10 bg-gray-50 p-3 sm:p-4 dark:border-nalika-border dark:bg-white/[0.02]"
        :cards="removedCards"
        removed
        @zoom="onZoom"
      />
    </UiCollapsibleSection>
  </div>
</template>

<script setup>
const { t } = useI18n()

const props = defineProps({
  archetype: { type: Object, required: true },
  prevCardIds: { type: Set, default: null },
  removedCards: { type: Array, default: () => [] },
})

const isNewCard = cardId => props.prevCardIds?.size > 0 && !props.prevCardIds.has(cardId)

const { showOther, showRemoved } = useCollapseState()

// Badge key: folded on mobile until asked for; desktop always shows it inline
const keyOpen = ref(false)
const KEY_ITEM = tw`flex items-center gap-1.5 max-sm:gap-2`
// Fixed badge column on mobile so the meanings start in one line
const KEY_BADGE = tw`flex shrink-0 max-sm:w-17`

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
// The card's hint (stats, tag meanings), shown under the enlarged card since
// touch screens can't hover for it
const enlargedInfo = ref(null)
function onZoom(cardId, info = null) {
  enlargedInfo.value = info
  enlargedCardId.value = cardId
}

// Featured cards are those in more than FEATURED_MIN of decks (see build-tiers);
// at STAPLE_MIN and up a card is a given, so it only gets a thumbnail
const FEATURED_MIN = 0.15
const STAPLE_MIN = 0.85
const TYPES = ['UNIT', 'PILOT', 'COMMAND', 'BASE']

// Same-effect versions (effectGroup, see build-tiers) stay together: each card
// is placed by its group's most-played member, so a 5% version shows beside its
// 85% twin instead of under Other Cards
const allCards = computed(() => [
  ...(props.archetype.cards ?? []),
  ...(props.archetype.filteredCards ?? []),
])
// Top tech picks (inWinner, see build-tiers): the cards tagged 奇招 here and in deck lists
const techCardIds = computed(
  () => new Set(allCards.value.filter(c => c.inWinner).map(c => c.cardId)),
)
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
// Card id → its same-effect group id, so deck lists count versions as one card
const effectGroupIds = computed(
  () => new Map(allCards.value.filter(c => c.effectGroup).map(c => [c.cardId, c.effectGroup.id])),
)
const effectGroupOf = cardId => effectGroupIds.value.get(cardId) ?? cardId
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
      title: t('archetype.section.staples'),
      range: `${STAPLE_MIN * 100}%+`,
      blurb: t('archetype.section.staplesBlurb'),
      cards: staples.value,
      panelClass: tw`border-ruri/15 bg-ruri/[0.03] dark:border-sora/30 dark:bg-sora/[0.07]`,
      headClass: tw`border-ruri/15 bg-ruri/[0.06] dark:border-sora/25 dark:bg-sora/[0.1]`,
      titleClass: tw`text-ruri dark:text-sora`,
      badgeClass: tw`bg-ruri/10 text-ruri dark:bg-sora/15 dark:text-sora`,
    },
    {
      key: 'flex',
      title: t('archetype.section.flex'),
      range: `${FEATURED_MIN * 100}–${STAPLE_MIN * 100}%`,
      blurb: t('archetype.section.flexBlurb'),
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
  const rows = TYPES.map(type => {
    const exact =
      all.filter(c => c.type === type).reduce((n, c) => n + (c.totalQty ?? 0), 0) / decks
    return {
      type,
      label: cardTypeName(type),
      bar: TYPE_BAR[type],
      exact,
      copies: Math.floor(exact),
    }
  })
  // Largest-remainder rounding so the parts add up to the rounded total (50)
  // instead of drifting to 49/51 when each type is rounded on its own.
  const target = Math.round(rows.reduce((n, r) => n + r.exact, 0))
  let left = target - rows.reduce((n, r) => n + r.copies, 0)
  for (const r of [...rows].sort((a, b) => (b.exact % 1) - (a.exact % 1))) {
    if (left <= 0) {
      break
    }
    r.copies++
    left--
  }
  return rows.filter(t => t.copies > 0)
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
    return { value: null, note: t('archetype.lift.everyDeck') }
  }
  if (withoutDecks < LIFT_MIN_SIDE) {
    return { value: null, note: t('archetype.lift.fewWithout', withoutDecks) }
  }
  if (withDecks < LIFT_MIN_SIDE) {
    return { value: null, note: t('archetype.lift.fewWith', withDecks) }
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
    .map(trait => ({
      ...trait,
      title: [
        t('archetype.detail.traitTitle', {
          name: trait.name,
          cards: t('archetype.cardCount', trait.names.length),
          copies: trait.copies.toFixed(1),
        }),
        ...trait.names,
      ].join('\n'),
    }))
})
</script>
