<template>
  <!-- LR mix: each LR unit's decks split by copies (3–4 / 1–2 / none), so an LR
       some decks run as core shows up even when the name and its average copies
       don't carry it. Picking a row narrows the page to the decks running it at 3–4.
       Folded until asked for, with the non-signature LRs peeking -->
  <section class="mb-5">
    <div class="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
      <h4 class="flex flex-wrap items-baseline gap-x-2">
        <span
          class="text-sm font-bold tracking-wider text-gray-600 uppercase dark:text-nalika-text-muted zh:tracking-normal"
        >
          {{ $t('archetype.lrMix.title') }}
        </span>
        <span class="text-xs text-gray-500 dark:text-gray-400" :class="!open && tw`hidden`">
          {{ $t('archetype.lrMix.blurb') }}
        </span>
      </h4>
      <span class="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span
          class="flex items-center gap-3 text-xs text-gray-500 dark:text-nalika-text-muted"
          :class="!open && tw`hidden`"
          aria-hidden="true"
        >
          <span class="flex items-center gap-1.5">
            <span class="size-2.5 rounded-sm bg-ruri dark:bg-sora" />
            {{ $t('archetype.lrMix.heavy') }}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="size-2.5 rounded-sm bg-ruri/30 dark:bg-sora/35" />
            {{ $t('archetype.lrMix.light') }}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="size-2.5 rounded-sm bg-gray-500/15 dark:bg-white/[0.08]" />
            {{ $t('archetype.lrMix.none') }}
          </span>
        </span>
        <button
          class="flex cursor-pointer items-center gap-1 text-xs font-medium text-ruri dark:text-sora"
          :aria-expanded="open"
          :aria-controls="panelId"
          @click="open = !open"
        >
          {{ open ? $t('archetype.detail.keyHide') : $t('archetype.detail.keyShow') }}
          <svg
            class="size-3.5 transition-transform"
            :class="open && 'rotate-180'"
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
      </span>
    </div>

    <!-- Folded: the LRs beyond the signature cards with their 3–4 share -->
    <button
      v-if="!open"
      class="flex w-full cursor-pointer flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-gray-500/15 bg-gray-50 px-3 py-2 text-left dark:border-nalika-border dark:bg-white/[0.02]"
      :aria-controls="panelId"
      :aria-expanded="false"
      @click="open = true"
    >
      <span
        v-for="r in peek"
        :key="r.cardId"
        class="flex items-center gap-1.5 font-mono text-xs text-gray-600 tabular-nums dark:text-nalika-text-muted"
      >
        <img
          :src="cardFace(r.cardId, 64).url"
          :alt="r.name"
          loading="lazy"
          class="size-6 rounded object-cover"
        />
        <b class="text-gray-800 dark:text-nalika-text">{{ r.heavyPct }}%</b>
        {{ $t('archetype.lrMix.heavy') }}
      </span>
    </button>

    <div
      :id="panelId"
      :class="!open && tw`hidden`"
      class="divide-y divide-gray-500/15 overflow-hidden rounded-lg border border-gray-500/15 bg-gray-50 dark:divide-nalika-border dark:border-nalika-border dark:bg-white/[0.02]"
    >
      <button
        v-for="r in view"
        :key="r.cardId"
        class="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-3 py-2 text-left transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ruri sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_7.5rem] sm:px-4 dark:focus-visible:outline-sora"
        :class="[
          picked === r.cardId
            ? tw`bg-ruri/[0.07] shadow-[inset_3px_0_0] shadow-ruri dark:bg-sora/[0.1] dark:shadow-sora`
            : picked
              ? tw`opacity-55 hover:opacity-100`
              : '',
          r.heavy
            ? tw`cursor-pointer hover:bg-gray-500/[0.05] dark:hover:bg-white/[0.04]`
            : tw`cursor-default`,
        ]"
        :disabled="!r.heavy"
        :aria-pressed="picked === r.cardId"
        @click="emit('pick', picked === r.cardId ? null : r.cardId)"
      >
        <!-- Card: face, name, level; a note when decks run it over a signature card -->
        <span class="flex min-w-0 items-center gap-2">
          <img
            :src="cardFace(r.cardId, 64).url"
            alt=""
            loading="lazy"
            class="size-7 shrink-0 rounded object-cover"
          />
          <span class="flex min-w-0 flex-col">
            <span class="flex min-w-0 items-baseline gap-1.5 text-sm">
              <span
                v-if="r.sig"
                class="shrink-0 text-xs text-yellow-500"
                :title="$t('archetype.detail.sigHint')"
              >
                ★
              </span>
              <span
                class="truncate font-semibold text-gray-800 dark:text-nalika-text"
                :title="r.name"
              >
                {{ r.name }}
              </span>
              <span class="shrink-0 font-mono text-xs text-gray-400 dark:text-gray-500">
                Lv{{ r.level }}
              </span>
            </span>
            <span v-if="r.outCopies" class="text-xs text-amber-700 dark:text-amber-300">
              {{ $t('archetype.lrMix.outCopies', r.outCopies) }}
            </span>
          </span>
        </span>

        <!-- Decks by copies: 3–4, 1–2, none, each as wide as its share -->
        <span
          class="flex h-4 overflow-hidden rounded-sm bg-gray-500/15 font-mono text-[0.625rem] leading-4 tabular-nums max-sm:order-last max-sm:col-span-2 dark:bg-white/[0.08]"
          role="img"
          :aria-label="r.label"
        >
          <span
            class="overflow-hidden bg-ruri pl-1 font-bold whitespace-nowrap text-white dark:bg-sora dark:text-nalika-bg"
            :style="{ width: `${r.heavyPct}%` }"
          >
            {{ r.heavyPct >= 9 ? `${r.heavyPct}%` : '' }}
          </span>
          <span
            class="overflow-hidden bg-ruri/30 pl-1 whitespace-nowrap text-ruri dark:bg-sora/35 dark:text-sky-100"
            :style="{ width: `${r.lightPct}%` }"
          >
            {{ r.lightPct >= 9 ? `${r.lightPct}%` : '' }}
          </span>
        </span>

        <!-- 3–4 decks and how often they won -->
        <span class="flex flex-col items-end font-mono text-xs tabular-nums">
          <span class="text-gray-700 dark:text-nalika-text">
            <b class="font-bold">{{ r.heavy }}</b>
            {{ $t('archetype.lrMix.heavyDecks', r.heavy) }}
          </span>
          <span class="text-gray-500 dark:text-nalika-text-muted">
            {{
              r.heavyWinRate === null ? '–' : $t('archetype.lrMix.winRate', { pct: r.heavyWinRate })
            }}
          </span>
        </span>
      </button>
    </div>

    <!-- The pick: what the page now shows, and the way back -->
    <div
      v-if="pickedRow"
      class="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs text-gray-600 dark:text-nalika-text-muted"
    >
      <span>
        {{
          $t(
            'archetype.lrMix.showing',
            { n: pickedRow.heavy, name: pickedRow.name },
            pickedRow.heavy,
          )
        }}
      </span>
      <button
        class="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1 font-semibold text-gray-600 ring-1 ring-gray-500/20 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-ruri dark:bg-nalika-surface dark:text-nalika-text dark:ring-nalika-border dark:hover:bg-white/[0.06] dark:focus-visible:outline-sora"
        @click="emit('pick', null)"
      >
        {{ $t('archetype.lrMix.showAll') }}
        <span class="font-mono font-normal tabular-nums opacity-70">{{ deckCount }}</span>
      </button>
    </div>
  </section>
