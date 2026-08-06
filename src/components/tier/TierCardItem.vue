<template>
  <div
    class="overflow-hidden rounded-r-lg border-l-5 bg-shironezumi/7 not-dark:shadow-md not-dark:shadow-gray-400/10 dark:bg-nalika-surface"
    :class="tierBorderClass(row.tier)"
  >
    <div class="flex items-center justify-between gap-2 px-3 pt-3">
      <div class="flex items-center gap-2">
        <span
          class="w-11 rounded px-1.5 py-0.5 text-center text-xs font-bold"
          :class="tierPillClass(row.tier)"
        >
          {{ row.tier }}
        </span>
        <span
          class="font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
        >
          {{ row.score }}
        </span>
      </div>
      <button
        class="shrink-0 rounded px-2 py-1 text-xs font-medium text-sora hover:bg-sora/10 focus:outline-none dark:hover:bg-sora/20"
        @click="$emit('detail', row)"
      >
        Detail ▶
      </button>
    </div>

    <div class="px-3 py-2.5">
      <div class="flex items-baseline gap-1.5">
        <div v-if="!hideColorDots" class="flex shrink-0 items-center gap-1">
          <div
            v-for="dot in row.colorDots"
            :key="dot.name"
            class="inline-block h-2 w-2 rounded-full"
            :style="{ background: dot.hex }"
          />
        </div>
        <div class="flex items-center gap-1">
          <div class="text-sm text-gray-800 dark:text-nalika-text">
            <template
              v-for="(seg, si) in buildLabelSegments(row.archetype, row.sigCards ?? [], { skipBaseCombo: hideColorName })"
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
      </div>
    </div>

    <div class="grid grid-cols-4 gap-2 px-3 pb-2">
      <div class="flex flex-col">
        <div class="text-xxs font-semibold tracking-widest text-gray-400 uppercase">Decks</div>
        <div
          class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
        >
          {{ row.decks }}
        </div>
      </div>
      <div class="flex flex-col">
        <div class="text-xxs font-semibold tracking-widest text-gray-400 uppercase">Wins</div>
        <div
          class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
        >
          {{ row.wins }}
        </div>
      </div>
      <div class="col-start-4 flex flex-col">
        <div class="text-xxs font-semibold tracking-widest text-gray-400 uppercase">Top4</div>
        <div
          class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
        >
          {{ row.top4 }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-2 px-3 pb-4">
      <div class="flex flex-col">
        <span class="block text-xxs font-semibold tracking-widest text-gray-400 uppercase">
          Use%
        </span>
        <span
          class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
        >
          {{ row.usePct }}
        </span>
      </div>
      <div class="flex flex-col">
        <span class="block text-xxs font-semibold tracking-widest text-gray-400 uppercase">
          Win/Ev
        </span>
        <span
          class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
        >
          {{ row.winPerEv }}
        </span>
      </div>
      <div class="flex flex-col">
        <div class="text-xxs font-semibold tracking-widest text-gray-400 uppercase">Win/Dk</div>
        <div
          class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
        >
          {{ row.winPerDk }}
        </div>
      </div>
      <div class="flex flex-col">
        <div class="text-xxs font-semibold tracking-widest text-gray-400 uppercase">T4/Dk</div>
        <div
          class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
        >
          {{ row.t4PerDk }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  row: { type: Object, required: true },
  hideColorDots: { type: Boolean, default: false },
  hideColorName: { type: Boolean, default: false },
})
defineEmits(['detail'])
</script>
