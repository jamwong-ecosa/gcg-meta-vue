<template>
  <div ref="rootRef" :class="['scroll-mt-14', rootClass]">
    <button
      class="font-medium text-ruri underline-offset-5 hover:underline focus:outline-none"
      @click="emit('toggle')"
    >
      {{ title }}（{{ count }}）{{ show ? '−' : '+' }}
    </button>
    <div v-if="show" :class="['mt-2', contentClass]">
      <slot />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  show: Boolean,
  count: { type: Number, default: 0 },
  title: { type: String, default: '' },
  contentClass: { type: String, default: 'space-y-1' },
  rootClass: { type: String, default: 'mt-4' },
})
const emit = defineEmits(['toggle'])
const rootRef = ref(null)

watch(
  () => props.show,
  val => {
    if (val) {
      nextTick(() => rootRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  },
)
</script>
