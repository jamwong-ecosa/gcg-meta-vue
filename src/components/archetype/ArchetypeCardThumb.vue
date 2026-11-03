<template>
  <!-- Compact card (width comes from the parent): the full card image, which
       already shows cost, level and stats; copies per deck on top; inclusion and
       win-rate change underneath. Removed cards show the image only, dimmed -->
  <button
    class="group relative flex cursor-zoom-in flex-col text-left"
    :title="isRemoved ? card.name : statsTitle"
    @click="emit('zoom', card.cardId)"
  >
    <div class="relative w-full">
      <!-- Tag ring drawn behind the card, flush to its edge: TECH yellow, NEW
           green, both split on the diagonal (yellow top-left, green bottom-right) -->
      <span
        v-if="ringClass"
        class="pointer-events-none absolute -inset-1 rounded-md"
        :class="ringClass"
      />
      <div class="relative w-full overflow-hidden rounded">
        <img
          :src="`https://jw-assets.imgix.net/gcg-img/${card.cardId}.webp?w=200&auto=format,compress`"
          :alt="card.name"
          class="aspect-[3/4] w-full object-cover transition-[filter] group-hover:brightness-110"
          :class="{ 'opacity-60 grayscale-[60%]': isRemoved }"
          loading="lazy"
        />
        <span
          v-if="!isRemoved"
          class="absolute top-0 right-0 rounded-bl-md bg-black/70 px-1.5 font-mono text-base leading-snug font-bold text-white sm:text-lg"
        >
          ×{{ copies }}
        </span>
        <!-- Labels sit in one row bottom-left, over the card's trait text, so they
             don't hide the level or cost -->
        <div
          v-if="badges.length"
          class="absolute bottom-0 left-0 flex max-w-full flex-wrap-reverse items-end gap-px"
        >
          <span
            v-for="b in badges"
            :key="b.key"
            class="rounded-r px-1 text-xxs leading-tight font-bold"
            :class="b.class"
            :title="b.title"
          >
            {{ b.text }}
          </span>
        </div>
      </div>
    </div>
    <template v-if="!isRemoved">
      <div
        class="mt-2 flex items-baseline justify-between gap-x-1 font-mono text-xs leading-tight whitespace-nowrap tabular-nums"
      >
        <span class="font-bold text-gray-600 dark:text-gray-400">
          {{ sharePct(card.inclusionRate) }}%
        </span>
        <!-- "WR" dropped on phones so the line never wraps on a narrow card -->
        <span v-if="liftText" :class="liftClass">
          <span class="max-sm:hidden">WR</span>
          {{ liftText }}
        </span>
      </div>
      <div class="mt-0.5 h-0.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/70">
        <div
          class="h-full rounded-full"
          :class="barClass"
          :style="{ width: `${Math.min(card.inclusionRate * 100, 100)}%` }"
        />
      </div>
    </template>
  </button>
</template>

<script setup>
const props = defineProps({
  card: { type: Object, required: true },
  isSig: { type: Boolean, default: false },
  isNew: { type: Boolean, default: false },
  isRemoved: { type: Boolean, default: false },
  // Win-rate change with the card vs without (see liftFor in ArchetypeDetail); null hides it
  lift: { type: Object, default: null },
})
const emit = defineEmits(['zoom'])

const { copies, liftText, liftClass, statsTitle } = useCardStats(
  () => props.card,
  () => props.lift,
)
const badges = computed(() =>
  [
    props.isSig && {
      key: 'sig',
      text: '★ SIG',
      title: 'Signature card',
      class: tw`bg-black/75 text-yellow-300`,
    },
    !props.isRemoved &&
      props.card.inWinner && {
        key: 'tech',
        text: 'TECH',
        title: 'Top tech pick: uncommon, but its decks win well',
        class: tw`bg-yellow-400 text-yellow-950`,
      },
    !props.isRemoved &&
      props.isNew && {
        key: 'new',
        text: 'NEW',
        title: 'Not played by this archetype last series',
        class: tw`bg-green-600 text-white`,
      },
  ].filter(Boolean),
)
const ringClass = computed(() => {
  const tech = !props.isRemoved && props.card.inWinner
  const isNewCard = !props.isRemoved && props.isNew
  if (tech && isNewCard) {
    return tw`bg-[linear-gradient(135deg,var(--color-yellow-400)_50%,var(--color-green-500)_50%)]`
  }
  if (tech) {
    return tw`bg-yellow-400 dark:bg-yellow-500`
  }
  return isNewCard ? tw`bg-green-500` : ''
})
const barClass = computed(() => inclusionBarClass(props.card.inclusionRate))
</script>
