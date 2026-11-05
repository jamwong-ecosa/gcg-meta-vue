<template>
  <div class="mx-auto max-w-340 px-4 py-10 md:px-8 md:py-16">
    <!-- Hero -->
    <section class="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
      <div class="max-lg:order-2 max-lg:text-center">
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
          class="mt-3 max-w-lg text-sm leading-relaxed text-gray-600 max-lg:mx-auto dark:text-nalika-text-muted"
        >
          Which decks are winning right now, which cards they run, and how the meta shifts from one
          series to the next — built from official tournament results.
        </p>

        <div class="mt-6 flex flex-wrap gap-3 max-lg:justify-center">
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

        <!-- One panel at every size: the three counts, biggest first, split by hairlines;
             how fresh the data is sits underneath as a quiet status line -->
        <div
          class="mt-8 max-w-lg overflow-hidden rounded-lg border border-gray-500/15 bg-white/70 shadow-sm shadow-black/[0.03] backdrop-blur-sm max-lg:mx-auto dark:border-nalika-border dark:bg-nalika-surface/80"
        >
          <dl class="grid grid-cols-3 divide-x divide-gray-500/10 dark:divide-nalika-border">
            <div
              v-for="s in totals"
              :key="s.label"
              class="flex flex-col-reverse gap-1 px-3 py-4 sm:px-5"
            >
              <dt class="text-xs text-gray-500 dark:text-nalika-text-muted">
                {{ s.label }}
              </dt>
              <dd
                class="text-xl font-bold tracking-tight text-sumi tabular-nums sm:text-2xl dark:text-nalika-text"
              >
                {{ s.value }}
              </dd>
            </div>
          </dl>
          <p
            v-if="updated"
            class="flex items-center gap-2 border-t border-gray-500/10 bg-gray-50/80 px-3 py-2 text-xs text-gray-500 max-lg:justify-center sm:px-5 dark:border-nalika-border dark:bg-nalika-bg/40 dark:text-nalika-text-muted"
          >
            <span
              class="h-1.5 w-1.5 shrink-0 rounded-full"
              :class="updated.fresh ? 'bg-emerald-500' : 'bg-gray-400'"
              aria-hidden="true"
            />
            <span>
              Results through
              <time
                :datetime="updated.date"
                class="font-medium text-gray-700 dark:text-nalika-text"
              >
                {{ updated.label }}
              </time>
              <span class="ml-1.5 text-gray-400 dark:text-gray-500">· {{ updated.ago }}</span>
            </span>
          </p>
        </div>
      </div>

      <!-- Signature cards of the top six decks fanned on an arc, #1 in front and
           centre; each opens its archetype, and lifts and straightens on hover -->
      <div class="relative flex justify-center max-lg:order-1">
        <div
          class="pointer-events-none absolute inset-x-[10%] inset-y-[5%] rounded-full bg-ruri/15 blur-3xl dark:bg-sora/15"
          aria-hidden="true"
        />
        <div class="relative flex items-end pt-4 pb-6">
          <RouterLink
            v-for="card in heroCards"
            :key="card.id"
            :to="card.to"
            :title="`#${card.rank} ${card.name}`"
            class="relative z-(--z) -mx-4 w-20 shrink-0 origin-bottom [transform:translateY(var(--y))_rotate(var(--r))] transition-transform duration-300 hover:z-30 hover:[transform:translateY(-14px)_rotate(0deg)_scale(1.06)] sm:-mx-5 sm:w-28 lg:-mx-4 lg:w-24 xl:-mx-6 xl:w-32"
            :style="{ '--r': card.rotate, '--y': card.lift, '--z': card.z }"
          >
            <img
              :src="`https://jw-assets.imgix.net/gcg-img/${card.id}.webp?w=320&auto=format,compress`"
              :alt="card.name"
              class="aspect-[5/7] w-full rounded-lg object-cover shadow-xl ring-1 shadow-black/25 ring-black/10 dark:ring-white/10"
            />
            <!-- On the side the neighbouring card doesn't cover -->
            <span
              class="absolute bottom-0 bg-black/75 px-1.5 font-mono text-xs leading-snug font-bold text-white sm:text-sm"
              :class="
                card.right
                  ? 'right-0 rounded-tl-md rounded-br-lg'
                  : 'left-0 rounded-tr-md rounded-bl-lg'
              "
            >
              #{{ card.rank }}
            </span>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Current meta -->
    <section v-if="featured" class="mt-14 md:mt-20">
      <!-- The series is the heading: an eyebrow, its month large with the event
           name beside it, one line of counts. No tier-list link here — the hero's
           "View tier list" already opens this same series -->
      <p
        class="text-xs font-semibold tracking-widest text-gray-400 uppercase dark:text-nalika-text-muted/70"
      >
        Current meta
      </p>
      <h2
        class="mt-1 flex flex-wrap items-baseline gap-x-2 text-2xl font-bold text-sumi md:text-3xl dark:text-nalika-text"
      >
        {{ featuredTitle.main }}
        <span
          v-if="featuredTitle.sub"
          class="text-base font-semibold text-ruri md:text-lg dark:text-sora"
        >
          {{ featuredTitle.sub }}
        </span>
      </h2>
      <p class="mt-1.5 text-xs text-gray-500 tabular-nums dark:text-gray-400">
        {{ featured.events.toLocaleString() }} events · {{ featuredRange }}
      </p>

      <!-- A status line, not a CTA: the whole row opens the in-progress series' tiers -->
      <RouterLink
        v-if="inProgress"
        :to="{ name: 'tier', query: { series: inProgress.value } }"
        :title="`Preliminary tiers for ${inProgress.label}`"
        class="group mt-4 flex items-center gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800 hover:bg-amber-100 dark:border-amber-700/40 dark:bg-amber-900/25 dark:text-amber-200/80 dark:hover:bg-amber-900/40"
      >
        <span class="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span class="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-60" />
          <span class="relative h-2 w-2 rounded-full bg-amber-500" />
        </span>
        <span class="min-w-0 flex-1">
          <b>{{ inProgress.label }}</b>
          in progress · {{ inProgress.events }} events
          <span class="max-sm:hidden">so far, tiers are preliminary</span>
        </span>
        <span
          class="shrink-0 text-amber-600/70 transition-transform group-hover:translate-x-0.5 dark:text-amber-300/60"
          aria-hidden="true"
        >
          →
        </span>
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
            <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span
                class="rounded px-2 py-0.5 text-sm leading-none font-bold"
                :class="tierPillClass(row.tier)"
              >
                {{ row.tier }}
              </span>
              <span class="text-sm font-bold text-gray-700 tabular-nums dark:text-nalika-text">
                {{ row.score }}
              </span>
              <span class="ml-1 flex items-center gap-0.5">
                <span
                  v-for="dot in row.colorDots"
                  :key="dot.name"
                  class="h-2.5 w-2.5 rounded-full"
                  :style="{ background: dot.hex }"
                />
              </span>
              <span class="truncate">{{ row.colors }}</span>
            </div>
            <!-- Wrap between card names, never inside one -->
            <div
              class="mt-1.5 line-clamp-2 text-sm leading-snug font-bold break-keep text-sumi group-hover:underline dark:text-nalika-text"
            >
              <template v-for="(seg, si) in row.segments" :key="si">
                <span v-if="seg.color" :style="{ color: seg.color }">{{ seg.text }}</span>
                <span v-else>{{ seg.text }}</span>
              </template>
            </div>
            <!-- Pinned to the bottom so cards in a row line up when a name wraps -->
            <div
              class="mt-1.5 text-xs text-gray-500 tabular-nums md:mt-auto md:pt-1.5 dark:text-gray-400"
            >
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
// "2026-10 (Serial)" → "2026-10" with "Serial" beside it
const featuredTitle = computed(() => {
  const label = featured.value?.label ?? ''
  return { main: label.replace(/\s*\(.*\)$/, ''), sub: label.match(/\((.*)\)$/)?.[1] ?? '' }
})
// "2026-10-01 → 10-31": the end date drops a year it shares with the start
const featuredRange = computed(() => {
  const { eventMinDate: from, eventMaxDate: to } = featured.value ?? {}
  if (!from || !to) {
    return from ?? to ?? ''
  }
  return `${from} → ${to.slice(0, 4) === from.slice(0, 4) ? to.slice(5) : to}`
})
const inProgress = computed(() => (latest.value !== featured.value ? latest.value : null))
const seriesQuery = computed(() => (featured.value ? { series: featured.value.value } : {}))

