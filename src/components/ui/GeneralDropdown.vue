<template>
  <div ref="dropdownRef" class="relative">
    <button
      class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-500/10 bg-gray-50 px-3 py-1.5 text-sm text-sumi transition-colors hover:border-gray-300 focus:border-sora focus:ring-2 focus:ring-hai/5 focus:outline-none dark:border-nalika-border dark:bg-nalika-surface dark:text-nalika-text dark:hover:border-gray-600/70 dark:focus:border-ruri"
      @click="open = !open"
    >
      <span class="text-left">{{ selectedLabel }}</span>
      <svg class="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-500/10 bg-white py-1 shadow-lg md:right-0 dark:border-nalika-border dark:bg-nalika-surface"
    >
      <button
        v-for="opt in options"
        :key="opt.value"
        class="flex w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/5"
        :class="
          opt.value === modelValue
            ? 'bg-gunjyo/10 text-ruri dark:bg-gunjyo/15 dark:text-sora'
            : 'text-sumi dark:text-nalika-text'
        "
        @click="select(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { onClickOutside } from '@vueuse/core'

const modelValue = defineModel({ type: [String, Number], required: true })
const props = defineProps({
  options: { type: Array, required: true },
})

const dropdownRef = useTemplateRef('dropdownRef')
const open = ref(false)

onClickOutside(dropdownRef, () => {
  open.value = false
})

const selectedLabel = computed(
  () => props.options.find(o => o.value === modelValue.value)?.label ?? '',
)

function select(value) {
  modelValue.value = value
  open.value = false
}
</script>
