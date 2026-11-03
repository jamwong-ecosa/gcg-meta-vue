<template>
  <div class="mx-auto max-w-340 p-3 max-sm:pb-6 md:p-8">
    <UiSeriesHeader
      title="Archetype Tier"
      :visible="!!currentSeries"
      :events="currentSeries?.events ?? 0"
      :wins="totalWins"
      :decks="currentSeries?.totalDecks ?? 0"
      :archetypes="allRows.length"
    />

    <p
      v-if="currentSeries?.preliminary"
      class="mb-1 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200/80"
    >
      Only {{ currentSeries.events }} events so far — tiers are preliminary and will shift as more
      results come in.
    </p>

    <details class="group mb-2 text-xs text-gray-500 dark:text-gray-400">
      <summary
        class="w-fit cursor-pointer list-none text-ruri select-none hover:underline dark:text-sora/80"
      >
        <span class="inline-block transition-transform group-open:rotate-90">▸</span>
        How to read this table
      </summary>
      <ul class="mt-2 max-w-3xl list-disc space-y-1 pl-5 leading-relaxed">
        <li>
          <b>Score</b>
          (0–100) ranks archetypes by their share of placed decks, nudged up or down by how well
          those placements turn into wins. 100 is the strongest archetype this series.
        </li>
        <li>
          <b>Tiers</b>
          are cut by clustering the scores, so a tier holds archetypes with similar scores and tier
          sizes vary.
        </li>
        <li>
          <b>Use%</b>
          is the share of placed decks,
          <b>Win/Ev</b>
          the share of events won and
          <b>Win/Dk</b>
          wins per placed deck.
        </li>
        <li v-if="hasMovement">
          <b>Δ</b>
          is the rank change since {{ previousSeries?.label }}: ▲ climbed, ▼ dropped, NEW wasn't
          placed then.
        </li>
        <li>🐴 marks a dark horse: rarely played but winning far more often than average.</li>
        <li>Hover a column header for its definition, and click it to sort.</li>
      </ul>
    </details>

    <div
      ref="filterBarRef"
      class="sticky top-(--nav-h) z-40 -mx-3 flex flex-wrap items-center gap-2 bg-white px-3 py-2.5 transition-transform duration-300 md:-mx-8 md:px-8 dark:bg-nalika-bg"
      :class="hideFilter ? '-translate-y-full' : 'translate-y-0'"
    >
      <input
        v-model="query"
        type="search"
        placeholder="Search card or color"
        class="h-8 min-w-0 flex-1 rounded-full border border-gray-200 bg-gray-50 px-3 text-xs text-gray-700 placeholder:text-gray-400 focus:border-sora focus:outline-none sm:max-w-56 sm:flex-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      />
      <select
        :value="`${sortKey}:${sortDir}`"
        class="h-8 rounded-full border border-gray-200 bg-gray-50 px-2 text-xs text-gray-600 md:hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        aria-label="Sort"
        @change="onSortSelect"
      >
        <option
          v-for="opt in sortOptions"
          :key="opt.key"
          :value="`${opt.key}:${opt.key === 'rank' ? 'asc' : 'desc'}`"
        >
          Sort: {{ opt.label }}
        </option>
      </select>
      <div class="flex basis-full items-center gap-1.5 sm:basis-auto">
        <button
          v-for="(hex, color) in COLOR_HEX"
          :key="color"
          class="flex h-7 cursor-pointer items-center gap-1 rounded-full border px-2 text-xs transition-colors"
          :class="
            colors.includes(color)
              ? 'border-sora bg-sora/10 text-sumi dark:text-nalika-text'
              : 'border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
          "
          :aria-pressed="colors.includes(color)"
          :title="`Only archetypes with ${color}`"
          @click="toggleColor(color)"
        >
          <span class="h-2.5 w-2.5 rounded-full" :style="{ background: hex }" />
          <span class="max-sm:hidden">{{ color }}</span>
        </button>
        <button
          class="ml-auto flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors sm:ml-1"
          :class="
            groupByColor
              ? 'bg-ruri text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          "
          :aria-pressed="groupByColor"
          @click="groupByColor = !groupByColor"
        >
          <span
            class="inline-block h-3 w-3 rounded-full border"
            :class="groupByColor ? 'border-white/50 bg-white/30' : 'border-gray-400 bg-transparent'"
          />
          Group by color
        </button>
      </div>
      <div v-if="isFiltered" class="flex items-center gap-2 text-xs text-gray-500 sm:ml-auto">
        <span>{{ shownCount }} of {{ allRows.length }}</span>
        <button
          class="cursor-pointer text-ruri hover:underline dark:text-sora"
          @click="clearFilters"
        >
          Clear
        </button>
      </div>
    </div>

    <TierMobileTierCard
      :sections="sections"
      :zero-rows="zeroRows"
      :show-zero-wins="showZeroWins"
      :collapsed="collapsed"
      :has-movement="hasMovement"
      :group-top="groupTop"
      @detail="openDetail"
      @toggle-section="toggleSection"
      @toggle-zero-wins="showZeroWins = !showZeroWins"
    />

    <TierTable
      :sections="sections"
      :zero-rows="zeroRows"
      :show-zero-wins="showZeroWins"
      :collapsed="collapsed"
      :sort-key="sortKey"
      :sort-dir="sortDir"
      :has-movement="hasMovement"
      @detail="openDetail"
      @sort="setSort"
      @toggle-section="toggleSection"
      @toggle-zero-wins="showZeroWins = !showZeroWins"
    />

    <section
      class="mt-6 rounded border border-gray-500/10 bg-shironezumi/2 p-2 dark:border-nalika-border dark:bg-nalika-surface"
    >
      <h2
        class="mb-2 text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted"
      >
        Color share
      </h2>
      <ChartSigPieChart
        :rows="allRows"
        :series-decks="currentSeries?.totalDecks ?? 0"
        :color-combo-data="currentSeries?.colorComboData ?? []"
      />
    </section>

    <!-- Unassigned Decks (collapsible) -->
    <UiCollapsibleSection
      v-if="unassignedDecks?.deckUrls?.length"
      :show="showUnassigned"
      :count="unassignedDecks.count"
      title="Unassigned Decks"
      @toggle="showUnassigned = !showUnassigned"
    >
      <ArchetypeDeckList :decks="unassignedDeckPreviews" :show-tech="false" />
    </UiCollapsibleSection>
  </div>
