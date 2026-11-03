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

    <div
      ref="filterBarRef"
      class="sticky top-(--nav-h) z-40 -mx-3 flex items-center gap-3 bg-white px-3 py-3 transition-transform duration-300 md:-mx-8 md:px-8 dark:bg-nalika-bg"
      :class="hideFilter ? '-translate-y-full' : 'translate-y-0'"
    >
      <button
        class="flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
        :class="
          groupByColor
            ? 'bg-ruri text-white'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
        "
        @click="groupByColor = !groupByColor"
      >
        <span
          class="inline-block h-3 w-3 rounded-full border"
          :class="groupByColor ? 'border-white/50 bg-white/30' : 'border-gray-400 bg-transparent'"
        />
        Group by color
      </button>
    </div>

    <ChartSigPieChart
      :rows="allRows"
      :series-decks="currentSeries?.totalDecks ?? 0"
      :color-combo-data="currentSeries?.colorComboData ?? []"
      class="mb-6 md:mb-2"
    />
    <TierMobileTierCard
      :rows="tierRows"
      :group-by-color="groupByColor"
      :zero-win-rows="zeroWinRows"
      :show-zero-wins="showZeroWins"
      :group-top="groupTop"
      @detail="openDetail"
      @toggle-zero-wins="toggleZeroWins"
    />

    <TierTable
      :rows="tierRows"
      :zero-win-rows="zeroWinRows"
      :show-zero-wins="showZeroWins"
      :group-by-color="groupByColor"
      @detail="openDetail"
      @toggle-zero-wins="toggleZeroWins"
    />

    <!-- Unassigned Decks (collapsible) -->
    <UiCollapsibleSection
      v-if="unassignedDecks?.deckUrls?.length"
      :show="showUnassigned"
      :count="unassignedDecks.count"
      title="Unassigned Decks"
      @toggle="showUnassigned = !showUnassigned"
    >
      <div
        class="mb-1 text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500"
      >
        Winner Decks
      </div>
      <div class="flex flex-wrap gap-x-5 gap-y-2.5">
        <UiDeckPopover
          v-for="(d, i) in unassignedDeckPreviews.filter(d => d.isWinner)"
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
      <div
        v-if="!unassignedDeckPreviews.filter(d => d.isWinner).length"
        class="text-xs text-gray-400 dark:text-gray-500"
      >
        No winner decks
      </div>
      <div
        class="mt-3 mb-1 text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500"
      >
        Other Decks
      </div>
      <div class="flex flex-wrap gap-x-5 gap-y-2.5">
        <UiDeckPopover
          v-for="(d, i) in unassignedDeckPreviews.filter(d => !d.isWinner)"
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
import manifest from '$data/archetypes/index.json'
import { useStorage } from '@vueuse/core'
import cardMeta from '$data/card-meta.json'

const cardMetaMap = new Map(cardMeta.map(c => [c.id, c]))

function normalizeName(name) {
  return name.replace(/[（）]/g, c => (c === '（' ? '(' : ')')).replace(/\s*\(/g, '(')
}

const router = useRouter()
const { tierData, loadTierData } = useTierData()

await loadTierData()

const { seriesKey: selectedKey } = useSelectedSeries()

const currentSeries = computed(() => tierData.value.find(s => s.value === selectedKey.value))

const { hideFilter } = useScrollHide()

const filterBarRef = ref(null)
const filterBarH = computed(() => filterBarRef.value?.offsetHeight ?? 0)
const groupTop = computed(() =>
  hideFilter.value ? 'var(--nav-h)' : `calc(var(--nav-h) + ${filterBarH.value}px)`,
)

const totalWins = computed(() => currentSeries.value?.winDecks ?? 0)

const allRows = computed(() => currentSeries.value?.rows ?? [])

const tierRows = computed(() => allRows.value.filter(r => r.wins > 0))

const zeroWinRows = computed(() => allRows.value.filter(r => r.wins === 0))

const groupByColor = useStorage('gcg-group-color', false)
const showZeroWins = ref(false)

function toggleZeroWins() {
  showZeroWins.value = !showZeroWins.value
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
    return { url, idx: i, isWinner: ud.deckWinnerFlags?.[i] ?? false, cards }
  })
})

function openDetail(row) {
  const entry = manifest.find(s => s.value === selectedKey.value)
  const idx =
    entry?.archetypes.findIndex(a => normalizeName(a.combo) === normalizeName(row.archetype)) ?? -1
  if (idx === -1) {
    return
  }
  router.push({
    name: 'archetype-analysis',
    query: { series: selectedKey.value, arch: String(idx) },
  })
}
</script>
