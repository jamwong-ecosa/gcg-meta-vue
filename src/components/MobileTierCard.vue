<template>
  <div
    class="overflow-hidden rounded-lg bg-white not-dark:shadow not-dark:shadow-gray-400/10 dark:bg-nalika-surface"
  >
    <div :class="['flex h-8 items-center justify-between px-4', tierBarClass(row.tier)]">
      <div class="text-sm font-bold text-aisumicha uppercase dark:text-gray-200">
        {{ row.tier }}
      </div>
      <div class="text-sm font-bold text-aisumicha dark:text-gray-200">
        {{ row.score }}
      </div>
    </div>

    <div class="px-3 py-2.5">
      <div class="flex items-baseline gap-1.5">
        <div class="flex shrink-0 items-center gap-1">
          <div
            v-for="dot in row.colorDots"
            :key="dot.name"
            class="inline-block h-2 w-2 rounded-full"
            :style="{ background: dot.hex }"
          />
        </div>
        <div class="text-sm text-gray-800 dark:text-nalika-text">
          <template
            v-for="(seg, si) in buildLabelSegments(row.archetype, row.sigCards ?? [])"
            :key="si"
          >
            <span v-if="seg.color" :style="{ color: seg.color }">{{ seg.text }}</span>
            <span v-else>{{ seg.text }}</span>
          </template>
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
    <div class="flex justify-end px-3 pb-3">
      <button
        class="rounded px-2 py-1 text-xs font-medium text-ruri hover:bg-primary/10 focus:outline-none dark:text-shinbashi dark:hover:bg-primary/20"
        @click="$emit('detail', row)"
      >
        Detail ▶
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  row: { type: Object, required: true },
})
defineEmits(['detail'])
</script>
