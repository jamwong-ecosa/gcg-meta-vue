<template>
  <div class="mx-auto max-w-340 p-3 max-sm:pb-6 md:p-8">
    <UiSeriesHeader
      :title="$t('archetype.analysis.title')"
      :visible="!!currentSeriesData"
      :events="currentSeriesData?.events ?? 0"
      :wins="currentSeriesData?.winDecks ?? 0"
      :decks="currentSeriesData?.totalDecks ?? 0"
      :archetypes="seriesManifest?.archetypes.length ?? 0"
    />
    <div
      class="sticky top-(--nav-h) z-40 -mx-3 mb-3 bg-white px-3 pb-2 transition-transform duration-300 md:-mx-8 md:px-8 md:pb-3 dark:bg-nalika-bg"
      :class="hideFilter ? '-translate-y-full' : 'translate-y-0'"
    >
      <ArchetypeDropdown v-model="archKey" :options="archOptions" />
    </div>

    <template v-if="selectedArchetype">
      <ArchetypeDetail
        :key="`${seriesKey}-${archKey}`"
        :archetype="selectedArchetype"
        :prev-card-ids="prevCardIds"
        :removed-cards="removedCards"
      >
        <template #after-cards>
          <ArchetypeTimeline
            :combo="selectedArchetype.combo"
            :current-series-key="seriesKey"
            @navigate="onTimelineNavigate"
          />
        </template>
      </ArchetypeDetail>
    </template>
    <p v-else class="text-sm text-gray-400 dark:text-gray-500">
      {{ $t('archetype.analysis.empty') }}
    </p>
  </div>
</template>

<script setup>
import manifest from '$data/archetypes/index.json'

function comboColors(combo) {
  const baseCombo = (combo ?? '').split(' (')[0]
  return baseCombo
    .split('+')
    .map(c => c.trim())
    .filter(Boolean)
    .map(c => COLOR_HEX[c] || '#718096')
}

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const { tierData, loadTierData } = useTierData()
const { start, finish } = useLoadingBar()

await loadTierData()

const { seriesKey } = useSelectedSeries()

const seriesManifest = computed(() => manifest.find(s => s.value === seriesKey.value))

const currentSeriesData = computed(() => tierData.value.find(s => s.value === seriesKey.value))

const { hideFilter } = useScrollHide(180)

function normalizeCombo(s) {
  return s.replace(/[（）]/g, c => (c === '（' ? '(' : ')')).replace(/\s*\(/g, '(')
}

// "18 張卡" → { n: '18', unit: '張卡' }: the count bold, the unit as it's translated
function countStat(key, n) {
  const text = t(key, n)
  const at = text.indexOf(String(n))
  return at < 0
    ? { n: '', unit: text }
    : { n: String(n), unit: (text.slice(0, at) + text.slice(at + String(n).length)).trim() }
}

const archOptions = computed(() => {
  const rows = currentSeriesData.value?.rows ?? []
  const rowOrder = combo => {
    const normalized = normalizeCombo(combo)
    const idx = rows.findIndex(r => normalizeCombo(r.archetype) === normalized)
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
  }
  return (seriesManifest.value?.archetypes ?? [])
    .map((a, i) => ({
      value: String(i),
      details: t('archetype.analysis.details', {
        cards: t('archetype.cardCount', a.cardCount),
        wins: t('archetype.winCount', a.winnerDeckCount),
        decks: t('archetype.deckCount', a.deckCount),
        pct: a.percent,
      }),
      // Same numbers for the selected archetype, split so the counts can be bold
      stats: [
        countStat('archetype.cardCount', a.cardCount),
        countStat('archetype.winCount', a.winnerDeckCount),
        { ...countStat('archetype.deckCount', a.deckCount), note: `${a.percent}%` },
      ],
      colors: comboColors(a.combo),
      labelSegments: buildLabelSegments(a.combo, a.sigCards),
      // Combo and card names apart, for the two-line name on phones
      nameParts: archetypeNameParts(a.combo, a.sigCards),
      tier: a.tier || null,
      style: a.style ?? null,
      combo: a.combo,
    }))
    .sort((x, y) => rowOrder(x.combo) - rowOrder(y.combo))
})

const validArchKeys = computed(() => archOptions.value.map(o => o.value))
// Like seriesKey, the archetype lives in the URL and is pinned to this page
let lastArch = ''
const archKey = computed({
  get() {
    if (route.name !== 'archetype-analysis') {
      return lastArch
    }
    const valid = validArchKeys.value
    lastArch = valid.includes(route.query.arch) ? route.query.arch : valid.length ? '0' : ''
    return lastArch
  },
  set(val) {
    router.replace({ query: { series: seriesKey.value, arch: val } })
  },
})

const selectedArchetype = ref(null)
const prevCardIds = ref(null)
const prevCards = ref(null)

async function loadPrevArchetype(seriesVal, combo) {
  prevCardIds.value = null
  prevCards.value = null
  const path = prevArchetypePath(seriesVal, combo)
  if (!path) {
    return
  }
  try {
    const mod = await archModules[path]?.()
    const data = mod?.default ?? null
    if (!data) {
      return
    }
    const all = [...(data.cards ?? []), ...(data.filteredCards ?? [])]
    prevCardIds.value = new Set(all.map(c => c.cardId))
    prevCards.value = all
  } catch {
    // previous series not available
  }
}

const removedCards = computed(() => {
  if (!prevCards.value || !selectedArchetype.value) {
    return []
  }
  const currentCards = [
    ...(selectedArchetype.value.cards ?? []),
    ...(selectedArchetype.value.filteredCards ?? []),
  ]
  const currentIds = new Set(currentCards.map(c => c.cardId))
  return prevCards.value.filter(c => !currentIds.has(c.cardId))
})

function onTimelineNavigate({ seriesKey: s, archIndex }) {
  router.replace({ query: { series: s, arch: archIndex } })
}

async function loadArchetype(seriesVal, archIdx) {
  if (!seriesVal || archIdx === '' || archIdx === undefined) {
    selectedArchetype.value = null
    return
  }
  start()
  try {
    const path = `/data-processed/archetypes/${seriesVal}/${archIdx}.json`
    // The combo is in the manifest, so the previous series' file loads alongside
    const combo = archetypeCombo(seriesVal, archIdx)
    const [mod] = await Promise.all([
      archModules[path]?.(),
      combo ? loadPrevArchetype(seriesVal, combo) : null,
    ])
    selectedArchetype.value = mod?.default ?? null
    if (selectedArchetype.value && !combo) {
      await loadPrevArchetype(seriesVal, selectedArchetype.value.combo)
    }
  } catch {
    selectedArchetype.value = null
  } finally {
    finish()
  }
}

watch([seriesKey, archKey], async ([s, a]) => {
  await loadArchetype(s, a)
})

await loadArchetype(seriesKey.value, archKey.value)
</script>
