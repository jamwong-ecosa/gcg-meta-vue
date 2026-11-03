<template>
  <div
    class="overflow-hidden rounded-r-lg border-l-4 bg-shironezumi/7 not-dark:shadow-xs not-dark:shadow-gray-400/10 dark:bg-nalika-surface"
    :class="tierBorderClass(row.tier)"
  >
    <!-- One line with the essentials: tap opens the analysis, the chevron shows
         the rest of the stats -->
    <div class="flex items-stretch">
      <button
        class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 pl-2.5 text-left"
        @click="$emit('detail', row)"
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
        <!-- Score on top, usage and rank change underneath -->
        <div class="shrink-0 text-right leading-tight">
          <div
            class="font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text"
          >
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
      <button
        class="my-1.5 ml-2 flex w-10 shrink-0 cursor-pointer items-center justify-center border-l border-gray-500/15 text-gray-400 hover:text-gray-600 dark:border-white/10 dark:text-gray-500 dark:hover:text-gray-300"
        :aria-expanded="open"
        :aria-label="open ? 'Hide stats' : 'Show stats'"
        @click="open = !open"
      >
        <svg
          class="h-5 w-5 transition-transform"
          :class="open ? 'rotate-180' : ''"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>

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
