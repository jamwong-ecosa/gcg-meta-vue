<template>
  <div class="mx-auto max-w-340 px-4 py-10 md:px-8 md:py-16">
    <!-- Hero -->
    <section class="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
      <div class="max-md:order-2 max-md:text-center">
        <p
          class="text-xs font-semibold tracking-widest text-gray-400 uppercase dark:text-nalika-text-muted/70"
        >
          Gundam Card Game · Tournament meta
        </p>
        <h1
          class="mt-2 text-3xl font-bold tracking-tight text-sumi md:text-4xl dark:text-nalika-text"
        >
          GCG Decks Analysis
        </h1>
        <p
          class="mt-3 max-w-lg text-sm leading-relaxed text-gray-600 max-md:mx-auto dark:text-nalika-text-muted"
        >
          Which decks are winning right now, which cards they run, and how the meta shifts from one
          series to the next — built from official tournament results.
        </p>

        <div class="mt-6 flex flex-wrap gap-3 max-md:justify-center">
          <RouterLink
            :to="{ name: 'tier', query: seriesQuery }"
            class="rounded-full bg-ruri px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-ruri/85 dark:bg-sora dark:text-nalika-bg dark:hover:bg-sora/85"
          >
            View tier list
          </RouterLink>
          <RouterLink
            :to="{ name: 'meta', query: seriesQuery }"
            class="rounded-full bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-nalika-surface dark:text-nalika-text dark:hover:bg-nalika-header"
          >
            Meta overview
          </RouterLink>
        </div>

        <!-- Phone: a centred 2×2 panel under the centred hero; desktop: one plain row -->
        <dl
          class="mt-8 grid grid-cols-2 max-md:mx-auto max-md:max-w-sm max-md:rounded-lg max-md:border max-md:border-gray-500/10 max-md:bg-shironezumi/5 md:grid-cols-4 md:gap-x-6 dark:max-md:border-nalika-border dark:max-md:bg-nalika-surface"
        >
          <div
            v-for="s in totals"
            :key="s.label"
            class="border-gray-500/10 max-md:px-3 max-md:py-2.5 max-md:odd:border-r dark:border-nalika-border max-md:[&:nth-child(-n+2)]:border-b"
          >
            <dt
              class="text-xxs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500"
            >
              {{ s.label }}
            </dt>
            <dd class="mt-0.5 text-lg font-bold text-gray-700 tabular-nums dark:text-nalika-text">
              {{ s.value }}
            </dd>
          </div>
        </dl>
      </div>

      <div class="flex justify-center max-md:order-1">
        <div class="flex items-end">
          <img
            v-for="(card, i) in heroCards"
            :key="card"
            :src="`https://jw-assets.imgix.net/gcg-img/${card}.webp?w=280&fit=crop&auto=format,compress`"
            alt=""
            class="h-28 w-20 rounded-lg object-cover shadow-lg sm:h-40 sm:w-28 lg:h-48 lg:w-32"
            :class="heroCardClasses[i]"
          />
        </div>
      </div>
    </section>

    <!-- Current meta -->
    <section v-if="featured" class="mt-14 md:mt-20">
      <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 class="text-xl font-bold text-sumi md:text-2xl dark:text-nalika-text">
            Current meta
          </h2>
          <p
            class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400"
          >
            <span
              class="rounded-full bg-ruri/10 px-2.5 py-0.5 text-sm font-semibold text-ruri dark:bg-sora/15 dark:text-sora"
            >
              {{ featured.label }}
            </span>
            <span class="tabular-nums">
              {{ featured.events.toLocaleString() }} events · {{ featured.eventMinDate }} →
              {{ featured.eventMaxDate }}
            </span>
          </p>
        </div>
        <RouterLink
          :to="{ name: 'tier', query: { series: featured.value } }"
          class="rounded-full border border-gray-500/20 px-3.5 py-1.5 text-xs font-medium text-ruri transition-colors hover:border-ruri/60 dark:border-nalika-border dark:text-sora dark:hover:border-sora/60"
        >
          Full tier list →
        </RouterLink>
      </div>

      <RouterLink
        v-if="inProgress"
        :to="{ name: 'tier', query: { series: inProgress.value } }"
        class="group mt-4 block rounded bg-amber-50 px-3 py-2 text-xs text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200/80 dark:hover:bg-amber-900/45"
      >
        In progress:
        <b>{{ inProgress.label }}</b>
        — {{ inProgress.events }} events so far, tiers are preliminary.
        <span class="font-medium underline underline-offset-2">See early tiers</span>
      </RouterLink>

      <div class="mt-4 grid gap-3 md:grid-cols-3 md:gap-4">
        <RouterLink
          v-for="row in topRows"
          :key="row.archetype"
          :to="row.to"
          class="group flex h-28 overflow-hidden rounded-lg border border-gray-500/15 bg-white transition-colors hover:border-ruri/60 md:h-auto md:flex-col dark:border-nalika-border dark:bg-nalika-surface dark:hover:border-sora/60"
        >
          <div class="w-28 shrink-0 bg-gray-100 md:aspect-[2/1] md:w-auto dark:bg-nalika-bg">
            <img
              v-if="row.imageCardId"
              :src="`https://jw-assets.imgix.net/gcg-img/${row.imageCardId}.webp?fit=crop&ar=2:1&w=480&crop=focalpoint&fp-x=0.5&fp-y=0.38&auto=format,compress`"
              alt=""
              loading="lazy"
              class="h-full w-full object-cover"
            />
          </div>
          <div class="flex min-w-0 flex-1 flex-col justify-center p-3 md:justify-start">
            <div class="flex items-center gap-1.5 text-xxs text-gray-500 dark:text-gray-400">
              <span class="rounded px-1.5 py-px text-xs font-bold" :class="tierPillClass(row.tier)">
                {{ row.tier }}
              </span>
              <span class="font-bold text-gray-700 tabular-nums dark:text-nalika-text">
                {{ row.score }}
              </span>
              <span class="ml-1 flex items-center gap-0.5">
                <span
                  v-for="dot in row.colorDots"
                  :key="dot.name"
                  class="h-2 w-2 rounded-full"
                  :style="{ background: dot.hex }"
                />
              </span>
              <span class="truncate">{{ row.colors }}</span>
            </div>
            <div
              class="mt-1.5 line-clamp-2 text-sm leading-snug font-bold text-sumi group-hover:underline dark:text-nalika-text"
            >
              <template v-for="(seg, si) in row.segments" :key="si">
                <span v-if="seg.color" :style="{ color: seg.color }">{{ seg.text }}</span>
                <span v-else>{{ seg.text }}</span>
              </template>
            </div>
            <div class="mt-1.5 text-xs text-gray-500 tabular-nums dark:text-gray-400">
              {{ row.wins }} wins · {{ row.usePct }} of placements
            </div>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- Explore -->
    <section class="mt-14 md:mt-20">
      <h2 class="text-xl font-bold text-sumi md:text-2xl dark:text-nalika-text">Explore</h2>
      <div class="mt-4 grid gap-3 sm:grid-cols-3">
        <RouterLink
          v-for="feature in features"
          :key="feature.to"
          :to="{ name: feature.to, query: seriesQuery }"
          class="group rounded-lg border border-gray-500/15 bg-shironezumi/4 p-4 transition-colors hover:border-ruri/60 dark:border-nalika-border dark:bg-nalika-surface dark:hover:border-sora/60"
        >
          <div class="flex items-center justify-between">
            <h3
              class="text-sm font-bold text-gray-700 group-hover:text-ruri dark:text-nalika-text dark:group-hover:text-sora"
            >
              {{ feature.title }}
            </h3>
            <span
              class="text-gray-400 transition-colors group-hover:text-ruri dark:group-hover:text-sora"
            >
              →
            </span>
          </div>
          <p class="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-nalika-text-muted">
            {{ feature.description }}
          </p>
        </RouterLink>
      </div>
    </section>

    <!-- About the data -->
    <p
      class="mt-14 border-t border-gray-500/10 pt-6 text-xs leading-relaxed text-gray-400 md:mt-20 dark:border-nalika-border dark:text-gray-500"
    >
      Results come from the official
      <!-- v-text keeps template whitespace out of the underlined link text -->
      <a
        href="https://www.gundam-gcg.com/jp/events/tournament-results/"
        target="_blank"
        rel="noopener noreferrer"
        class="underline underline-offset-2 hover:text-ruri dark:hover:text-sora"
        v-text="'Gundam Card Game tournament results'"
      />
      and
      <a
        href="https://d.bandai-tcg-plus.com/gcgja/tournament"
        target="_blank"
        rel="noopener noreferrer"
        class="underline underline-offset-2 hover:text-ruri dark:hover:text-sora"
        v-text="'Bandai TCG+'"
      />
      — both list each event's placed decks (top 8, or top 16 at larger events). Tiers rank
      archetypes by how often they place, nudged by how often those placements turn into wins.
    </p>
  </div>
