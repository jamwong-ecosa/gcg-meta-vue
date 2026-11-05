<template>
  <div ref="dropdownRef" class="relative">
    <button
      class="flex cursor-pointer items-center justify-between border border-gray-500/10 bg-gray-50 text-sumi transition-colors hover:border-gray-300 focus:border-sora focus:ring-2 focus:ring-hai/5 focus:outline-none dark:border-nalika-border dark:bg-nalika-surface dark:text-nalika-text dark:hover:border-gray-600/70 dark:focus:border-ruri"
      :class="
        compact
          ? 'max-w-full gap-1 rounded-full py-0.5 pr-1.5 pl-2.5 text-xs font-medium'
          : 'w-full gap-2 rounded-lg px-3 py-1.5 text-sm'
      "
      :title="selectedLabel"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="min-w-0 truncate text-left">{{ selectedLabel }}</span>
      <svg
        class="shrink-0 transition-transform"
        :class="[compact ? 'size-3.5' : 'size-4', open && 'rotate-180']"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-500/10 bg-white py-1 shadow-lg dark:border-nalika-border dark:bg-nalika-surface"
      :class="compact ? 'w-max max-w-[calc(100vw-2rem)] min-w-48' : 'w-full md:right-0'"
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
  // Small pill sized to its label (mobile nav) instead of a full-width box
  compact: { type: Boolean, default: false },
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
