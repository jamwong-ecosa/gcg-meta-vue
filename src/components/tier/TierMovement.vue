<template>
  <span
    v-if="move && !(compact && !move.isNew && !move.delta)"
    class="inline-block text-right font-mono tabular-nums"
    :class="[compact ? 'text-xs' : 'min-w-8 text-xs', moveClass]"
    :title="moveTitle"
  >
    {{ moveText }}
  </span>
</template>

<script setup>
const props = defineProps({
  // { delta, prevRank, prevTier } | { isNew: true } | null
  move: { type: Object, default: null },
  rank: { type: Number, default: 0 },
  tier: { type: String, default: '' },
  // Inline next to other text (mobile rows): smaller, and no "–" for unchanged
  compact: { type: Boolean, default: false },
})

const moveText = computed(() => {
  const m = props.move
  if (m?.isNew) {
    return 'NEW'
  }
  if (!m?.delta) {
    return '–'
  }
  return `${m.delta > 0 ? '▲' : '▼'}${Math.abs(m.delta)}`
})

const moveClass = computed(() => {
  const m = props.move
  if (m?.isNew) {
    return tw`text-xxs font-semibold text-sky-600 dark:text-sky-400`
  }
  if (!m?.delta) {
    return tw`text-gray-300 dark:text-gray-600`
  }
  return m.delta > 0 ? tw`text-green-600 dark:text-green-400` : tw`text-red-500 dark:text-red-400`
})

const moveTitle = computed(() => {
  const m = props.move
  if (m?.isNew) {
    return 'New this series'
  }
  const tierPart = m.prevTier !== props.tier ? `, tier ${m.prevTier} → ${props.tier}` : ''
  return `Rank ${m.prevRank} → ${props.rank}${tierPart}`
})
</script>
