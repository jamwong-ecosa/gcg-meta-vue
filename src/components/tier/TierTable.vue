<template>
  <div
    class="hidden rounded-lg bg-white not-dark:shadow-xs not-dark:shadow-gray-400/15 md:block dark:bg-nalika-surface"
  >
    <table class="w-full table-fixed text-left text-sm">
      <colgroup>
        <col class="w-auto" />
        <col v-for="c in numericCols" :key="c.key" class="w-18" />
        <col class="w-28" />
        <col v-if="hasMovement" class="w-14" />
        <col class="w-8" />
      </colgroup>
      <thead class="sticky top-(--nav-h) z-1">
        <tr class="bg-ruri text-stone-100 dark:bg-nalika-header dark:text-nalika-text">
          <th
            v-for="(c, i) in headerCols"
            :key="c.key"
            class="py-2 font-semibold"
            :class="i === 0 ? 'rounded-tl-lg pr-4 pl-4' : 'px-3'"
            :aria-sort="ariaSort(c.key)"
          >
            <!-- Numeric headers end flush with the numbers below: the sort arrow hangs
                 into the cell padding, and a label wider than the cell overflows leftward -->
            <div :class="i === 0 ? '' : 'flex justify-end'">
              <UiHint :text="tierColumnHelp(c.key)">
                <button
                  class="relative inline-flex cursor-pointer items-center whitespace-nowrap hover:text-white"
                  @click="$emit('sort', sortFieldOf(c.key))"
                >
                  {{ c.label }}
                  <span class="absolute left-full ml-0.5 w-2 text-xxs opacity-80">
                    {{ sortIndicator(c.key) }}
                  </span>
                </button>
              </UiHint>
            </div>
          </th>
          <th class="rounded-tr-lg px-1 py-2" />
        </tr>
      </thead>

      <tbody v-for="section in sections" :key="section.key">
        <tr
          v-if="section.kind !== 'flat'"
          class="cursor-pointer bg-gray-300/30 text-xs font-semibold text-gray-700 hover:bg-gray-300/50 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"
          @click="$emit('toggleSection', section.key)"
        >
          <td :colspan="colCount" class="px-4 py-1.5">
            <div class="flex items-center gap-2">
              <span
                class="inline-block w-3 text-center transition-transform"
                :class="collapsed.has(section.key) ? '' : 'rotate-90'"
              >
                ▸
              </span>
              <span
                v-if="section.kind === 'tier'"
                class="w-10 rounded px-1.5 py-0.5 text-center font-bold"
                :class="tierPillClass(section.tier)"
              >
                {{ section.tier }}
              </span>
              <span v-else class="flex items-center gap-0.5">
                <span
                  v-for="dot in section.colorDots"
                  :key="dot.name"
                  class="inline-block h-2.5 w-2.5 rounded-full"
                  :style="{ background: dot.hex }"
                />
                <span class="ml-1.5">{{ section.label }}</span>
              </span>
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
            </div>
          </td>
        </tr>
        <template v-if="!collapsed.has(section.key)">
          <TierTableRow
            v-for="row in section.rows"
            :key="row.archetype"
            v-memo="[row, hasMovement, locale]"
            :row="row"
            :hide-color="section.kind === 'color'"
            :has-movement="hasMovement"
            @detail="$emit('detail', $event)"
          />
        </template>
      </tbody>

      <tbody v-if="zeroRows.length">
        <tr
          class="cursor-pointer text-center text-xs font-medium text-ruri hover:bg-gray-100/50 dark:hover:bg-white/10"
          @click="$emit('toggleZeroWins')"
        >
          <td :colspan="colCount" class="px-4 py-3">
            {{ $t('tier.zeroWins', { n: zeroRows.length, sign: showZeroWins ? '−' : '+' }) }}
          </td>
        </tr>
        <template v-if="showZeroWins">
          <TierTableRow
            v-for="row in zeroRows"
            :key="row.archetype"
            v-memo="[row, hasMovement, locale]"
            :row="row"
            :has-movement="hasMovement"
            @detail="$emit('detail', $event)"
          />
        </template>
      </tbody>

      <tbody v-if="!sections.length && !zeroRows.length">
        <tr>
          <td :colspan="colCount" class="px-4 py-8 text-center text-sm text-gray-400">
            {{ $t('tier.noMatch') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  sections: { type: Array, required: true },
  zeroRows: { type: Array, default: () => [] },
  showZeroWins: { type: Boolean, default: false },
  collapsed: { type: Set, required: true },
  sortKey: { type: String, required: true },
  sortDir: { type: String, required: true },
  hasMovement: { type: Boolean, default: false },
})
defineEmits(['detail', 'toggleZeroWins', 'toggleSection', 'sort'])

const { t, locale } = useI18n()

const numericCols = ['decks', 'wins', 'top4', 'use', 'winEv', 'winDk', 'score'].map(key => ({
  key,
}))

// The Archetype and Tier headers both sort by tier order
const headerCols = computed(() => [
  { key: 'rank', label: t('tier.col.archetype') },
  ...numericCols.map(c => ({ ...c, label: t(`tier.col.${c.key}`) })),
  { key: 'tier', label: t('tier.col.rank') },
  ...(props.hasMovement ? [{ key: 'move', label: 'Δ' }] : []),
])

const colCount = computed(() => headerCols.value.length + 1)

function sortFieldOf(key) {
  return key === 'tier' ? 'rank' : key
}

// Arrows only once the order differs from the default tier order; the
// Archetype header shares the tier sort, so its arrow shows on Tier only
function sortIndicator(key) {
  const isDefault = props.sortKey === 'rank' && props.sortDir === 'asc'
  if (key === 'rank' || isDefault || sortFieldOf(key) !== props.sortKey) {
    return ''
  }
  return props.sortDir === 'asc' ? '↑' : '↓'
}

function ariaSort(key) {
  if (sortFieldOf(key) !== props.sortKey) {
    return 'none'
  }
  return props.sortDir === 'asc' ? 'ascending' : 'descending'
}
</script>
