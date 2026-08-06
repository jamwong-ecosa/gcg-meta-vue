<template>
  <div
    class="mb-6 rounded border border-gray-500/10 bg-shironezumi/3 p-2 dark:border-nalika-border dark:bg-nalika-surface"
  >
    <h2
      class="mb-3 text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted"
    >
      Archetype Quadrants
    </h2>
    <ArchetypeQuadrantChart v-if="quadrantData.length" :items="quadrantData" />
    <p v-else class="py-4 text-center text-sm text-gray-400 dark:text-gray-500">No data</p>
  </div>
</template>

<script setup>
const ArchetypeQuadrantChart = defineAsyncComponent(
  () => import('@/components/archetype/ArchetypeQuadrantChart.vue'),
)

const { quadrantData } = inject('meta')
</script>
