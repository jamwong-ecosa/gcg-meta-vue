<template>
  <tr
    class="group cursor-pointer border-t border-gray-500/10 text-aisumicha hover:bg-sky-50 dark:border-white/[0.06] dark:text-nalika-text-muted dark:hover:bg-sky-400/10"
    @click="$emit('detail', row)"
  >
    <td class="py-2 pr-4 pl-4">
      <div class="flex min-w-0 items-center gap-1.5">
        <!-- Staples quick view: the signature cards' faces lead the row (a deck-stack
             icon when there are none); hover them for the popover. A click stays on
             the page instead of opening the analysis -->
        <UiDeckPopover
          class="-ml-1.5 shrink-0"
          :cards="row.staples ?? []"
          :label="$t('tier.staplesLabel', { pct: 85 })"
          :tags-of="card => ({ sig: row.sigCardIds?.includes(card.cardId) })"
          @click.stop
        >
          <!-- Each face ringed in its card's colour, so the colour dots can go -->
          <span
            v-if="faces.length"
            class="mr-1 flex items-center pl-1.5"
            role="img"
            :aria-label="$t('tier.staplesPeek')"
          >
            <img
              v-for="f in faces"
              :key="f.id"
              :src="f.url"
              alt=""
              loading="lazy"
              class="-ml-1.5 size-7 rounded-full bg-gray-100 object-cover ring-2 transition-[filter] group-hover:brightness-110 first:ml-0 dark:bg-nalika-surface"
              :style="{ '--tw-ring-color': f.ring }"
            />
          </span>
          <span
            v-else
            class="flex size-6 items-center justify-center rounded text-gray-400 transition-colors group-hover:text-gray-500 hover:bg-ruri/10 hover:text-ruri! dark:text-gray-500 dark:group-hover:text-gray-400 dark:hover:bg-sora/15 dark:hover:text-sora!"
            role="img"
            :aria-label="$t('tier.staplesPeek')"
          >
            <UiIconDeckStack class="size-4" />
          </span>
        </UiDeckPopover>
        <div v-if="!hideColor && !faces.length" class="flex shrink-0 items-center gap-0.5">
          <div
            v-for="dot in row.colorDots"
            :key="dot.name"
            class="mr-px inline-block h-2 w-2 rounded-full"
            :style="{ background: dot.hex }"
          />
        </div>
        <!-- One line per archetype. Segments are flex items: the fixed text never
             shrinks, and card names start from an equal share (flex-1, capped at
             their own width), so a short name hands its leftover to the other and
             a long one never squeezes its partner below half -->
        <div class="flex min-w-0 items-baseline text-sumi dark:text-nalika-text">
          <template
            v-for="(seg, si) in buildLabelSegments(row.archetype, row.sigCards ?? [], {
              skipBaseCombo: hideColor || faces.length > 0,
            })"
            :key="si"
          >
            <span
              v-if="seg.color"
              class="max-w-max min-w-0 flex-1 truncate"
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
        <UiHint
          v-if="row.noLR"
          class="shrink-0 rounded bg-gray-100 px-1 text-xs whitespace-nowrap text-gray-600 dark:bg-white/10 dark:text-nalika-text-muted"
          :text="noLRHelp()"
        >
          {{ $t('tier.noLR') }}
        </UiHint>
      </div>
    </td>
    <td class="px-3 py-2 text-right">
      <UiStylePill :play-style="row.style" />
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
const faces = computed(() => sigCardFaces(props.row))
</script>
