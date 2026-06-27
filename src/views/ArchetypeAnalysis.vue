<template>
  <div class="mx-auto max-w-380 space-y-6 p-3 md:p-8">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-nalika-text">Archetype Analysis</h1>
      <div class="flex gap-2">
        <TierDropdown v-model="seriesKey" :options="seriesOptions" />
        <TierDropdown v-model="archKey" :options="archOptions" />
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
import manifest from '@/data/archetypes/index.json'

const router = useRouter()
const route = useRoute()

const archModules = import.meta.glob('@/data/archetypes/*/*.json')

const seriesOptions = manifest.map(s => ({
  value: s.value,
  label: s.label,
}))

const validSeries = manifest.map(s => s.value)
const seriesInitial = validSeries.includes(route.query.series)
  ? route.query.series
  : manifest[0]?.value ?? ''
const seriesKey = ref(seriesInitial)

const seriesManifest = computed(() =>
  manifest.find(s => s.value === seriesKey.value),
)

const archOptions = computed(() =>
  (seriesManifest.value?.archetypes ?? []).map((a, i) => ({
    value: String(i),
    label: a.combo,
  })),
)

const validArchKeys = computed(() => archOptions.value.map(o => o.value))
const archInitial = validArchKeys.value.includes(route.query.arch)
  ? route.query.arch
  : '0'
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
    const path = `/src/data/archetypes/${seriesVal}/${archIdx}.json`
    const mod = await archModules[path]?.()
    selectedArchetype.value = mod?.default ?? null
  } catch {
    selectedArchetype.value = null
  } finally {
    loading.value = false
  }
}

watch(seriesKey, (val) => {
  const archs = archOptions.value
  const newArch = archs.length ? '0' : ''
  archKey.value = newArch
  router.replace({ query: { series: val, arch: newArch } })
})

watch([seriesKey, archKey], async ([s, a]) => {
  router.replace({ query: { series: s, arch: a } })
  await loadArchetype(s, a)
}, { immediate: true })
</script>
