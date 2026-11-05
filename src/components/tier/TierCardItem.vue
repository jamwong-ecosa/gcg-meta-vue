<template>
  <div
    class="overflow-hidden rounded-r-lg border-l-4 bg-shironezumi/7 not-dark:shadow-xs not-dark:shadow-gray-400/10 dark:bg-nalika-surface"
    :class="tierBorderClass(row.tier)"
  >
    <!-- One line with the essentials: tap opens the analysis, the chevron shows
         the rest of the stats -->
    <div class="flex items-stretch">
      <button
        class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 pl-2.5 text-left"
        @click="$emit('detail', row)"
      >
        <span
          class="w-6 shrink-0 rounded py-0.5 text-center text-xxs font-bold"
          :class="tierPillClass(row.tier)"
        >
          {{ row.tier }}
        </span>
        <!-- Color combo on its own line, signature cards underneath, so the
             Japanese card names never wrap into the combo -->
        <div class="min-w-0 flex-1">
          <div
            v-if="headline"
            class="flex items-center gap-1 text-[13px] leading-snug font-semibold text-gray-800 dark:text-nalika-text"
          >
            <span v-if="!hideColor" class="inline-flex shrink-0 gap-0.5">
              <span
                v-for="dot in row.colorDots"
                :key="dot.name"
                class="inline-block h-2 w-2 rounded-full"
                :style="{ background: dot.hex }"
              />
            </span>
            <span class="truncate">{{ headline }}</span>
            <UiHint v-if="row.darkHorse" class="text-xs" :text="DARK_HORSE_HELP">🐴</UiHint>
          </div>
          <div
            v-if="cardNames.length"
            class="leading-snug [overflow-wrap:anywhere] break-keep"
            :class="
              headline
                ? 'mt-0.5 text-xs text-gray-400 dark:text-gray-500'
                : 'text-[13px] text-gray-800 dark:text-nalika-text'
            "
          >
            <!-- break-keep stops Japanese wrapping mid-name, so lines break at the
                 slash (or a space inside a long name); the nbsp keeps the slash
                 at the end of the line rather than starting the next one -->
            <template v-for="(card, ci) in cardNames" :key="ci">
              <span v-if="ci > 0">{{ CARD_SEP }}</span>
              <span :class="card.color ? 'font-medium' : ''" :style="{ color: card.color }">
                {{ card.name }}
              </span>
            </template>
            <UiHint v-if="!headline && row.darkHorse" class="ml-1" :text="DARK_HORSE_HELP">
              🐴
            </UiHint>
          </div>
        </div>
        <!-- Score on top, usage and rank change underneath -->
        <div class="shrink-0 text-right leading-tight">
          <div
            class="font-mono text-lg font-bold text-aisumicha tabular-nums dark:text-nalika-text"
          >
            {{ row.score }}
          </div>
          <div
            class="mt-0.5 flex items-baseline justify-end gap-1.5 font-mono text-xs tabular-nums"
          >
            <span class="text-gray-500 dark:text-gray-400">{{ row.usePct }}</span>
            <TierMovement
              v-if="hasMovement"
              compact
              :move="row.move"
              :rank="row.rank"
              :tier="row.tier"
            />
          </div>
        </div>
      </button>
      <button
        class="my-1.5 ml-2 flex w-10 shrink-0 cursor-pointer items-center justify-center border-l border-gray-500/15 text-gray-400 hover:text-gray-600 dark:border-white/10 dark:text-gray-500 dark:hover:text-gray-300"
        :aria-expanded="open"
        :aria-label="open ? 'Hide stats' : 'Show stats'"
        @click="open = !open"
      >
        <svg
          class="h-5 w-5 transition-transform"
          :class="open ? 'rotate-180' : ''"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>

    <div v-if="open" class="border-t border-gray-500/10 px-3 pt-2 pb-3">
      <dl class="grid grid-cols-3 gap-x-2 gap-y-2">
        <div v-for="s in stats" :key="s.key">
          <dt class="text-xxs font-semibold tracking-widest text-gray-400 uppercase">
            {{ s.label }}
          </dt>
          <dd
            class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
          >
            {{ s.value }}
          </dd>
        </div>
      </dl>
      <p v-if="shift" class="mt-2 text-xxs text-gray-500 dark:text-gray-400">
        <b
          :class="
            shift === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
          "
        >
          {{ shift === 'up' ? 'Up' : 'Down' }}
        </b>
        from {{ row.move.prevTier }} tier (rank {{ row.move.prevRank }}) last series
      </p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  row: { type: Object, required: true },
  hideColor: { type: Boolean, default: false },
  hasMovement: { type: Boolean, default: false },
})
defineEmits(['detail'])

const open = ref(false)

const stats = computed(() => [
  { key: 'decks', label: 'Decks', value: props.row.decks },
  { key: 'wins', label: 'Wins', value: props.row.wins },
  { key: 'top4', label: 'Top4', value: props.row.top4 },
  { key: 'use', label: 'Use%', value: props.row.usePct },
  { key: 'winEv', label: 'Win/Ev', value: props.row.winPerEv },
  { key: 'winDk', label: 'Win/Dk', value: props.row.winPerDk },
])

// "Red+White（A / B）" → headline "Red+White", cards "A / B". Grouped by color
// the section header already names the combo, so only the cards are shown
// (falling back to the combo when the archetype has no cards).
const nameParts = computed(() => {
  const m = props.row.archetype.match(/^(.+?)\s*[（(](.+)[）)]$/)
  return m ? { base: m[1].trimEnd(), cards: m[2] } : { base: props.row.archetype, cards: '' }
})

const headline = computed(() =>
  props.hideColor && nameParts.value.cards ? '' : nameParts.value.base,
)

const CARD_SEP = ' / '

const cardNames = computed(() =>
  nameParts.value.cards
    ? nameParts.value.cards.split(/\s*\/\s*/).map(name => {
        const sc = props.row.sigCards?.find(c => c.name === name)
        return { name, color: sc ? COLOR_TEXT[sc.color] : undefined }
      })
    : [],
)

const shift = computed(() => tierShift(props.row.move?.prevTier, props.row.tier))
</script>
