<template>
  <div
    class="mb-6 rounded border border-gray-500/10 bg-shironezumi/2 p-2 dark:border-nalika-border dark:bg-nalika-surface"
  >
    <div class="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2
        class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted"
      >
        Archetype Timeline
      </h2>
      <p v-if="timeline.length > 1" class="text-xxs text-gray-400 dark:text-gray-500">
        Small figures: change from the series before
      </p>
    </div>
    <!-- One table at every width; phones drop the raw counts and the arrow, and
         split the series name over two lines -->
    <div v-if="timeline.length > 1">
      <div>
        <table class="w-full table-fixed text-xs">
          <colgroup>
            <col />
            <col class="w-9 sm:w-14" />
            <col v-for="m in metrics" :key="m.key" class="w-[58px] sm:w-[72px]" />
            <col v-if="!isPhone" class="w-6" />
          </colgroup>
          <thead>
            <tr class="border-b border-gray-200 text-left dark:border-gray-700">
              <th class="pr-3 pb-2 font-semibold text-gray-500 dark:text-gray-400">Series</th>
              <th class="pb-2 font-semibold text-gray-500 dark:text-gray-400">Tier</th>
              <th
                v-for="m in metrics"
                :key="m.key"
                class="pb-2 pl-2 text-right font-semibold text-gray-500 sm:pl-3 dark:text-gray-400"
                :title="m.help"
              >
                {{ m.label }}
              </th>
              <th v-if="!isPhone" class="pb-2" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in timeline"
              :key="entry.seriesKey"
              class="group border-b border-gray-500/5 last:border-0"
              :class="
                entry.isCurrent
                  ? 'bg-primary/5 dark:bg-primary/30'
                  : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-primary/15'
              "
              @click="goToEntry(entry)"
            >
              <td class="py-1.5 pr-3 pl-1 align-baseline dark:text-nalika-text">
                <div v-if="isPhone" class="min-w-0 leading-tight">
                  <div class="truncate font-medium">{{ entry.labelMain }}</div>
                  <div v-if="entry.labelSub" class="truncate text-xxs text-gray-400">
                    {{ entry.labelSub }}
                  </div>
                </div>
                <div v-else class="flex items-center gap-2">
                  <span class="truncate font-medium">{{ entry.label }}</span>
                  <span
                    v-if="entry.isCurrent"
                    class="shrink-0 rounded bg-sora/10 px-1.5 text-xxs font-medium text-sora dark:bg-sora/15"
                  >
                    Viewing
                  </span>
                </div>
              </td>
              <td class="py-1.5 align-baseline">
                <span
                  class="inline-block w-7 rounded px-1.5 py-0.5 text-center text-xxs font-bold sm:w-10"
                  :class="tierPillClass(entry.tier)"
                >
                  {{ entry.tier }}
                </span>
              </td>
              <td
                v-for="cell in entry.cells"
                :key="cell.key"
                class="py-1.5 pl-2 text-right align-baseline sm:pl-3"
              >
                <div
                  class="font-mono leading-tight text-gray-700 tabular-nums dark:text-nalika-text"
                >
                  <span v-text="cell.value" />
                  <span
                    v-if="cell.suffix"
                    class="text-gray-400 dark:text-gray-500"
                    v-text="cell.suffix"
                  />
                </div>
                <div
                  v-if="cell.diffText"
                  class="font-mono text-xxs leading-tight tabular-nums"
                  :class="cell.toneClass"
                >
                  {{ cell.diffText }}
                </div>
              </td>
              <td
                v-if="!isPhone"
                class="py-1.5 text-center align-baseline text-xxs text-gray-300 group-hover:text-sora dark:text-gray-600"
              >
                <span v-if="!entry.isCurrent">▶</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <p v-else class="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
      This archetype only appeared in the current series
    </p>
  </div>
</template>

<script setup>
import { useMediaQuery } from '@vueuse/core'
import manifest from '$data/archetypes/index.json'

const props = defineProps({
  combo: { type: String, required: true },
  currentSeriesKey: { type: String, required: true },
})

