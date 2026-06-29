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

    <div class="px-4 py-2.5">
      <div class="flex items-center gap-0.5">
        <div
          v-for="dot in row.colorDots"
          :key="dot.name"
          class="inline-block h-2 w-2 rounded-full"
          :style="{ background: dot.hex }"
        />
        <div class="ml-1 text-gray-800 dark:text-nalika-text">{{ row.colors }}</div>
      </div>
      <div class="mt-0.5 block text-xs text-gray-500 dark:text-nalika-text-muted">
        （{{ row.archetype }}）
      </div>
    </div>

    <div class="grid grid-cols-4 gap-2 px-4 pb-2">
      <div class="flex flex-col">
        <div class="text-[0.55rem] font-semibold tracking-widest text-gray-400 uppercase">
          Decks
        </div>
        <div
          class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
        >
          {{ row.decks }}
        </div>
      </div>
      <div class="flex flex-col">
        <div class="text-[0.55rem] font-semibold tracking-widest text-gray-400 uppercase">Wins</div>
        <div
          class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
        >
          {{ row.wins }}
        </div>
      </div>
      <div class="col-start-4 flex flex-col">
        <div class="text-[0.55rem] font-semibold tracking-widest text-gray-400 uppercase">Top4</div>
        <div
          class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
        >
          {{ row.top4 }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-2 px-4 pb-4">
      <div class="flex flex-col">
        <span class="block text-[0.55rem] font-semibold tracking-widest text-gray-400 uppercase">
          Use%
        </span>
        <span
          class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
        >
          {{ row.usePct }}
        </span>
      </div>
      <div class="flex flex-col">
        <span class="block text-[0.55rem] font-semibold tracking-widest text-gray-400 uppercase">
          Win/Ev
        </span>
        <span
          class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
        >
          {{ row.winPerEv }}
        </span>
      </div>
      <div class="flex flex-col">
        <div class="text-[0.55rem] font-semibold tracking-widest text-gray-400 uppercase">
          Win/Dk
        </div>
        <div
          class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
        >
          {{ row.winPerDk }}
        </div>
      </div>
      <div class="flex flex-col">
        <div class="text-[0.55rem] font-semibold tracking-widest text-gray-400 uppercase">
          T4/Dk
        </div>
        <div
          class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
        >
          {{ row.t4PerDk }}
        </div>
      </div>
    </div>
    <div class="flex justify-end px-4 pb-3">
      <button
        class="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 focus:outline-none dark:hover:bg-primary/20"
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
