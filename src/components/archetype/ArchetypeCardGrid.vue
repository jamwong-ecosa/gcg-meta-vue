<template>
  <!-- One grid so rows fill the width; the type label sits over the first card
       of each type, and only rows holding one get the room for it on top.
       Cards that play the same (same effect and stats) stay in sort order inside
       one dashed box with one win-rate change; when the group runs past the end
       of a row it breaks, and each row draws its own piece of the box -->
  <div
    ref="gridEl"
    class="grid grid-cols-4 gap-x-3 gap-y-7 sm:grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] sm:gap-x-6"
  >
    <div
      v-for="item in items"
      :key="item.card.cardId"
      class="relative min-w-0"
      :class="item.labelRow && tw`pt-9`"
    >
      <div v-if="item.typeLabel" class="absolute inset-x-0 top-0 flex h-5 min-w-0 items-center">
        <span
          class="flex shrink-0 items-center gap-1.5 border-l-2 border-gray-400 pl-1.5 text-xs font-bold tracking-wider text-gray-700 uppercase dark:border-gray-500 dark:text-nalika-text"
        >
          {{ item.typeLabel }}
          <span
            class="rounded bg-gray-200 px-1 font-mono text-xxs font-semibold text-gray-600 dark:bg-white/10 dark:text-nalika-text-muted"
          >
            {{ item.typeCount }}
          </span>
        </span>
      </div>

      <div class="relative">
        <template v-if="item.group">
          <!-- This card's piece of the box: reaches into the gap towards its
               neighbours, closed on the sides where the group's row segment ends -->
          <div
            class="pointer-events-none absolute -inset-y-1 border-y-2 border-dashed border-sky-400/80 sm:-inset-y-1.5 dark:border-sky-500/60"
            :class="item.boxClass"
          />
          <UiHint
            v-if="item.isLast"
            class="absolute right-1 -bottom-3 z-10 flex items-baseline gap-1.5 rounded bg-white px-1.5 font-mono text-xs leading-5 whitespace-nowrap text-sky-700 tabular-nums dark:bg-nalika-bg dark:text-sky-400"
            :text="item.group.title"
          >
            <!-- Same type and layout as a card's own share / WR line -->
            <span class="font-bold">≡ {{ item.group.pct }}%</span>
            <span
              v-if="item.group.allPct != null"
              class="text-gray-500 dark:text-nalika-text-muted"
            >
              <span class="text-gray-300 dark:text-gray-600">·</span>
              {{ item.group.allLabel }}
              <b class="font-bold text-sky-700 dark:text-sky-400">{{ item.group.allPct }}%</b>
            </span>
            <span v-if="item.group.liftText" :class="item.group.liftClass">
              <span class="mr-1.5 text-gray-300 dark:text-gray-600">·</span>
              <span class="max-sm:hidden">WR</span>
              {{ item.group.liftText }}
            </span>
          </UiHint>
        </template>
        <ArchetypeCardThumb
          class="w-full"
          :card="item.card"
          :lift="removed || item.group ? null : liftOf(item.card)"
          :is-sig="sigIds.has(item.card.cardId)"
          :is-new="!removed && isNew(item.card.cardId)"
          :is-removed="removed"
          @zoom="emit('zoom', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useResizeObserver } from '@vueuse/core'

const props = defineProps({
  cards: { type: Array, required: true },
  // Cards no longer played: no stats, dimmed
  removed: { type: Boolean, default: false },
  // (card) => win-rate change with it vs without (see liftFor in ArchetypeDetail)
  liftOf: { type: Function, default: () => null },
  // (effectGroup) => the same for the group's effect in any version, or null
  groupLiftOf: { type: Function, default: () => null },
  // Decks in the archetype, for the group's share
  deckCount: { type: Number, default: 0 },
  sigIds: { type: Set, default: () => new Set() },
  // (cardId) => boolean
  isNew: { type: Function, default: () => false },
})
const emit = defineEmits(['zoom'])

const TYPES = { UNIT: 'Unit', PILOT: 'Pilot', COMMAND: 'Command', BASE: 'Base' }

// Columns the grid has right now (auto-fill on wider screens), to know where a
// group's row segments start and end
const gridEl = useTemplateRef('gridEl')
const cols = ref(4)
useResizeObserver(gridEl, () => {
  const tracks = getComputedStyle(gridEl.value).gridTemplateColumns.split(' ').length
  if (tracks !== cols.value) {
    cols.value = tracks
  }
})

function groupInfo(g) {
  const lift = props.groupLiftOf(g)
  // Every version the archetype plays, which may be more than this grid shows
  const size = g.id.split('+').length
  const allLabel = size === 2 ? 'both' : `all ${size}`
  // Older tier data has no allDecks
  const hasAll = g.allDecks != null
  return {
    pct: sharePct(props.deckCount ? g.decks / props.deckCount : 0),
    allLabel,
    allPct: hasAll ? sharePct(props.deckCount ? g.allDecks / props.deckCount : 0) : null,
    liftText: liftValue(lift),
    liftClass: liftTone(lift),
    title: [
      'Same card under different names (same effect and stats)',
      `In ${g.decks} decks in any version, ${g.wins} of them won`,
      hasAll && `${g.allDecks} decks run ${size === 2 ? 'both versions' : `all ${size} versions`}`,
      liftNote(lift) || 'WR: win rate of decks running any version vs none',
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

// A box piece is closed (border, rounded) only at the group's first and last
// card, so a group broken over two rows reads as one, open at the break. It
// reaches half the column gap towards a neighbour in the same row
function boxClass({ first, last, col }) {
  const toLeft = !first && col > 0
  const toRight = !last && col < cols.value - 1
  return [
    toLeft ? tw`-left-1.5 sm:-left-3` : tw`-left-1 sm:-left-1.5`,
    toRight ? tw`-right-1.5 sm:-right-3` : tw`-right-1 sm:-right-1.5`,
    first && tw`rounded-l-lg border-l-2`,
    last && tw`rounded-r-lg border-r-2`,
  ]
}

// Type order (unknown types last), each type in its own sort order, except a
// same-effect group's members are pulled together where its first (most
// played) member sits. The first card of each type carries the type label.
const items = computed(() => {
  const types = [...new Set([...Object.keys(TYPES), ...props.cards.map(c => c.type)])]
  const ordered = types.flatMap(type => {
    const ofType = props.cards.filter(c => c.type === type)
    const placed = new Set()
    const out = []
    for (const card of ofType) {
      const g = !props.removed && card.effectGroup
      const members = g ? ofType.filter(c => c.effectGroup?.id === g.id) : []
      if (members.length < 2) {
        out.push({ card })
      } else if (!placed.has(g.id)) {
        placed.add(g.id)
        const info = groupInfo(g)
        members.forEach((m, i) => {
          out.push({ card: m, group: info, first: i === 0, isLast: i === members.length - 1 })
        })
      }
    }
    return out.map((e, i) => ({
      ...e,
      typeLabel: i === 0 ? (TYPES[type] ?? type) : '',
      typeCount: ofType.length,
    }))
  })
  // Every card takes one column, so its column is its position mod the count
  // and its row the position divided by it
  const rowOf = i => Math.floor(i / cols.value)
  const labelRows = new Set(ordered.flatMap((e, i) => (e.typeLabel ? [rowOf(i)] : [])))
  return ordered.map((e, i) => {
    const labelRow = labelRows.has(rowOf(i))
    if (!e.group) {
      return { ...e, labelRow }
    }
    const box = boxClass({ first: e.first, last: e.isLast, col: i % cols.value })
    return { ...e, labelRow, boxClass: box }
  })
})
</script>
