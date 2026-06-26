<template>
  <div
    class="hidden overflow-hidden rounded-lg bg-white not-dark:shadow-xs not-dark:shadow-gray-400/15 md:block dark:bg-nalika-surface"
  >
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="bg-blue-800 text-stone-100 dark:bg-nalika-header dark:text-nalika-text">
          <th class="px-4 py-3 font-semibold">Archetype</th>
          <th class="w-18 px-4 py-3 text-right font-semibold">Decks</th>
          <th class="px-4 py-3 text-right font-semibold">Wins</th>
          <th class="px-4 py-3 text-right font-semibold">Top4</th>
          <th class="px-4 py-3 text-right font-semibold">Use%</th>
          <th class="px-4 py-3 text-right font-semibold">Win/Ev</th>
          <th class="px-4 py-3 text-right font-semibold">Win/Dk</th>
          <th class="px-4 py-3 text-right font-semibold">T4/Dk</th>
          <th class="px-4 py-3 text-right font-semibold">Score</th>
          <th class="px-4 py-3 text-right font-semibold">Tier</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.archetype"
          class="text-gray-500 odd:bg-gray-100/5 even:bg-gray-100/45 hover:bg-gray-200/50 dark:text-nalika-text-muted dark:even:bg-white/3 dark:hover:bg-white/10"
        >
          <td class="px-4 py-3">
            <span class="inline-flex items-center gap-0.5">
              <span
                v-for="dot in row.colorDots"
                :key="dot.name"
                class="mr-px inline-block h-2 w-2 rounded-full"
                :style="{ background: dot.hex }"
              />
              <span class="ml-1 text-gray-900 dark:text-nalika-text">{{ row.colors }}</span>
            </span>
            <span class="text-xs">（{{ row.archetype }}）</span>
          </td>
          <td class="w-18 px-4 py-3 text-right">
            <span class="font-mono tabular-nums">{{ row.decks }}</span>
          </td>
          <td class="w-18 px-4 py-3 text-right">
            <span class="font-mono tabular-nums">{{ row.wins }}</span>
          </td>
          <td class="w-18 px-4 py-3 text-right">
            <span class="font-mono tabular-nums">{{ row.top4 }}</span>
          </td>
          <td class="w-18 px-4 py-3 text-right">
            <span class="font-mono tabular-nums">{{ row.usePct }}</span>
          </td>
          <td class="w-18 px-4 py-3 text-right">
            <span class="font-mono tabular-nums">{{ row.winPerEv }}</span>
          </td>
          <td class="w-18 px-4 py-3 text-right">
            <span class="font-mono tabular-nums">{{ row.winPerDk }}</span>
          </td>
          <td class="w-18 px-4 py-3 text-right">
            <span class="font-mono tabular-nums">{{ row.t4PerDk }}</span>
          </td>
          <td class="w-18 px-4 py-3 text-right">
            <span class="font-mono tabular-nums">{{ row.score }}</span>
          </td>
          <td class="w-18 px-4 py-3 text-right">
            <span class="rounded px-1.5 py-0.5 text-xs font-bold" :class="tierPillClass(row.tier)">
              {{ row.tier }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { tierPillClass } from '@/utils/tier'

defineProps({
  rows: { type: Array, required: true },
})
</script>
