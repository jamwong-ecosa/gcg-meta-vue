<template>
  <div class="mx-auto max-w-340 px-4 py-16 md:px-8">
    <div class="flex justify-center">
      <div class="flex items-end gap-[-0.5rem]">
        <img
          v-for="(card, i) in heroCards"
          :key="card"
          :src="`https://jw-assets.imgix.net/gcg-img/${card}.webp?w=140&fit=crop&auto=format,compress`"
          alt=""
          class="h-24 w-16 rounded-lg object-cover shadow-lg sm:h-36 sm:w-24 md:h-44 md:w-28 lg:h-52 lg:w-32"
          :class="heroCardClasses[i]"
        />
      </div>
    </div>

    <div class="mt-10 text-center">
      <h1 class="font-mono text-3xl font-bold tracking-tight text-gray-800 dark:text-nalika-text">
        GCG Decks Analysis
      </h1>
      <p class="mt-3 text-sm text-gray-500 dark:text-nalika-text-muted">
        Tournament meta data for the Gundam Card Game
      </p>
      <p
        class="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-600 dark:text-nalika-text-muted"
      >
        We scrape tournament results from the official
        <a
          href="https://www.gundam-gcg.com/jp/events/tournament-results/"
          target="_blank"
          rel="noopener noreferrer"
          class="underline underline-offset-2 hover:text-ruri dark:hover:text-sora"
        >
          Gundam Card Game
        </a>
        events, then crunch the numbers to surface winning archetypes, key cards, and meta shifts.
        Pick a series to explore its tier list, dig into archetype breakdowns, or see which cards
        are shaping the meta.
      </p>
      <RouterLink
        :to="{ path: '/tier', query: { series: $route.query.series } }"
        class="mt-6 inline-block rounded-full bg-ruri px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-ruri/80 dark:bg-sora dark:hover:bg-sora/80"
      >
        View Tier List
      </RouterLink>
    </div>

    <div class="mt-12 grid gap-4 sm:grid-cols-3">
      <RouterLink
        v-for="feature in features"
        :key="feature.to"
        :to="{ path: feature.to, query: { series: $route.query.series } }"
        class="group rounded-lg border border-gray-500/10 bg-shironezumi/3 p-5 transition-colors hover:bg-shironezumi/7 dark:border-nalika-border dark:bg-nalika-surface dark:hover:bg-nalika-header"
      >
        <span
          class="inline-block h-2.5 w-2.5 rounded-full"
          :style="{ background: feature.color }"
        />
        <h2
          class="mt-3 font-mono text-sm font-bold text-gray-700 group-hover:text-ruri dark:text-nalika-text dark:group-hover:text-sora"
        >
          {{ feature.title }}
        </h2>
        <p class="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-nalika-text-muted">
          {{ feature.description }}
        </p>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
const heroCards = ['ST01-001', 'GD02-054', 'ST04-001', 'GD01-066', 'GD01-024']

const heroCardClasses = [
  tw`rotate-[-6deg] -mr-4 opacity-60`,
  tw`rotate-[-3deg] -mr-4 opacity-75`,
  tw`rotate-0 z-10 opacity-90`,
  tw`rotate-[3deg] -ml-4 opacity-75`,
  tw`rotate-[6deg] -ml-4 opacity-60`,
]

const features = [
  {
    title: 'Tier List',
    to: '/tier',
    color: '#e53e3e',
    description:
      'Archetype rankings sorted by tournament win rate, with inclusion rates and signature card breakdowns.',
  },
  {
    title: 'Analysis',
    to: '/archetype-analysis',
    color: '#2b6cb0',
    description:
      'Track how an archetype evolves across series, browse its card pool by type, compare stats with previous formats, and explore deck lists.',
  },
  {
    title: 'Meta Overview',
    to: '/meta',
    color: '#38a169',
    description:
      'Card-level statistics across the meta — usage trends, level/cost distributions, and top performers.',
  },
]
</script>
