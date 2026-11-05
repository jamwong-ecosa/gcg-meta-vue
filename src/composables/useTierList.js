import { useStorage } from '@vueuse/core'
import cardMeta from '$data/card-meta.json'

const TIER_ORDER = ['S', 'A', 'B', 'C', 'D', '--']

// Sortable fields; 'rank' is the tier order (strongest first). Labels are
// `tier.col.*` keys, translated where they render
export const TIER_SORT_OPTIONS = [
  { key: 'rank', labelKey: 'tier.col.rank' },
  { key: 'score', labelKey: 'tier.col.score' },
  { key: 'use', labelKey: 'tier.col.use' },
  { key: 'winEv', labelKey: 'tier.col.winEv' },
  { key: 'winDk', labelKey: 'tier.col.winDk' },
  { key: 'decks', labelKey: 'tier.col.decks' },
  { key: 'wins', labelKey: 'tier.col.wins' },
  { key: 'top4', labelKey: 'tier.col.top4' },
  { key: 'move', labelKey: 'tier.col.move' },
]

// Every card each archetype plays ({ [series]: { [archetype]: [cardId, …] } }),
// kept out of tiers.json and loaded the first time someone types a search;
// shared by every tier page instance for the rest of the visit
const cardIdIndex = shallowRef(null)
let cardIdsLoading = null
function loadCardIds() {
  cardIdsLoading ??= import('$data/tier-card-ids.json')
    .then(mod => {
      cardIdIndex.value = mod.default ?? {}
    })
    .catch(() => {
      cardIdIndex.value = {}
    })
}

// "gd05-033", "GD05033", "gd05 033" → "gd05033". Only 3+ characters with a
// digit count as a card number, so names and a stray "5" never match an ID
function cardNumberQuery(q) {
  const num = q.toLowerCase().replace(/[^a-z0-9]/g, '')
  return num.length >= 3 && /\d/.test(num) ? num : ''
}

// Card number → lower-cased name, to search any played card by name
const cardNameById = new Map(cardMeta.map(c => [c.id, (c.name ?? '').toLowerCase()]))

