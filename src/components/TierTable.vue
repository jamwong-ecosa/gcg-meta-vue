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
      <thead class="sticky top-[60px] z-1">
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
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.archetype"
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
              ▶
            </button>
          </td>
        </tr>

        <tr
          v-if="zeroWinRows.length"
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
                ▶
              </button>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  rows: { type: Array, required: true },
  zeroWinRows: { type: Array, default: () => [] },
  showZeroWins: { type: Boolean, default: false },
})
defineEmits(['detail', 'toggleZeroWins'])
</script>
