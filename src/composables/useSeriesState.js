export function useSeriesState() {
  const { tierData } = useTierData()
  const { seriesOptions, seriesKey: selectedKey } = useSelectedSeries()

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
      return translate('ui.timeline.until', { date: max })
    }
    if (!max) {
      return translate('ui.timeline.from', { date: min })
    }
    return `${min} → ${max}`
  })

  const allRows = computed(() => currentSeries.value?.rows ?? [])
  const totalArchetypes = computed(() => allRows.value.length)

  const quadrantData = computed(() =>
    allRows.value.map(r => ({
      archetype: r.archetype,
      usePct: r.usePct,
      winPerDk: r.winPerDk,
      winPerEv: r.winPerEv,
      score: r.score,
      decks: r.decks,
      wins: r.wins,
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
    allRows,
    totalArchetypes,
    quadrantData,
  }
}
