<template>
  <div
    v-if="currentSeries"
    class="mb-6 rounded border border-gray-500/10 bg-shironezumi/2 p-2 dark:border-nalika-border dark:bg-nalika-surface"
  >
    <div class="mb-3 flex items-center justify-between gap-1">
      <h2
        class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted"
      >
        Archetype shift
      </h2>
    </div>
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <div
        v-for="m in metrics"
        :key="m.label"
        class="rounded border border-gray-500/10 bg-shironezumi/4 p-2 dark:border-nalika-border dark:bg-nalika-surface"
      >
        <div class="text-xs text-gray-500 dark:text-gray-400">{{ m.label }}</div>
        <div class="mt-1 flex items-center justify-between">
          <span class="text-lg font-bold" :class="m.textClass">{{ m.current }}</span>
          <span
            class="text-xs font-medium"
            :class="
              m.diff === 0
                ? 'text-gray-500 dark:text-gray-400'
                : m.diff > 0
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-red-600 dark:text-red-500'
            "
          >
            <template v-if="m.diff === 0">same</template>
            <template v-else>{{ m.diff > 0 ? '+' : '' }}{{ m.diff }}</template>
          </span>
        </div>
        <div v-if="m.sub" class="text-xs text-gray-400 dark:text-gray-500">{{ m.sub }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { currentSeries, previousSeries, previousPreviousSeries } = inject('meta')

function normalizeName(name) {
  return name.replace(/[（）]/g, c => (c === '（' ? '(' : ')')).replace(/\s*\(/g, '(')
}

const currentRows = computed(() => currentSeries.value?.rows ?? [])
const prevRows = computed(() => previousSeries.value?.rows ?? [])
const prevPrevRows = computed(() => previousPreviousSeries.value?.rows ?? [])

const currentNames = computed(() => new Set(currentRows.value.map(r => normalizeName(r.archetype))))
const prevNames = computed(() => new Set(prevRows.value.map(r => normalizeName(r.archetype))))
const prevPrevNames = computed(
  () => new Set(prevPrevRows.value.map(r => normalizeName(r.archetype))),
)

const newCount = computed(
  () => currentRows.value.filter(r => !prevNames.value.has(normalizeName(r.archetype))).length,
)
const persistedCount = computed(
  () => currentRows.value.filter(r => prevNames.value.has(normalizeName(r.archetype))).length,
)
const removedCount = computed(
  () => prevRows.value.filter(r => !currentNames.value.has(normalizeName(r.archetype))).length,
)

const prevNewCount = computed(
  () => prevRows.value.filter(r => !prevPrevNames.value.has(normalizeName(r.archetype))).length,
)

const prevRemovedCount = computed(
  () => prevPrevRows.value.filter(r => !prevNames.value.has(normalizeName(r.archetype))).length,
)

const prevPersistedCount = computed(
  () => prevRows.value.filter(r => prevPrevNames.value.has(normalizeName(r.archetype))).length,
)

const metrics = computed(() => [
  {
    label: 'New',
    current: newCount.value,
    previous: prevNewCount.value,
    diff: newCount.value - prevNewCount.value,
    sub: `previous: ${prevNewCount.value}`,
    textClass: 'text-green-700 dark:text-green-300',
  },
  {
    label: 'Persisted',
    current: persistedCount.value,
    previous: prevPersistedCount.value,
    diff: persistedCount.value - prevPersistedCount.value,
    sub: `previous: ${prevPersistedCount.value}`,
    textClass: 'text-gray-700 dark:text-nalika-text',
  },
  {
    label: 'Gone',
    current: removedCount.value,
    previous: prevRemovedCount.value,
    diff: removedCount.value - prevRemovedCount.value,
    sub: `previous: ${prevRemovedCount.value}`,
    textClass: 'text-red-700 dark:text-red-300',
  },
])
</script>
