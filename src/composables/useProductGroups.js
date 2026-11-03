function addDays(dateStr, days) {
  if (!dateStr) {
    return dateStr
  }
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Same card set the "released" count uses: no parallel prints (_p), playable types only
const PRODUCT_CARD_TYPES = ['UNIT', 'PILOT', 'COMMAND', 'BASE']

function extractProductPrefix(name) {
  const match = name?.match(/\[([A-Z]{2})\d*\]/i)
  return match ? match[1].toUpperCase() : null
}

export function useProductGroups({
  aggregationResult,
  cardInfoById,
  eventMinDate,
  eventCutoffDate,
}) {
  // Released cards per product, so each bar can show how much of its product sees play
  const productTotals = computed(() => {
    const totals = {}
    const max = eventCutoffDate.value
    for (const card of Object.values(cardInfoById.value)) {
      const acquisition = card.acquisitionInfo?.trim()
      if (
        !acquisition ||
        card.id.includes('_p') ||
        !PRODUCT_CARD_TYPES.includes(card.type) ||
        (max && (!card.releaseDate || addDays(card.releaseDate, 7) > max))
      ) {
        continue
      }
      totals[acquisition] = (totals[acquisition] || 0) + 1
    }
    return totals
  })

  const archetypeProducts = computed(() => {
    if (!aggregationResult.value?.cards?.length) {
      return []
    }
    const totals = productTotals.value
    const map = {}
    const infoMap = cardInfoById.value
    const min = eventMinDate.value
    const max = eventCutoffDate.value
    for (const card of aggregationResult.value.cards) {
      const acquisition = infoMap[card.cardId]?.acquisitionInfo?.trim()
      if (!acquisition) {
        continue
      }
      if (!map[acquisition]) {
        map[acquisition] = { count: 0, isNew: false }
      }
      map[acquisition].count++
      if (!map[acquisition].isNew && min && max) {
        const releaseDate = infoMap[card.cardId]?.releaseDate
        if (releaseDate && addDays(releaseDate, 7) <= max && releaseDate >= addDays(min, -20)) {
          map[acquisition].isNew = true
        }
      }
    }
    const entries = Object.entries(map).map(([name, { count, isNew }]) => ({
      name,
      count,
      // Never below count, in case a used card is missing from the release data
      total: Math.max(totals[name] ?? 0, count),
      isNew,
    }))
    return entries
      .sort((a, b) => {
        const prefixA = extractProductPrefix(a.name)
        const prefixB = extractProductPrefix(b.name)
        if (prefixA && prefixB) {
          const prefixCompare = prefixA.localeCompare(prefixB)
          if (prefixCompare !== 0) {
            return prefixCompare
          }
          return b.count - a.count
        }
        if (prefixA) {
          return -1
        }
        if (prefixB) {
          return 1
        }
        return a.name.localeCompare(b.name)
      })
      .map(item => ({
        ...item,
        name: item.name.replace(/^(.+?)\s*(\[[A-Z]{2}\d*\])$/i, '$2 $1'),
      }))
  })

  const archetypeProductGroups = computed(() => {
    const groups = []
    let currentGroup = null
    for (const item of archetypeProducts.value) {
      const prefix = extractProductPrefix(item.name) || 'Other'
      if (!currentGroup || currentGroup.prefix !== prefix) {
        currentGroup = { prefix, items: [] }
        groups.push(currentGroup)
      }
      currentGroup.items.push(item)
    }
    return groups
  })

  const colorCounts = computed(() => {
    if (!aggregationResult.value?.cards?.length) {
      return []
    }
    const counts = {}
    for (const card of aggregationResult.value.cards) {
      counts[card.color] = (counts[card.color] || 0) + 1
    }
    return Object.entries(counts)
      .map(([color, count]) => ({
        color,
        count,
        hex: COLOR_HEX[color] || '#718096',
      }))
      .sort((a, b) => b.count - a.count)
  })

  return {
    archetypeProductGroups,
    colorCounts,
  }
}
