<template>
  <Teleport to="body">
    <div
      v-if="archetype"
      class="fixed inset-0 z-[1000] flex flex-col bg-white font-display dark:bg-nalika-bg"
    >
      <div
        class="relative flex items-center justify-end border-b border-gray-500/10 px-4 py-2 md:px-8 dark:bg-nalika-surface"
      >
        <button
          class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 hover:bg-black/5 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
          @click="$emit('close')"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
            />
          </svg>
        </button>
      </div>
      <div ref="modalRef" class="flex-1 overflow-y-auto p-4 max-sm:pb-8 md:p-6">
        <div class="mx-auto mb-4 max-w-340">
          <div class="flex items-baseline gap-1">
            <div
              v-for="dot in colorDots"
              :key="dot"
              class="h-2.5 w-2.5 shrink-0 rounded-full"
              :style="{ background: COLOR_HEX[dot] }"
            />
            <h2 class="ml-1 font-semibold text-sumi dark:text-nalika-text">
              {{ archetype.combo }}
            </h2>
          </div>

          <div class="mt-0.5 text-xs text-gray-500 dark:text-nalika-text-muted">
            <span
              v-if="tier"
              class="mr-1.5 inline-block w-10 rounded px-1 py-0.5 text-center text-xxs font-bold"
              :class="tierPillClass(tier)"
            >
              {{ tier }}
            </span>
            {{ archetype.cards.length }} cards · {{ archetype.winnerDeckCount }} wins ·
            {{ archetype.deckCount }} decks ({{ archetype.percent }}%)
          </div>
        </div>
        <ArchetypeDetail :archetype="archetype" class="mx-auto max-w-340" />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onKeyStroke, useScrollLock } from '@vueuse/core'

const props = defineProps({
  archetype: { type: Object, required: true },
  tier: { type: String, default: null },
})

const colorDots = computed(() => {
  const combo = props.archetype.combo ?? ''
  const baseCombo = combo.split(' (')[0]
  return baseCombo
    .split('+')
    .map(c => c.trim())
    .filter(Boolean)
})

const emit = defineEmits(['close'])

const isLocked = useScrollLock(document.documentElement)

watchEffect(() => {
  isLocked.value = !!props.archetype
})

onKeyStroke('Escape', () => emit('close'))
</script>
