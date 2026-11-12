<template>
  <!-- The series' placed decks by play style: one stacked bar, then each
       style's decks, share and number of archetypes -->
  <section
    v-if="styles.length"
    class="mb-6 rounded border border-gray-500/10 bg-shironezumi/3 p-2 dark:border-nalika-border dark:bg-nalika-surface"
  >
    <h2
      class="mb-3 text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted zh:tracking-normal"
    >
      {{ $t('chart.dist.style') }}
    </h2>
    <div class="px-1">
      <div class="flex h-2 gap-px overflow-hidden rounded-full">
        <span
          v-for="item in styles"
          :key="item.style"
          :class="PLAY_STYLE_FILL[item.style]"
          :style="{ flexGrow: item.decks }"
        />
      </div>
      <dl class="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
        <div v-for="item in styles" :key="item.style" class="min-w-0">
          <dt>
            <UiHint
              class="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
              :text="$t(`tier.styleHelp.${item.style}`)"
            >
              <span class="h-2 w-2 rounded-full" :class="PLAY_STYLE_FILL[item.style]" />
              {{ $t(`tier.style.${item.style}`) }}
            </UiHint>
          </dt>
          <dd class="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
            <span class="text-xl font-bold text-gray-700 tabular-nums dark:text-nalika-text">
              {{ $n(item.decks) }}
            </span>
            <span class="text-xs font-semibold text-gray-400 tabular-nums dark:text-gray-500">
              {{ item.pct }}%
            </span>
            <span class="text-xs text-gray-400 dark:text-gray-500">
              · {{ $t('ui.seriesHeader.archetypes', { n: item.archetypes }, item.archetypes) }}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  </section>
</template>

<script setup>
const { currentSeries } = inject('meta')

// Placed decks and archetypes per play style, in PLAY_STYLES order. Shares are
// of the decks that belong to an archetype; empty for data built before styles
const styles = computed(() => {
  const rows = currentSeries.value?.rows ?? []
  const total = rows.reduce((n, r) => n + (r.style ? r.decks : 0), 0)
  return PLAY_STYLES.map(style => {
    const mine = rows.filter(r => r.style === style)
    const decks = mine.reduce((n, r) => n + r.decks, 0)
    return { style, decks, archetypes: mine.length, pct: percentOf(decks, total) }
  }).filter(item => item.decks > 0)
})
</script>