// Filtering, sorting and sectioning for the tier page. Both the desktop table
// and the mobile list render `sections` + `zeroRows`, so they always agree.
// `seriesKey` picks the series in the played-card index
export function useTierList({ allRows, previousSeries, seriesKey }) {
  const query = ref('')
  // Two characters is enough: some card names are that short
  watch(query, q => {
    if (q.trim().length >= 2) {
      loadCardIds()
    }
  })
  const colors = ref([])
  const groupByColor = useStorage('gcg-group-color', false)
  const sortKey = ref('rank')
  const sortDir = ref('asc')
  // Every section starts open; headers fold on click
  const collapsed = ref(new Set())
  const showZeroWins = ref(false)

  const prevByName = computed(() => {
    const map = new Map()
    for (const [i, r] of (previousSeries.value?.rows ?? []).entries()) {
      map.set(normalizeArchetypeName(r.archetype), { rank: i + 1, tier: r.tier })
    }
    return map
  })
  const hasMovement = computed(() => prevByName.value.size > 0)

  // Rows arrive sorted by strength, so the index is the rank
  const ranked = computed(() =>
    allRows.value.map((r, i) => {
      const rank = i + 1
      const prev = hasMovement.value
        ? prevByName.value.get(normalizeArchetypeName(r.archetype))
        : null
      return {
        ...r,
        rank,
        use: parseFloat(r.usePct),
        winEv: parseFloat(r.winPerEv),
        winDk: parseFloat(r.winPerDk),
        move: !hasMovement.value
          ? null
          : prev
            ? { delta: prev.rank - rank, prevRank: prev.rank, prevTier: prev.tier }
            : { isNew: true },
      }
    }),
  )

  const isFiltered = computed(() => !!query.value.trim() || colors.value.length > 0)
  const isDefaultSort = computed(() => sortKey.value === 'rank' && sortDir.value === 'asc')

  function matches(r) {
    const q = query.value.trim().toLowerCase()
    if (
      q &&
      !r.archetype.toLowerCase().includes(q) &&
      !comboName(r.colors).toLowerCase().includes(q) &&
      !matchesPlayedCard(r, q)
    ) {
      return false
    }
    const rowColors = r.colors.split('+')
    return colors.value.every(c => rowColors.includes(c))
  }

  // Any card the archetype plays, by name or card number. Until the index has
  // loaded (or with older data that has none) only the signature cards count
  function matchesPlayedCard(r, q) {
    const num = cardNumberQuery(q)
    const ids = cardIdIndex.value?.[seriesKey?.value]?.[r.archetype] ?? r.sigCardIds ?? []
    return ids.some(
      id =>
        (q.length >= 2 && cardNameById.get(id)?.includes(q)) ||
        (num &&
          id
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .includes(num)),
    )
  }

  function sortValue(r) {
    if (sortKey.value === 'move') {
      // New archetypes count as the biggest climbers
      return r.move?.isNew ? Infinity : (r.move?.delta ?? -Infinity)
    }
    return r[sortKey.value] ?? 0
  }

  function sorted(list) {
    const dir = sortDir.value === 'asc' ? 1 : -1
    return [...list].sort((a, b) => {
      const va = sortValue(a)
      const vb = sortValue(b)
      return va === vb ? a.rank - b.rank : (va < vb ? -1 : 1) * dir
    })
  }

  const visibleRows = computed(() => ranked.value.filter(r => r.wins > 0 && matches(r)))
  const zeroRows = computed(() => sorted(ranked.value.filter(r => r.wins === 0 && matches(r))))

  const sections = computed(() => {
    const rows = visibleRows.value
    if (groupByColor.value) {
      const map = new Map()
      for (const r of rows) {
        if (!map.has(r.colors)) {
          map.set(r.colors, {
            key: `color-${r.colors}`,
            kind: 'color',
            label: comboName(r.colors),
            colorDots: r.colorDots,
            rows: [],
            decks: 0,
            wins: 0,
          })
        }
        const g = map.get(r.colors)
        g.rows.push(r)
        g.decks += r.decks
        g.wins += r.wins
      }
      return [...map.values()]
        .sort((a, b) => b.decks - a.decks)
        .map(g => ({ ...g, rows: sorted(g.rows) }))
    }
    if (isDefaultSort.value) {
      return TIER_ORDER.map(tier => {
        const tierRows = rows.filter(r => r.tier === tier)
        return {
          key: `tier-${tier}`,
          kind: 'tier',
          tier,
          rows: tierRows,
          decks: tierRows.reduce((s, r) => s + r.decks, 0),
          wins: tierRows.reduce((s, r) => s + r.wins, 0),
        }
      }).filter(s => s.rows.length)
    }
    return [{ key: 'all', kind: 'flat', rows: sorted(rows) }]
  })

  const shownCount = computed(() => visibleRows.value.length + zeroRows.value.length)

  function setSort(key) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
      return
    }
    sortKey.value = key
    sortDir.value = key === 'rank' ? 'asc' : 'desc'
  }

  function toggleColor(color) {
    colors.value = colors.value.includes(color)
      ? colors.value.filter(c => c !== color)
      : [...colors.value, color]
  }

  function toggleSection(key) {
    const next = new Set(collapsed.value)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    collapsed.value = next
  }

  function clearFilters() {
    query.value = ''
    colors.value = []
  }

  return {
    query,
    colors,
    groupByColor,
    sortKey,
    sortDir,
    collapsed,
    showZeroWins,
    hasMovement,
    isFiltered,
    sections,
    zeroRows,
    shownCount,
    setSort,
    toggleColor,
    toggleSection,
    clearFilters,
  }
}
