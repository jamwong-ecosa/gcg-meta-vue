<template>
  <div
    class="mb-6 rounded border border-gray-500/10 bg-shironezumi/2 p-2 dark:border-nalika-border dark:bg-nalika-surface"
  >
    <h2
      class="mb-3 text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted"
    >
      Archetype Timeline
    </h2>
    <div v-if="timeline.length > 1">
      <div class="hidden sm:block">
        <table class="w-full table-fixed text-xs">
          <colgroup>
            <col />
            <col class="w-[60px]" />
            <col class="w-[50px]" />
            <col class="w-[56px]" />
            <col class="w-[50px]" />
            <col class="w-[56px]" />
            <col class="w-[58px]" />
            <col class="w-[60px]" />
            <col class="w-[50px]" />
            <col class="w-[56px]" />
            <col class="w-[58px]" />
            <col class="w-[56px]" />
          </colgroup>
          <thead>
            <tr class="border-b border-gray-200 text-left dark:border-gray-700">
              <th class="pr-3 pb-2 font-semibold text-gray-500 dark:text-gray-400">Series</th>
              <th class="pr-3 pb-2 font-semibold text-gray-500 dark:text-gray-400">Tier</th>
              <th class="pb-2" />
              <th class="pr-3 pb-2 text-right font-semibold text-gray-500 dark:text-gray-400">
                Cards
              </th>
              <th class="pb-2" />
              <th class="pr-3 pb-2 text-right font-semibold text-gray-500 dark:text-gray-400">
                Wins
              </th>
              <th class="pb-2" />
              <th class="pr-3 pb-2 text-right font-semibold text-gray-500 dark:text-gray-400">
                WR %
              </th>
              <th class="pb-2" />
              <th class="pr-3 pb-2 text-right font-semibold text-gray-500 dark:text-gray-400">
                Decks
              </th>
              <th class="pb-2" />
              <th class="pb-2 text-right font-semibold text-gray-500 dark:text-gray-400">Use %</th>
            </tr>
          </thead>
          <tbody class="table-row-group">
            <tr
              v-for="entry in timeline"
              :key="entry.seriesKey"
              :class="[
                entry.isCurrent
                  ? 'bg-primary/5 dark:bg-primary/30'
                  : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-primary/15',
              ]"
              @click="goToEntry(entry)"
            >
              <td class="py-2 pr-3 dark:text-nalika-text">
                <span class="font-medium">{{ entry.label }}</span>
              </td>
              <td class="py-2 pr-3">
                <span
                  class="inline-block w-10 rounded px-1.5 py-0.5 text-center text-xxs font-bold"
                  :class="tierPillClass(entry.tier)"
                >
                  {{ entry.tier }}
                </span>
              </td>
              <td class="py-2 text-right">
                <span
                  v-if="entry.hasPrevious"
                  class="text-xxs font-medium"
                  :class="diffClass(entry.cardDiff)"
                >
                  {{ diffText(entry.cardDiff) }}
                </span>
              </td>
              <td
                class="py-2 pr-3 text-right font-mono text-gray-700 tabular-nums dark:text-nalika-text"
              >
                {{ entry.cardCount }}
              </td>
              <td class="py-2 text-right">
                <span
                  v-if="entry.hasPrevious"
                  class="text-xxs font-medium"
                  :class="diffClass(entry.winDiff)"
                >
                  {{ diffText(entry.winDiff) }}
                </span>
              </td>
              <td
                class="py-2 pr-3 text-right font-mono text-gray-700 tabular-nums dark:text-nalika-text"
              >
                {{ entry.winnerDeckCount }}
              </td>
              <td class="py-2 text-right">
                <span
                  v-if="entry.hasPrevious"
                  class="text-xxs font-medium"
                  :class="diffClass(entry.winRateDiff)"
                >
                  {{ diffText(entry.winRateDiff, true) }}
                </span>
              </td>
              <td
                class="py-2 pr-3 text-right font-mono text-gray-700 tabular-nums dark:text-nalika-text"
              >
                {{ entry.winRate }}%
              </td>
              <td class="py-2 text-right">
                <span
                  v-if="entry.hasPrevious"
                  class="text-xxs font-medium"
                  :class="diffClass(entry.deckDiff)"
                >
                  {{ diffText(entry.deckDiff) }}
                </span>
              </td>
              <td
                class="py-2 pr-3 text-right font-mono text-gray-700 tabular-nums dark:text-nalika-text"
              >
                {{ entry.deckCount }}
              </td>
              <td class="py-2 text-right">
                <span
                  v-if="entry.hasPrevious"
                  class="text-xxs font-medium"
                  :class="diffClass(entry.percentDiff)"
                >
                  {{ diffText(entry.percentDiff, true) }}
                </span>
              </td>
              <td
                class="py-2 text-right font-mono text-gray-700 tabular-nums dark:text-nalika-text"
              >
                {{ entry.percent }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="space-y-2 sm:hidden">
        <div
          v-for="entry in timeline"
          :key="'m' + entry.seriesKey"
          class="rounded border border-gray-500/10 p-3 dark:border-nalika-border"
          :class="[
            entry.isCurrent
              ? 'bg-primary/5 dark:bg-primary/30'
              : 'cursor-pointer bg-shironezumi/2 hover:bg-gray-100 dark:bg-nalika-surface dark:hover:bg-primary/15',
          ]"
          @click="goToEntry(entry)"
        >
          <div class="mb-2 flex items-start justify-between">
            <span class="text-sm font-medium dark:text-nalika-text">{{ entry.label }}</span>
            <span
              class="inline-block w-10 rounded px-1.5 py-0.5 text-center text-xxs font-bold"
              :class="tierPillClass(entry.tier)"
            >
              {{ entry.tier }}
            </span>
          </div>
          <div class="grid grid-cols-5 gap-2">
            <div class="flex flex-col">
              <div class="text-xxs font-semibold tracking-widest text-gray-400 uppercase">
                Cards
              </div>
              <div
                class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
              >
                {{ entry.cardCount }}
              </div>
              <span
                v-if="entry.hasPrevious"
                class="text-xxs font-medium"
                :class="diffClass(entry.cardDiff)"
              >
                {{ diffText(entry.cardDiff) }}
              </span>
            </div>
            <div class="flex flex-col">
              <div class="text-xxs font-semibold tracking-widest text-gray-400 uppercase">Wins</div>
              <div
                class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
              >
                {{ entry.winnerDeckCount }}
              </div>
              <span
                v-if="entry.hasPrevious"
                class="text-xxs font-medium"
                :class="diffClass(entry.winDiff)"
              >
                {{ diffText(entry.winDiff) }}
              </span>
            </div>
            <div class="flex flex-col">
              <div class="text-xxs font-semibold tracking-widest text-gray-400 uppercase">WR</div>
              <div
                class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
              >
                {{ entry.winRate }}%
              </div>
              <span
                v-if="entry.hasPrevious"
                class="text-xxs font-medium"
                :class="diffClass(entry.winRateDiff)"
              >
                {{ diffText(entry.winRateDiff, true) }}
              </span>
            </div>
            <div class="flex flex-col">
              <div class="text-xxs font-semibold tracking-widest text-gray-400 uppercase">
                Decks
              </div>
              <div
                class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
              >
                {{ entry.deckCount }}
              </div>
              <span
                v-if="entry.hasPrevious"
                class="text-xxs font-medium"
                :class="diffClass(entry.deckDiff)"
              >
                {{ diffText(entry.deckDiff) }}
              </span>
            </div>
            <div class="flex flex-col">
              <div class="text-xxs font-semibold tracking-widest text-gray-400 uppercase">Use</div>
              <div
                class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
              >
                {{ entry.percent }}%
              </div>
              <span
                v-if="entry.hasPrevious"
                class="text-xxs font-medium"
                :class="diffClass(entry.percentDiff)"
              >
                {{ diffText(entry.percentDiff, true) }}
              </span>
            </div>
          </div>
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

