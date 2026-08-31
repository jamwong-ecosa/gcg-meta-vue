<template>
  <div class="mx-auto max-w-340 p-3 max-sm:pb-6 md:p-8">
    <UiSeriesHeader
      title="Archetype Shifts"
      :visible="!!currentSeries"
      :events="currentSeries?.events ?? 0"
      :wins="currentSeries?.winDecks ?? 0"
      :decks="currentSeries?.totalDecks ?? 0"
      :archetypes="currentSeries?.rows.length ?? 0"
    />
    <div
      class="sticky top-12 z-40 -mx-3 mb-3 flex flex-col gap-2 bg-white px-3 py-3 transition-transform duration-300 md:-mx-8 md:px-8 dark:bg-nalika-bg"
      :class="hideFilter ? '-translate-y-full' : 'translate-y-0'"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="text-xs text-gray-500 dark:text-nalika-text-muted">
          Compared to
          <span class="font-semibold text-sumi dark:text-nalika-text">
            {{ prevSeriesLabel || '--' }}
          </span>
        </div>
        <UiGeneralDropdown v-model="seriesKey" class="w-fit md:max-w-md" :options="seriesOptions" />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          class="flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
          :class="
            groupByColor
              ? 'bg-ruri text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          "
          @click="groupByColor = !groupByColor"
        >
          <span
            class="inline-block h-3 w-3 rounded-full border"
            :class="groupByColor ? 'border-white/50 bg-white/30' : 'border-gray-400 bg-transparent'"
          />
          Group by color
        </button>
        <span class="hidden h-4 w-px bg-gray-500/20 md:block dark:bg-white/10" />
        <button
          class="flex cursor-pointer items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300"
          @click="scrollToSection('new')"
        >
          New
          <span>{{ newRows.length }}</span>
        </button>
        <button
          class="flex cursor-pointer items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          @click="scrollToSection('persisted')"
        >
          Persisted
          <span>{{ persistedRows.length }}</span>
        </button>
        <button
          class="flex cursor-pointer items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300"
          @click="scrollToSection('removed')"
        >
          Removed
          <span>{{ removedRows.length }}</span>
        </button>
      </div>
    </div>

    <template v-if="currentSeries">
      <section
        v-for="sec in sections"
        :key="sec.key"
        :ref="setSectionRef(sec.key)"
        :class="[
          sec.key === 'new' ? '' : 'mt-4',
          'scroll-mt-14 rounded-lg bg-gray-50/50 not-dark:shadow-xs not-dark:shadow-gray-400/15 dark:bg-nalika-surface',
        ]"
      >
        <h2
          class="border-b border-gray-500/10 px-4 py-2.5 text-sm font-semibold text-sumi dark:border-white/10 dark:text-nalika-text"
        >
          {{ sec.title }}
          <span
            class="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {{ sec.count }}
          </span>
        </h2>
        <template v-if="groupByColor">
          <div v-for="group in sec.colorGroups" :key="group.colors">
            <div
              class="flex items-center gap-2 bg-gray-300/40 px-4 py-1.5 text-xs font-semibold text-gray-500 dark:bg-white/15 dark:text-gray-400"
            >
              <div class="flex items-center gap-0.5">
                <div
                  v-for="dot in group.colorDots"
                  :key="dot.name"
                  class="inline-block h-2.5 w-2.5 rounded-full"
                  :style="{ background: dot.hex }"
                />
              </div>
              <span>{{ group.colors }}</span>
              <span class="text-gray-400">({{ group.rows.length }})</span>
              <span class="ml-auto font-mono tabular-nums">
                {{ group.totalDecks }} decks / {{ group.totalWins }} wins
              </span>
            </div>
            <div class="divide-y divide-gray-500/10 dark:divide-white/5">
              <button
                v-for="row in group.rows"
                :key="row.archetype"
                class="group flex w-full cursor-pointer items-baseline gap-2 py-2.5 pr-4 pl-6 text-left hover:bg-gray-200/50 dark:hover:bg-white/15"
                @click="openDetail(row, sec.seriesKey)"
              >
                <ArchetypeName :row="row" hide-color-dots hide-color-name />
                <span
                  class="ml-auto pl-2 text-xs text-gray-400 transition-colors group-hover:text-sora dark:text-gray-500"
                >
                  ▶
                </span>
              </button>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="divide-y divide-gray-500/10 dark:divide-white/5">
            <button
              v-for="row in sec.winRows"
              :key="row.archetype"
              class="group flex w-full cursor-pointer items-baseline gap-2 px-4 py-2.5 text-left hover:bg-gray-200/50 dark:hover:bg-white/15"
              @click="openDetail(row, sec.seriesKey)"
            >
              <ArchetypeName :row="row" />
              <span
                class="ml-auto pl-2 text-xs text-gray-400 transition-colors group-hover:text-sora dark:text-gray-500"
              >
                ▶
              </span>
            </button>
          </div>
        </template>
        <button
          v-if="sec.zeroRows.length"
          class="w-full cursor-pointer py-2 text-center text-xs font-medium text-ruri"
          @click="zeroVisible[sec.key] = !zeroVisible[sec.key]"
        >
          0 Wins（{{ sec.zeroRows.length }}）{{ zeroVisible[sec.key] ? '−' : '+' }}
        </button>
        <div v-if="zeroVisible[sec.key]">
          <template v-if="groupByColor">
            <div v-for="group in sec.zeroGroups" :key="group.colors">
              <div
                class="flex items-center gap-2 bg-gray-300/40 px-4 py-1.5 text-xs font-semibold text-gray-500 dark:bg-white/15 dark:text-gray-400"
              >
                <div class="flex items-center gap-0.5">
                  <div
                    v-for="dot in group.colorDots"
                    :key="dot.name"
                    class="inline-block h-2.5 w-2.5 rounded-full"
                    :style="{ background: dot.hex }"
                  />
                </div>
                <span>{{ group.colors }}</span>
                <span class="text-gray-400">({{ group.rows.length }})</span>
                <span class="ml-auto font-mono tabular-nums">
                  {{ group.totalDecks }} decks / {{ group.totalWins }} wins
                </span>
              </div>
              <div class="divide-y divide-gray-500/10 dark:divide-white/5">
                <button
                  v-for="row in group.rows"
                  :key="row.archetype"
                  class="group flex w-full cursor-pointer items-baseline gap-2 py-2.5 pr-4 pl-6 text-left hover:bg-gray-200/50 dark:hover:bg-white/15"
                  @click="openDetail(row, sec.seriesKey)"
                >
                  <ArchetypeName :row="row" hide-color-dots hide-color-name />
                  <span
                    class="ml-auto pl-2 text-xs text-gray-400 transition-colors group-hover:text-sora dark:text-gray-500"
                  >
                    ▶
                  </span>
                </button>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="divide-y divide-gray-500/10 dark:divide-white/5">
              <button
                v-for="row in sec.zeroRows"
                :key="row.archetype"
                class="group flex w-full cursor-pointer items-baseline gap-2 px-4 py-2.5 text-left hover:bg-gray-200/50 dark:hover:bg-white/15"
                @click="openDetail(row, sec.seriesKey)"
              >
                <ArchetypeName :row="row" />
                <span
                  class="ml-auto pl-2 text-xs text-gray-400 transition-colors group-hover:text-sora dark:text-gray-500"
                >
                  ▶
                </span>
              </button>
            </div>
          </template>
        </div>
      </section>
    </template>

    <ArchetypeModal
      v-if="detailArch"
      :archetype="detailArch"
      :tier="detailTier"
      @close="closeDetail"
    />
  </div>
