<template>
  <tr
    class="group cursor-pointer border-t border-gray-500/10 text-aisumicha hover:bg-sky-50 dark:border-white/[0.06] dark:text-nalika-text-muted dark:hover:bg-sky-400/10"
    @click="$emit('detail', row)"
  >
    <td class="py-2 pr-4 pl-4">
      <div class="flex min-w-0 items-baseline gap-1.5">
        <!-- Staples quick view: a card-stack icon leading the row, in line with the
             section headers' arrows; hover it for the popover. A click stays on
             the page instead of opening the analysis -->
        <UiDeckPopover
          class="-my-1 -ml-1.5 shrink-0 self-center"
          :cards="row.staples ?? []"
          :label="$t('tier.staplesLabel', { pct: 85 })"
          :tags-of="card => ({ sig: row.sigCardIds?.includes(card.cardId) })"
          @click.stop
        >
          <span
            class="flex size-6 items-center justify-center rounded text-gray-400 transition-colors group-hover:text-gray-500 hover:bg-ruri/10 hover:text-ruri! dark:text-gray-500 dark:group-hover:text-gray-400 dark:hover:bg-sora/15 dark:hover:text-sora!"
            role="img"
            :aria-label="$t('tier.staplesPeek')"
          >
            <!-- Two overlapping cards -->
            <svg
              class="size-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <rect x="7" y="4" width="9" height="13" rx="1.5" />
              <path d="M4.5 6.5v8a2 2 0 0 0 2 2" stroke-linecap="round" />
            </svg>
          </span>
        </UiDeckPopover>
        <div v-if="!hideColor" class="flex shrink-0 items-center gap-0.5">
          <div
            v-for="dot in row.colorDots"
            :key="dot.name"
            class="mr-px inline-block h-2 w-2 rounded-full"
            :style="{ background: dot.hex }"
          />
        </div>
        <!-- One line per archetype. Segments are flex items: the fixed text never
             shrinks, and only card names give up width (in proportion to their
             length) and ellipsize, so two long names still both show. Hover for all -->
        <div
          class="flex min-w-0 items-baseline text-sumi dark:text-nalika-text"
          :title="row.archetype"
        >
          <template
            v-for="(seg, si) in buildLabelSegments(row.archetype, row.sigCards ?? [], {
              skipBaseCombo: hideColor,
            })"
            :key="si"
          >
            <span
              v-if="seg.color"
              class="min-w-0 truncate"
              :style="{ color: seg.color }"
              v-text="seg.text"
            />
            <span v-else class="shrink-0 whitespace-pre" v-text="seg.text" />
          </template>
        </div>
        <UiHint
          v-if="row.darkHorse"
          class="shrink-0 rounded bg-amber-100 px-1 text-xs dark:bg-amber-900/40"
          :text="darkHorseHelp()"
        >
          🐴
        </UiHint>
      </div>
    </td>
    <td class="px-3 py-2 text-right font-mono tabular-nums">{{ row.decks }}</td>
    <td class="px-3 py-2 text-right font-mono tabular-nums">{{ row.wins }}</td>
    <td class="px-3 py-2 text-right font-mono tabular-nums">{{ row.usePct }}</td>
    <td class="px-3 py-2 text-right font-mono tabular-nums">{{ row.winPerEv }}</td>
    <td class="px-3 py-2 text-right font-mono tabular-nums">{{ row.winPerDk }}</td>
    <td
      class="px-3 py-2 text-right font-mono font-semibold text-sumi tabular-nums dark:text-nalika-text"
    >
      {{ row.score }}
    </td>
    <td class="px-3 py-2">
      <!-- A tier change reads "B → A": last series' tier as a faded mini pill, an arrow
           green for a promotion / red for a drop, then this series' pill -->
      <div class="flex items-center justify-end gap-1 whitespace-nowrap">
        <span
          v-if="shift"
          class="flex shrink-0 items-center gap-0.5"
          :title="
            $t(shift === 'up' ? 'tier.shiftTitleUp' : 'tier.shiftTitleDown', {
              tier: row.move.prevTier,
            })
          "
        >
          <span
            class="rounded px-1 py-px text-xxs leading-none font-bold opacity-55"
            :class="tierPillClass(row.move.prevTier)"
          >
            {{ row.move.prevTier }}
          </span>
          <span
            class="text-xs leading-none font-bold"
            :class="
              shift === 'up'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-500 dark:text-red-400'
            "
            aria-hidden="true"
          >
            →
          </span>
        </span>
        <span
          class="w-10 shrink-0 rounded px-1.5 py-0.5 text-center text-xs font-bold"
          :class="tierPillClass(row.tier)"
        >
          {{ row.tier }}
        </span>
      </div>
    </td>
    <td v-if="hasMovement" class="px-3 py-2 text-right">
      <TierMovement :move="row.move" :rank="row.rank" :tier="row.tier" />
    </td>
    <td
      class="px-1 py-2 text-center text-xxs text-gray-400 group-hover:text-sora dark:text-gray-500"
    >
      ▶
    </td>
  </tr>
</template>

<script setup>
const props = defineProps({
  row: { type: Object, required: true },
  hideColor: { type: Boolean, default: false },
  hasMovement: { type: Boolean, default: false },
})
defineEmits(['detail'])

const shift = computed(() => tierShift(props.row.move?.prevTier, props.row.tier))
</script>
