<template>
  <!-- Compact card, matching the archetype page: the full card image (it already
       shows cost, level and stats), rank and copies on it, stats underneath -->
  <button
    class="group flex min-w-0 cursor-zoom-in flex-col text-left"
    :title="card.name"
    @click="$emit('toggle-enlarge', card.cardId)"
  >
    <div class="relative w-full overflow-hidden rounded">
      <img
        :src="`https://jw-assets.imgix.net/gcg-img/${card.cardId}.webp?w=240&auto=format,compress`"
        :alt="card.name"
        class="aspect-[3/4] w-full object-cover transition-[filter] group-hover:brightness-110"
        loading="lazy"
      />
      <span
        v-if="card.avgQty"
        class="absolute top-0 right-0 rounded-bl-md bg-black/70 px-1.5 font-mono text-base leading-snug font-bold text-white sm:text-lg"
        title="Copies per deck that runs it"
      >
        ×{{ card.avgQty }}
      </span>
      <!-- Bottom-left, over the trait text, so it doesn't hide level or cost -->
      <span
        v-if="rank"
        class="absolute bottom-0 left-0 rounded-tr-md bg-black/75 px-1.5 font-mono text-sm leading-snug font-bold text-white"
      >
        #{{ rank }}
      </span>
    </div>
    <slot />
  </button>
</template>

<script setup>
defineProps({
  card: { type: Object, required: true },
  // 1-based position in a ranked list; 0 hides it
  rank: { type: Number, default: 0 },
})

defineEmits(['toggle-enlarge'])
</script>