</template>

<script setup>
const { t } = useI18n()

const props = defineProps({
  // lrMix() rows, worked out over the decks of the picked build
  rows: { type: Array, required: true },
  // Card id whose 3–4 decks the page shows, or null
  picked: { type: String, default: null },
  // Decks the rows are worked out over
  deckCount: { type: Number, required: true },
})
const emit = defineEmits(['pick'])

const pct = (part, total) => Math.round((part / (total || 1)) * 100)

const view = computed(() =>
  props.rows.map(r => {
    const total = r.heavy + r.light + r.none
    return {
      ...r,
      heavyPct: pct(r.heavy, total),
      lightPct: pct(r.light, total),
      heavyWinRate: r.heavy >= LR_MIN_WR_DECKS ? ((r.heavyWins / r.heavy) * 100).toFixed(1) : null,
      label: t('archetype.lrMix.barLabel', { heavy: r.heavy, light: r.light, none: r.none }),
    }
  }),
)

// Folded until asked for
const open = ref(false)
const panelId = useId()
// What the folded strip shows: the non-signature LRs, most 3–4 decks first
const peek = computed(() => view.value.filter(r => !r.sig).slice(0, 4))

const pickedRow = computed(() => view.value.find(r => r.cardId === props.picked) ?? null)
</script>
