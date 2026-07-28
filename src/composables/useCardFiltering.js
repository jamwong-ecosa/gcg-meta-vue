import { useStorage } from '@vueuse/core'

const CARD_TYPE_OPTIONS = ['UNIT', 'PILOT', 'COMMAND', 'BASE']

export function useCardFiltering(aggregationResult) {
  const cardTab = useStorage('gcg-card-tab', 'played')
  if (cardTab.value === 'winner') {
    cardTab.value = 'archetype'
  }

  const typeTab = useStorage('gcg-type-tab', null)
  const colorFilter = useColorFilter()
  const cardTypeChart = useStorage('gcg-card-type-chart', null)

  const colorTabOptions = [
    { value: null, label: 'All' },
    ...Object.entries(COLOR_HEX).map(([label, color]) => ({
      value: label,
      label,
      dotColor: color,
    })),
  ]

  const cardMetricOptions = [
    { value: 'played', label: 'Most Played' },
    { value: 'archetype', label: 'Most Archetypes' },
  ]

  const cardTypeOptions = [
    { value: null, label: 'All' },
    ...CARD_TYPE_OPTIONS.map(t => ({ value: t, label: t })),
  ]

  const cardItems = computed(() =>
    (aggregationResult.value?.cards ?? []).filter(c => c.totalDecksIncluded >= 20),
  )

  const filteredCardItems = computed(() => {
    if (!cardTypeChart.value) {
      return cardItems.value
    }
    const typeKey = cardTypeChart.value.toUpperCase()
    return cardItems.value.filter(card => (card.type ?? '').toUpperCase() === typeKey)
  })

  const topCards = computed(() => {
    if (!aggregationResult.value) {
      return []
    }
    if (cardTab.value === 'played') {
      return aggregationResult.value.topPlayed
    }
    return [...aggregationResult.value.cards]
      .sort((a, b) => b.archetypeCount - a.archetypeCount)
      .slice(0, 10)
  })

  const topSigCards = computed(() => aggregationResult.value?.topSigCards ?? [])

  const filteredSigCards = computed(() => {
    if (!colorFilter.value) {
      return topSigCards.value
    }
    return (aggregationResult.value?.sigCards ?? [])
      .filter(c => c.color === colorFilter.value)
      .slice(0, 10)
  })

  const filteredTopCards = computed(() => {
    if (!aggregationResult.value) {
      return []
    }
    const hasFilter = colorFilter.value || typeTab.value
    if (!hasFilter) {
      return topCards.value
    }
    const cards = aggregationResult.value.cards ?? []
    const sorted =
      cardTab.value === 'played'
        ? [...cards].sort((a, b) => b.totalDecksIncluded - a.totalDecksIncluded)
        : [...cards].sort((a, b) => b.archetypeCount - a.archetypeCount)
    let filtered = sorted
    if (colorFilter.value) {
      filtered = filtered.filter(c => c.color === colorFilter.value)
    }
    if (typeTab.value) {
      filtered = filtered.filter(c => c.type === typeTab.value)
    }
    return filtered.slice(0, 10)
  })

  return {
    cardTab,
    typeTab,
    colorFilter,
    cardTypeChart,
    colorTabOptions,
    cardMetricOptions,
    cardTypeOptions,
    filteredCardItems,
    topSigCards,
    filteredSigCards,
    filteredTopCards,
  }
}
