<template>
  <div class="flex w-max gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-700/70">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      class="rounded-md px-3 py-1 text-xs font-medium transition-colors"
      :class="
        modelValue === opt.value
          ? 'bg-white text-sumi shadow-xs dark:bg-nalika-surface dark:text-nalika-text'
          : 'text-gray-500 hover:text-sumi dark:text-nalika-text-muted dark:hover:text-nalika-text'
      "
      @click="modelValue = opt.value"
    >
      <span
        v-if="opt.dotColor"
        class="mr-1.5 inline-block h-2 w-2 rounded-full"
        :style="{ background: opt.dotColor }"
      />
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup>
const modelValue = defineModel({ type: [String, Number], required: true })

defineProps({
  options: { type: Array, required: true },
})
</script>
