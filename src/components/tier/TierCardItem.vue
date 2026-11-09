<template>
  <!-- A row inside its section's card (MobileTierCard): the stripe runs unbroken
       down a tier, so the tier pill is only shown when the rows mix tiers -->
  <div class="relative border-gray-500/10 not-first:border-t dark:border-white/[0.06]">
    <!-- A bar rather than a left border, so it runs over the divider above
         instead of mitring into it -->
    <span class="absolute -top-px bottom-0 left-0 w-1" :class="tierBarClass(row.tier)" />
    <!-- One line with the essentials: tap opens the analysis, the chevron shows
         the rest of the stats -->
    <div class="flex items-stretch">
      <button
        class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-3 pl-3.5 text-left transition-colors hover:bg-sky-50 active:bg-sky-50 dark:hover:bg-sky-400/10 dark:active:bg-sky-400/10"
        @click="$emit('detail', row)"
      >
        <span
          v-if="!hideTier"
          class="w-6 shrink-0 rounded py-0.5 text-center text-xxs font-bold"
          :class="tierPillClass(row.tier)"
        >
          {{ row.tier }}
        </span>
        <!-- Color combo on its own line, signature cards underneath, so the
             Japanese card names never wrap into the combo -->
        <div class="min-w-0 flex-1">
          <div
            v-if="headline"
            class="flex items-center gap-1 text-[13px] leading-snug font-semibold text-gray-800 dark:text-nalika-text"
          >
            <span v-if="!hideColor" class="inline-flex shrink-0 gap-0.5">
              <span
                v-for="dot in row.colorDots"
                :key="dot.name"
                class="inline-block h-2 w-2 rounded-full"
                :style="{ background: dot.hex }"
              />
            </span>
            <span class="truncate">{{ headline }}</span>
            <!-- leading-none: the colour-emoji font's taller metrics would otherwise
                 grow the line and push the row's text down -->
            <UiHint v-if="row.darkHorse" class="text-xs leading-none" :text="darkHorseHelp()">
              🐴
            </UiHint>
            <UiHint
              v-if="row.noLR"
              class="shrink-0 rounded bg-gray-100 px-1 text-xxs leading-tight font-medium whitespace-nowrap text-gray-600 dark:bg-white/10 dark:text-nalika-text-muted"
              :text="noLRHelp()"
            >
              {{ $t('tier.noLR') }}
            </UiHint>
          </div>
          <ArchetypeCardNames
            v-if="cardNames.length"
            class="leading-snug"
            :class="
              headline
                ? 'mt-0.5 text-xs text-gray-400 dark:text-gray-500'
                : 'text-[13px] text-gray-800 dark:text-nalika-text'
            "
            :cards="cardNames"
          >
            <UiHint
              v-if="!headline && row.darkHorse"
              class="ml-1 leading-none"
              :text="darkHorseHelp()"
            >
              🐴
            </UiHint>
            <UiHint
              v-if="!headline && row.noLR"
              class="ml-1 rounded bg-gray-100 px-1 text-xxs leading-tight font-medium whitespace-nowrap text-gray-600 dark:bg-white/10 dark:text-nalika-text-muted"
              :text="noLRHelp()"
            >
              {{ $t('tier.noLR') }}
            </UiHint>
          </ArchetypeCardNames>
        </div>
        <!-- Score on top, usage and rank change underneath. Kept no taller than
             the two-line name block, so every row's text starts at the same
             offset instead of only the wrapped (taller) ones sitting higher -->
        <div class="shrink-0 text-right">
          <div
            class="font-mono text-lg/5 font-bold text-aisumicha tabular-nums dark:text-nalika-text"
          >
            {{ row.score }}
          </div>
          <div class="flex items-baseline justify-end gap-1.5 font-mono text-xs tabular-nums">
            <span class="text-gray-500 dark:text-gray-400">{{ row.usePct }}</span>
            <TierMovement
              v-if="hasMovement"
              compact
              :move="row.move"
              :rank="row.rank"
              :tier="row.tier"
            />
          </div>
        </div>
      </button>
      <!-- Staples quick view: a tap opens DeckPopover's fullscreen overlay. At the
           end beside the chevron, since the row's start lines up with the
           section header. pl-2 evens the gaps to the glyphs: the score has no padding
           while the chevron is centred in its own column -->
      <UiDeckPopover
        class="flex shrink-0"
        :cards="row.staples ?? []"
        :label="$t('tier.staplesLabel', { pct: 85 })"
        :tags-of="card => ({ sig: row.sigCardIds?.includes(card.cardId) })"
      >
        <button
          class="flex w-9 cursor-pointer items-center justify-center pl-2 text-gray-400 active:text-ruri dark:text-gray-500 dark:active:text-sora"
          :aria-label="$t('tier.staplesPeek')"
        >
          <!-- Two overlapping cards, as on the desktop table -->
          <svg
            class="size-4.5"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <rect x="7" y="4" width="9" height="13" rx="1.5" />
            <path d="M4.5 6.5v8a2 2 0 0 0 2 2" stroke-linecap="round" />
          </svg>
        </button>
      </UiDeckPopover>
      <button
        class="flex w-8 shrink-0 cursor-pointer items-center justify-center text-gray-300 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-300"
        :aria-expanded="open"
        :aria-label="open ? $t('tier.hideStats') : $t('tier.showStats')"
        @click="open = !open"
      >
        <svg
          class="h-5 w-5 transition-transform"
          :class="open ? 'rotate-180' : ''"
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
      </button>
    </div>

    <div v-if="open" class="px-3 pt-1 pb-3">
      <dl class="grid grid-cols-4 gap-x-2">
        <div v-for="s in stats" :key="s.key">
          <dt
            class="text-xxs font-semibold tracking-widest text-gray-400 uppercase zh:text-xs zh:tracking-normal zh:text-gray-500"
          >
            {{ s.label }}
          </dt>
          <dd
            class="mt-px font-mono text-sm font-bold text-aisumicha tabular-nums dark:text-nalika-text-muted"
          >
            {{ s.value }}
          </dd>
        </div>
      </dl>
      <p v-if="shift" class="mt-2 text-xxs text-gray-500 dark:text-gray-400">
        <b
          :class="
            shift === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
          "
        >
          {{ shift === 'up' ? $t('tier.shiftUp') : $t('tier.shiftDown') }}
        </b>
        {{ $t('tier.shiftDetail', { tier: row.move.prevTier, rank: row.move.prevRank }) }}
      </p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  row: { type: Object, required: true },
  hideColor: { type: Boolean, default: false },
  hideTier: { type: Boolean, default: false },
  hasMovement: { type: Boolean, default: false },
})
defineEmits(['detail'])

const open = ref(false)

const { t } = useI18n()

const stats = computed(() =>
  [
    { key: 'decks', value: props.row.decks },
    { key: 'wins', value: props.row.wins },
    { key: 'winEv', value: props.row.winPerEv },
    { key: 'winDk', value: props.row.winPerDk },
  ].map(s => ({ ...s, label: t(`tier.col.${s.key}`) })),
)

// Grouped by color the section header already names the combo, so only the
// cards are shown (falling back to the combo when the archetype has no cards)
const nameParts = computed(() => archetypeNameParts(props.row.archetype, props.row.sigCards))

const headline = computed(() =>
  props.hideColor && nameParts.value.cards.length ? '' : comboName(nameParts.value.base),
)

const cardNames = computed(() => nameParts.value.cards)

const shift = computed(() => tierShift(props.row.move?.prevTier, props.row.tier))
</script>
