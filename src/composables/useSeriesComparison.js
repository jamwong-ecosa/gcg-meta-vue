export function useSeriesComparison({ currentSeries, previousSeries }) {
  const currentTopColor = computed(() => {
    const data = currentSeries.value?.colorComboData ?? []
    const items = [...data].sort((a, b) => b.decks - a.decks)
    return items[0]?.colors ?? null
  })

  const previousTopColor = computed(() => {
    const data = previousSeries.value?.colorComboData ?? []
    const items = [...data].sort((a, b) => b.decks - a.decks)
    return items[0]?.colors ?? null
  })

  const seriesComparison = computed(() => {
    const current = currentSeries.value
    const prev = previousSeries.value
    if (!current || !prev) {
      return null
    }
    const topColor = currentTopColor.value
    const makeMetric = (label, currentVal, previousVal, format = v => v) => ({
      label,
      current: currentVal,
      previous: previousVal,
      diff: currentVal - previousVal,
      format,
    })
    const currentT1Share =
      (current.rows.filter(r => r.tier === 'T1' || r.tier === 'T1.5').length /
        current.rows.length) *
      100
    const prevT1Share =
      (prev.rows.filter(r => r.tier === 'T1' || r.tier === 'T1.5').length / prev.rows.length) * 100
    return {
      metrics: [
        makeMetric('Events', current.events, prev.events),
        makeMetric('Total decks', current.totalDecks, prev.totalDecks),
        makeMetric('Win decks', current.winDecks, prev.winDecks),
        makeMetric('Archetypes', current.rows.length, prev.rows.length),
        makeMetric('T1 + T1.5%', currentT1Share, prevT1Share, v => `${v.toFixed(1)}%`),
      ],
      topColor: { current: topColor, previous: previousTopColor.value },
    }
  })

  const cardStateComparison = computed(() => {
    const current = currentSeries.value
    const prev = previousSeries.value
    if (!current?.cardState || !prev?.cardState) {
      return null
    }
    const currentState = current.cardState
    const prevState = prev.cardState
    const makeMetric = (label, currentVal, previousVal, format = v => v) => ({
      label,
      current: currentVal,
      previous: previousVal,
      diff: currentVal - previousVal,
      format,
    })
    const currentUsedPct =
      currentState.releasedCards > 0
        ? (currentState.usedCards / currentState.releasedCards) * 100
        : 0
    const prevUsedPct =
      prevState.releasedCards > 0 ? (prevState.usedCards / prevState.releasedCards) * 100 : 0
    const currentTopColor =
      Object.entries(currentState.usedByColor).sort((a, b) => b[1] - a[1])[0]?.[0] || null
    const prevTopColor =
      Object.entries(prevState.usedByColor).sort((a, b) => b[1] - a[1])[0]?.[0] || null
    return {
      metrics: [
        makeMetric('Released', currentState.releasedCards, prevState.releasedCards),
        makeMetric('Used', currentState.usedCards, prevState.usedCards),
        makeMetric('Unused', currentState.unusedCards, prevState.unusedCards),
        makeMetric('Used %', currentUsedPct, prevUsedPct, v => `${v.toFixed(1)}%`),
      ],
      topColor: { current: currentTopColor, previous: prevTopColor },
    }
  })

  return {
    seriesComparison,
    cardStateComparison,
  }
}
