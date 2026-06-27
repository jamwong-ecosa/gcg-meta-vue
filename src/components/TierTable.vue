<template>
  <div
    class="hidden rounded-lg bg-white not-dark:shadow-xs not-dark:shadow-gray-400/15 md:block dark:bg-nalika-surface"
  >
    <table class="w-full text-left text-sm">
      <thead class="sticky top-[60px] z-1">
        <tr class="bg-ruri text-stone-100 dark:bg-nalika-header dark:text-nalika-text">
          <th class="rounded-tl-lg px-4 py-2 font-semibold">Archetype</th>
          <th class="w-18 px-4 py-2 text-right font-semibold">Decks</th>
          <th class="px-4 py-2 text-right font-semibold">Wins</th>
          <th class="px-4 py-2 text-right font-semibold">Top4</th>
          <th class="px-4 py-2 text-right font-semibold">Use%</th>
          <th class="px-4 py-2 text-right font-semibold">Win/Ev</th>
          <th class="px-4 py-2 text-right font-semibold">Win/Dk</th>
          <th class="px-4 py-2 text-right font-semibold">T4/Dk</th>
          <th class="px-4 py-2 text-right font-semibold">Score</th>
          <th class="rounded-tr-lg px-4 py-2 text-right font-semibold">Tier</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.archetype"
          class="text-aisumicha odd:bg-gray-100/5 even:bg-gray-100/45 hover:bg-gray-200/50 dark:text-nalika-text-muted dark:even:bg-white/3 dark:hover:bg-white/10"
        >
          <td class="flex items-center px-4 py-2">
            <div class="flex items-center gap-0.5">
              <div
                v-for="dot in row.colorDots"
                :key="dot.name"
                class="mr-px inline-block h-2 w-2 rounded-full"
                :style="{ background: dot.hex }"
              />
              <div class="ml-1 text-gray-900 dark:text-nalika-text">{{ row.colors }}</div>
            </div>
            <div class="text-xs">（{{ row.archetype }}）</div>
          </td>
          <td class="w-18 px-4 py-2 text-right">
            <div class="font-mono tabular-nums">{{ row.decks }}</div>
          </td>
          <td class="w-18 px-4 py-2 text-right">
            <div class="font-mono tabular-nums">{{ row.wins }}</div>
          </td>
          <td class="w-18 px-4 py-2 text-right">
            <div class="font-mono tabular-nums">{{ row.top4 }}</div>
          </td>
          <td class="w-18 px-4 py-2 text-right">
            <div class="font-mono tabular-nums">{{ row.usePct }}</div>
          </td>
          <td class="w-18 px-4 py-2 text-right">
            <div class="font-mono tabular-nums">{{ row.winPerEv }}</div>
          </td>
          <td class="w-18 px-4 py-2 text-right">
            <div class="font-mono tabular-nums">{{ row.winPerDk }}</div>
          </td>
          <td class="w-18 px-4 py-2 text-right">
            <div class="font-mono tabular-nums">{{ row.t4PerDk }}</div>
          </td>
          <td class="w-18 px-4 py-2 text-right">
            <div class="font-mono tabular-nums">{{ row.score }}</div>
          </td>
          <td class="w-18 px-4 py-2 text-right">
            <div
              class="w-12 rounded px-1.5 py-0.5 text-center text-xs font-bold"
              :class="tierPillClass(row.tier)"
            >
              {{ row.tier }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  rows: { type: Array, required: true },
})
</script>
