<template>
  <Teleport to="body">
    <div v-if="archetype" class="fixed inset-0 z-[1000] flex flex-col bg-white dark:bg-nalika-bg">
      <div
        class="relative flex items-center justify-center border-b border-gray-500/10 px-4 py-3 dark:bg-nalika-surface"
      >
        <h2 class="truncate text-sm font-semibold text-gray-900 dark:text-nalika-text">
          {{ archetype.combo }}
        </h2>
        <button
          class="absolute top-1/2 right-4 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-gray-400 hover:bg-black/5 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
          @click="$emit('close')"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
            />
          </svg>
        </button>
      </div>
      <div ref="modalRef" class="flex-1 overflow-y-auto p-4 md:p-6">
        <ArchetypeDetail :archetype="archetype" class="mx-auto max-w-380" />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onKeyStroke } from '@vueuse/core'

defineProps({
  archetype: { type: Object, required: true },
})

const emit = defineEmits(['close'])

onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

onKeyStroke('Escape', () => emit('close'))
</script>
