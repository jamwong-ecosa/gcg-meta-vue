<template>
  <!-- Phones: one row per stat (label, value, change, previous) with rules
       between, about half the height of the card grid; the rows share the
       list's columns so values and changes line up, and the previous column
       is labelled once at the top. md+ is the card grid -->
  <dl
    class="grid px-1 pb-1 max-md:grid-cols-[minmax(0,1fr)_auto_auto_fit-content(5.5rem)] max-md:divide-y max-md:divide-gray-500/10 md:grid-cols-3 md:gap-x-6 md:gap-y-4 lg:grid-cols-6 dark:max-md:divide-white/10"
  >
    <div aria-hidden="true" class="col-span-full grid grid-cols-subgrid gap-x-3 pb-1 md:hidden">
      <span class="col-start-4 text-right text-xs text-gray-400 dark:text-gray-500">
        {{ $t('ui.compare.prev') }}
      </span>
    </div>
    <div v-for="m in metrics" :key="m.label" :class="ROW">
      <dt
        class="text-xxs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500 zh:text-xs zh:tracking-normal zh:text-gray-500"
      >
        {{ m.label }}
      </dt>
      <dd class="max-md:contents md:mt-1 md:flex md:flex-wrap md:items-baseline md:gap-x-2">
        <span
          class="text-base font-bold text-gray-700 tabular-nums max-md:text-right md:text-lg dark:text-nalika-text"
        >
          {{ m.format(m.current) }}
        </span>
        <span
          class="rounded px-1.5 py-px text-xxs font-semibold tabular-nums max-md:justify-self-start"
          :class="deltaClass(m)"
        >
          {{ deltaText(m) }}
        </span>
      </dd>
      <dd class="text-xs text-gray-400 tabular-nums max-md:text-right md:mt-0.5 dark:text-gray-500">
        <span class="max-md:sr-only">{{ $t('ui.compare.prev') }}</span>
        {{ m.format(m.previous) }}
      </dd>
    </div>

    <div v-if="topColor" :class="ROW">
      <dt
        class="text-xxs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500 zh:text-xs zh:tracking-normal zh:text-gray-500"
      >
        {{ topColor.label }}
      </dt>
      <dd class="flex min-w-0 items-center gap-1 max-md:justify-end md:mt-1">
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
      <dd
        class="truncate text-xs text-gray-400 max-md:col-start-4 max-md:text-right md:mt-0.5 dark:text-gray-500"
      >
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

// A stat's box: a row on the list's columns on phones, a stacked card from md up
const ROW = tw`min-w-0 max-md:col-span-full max-md:grid max-md:grid-cols-subgrid max-md:items-baseline max-md:gap-x-3 max-md:py-2`

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
