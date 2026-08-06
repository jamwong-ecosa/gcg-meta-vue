export function useSeriesState() {
  const router = useRouter()
  const route = useRoute()
  const { tierData, tierDataLoaded } = useTierData()

  const seriesOptions = computed(() =>
    tierData.value.map(s => ({
      value: s.value,
      label: s.label,
    })),
  )

  const validSeries = computed(() => tierData.value.map(s => s.value))
  const initial = computed(() => {
    if (!tierData.value.length) {
      return ''
    }
    return validSeries.value.includes(route.query.series)
      ? route.query.series
      : tierData.value[0]?.value
  })
  const selectedKey = ref(initial.value ?? '')

  watch(selectedKey, val => {
    router.replace({ query: { series: val } })
  })

  watch(tierDataLoaded, val => {
    if (val && !selectedKey.value && tierData.value.length) {
      const valid = tierData.value.map(s => s.value)
      selectedKey.value = valid.includes(route.query.series)
        ? route.query.series
        : tierData.value[0].value
    }
  })

  const currentSeries = computed(() => tierData.value.find(s => s.value === selectedKey.value))
  const totalSeriesDecks = computed(() => currentSeries.value?.totalDecks ?? 0)
  const totalSeriesWinnerDecks = computed(() => currentSeries.value?.winDecks ?? 0)

  const previousSeries = computed(() => {
    const current = currentSeries.value
    if (!current?.eventMinDate) {
      return null
    }
    const candidates = tierData.value.filter(
      s => s.value !== current.value && s.eventMaxDate && s.eventMaxDate < current.eventMinDate,
    )
    candidates.sort((a, b) => b.eventMaxDate.localeCompare(a.eventMaxDate))
    return candidates[0] || null
  })

  const eventCutoffDate = computed(() => currentSeries.value?.eventMaxDate ?? null)
  const eventMinDate = computed(() => currentSeries.value?.eventMinDate ?? null)

  const seriesTimeline = computed(() => {
    const min = currentSeries.value?.eventMinDate
    const max = currentSeries.value?.eventMaxDate
    if (!min && !max) {
      return null
    }
    if (!min) {
      return `Until ${max}`
    }
    if (!max) {
      return `From ${min}`
    }
    return `${min} → ${max}`
  })

  const { hideFilter } = useScrollHide()

  const allRows = computed(() => currentSeries.value?.rows ?? [])
  const totalArchetypes = computed(() => allRows.value.length)

  const quadrantData = computed(() =>
    allRows.value.map(r => ({
      archetype: r.archetype,
      usePct: r.usePct,
      winPerDk: r.winPerDk,
      winPerEv: r.winPerEv,
      t4PerDk: r.t4PerDk,
      score: r.score,
      decks: r.decks,
      wins: r.wins,
      top4: r.top4,
      tier: r.tier,
    })),
  )

  return {
    seriesOptions,
    selectedKey,
    currentSeries,
    totalSeriesDecks,
    totalSeriesWinnerDecks,
    previousSeries,
    eventCutoffDate,
    eventMinDate,
    seriesTimeline,
    hideFilter,
    allRows,
    totalArchetypes,
    quadrantData,
  }
}