</template>

<script setup>
import manifest from '$data/archetypes/index.json'
import { useElementSize } from '@vueuse/core'
import cardMeta from '$data/card-meta.json'

const cardMetaMap = new Map(cardMeta.map(c => [c.id, c]))

const router = useRouter()
const { loadTierData } = useTierData()

await loadTierData()

const { selectedKey, currentSeries, previousSeries, allRows } = useSeriesState()

const { hideFilter } = useScrollHide()

const filterBarRef = ref(null)
// Measured, since the bar wraps to two lines on phones
const { height: filterBarH } = useElementSize(filterBarRef, undefined, { box: 'border-box' })
const groupTop = computed(() =>
  hideFilter.value ? 'var(--nav-h)' : `calc(var(--nav-h) + ${filterBarH.value}px)`,
)

const totalWins = computed(() => currentSeries.value?.winDecks ?? 0)

const {
  query,
  colors,
  groupByColor,
  sortKey,
  sortDir,
  collapsed,
  showZeroWins,
  hasMovement,
  isFiltered,
  sections,
  zeroRows,
  shownCount,
  setSort,
  toggleColor,
  toggleSection,
  clearFilters,
} = useTierList({ allRows, previousSeries })

const sortOptions = TIER_SORT_OPTIONS

function onSortSelect(e) {
  const [key, dir] = e.target.value.split(':')
  sortKey.value = key
  sortDir.value = dir
}

const { showUnassigned } = useCollapseState()

const unassignedDecks = computed(() => currentSeries.value?.unassignedDecks ?? null)

const unassignedDeckPreviews = computed(() => {
  const ud = unassignedDecks.value
  if (!ud?.deckUrls?.length) {
    return []
  }
  return ud.deckUrls.map((url, i) => {
    const cards = (ud.deckCardIds?.[i] ?? '')
      .split('|')
      .filter(Boolean)
      .map(part => {
        const [cardId, qty] = part.split(':')
        const info = cardMetaMap.get(cardId)
        return {
          cardId,
          qty: Number(qty),
          name: info?.name ?? cardId,
          type: info?.type ?? 'UNIT',
          color: info?.color ?? '',
          level: info?.level ?? 0,
          cost: info?.cost ?? 0,
          inclusionRate: 0,
        }
      })
    const meta = ud.deckMeta?.[i] ?? {}
    return {
      url,
      idx: i,
      isWinner: ud.deckWinnerFlags?.[i] ?? false,
      cards,
      date: meta.date ?? null,
      shop: meta.shop ?? '',
      place: meta.place ?? null,
    }
  })
})

function openDetail(row) {
  const entry = manifest.find(s => s.value === selectedKey.value)
  const idx =
    entry?.archetypes.findIndex(
      a => normalizeArchetypeName(a.combo) === normalizeArchetypeName(row.archetype),
    ) ?? -1
  if (idx === -1) {
    return
  }
  router.push({
    name: 'archetype-analysis',
    query: { series: selectedKey.value, arch: String(idx) },
  })
}
</script>
