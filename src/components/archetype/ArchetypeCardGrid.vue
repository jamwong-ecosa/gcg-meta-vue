<template>
  <!-- One grid so rows fill the width; the type label sits over the first card of
       each type instead of breaking the row. Cards that play the same (same
       effect and stats) share one cell spanning their columns, in a dashed box,
       with one win-rate change for the group -->
  <div
    class="grid grid-cols-4 gap-x-3 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] sm:gap-x-6"
  >
    <div v-for="item in items" :key="item.key" class="min-w-0" :class="item.spanClass">
      <div class="mb-3 flex h-5 min-w-0 items-center">
        <span
          v-if="item.typeLabel"
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

      <div
        v-if="item.group"
        class="relative grid gap-x-3 sm:gap-x-6"
        :style="{ gridTemplateColumns: `repeat(${item.cards.length}, minmax(0, 1fr))` }"
      >
        <div
          class="pointer-events-none absolute -inset-1 rounded-lg border-2 border-dashed border-sky-400/80 sm:-inset-1.5 dark:border-sky-500/60"
        />
        <!-- Caption on the box's bottom edge, clear of the type heading above -->
        <span
          class="absolute right-2 -bottom-3.5 z-10 flex cursor-help items-baseline gap-1.5 rounded bg-white px-1.5 font-mono text-xxs leading-4 whitespace-nowrap text-sky-700 sm:-bottom-4 dark:bg-nalika-bg dark:text-sky-400"
          :title="item.groupTitle"
        >
          <span class="font-semibold">≡ {{ item.groupPct }}%</span>
          <span v-if="item.groupLiftText" :class="item.groupLiftClass">
            {{ item.groupLiftText }}
          </span>
        </span>
        <ArchetypeCardThumb
          v-for="card in item.cards"
          :key="card.cardId"
          class="w-full"
          :card="card"
          :is-sig="sigIds.has(card.cardId)"
          :is-new="!removed && isNew(card.cardId)"
          :is-removed="removed"
          @zoom="emit('zoom', $event)"
        />
      </div>
      <ArchetypeCardThumb
        v-else
        class="w-full"
        :card="item.cards[0]"
        :lift="removed ? null : liftOf(item.cards[0])"
        :is-sig="sigIds.has(item.cards[0].cardId)"
        :is-new="!removed && isNew(item.cards[0].cardId)"
        :is-removed="removed"
        @zoom="emit('zoom', $event)"
      />
    </div>
  </div>
</template>

<script setup>
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
// Literal class names so Tailwind generates them
const SPAN = ['', '', 'col-span-2', 'col-span-3', 'col-span-4']

function groupEntry(g, members) {
  const lift = props.groupLiftOf(g)
  return {
    key: g.id,
    cards: members,
    group: g,
    spanClass: SPAN[Math.min(members.length, 4)],
    groupPct: sharePct(props.deckCount ? g.decks / props.deckCount : 0),
    groupLiftText: liftLabel(lift),
    groupLiftClass: liftTone(lift),
    groupTitle: [
      'Same card under different names (same effect and stats)',
      `In ${g.decks} decks in any version, ${g.wins} of them won`,
      liftNote(lift) || 'WR: win rate of decks running any version vs none',
    ].join('\n'),
  }
}

// Type order (unknown types last). A same-effect group sits where its first
// (most played) member would; the first entry of each type carries its label.
const items = computed(() => {
  const types = [...new Set([...Object.keys(TYPES), ...props.cards.map(c => c.type)])]
  return types.flatMap(type => {
    const ofType = props.cards.filter(c => c.type === type)
    const placed = new Set()
    const entries = []
    for (const card of ofType) {
      const g = !props.removed && card.effectGroup
      const members = g ? ofType.filter(c => c.effectGroup?.id === g.id) : []
      if (members.length < 2) {
        entries.push({ key: card.cardId, cards: [card] })
      } else if (!placed.has(g.id)) {
        placed.add(g.id)
        entries.push(groupEntry(g, members))
      }
    }
    return entries.map((e, i) => ({
      ...e,
      typeLabel: i === 0 ? (TYPES[type] ?? type) : '',
      typeCount: ofType.length,
    }))
  })
})
</script>