const emit = defineEmits(['navigate'])

// `scored` metrics are comparable across series (shares, rank) and get a green/red
// change; raw counts move with event size, so their change stays grey.
// `invert`: a lower value is better (rank).
const METRICS = [
  {
    key: 'rank',
    label: 'Rank',
    help: 'Position in the tier list that series',
    scored: true,
    invert: true,
  },
  {
    key: 'percent',
    label: 'Use %',
    help: 'Share of all decks that series',
    scored: true,
    pct: true,
  },
  {
    key: 'winRate',
    label: 'Win %',
    help: 'Share of all winning decks that series',
    scored: true,
    pct: true,
  },
  { key: 'deckCount', label: 'Decks', help: 'Decks registered', wide: true },
  { key: 'winnerDeckCount', label: 'Wins', help: 'Winning decks' },
  {
    key: 'cardCount',
    label: 'Cards',
    help: 'Distinct cards played across its decks',
    wide: true,
  },
]

// Phones get the shares, rank and wins only, so a series fits on one short row
const isPhone = useMediaQuery('(max-width: 639px)')
const metrics = computed(() => (isPhone.value ? METRICS.filter(m => !m.wide) : METRICS))

const timeline = computed(() => {
  const entries = manifest
    .map(series => {
      const archIndex = series.archetypes.findIndex(a => a.combo === props.combo)
      if (archIndex < 0) {
        return null
      }
      const arch = series.archetypes[archIndex]
      return {
        seriesKey: series.value,
        archIndex,
        label: series.label,
        // "2026-11 (NTC M5)" → "2026-11" over "NTC M5"
        labelMain: series.label.replace(/\s*\(.*\)$/, ''),
        labelSub: series.label.match(/\((.*)\)$/)?.[1] ?? '',
        eventMaxDate: series.eventMaxDate,
        rank: arch.rank ?? archIndex + 1,
        rankTotal: series.archetypes.length,
        deckCount: arch.deckCount,
        winnerDeckCount: arch.winnerDeckCount,
        percent: arch.percent,
        cardCount: arch.cardCount,
        winRate:
          series.winDecks > 0 ? +((arch.winnerDeckCount / series.winDecks) * 100).toFixed(1) : 0,
        tier: arch.tier,
        isCurrent: series.value === props.currentSeriesKey,
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b.eventMaxDate || '').localeCompare(a.eventMaxDate || ''))

  return entries.map((entry, i) => {
    const prev = entries[i + 1] || null
    return { ...entry, cells: metrics.value.map(m => buildCell(m, entry, prev)) }
  })
})

function buildCell(m, entry, prev) {
  const value = entry[m.key]
  const cell = {
    key: m.key,
    label: m.label,
    value: m.key === 'rank' ? `#${value}` : m.pct ? value.toFixed(1) : value,
    suffix: m.key === 'rank' ? `/${entry.rankTotal}` : m.pct ? '%' : '',
    diffText: '',
    toneClass: '',
  }
  if (!prev) {
    return cell
  }
  const raw = value - prev[m.key]
  const diff = m.pct ? +raw.toFixed(1) : raw
  if (diff === 0) {
    return { ...cell, diffText: '–', toneClass: tw`text-gray-300 dark:text-gray-600` }
  }
  const better = m.invert ? diff < 0 : diff > 0
  const magnitude = m.pct ? Math.abs(diff).toFixed(1) : Math.abs(diff)
  if (!m.scored) {
    return {
      ...cell,
      diffText: `${diff > 0 ? '+' : '−'}${magnitude}`,
      toneClass: tw`text-gray-400 dark:text-gray-500`,
    }
  }
  return {
    ...cell,
    diffText: `${better ? '▲' : '▼'}${magnitude}`,
    toneClass: better
      ? tw`text-green-600 dark:text-green-500`
      : tw`text-red-600 dark:text-red-500/90`,
  }
}

function goToEntry(entry) {
  if (entry.isCurrent) {
    return
  }
  emit('navigate', { seriesKey: entry.seriesKey, archIndex: String(entry.archIndex) })
}
</script>
