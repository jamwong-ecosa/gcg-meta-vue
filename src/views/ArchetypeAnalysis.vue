<template>
  <div class="mx-auto max-w-380 p-3 md:p-8">
    <div class="mb-3">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-nalika-text">Archetype Analysis</h1>
      <p v-if="currentSeriesData" class="mt-0.5 text-xs text-gray-500 dark:text-nalika-text-muted">
        {{ currentSeriesData.events }} events · {{ totalWins }} wins ·
        {{ currentSeriesData.totalDecks.toLocaleString() }} decks
      </p>
    </div>
    <div
      class="sticky top-12 z-40 -mx-3 bg-white px-3 py-3 transition-transform duration-300 md:-mx-8 md:px-8 dark:bg-nalika-bg"
      :class="hideFilter ? '-translate-y-full' : 'translate-y-0'"
    >
      <div class="flex flex-col gap-2">
        <TierDropdown v-model="seriesKey" class="w-fit md:max-w-md" :options="seriesOptions" />
        <ArchDropdown v-model="archKey" class="md:max-w-3xl" :options="archOptions" />
      </div>
    </div>

    <div v-if="loading" class="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
      Loading…
    </div>
    <ArchetypeDetail
      v-else-if="selectedArchetype"
      :key="`${seriesKey}-${archKey}`"
      :archetype="selectedArchetype"
    />
    <p v-else class="text-sm text-gray-400 dark:text-gray-500">Select a series and archetype</p>
  </div>
</template>

<script setup>
import manifest from '$data/archetypes/index.json'
import tierData from '$data/tiers.json'
import archModules from '@/utils/archModules'

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

const currentSeriesData = computed(() => tierData.find(s => s.value === seriesKey.value))

const { hideFilter } = useScrollHide(180)

const totalWins = computed(
  () => seriesManifest.value?.archetypes.reduce((s, a) => s + (a.winnerDeckCount || 0), 0) ?? 0,
)

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

const selectedArchetype = ref(null)
const loading = ref(false)

async function loadArchetype(seriesVal, archIdx) {
  if (!seriesVal || archIdx === '' || archIdx === undefined) {
    selectedArchetype.value = null
    return
  }
  loading.value = true
  try {
    const path = `/data-processed/archetypes/${seriesVal}/${archIdx}.json`
    const mod = await archModules[path]?.()
    selectedArchetype.value = mod?.default ?? null
  } catch {
    selectedArchetype.value = null
  } finally {
    loading.value = false
  }
}

watch(seriesKey, val => {
  const archs = archOptions.value
  const newArch = archs.length ? '0' : ''
  archKey.value = newArch
  router.replace({ query: { series: val, arch: newArch } })
})

watch(
  [seriesKey, archKey],
  async ([s, a]) => {
    router.replace({ query: { series: s, arch: a } })
    await loadArchetype(s, a)
  },
  { immediate: true },
)
</script>
