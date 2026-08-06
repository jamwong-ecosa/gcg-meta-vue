<template>
  <div class="space-y-3 md:hidden">
    <template v-if="!groupByColor">
      <TierCardItem
        v-for="row in rows"
        :key="row.archetype"
        :row="row"
        @detail="$emit('detail', $event)"
      />
    </template>
    <template v-else>
      <div v-for="group in groups" :key="group.colors" class="space-y-3">
        <div
          :ref="el => registerStuck(el, group.colors)"
          :class="['mobile-group-header sticky z-30 flex items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400', stuckIds.has(group.colors) ? 'bg-gray-300 dark:bg-nalika-surface' : 'bg-gray-300/40 dark:bg-white/15']"
          :style="{ top: groupTop }"
        >
          <div class="flex items-center gap-0.5">
            <div
              v-for="dot in group.colorDots"
              :key="dot.name"
              class="inline-block h-2 w-2 rounded-full"
              :style="{ background: dot.hex }"
            />
          </div>
          <span>{{ group.colors }}</span>
          <span class="text-gray-400">({{ group.rows.length }})</span>
          <span class="ml-auto font-mono tabular-nums">{{ group.totalDecks }} decks / {{ group.totalWins }} wins</span>
        </div>
        <TierCardItem
          v-for="row in group.rows"
          :key="row.archetype"
          :row="row"
          hide-color-dots
          hide-color-name
          @detail="$emit('detail', $event)"
        />
      </div>
    </template>
    <button
      v-if="zeroWinRows.length"
      class="w-full cursor-pointer py-2 text-center text-xs font-medium text-ruri"
      @click="$emit('toggleZeroWins')"
    >
      0 Wins（{{ zeroWinRows.length }}）{{ showZeroWins ? '−' : '+' }}
    </button>
    <template v-if="showZeroWins">
      <TierCardItem
        v-for="row in zeroWinRows"
        :key="row.archetype"
        :row="row"
        @detail="$emit('detail', $event)"
      />
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  rows: { type: Array, required: true },
  zeroWinRows: { type: Array, default: () => [] },
  showZeroWins: { type: Boolean, default: false },
  groupByColor: { type: Boolean, default: false },
  groupTop: { type: String, default: '53px' },
})
defineEmits(['detail', 'toggleZeroWins'])

const { stuckIds, register: registerStuck } = useStuck()

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
