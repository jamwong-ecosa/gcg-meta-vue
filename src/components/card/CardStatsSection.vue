<template>
  <div
    class="mb-6 rounded border border-gray-500/10 bg-shironezumi/2 p-2 dark:border-nalika-border dark:bg-nalika-surface"
  >
    <div class="mb-3 flex items-center justify-between gap-1">
      <h2
        class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted zh:tracking-normal"
      >
        {{ $t('card.stats.title') }}
      </h2>
      <div v-if="seriesTimeline" class="text-xs text-gray-500 tabular-nums dark:text-gray-400">
        {{ seriesTimeline }}
      </div>
    </div>

    <dl class="grid grid-cols-3 gap-x-6 px-1 sm:w-fit sm:gap-x-10">
      <div v-for="s in summary" :key="s.label" class="min-w-0">
        <dt
          class="text-xxs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500 zh:text-xs zh:tracking-normal zh:text-gray-500"
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
      <h3
        class="text-xxs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500 zh:text-xs zh:tracking-normal zh:text-gray-500"
      >
        {{ $t('card.stats.usedByColor') }}
      </h3>
      <div class="mt-2 flex h-2 gap-px overflow-hidden rounded-full">
        <span
          v-for="item in colorCounts"
          :key="item.color"
          :style="{ flexGrow: item.count, background: item.hex }"
          :title="`${colorName(item.color)}: ${item.count}`"
        />
      </div>
      <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <li v-for="item in colorCounts" :key="item.color" class="flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full" :style="{ background: item.hex }" />
          <span class="text-gray-500 dark:text-gray-400">{{ colorName(item.color) }}</span>
          <span class="font-mono font-bold text-gray-700 tabular-nums dark:text-nalika-text">
            {{ item.count }}
          </span>
        </li>
      </ul>
    </div>

    <div v-if="productGroups.length" class="mt-5 space-y-3 px-1 sm:space-y-4">
      <section v-for="group in productGroups" :key="group.prefix">
        <!-- Phones: each group folds to one summary line (products, cards used of
             released), tap to open; sm+ always shows the list -->
        <h3>
          <button
            class="flex w-full items-baseline gap-2 text-left sm:pointer-events-none"
            :aria-expanded="isOpen(group.prefix)"
            @click="toggle(group.prefix)"
          >
            <span
              class="text-xxs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500 zh:text-xs zh:tracking-normal zh:text-gray-500"
            >
              {{ group.label }}
            </span>
            <span class="text-xs text-gray-400 sm:hidden dark:text-gray-500">
              {{ $t('card.stats.products', group.items.length) }}
            </span>
            <span
              class="ml-auto font-mono text-xs font-bold text-gray-700 tabular-nums sm:hidden dark:text-nalika-text"
            >
              {{ group.count }}
              <span class="font-normal text-gray-400 dark:text-gray-500">/{{ group.total }}</span>
            </span>
            <svg
              class="size-4 shrink-0 self-center text-gray-400 transition-transform sm:hidden"
              :class="isOpen(group.prefix) && 'rotate-180'"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </h3>
        <!-- Column flow so the share ranking reads top-to-bottom, then across -->
        <ul
          class="mt-1.5 gap-x-8 sm:block sm:columns-2 xl:columns-3"
          :class="!isOpen(group.prefix) && 'hidden'"
        >
          <li
            v-for="item in group.items"
            :key="item.name"
            class="mb-1 grid break-inside-avoid grid-cols-[3.25rem_minmax(0,1fr)_3rem_3.5rem] items-baseline gap-2 text-xs"
            :title="
              $t('card.stats.usedOfTotal', { count: item.count, total: item.total, pct: item.pct })
            "
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
                {{ $t('card.stats.new') }}
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
      {{ $t('card.stats.productUnavailable') }}
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

const { t, te } = useI18n()

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
    { label: t('card.stats.released'), value: total },
    { label: t('card.stats.used'), value: used, pct: percentOf(used, total) },
    {
      label: t('card.stats.unused'),
      value: total - used,
      pct: percentOf(total - used, total),
    },
  ]
})

// "[GD05] Freedom Ascension" → code "GD05", title "Freedom Ascension"
const productGroups = computed(() =>
  archetypeProductGroups.value
    .map(group => ({
      prefix: group.prefix,
      label: te(`card.stats.group.${group.prefix}`)
        ? t(`card.stats.group.${group.prefix}`)
        : group.prefix,
      items: group.items
        .map(item => {
          const [, code, title] = item.name.match(/^\[(.+?)\]\s*(.*)$/) ?? [null, '', item.name]
          return { ...item, code, title, pct: percentOf(item.count, item.total) }
        })
        // Bars show the share of each product in use, so rank by that share
        .sort((a, b) => b.pct - a.pct || b.count - a.count),
      // Cards used of released across the group, for its folded summary line
      count: group.items.reduce((n, item) => n + item.count, 0),
      total: group.items.reduce((n, item) => n + item.total, 0),
    }))
    .sort((a, b) => rank(a.prefix) - rank(b.prefix)),
)

// Phones only (sm+ always shows every list): which groups are open
const openGroups = ref(new Set())
const isOpen = prefix => openGroups.value.has(prefix)
function toggle(prefix) {
  const next = new Set(openGroups.value)
  if (!next.delete(prefix)) {
    next.add(prefix)
  }
  openGroups.value = next
}

function rank(prefix) {
  const i = GROUP_ORDER.indexOf(prefix)
  return i === -1 ? GROUP_ORDER.length : i
}
</script>
