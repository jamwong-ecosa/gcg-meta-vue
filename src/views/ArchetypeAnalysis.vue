<template>
  <div class="mx-auto max-w-340 p-3 max-sm:pb-6 md:p-8">
    <UiSeriesHeader
      title="Archetype Analysis"
      :visible="!!currentSeriesData"
      :events="currentSeriesData?.events ?? 0"
      :wins="totalWins"
      :decks="currentSeriesData?.totalDecks ?? 0"
      :archetypes="seriesManifest?.archetypes.length ?? 0"
    />
    <div
      class="sticky top-12 z-40 -mx-3 mb-3 bg-white px-3 py-3 transition-transform duration-300 md:-mx-8 md:px-8 dark:bg-nalika-bg"
      :class="hideFilter ? '-translate-y-full' : 'translate-y-0'"
    >
      <div
        class="flex flex-col items-end gap-2 md:flex-row md:items-start md:justify-between md:gap-8"
      >
        <UiGeneralDropdown
          v-model="seriesKey"
          class="w-fit md:order-2 md:max-w-md md:shrink-0"
          :options="seriesOptions"
        />
        <ArchetypeDropdown
          v-model="archKey"
          class="max-w-full md:order-1 md:flex-1"
          :options="archOptions"
        />
      </div>
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

const seriesOptions = manifest.map(s => ({
  value: s.value,
  label: s.label,
}))

const validSeries = manifest.map(s => s.value)
const seriesInitial = validSeries.includes(route.query.series)
  ? route.query.series
  : (manifest[0]?.value ?? '')
const seriesKey = ref(seriesInitial)

const seriesManifest = computed(() => manifest.find(s => s.value === seriesKey.value))

const { tierData, loadTierData } = useTierData()
const { start, finish } = useLoadingBar()

const currentSeriesData = computed(() => tierData.value.find(s => s.value === seriesKey.value))

const { hideFilter } = useScrollHide(180)

const totalWins = computed(() => currentSeriesData.value?.winDecks ?? 0)

const archOptions = computed(() =>
  (seriesManifest.value?.archetypes ?? []).map((a, i) => ({
    value: String(i),
    details: `${a.cardCount} cards · ${a.winnerDeckCount} wins · ${a.deckCount} decks (${a.percent}%)`,
    colors: comboColors(a.combo),
    labelSegments: buildLabelSegments(a.combo, a.sigCards),
    tier: a.tier || null,
  })),
)

const validArchKeys = computed(() => archOptions.value.map(o => o.value))
const archInitial = validArchKeys.value.includes(route.query.arch) ? route.query.arch : '0'
const archKey = ref(archInitial)

let suppressArchReset = false
const selectedArchetype = ref(null)
const prevCardIds = ref(null)
const prevCards = ref(null)

async function loadPrevArchetype(seriesVal, combo) {
  prevCardIds.value = null
  prevCards.value = null
  const idx = manifest.findIndex(s => s.value === seriesVal)
  if (idx >= manifest.length - 1) {
    return
  }
  const prevEntry = manifest[idx + 1]
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
  suppressArchReset = true
  seriesKey.value = s
  archKey.value = archIndex
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

watch(archKey, val => {
  router.replace({ query: { series: seriesKey.value, arch: val } })
})

watch(seriesKey, val => {
  if (suppressArchReset) {
    suppressArchReset = false
    return
  }
  const newArch = archOptions.value.length ? '0' : ''
  archKey.value = newArch
  router.replace({ query: { series: val, arch: newArch } })
})

watch([seriesKey, archKey], async ([s, a]) => {
  await loadArchetype(s, a)
})

await loadTierData()
await loadArchetype(seriesKey.value, archKey.value)
</script>
