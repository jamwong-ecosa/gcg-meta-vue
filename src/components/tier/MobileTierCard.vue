<template>
  <!-- pt-0.5: room for the first box's outline (a ring, drawn outside the box),
       which the opaque sticky filter bar above would otherwise cover -->
  <div class="space-y-1.5 pt-0.5 md:hidden">
    <!-- Says once what the numbers on the right of every row are, instead of
         labelling each row; pr-3 puts it over the scores -->
    <p
      v-if="sections.length"
      class="pr-3 text-right font-mono text-xxs text-gray-400 tabular-nums dark:text-gray-500"
    >
      <span class="font-semibold">{{ $t('tier.col.score') }}</span>
      ·
      {{ $t('tier.col.use') }}
    </p>
    <!-- Header and rows share one box; the header sticks only while its own
         section is in view (overflow-clip, unlike overflow-hidden, keeps sticky working) -->
    <div v-for="section in sections" :key="section.key" :class="GROUP_CLASS">
      <button
        v-if="section.kind !== 'flat'"
        class="sticky z-30 flex w-full cursor-pointer items-center gap-2 py-1.5 pr-3 pl-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300"
        :class="section.kind === 'tier' ? tierBandClass(section.tier) : COLOR_BAND_BASE"
        :style="{
          top: groupTop,
          ...(section.kind === 'tier' ? {} : colorBandStyle(section.colorDots)),
        }"
        :aria-expanded="!collapsed.has(section.key)"
        @click="$emit('toggleSection', section.key)"
      >
        <!-- Same columns as TierCardItem: the arrow sits over the rows' staples
             icons, the pill/dots over the start of their text, and the totals
             end where the scores end (pr-3) -->
        <svg
          class="size-4 shrink-0 text-gray-500 transition-transform dark:text-gray-400"
          :class="collapsed.has(section.key) && '-rotate-90'"
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
          {{ $t('tier.sectionCount', section.rows.length) }}
        </span>
        <span class="ml-auto font-mono font-normal tabular-nums">
          {{
            $t('tier.sectionTotals', {
              decks: $n(section.decks),
              wins: $n(section.wins),
            })
          }}
        </span>
      </button>
      <template v-if="!collapsed.has(section.key)">
        <TierCardItem
          v-for="row in section.rows"
          :key="row.archetype"
          :row="row"
          :hide-color="section.kind === 'color'"
          :hide-tier="section.kind === 'tier'"
          :has-movement="hasMovement"
          @detail="$emit('detail', $event)"
        />
      </template>
    </div>

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
    <div v-if="showZeroWins" :class="GROUP_CLASS">
      <TierCardItem
        v-for="row in zeroRows"
        :key="row.archetype"
        :row="row"
        :has-movement="hasMovement"
        @detail="$emit('detail', $event)"
      />
    </div>
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

// One card per section, rows split by hairlines rather than each in its own box
const GROUP_CLASS = tw`overflow-clip rounded bg-white ring-1 ring-gray-500/10 not-dark:shadow-xs not-dark:shadow-gray-400/10 dark:bg-nalika-surface dark:ring-white/[0.06]`
</script>