</template>

<script setup>
import manifest from '$data/archetypes/index.json'
import { useStorage } from '@vueuse/core'

const { tierData, loadTierData } = useTierData()
const { start, finish } = useLoadingBar()
const { hideFilter } = useScrollHide(180)

await loadTierData()

const router = useRouter()
const route = useRoute()
const seriesKey = ref(loadSeries())
const groupByColor = useStorage('gcg-shift-group-color', false)

function normalizeName(name) {
  return name.replace(/[（）]/g, c => (c === '（' ? '(' : ')')).replace(/\s*\(/g, '(')
}

const seriesOptions = computed(() =>
  tierData.value.map(s => ({
    value: s.value,
    label: s.label,
  })),
)

function loadSeries() {
  const valid = tierData.value.map(s => s.value)
  return valid.includes(route.query.series) ? route.query.series : (tierData.value[0]?.value ?? '')
}

watch(seriesKey, val => {
  router.replace({ query: { series: val } })
})

const currentSeries = computed(() => tierData.value.find(s => s.value === seriesKey.value))

const prevSeriesKey = computed(() => {
  const cur = currentSeries.value
  if (!cur?.eventMinDate) {
    return ''
  }
  const prev = tierData.value
    .filter(s => s.value !== cur.value && s.eventMaxDate && s.eventMaxDate < cur.eventMinDate)
    .sort((a, b) => b.eventMaxDate.localeCompare(a.eventMaxDate))[0]
  return prev?.value ?? ''
})

const prevSeriesLabel = computed(
  () => tierData.value.find(s => s.value === prevSeriesKey.value)?.label ?? '',
)

const rowsBySeries = computed(() => {
  const map = {}
  for (const s of tierData.value) {
    map[s.value] = s.rows ?? []
  }
  return map
})

const currentNames = computed(
  () => new Set((rowsBySeries.value[seriesKey.value] ?? []).map(r => normalizeName(r.archetype))),
)

const prevNames = computed(
  () =>
    new Set((rowsBySeries.value[prevSeriesKey.value] ?? []).map(r => normalizeName(r.archetype))),
)

function sortByColor(a, b) {
  return (a.colors ?? '').localeCompare(b.colors ?? '')
}

const newRows = computed(() =>
  (rowsBySeries.value[seriesKey.value] ?? [])
    .filter(r => !prevNames.value.has(normalizeName(r.archetype)))
    .sort(sortByColor),
)

const persistedRows = computed(() =>
  (rowsBySeries.value[seriesKey.value] ?? [])
    .filter(r => prevNames.value.has(normalizeName(r.archetype)))
    .sort(sortByColor),
)

const removedRows = computed(() =>
  (rowsBySeries.value[prevSeriesKey.value] ?? [])
    .filter(r => !currentNames.value.has(normalizeName(r.archetype)))
    .sort(sortByColor),
)

const detailArch = ref(null)
const detailTier = ref(null)

const sectionEls = {}
const zeroVisible = reactive({ new: false, persisted: false, removed: false })

function setSectionRef(key) {
  return el => {
    sectionEls[key] = el
  }
}

function scrollToSection(key) {
  sectionEls[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function splitZeroWin(rows) {
  return {
    count: rows.length,
    winRows: rows.filter(r => r.wins > 0),
    zeroRows: rows.filter(r => r.wins === 0),
  }
}

function groupByRows(rows) {
  const map = {}
  for (const row of rows) {
    if (!map[row.colors]) {
      map[row.colors] = {
        colors: row.colors,
        colorDots: row.colorDots,
        rows: [],
        totalDecks: 0,
        totalWins: 0,
      }
    }
    map[row.colors].rows.push(row)
    map[row.colors].totalDecks += row.decks
    map[row.colors].totalWins += row.wins
  }
  return Object.values(map).sort((a, b) => b.totalDecks - a.totalDecks)
}

const sections = computed(() =>
  [
    {
      key: 'new',
      title: 'New Archetypes',
      seriesKey: seriesKey.value,
      ...splitZeroWin(newRows.value),
    },
    {
      key: 'persisted',
      title: 'Persisted Archetypes',
      seriesKey: seriesKey.value,
      ...splitZeroWin(persistedRows.value),
    },
    {
      key: 'removed',
      title: 'Removed Archetypes',
      seriesKey: prevSeriesKey.value,
      ...splitZeroWin(removedRows.value),
    },
  ].map(sec => ({
    ...sec,
    colorGroups: groupByColor.value ? groupByRows(sec.winRows) : [],
    zeroGroups: groupByColor.value ? groupByRows(sec.zeroRows) : [],
  })),
)

function closeDetail() {
  detailArch.value = null
  detailTier.value = null
}

async function openDetail(row, seriesVal) {
  if (!seriesVal) {
    return
  }
  const entry = manifest.find(s => s.value === seriesVal)
  if (!entry) {
    return
  }
  const idx = entry.archetypes.findIndex(
    a => normalizeName(a.combo) === normalizeName(row.archetype),
  )
  if (idx === -1) {
    return
  }
  start()
  const path = `/data-processed/archetypes/${seriesVal}/${idx}.json`
  try {
    const mod = await archModules[path]?.()
    detailArch.value = mod?.default ?? null
    detailTier.value = row.tier ?? null
  } catch {
    // import failed — reset silently
  } finally {
    finish()
  }
}
</script>
