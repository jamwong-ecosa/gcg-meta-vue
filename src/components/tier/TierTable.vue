<template>
  <div
    class="hidden rounded-lg bg-white not-dark:shadow-xs not-dark:shadow-gray-400/15 md:block dark:bg-nalika-surface"
  >
    <table class="w-full text-left text-sm">
      <colgroup>
        <col class="w-auto" />
        <col class="w-16" />
        <col class="w-16" />
        <col class="w-16" />
        <col class="w-16" />
        <col class="w-16" />
        <col class="w-16" />
        <col class="w-16" />
        <col class="w-16" />
        <col class="w-16" />
        <col class="w-8" />
      </colgroup>
      <thead class="sticky top-[53px] z-1">
        <tr class="bg-ruri text-stone-100 dark:bg-nalika-header dark:text-nalika-text">
          <th class="rounded-tl-lg px-4 py-2 font-semibold">Archetype</th>
          <th class="px-4 py-2 text-right font-semibold">Decks</th>
          <th class="px-4 py-2 text-right font-semibold">Wins</th>
          <th class="px-4 py-2 text-right font-semibold">Top4</th>
          <th class="px-4 py-2 text-right font-semibold">Use%</th>
          <th class="px-4 py-2 text-right font-semibold">Win/Ev</th>
          <th class="px-4 py-2 text-right font-semibold">Win/Dk</th>
          <th class="px-4 py-2 text-right font-semibold">T4/Dk</th>
          <th class="px-4 py-2 text-right font-semibold">Score</th>
          <th class="px-4 py-2 text-right font-semibold">Tier</th>
          <th class="rounded-tr-lg px-1 py-2" />
        </tr>
      </thead>
      <template v-if="groupByColor">
        <tbody v-for="group in groups" :key="group.colors">
          <tr
            class="bg-gray-300/40 text-xs font-semibold text-gray-500 dark:bg-white/15 dark:text-gray-400"
          >
            <td colspan="11" class="px-4 py-1.5">
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-0.5">
                  <div
                    v-for="dot in group.colorDots"
                    :key="dot.name"
                    class="inline-block h-2.5 w-2.5 rounded-full"
                    :style="{ background: dot.hex }"
                  />
                </div>
                <span>{{ group.colors }}</span>
                <span class="text-gray-400">({{ group.rows.length }})</span>
                <span class="ml-auto font-mono tabular-nums">
                  {{ group.totalDecks }} decks / {{ group.totalWins }} wins
                </span>
              </div>
            </td>
          </tr>
          <tr
            v-for="row in group.rows"
            :key="row.archetype"
            class="group cursor-pointer text-aisumicha odd:bg-gray-100/15 even:bg-gray-100/45 hover:bg-gray-200/50 dark:text-nalika-text-muted dark:odd:bg-gray-100/10 dark:even:bg-white/3 dark:hover:bg-white/15"
            @click="$emit('detail', row)"
          >
            <td class="flex items-baseline gap-1 py-2 pr-4 pl-6">
              <div class="flex items-center gap-1">
                <div class="text-sumi dark:text-nalika-text">
                  <template
                    v-for="(seg, si) in buildLabelSegments(row.archetype, row.sigCards ?? [], {
                      skipBaseCombo: true,
                    })"
                    :key="si"
                  >
                    <span v-if="seg.color" :style="{ color: seg.color }">{{ seg.text }}</span>
                    <span v-else>{{ seg.text }}</span>
                  </template>
                </div>
                <span
                  v-if="row.darkHorse"
                  class="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                >
                  🐴
                </span>
              </div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.decks }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.wins }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.top4 }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.usePct }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.winPerEv }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.winPerDk }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.t4PerDk }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.score }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div
                class="w-12 rounded px-1.5 py-0.5 text-center text-xs font-bold"
                :class="tierPillClass(row.tier)"
              >
                {{ row.tier }}
              </div>
            </td>
            <td class="px-1 py-2 text-center">
              <button
                class="rounded text-xxs font-medium text-gray-400 group-hover:text-sora focus:outline-none dark:text-gray-500"
                @click.stop="$emit('detail', row)"
              >
                <span>▶</span>
              </button>
            </td>
          </tr>
        </tbody>
      </template>
      <template v-else>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.archetype"
            v-memo="[row]"
            class="group cursor-pointer text-aisumicha odd:bg-gray-100/15 even:bg-gray-100/45 hover:bg-gray-200/50 dark:text-nalika-text-muted dark:odd:bg-gray-100/10 dark:even:bg-white/3 dark:hover:bg-white/15"
            @click="$emit('detail', row)"
          >
            <td class="flex items-baseline gap-1.5 px-4 py-2">
              <div class="flex shrink-0 items-center gap-0.5">
                <div
                  v-for="dot in row.colorDots"
                  :key="dot.name"
                  class="mr-px inline-block h-2 w-2 rounded-full"
                  :style="{ background: dot.hex }"
                />
              </div>
              <div class="flex items-center gap-1">
                <div class="text-sumi dark:text-nalika-text">
                  <template
                    v-for="(seg, si) in buildLabelSegments(row.archetype, row.sigCards ?? [])"
                    :key="si"
                  >
                    <span v-if="seg.color" :style="{ color: seg.color }">{{ seg.text }}</span>
                    <span v-else>{{ seg.text }}</span>
                  </template>
                </div>
                <span
                  v-if="row.darkHorse"
                  class="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                >
                  🐴
                </span>
              </div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.decks }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.wins }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.top4 }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.usePct }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.winPerEv }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.winPerDk }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.t4PerDk }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.score }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div
                class="w-12 rounded px-1.5 py-0.5 text-center text-xs font-bold"
                :class="tierPillClass(row.tier)"
              >
                {{ row.tier }}
              </div>
            </td>
            <td class="px-1 py-2 text-center">
              <button
                class="rounded text-xxs font-medium text-gray-400 group-hover:text-sora focus:outline-none dark:text-gray-500"
                @click.stop="$emit('detail', row)"
              >
                <span>▶</span>
              </button>
            </td>
          </tr>
        </tbody>
      </template>

      <tbody v-if="zeroWinRows.length">
        <tr
          class="cursor-pointer text-center text-xs font-medium text-ruri hover:bg-gray-100/50 dark:hover:bg-white/10"
          @click="$emit('toggleZeroWins')"
        >
          <td :colspan="11" class="px-4 py-3">
            0 Wins（{{ zeroWinRows.length }}）{{ showZeroWins ? '−' : '+' }}
          </td>
        </tr>
        <template v-if="showZeroWins">
          <tr
            v-for="row in zeroWinRows"
            :key="row.archetype"
            v-memo="[row]"
            class="group cursor-pointer text-aisumicha odd:bg-gray-100/15 even:bg-gray-100/45 hover:bg-gray-200/50 dark:text-nalika-text-muted dark:odd:bg-gray-100/10 dark:even:bg-white/3 dark:hover:bg-white/15"
            @click="$emit('detail', row)"
          >
            <td class="flex items-baseline gap-1.5 px-4 py-2">
              <div class="flex shrink-0 items-center gap-0.5">
                <div
                  v-for="dot in row.colorDots"
                  :key="dot.name"
                  class="mr-px inline-block h-2 w-2 rounded-full"
                  :style="{ background: dot.hex }"
                />
              </div>
              <div class="text-sumi dark:text-nalika-text">
                <template
                  v-for="(seg, si) in buildLabelSegments(row.archetype, row.sigCards ?? [])"
                  :key="si"
                >
                  <span v-if="seg.color" :style="{ color: seg.color }">{{ seg.text }}</span>
                  <span v-else>{{ seg.text }}</span>
                </template>
              </div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.decks }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.wins }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.top4 }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.usePct }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.winPerEv }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.winPerDk }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.t4PerDk }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div class="font-mono tabular-nums">{{ row.score }}</div>
            </td>
            <td class="px-4 py-2 text-right">
              <div
                class="w-12 rounded px-1.5 py-0.5 text-center text-xs font-bold"
                :class="tierPillClass(row.tier)"
              >
                {{ row.tier }}
              </div>
            </td>
            <td class="px-1 py-2 text-center">
              <button
                class="rounded text-xxs font-medium text-gray-400 group-hover:text-sora focus:outline-none dark:text-gray-500"
                @click.stop="$emit('detail', row)"
              >
                <span>▶</span>
              </button>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  rows: { type: Array, required: true },
  zeroWinRows: { type: Array, default: () => [] },
  showZeroWins: { type: Boolean, default: false },
  groupByColor: { type: Boolean, default: false },
})
defineEmits(['detail', 'toggleZeroWins'])

const groups = computed(() => {
  if (!props.groupByColor) {
    return []
  }
  const map = {}
  for (const row of props.rows) {
    if (!map[row.colors]) {
      map[row.colors] = {
        colors: row.colors,
        colorDots: row.colorDots,
        rows: [],
        totalDecks: 0,
        totalWins: 0,
      }
    }
    map[row.colors].rows.push(row)
    map[row.colors].totalDecks += row.decks
    map[row.colors].totalWins += row.wins
  }
  return Object.values(map).sort((a, b) => b.totalDecks - a.totalDecks)
})
</script>
