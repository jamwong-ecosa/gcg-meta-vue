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
    <div v-if="timeline.length > 1">
      <div class="hidden sm:block">
        <table class="w-full table-fixed text-xs">
          <colgroup>
            <col />
            <col class="w-14" />
            <col v-for="m in METRICS" :key="m.key" class="w-[72px]" />
            <col class="w-6" />
          </colgroup>
          <thead>
            <tr class="border-b border-gray-200 text-left dark:border-gray-700">
              <th class="pr-3 pb-2 font-semibold text-gray-500 dark:text-gray-400">Series</th>
              <th class="pb-2 font-semibold text-gray-500 dark:text-gray-400">Tier</th>
              <th
                v-for="m in METRICS"
                :key="m.key"
                class="pb-2 pl-3 text-right font-semibold text-gray-500 dark:text-gray-400"
                :title="m.help"
              >
                {{ m.label }}
              </th>
              <th class="pb-2" />
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
                <div class="flex items-center gap-2">
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
                  class="inline-block w-10 rounded px-1.5 py-0.5 text-center text-xxs font-bold"
                  :class="tierPillClass(entry.tier)"
                >
                  {{ entry.tier }}
                </span>
              </td>
              <td
                v-for="cell in entry.cells"
                :key="cell.key"
                class="py-1.5 pl-3 text-right align-baseline"
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
                class="py-1.5 text-center align-baseline text-xxs text-gray-300 group-hover:text-sora dark:text-gray-600"
              >
                <span v-if="!entry.isCurrent">▶</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="space-y-2 sm:hidden">
        <div
          v-for="entry in timeline"
          :key="'m' + entry.seriesKey"
          class="rounded border border-gray-500/10 p-2.5 dark:border-nalika-border"
          :class="
            entry.isCurrent
              ? 'bg-primary/5 dark:bg-primary/30'
              : 'cursor-pointer bg-shironezumi/2 hover:bg-gray-100 dark:bg-nalika-surface dark:hover:bg-primary/15'
          "
          @click="goToEntry(entry)"
        >
          <div class="mb-2 flex items-center gap-2">
            <span
              class="inline-block w-8 shrink-0 rounded py-0.5 text-center text-xxs font-bold"
              :class="tierPillClass(entry.tier)"
            >
              {{ entry.tier }}
            </span>
            <span class="min-w-0 truncate text-sm font-medium dark:text-nalika-text">
              {{ entry.label }}
            </span>
            <span
              v-if="entry.isCurrent"
              class="ml-auto shrink-0 rounded bg-sora/10 px-1.5 text-xxs font-medium text-sora dark:bg-sora/15"
            >
              Viewing
            </span>
            <span v-else class="ml-auto shrink-0 text-xxs text-gray-300 dark:text-gray-600">▶</span>
          </div>
          <dl class="grid grid-cols-3 gap-x-2 gap-y-1.5">
            <div v-for="cell in entry.cells" :key="cell.key">
              <dt class="text-xxs font-semibold tracking-widest text-gray-400 uppercase">
                {{ cell.label }}
              </dt>
              <dd class="flex items-baseline gap-1.5">
                <span
                  class="font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
                >
                  <span v-text="cell.value" />
                  <span
                    v-if="cell.suffix"
                    class="text-xxs font-normal text-gray-400"
                    v-text="cell.suffix"
                  />
                </span>
                <span class="font-mono text-xxs tabular-nums" :class="cell.toneClass">
                  {{ cell.diffText }}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
    <p v-else class="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
      This archetype only appeared in the current series
    </p>
  </div>
</template>

<script setup>
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
  { key: 'deckCount', label: 'Decks', help: 'Decks registered' },
  { key: 'winnerDeckCount', label: 'Wins', help: 'Winning decks' },
  { key: 'cardCount', label: 'Cards', help: 'Distinct cards played across its decks' },
]

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
        eventMaxDate: series.eventMaxDate,
        rank: archIndex + 1,
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
    return { ...entry, cells: METRICS.map(m => buildCell(m, entry, prev)) }
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
