<template>
  <div
    class="@container rounded border border-gray-500/10 bg-shironezumi/2 p-2 dark:border-nalika-border dark:bg-nalika-surface"
    @click="$emit('toggle-enlarge', card.cardId)"
  >
    <div class="flex items-center gap-1">
      <span class="inline-block h-2 w-2 shrink-0 rounded-full" :style="{ background: colorHex }" />
      <span class="font-mono text-xs text-gray-600 dark:text-nalika-text-muted">
        {{ card.cardId }}
      </span>
      <span
        v-if="card.rarity"
        class="font-mono text-xs"
        :class="{
          'font-semibold text-yellow-600 dark:text-yellow-400/80': card.rarity.startsWith('LR'),
          'text-gray-400 dark:text-gray-500': !card.rarity.startsWith('LR'),
        }"
      >
        {{ card.rarity.replace(/\+{1,2}$/, '') }}
      </span>
      <span
        v-if="card.avgQty"
        class="ml-auto font-mono text-xs text-indigo-500 dark:text-indigo-400/70"
        title="Avg copies per deck"
      >
        ×{{ card.avgQty }}
      </span>
    </div>
    <div class="group relative mt-1.5 aspect-[20/11] overflow-hidden rounded">
      <img
        :src="`https://jw-assets.imgix.net/gcg-img/${card.cardId}.webp?fit=crop&ar=3:2&w=300&crop=focalpoint&fp-x=0.5&fp-y=0.05&auto=format,compress`"
        :alt="card.name"
        class="h-full w-full scale-150 object-cover brightness-85 transition-all duration-200 group-hover:brightness-95"
        loading="lazy"
      />
    </div>
    <div
      class="mt-1.5 w-full truncate text-center text-xs font-semibold text-aisumicha dark:text-nalika-text"
    >
      {{ card.name }}
    </div>
    <slot />
  </div>
</template>

<script setup>
const props = defineProps({
  card: { type: Object, required: true },
})

defineEmits(['toggle-enlarge'])

const colorHex = computed(() => COLOR_HEX[props.card.color] || '#718096')
</script>
