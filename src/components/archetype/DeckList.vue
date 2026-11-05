<template>
  <div>
    <div class="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="overflow-x-auto">
        <UiMetaTabGroup v-model="filter" :options="filterOptions" />
      </div>
      <label class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        Sort
        <select
          v-model="sortKey"
          class="rounded border border-gray-500/20 bg-transparent px-1.5 py-0.5 text-xs text-gray-700 dark:border-nalika-border dark:bg-nalika-surface dark:text-nalika-text"
        >
          <option v-for="o in sortOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </label>
    </div>

    <p v-if="showTech" class="mb-2 text-xxs text-gray-400 dark:text-gray-500">
      Flex: cards in that deck that {{ TECH_SHARE * 100 }}–{{ STAPLE_SHARE * 100 }}% of these decks
      play. Tech: under {{ TECH_SHARE * 100 }}%. Hover a deck to see its list; tap on phones.
    </p>

    <!-- Columns fill top to bottom so a sorted list reads down, not across -->
    <ul v-if="shown.length" class="gap-x-6 lg:columns-2">
      <li
        v-for="d in shown"
        :key="d.idx"
        class="break-inside-avoid border-b border-gray-500/8 dark:border-white/5"
      >
        <UiDeckPopover :cards="d.cards" :url="d.url" :label="d.popoverLabel" :tags-of="tagsOf">
          <component
            :is="d.url ? 'a' : 'div'"
            :href="d.url || undefined"
            :target="d.url ? '_blank' : undefined"
            :rel="d.url ? 'noopener' : undefined"
            class="group flex items-center gap-3 rounded px-1.5 py-1.5 text-xs hover:bg-gray-100/70 dark:hover:bg-white/5"
          >
            <span
              class="w-14 shrink-0 rounded py-0.5 text-center text-xxs font-bold"
              :class="placeClass(d)"
              :title="d.isWinner ? 'Counts as a win' : undefined"
            >
              {{ d.placeLabel }}
            </span>
            <!-- Month-day on phones; the year is the series' anyway -->
            <span
              class="shrink-0 font-mono text-gray-500 tabular-nums sm:w-20 dark:text-gray-400"
              :title="d.date"
            >
              <span class="sm:hidden">{{ d.date?.slice(5) ?? '—' }}</span>
              <span class="max-sm:hidden">{{ d.date ?? '—' }}</span>
            </span>
            <span
              class="min-w-0 flex-1 truncate text-gray-700 dark:text-nalika-text"
              :title="d.shop"
            >
              {{ d.shop || 'Unknown event' }}
            </span>
            <span
              v-if="showTech"
              :class="{ invisible: !d.flex }"
              class="w-14 shrink-0 rounded bg-gray-100 px-1.5 text-center font-mono text-xxs text-gray-500 tabular-nums dark:bg-white/5 dark:text-gray-400"
              :title="d.flexNames.join('\n')"
            >
              {{ d.flex }} flex
            </span>
            <span
              v-if="showTech"
              :class="{ invisible: !d.tech }"
              class="w-14 shrink-0 rounded bg-sora/10 px-1.5 text-center font-mono text-xxs text-ruri tabular-nums dark:bg-sora/15 dark:text-sora"
              :title="d.techNames.join('\n')"
            >
              +{{ d.tech }} tech
            </span>
            <span
              v-if="d.url"
              class="shrink-0 text-gray-300 group-hover:text-ruri max-sm:hidden dark:text-gray-600 dark:group-hover:text-sora"
              aria-hidden="true"
            >
              ↗
            </span>
          </component>
        </UiDeckPopover>
      </li>
    </ul>
    <p v-else class="py-3 text-xs text-gray-400 dark:text-gray-500">No decks here</p>

    <button
      v-if="filtered.length > shown.length"
      class="mt-3 w-full cursor-pointer rounded bg-gray-100 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-nalika-text-muted dark:hover:bg-white/10"
      @click="limit += PAGE"
    >
      Show {{ Math.min(PAGE, filtered.length - shown.length) }} more
      <span class="text-gray-400">({{ filtered.length - shown.length }} left)</span>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  // [{ idx, url, cards, isWinner, date, shop, place }]
  decks: { type: Array, required: true },
  // Off for mixed lists (unassigned decks), where "uncommon" means nothing
  showTech: { type: Boolean, default: true },
  // Signature cards of the archetype and (cardId) => played this series only,
  // for the tags in the deck popover
  sigIds: { type: Set, default: () => new Set() },
  isNew: { type: Function, default: () => false },
})

