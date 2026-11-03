<template>
  <!-- Share of all decks, then share of winning decks: green or red only when
       the gap is beyond chance. Series with few wins show a count instead -->
  <div
    class="mt-2 flex flex-col gap-0.5 font-mono text-xs leading-tight whitespace-nowrap tabular-nums"
    :title="title"
  >
    <span class="font-bold text-gray-600 dark:text-gray-400">{{ sharePct(deckShare) }}% decks</span>
    <span
      v-if="showArchetypes && card.effectiveArchetypes"
      class="truncate text-sky-700 dark:text-sky-400"
    >
      {{ spread }} archetype{{ spread === 1 ? '' : 's' }}
    </span>
    <span v-else :class="winClass">{{ winText }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  // An aggregated card from _cards.json
  card: { type: Object, required: true },
  totalDecks: { type: Number, required: true },
  totalWins: { type: Number, required: true },
  // Show "spread across ~N archetypes" instead of the win share
  showArchetypes: { type: Boolean, default: false },
})

// Colour needs the win count to be this many standard deviations from what the
// deck share predicts (binomial, ~95%)
const Z = 1.96
// Below this many winning decks in the series, show "3/20 wins": a percentage of
// a tiny total looks more certain than it is
const COUNT_BELOW_WINS = 50

// Effective archetypes as a whole number (exact value in the tooltip)
const spread = computed(() => Math.max(1, Math.round(props.card.effectiveArchetypes ?? 0)))

const deckShare = computed(() =>
  props.totalDecks ? (props.card.totalDecksIncluded ?? 0) / props.totalDecks : 0,
)
const winShare = computed(() =>
  props.totalWins ? (props.card.totalWinnerDecks ?? 0) / props.totalWins : 0,
)

const winText = computed(() =>
  props.totalWins < COUNT_BELOW_WINS
    ? `${props.card.totalWinnerDecks ?? 0}/${props.totalWins} wins`
    : `${sharePct(winShare.value)}% wins`,
)

// Winning decks expected if the card's decks won at the series rate
const significant = computed(() => {
  const p = deckShare.value
  const expected = p * props.totalWins
  const sd = Math.sqrt(expected * (1 - p))
  return sd > 0 && Math.abs((props.card.totalWinnerDecks ?? 0) - expected) / sd >= Z
})

const winClass = computed(() => {
  if (!significant.value) {
    return tw`text-gray-500 dark:text-nalika-text-muted`
  }
  return winShare.value > deckShare.value
    ? tw`font-semibold text-green-600 dark:text-green-500`
    : tw`font-semibold text-red-600 dark:text-red-500/90`
})

const title = computed(() => {
  const c = props.card
  const lines = [
    c.name,
    `In ${c.totalDecksIncluded} of ${props.totalDecks} decks (${(deckShare.value * 100).toFixed(1)}%)`,
    `In ${c.totalWinnerDecks} of ${props.totalWins} winning decks (${(winShare.value * 100).toFixed(1)}%)${significant.value ? '' : ', within chance'}`,
  ]
  if (c.effectiveArchetypes) {
    lines.push(
      `Played in ${c.archetypeCount} archetypes; spread like ~${c.effectiveArchetypes} equal ones`,
    )
  }
  return lines.join('\n')
})
</script>
