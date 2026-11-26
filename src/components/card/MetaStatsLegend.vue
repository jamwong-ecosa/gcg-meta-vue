<template>
  <!-- Key for the green / red / grey win line under each card (CardMetaStats);
       shown once below the card sections that use it -->
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
    <UiHint :text="$t('card.metaStats.legend.help')" class="underline decoration-dotted">
      {{ $t('card.metaStats.legend.label') }}
    </UiHint>
    <span v-for="item in items" :key="item.key" class="inline-flex items-center gap-1">
      <span class="h-2 w-2 rounded-full" :class="item.dot" />
      {{ $t(`card.metaStats.legend.${item.key}`) }}
    </span>
  </div>
</template>

<script setup>
const items = [
  { key: 'above', dot: tw`bg-green-600 dark:bg-green-500` },
  { key: 'below', dot: tw`bg-red-600 dark:bg-red-500/90` },
  { key: 'chance', dot: tw`bg-gray-400 dark:bg-gray-500` },
]
</script>
