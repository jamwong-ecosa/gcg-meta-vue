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

    <!-- Current meta -->
    <section v-if="featured" class="mt-14 md:mt-20">
      <!-- The series is the heading: an eyebrow, its month large with the event
           name beside it, one line of counts. No tier-list link here — the hero's
           "View tier list" already opens this same series -->
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
      </p>

      <!-- A status line, not a CTA: the whole row opens the in-progress series' tiers -->
      <RouterLink
        v-if="inProgress"
        :to="{ name: 'tier', query: { series: inProgress.value } }"
        :title="$t('home.preliminaryTitle', { label: inProgress.label })"
        class="group mt-4 flex items-center gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800 hover:bg-amber-100 dark:border-amber-700/40 dark:bg-amber-900/25 dark:text-amber-200/80 dark:hover:bg-amber-900/40"
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

      <!-- One layout at every size: the signature card art on the left, tier, name
           and counts on the right -->
      <div class="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
        <RouterLink
          v-for="row in topRows"
          :key="row.archetype"
          :to="row.to"
          class="group flex h-28 overflow-hidden rounded-lg border border-gray-500/15 bg-white transition-[border-color,box-shadow] duration-200 hover:border-ruri/30 hover:shadow-md hover:shadow-ruri/10 dark:border-nalika-border dark:bg-nalika-surface dark:hover:border-sora/40 dark:hover:shadow-black/30"
        >
          <!-- Hover: soft shadow and a faint blue border; no underline through the names -->
          <div class="relative w-28 shrink-0 overflow-hidden bg-gray-100 sm:w-40 dark:bg-nalika-bg">
            <!-- Each card's art cropped around the unit's face (as in the pie
                 chart); two-card archetypes split on a steep diagonal, the first
                 named card on the left -->
            <div
              v-for="(art, ai) in row.thumbs"
              :key="ai"
              class="absolute inset-0"
              :style="{ clipPath: art.clip }"
            >
              <img
                :src="art.url"
                alt=""
                loading="lazy"
                class="absolute max-w-none"
                :style="art.style"
              />
            </div>
            <svg
              v-if="row.thumbs.length === 2"
              class="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line
                :x1="SPLIT_TOP * 100"
                y1="0"
                :x2="SPLIT_BOTTOM * 100"
                y2="100"
                class="stroke-white dark:stroke-nalika-surface"
                stroke-width="3"
                vector-effect="non-scaling-stroke"
              />
            </svg>
          </div>
          <div class="flex min-w-0 flex-1 flex-col justify-center px-2.5 py-3 sm:px-3">
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
              <span class="truncate">{{ comboName(row.colors) }}</span>
            </div>
            <!-- Card names joined by "/", wrapping between names (inside one only
                 when it is wider than the line). Every name has a slash in front;
                 the row is pulled left by the slash's width and clipped, so a name
                 that starts a line loses its slash. 13px on phones so the longest names
                 (ストライクフリーダムガンダム) fit a line down to 360px. A hanging indent keeps a
                 name's own wrapped lines clear of the clipped strip. Two lines at most -->
            <div
              class="mt-1.5 max-h-[2lh] overflow-hidden text-[13px] leading-snug font-bold text-sumi sm:text-sm dark:text-nalika-text"
            >
              <div class="-ml-5 flex flex-wrap">
                <span
                  v-for="(name, ni) in row.names"
                  :key="ni"
                  class="min-w-0 pl-5 -indent-5 wrap-anywhere break-keep before:inline-block before:w-5 before:text-center before:indent-0 before:content-['/']"
                >
                  <span
                    v-for="(part, pi) in name"
                    :key="pi"
                    :style="{ color: part.color }"
                    v-text="part.text"
                  />
                </span>
              </div>
            </div>
            <div class="mt-1.5 text-xs text-gray-500 tabular-nums dark:text-gray-400">
              {{ $t('home.rowStats', { wins: row.wins, use: row.usePct }) }}
            </div>
          </div>
        </RouterLink>
      </div>
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
import { useMediaQuery } from '@vueuse/core'
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

