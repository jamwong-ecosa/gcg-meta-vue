<template>
  <!-- Compact card (width comes from the parent): the full card image, which
       already shows cost, level and stats; copies per deck on top; inclusion and
       win-rate change underneath. Removed cards show the image only, dimmed -->
  <UiHint class="flex flex-col" :content="hintContent ?? hint">
    <button
      class="group relative flex w-full flex-col text-left"
      :class="stack.length ? tw`cursor-pointer` : tw`cursor-zoom-in`"
      @click="emit('zoom', card.cardId, hint)"
    >
      <div class="relative w-full">
        <!-- Collapsed same-effect group: the other versions peek out behind, up
             and to the right, farthest first so the front card paints on top -->
        <img
          v-for="layer in stackLayers"
          :key="layer.card.cardId"
          :src="`https://jw-assets.imgix.net/gcg-img/${layer.card.cardId}.webp?w=200&auto=format,compress`"
          alt=""
          class="absolute inset-0 aspect-[5/7] w-full rounded object-cover shadow-sm ring-1 ring-black/10 dark:ring-white/10"
          :class="layer.class"
          loading="lazy"
        />
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
            class="aspect-[5/7] w-full object-cover transition-[filter] group-hover:brightness-110"
            :class="{ 'opacity-60 grayscale-[60%]': isRemoved }"
            loading="lazy"
          />
          <span
            v-if="!isRemoved"
            class="absolute top-0 right-0 rounded-bl-md bg-black/70 px-1.5 font-mono text-base leading-snug font-bold text-white sm:text-lg"
          >
            {{ copiesText || `×${copies}` }}
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
        <div
          class="mt-0.5 h-0.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/70"
        >
          <div
            class="h-full rounded-full"
            :class="barClass"
            :style="{ width: `${Math.min(card.inclusionRate * 100, 100)}%` }"
          />
        </div>
      </template>
    </button>
  </UiHint>
</template>

<script setup>
const props = defineProps({
  card: { type: Object, required: true },
  isSig: { type: Boolean, default: false },
  isNew: { type: Boolean, default: false },
  isRemoved: { type: Boolean, default: false },
  // Win-rate change with the card vs without (see liftFor in ArchetypeDetail); null hides it
  lift: { type: Object, default: null },
  // Other versions of a collapsed same-effect group, drawn stacked behind the card
  stack: { type: Array, default: () => [] },
  // Hover hint in place of the card's own (a collapsed group shows the group's)
  hintContent: { type: Object, default: null },
  // Copies badge in place of the card's own "×N" (a collapsed group: "≡×5")
  copiesText: { type: String, default: '' },
})
const emit = defineEmits(['zoom'])

const { copies, liftText, liftClass, statsRows } = useCardStats(
  () => props.card,
  () => props.lift,
)
const tags = computed(() => ({
  sig: props.isSig,
  tech: !props.isRemoved && props.card.inWinner,
  new: !props.isRemoved && props.isNew,
}))
const badges = computed(() => tagBadges(tags.value))
// Name and card number, stats, then what each tag on the card means
const hint = computed(() =>
  props.isRemoved
    ? { title: props.card.name, subtitle: props.card.cardId }
    : {
        title: props.card.name,
        subtitle: props.card.cardId,
        rows: statsRows.value,
        tags: badges.value,
      },
)
// At most two layers show, however many versions there are
// and each one further back is darker, so the edges read as a pile
const STACK_OFFSETS = [
  tw`translate-x-0.75 -translate-y-0.75 brightness-90 sm:translate-x-1.25 sm:-translate-y-1.25`,
  tw`translate-x-1.5 -translate-y-1.5 brightness-75 sm:translate-x-2.5 sm:-translate-y-2.5`,
]
const stackLayers = computed(() =>
  props.stack
    .slice(0, STACK_OFFSETS.length)
    .map((card, i) => ({ card, class: STACK_OFFSETS[i] }))
    .reverse(),
)
const ringClass = computed(() => tagRingClass(tags.value))
const barClass = computed(() => inclusionBarClass(props.card.inclusionRate))
</script>
