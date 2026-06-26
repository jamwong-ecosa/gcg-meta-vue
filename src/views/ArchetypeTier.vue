<template>
  <div class="mx-auto max-w-380 space-y-6 p-3 md:p-8">
    <div class="flex items-center justify-between">
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
import { ref, computed } from 'vue'
import { rowsJun, rowsMay, rowsMar } from '@/data/tiers'

const seriesOptions = [
  { value: 'jun', label: 'NTC MISSION3（6月開催）' },
  { value: 'may', label: 'NTC MISSION3（5月開催）' },
  { value: 'mar', label: 'NTC MISSION2（3月開催）' },
]

const selectedKey = ref('jun')
const map = { jun: rowsJun, may: rowsMay, mar: rowsMar }
const rows = computed(() => map[selectedKey.value])
</script>
