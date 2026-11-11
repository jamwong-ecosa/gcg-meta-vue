<template>
  <div class="mx-auto max-w-340 px-4 pt-8 pb-10 md:px-8 md:py-16">
    <!-- Hero -->
    <section class="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
      <div class="max-lg:order-2 max-lg:text-center">
        <p
          class="text-xs font-semibold tracking-widest text-gray-400 uppercase dark:text-nalika-text-muted/70 zh:text-sm zh:tracking-wide"
        >
          {{ $t('home.eyebrow') }}
        </p>
        <h1
          class="mt-2 text-3xl font-bold tracking-tight text-sumi md:text-4xl dark:text-nalika-text"
        >
          {{ $t('home.title') }}
        </h1>
        <p
          class="mt-3 max-w-lg text-sm leading-relaxed text-gray-600 max-lg:mx-auto dark:text-nalika-text-muted"
        >
          {{ $t('home.intro') }}
        </p>

        <div class="mt-6 flex flex-wrap gap-3 max-lg:justify-center">
          <RouterLink
            :to="{ name: 'tier', query: seriesQuery }"
            class="rounded-full bg-ruri px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-ruri/85 dark:bg-sora dark:text-nalika-bg dark:hover:bg-sora/85"
          >
            {{ $t('home.viewTierList') }}
          </RouterLink>
          <RouterLink
            :to="{ name: 'meta', query: seriesQuery }"
            class="rounded-full bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-nalika-surface dark:text-nalika-text dark:hover:bg-nalika-header"
          >
            {{ $t('home.metaOverview') }}
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
              <i18n-t keypath="home.resultsThrough" scope="global">
                <template #date>
                  <time
                    :datetime="updated.date"
                    class="font-medium text-gray-700 dark:text-nalika-text"
                  >
                    {{ updated.label }}
                  </time>
                </template>
              </i18n-t>
              <span class="ml-1.5 text-gray-400 dark:text-gray-500">· {{ updated.ago }}</span>
            </span>
          </p>
        </div>
      </div>

      <!-- The featured series' most played cards, rotating -->
      <CardMostPlayedCarousel
        v-if="featured"
        class="max-lg:order-1"
        :series-key="featured.value"
        :series-label="featuredTitle.main"
        :total-decks="featured.totalDecks"
      />
    </section>

    <!-- Current meta: the top eight of the tier list, poster style; each tile is
         the archetype's signature card art with its share of placed decks on top -->
    <section
      v-if="featured"
      class="relative mt-14 overflow-hidden rounded-lg border border-gray-500/15 bg-white p-3 text-sumi shadow-sm shadow-black/[0.03] sm:p-5 md:mt-20 md:p-6 dark:border-nalika-border dark:bg-nalika-surface dark:text-nalika-text"
    >
      <header class="relative">
        <p
          class="text-xs font-semibold tracking-widest text-gray-400 uppercase dark:text-nalika-text-muted/70 zh:text-sm zh:tracking-wide"
        >
          {{ $t('home.currentMeta') }}
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
          {{ $t('home.eventsRange', { n: $n(featured.events), range: featuredRange }) }}
          · {{ $t('home.ranking.decks', { n: $n(featured.totalDecks) }) }}
        </p>
      </header>

      <!-- A status line, not a CTA: the whole row opens the in-progress series' tiers -->
      <RouterLink
        v-if="inProgress"
        :to="{ name: 'tier', query: { series: inProgress.value } }"
        :title="$t('home.preliminaryTitle', { label: inProgress.label })"
        class="group relative mt-4 flex items-center gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800 hover:bg-amber-100 dark:border-amber-700/40 dark:bg-amber-900/25 dark:text-amber-200/80 dark:hover:bg-amber-900/40"
      >
        <span class="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span class="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-60" />
          <span class="relative h-2 w-2 rounded-full bg-amber-500" />
        </span>
        <span class="min-w-0 flex-1">
          <i18n-t keypath="home.inProgress" scope="global">
            <template #label>
              <b>{{ inProgress.label }}</b>
            </template>
            <template #n>{{ inProgress.events }}</template>
          </i18n-t>
          <span class="max-sm:hidden">{{ $t('home.inProgressNote') }}</span>
        </span>
        <span
          class="shrink-0 text-amber-600/70 transition-transform group-hover:translate-x-0.5 dark:text-amber-300/60"
          aria-hidden="true"
        >
          →
        </span>
      </RouterLink>

      <!-- One grid: #1 tall on the left, #2 and #3 large beside it, #4 and #5
           under them at the size of the rest, which then fill rows of three -->
      <div class="relative mt-4 grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
        <RouterLink
          v-for="(row, i) in podium"
          :key="row.archetype"
          :to="row.to"
          class="group relative isolate overflow-hidden rounded-lg border-2 bg-gray-100 text-white transition-[translate,box-shadow] duration-200 hover:shadow-lg hover:shadow-ruri/20 motion-safe:hover:-translate-y-0.5 dark:bg-nalika-bg dark:hover:shadow-black/40"
          :class="[
            PODIUM[i].border,
            i === 0
              ? 'aspect-[4/3] sm:col-span-2 sm:aspect-[2/1] lg:col-span-1 lg:row-span-2 lg:aspect-auto'
              : 'aspect-[4/3] lg:aspect-auto lg:h-56',
          ]"
        >
          <img
            v-if="row.art"
            :src="row.art.url"
            alt=""
            class="absolute inset-0 -z-10 h-full w-full object-cover brightness-90 transition-[filter] duration-200 group-hover:brightness-110"
            :style="{ objectPosition: row.art.position }"
          />
          <div
            class="absolute inset-0 -z-10 bg-linear-to-t from-nalika-bg/95 via-nalika-bg/45 to-transparent"
            :class="i === 0 ? 'via-25%' : 'via-45%'"
          />
          <span
            class="absolute top-0 left-0 flex items-center justify-center rounded-br-md font-black text-sumi shadow-sm"
            :class="[PODIUM[i].badge, i === 0 ? 'h-14 w-14 text-3xl' : 'h-10 w-10 text-xl']"
          >
            {{ i + 1 }}
          </span>
          <span
            class="absolute top-2 right-2 rounded px-2 py-0.5 text-xs leading-none font-bold"
            :class="tierPillClass(row.tier)"
          >
            {{ row.tier }}
          </span>
          <!-- Names get the full width; the share sits beside the counts below -->
          <div class="absolute inset-x-0 bottom-0" :class="i === 0 ? 'p-3 md:p-4' : 'p-3'">
            <div class="flex items-center gap-2">
              <span class="h-2.5 w-7 shrink-0 rounded-full" :style="row.bar" />
              <span class="truncate text-sm font-bold text-white/75">
                {{ comboName(row.colors) }}
              </span>
            </div>
            <!-- Lines break between names only; a name wider than the line is
                 cut short on its own -->
            <div
              class="mt-1 flex max-h-[2lh] flex-wrap gap-x-1.5 overflow-hidden leading-tight font-black"
              :class="i === 0 ? 'text-xl' : 'text-base'"
            >
              <span
                v-for="(name, ni) in row.names"
                :key="ni"
                class="max-w-full truncate"
                v-text="ni < row.names.length - 1 ? `${name} /` : name"
              />
            </div>
            <div class="mt-1 flex items-end justify-between gap-3">
              <div class="flex gap-3 pb-0.5 text-xs font-bold tabular-nums">
                <span class="text-white/75">
                  {{ $t('home.ranking.placed', { n: row.decks }) }}
                </span>
                <span :class="row.wins ? 'text-amber-300' : 'text-white/45'">
                  {{ $t('home.ranking.wins', { n: row.wins }) }}
                </span>
              </div>
              <div
                class="flex shrink-0 items-baseline leading-none font-black tracking-tight text-sora tabular-nums"
                :class="i === 0 ? 'text-5xl' : 'text-3xl'"
              >
                {{ row.share }}
                <span class="ml-0.5" :class="i === 0 ? 'text-lg' : 'text-sm'">%</span>
              </div>
            </div>
          </div>
        </RouterLink>

        <RouterLink
          v-for="(row, i) in rest"
          :key="row.archetype"
          :to="row.to"
          class="group relative isolate h-28 overflow-hidden rounded-lg border border-gray-500/20 bg-gray-100 text-white transition-[translate,border-color,box-shadow] duration-200 hover:border-ruri/60 hover:shadow-lg hover:shadow-ruri/20 motion-safe:hover:-translate-y-0.5 md:h-32 dark:border-nalika-border dark:bg-nalika-bg dark:hover:border-sora/60 dark:hover:shadow-black/40"
        >
          <img
            v-if="row.art"
            :src="row.art.url"
            alt=""
            loading="lazy"
            class="absolute inset-0 -z-10 h-full w-full object-cover brightness-90 transition-[filter] duration-200 group-hover:brightness-110"
            :style="{ objectPosition: row.art.position }"
          />
          <div
            class="absolute inset-0 -z-10 bg-linear-to-t from-nalika-bg/95 via-nalika-bg/55 via-50% to-transparent"
          />
          <span
            class="absolute top-0 left-0 flex h-9 w-9 items-center justify-center rounded-br-md bg-white/90 text-xl font-black text-sumi dark:bg-nalika-surface/90 dark:text-nalika-text"
          >
            {{ i + 4 }}
          </span>
          <span
            class="absolute top-2 right-2 rounded px-1.5 py-0.5 text-[11px] leading-none font-bold"
            :class="tierPillClass(row.tier)"
          >
            {{ row.tier }}
          </span>
          <div class="absolute inset-x-0 bottom-0 px-3 pb-2">
            <div class="flex min-w-0 items-center gap-1.5">
              <span class="h-2 w-5 shrink-0 rounded-full" :style="row.bar" />
              <span class="truncate text-xs font-bold text-white/75">
                {{ comboName(row.colors) }}
              </span>
            </div>
            <!-- One line: when the names don't fit, each is cut short in
                 proportion to its length, so both stay readable -->
            <div class="mt-0.5 flex min-w-0 text-sm font-black">
              <template v-for="(name, ni) in row.names" :key="ni">
                <span v-if="ni" class="shrink-0 px-1.5">/</span>
                <span class="min-w-0 truncate">{{ name }}</span>
              </template>
            </div>
            <div class="mt-0.5 flex items-end justify-between gap-2">
              <div class="flex gap-2.5 pb-0.5 text-[11px] font-bold tabular-nums">
                <span class="text-white/75">
                  {{ $t('home.ranking.placed', { n: row.decks }) }}
                </span>
                <span :class="row.wins ? 'text-amber-300' : 'text-white/45'">
                  {{ $t('home.ranking.wins', { n: row.wins }) }}
                </span>
              </div>
              <div
                class="flex shrink-0 items-baseline text-2xl leading-none font-black text-sora tabular-nums"
              >
                {{ row.share }}
                <span class="ml-0.5 text-sm">%</span>
              </div>
            </div>
          </div>
        </RouterLink>
      </div>

      <RouterLink
        :to="{ name: 'tier', query: seriesQuery }"
        class="relative mt-4 flex items-center justify-end gap-3 text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase transition-colors hover:text-ruri dark:text-nalika-text-muted dark:hover:text-sora"
      >
        <span class="h-px w-24 bg-gray-300 dark:bg-nalika-border" aria-hidden="true" />
        {{ $t('home.ranking.viewAll') }} →
      </RouterLink>
    </section>

    <!-- Explore -->
    <section class="mt-14 md:mt-20">
      <h2 class="text-xl font-bold text-sumi md:text-2xl dark:text-nalika-text">
        {{ $t('home.explore') }}
      </h2>
      <div class="mt-4 grid gap-3 sm:grid-cols-3">
        <RouterLink
          v-for="feature in features"
          :key="feature.to"
          :to="{ name: feature.to, query: seriesQuery }"
          class="group rounded-lg border border-gray-500/15 bg-white p-4 transition-[border-color,box-shadow] duration-200 hover:border-ruri/30 hover:shadow-md hover:shadow-ruri/10 dark:border-nalika-border dark:bg-nalika-surface dark:hover:border-sora/40 dark:hover:shadow-black/30"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-gray-700 dark:text-nalika-text">
              {{ $t(`home.features.${feature.key}.title`) }}
            </h3>
            <span
              class="text-gray-400 transition-colors group-hover:text-ruri dark:group-hover:text-sora"
            >
              →
            </span>
          </div>
          <p class="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-nalika-text-muted">
            {{ $t(`home.features.${feature.key}.description`) }}
          </p>
        </RouterLink>
      </div>
    </section>

    <!-- About the data -->
    <p
      class="mt-14 border-t border-gray-500/10 pt-6 text-xs leading-relaxed text-gray-400 md:mt-20 dark:border-nalika-border dark:text-gray-500"
    >
      <i18n-t keypath="home.about" scope="global">
        <!-- v-text keeps template whitespace out of the underlined link text -->
        <template #official>
          <a
            href="https://www.gundam-gcg.com/jp/events/tournament-results/"
            target="_blank"
            rel="noopener noreferrer"
            class="underline underline-offset-2 hover:text-ruri dark:hover:text-sora"
            v-text="$t('home.aboutOfficial')"
          />
        </template>
        <template #bandai>
          <a
            href="https://d.bandai-tcg-plus.com/gcgja/tournament"
            target="_blank"
            rel="noopener noreferrer"
            class="underline underline-offset-2 hover:text-ruri dark:hover:text-sora"
            v-text="'Bandai TCG+'"
          />
        </template>
      </i18n-t>
    </p>
  </div>
