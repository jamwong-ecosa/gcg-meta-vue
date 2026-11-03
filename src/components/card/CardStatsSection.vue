<template>
  <div
    class="mb-6 rounded border border-gray-500/10 bg-shironezumi/2 p-2 dark:border-nalika-border dark:bg-nalika-surface"
  >
    <div class="mb-3 flex items-center justify-between gap-1">
      <h2
        class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted"
      >
        Card stats
      </h2>
      <div v-if="seriesTimeline" class="text-xs text-gray-500 tabular-nums dark:text-gray-400">
        {{ seriesTimeline }}
      </div>
    </div>

    <dl class="grid grid-cols-3 gap-x-6 px-1 sm:w-fit sm:gap-x-10">
      <div v-for="s in summary" :key="s.label" class="min-w-0">
        <dt
          class="text-xxs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500"
        >
          {{ s.label }}
        </dt>
        <dd class="mt-1 flex items-baseline gap-1.5">
          <span class="text-lg font-bold text-gray-700 tabular-nums dark:text-nalika-text">
            {{ s.value }}
          </span>
          <span v-if="s.pct != null" class="text-xs text-gray-400 tabular-nums dark:text-gray-500">
            {{ s.pct }}%
          </span>
        </dd>
      </div>
    </dl>

    <div v-if="colorCounts.length" class="mt-5 px-1">
      <h3 class="text-xxs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500">
        Used by color
      </h3>
      <div class="mt-2 flex h-2 gap-px overflow-hidden rounded-full">
        <span
          v-for="item in colorCounts"
          :key="item.color"
          :style="{ flexGrow: item.count, background: item.hex }"
          :title="`${item.color}: ${item.count}`"
        />
      </div>
      <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <li v-for="item in colorCounts" :key="item.color" class="flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full" :style="{ background: item.hex }" />
          <span class="text-gray-500 dark:text-gray-400">{{ item.color }}</span>
          <span class="font-mono font-bold text-gray-700 tabular-nums dark:text-nalika-text">
            {{ item.count }}
          </span>
        </li>
      </ul>
    </div>

    <div v-if="productGroups.length" class="mt-5 space-y-4 px-1">
      <section v-for="group in productGroups" :key="group.prefix">
        <h3
          class="text-xxs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500"
        >
          {{ group.label }}
        </h3>
        <!-- Column flow so the share ranking reads top-to-bottom, then across -->
        <ul class="mt-1.5 gap-x-8 sm:columns-2 xl:columns-3">
          <li
            v-for="item in group.items"
            :key="item.name"
            class="mb-1 grid break-inside-avoid grid-cols-[3.25rem_minmax(0,1fr)_3rem_3.5rem] items-baseline gap-2 text-xs"
            :title="`${item.count} of ${item.total} cards used (${item.pct}%)`"
          >
            <span class="font-mono text-xxs text-gray-400 dark:text-gray-500">{{ item.code }}</span>
            <span class="flex min-w-0 items-center gap-1.5">
              <span class="truncate text-gray-600 dark:text-gray-300">
                {{ item.title }}
              </span>
              <span
                v-if="item.isNew"
                class="shrink-0 rounded bg-green-100 px-1 text-xxs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300"
              >
                NEW
              </span>
            </span>
            <span
              class="h-1.5 self-center overflow-hidden rounded-full bg-gray-200/70 dark:bg-gray-700"
            >
              <span
                class="block h-full rounded-full"
                :class="item.isNew ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-500'"
                :style="{ width: `${item.pct}%` }"
              />
            </span>
            <span
              class="text-right font-mono font-bold text-gray-700 tabular-nums dark:text-nalika-text"
            >
              <span>{{ item.count }}</span>
              <span class="font-normal text-gray-400 dark:text-gray-500">/{{ item.total }}</span>
            </span>
          </li>
        </ul>
      </section>
    </div>
    <p v-else class="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
      Product info unavailable
    </p>
  </div>
</template>

<script setup>
const {
  aggregationResult,
  cardMeta,
  cardInfoById,
  eventCutoffDate,
  eventMinDate,
  currentSeries,
  seriesTimeline,
} = inject('meta')

const GROUP_LABELS = { GD: 'Boosters', ST: 'Starter decks', EB: 'Extra boosters' }
const GROUP_ORDER = ['GD', 'ST', 'EB']

const colorFilter = useColorFilter()
const { totalCardCount, usedCardCount } = useCardEligibility({
  cardMeta,
  aggregationResult,
  eventCutoffDate,
  eventMinDate,
  colorFilter,
  currentSeries,
})
const { archetypeProductGroups, colorCounts } = useProductGroups({
  aggregationResult,
  cardInfoById,
  eventMinDate,
  eventCutoffDate,
})

const summary = computed(() => {
  const total = totalCardCount.value
  const used = usedCardCount.value
  return [
    { label: 'Released', value: total },
    { label: 'Used', value: used, pct: percentOf(used, total) },
    { label: 'Unused', value: total - used, pct: percentOf(total - used, total) },
  ]
})

// "[GD05] Freedom Ascension" → code "GD05", title "Freedom Ascension"
const productGroups = computed(() =>
  archetypeProductGroups.value
    .map(group => ({
      prefix: group.prefix,
      label: GROUP_LABELS[group.prefix] ?? group.prefix,
      items: group.items
        .map(item => {
          const [, code, title] = item.name.match(/^\[(.+?)\]\s*(.*)$/) ?? [null, '', item.name]
          return { ...item, code, title, pct: percentOf(item.count, item.total) }
        })
        // Bars show the share of each product in use, so rank by that share
        .sort((a, b) => b.pct - a.pct || b.count - a.count),
    }))
    .sort((a, b) => rank(a.prefix) - rank(b.prefix)),
)

function rank(prefix) {
  const i = GROUP_ORDER.indexOf(prefix)
  return i === -1 ? GROUP_ORDER.length : i
}
</script>
