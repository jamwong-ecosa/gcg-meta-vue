<template>
  <div>
    <!-- Builds: the archetype's decks split in two by the package each runs
         (subBuilds); picking one re-works every number below over its decks.
         One panel: a bar split by each build's share of decks, then a column per
         build. Picking a build again, or "all decks", goes back to every deck.
         Folded to the share bar until asked for -->
    <section v-if="builds.length" class="mb-5">
      <div class="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <h4 class="flex flex-wrap items-baseline gap-x-2">
          <span
            class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted zh:tracking-normal"
          >
            {{ $t('archetype.builds.title') }}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400" :class="!buildsOpen && tw`hidden`">
            {{ $t('archetype.builds.blurb') }}
          </span>
        </h4>
        <span class="ml-auto flex items-center gap-3">
          <!-- Folded with every deck shown, there's nothing to go back to -->
          <button
            class="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-ruri dark:focus-visible:outline-sora"
            :class="[
              build === null
                ? 'bg-ruri/[0.08] text-ruri ring-ruri/30 dark:bg-sora/[0.12] dark:text-sora dark:ring-sora/40'
                : 'bg-white text-gray-600 ring-gray-500/20 hover:bg-gray-50 dark:bg-nalika-surface dark:text-nalika-text dark:ring-nalika-border dark:hover:bg-white/[0.06]',
              !buildsOpen && build === null && tw`hidden`,
            ]"
            :aria-pressed="build === null"
            @click="build = null"
          >
            {{ build === null ? $t('archetype.builds.all') : $t('archetype.builds.showAll') }}
            <span class="font-mono font-normal tabular-nums opacity-70">
              {{ archetype.deckCount }}
            </span>
          </button>
          <button
            class="flex cursor-pointer items-center gap-1 text-xs font-medium text-ruri dark:text-sora"
            :aria-expanded="buildsOpen"
            :aria-controls="buildsPanelId"
            @click="buildsOpen = !buildsOpen"
          >
            {{ buildsOpen ? $t('archetype.detail.keyHide') : $t('archetype.detail.keyShow') }}
            <svg
              class="size-3.5 transition-transform"
              :class="buildsOpen && 'rotate-180'"
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
        </span>
      </div>

      <div
        class="overflow-hidden rounded-lg border border-gray-500/15 bg-gray-50 dark:border-nalika-border dark:bg-white/[0.02]"
      >
        <!-- Share of decks: one segment per build, as wide as its share -->
        <div class="flex h-6" aria-hidden="true">
          <div
            v-for="b in builds"
            :key="b.value"
            class="flex min-w-12 items-center gap-1.5 px-2.5 font-mono text-xs font-bold text-white tabular-nums transition-opacity"
            :class="[b.tone.bar, build !== null && build !== b.value && tw`opacity-30`]"
            :style="{ flexBasis: `${b.share}%` }"
          >
            {{ b.letter }}
            <span class="font-normal opacity-90">{{ b.share }}%</span>
          </div>
        </div>

        <div
          :id="buildsPanelId"
          class="grid divide-gray-500/15 max-sm:divide-y sm:grid-cols-2 sm:divide-x dark:divide-nalika-border"
          :class="!buildsOpen && tw`hidden`"
        >
          <button
            v-for="b in builds"
            :key="b.value"
            class="flex cursor-pointer flex-col gap-2.5 px-4 py-3 text-left transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ruri dark:focus-visible:outline-sora"
            :class="
              build === b.value
                ? b.tone.picked
                : build === null
                  ? tw`hover:bg-gray-500/[0.05] dark:hover:bg-white/[0.04]`
                  : tw`opacity-55 hover:bg-gray-500/[0.05] hover:opacity-100 dark:hover:bg-white/[0.04]`
            "
            :aria-pressed="build === b.value"
            @click="build = build === b.value ? null : b.value"
          >
            <span class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span class="flex items-center gap-2">
                <span
                  class="flex size-6 shrink-0 items-center justify-center rounded font-mono text-sm font-bold text-white"
                  :class="b.tone.bar"
                >
                  {{ b.letter }}
                </span>
                <span
                  class="text-sm font-semibold"
                  :class="build === b.value ? b.tone.text : tw`text-gray-800 dark:text-nalika-text`"
                >
                  {{ b.title }}
                </span>
              </span>
              <span
                class="flex flex-wrap items-baseline gap-x-2 font-mono text-xs text-gray-500 tabular-nums dark:text-nalika-text-muted"
              >
                <span>{{ $t('archetype.deckCount', b.decks) }}</span>
                <span aria-hidden="true">·</span>
                <span>{{ $t('archetype.winCount', b.wins) }}</span>
                <span aria-hidden="true">·</span>
                <span class="font-semibold text-gray-700 dark:text-nalika-text">
                  {{ $t('archetype.builds.winRate', { pct: b.winRate }) }}
                </span>
              </span>
            </span>
            <span class="flex flex-col gap-1.5">
              <span
                class="text-[0.6875rem] font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500 zh:tracking-normal"
              >
                {{ $t('archetype.builds.keyCards') }}
              </span>
              <span class="flex flex-wrap items-center gap-1.5">
                <span
                  v-for="c in b.keyCards"
                  :key="c.id"
                  class="flex items-center gap-1.5 rounded-md bg-white py-0.5 pr-2 pl-0.5 text-xs text-gray-700 ring-1 ring-gray-500/15 dark:bg-nalika-surface dark:text-nalika-text dark:ring-nalika-border"
                >
                  <img
                    :src="cardFace(c.id, 64).url"
                    alt=""
                    loading="lazy"
                    class="size-6 rounded object-cover"
                  />
                  {{ c.name }}
                </span>
              </span>
            </span>
          </button>
        </div>
      </div>
    </section>

    <ArchetypeLrMix
      v-if="lrRows.length"
      :rows="lrRows"
      :picked="lrPick"
      :deck-count="buildView.deckCount"
      @pick="lrPick = $event"
    />

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
                <!-- A tiny stack: a card with the sky layer peeking above it -->
                <span class="relative inline-block h-3.5 w-2.5" aria-hidden="true">
                  <span
                    class="absolute inset-x-0.5 -top-0.5 bottom-1 rounded-[2px] bg-sky-400 dark:bg-sky-600"
                  />
                  <span
                    class="absolute inset-x-0 top-0.5 bottom-0 rounded-[2px] bg-gray-400 ring-1 ring-white dark:bg-gray-500 dark:ring-nalika-bg"
                  />
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
        class="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 border-b px-3 py-1.5 sm:gap-y-1 sm:px-4 sm:py-2"
        :class="sec.headClass"
      >
        <span class="text-base font-semibold tracking-wider sm:text-lg" :class="sec.titleClass">
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
        :deck-count="view.deckCount"
        :sig-ids="sigCardIds"
        :is-new="isNewCard"
        :ban-rule-of="banRuleOf"
        @zoom="onZoom"
      />
    </section>

    <!-- Other and removed cards: folded until asked for, right under flex -->
    <div v-if="otherCards.length || removedCards.length" class="mb-5 space-y-3">
      <UiFoldedSection
        v-if="otherCards.length"
        :show="showOther"
        :title="$t('archetype.detail.otherCards')"
        :blurb="$t('archetype.section.otherBlurb')"
        :range="`<${FEATURED_MIN * 100}%`"
        :count-text="$t('archetype.cardCount', otherCards.length)"
        :peek-ids="otherCards.map(c => c.cardId)"
        :count="otherCards.length"
        @toggle="showOther = !showOther"
      >
        <ArchetypeCardGrid
          class="p-3 pt-4 sm:p-4"
          :cards="otherCards"
          :lift-of="winLift"
          :group-lift-of="groupWinLift"
          :deck-count="view.deckCount"
          :sig-ids="sigCardIds"
          :is-new="isNewCard"
          :ban-rule-of="banRuleOf"
          @zoom="onZoom"
        />
      </UiFoldedSection>
      <UiFoldedSection
        v-if="removedCards.length"
        :show="showRemoved"
        :title="$t('archetype.detail.removedCards')"
        :blurb="$t('archetype.section.removedBlurb')"
        :count-text="$t('archetype.cardCount', removedCards.length)"
        :peek-ids="removedCards.map(c => c.cardId)"
        :count="removedCards.length"
        @toggle="showRemoved = !showRemoved"
      >
        <ArchetypeCardGrid
          class="p-3 pt-4 sm:p-4"
          :cards="removedCards"
          removed
          :ban-rule-of="banRuleOf"
          @zoom="onZoom"
        />
      </UiFoldedSection>
    </div>

    <slot name="after-cards" />

    <CardImageOverlay v-model="enlargedCardId" :info="enlargedInfo" :z-index="1100" />

    <!-- Deck curve: copies per average deck at each level and cost, by type -->
    <ChartDeckCurvePair
      class="mt-6"
      :level-title="$t('archetype.detail.level')"
      :cost-title="$t('archetype.detail.cost')"
      :cards="allCards"
      :deck-count="view.deckCount"
    />

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

    <!-- Decks: always shown -->
    <section v-if="view.deckCardIds?.length" class="mt-6">
      <h4 class="mb-2 flex items-baseline gap-2">
        <span
          class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted zh:tracking-normal"
        >
          {{ $t('archetype.detail.decks') }}
        </span>
        <span class="font-mono text-xs text-gray-400 tabular-nums dark:text-gray-500">
          {{ view.deckCardIds.length }}
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
  </div>