</template>

<script setup>
import manifest from '$data/archetypes/index.json'

const { t, locale } = useI18n()
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
    {
      label: t('home.totals.decks'),
      value: series.reduce((n, s) => n + s.totalDecks, 0).toLocaleString(locale.value),
    },
    {
      label: t('home.totals.events'),
      value: series.reduce((n, s) => n + s.events, 0).toLocaleString(locale.value),
    },
    { label: t('home.totals.series'), value: series.length },
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
    label: then.toLocaleDateString(locale.value, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    ago: new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' }).format(-days, 'day'),
    fresh: days <= 7,
  }
})

// Tile backgrounds: the illustration cropped to roughly the tile's shape with
// the unit's face upper middle, clear of the text along the bottom
function cardArt(cardId, width, aspect, zoom) {
  if (!cardId) {
    return null
  }
  const { url, u, v } = cardCrop(cardId, width, aspect, { faceAt: 0.35, zoom })
  return { url, position: `${(u * 100).toFixed(1)}% ${(v * 100).toFixed(1)}%` }
}

// Signature cards whose copies are within 5% of each other count as equally
// played; the higher-level one (usually the deck's finisher) gets the picture
const CLOSE_COPIES = 0.05
const RANKED = 8

// Rank badges and borders for the top three: gold, silver, bronze
const PODIUM = [
  {
    border: tw`border-amber-400 dark:border-amber-500/80`,
    badge: tw`bg-linear-to-br from-amber-200 via-amber-400 to-amber-600`,
  },
  {
    border: tw`border-slate-300 dark:border-slate-400/70`,
    badge: tw`bg-linear-to-br from-white via-slate-300 to-slate-500`,
  },
  {
    border: tw`border-orange-300 dark:border-orange-500/70`,
    badge: tw`bg-linear-to-br from-orange-200 via-orange-400 to-orange-700`,
  },
]