const PAGE = 20
const TECH_SHARE = 0.25
// Below this share a card is flex rather than a staple (as on the archetype cards)
const STAPLE_SHARE = 0.85

// Open on Winners; a list without any (0-win archetypes) opens on All
const defaultFilter = () => (props.decks.some(d => d.isWinner) ? 'winners' : 'all')
const filter = ref(defaultFilter())
// Switching archetype reuses this component, so start its list fresh
watch(
  () => props.decks,
  () => {
    filter.value = defaultFilter()
  },
)
const sortKey = ref('newest')
const limit = ref(PAGE)
watch([filter, sortKey], () => {
  limit.value = PAGE
})

// Share of these decks that play each card
const cardShare = computed(() => {
  const counts = new Map()
  for (const d of props.decks) {
    for (const c of d.cards) {
      counts.set(c.cardId, (counts.get(c.cardId) ?? 0) + 1)
    }
  }
  const n = props.decks.length || 1
  return new Map([...counts].map(([id, k]) => [id, k / n]))
})

// Tags for a card in a deck's popover, matching the archetype cards. TECH and
// FLEX here mean the same as the chips in the list
function tagsOf(card) {
  const share = cardShare.value.get(card.cardId) ?? 0
  return {
    sig: props.sigIds.has(card.cardId),
    tech: props.showTech && share < TECH_SHARE,
    new: props.isNew(card.cardId),
    flex: props.showTech && share >= TECH_SHARE && share < STAPLE_SHARE,
  }
}

function placeLabel(place) {
  if (!place) {
    return '—'
  }
  if (place <= 4) {
    return ['1st', '2nd', '3rd', '4th'][place - 1]
  }
  return place <= 8 ? 'Top 8' : 'Top 16'
}

const rows = computed(() =>
  props.decks.map(d => {
    const shareOf = c => cardShare.value.get(c.cardId) ?? 0
    const techCards = props.showTech ? d.cards.filter(c => shareOf(c) < TECH_SHARE) : []
    const flexCards = props.showTech
      ? d.cards.filter(c => shareOf(c) >= TECH_SHARE && shareOf(c) < STAPLE_SHARE)
      : []
    const placeText = placeLabel(d.place)
    // Event names often end with the date ("…定員64名2026/11/2"); the date has its own column
    const shop = (d.shop ?? '').replace(/\s*\d{4}\/\d{1,2}\/\d{1,2}$/, '')
    return {
      ...d,
      shop,
      placeLabel: d.isWinner && d.place === 1 ? '🏆 1st' : placeText,
      tech: techCards.length,
      techNames: techCards.map(c => c.name),
      flex: flexCards.length,
      flexNames: flexCards.map(c => c.name),
      popoverLabel: [placeText, d.date, shop].filter(Boolean).join(' · '),
    }
  }),
)

const filterOptions = computed(() => {
  const all = rows.value
  const count = fn => all.filter(fn).length
  return [
    { value: 'all', label: `All ${all.length}` },
    { value: 'winners', label: `Winners ${count(d => d.isWinner)}` },
    { value: 'top4', label: `Top 4 ${count(d => d.place && d.place <= 4)}` },
    { value: 'other', label: `Other ${count(d => !d.isWinner)}` },
  ]
})

const sortOptions = computed(() => [
  { value: 'newest', label: 'Newest' },
  { value: 'place', label: 'Best placement' },
  ...(props.showTech ? [{ value: 'tech', label: 'Most tech' }] : []),
])

const FILTERS = {
  all: () => true,
  winners: d => d.isWinner,
  top4: d => d.place && d.place <= 4,
  other: d => !d.isWinner,
}

const byDate = (a, b) => (b.date ?? '').localeCompare(a.date ?? '')
const byPlace = (a, b) => (a.place ?? 99) - (b.place ?? 99)
const SORTS = {
  newest: (a, b) => byDate(a, b) || byPlace(a, b),
  place: (a, b) => byPlace(a, b) || byDate(a, b),
  tech: (a, b) => b.tech - a.tech || byDate(a, b),
}

const filtered = computed(() =>
  rows.value.filter(FILTERS[filter.value]).sort(SORTS[sortKey.value] ?? SORTS.newest),
)
const shown = computed(() => filtered.value.slice(0, limit.value))

function placeClass(d) {
  if (d.isWinner) {
    return tw`bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300/80`
  }
  if (d.place && d.place <= 4) {
    return tw`bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300/80`
  }
  return tw`bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400`
}
</script>
