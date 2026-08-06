const TYPE_ORDER = ['UNIT', 'PILOT', 'COMMAND', 'BASE']

function addDays(dateStr, days) {
  if (!dateStr) {
    return dateStr
  }
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function isReleasedByCutoff(card, cutoffDate) {
  if (!cutoffDate) {
    return true
  }
  if (!card.releaseDate) {
    return false
  }
  return addDays(card.releaseDate, 7) <= cutoffDate
}

export function useCardEligibility({
  cardMeta,
  aggregationResult,
  eventCutoffDate,
  eventMinDate,
  colorFilter,
  currentSeries,
}) {
  const eligibleCards = computed(() =>
    cardMeta.value.filter(
      c =>
        !c.id.includes('_p') &&
        TYPE_ORDER.includes(c.type) &&
        isReleasedByCutoff(c, eventCutoffDate.value),
    ),
  )

  const totalCardCount = computed(() => eligibleCards.value.length)

  const newcomerEligibleCards = computed(() => {
    const cutoff = eventCutoffDate.value
    const min = eventMinDate.value
    if (!cutoff || !min) {
      return []
    }
    return cardMeta.value.filter(
      c =>
        !c.id.includes('_p') &&
        TYPE_ORDER.includes(c.type) &&
        c.releaseDate &&
        addDays(c.releaseDate, 7) <= cutoff &&
        c.releaseDate >= addDays(min, -20),
    )
  })

  const usedCardCount = computed(() => {
    if (!aggregationResult.value) {
      return 0
    }
    const usedIds = new Set(aggregationResult.value.cards.map(c => c.cardId))
    return eligibleCards.value.filter(c => usedIds.has(c.id)).length
  })

  const recentlyUsedCards = computed(() => {
    if (!currentSeries.value || !aggregationResult.value) {
      return []
    }
    const max = currentSeries.value?.eventMaxDate
    if (!max) {
      return []
    }
    const usedMap = {}
    for (const c of aggregationResult.value.cards) {
      usedMap[c.cardId] = c
    }
    let latestRelease = null
    for (const card of newcomerEligibleCards.value) {
      if (card.releaseDate && card.releaseDate <= max) {
        if (!latestRelease || card.releaseDate > latestRelease) {
          latestRelease = card.releaseDate
        }
      }
    }
    if (!latestRelease) {
      return []
    }
    return newcomerEligibleCards.value
      .filter(c => {
        if (c.releaseDate !== latestRelease) {
          return false
        }
        if (!colorFilter.value) {
          return true
        }
        return c.color === colorFilter.value
      })
      .map(c => {
        const used = usedMap[c.id]
        return {
          cardId: c.id,
          name: c.name,
          color: c.color,
          type: c.type,
          rarity: c.rarity,
          totalDecksIncluded: used?.totalDecksIncluded || 0,
          totalWinnerDecks: used?.totalWinnerDecks || 0,
          avgQty: used?.avgQty || 0,
        }
      })
      .filter(c => c.totalDecksIncluded > 0)
      .sort((a, b) => {
        if (b.totalDecksIncluded !== a.totalDecksIncluded) {
          return b.totalDecksIncluded - a.totalDecksIncluded
        }
        return a.cardId.localeCompare(b.cardId)
      })
      .slice(0, 20)
  })

  return {
    eligibleCards,
    totalCardCount,
    usedCardCount,
    recentlyUsedCards,
  }
}