// The featured series' top archetypes in tier list order (rows come sorted by rank)
const ranked = computed(() => {
  const s = featured.value
  if (!s) {
    return []
  }
  const archetypes = manifest.find(m => m.value === s.value)?.archetypes ?? []
  // Archetypes often share a signature card; show a different one where possible
  const usedImages = new Set()
  return s.rows.slice(0, RANKED).map((row, i) => {
    // Signature cards ranked by copies across the archetype's decks, the
    // higher-level one (usually the finisher) first when their copies are close
    const stats = row.sigCardStats ?? []
    const ids = (row.sigCardIds ?? [])
      .map((id, j) => ({ id, ...(stats[j] ?? { copies: 0, level: 0 }) }))
      .sort((a, b) => {
        const close = Math.abs(a.copies - b.copies) <= CLOSE_COPIES * Math.max(a.copies, b.copies)
        return close ? b.level - a.level : b.copies - a.copies
      })
      .map(c => c.id)
    // The first of those nobody above shows yet, or failing that, the
    // archetype's most-played other unit nobody shows
    const imageCardId =
      [...ids, ...(row.artCardIds ?? [])].find(id => !usedImages.has(id)) ?? ids[0]
    usedImages.add(imageCardId)
    const idx = archetypes.findIndex(
      a => normalizeArchetypeName(a.combo) === normalizeArchetypeName(row.archetype),
    )
    const hexes = (row.colorDots ?? []).map(d => d.hex)
    const names = (row.sigCards ?? []).map(c => c.name)
    return {
      ...row,
      art:
        i === 0
          ? cardArt(imageCardId, 800, 0.9, 1)
          : i < 3
            ? cardArt(imageCardId, 600, 1.8, 1.2)
            : cardArt(imageCardId, 600, 3, 1.4),
      names: names.length ? names : [comboName(row.colors)],
      share: s.totalDecks ? ((row.decks / s.totalDecks) * 100).toFixed(1) : '0.0',
      bar: {
        background: hexes.length > 1 ? `linear-gradient(90deg, ${hexes.join(', ')})` : hexes[0],
      },
      to:
        idx === -1
          ? { name: 'tier', query: { series: s.value } }
          : { name: 'archetype-analysis', query: { series: s.value, arch: String(idx) } },
    }
  })
})
const podium = computed(() => ranked.value.slice(0, 3))
const rest = computed(() => ranked.value.slice(3))

// Fanned hero cards: signature cards of the same top six decks as the Current
// meta blocks, ranked 5 3 1 2 4 6 from left to right so #1 and #2 sit in the
// middle (#1 on top), on an arc
const features = [
  { key: 'tier', to: 'tier' },
  { key: 'analysis', to: 'archetype-analysis' },
  { key: 'meta', to: 'meta' },
]
</script>