</template>

<script setup>
const { t } = useI18n()

const props = defineProps({
  archetype: { type: Object, required: true },
  prevCardIds: { type: Set, default: null },
  removedCards: { type: Array, default: () => [] },
})

// The build picked in the Builds row (index into subBuilds.builds), or null for
// every deck; the whole page below it follows the pick
const build = ref(null)
const buildView = computed(() => archetypeBuild(props.archetype, build.value))
// LR mix: worked out over the picked build; picking an LR narrows the page
// further to the decks running it at 3–4. A new build starts from all its decks
const lrRows = computed(() => lrMix(buildView.value))
// Builds panel: folded until asked for
const buildsOpen = ref(false)
const buildsPanelId = useId()
const lrPick = ref(null)
watch(build, () => {
  lrPick.value = null
})
const view = computed(() =>
  lrPick.value
    ? archetypeBuild(props.archetype, build.value, deck => runsHeavy(deck, lrPick.value))
    : buildView.value,
)

const isNewCard = cardId => props.prevCardIds?.size > 0 && !props.prevCardIds.has(cardId)

const { showOther, showRemoved } = useCollapseState()

// Badge key: folded on mobile until asked for; desktop always shows it inline
const keyOpen = ref(false)
const KEY_ITEM = tw`flex items-center gap-1.5 max-sm:gap-2`
// Fixed badge column on mobile so the meanings start in one line
const KEY_BADGE = tw`flex shrink-0 max-sm:w-17`

