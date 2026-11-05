<template>
  <!-- Phones: one row per stat (label, value and change, previous) with rules
       between, about half the height of the card grid; md+ is the grid -->
  <dl
    class="grid px-1 pb-1 max-md:divide-y max-md:divide-gray-500/10 md:grid-cols-3 md:gap-x-6 md:gap-y-4 lg:grid-cols-6 dark:max-md:divide-white/10"
  >
    <div v-for="m in metrics" :key="m.label" :class="ROW">
      <dt
        class="text-xxs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500 zh:text-xs zh:tracking-normal zh:text-gray-500"
      >
        {{ m.label }}
      </dt>
      <dd class="flex flex-wrap items-baseline gap-x-2 md:mt-1">
        <span
          class="text-base font-bold text-gray-700 tabular-nums md:text-lg dark:text-nalika-text"
        >
          {{ m.format(m.current) }}
        </span>
        <span
          class="rounded px-1.5 py-px text-xxs font-semibold tabular-nums"
          :class="deltaClass(m)"
        >
          {{ deltaText(m) }}
        </span>
      </dd>
      <dd class="text-xs text-gray-400 tabular-nums max-md:text-right md:mt-0.5 dark:text-gray-500">
        {{ $t('ui.compare.prev', { value: m.format(m.previous) }) }}
      </dd>
    </div>

    <div v-if="topColor" :class="ROW">
      <dt
        class="text-xxs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500 zh:text-xs zh:tracking-normal zh:text-gray-500"
      >
        {{ topColor.label }}
      </dt>
      <dd class="flex min-w-0 items-center gap-1 md:mt-1">
        <span
          v-for="c in colorsOf(topColor.current)"
          :key="c"
          class="h-2.5 w-2.5 shrink-0 rounded-full"
          :style="{ background: COLOR_HEX[c] }"
        />
        <span
          class="ml-0.5 truncate text-base font-bold text-gray-700 md:text-lg dark:text-nalika-text"
        >
          {{ comboName(topColor.current) }}
        </span>
      </dd>
      <dd class="truncate text-xs text-gray-400 max-md:text-right md:mt-0.5 dark:text-gray-500">
        {{
          topColor.current === topColor.previous
            ? $t('ui.compare.same')
            : $t('ui.compare.was', { value: comboName(topColor.previous) })
        }}
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

// A stat's box: a three-column row on phones, a stacked card from md up
const ROW = tw`min-w-0 max-md:grid max-md:grid-cols-[minmax(0,1fr)_auto_5.5rem] max-md:items-baseline max-md:gap-x-3 max-md:py-2`

const { t } = useI18n()

const isSame = m => m.format(m.current) === m.format(m.previous)

function deltaText(m) {
  if (isSame(m)) {
    return t('ui.compare.same')
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

// "Red+White" → "Red+White" / "紅+白"
function comboName(combo) {
  return combo ? combo.split('+').map(colorName).join('+') : '—'
}
</script>
