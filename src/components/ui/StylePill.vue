<template>
  <!-- An archetype's play style (aggro, midrange, control, combo) as a small
       outlined pill, so it doesn't read as another tier badge -->
  <UiHint v-if="known && hint" :class="tone" :text="$t(`tier.styleHelp.${playStyle}`)">
    {{ $t(`tier.style.${playStyle}`) }}
  </UiHint>
  <span v-else-if="known" :class="tone">{{ $t(`tier.style.${playStyle}`) }}</span>
</template>

<script setup>
const props = defineProps({
  // 'aggro' | 'midrange' | 'control' | 'combo' (scripts/play-style.mjs); nothing
  // is drawn for data built before styles existed
  playStyle: { type: String, default: null },
  // Explain the style on hover or tap; off inside links and buttons, where a
  // tap already does something
  hint: { type: Boolean, default: true },
  // On card art (the home page tiles) rather than on the page background
  onArt: { type: Boolean, default: false },
})

// Chinese glyphs (Noto Sans TC) sit about 1px high in Roboto Mono's line box,
// so zh gets a 1px top pad to centre them; English is centred as is
const PILL = tw`shrink-0 rounded border px-1 text-xxs font-medium whitespace-nowrap zh:pt-px`

const TONES = {
  aggro: tw`border-rose-300 text-rose-700 dark:border-rose-400/40 dark:text-rose-300`,
  midrange: tw`border-teal-300 text-teal-700 dark:border-teal-400/40 dark:text-teal-300`,
  control: tw`border-indigo-300 text-indigo-700 dark:border-indigo-400/40 dark:text-indigo-300`,
  combo: tw`border-fuchsia-300 text-fuchsia-700 dark:border-fuchsia-400/40 dark:text-fuchsia-300`,
}
// On art it sits beside the tier badge, so it is built like one: bold, one
// line high, no border adding to its height (the ring is drawn inside). The
// caller gives it the badge's padding and text size
const ON_ART = tw`shrink-0 rounded bg-black/45 leading-none font-bold whitespace-nowrap text-white/90 ring-1 ring-white/30 ring-inset`

const known = computed(() => props.playStyle in TONES)
const tone = computed(() => (props.onArt ? ON_ART : [PILL, TONES[props.playStyle]]))
</script>
