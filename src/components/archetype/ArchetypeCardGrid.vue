<template>
  <!-- One grid so rows fill the width; the type label sits over the first card
       of each type and of each row a type wraps onto, and only rows holding one
       get the room for it on top. A type never wraps mid-row.
       Cards that play the same (same effect and stats) stay in sort order inside
       one dashed box with one win-rate change; when the group runs past the end
       of a row it breaks, and each row draws its own piece of the box -->
  <div
    ref="gridEl"
    class="grid grid-cols-4 gap-x-4 gap-y-7 sm:grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] sm:gap-x-6"
  >
    <div
      v-for="item in items"
      :key="item.card.cardId"
      class="relative min-w-0"
      :class="[item.labelRow && tw`pt-9`, item.newRow && tw`col-start-1`]"
    >
      <div v-if="item.typeLabel" class="absolute inset-x-0 top-0 flex h-5 min-w-0 items-center">
        <span
          class="flex shrink-0 items-center gap-1.5 text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-nalika-text"
        >
          <!-- Small square in the type's colour marks where each type starts -->
          <span class="size-2 shrink-0 rounded-[2px]" :class="item.typeStyle.rail" />
          {{ item.typeLabel }}
          <span
            v-if="item.typeCont"
            class="font-normal tracking-normal text-gray-400 normal-case max-sm:hidden dark:text-gray-500"
          >
            {{ $t('archetype.grid.cont') }}
          </span>
          <span
            v-else
            class="rounded px-1 font-mono text-xxs font-semibold"
            :class="item.typeStyle.chip"
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
            :content="item.group.hint"
          >
            <!-- Just the group's WR, kept short so it fits under one card; shares
                 are in the hint -->
            <b class="font-bold">≡</b>
            <span v-if="item.group.liftText" :class="item.group.liftClass">
              <span class="max-sm:hidden">{{ $t('archetype.badge.wr') }}</span>
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
          @zoom="(id, info) => emit('zoom', id, item.group ? [info, item.group.hint] : info)"
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

const { t } = useI18n()

const TYPES = ['UNIT', 'PILOT', 'COMMAND', 'BASE']
// Same colours as the deck-curve chart's type legend
const TYPE_STYLE = {
  UNIT: {
    rail: tw`bg-ruri dark:bg-sky-600`,
    chip: tw`bg-ruri/10 text-ruri dark:bg-sky-600/20 dark:text-sky-300`,
  },
  PILOT: {
    rail: tw`bg-sky-400 dark:bg-sky-300`,
    chip: tw`bg-sky-400/15 text-sky-700 dark:bg-sky-300/15 dark:text-sky-200`,
  },
  COMMAND: {
    rail: tw`bg-amber-400 dark:bg-amber-500`,
    chip: tw`bg-amber-400/20 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300`,
  },
  BASE: {
    rail: tw`bg-emerald-500 dark:bg-emerald-600`,
    chip: tw`bg-emerald-500/15 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-300`,
  },
}
const OTHER_STYLE = {
  rail: tw`bg-gray-400 dark:bg-gray-500`,
  chip: tw`bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-nalika-text-muted`,
}

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
  // Older tier data has no allDecks
  const hasAll = g.allDecks != null
  const pct = n => sharePct(props.deckCount ? n / props.deckCount : 0)
  return {
    liftText: liftBadge(lift),
    liftClass: liftTone(lift),
    hint: {
      title: t('archetype.group.title'),
      subtitle: t('archetype.group.subtitle'),
      rows: [
        {
          label: t('archetype.group.decks'),
          value: g.decks,
          note: `${pct(g.decks)}% · ${t('archetype.group.anyVersion')}`,
        },
        { label: t('archetype.group.wins'), value: g.wins, note: t('archetype.group.eventsWon') },
        hasAll && {
          label: t('archetype.group.all'),
          value: g.allDecks,
          note: `${pct(g.allDecks)}% · ${size === 2 ? t('archetype.group.runBoth') : t('archetype.group.runAll', { n: size })}`,
        },
        liftRow(lift, t('archetype.group.vsNone')),
      ].filter(Boolean),
      footnote: lift ? '' : t('archetype.group.footnote'),
    },
  }
}

// A box piece is closed (border, rounded) only at the group's first and last
// card, so a group broken over two rows reads as one, open at the break. It
// reaches half the column gap towards a neighbour in the same row
function boxClass({ first, last, col }) {
  const toLeft = !first && col > 0
  const toRight = !last && col < cols.value - 1
  return [
    toLeft ? tw`-left-2 sm:-left-3` : tw`-left-0.5 sm:-left-1.5`,
    toRight ? tw`-right-2 sm:-right-3` : tw`-right-0.5 sm:-right-1.5`,
    first && tw`rounded-l-lg border-l-2`,
    last && tw`rounded-r-lg border-r-2`,
  ]
}

// Type order (unknown types last), each type in its own sort order, except a
// same-effect group's members are pulled together where its first (most
// played) member sits. The first card of each type carries the type label.
const items = computed(() => {
  const types = [...new Set([...TYPES, ...props.cards.map(c => c.type)])]
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
      typeFirst: i === 0,
      typeCount: ofType.length,
    }))
  })
  // A type never wraps mid-row: it shares the row with the type before it
  // only if it fits in the rest of that row, else it starts a fresh row, so a
  // type is never left with a single stray card dangling at the row's end
  let cursor = 0
  const pos = ordered.map(e => {
    const used = cursor % cols.value
    if (e.typeFirst && used && e.typeCount > cols.value - used) {
      cursor += cols.value - used
    }
    return cursor++
  })
  // Every card takes one column, so its column is its position mod the count
  // and its row the position divided by it. A type's first card carries its
  // label. A row the type wraps onto repeats it (marked "cont.") only when another
  // type also starts in that row: a row of one type with no label plainly
  // continues the row above, and long lists stay free of repeated labels
  const rowOf = i => Math.floor(pos[i] / cols.value)
  const startRows = new Set(ordered.flatMap((e, i) => (e.typeFirst ? [rowOf(i)] : [])))
  const labelled = ordered.map((e, i) => {
    const cont = !e.typeFirst && pos[i] % cols.value === 0 && startRows.has(rowOf(i))
    const name = cardTypeName(e.card.type)
    return { ...e, typeLabel: e.typeFirst || cont ? name : '', typeCont: cont }
  })
  const labelRows = new Set(labelled.flatMap((e, i) => (e.typeLabel ? [rowOf(i)] : [])))
  return labelled.map((e, i) => {
    const labelRow = labelRows.has(rowOf(i))
    const col = pos[i] % cols.value
    const newRow = e.typeFirst && col === 0
    const type = e.card.type
    const base = {
      ...e,
      labelRow,
      newRow,
      typeStyle: TYPE_STYLE[type] ?? OTHER_STYLE,
    }
    if (!e.group) {
      return base
    }
    return { ...base, boxClass: boxClass({ first: e.first, last: e.isLast, col }) }
  })
})
</script>
