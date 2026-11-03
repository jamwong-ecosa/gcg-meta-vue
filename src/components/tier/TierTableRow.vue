<template>
  <tr
    class="group cursor-pointer text-aisumicha odd:bg-gray-100/15 even:bg-gray-100/45 hover:bg-gray-200/50 dark:text-nalika-text-muted dark:odd:bg-gray-100/10 dark:even:bg-white/3 dark:hover:bg-white/15"
    @click="$emit('detail', row)"
  >
    <td class="py-2 pr-4 pl-4">
      <div class="flex min-w-0 items-baseline gap-1.5">
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
        <span
          v-if="row.darkHorse"
          class="shrink-0 cursor-help rounded bg-amber-100 px-1 text-xs dark:bg-amber-900/40"
          :title="DARK_HORSE_HELP"
        >
          🐴
        </span>
      </div>
    </td>
    <td class="px-3 py-2 text-right font-mono tabular-nums">{{ row.decks }}</td>
    <td class="px-3 py-2 text-right font-mono tabular-nums">{{ row.wins }}</td>
    <td class="px-3 py-2 text-right font-mono tabular-nums">{{ row.top4 }}</td>
    <td class="px-3 py-2 text-right font-mono tabular-nums">{{ row.usePct }}</td>
    <td class="px-3 py-2 text-right font-mono tabular-nums">{{ row.winPerEv }}</td>
    <td class="px-3 py-2 text-right font-mono tabular-nums">{{ row.winPerDk }}</td>
    <td
      class="px-3 py-2 text-right font-mono font-semibold text-sumi tabular-nums dark:text-nalika-text"
    >
      {{ row.score }}
    </td>
    <td class="px-3 py-2">
      <div class="flex items-center justify-end gap-1">
        <span
          v-if="tierChanged"
          class="font-mono text-xxs text-gray-400 dark:text-gray-500"
          :title="`Was ${row.move.prevTier} tier last series`"
        >
          {{ row.move.prevTier }}→
        </span>
        <span
          class="w-10 rounded px-1.5 py-0.5 text-center text-xs font-bold"
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

const tierChanged = computed(
  () => props.row.move?.prevTier && props.row.move.prevTier !== props.row.tier,
)
</script>
