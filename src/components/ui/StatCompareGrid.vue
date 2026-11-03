<template>
  <dl class="grid grid-cols-2 gap-x-6 gap-y-4 px-1 pb-1 md:grid-cols-3 lg:grid-cols-6">
    <div v-for="m in metrics" :key="m.label" class="min-w-0">
      <dt class="text-xxs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500">
        {{ m.label }}
      </dt>
      <dd class="mt-1 flex flex-wrap items-baseline gap-x-2">
        <span class="text-lg font-bold text-gray-700 tabular-nums dark:text-nalika-text">
          {{ m.format(m.current) }}
        </span>
        <span
          class="rounded px-1.5 py-px text-xxs font-semibold tabular-nums"
          :class="deltaClass(m)"
        >
          {{ deltaText(m) }}
        </span>
      </dd>
      <dd class="mt-0.5 text-xs text-gray-400 tabular-nums dark:text-gray-500">
        prev {{ m.format(m.previous) }}
      </dd>
    </div>

    <div v-if="topColor" class="min-w-0">
      <dt class="text-xxs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500">
        {{ topColor.label }}
      </dt>
      <dd class="mt-1 flex items-center gap-1">
        <span
          v-for="c in colorsOf(topColor.current)"
          :key="c"
          class="h-2.5 w-2.5 shrink-0 rounded-full"
          :style="{ background: COLOR_HEX[c] }"
        />
        <span class="ml-0.5 truncate text-lg font-bold text-gray-700 dark:text-nalika-text">
          {{ topColor.current || '—' }}
        </span>
      </dd>
      <dd class="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
        {{ topColor.current === topColor.previous ? 'same' : `was ${topColor.previous || '—'}` }}
      </dd>
    </div>
  </dl>
</template>

<script setup>
// metrics: [{ label, current, previous, diff, format }]
// topColor: { label, current, previous } — color names like "Red+White"
defineProps({
  metrics: { type: Array, required: true },
  topColor: { type: Object, default: null },
})

const isSame = m => m.format(m.current) === m.format(m.previous)

function deltaText(m) {
  if (isSame(m)) {
    return 'same'
  }
  return `${m.diff > 0 ? '+' : ''}${m.format(m.diff)}`
}

function deltaClass(m) {
  if (isSame(m)) {
    return tw`bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400`
  }
  return m.diff > 0
    ? tw`bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-400`
    : tw`bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-400`
}

function colorsOf(combo) {
  return (combo ?? '').split('+').filter(c => COLOR_HEX[c])
}
</script>
