function addDays(dateStr, days) {
  if (!dateStr) {
    return dateStr
  }
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

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
  const archetypeProducts = computed(() => {
    if (!aggregationResult.value?.cards?.length) {
      return []
    }
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
    const entries = Object.entries(map).map(([name, { count, isNew }]) => ({ name, count, isNew }))
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