// Each build's colour: its share segment, letter badge and picked column
const BUILD_TONES = [
  {
    bar: tw`bg-indigo-500 dark:bg-indigo-400`,
    text: tw`text-indigo-700 dark:text-indigo-300`,
    picked: tw`bg-indigo-500/[0.07] shadow-[inset_0_3px_0] shadow-indigo-500 dark:bg-indigo-400/[0.1] dark:shadow-indigo-400`,
  },
  {
    bar: tw`bg-amber-500 dark:bg-amber-500`,
    text: tw`text-amber-700 dark:text-amber-300`,
    picked: tw`bg-amber-500/[0.08] shadow-[inset_0_3px_0] shadow-amber-500 dark:bg-amber-400/[0.1] dark:shadow-amber-400`,
  },
]

// The Builds panel: each build with its share, win rate and the cards that set it apart
const builds = computed(() => {
  const sb = props.archetype.subBuilds
  if (!sb) {
    return []
  }
  const total = props.archetype.deckCount || 1
  const names = new Map(
    [...(props.archetype.cards ?? []), ...(props.archetype.filteredCards ?? [])].map(c => [
      c.cardId,
      c.name,
    ]),
  )
  return sb.builds.map((b, i) => {
    const letter = String.fromCharCode(65 + i)
    return {
      value: i,
      letter,
      title: t('archetype.builds.name', { n: letter }),
      tone: BUILD_TONES[i % BUILD_TONES.length],
      decks: b.decks,
      wins: b.wins,
      share: Math.round((b.decks / total) * 100),
      winRate: b.decks ? ((b.wins / b.decks) * 100).toFixed(1) : '0.0',
      keyCards: b.keyCardIds.map(id => ({ id, name: names.get(id) ?? id })),
    }
  })
})

const sigCardIds = computed(() => new Set(view.value.sigCardIds ?? []))

const cardIdToName = computed(() => {
  const map = new Map()
  for (const c of view.value.cards ?? []) {
    map.set(c.cardId, c.name)
  }
  for (const c of view.value.filteredCards ?? []) {
    map.set(c.cardId, c.name)
  }
  return map
})

// A card's entry on the current ban list, as it bears on this archetype: a
// banned pair card only when its partner is played here too, and a vanilla
// unit only when another one is
const banRuleOf = cardId => {
  const rule = banListRule(cardId)
  const played = cardIdToName.value
  if (rule?.kind === 'pair') {
    const partnerIds = rule.partnerIds.filter(id => played.has(id))
    return partnerIds.length
      ? { ...rule, partnerIds, partnerNames: partnerIds.map(id => played.get(id)) }
      : null
  }
  if (rule?.kind === 'vanilla') {
    const others = [...played.keys()].some(
      id => id !== cardId && banListRule(id)?.kind === 'vanilla',
    )
    return others ? rule : null
  }
  return rule
}

const cardIdToInfo = computed(() => {
  const map = new Map()
  for (const c of view.value.cards ?? []) {
    map.set(c.cardId, {
      type: c.type,
      color: c.color,
      level: Number(c.level),
      cost: Number(c.cost),
      inclusionRate: c.inclusionRate ?? 0,
    })
  }
  for (const c of view.value.filteredCards ?? []) {
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
  (view.value.deckCardIds ?? []).map((cardStr, i) => {
    const url = view.value.deckUrls?.[i] ?? ''
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
    const meta = view.value.deckMeta?.[i] ?? {}
    return {
      url,
      idx: i,
      isWinner: view.value.deckWinnerFlags?.[i] ?? false,
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
const allCards = computed(() => [...(view.value.cards ?? []), ...(view.value.filteredCards ?? [])])
// Top tech picks (inWinner, see build-tiers): the cards tagged 奇招 here and in deck lists
const techCardIds = computed(
  () => new Set(allCards.value.filter(c => c.inWinner).map(c => c.cardId)),
)
const featuredIds = computed(() => new Set((view.value.cards ?? []).map(c => c.cardId)))
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
  const decks = view.value.deckCount || 1
  const all = [...(view.value.cards ?? []), ...(view.value.filteredCards ?? [])]
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
  const decks = view.value.deckCount ?? 0
  const wins = view.value.winnerDeckCount ?? 0
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
  const decks = view.value.deckCount || 1
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
