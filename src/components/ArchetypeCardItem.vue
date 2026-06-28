<template>
  <div
    class="relative rounded-lg border border-gray-500/10 bg-white p-3 dark:border-nalika-border dark:bg-nalika-surface"
    :class="{ 'ring-2 ring-yellow-400': card.inWinner }"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1">
        <span
          class="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          :style="{ background: colorHex }"
        />
        <span class="font-mono text-xs text-gray-600 dark:text-nalika-text-muted">
          {{ card.cardId }}
        </span>
        <span
          v-if="card.rarity"
          class="rounded bg-gray-100 px-1 text-[0.6rem] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400"
        >
          {{ card.rarity.replace(/\+{1,2}$/, '') }}
        </span>
      </div>
      <div class="flex gap-1.5">
        <span
          v-if="card.level && card.level !== '-'"
          class="rounded bg-blue-100 px-1 text-[0.6rem] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          title="Level"
        >
          L{{ card.level }}
        </span>
        <span
          v-if="card.cost && card.cost !== '-'"
          class="rounded bg-orange-100 px-1 text-[0.6rem] font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
          title="Cost"
        >
          C{{ card.cost }}
        </span>
        <span
          v-if="card.ap && card.ap !== '-'"
          class="rounded bg-red-100 px-1 text-[0.6rem] font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300"
          title="AP"
        >
          {{ card.ap }}
        </span>
        <span
          v-if="card.hp && card.hp !== '-'"
          class="rounded bg-green-100 px-1 text-[0.6rem] font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300"
          title="HP"
        >
          {{ card.hp }}
        </span>
        <span
          v-if="card.avgQty"
          class="rounded bg-purple-100 px-1 text-[0.6rem] font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
          title="Avg copies per deck"
        >
          ×{{ card.avgQty }}
        </span>
      </div>
    </div>

    <div class="mt-1.5 flex justify-center">
      <img
        :src="`https://jw-assets.imgix.net/gcg-img/${card.cardId}.webp`"
        :alt="card.name"
        class="h-28 w-20 rounded object-cover"
        loading="lazy"
      />
    </div>

    <div class="mt-1.5 text-center text-xs font-medium text-gray-800 dark:text-nalika-text">
      {{ card.name }}
    </div>

    <div class="mt-1.5 flex items-center justify-between text-[0.6rem]">
      <span class="rounded px-1 font-mono font-bold" :class="inclusionTierClass">
        {{ (card.inclusionRate * 100).toFixed(1) }}%
      </span>
      <div class="flex items-center gap-1 text-gray-400 dark:text-nalika-text-muted">
        <span :title="`Decks included: ${card.decksIncluded}`">
          {{ card.decksIncluded }}
        </span>
        <span
          v-if="card.winnerDeckCount"
          class="text-yellow-600 dark:text-yellow-400"
          :title="`Wins: ${card.winnerDeckCount}`"
        >
          {{ card.winnerDeckCount }}
        </span>
      </div>
    </div>

    <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
      <div
        class="h-full rounded-full transition-all"
        :class="barColorClass"
        :style="{ width: `${Math.min(card.inclusionRate * 100, 100)}%` }"
      />
    </div>
  </div>
</template>

<script setup>
const COLOR_HEX = {
  Blue: '#2b6cb0',
  White: '#cbd5e0',
  Purple: '#805ad5',
  Red: '#e53e3e',
  Green: '#38a169',
  Black: '#1a202c',
  Yellow: '#d69e2e',
}

const props = defineProps({
  card: { type: Object, required: true },
})

const colorHex = computed(() => COLOR_HEX[props.card.color] || '#718096')

const inclusionTierClass = computed(() => {
  const rate = (props.card.inclusionRate ?? 0) * 100
  if (rate >= 80) {
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
  }
  if (rate >= 60) {
    return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
  }
  if (rate >= 40) {
    return 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
  }
  if (rate >= 20) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  }
  return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
})

const barColorClass = computed(() => {
  const rate = (props.card.inclusionRate ?? 0) * 100
  if (rate >= 80) {
    return 'bg-blue-500'
  }
  if (rate >= 60) {
    return 'bg-sky-500'
  }
  if (rate >= 40) {
    return 'bg-teal-500'
  }
  if (rate >= 20) {
    return 'bg-amber-500'
  }
  return 'bg-gray-400'
})
</script>
