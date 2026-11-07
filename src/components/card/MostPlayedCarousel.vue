<template>
  <!-- The series' most played cards as a rotating fan: the front card sits in the
       middle, its neighbours fan out to each side, and every few seconds the fan
       slides one card along (wrapping round). Pauses on hover or keyboard focus;
       side cards and the dots jump to a card -->
  <div
    class="relative flex flex-col items-center"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @focusin="focused = $event.target.matches(':focus-visible')"
    @focusout="focused = false"
  >
    <div
      class="pointer-events-none absolute inset-x-[10%] inset-y-[5%] rounded-full bg-ruri/15 blur-3xl dark:bg-sora/15"
      aria-hidden="true"
    />

    <div
      class="relative h-38 w-full overflow-x-clip sm:h-60 lg:h-56 xl:h-64"
      aria-roledescription="carousel"
    >
      <button
        v-for="slot in slots"
        :key="slot.card.cardId"
        type="button"
        class="absolute bottom-0 left-1/2 w-24 origin-bottom cursor-pointer transition-[transform,opacity] duration-700 ease-out sm:w-36 lg:w-32 xl:w-40"
        :class="slot.hidden && 'pointer-events-none'"
        :style="slot.style"
        :tabindex="slot.offset === 0 || slot.hidden ? -1 : 0"
        :aria-hidden="slot.offset !== 0"
        :aria-label="$t('card.carousel.show', { rank: slot.rank, name: slot.card.name })"
        @click="goTo(slot.index)"
      >
        <img
          :src="`https://jw-assets.imgix.net/gcg-img/${slot.card.cardId}.webp?w=320&auto=format,compress`"
          :alt="slot.card.name"
          class="aspect-[5/7] w-full rounded-lg object-cover shadow-xl ring-1 shadow-black/25 ring-black/10 dark:ring-white/10"
          loading="lazy"
        />
        <!-- On the side the neighbouring card doesn't cover -->
        <span
          class="absolute bottom-0 bg-black/75 px-1.5 font-mono text-xs leading-snug font-bold text-white sm:text-sm"
          :class="
            slot.offset > 0
              ? 'right-0 rounded-tl-md rounded-br-lg'
              : 'left-0 rounded-tr-md rounded-bl-lg'
          "
        >
          #{{ slot.rank }}
        </span>
      </button>
    </div>

    <!-- What the front card is, and where it ranks -->
    <div v-if="current" class="relative mt-5 w-full max-w-xs text-center" aria-live="polite">
      <p
        class="text-xxs font-semibold tracking-widest text-gray-400 uppercase dark:text-nalika-text-muted/70 zh:text-xs zh:tracking-normal zh:text-gray-500"
      >
        {{ $t('card.carousel.mostPlayed', { series: seriesLabel }) }}
      </p>
      <p class="mt-1 truncate text-sm font-bold text-sumi dark:text-nalika-text">
        <span class="font-mono text-gray-400 dark:text-gray-500">#{{ active + 1 }}</span>
        {{ current.name }}
      </p>
      <i18n-t
        keypath="card.carousel.inDecks"
        tag="p"
        scope="global"
        class="mt-0.5 text-xs text-gray-500 tabular-nums dark:text-nalika-text-muted"
      >
        <template #share>
          <b class="font-semibold text-gray-700 dark:text-nalika-text">{{ current.share }}</b>
        </template>
        <template #qty>{{ current.avgQty }}</template>
      </i18n-t>
      <div class="mt-3 flex justify-center gap-1.5">
        <button
          v-for="(c, i) in cards"
          :key="c.cardId"
          type="button"
          class="h-1.5 cursor-pointer rounded-full transition-all duration-300"
          :class="
            i === active
              ? 'w-5 bg-ruri dark:bg-sora'
              : 'w-1.5 bg-gray-300 hover:bg-gray-400 dark:bg-white/20 dark:hover:bg-white/40'
          "
          :aria-label="$t('card.carousel.show', { rank: i + 1, name: c.name })"
          :aria-current="i === active"
          @click="goTo(i)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useIntervalFn, useDocumentVisibility } from '@vueuse/core'

const props = defineProps({
  seriesKey: { type: String, required: true },
  seriesLabel: { type: String, default: '' },
  // Decks in the series, for each card's share
  totalDecks: { type: Number, default: 0 },
})

const INTERVAL_MS = 3200
// Cards drawn on each side of the front one; one more each side sits invisible so
// cards fade in and out at the ends instead of popping
const SIDE = 2

const raw = ref([])
const active = ref(0)
watch(
  () => props.seriesKey,
  async key => {
    raw.value = (await aggregateCards(key)).topPlayed ?? []
    active.value = 0
  },
  { immediate: true },
)

const cards = computed(() =>
  raw.value.map(c => ({
    ...c,
    share: props.totalDecks ? `${sharePct(c.totalDecksIncluded / props.totalDecks)}%` : '—',
  })),
)

const current = computed(() => cards.value[active.value])

// Each card's place relative to the front one, wrapped into -n/2..n/2, and its
// transform for that place: further out is lower, more turned and smaller
const slots = computed(() => {
  const n = cards.value.length
  return cards.value.map((card, index) => {
    let offset = (index - active.value + n) % n
    if (offset > n / 2) {
      offset -= n
    }
    const hidden = Math.abs(offset) > SIDE
    // Cards waiting off-stage sit just past the outermost visible one, so they
    // fade in and out there and never stretch the page sideways
    const place = hidden ? Math.sign(offset) * (SIDE + 1) : offset
    const d = Math.abs(place)
    const x = place * 52
    const y = d * d * 6
    const rotate = place * 7
    const scale = 1 - d * 0.1
    return {
      card,
      index,
      offset,
      hidden,
      rank: index + 1,
      style: {
        transform: `translateX(calc(-50% + ${x}%)) translateY(${y}px) rotate(${rotate}deg) scale(${scale})`,
        zIndex: 10 - d,
        opacity: hidden ? 0 : 1,
      },
    }
  })
})

function goTo(i) {
  active.value = i
  // Restart the timer so the picked card stays up for a full turn
  if (isActive.value) {
    pause()
    resume()
  }
}

const hovered = ref(false)
// Only keyboard focus pauses: a mouse click leaves focus on the button, which
// would otherwise keep the fan paused after the pointer has left
const focused = ref(false)
const visibility = useDocumentVisibility()
const { pause, resume, isActive } = useIntervalFn(
  () => {
    if (cards.value.length) {
      active.value = (active.value + 1) % cards.value.length
    }
  },
  INTERVAL_MS,
  { immediate: false },
)
watchEffect(() => {
  const run = !hovered.value && !focused.value && visibility.value === 'visible'
  if (run && !isActive.value) {
    resume()
  } else if (!run && isActive.value) {
    pause()
  }
})
</script>