</template>

<script setup>
import manifest from '$data/archetypes/index.json'

const { tierData, loadTierData } = useTierData()
await loadTierData()

// tierData is sorted newest first; feature the newest series with enough
// events for stable tiers, and flag a newer one that is still in progress
const latest = computed(() => tierData.value[0] ?? null)
const featured = computed(() => tierData.value.find(s => !s.preliminary) ?? latest.value)
const inProgress = computed(() => (latest.value !== featured.value ? latest.value : null))
const seriesQuery = computed(() => (featured.value ? { series: featured.value.value } : {}))

const totals = computed(() => {
  const series = tierData.value
  const lastDate = series
    .map(s => s.eventMaxDate)
    .filter(Boolean)
    .sort()
    .at(-1)
  return [
    { label: 'Series', value: series.length },
    { label: 'Events', value: series.reduce((n, s) => n + s.events, 0).toLocaleString() },
    { label: 'Placed decks', value: series.reduce((n, s) => n + s.totalDecks, 0).toLocaleString() },
    { label: 'Updated', value: lastDate ?? '—' },
  ]
})

const topRows = computed(() => {
  const s = featured.value
  if (!s) {
    return []
  }
  const archetypes = manifest.find(m => m.value === s.value)?.archetypes ?? []
  // Archetypes often share a signature card; show a different one where possible
  const usedImages = new Set()
  return s.rows.slice(0, 6).map(row => {
    const ids = row.sigCardIds ?? []
    const imageCardId = ids.find(id => !usedImages.has(id)) ?? ids[0]
    usedImages.add(imageCardId)
    const idx = archetypes.findIndex(
      a => normalizeArchetypeName(a.combo) === normalizeArchetypeName(row.archetype),
    )
    return {
      ...row,
      imageCardId,
      segments: buildLabelSegments(row.archetype, row.sigCards ?? [], { skipBaseCombo: true }),
      to:
        idx === -1
          ? { name: 'tier', query: { series: s.value } }
          : { name: 'archetype-analysis', query: { series: s.value, arch: String(idx) } },
    }
  })
})

// Fanned hero cards: signature cards of the featured series' top decks
const heroCards = computed(() => {
  const ids = topRows.value
    .map(r => r.imageCardId)
    .filter(Boolean)
    .slice(0, 5)
  // Put the top deck's card in the middle of the fan
  return ids.length === 5 ? [ids[3], ids[1], ids[0], ids[2], ids[4]] : ids
})

const heroCardClasses = [
  tw`-mr-6 rotate-[-8deg] opacity-70`,
  tw`-mr-6 rotate-[-4deg] opacity-85`,
  tw`z-10 -translate-y-2 rotate-0`,
  tw`-ml-6 rotate-[4deg] opacity-85`,
  tw`-ml-6 rotate-[8deg] opacity-70`,
]

const features = [
  {
    title: 'Tier List',
    to: 'tier',
    description:
      'Every archetype ranked S to D by how often it places and converts placements into wins.',
  },
  {
    title: 'Analysis',
    to: 'archetype-analysis',
    description:
      'One archetype in depth: its record across series, card choices, and the deck lists behind it.',
  },
  {
    title: 'Meta Overview',
    to: 'meta',
    description:
      'Card usage, color and level/cost distributions, and how this series compares to the last.',
  },
]
</script>
