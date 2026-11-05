<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 flex items-center justify-center bg-black/60 p-4"
      :style="{ zIndex }"
      @click.self="modelValue = null"
    >
      <!-- With `info` the card's hint sits under the image (touch screens can't
           hover for it). The box gets an explicit width, the most a card can take
           at 60% of the screen height, since a shrink-to-fit box around an image
           capped at 100% collapses to nothing and squeezes the panel to a sliver -->
      <div
        class="relative overflow-hidden rounded-lg shadow-2xl"
        :class="
          info &&
          'flex max-h-full w-[min(100%,calc(60dvh*5/7),26rem)] flex-col bg-sky-50 dark:bg-slate-800'
        "
      >
        <img
          :src="`https://jw-assets.imgix.net/gcg-img/${modelValue}.webp?auto=format,compress`"
          :alt="$t('card.enlarged')"
          :class="
            info
              ? 'block aspect-[5/7] w-full shrink-0 object-cover'
              : 'h-auto max-h-[85vh] w-auto rounded-lg'
          "
        />
        <div
          v-if="info"
          class="min-h-0 overflow-y-auto px-3 py-2 text-sm leading-relaxed text-gray-800 dark:text-gray-100"
        >
          <!-- A card in a same-effect group also gets the group's hint, set off by a rule -->
          <div
            v-for="(block, i) in infoBlocks"
            :key="i"
            :class="i > 0 && 'mt-2 border-t border-sky-200 pt-2 dark:border-sky-800'"
          >
            <UiHintContent :content="block" />
          </div>
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

const props = defineProps({
  zIndex: { type: [Number, String], default: 50 },
  // Hint content for the card (see UiHintContent), or several, shown under the image
  info: { type: [Object, Array], default: null },
})

const infoBlocks = computed(() => [props.info].flat().filter(Boolean))
</script>