const timeline = computed(() => {
  const entries = manifest
    .map(series => {
      const arch = series.archetypes.find(a => a.combo === props.combo)
      if (!arch) {
        return null
      }
      const archIndex = series.archetypes.findIndex(a => a.combo === props.combo)
      return {
        seriesKey: series.value,
        archIndex,
        label: series.label,
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

  return entries.map((entry, i) => {
    const prev = entries[i + 1] || null
    return {
      ...entry,
      hasPrevious: !!prev,
      deckDiff: prev ? entry.deckCount - prev.deckCount : 0,
      winDiff: prev ? entry.winnerDeckCount - prev.winnerDeckCount : 0,
      percentDiff: prev ? entry.percent - prev.percent : 0,
      cardDiff: prev ? entry.cardCount - prev.cardCount : 0,
      winRateDiff: prev ? +(entry.winRate - prev.winRate).toFixed(1) : 0,
    }
  })
})

function goToEntry(entry) {
  if (entry.isCurrent) {
    return
  }
  emit('navigate', { seriesKey: entry.seriesKey, archIndex: String(entry.archIndex) })
}

function diffClass(diff) {
  if (diff === 0) {
    return 'text-gray-400 dark:text-gray-500'
  }
  if (diff > 0) {
    return 'text-green-600 dark:text-green-500'
  }
  return 'text-red-600 dark:text-red-500/90'
}

function diffText(diff, isPercent = false) {
  if (diff === 0) {
    return '-'
  }
  const arrow = diff > 0 ? '▲' : '▼'
  const sign = diff > 0 ? '+' : ''
  const value = isPercent ? diff.toFixed(1) : diff
  return `${arrow} ${sign}${value}`
}
</script>