const totals = computed(() => {
  const series = tierData.value
  return [
    { label: 'Placed decks', value: series.reduce((n, s) => n + s.totalDecks, 0).toLocaleString() },
    { label: 'Events', value: series.reduce((n, s) => n + s.events, 0).toLocaleString() },
    { label: 'Series', value: series.length },
  ]
})

// Latest event date in the data, e.g. "Nov 3, 2026 · 2 days ago"
const updated = computed(() => {
  const date = tierData.value
    .map(s => s.eventMaxDate)
    .filter(Boolean)
    .sort()
    .at(-1)
  if (!date) {
    return null
  }
  const [y, m, d] = date.split('-').map(Number)
  const then = new Date(y, m - 1, d)
  const now = new Date()
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()) - then) / 86400000,
  )
  return {
    date,
    label: then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    ago: new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-days, 'day'),
    fresh: days <= 7,
  }
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

// Fanned hero cards: signature cards of the same top six decks as the Current
// meta blocks, ranked 5 3 1 2 4 6 from left to right so #1 and #2 sit in the
// middle (#1 on top), on an arc
const FAN = [
  { rank: 5, rotate: '-15deg', lift: '28px', z: 1 },
  { rank: 3, rotate: '-9deg', lift: '10px', z: 2 },
  { rank: 1, rotate: '-3deg', lift: '0px', z: 4 },
  { rank: 2, rotate: '3deg', lift: '0px', z: 3, right: true },
  { rank: 4, rotate: '9deg', lift: '10px', z: 2, right: true },
  { rank: 6, rotate: '15deg', lift: '28px', z: 1, right: true },
]
const heroCards = computed(() => {
  const top = topRows.value.filter(r => r.imageCardId)
  return FAN.filter(f => top[f.rank - 1]).map(f => {
    const row = top[f.rank - 1]
    return { ...f, id: row.imageCardId, to: row.to, name: row.archetype }
  })
})

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
