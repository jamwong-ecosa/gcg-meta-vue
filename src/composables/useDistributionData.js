const TIER_ORDER = ['S', 'A', 'B', 'C', 'D', '--']

const PREVIEW_ROWS = 5

export function useDistributionData({
  currentSeries,
  previousSeries,
  allRows,
  totalSeriesDecks,
  totalSeriesWinnerDecks,
}) {
  const previousColorMap = computed(() => {
    const data = previousSeries.value?.colorComboData ?? []
    const total = previousSeries.value?.totalDecks ?? 0
    const map = {}
    for (const c of data) {
      map[c.colors] = (map[c.colors] ?? 0) + c.decks
    }
    return { map, total }
  })

  const previousWinColorMap = computed(() => {
    const data = previousSeries.value?.colorComboData ?? []
    const events = previousSeries.value?.events ?? 0
    const map = {}
    for (const c of data) {
      map[c.colors] = (map[c.colors] ?? 0) + c.wins
    }
    return { map, events }
  })

  // ── Tier distribution ──
  const tierDist = computed(() => {
    const counts = {}
    for (const row of allRows.value) {
      counts[row.tier] = (counts[row.tier] || 0) + 1
    }
    const items = TIER_ORDER.filter(t => counts[t]).map(t => ({ tier: t, count: counts[t] }))
    const maxCount = Math.max(...items.map(i => i.count), 1)
    return items.map(i => ({ ...i, percent: (i.count / maxCount) * 100 }))
  })

  // ── Color distribution ──
  const allColorDist = computed(() => {
    const source = currentSeries.value?.colorComboData
    const items = source
      ? source.map(c => {
          const dots = c.colors.split('+').map(name => ({
            name,
            hex: COLOR_HEX[name] || '#6b7280',
          }))
          return {
            colors: c.colors,
            colorDots: dots.length >= 2 ? dots : [...dots, { name: '', hex: 'transparent' }],
            decks: c.decks,
          }
        })
      : (() => {
          const map = {}
          for (const row of allRows.value) {
            const key = row.colors
            if (!map[key]) {
              map[key] = { colors: key, colorDots: row.colorDots, decks: 0 }
            }
            map[key].decks += row.decks
          }
          const items = Object.values(map).sort((a, b) => b.decks - a.decks)
          const otherDecks = totalSeriesDecks.value - items.reduce((s, i) => s + i.decks, 0)
          if (otherDecks > 0) {
            items.push({
              colors: 'Other',
              colorDots: [{ name: 'Other', hex: '#6b7280' }],
              decks: otherDecks,
              isOther: true,
            })
          }
          return items
        })()

    const maxDecks = items[0]?.decks || 1
    const totalDecks = items.reduce((sum, item) => sum + item.decks, 0)
    const hasPrevious = !!previousSeries.value
    return items.map(item => {
      const prevDecks = previousColorMap.value.map[item.colors] ?? 0
      const prevRate =
        previousColorMap.value.total > 0 ? (prevDecks / previousColorMap.value.total) * 100 : 0
      const rate = totalDecks > 0 ? (item.decks / totalDecks) * 100 : 0
      return {
        ...item,
        percent: (item.decks / maxDecks) * 100,
        rate,
        barGradient: `linear-gradient(to right, ${item.colorDots
          .filter(d => d.hex !== 'transparent')
          .map(d => d.hex)
          .join(', ')})`,
        rateDiff: hasPrevious ? rate - prevRate : undefined,
      }
    })
  })

  // Top rows shown on the overview cards; "View All" lists the rest.
  // Five matches the tier card's S–D rows so the three cards end level.
  const colorDist = computed(() =>
    allColorDist.value.filter(i => !i.isOther).slice(0, PREVIEW_ROWS),
  )

  // ── Win rate by color combo ──
  const allWinRateDist = computed(() => {
    const source = currentSeries.value?.colorComboData
    const items = source
      ? source.map(c => {
          const dots = c.colors.split('+').map(name => ({
            name,
            hex: COLOR_HEX[name] || '#6b7280',
          }))
          return {
            colors: c.colors,
            colorDots: dots.length >= 2 ? dots : [...dots, { name: '', hex: 'transparent' }],
            decks: c.decks,
            wins: c.wins,
          }
        })
      : (() => {
          const map = {}
          for (const row of allRows.value) {
            const key = row.colors
            if (!map[key]) {
              map[key] = { colors: key, colorDots: row.colorDots, decks: 0, wins: 0 }
            }
            map[key].decks += row.decks
            map[key].wins += row.wins
          }
          const items = Object.values(map)
          const sumWins = items.reduce((s, i) => s + i.wins, 0)
          const otherWins = totalSeriesWinnerDecks.value - sumWins
          if (otherWins > 0) {
            items.push({
              colors: 'Other',
              colorDots: [{ name: 'Other', hex: '#6b7280' }],
              decks: 0,
              wins: otherWins,
              isOther: true,
            })
          }
          return items
        })()

    const itemsWithRate = items
      .map(item => ({
        ...item,
        winRate: (item.wins / (currentSeries.value?.events || 1)) * 100,
      }))
      .sort((a, b) => b.winRate - a.winRate)

    const maxWinRate = Math.max(...itemsWithRate.map(i => i.winRate), 1)
    const hasPrevious = !!previousSeries.value
    return itemsWithRate.map(item => {
      const prevWins = previousWinColorMap.value.map[item.colors] ?? 0
      const prevWinRate =
        previousWinColorMap.value.events > 0
          ? (prevWins / previousWinColorMap.value.events) * 100
          : 0
      return {
        ...item,
        barPercent: (item.winRate / maxWinRate) * 100,
        barGradient: `linear-gradient(to right, ${item.colorDots
          .filter(d => d.hex !== 'transparent')
          .map(d => d.hex)
          .join(', ')})`,
        winRateDiff: hasPrevious ? item.winRate - prevWinRate : undefined,
      }
    })
  })

  const winRateDist = computed(() => allWinRateDist.value.slice(0, PREVIEW_ROWS))

  return {
    tierDist,
    allColorDist,
    colorDist,
    allWinRateDist,
    winRateDist,
  }
}
