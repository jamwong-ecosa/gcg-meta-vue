<template>
  <div class="mx-auto max-w-340 p-3 max-sm:pb-6 md:p-8">
    <UiSeriesHeader
      title="Archetype Analysis"
      :visible="!!currentSeriesData"
      :events="currentSeriesData?.events ?? 0"
      :wins="currentSeriesData?.winDecks ?? 0"
      :decks="currentSeriesData?.totalDecks ?? 0"
      :archetypes="seriesManifest?.archetypes.length ?? 0"
    />
    <div
      class="sticky top-(--nav-h) z-40 -mx-3 mb-3 bg-white px-3 py-3 transition-transform duration-300 md:-mx-8 md:px-8 dark:bg-nalika-bg"
      :class="hideFilter ? '-translate-y-full' : 'translate-y-0'"
    >
      <ArchetypeDropdown v-model="archKey" :options="archOptions" />
    </div>

    <template v-if="selectedArchetype">
      <ArchetypeTimeline
        :combo="selectedArchetype.combo"
        :current-series-key="seriesKey"
        @navigate="onTimelineNavigate"
      />
      <ArchetypeDetail
        :key="`${seriesKey}-${archKey}`"
        :archetype="selectedArchetype"
        :prev-card-ids="prevCardIds"
        :removed-cards="removedCards"
      />
    </template>
    <p v-else class="text-sm text-gray-400 dark:text-gray-500">Select a series and archetype</p>
  </div>
</template>

<script setup>
import manifest from '$data/archetypes/index.json'

function comboColors(combo) {
  const baseCombo = (combo ?? '').split(' (')[0]
  return baseCombo
    .split('+')
    .map(c => c.trim())
    .filter(Boolean)
    .map(c => COLOR_HEX[c] || '#718096')
}

const router = useRouter()
const route = useRoute()

const { tierData, loadTierData } = useTierData()
const { start, finish } = useLoadingBar()

await loadTierData()

const { seriesKey } = useSelectedSeries()

const seriesManifest = computed(() => manifest.find(s => s.value === seriesKey.value))

const currentSeriesData = computed(() => tierData.value.find(s => s.value === seriesKey.value))

const { hideFilter } = useScrollHide(180)

function normalizeCombo(s) {
  return s.replace(/[（）]/g, c => (c === '（' ? '(' : ')')).replace(/\s*\(/g, '(')
}

const archOptions = computed(() => {
  const rows = currentSeriesData.value?.rows ?? []
  const rowOrder = combo => {
    const normalized = normalizeCombo(combo)
    const idx = rows.findIndex(r => normalizeCombo(r.archetype) === normalized)
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
  }
  return (seriesManifest.value?.archetypes ?? [])
    .map((a, i) => ({
      value: String(i),
      details: `${a.cardCount} cards · ${a.winnerDeckCount} wins · ${a.deckCount} decks (${a.percent}%)`,
      colors: comboColors(a.combo),
      labelSegments: buildLabelSegments(a.combo, a.sigCards),
      tier: a.tier || null,
      combo: a.combo,
    }))
    .sort((x, y) => rowOrder(x.combo) - rowOrder(y.combo))
})

const validArchKeys = computed(() => archOptions.value.map(o => o.value))
// Like seriesKey, the archetype lives in the URL and is pinned to this page
let lastArch = ''
const archKey = computed({
  get() {
    if (route.name !== 'archetype-analysis') {
      return lastArch
    }
    const valid = validArchKeys.value
    lastArch = valid.includes(route.query.arch) ? route.query.arch : valid.length ? '0' : ''
    return lastArch
  },
  set(val) {
    router.replace({ query: { series: seriesKey.value, arch: val } })
  },
})

const selectedArchetype = ref(null)
const prevCardIds = ref(null)
const prevCards = ref(null)

async function loadPrevArchetype(seriesVal, combo) {
  prevCardIds.value = null
  prevCards.value = null
  const currentEntry = manifest.find(s => s.value === seriesVal)
  if (!currentEntry?.eventMinDate) {
    return
  }
  const prevEntry = manifest
    .filter(
      s => s.value !== seriesVal && s.eventMaxDate && s.eventMaxDate < currentEntry.eventMinDate,
    )
    .sort((a, b) => b.eventMaxDate.localeCompare(a.eventMaxDate))[0]
  if (!prevEntry) {
    return
  }
  const prevArch = prevEntry.archetypes.find(a => a.combo === combo)
  if (!prevArch) {
    return
  }
  const prevIdx = prevEntry.archetypes.indexOf(prevArch)
  const path = `/data-processed/archetypes/${prevEntry.value}/${prevIdx}.json`
  try {
    const mod = await archModules[path]?.()
    const data = mod?.default ?? null
    if (!data) {
      return
    }
    const all = [...(data.cards ?? []), ...(data.filteredCards ?? [])]
    prevCardIds.value = new Set(all.map(c => c.cardId))
    prevCards.value = all
  } catch {
    // previous series not available
  }
}

const removedCards = computed(() => {
  if (!prevCards.value || !selectedArchetype.value) {
    return []
  }
  const currentCards = [
    ...(selectedArchetype.value.cards ?? []),
    ...(selectedArchetype.value.filteredCards ?? []),
  ]
  const currentIds = new Set(currentCards.map(c => c.cardId))
  return prevCards.value.filter(c => !currentIds.has(c.cardId))
})

function onTimelineNavigate({ seriesKey: s, archIndex }) {
  router.replace({ query: { series: s, arch: archIndex } })
}

async function loadArchetype(seriesVal, archIdx) {
  if (!seriesVal || archIdx === '' || archIdx === undefined) {
    selectedArchetype.value = null
    return
  }
  start()
  try {
    const path = `/data-processed/archetypes/${seriesVal}/${archIdx}.json`
    const mod = await archModules[path]?.()
    selectedArchetype.value = mod?.default ?? null
    if (selectedArchetype.value) {
      await loadPrevArchetype(seriesVal, selectedArchetype.value.combo)
    }
  } catch {
    selectedArchetype.value = null
  } finally {
    finish()
  }
}

watch([seriesKey, archKey], async ([s, a]) => {
  await loadArchetype(s, a)
})

await loadArchetype(seriesKey.value, archKey.value)
</script>