// Card art box on each row (px, matches w-28 sm:w-40 and h-28): narrower on
// phones so the names keep their room. Two-card archetypes split on a line from
// SPLIT_TOP to SPLIT_BOTTOM across the box's width
const isWide = useMediaQuery('(min-width: 640px)')
const thumbW = computed(() => (isWide.value ? 160 : 112))
const THUMB_H = 112
const SPLIT_TOP = 0.62
const SPLIT_BOTTOM = 0.38
// A face-centred square crop (cardFace) `slack` times the area it fills,
// slid to put the face on the target while still covering the area; `face` is
// where the face ends up in the box
function placeArt(cardId, box, target, slack) {
  const { u, v } = cardFace(cardId, 0)
  const size = Math.max(box.x1 - box.x0, box.y1 - box.y0) * slack
  const fit = (want, lo, hi) => Math.min(lo, Math.max(hi - size, want))
  const x = fit(target.x - u * size, box.x0, box.x1)
  const y = fit(target.y - v * size, box.y0, box.y1)
  const px = Math.min(800, Math.ceil((size * 2) / 50) * 50)
  return {
    url: cardFace(cardId, px).url,
    style: { left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px` },
    face: { x: x + u * size, y: y + v * size },
  }
}

// Two-card split in a box `w` wide: each half's area, where its face should
// go, and its clip
function splitHalves(w) {
  const x0 = SPLIT_TOP * w
  const x1 = SPLIT_BOTTOM * w
  const splitX = y => x0 - ((x0 - x1) * y) / THUMB_H
  return [
    {
      box: { x0: 0, x1: x0, y0: 0, y1: THUMB_H },
      target: { x: x1 * 0.62, y: THUMB_H * 0.45 },
      clip: `polygon(0 0, ${SPLIT_TOP * 100}% 0, ${SPLIT_BOTTOM * 100}% 100%, 0 100%)`,
      // How far the face sits inside the half, from the diagonal
      margin: face => splitX(face.y) - face.x,
    },
    {
      box: { x0: x1, x1: w, y0: 0, y1: THUMB_H },
      target: { x: w - (w - x0) * 0.62, y: THUMB_H * 0.45 },
      clip: `polygon(${SPLIT_TOP * 100}% 0, 100% 0, 100% 100%, ${SPLIT_BOTTOM * 100}% 100%)`,
      margin: face => face.x - splitX(face.y),
    },
  ]
}
// A face closer than this to the diagonal gets cut by it (about half a head)
const FACE_MARGIN = 22
// Crop sizes to try, smallest first: the art is only enlarged when it must be.
// A head tucked in the art's top-left corner needs the most in the right half,
// whose slant cuts across that corner
const SLACKS = [1.15, 1.35, 1.6, 1.8]
// The least enlarged crop that keeps the face clear of the diagonal, or the
// one that gets it closest
function placeInHalf(cardId, half) {
  const spots = SLACKS.map(k => placeArt(cardId, half.box, half.target, k))
  const ok = spots.find(p => half.margin(p.face) >= FACE_MARGIN)
  const best = ok ?? spots.reduce((a, b) => (half.margin(b.face) > half.margin(a.face) ? b : a))
  return { ...best, clip: half.clip }
}
function rowThumbs(ids, w) {
  if (ids.length === 2) {
    // Name order, which follows the colour order (藍 left of 紫)
    const halves = splitHalves(w)
    return ids.map((id, i) => placeInHalf(id, halves[i]))
  }
  if (ids.length === 1) {
    const box = { x0: 0, x1: w, y0: 0, y1: THUMB_H }
    return [{ ...placeArt(ids[0], box, { x: w / 2, y: THUMB_H * 0.45 }, 1), clip: 'none' }]
  }
  return []
}

// Label segments ("A", " / ", "B") → one list of coloured parts per card name,
// so the template draws the slashes itself
function splitNames(segments) {
  const names = [[]]
  for (const seg of segments) {
    seg.text.split(/\s*\/\s*/).forEach((text, i) => {
      if (i > 0) {
        names.push([])
      }
      if (text) {
        names.at(-1).push({ text, color: seg.color })
      }
    })
  }
  return names.filter(n => n.length)
}

// Signature cards whose copies are within 5% of each other count as equally
// played; the higher-level one (usually the deck's finisher) gets the picture
const CLOSE_COPIES = 0.05

const topRows = computed(() => {
  const s = featured.value
  if (!s) {
    return []
  }
  const archetypes = manifest.find(m => m.value === s.value)?.archetypes ?? []
  // Archetypes often share a signature card; show a different one where possible
  const usedImages = new Set()
  return s.rows.slice(0, 6).map(row => {
    // The most-played signature card (most copies across the archetype's
    // decks), or the higher-level one when their copies are close, unless an
    // archetype above already shows it
    const stats = row.sigCardStats ?? []
    const ids = (row.sigCardIds ?? [])
      .map((id, i) => ({ id, ...(stats[i] ?? { copies: 0, level: 0 }) }))
      .sort((a, b) => {
        const close = Math.abs(a.copies - b.copies) <= CLOSE_COPIES * Math.max(a.copies, b.copies)
        return close ? b.level - a.level : b.copies - a.copies
      })
      .map(c => c.id)
    const imageCardId = ids.find(id => !usedImages.has(id)) ?? ids[0]
    usedImages.add(imageCardId)
    const idx = archetypes.findIndex(
      a => normalizeArchetypeName(a.combo) === normalizeArchetypeName(row.archetype),
    )
    // Two signature cards, in the order the name lists them
    const sigIds = row.sigCardIds ?? []
    return {
      ...row,
      imageCardId,
      thumbs: rowThumbs(
        sigIds.length === 2 && sigIds[0] !== sigIds[1] ? sigIds : [imageCardId].filter(Boolean),
        thumbW.value,
      ),
      names: splitNames(
        buildLabelSegments(row.archetype, row.sigCards ?? [], { skipBaseCombo: true }),
      ),
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
const features = [
  { key: 'tier', to: 'tier' },
  { key: 'analysis', to: 'archetype-analysis' },
  { key: 'meta', to: 'meta' },
]
</script>
