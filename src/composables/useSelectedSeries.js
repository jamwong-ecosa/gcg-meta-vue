// The selected series lives in the URL (?series=), so the nav dropdown and
// every page share one value. Setting it replaces the whole query, which
// drops page-specific params such as `arch`.
//
// By default the value is pinned to the route the caller was created on: while
// the router navigates away, the page keeps its last series instead of
// reacting to the next route's query. The nav passes `{ pin: false }`.
export function useSelectedSeries({ pin = true } = {}) {
  const router = useRouter()
  const route = useRoute()
  const { tierData } = useTierData()

  const seriesOptions = computed(() =>
    tierData.value.map(s => ({
      value: s.value,
      label: s.label,
    })),
  )

  const ownRoute = pin ? route.name : null
  let last = ''

  const seriesKey = computed({
    get() {
      if (ownRoute && route.name !== ownRoute) {
        return last
      }
      const valid = tierData.value.map(s => s.value)
      last = valid.includes(route.query.series)
        ? route.query.series
        : (tierData.value[0]?.value ?? '')
      return last
    },
    set(val) {
      router.replace({ query: { series: val } })
    },
  })

  return { seriesOptions, seriesKey }
}
