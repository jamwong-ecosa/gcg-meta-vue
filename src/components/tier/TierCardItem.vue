<template>
  <div
    class="overflow-hidden rounded-r-lg border-l-4 bg-shironezumi/7 not-dark:shadow-xs not-dark:shadow-gray-400/10 dark:bg-nalika-surface"
    :class="tierBorderClass(row.tier)"
  >
    <!-- Collapsed: one line with the essentials; tap for the rest -->
    <button
      class="flex w-full cursor-pointer items-center gap-2 px-2.5 py-2 text-left"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span
        class="w-6 shrink-0 rounded py-0.5 text-center text-xxs font-bold"
        :class="tierPillClass(row.tier)"
      >
        {{ row.tier }}
      </span>
      <div class="min-w-0 flex-1">
        <div
          class="text-xs leading-snug text-gray-800 dark:text-nalika-text"
          :class="open ? '' : 'line-clamp-2'"
        >
          <span v-if="!hideColor" class="mr-1 inline-flex gap-0.5 align-middle">
            <span
              v-for="dot in row.colorDots"
              :key="dot.name"
              class="inline-block h-2 w-2 rounded-full"
              :style="{ background: dot.hex }"
            />
          </span>
          <template
            v-for="(seg, si) in buildLabelSegments(row.archetype, row.sigCards ?? [], {
              skipBaseCombo: hideColor,
            })"
            :key="si"
          >
            <span v-if="seg.color" :style="{ color: seg.color }">{{ seg.text }}</span>
            <span v-else>{{ seg.text }}</span>
          </template>
          <span v-if="row.darkHorse" class="ml-1" :title="DARK_HORSE_HELP">🐴</span>
        </div>
      </div>
      <!-- Score on top, usage and rank change underneath; the whole row is the tap target -->
      <div class="shrink-0 text-right leading-tight">
        <div class="font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text">
          {{ row.score }}
        </div>
        <div class="flex items-baseline justify-end gap-1.5 font-mono text-xxs tabular-nums">
          <span class="text-gray-400">{{ row.usePct }}</span>
          <TierMovement
            v-if="hasMovement"
            compact
            :move="row.move"
            :rank="row.rank"
            :tier="row.tier"
          />
        </div>
      </div>
    </button>

    <div v-if="open" class="border-t border-gray-500/10 px-3 pt-2 pb-3">
      <dl class="grid grid-cols-3 gap-x-2 gap-y-2">
        <div v-for="s in stats" :key="s.key">
          <dt class="text-xxs font-semibold tracking-widest text-gray-400 uppercase">
            {{ s.label }}
          </dt>
          <dd
            class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
          >
            {{ s.value }}
          </dd>
        </div>
      </dl>
      <p v-if="tierChanged" class="mt-2 text-xxs text-gray-500 dark:text-gray-400">
        Was {{ row.move.prevTier }} tier (rank {{ row.move.prevRank }}) last series
      </p>
      <button
        class="mt-3 w-full cursor-pointer rounded bg-sora/10 py-1.5 text-xs font-medium text-sora hover:bg-sora/20 dark:bg-sora/15"
        @click="$emit('detail', row)"
      >
        Open analysis ▶
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  row: { type: Object, required: true },
  hideColor: { type: Boolean, default: false },
  hasMovement: { type: Boolean, default: false },
})
defineEmits(['detail'])

const open = ref(false)

const stats = computed(() => [
  { key: 'decks', label: 'Decks', value: props.row.decks },
  { key: 'wins', label: 'Wins', value: props.row.wins },
  { key: 'top4', label: 'Top4', value: props.row.top4 },
  { key: 'use', label: 'Use%', value: props.row.usePct },
  { key: 'winEv', label: 'Win/Ev', value: props.row.winPerEv },
  { key: 'winDk', label: 'Win/Dk', value: props.row.winPerDk },
])

const tierChanged = computed(
  () => props.row.move?.prevTier && props.row.move.prevTier !== props.row.tier,
)
</script>
