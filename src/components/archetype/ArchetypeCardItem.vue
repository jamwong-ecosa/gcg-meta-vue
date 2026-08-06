<template>
  <div
    class="relative rounded bg-shironezumi/7 p-2 dark:bg-nalika-surface"
    :class="[
      isNew
        ? 'border border-green-500 dark:border-green-600'
        : 'border border-gray-500/10 dark:border-nalika-border',
      { 'outline-2 outline-offset-1 outline-yellow-400 dark:outline-yellow-700': card.inWinner },
    ]"
  >
    <div
      v-if="card.inWinner"
      class="gloss-overlay pointer-events-none absolute inset-0 z-10 rounded"
    />
    <div
      v-if="isSig"
      class="absolute top-1 right-1 z-20 text-xs leading-none text-yellow-400"
      title="Signature card"
    >
      ★
    </div>

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
          class="font-mono text-xs"
          :class="{
            'font-semibold text-yellow-600 dark:text-yellow-400/80': card.rarity.startsWith('LR'),
            'text-gray-400 dark:text-gray-500': !card.rarity.startsWith('LR'),
          }"
        >
          {{ card.rarity.replace(/\+{1,2}$/, '') }}
        </span>
      </div>
    </div>

    <div class="mt-1.5 flex justify-between gap-1.5">
      <div class="flex gap-1.5">
        <span
          v-if="card.level && card.level !== '-'"
          class="font-mono text-xs font-medium text-gray-600 dark:text-gray-400/80"
          title="Level"
        >
          L{{ card.level }}
        </span>
        <span
          v-if="card.cost && card.cost !== '-'"
          class="font-mono text-xs font-medium text-gray-500"
          title="Cost"
        >
          C{{ card.cost }}
        </span>
      </div>
      <div class="flex gap-1.5">
        <span
          v-if="card.ap && card.ap !== '-'"
          class="font-mono text-xs font-medium text-red-700 dark:text-red-600/85"
          title="AP"
        >
          AP{{ card.ap }}
        </span>
        <span
          v-if="card.hp && card.hp !== '-'"
          class="font-mono text-xs font-medium text-green-700 dark:text-green-600/75"
          title="HP"
        >
          HP{{ card.hp }}
        </span>
      </div>
    </div>

    <div
      class="group relative mt-1.5 aspect-[20/11] overflow-hidden rounded"
      @click="enlargedCardId = card.cardId"
    >
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

    <template v-if="!isRemoved">
      <div class="mt-2 flex items-center justify-between text-xs">
        <span class="font-mono font-bold text-gray-600 dark:text-gray-400">
          {{ (card.inclusionRate * 100).toFixed(1) }}%
        </span>
        <div class="flex items-center gap-1">
          <span
            class="font-mono text-gray-500 dark:text-nalika-text-muted/90"
            :title="`Decks included: ${card.decksIncluded}`"
          >
            {{ card.decksIncluded }}
          </span>
          <span v-if="card.winnerDeckCount" class="text-gray-300 dark:text-gray-500">·</span>
          <span
            v-if="card.winnerDeckCount"
            class="font-mono text-yellow-600 dark:text-yellow-600"
            :title="`Wins: ${card.winnerDeckCount}`"
          >
            {{ card.winnerDeckCount }}
          </span>
          <span v-if="card.avgQty" class="text-gray-300 dark:text-gray-500">·</span>
          <span
            v-if="card.avgQty"
            class="font-mono text-indigo-500 dark:text-indigo-400/70"
            title="Avg copies per deck"
          >
            ×{{ card.avgQty }}
          </span>
        </div>
      </div>

      <div class="mt-1 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/70">
        <div
          class="h-full rounded-full transition-all"
          :class="barColorClass"
          :style="{ width: `${Math.min(card.inclusionRate * 100, 100)}%` }"
        />
      </div>
    </template>

    <CardImageOverlay v-model="enlargedCardId" :z-index="1100" />
  </div>
</template>

<script setup>
const props = defineProps({
  card: { type: Object, required: true },
  isSig: { type: Boolean, default: false },
  isNew: { type: Boolean, default: false },
  isRemoved: { type: Boolean, default: false },
})

const enlargedCardId = ref(null)

const colorHex = computed(() => COLOR_HEX[props.card.color] || '#718096')

const barColorClass = computed(() => {
  const rate = (props.card.inclusionRate ?? 0) * 100
  if (rate >= 90) {
    return tw`bg-red-500 dark:bg-red-700`
  }
  if (rate >= 75) {
    return tw`bg-amber-500 dark:bg-amber-700`
  }
  if (rate >= 50) {
    return tw`bg-yellow-400 dark:bg-yellow-600`
  }
  if (rate >= 25) {
    return tw`bg-green-500 dark:bg-green-700`
  }
  return tw`bg-sky-400 dark:bg-sky-600`
})
</script>

<style scoped>
.gloss-overlay {
  background: linear-gradient(
    135deg,
    var(--gloss-start) 0%,
    var(--gloss-mid) 40%,
    transparent 50%,
    var(--gloss-end) 100%
  );
}
</style>
