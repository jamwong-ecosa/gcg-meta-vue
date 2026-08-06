<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      @click.self="$emit('close')"
    >
      <div
        class="relative mx-2 max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 font-display shadow-2xl dark:bg-nalika-surface"
      >
        <button
          class="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          @click="$emit('close')"
        >
          ×
        </button>
        <h3
          class="mb-4 text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted"
        >
          {{ title }}
        </h3>
        <div class="space-y-2">
          <div v-for="item in items" :key="item.colors" class="flex items-center gap-2">
            <div class="flex shrink-0 items-center gap-0.5">
              <div
                v-for="dot in item.colorDots"
                :key="dot.name"
                class="inline-block h-2.5 w-2.5 rounded-full"
                :style="{ background: dot.hex }"
              />
            </div>
            <span
              class="w-7 shrink-0 text-center text-xs font-medium text-aisumicha dark:text-nalika-text"
            >
              {{ item.isOther ? item.abbr : item.colorDots.map(d => d.name[0]).join('') }}
            </span>
            <div class="h-5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/70">
              <div
                class="h-full rounded-full"
                :style="{
                  width: `${mode === 'colors' ? item.percent : item.barPercent}%`,
                  background: item.barGradient,
                }"
              />
            </div>
            <span
              class="w-14 text-right font-mono text-xs font-bold text-gray-600 dark:text-nalika-text-muted"
            >
              {{ mode === 'colors' ? `${item.rate.toFixed(1)}%` : `${item.winRate.toFixed(1)}%` }}
            </span>
            <span
              v-if="mode === 'colors' && item.rateDiff !== undefined"
              class="w-3 shrink-0 text-center text-xs font-bold"
              :class="
                item.rateDiff === 0
                  ? 'invisible'
                  : item.rateDiff > 0
                    ? 'text-green-600 dark:text-green-500'
                    : 'text-red-600 dark:text-red-500/90'
              "
            >
              {{ item.rateDiff === 0 ? '–' : item.rateDiff > 0 ? '▲' : '▼' }}
            </span>
            <span
              v-if="mode === 'winrate' && item.winRateDiff !== undefined"
              class="w-3 shrink-0 text-center text-xs font-bold"
              :class="
                item.winRateDiff === 0
                  ? 'invisible'
                  : item.winRateDiff > 0
                    ? 'text-green-600 dark:text-green-500'
                    : 'text-red-600 dark:text-red-500/90'
              "
            >
              {{ item.winRateDiff === 0 ? '–' : item.winRateDiff > 0 ? '▲' : '▼' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  mode: {
    type: String,
    required: true,
    validator: v => ['colors', 'winrate'].includes(v),
  },
  title: { type: String, default: '' },
})

defineEmits(['close'])
</script>
