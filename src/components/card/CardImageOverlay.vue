<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 flex items-center justify-center bg-black/60"
      :style="{ zIndex }"
      @click.self="modelValue = null"
    >
      <div class="relative max-h-[85vh] overflow-hidden rounded-lg shadow-2xl">
        <img
          :src="`https://jw-assets.imgix.net/gcg-img/${modelValue}.webp?auto=format,compress`"
          alt="Enlarged card"
          class="h-auto max-h-[85vh] w-auto rounded-lg"
        />
        <button
          class="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          @click="modelValue = null"
        >
          ×
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const modelValue = defineModel({ type: String, default: null })

defineProps({
  zIndex: { type: [Number, String], default: 50 },
})
</script>
