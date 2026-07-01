<template>
  <div class="mx-auto max-w-380 p-3 pb-6 md:p-8">
    <div class="mb-3">
      <h1 class="text-2xl font-bold text-sumi dark:text-nalika-text">Archetype Tier</h1>
      <div
        v-if="currentSeries"
        class="mt-0.5 flex flex-wrap gap-x-1 text-xs text-gray-500 dark:text-nalika-text-muted"
      >
        <span>{{ currentSeries.events }} events</span>
        <span>· {{ totalWins }} wins</span>
        <span>· {{ currentSeries.totalDecks.toLocaleString() }} decks</span>
        <span>· {{ currentSeries.rows.length }} archetypes</span>
      </div>
    </div>

    <div
      class="sticky top-12 z-40 -mx-3 bg-white px-3 py-3 transition-transform duration-300 md:-mx-8 md:px-8 dark:bg-nalika-bg"
      :class="hideFilter ? '-translate-y-full' : 'translate-y-0'"
    >
      <GeneralDropdown
        v-model="selectedKey"
        class="ml-auto w-fit md:max-w-md"
        :options="seriesOptions"
      />
    </div>

    <div class="space-y-3 md:hidden">
      <MobileTierCard v-for="row in rows" :key="row.archetype" :row="row" @detail="openDetail" />
    </div>

    <TierTable :rows="rows" @detail="openDetail" />

    <ArchetypeModal
      v-if="detailArch"
      :archetype="detailArch"
      :tier="detailTier"
      @close="closeDetail"
    />
  </div>
</template>

<script setup>
import tierData from '$data/tiers.json'
import manifest from '$data/archetypes/index.json'
import archModules from '@/utils/archModules'

function normalizeName(name) {
  return name.replace(/[（）]/g, c => (c === '（' ? '(' : ')')).replace(/\s*\(/g, '(')
}

const router = useRouter()
const route = useRoute()

const seriesOptions = tierData.map(s => ({
  value: s.value,
  label: s.label,
}))

const validSeries = tierData.map(s => s.value)
const initial = validSeries.includes(route.query.series) ? route.query.series : tierData[0]?.value
const selectedKey = ref(initial ?? '')

watch(selectedKey, val => {
  router.replace({ query: { series: val } })
})

const currentSeries = computed(() => tierData.find(s => s.value === selectedKey.value))

const { hideFilter } = useScrollHide()

const totalWins = computed(() => rows.value.reduce((sum, r) => sum + (r.wins || 0), 0))

const rows = computed(() => {
  return currentSeries.value ? currentSeries.value.rows : []
})

const detailArch = ref(null)
const detailTier = ref(null)

function closeDetail() {
  detailArch.value = null
  detailTier.value = null
}

async function openDetail(row) {
  const entry = manifest.find(s => s.value === selectedKey.value)
  if (!entry) {
    return
  }
  const idx = entry.archetypes.findIndex(
    a => normalizeName(a.combo) === normalizeName(row.archetype),
  )
  if (idx === -1) {
    return
  }
  const path = `/data-processed/archetypes/${selectedKey.value}/${idx}.json`
  const mod = await archModules[path]?.()
  detailArch.value = mod?.default ?? null
  detailTier.value = row.tier ?? null
}
</script>
