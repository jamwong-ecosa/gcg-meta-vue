<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 flex items-center justify-center bg-black/60 p-4"
      :style="{ zIndex }"
      @click.self="modelValue = null"
    >
      <!-- With `info` the card's hint sits under the image (touch screens can't
           hover for it), as wide as the image; the image shrinks to make room -->
      <div class="relative flex max-h-full flex-col overflow-hidden rounded-lg shadow-2xl">
        <img
          :src="`https://jw-assets.imgix.net/gcg-img/${modelValue}.webp?auto=format,compress`"
          :alt="$t('card.enlarged')"
          class="h-auto min-h-0 w-auto max-w-full self-center object-contain"
          :class="info ? 'max-h-[60vh] rounded-t-lg' : 'max-h-[85vh] rounded-lg'"
        />
        <div
          v-if="info"
          class="w-0 min-w-full overflow-y-auto bg-sky-50 px-3 py-2 text-sm leading-relaxed text-gray-800 dark:bg-slate-800 dark:text-gray-100"
        >
          <UiHintContent :content="info" />
        </div>
        <button
          class="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          :aria-label="$t('card.close')"
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
  // Hint content for the card (see UiHintContent); shown under the image
  info: { type: Object, default: null },
})
</script>
