<template>
  <div class="mx-auto max-w-380 space-y-6 p-3 md:p-8">
    <div class="flex justify-between gap-2 max-md:flex-col md:items-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-nalika-text">Archetype Tier</h1>
      <TierDropdown v-model="selectedKey" :options="seriesOptions" />
    </div>

    <div class="space-y-3 md:hidden">
      <MobileTierCard v-for="row in rows" :key="row.archetype" :row="row" />
    </div>

    <TierTable :rows="rows" />
  </div>
</template>

<script setup>
import tierData from '$data/tiers.json'

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

const rows = computed(() => {
  const series = tierData.find(s => s.value === selectedKey.value)
  return series ? series.rows : []
})
</script>
