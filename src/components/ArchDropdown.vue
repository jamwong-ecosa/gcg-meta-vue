<template>
  <div ref="dropdownRef" class="relative">
    <button
      class="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-gray-500/10 bg-gray-50 px-3 py-1.5 text-sm transition-colors hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none dark:border-nalika-border dark:bg-nalika-surface dark:text-nalika-text dark:hover:border-gray-500 dark:focus:border-primary"
      @click="open = !open"
    >
      <div class="flex-1 truncate text-left">
        <div class="flex items-center gap-1 truncate">
          <div
            v-for="h in selectedColors"
            :key="h"
            class="h-2 w-2 shrink-0 rounded-full"
            :style="{ background: h }"
          />
          <span class="truncate">
            <template v-for="(seg, si) in selectedSegments" :key="si">
              <span v-if="seg.color" :style="{ color: seg.color }">{{ seg.text }}</span>
              <span v-else>{{ seg.text }}</span>
            </template>
          </span>
        </div>
        <div v-if="selectedDetails" class="truncate text-xs text-gray-400 dark:text-gray-500">
          {{ selectedDetails }}
        </div>
      </div>
      <svg class="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute left-0 z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-500/10 bg-white py-1 shadow-lg md:right-0 dark:border-nalika-border dark:bg-nalika-surface"
    >
      <button
        v-for="opt in options"
        :key="opt.value"
        class="flex w-full flex-col px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-white/5"
        :class="opt.value === modelValue ? 'bg-primary/10 dark:bg-primary/20' : ''"
        @click="select(opt.value)"
      >
        <div class="flex items-center gap-1 truncate text-left text-gray-700 dark:text-nalika-text">
          <div
            v-for="h in opt.colors"
            :key="h"
            class="h-2 w-2 shrink-0 rounded-full"
            :style="{ background: h }"
          />
          <span class="truncate">
            <template v-for="(seg, si) in opt.labelSegments" :key="si">
              <span v-if="seg.color" :style="{ color: seg.color }">{{ seg.text }}</span>
              <span v-else>{{ seg.text }}</span>
            </template>
          </span>
        </div>
        <span
          v-if="opt.details"
          class="truncate text-left text-xs font-normal text-gray-400 dark:text-gray-500"
        >
          {{ opt.details }}
        </span>
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

const selected = computed(() => props.options.find(o => o.value === props.modelValue))

const selectedColors = computed(() => selected.value?.colors ?? [])
const selectedSegments = computed(() => selected.value?.labelSegments ?? [])
const selectedDetails = computed(() => selected.value?.details ?? '')

function select(value) {
  emit('update:modelValue', value)
  open.value = false
}
</script>
