<template>
  <div ref="dropdownRef" class="relative">
    <button
      class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-500/10 bg-gray-50 px-3 py-1.5 text-sm transition-colors hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none dark:border-nalika-border dark:bg-nalika-surface dark:text-nalika-text dark:hover:border-gray-500 dark:focus:border-primary"
      @click="open = !open"
    >
      {{ selectedLabel }}
      <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute left-0 z-10 mt-1 w-full rounded-lg border border-gray-500/10 bg-white py-1 shadow-lg max-h-60 overflow-y-auto md:right-0 dark:border-nalika-border dark:bg-nalika-surface"
    >
      <button
        v-for="opt in options"
        :key="opt.value"
        class="flex w-full px-3 py-2 text-sm hover:bg-gray-100 md:justify-end dark:hover:bg-white/5"
        :class="
          opt.value === modelValue
            ? 'font-bold text-primary'
            : 'text-gray-700 dark:text-nalika-text'
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

const props = defineProps({
  modelValue: { type: [String, Number], required: true },
  options: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue'])

const dropdownRef = useTemplateRef('dropdownRef')
const open = ref(false)

onClickOutside(dropdownRef, () => {
  open.value = false
})

const selectedLabel = computed(
  () => props.options.find(o => o.value === props.modelValue)?.label ?? '',
)

function select(value) {
  emit('update:modelValue', value)
  open.value = false
}
</script>
