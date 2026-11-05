<template>
  <div class="space-y-1.5 md:hidden">
    <template v-for="section in sections" :key="section.key">
      <button
        v-if="section.kind !== 'flat'"
        :ref="el => registerStuck(el, section.key)"
        class="sticky z-30 flex w-full cursor-pointer items-center gap-2 rounded border-l-4 border-transparent py-1.5 pl-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300"
        :class="
          stuckIds.has(section.key)
            ? 'bg-gray-200 dark:bg-nalika-surface'
            : 'bg-gray-300/40 dark:bg-white/15'
        "
        :style="{ top: groupTop }"
        :aria-expanded="!collapsed.has(section.key)"
        @click="$emit('toggleSection', section.key)"
      >
        <!-- Same columns as TierCardItem: the transparent left border and pl-2.5
             match the card's tier stripe, so the pill/dots sit over the cards'
             tier pills, the label over the names, the totals end where the scores
             end and the arrow sits in the chevron column -->
        <span
          v-if="section.kind === 'tier'"
          class="w-6 shrink-0 rounded py-0.5 text-center text-xxs font-bold"
          :class="tierPillClass(section.tier)"
        >
          {{ section.tier }}
        </span>
        <span v-else class="flex w-6 shrink-0 items-center justify-center gap-0.5">
          <span
            v-for="dot in section.colorDots"
            :key="dot.name"
            class="inline-block h-2 w-2 rounded-full"
            :style="{ background: dot.hex }"
          />
        </span>
        <span v-if="section.kind !== 'tier'">{{ section.label }}</span>
        <span class="font-normal text-gray-500 dark:text-gray-400">
          ({{ section.rows.length }})
        </span>
        <span class="ml-auto font-mono font-normal tabular-nums">
          {{
            $t('tier.sectionTotals', {
              decks: $n(section.decks),
              wins: $n(section.wins),
            })
          }}
        </span>
        <span
          class="ml-2 flex w-10 shrink-0 justify-center text-gray-500 dark:text-gray-400"
          aria-hidden="true"
        >
          <svg
            class="size-4 transition-transform"
            :class="collapsed.has(section.key) && '-rotate-90'"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
              clip-rule="evenodd"
            />
          </svg>
        </span>
      </button>
      <template v-if="!collapsed.has(section.key)">
        <TierCardItem
          v-for="row in section.rows"
          :key="row.archetype"
          :row="row"
          :hide-color="section.kind === 'color'"
          :has-movement="hasMovement"
          @detail="$emit('detail', $event)"
        />
      </template>
    </template>

    <p
      v-if="!sections.length && !zeroRows.length"
      class="py-8 text-center text-sm text-gray-400 dark:text-gray-500"
    >
      {{ $t('tier.noMatch') }}
    </p>

    <button
      v-if="zeroRows.length"
      class="w-full cursor-pointer py-2 text-center text-xs font-medium text-ruri"
      @click="$emit('toggleZeroWins')"
    >
      {{ $t('tier.zeroWins', { n: zeroRows.length, sign: showZeroWins ? '−' : '+' }) }}
    </button>
    <template v-if="showZeroWins">
      <TierCardItem
        v-for="row in zeroRows"
        :key="row.archetype"
        :row="row"
        :has-movement="hasMovement"
        @detail="$emit('detail', $event)"
      />
    </template>
  </div>
</template>

<script setup>
defineProps({
  sections: { type: Array, required: true },
  zeroRows: { type: Array, default: () => [] },
  showZeroWins: { type: Boolean, default: false },
  collapsed: { type: Set, required: true },
  hasMovement: { type: Boolean, default: false },
  groupTop: { type: String, default: 'var(--nav-h)' },
})
defineEmits(['detail', 'toggleZeroWins', 'toggleSection'])

const { stuckIds, register: registerStuck } = useStuck()
</script>
