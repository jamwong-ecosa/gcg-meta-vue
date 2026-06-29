<template>
  <div
    class="relative rounded-lg border border-gray-500/10 bg-shironezumi/7 p-2 dark:border-nalika-border dark:bg-nalika-surface"
    :class="{ 'ring-2 ring-yellow-400 dark:ring-yellow-700': card.inWinner }"
  >
    <div
      v-if="card.inWinner"
      class="gloss-overlay pointer-events-none absolute inset-0 z-10 rounded-lg"
    />

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
          class="font-mono text-xs text-gray-400 dark:text-gray-500"
          :class="{
            'font-semibold text-yellow-600 dark:text-yellow-400/80': card.rarity.startsWith('LR'),
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
          class="font-mono text-xs font-medium text-red-700 dark:text-red-700/80"
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
      class="group relative mt-1.5 aspect-[3/2] overflow-hidden rounded"
      @click="enlarged = true"
    >
      <img
        :src="`https://jw-assets.imgix.net/gcg-img/${card.cardId}.webp?fit=crop&ar=3:2&w=300&crop=focalpoint&fp-x=0.5&fp-y=0.05`"
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

    <Teleport to="body">
      <div
        v-if="enlarged"
        class="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60"
        @click.self="enlarged = false"
      >
        <div class="relative max-h-[85vh] overflow-hidden rounded-lg shadow-2xl">
          <img
            :src="`https://jw-assets.imgix.net/gcg-img/${card.cardId}.webp`"
            :alt="card.name"
            class="h-auto max-h-[85vh] w-auto rounded-lg"
          />
          <button
            class="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            @click="enlarged = false"
          >
            ×
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
const props = defineProps({
  card: { type: Object, required: true },
})

const enlarged = ref(false)

const colorHex = computed(() => COLOR_HEX[props.card.color] || '#718096')

const barColorClass = computed(() => {
  const rate = (props.card.inclusionRate ?? 0) * 100
  if (rate >= 80) {
    return tw`bg-red-500 dark:bg-red-700`
  }
  if (rate >= 60) {
    return tw`bg-amber-500 dark:bg-amber-700`
  }
  if (rate >= 40) {
    return tw`bg-yellow-400 dark:bg-yellow-600`
  }
  if (rate >= 20) {
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
