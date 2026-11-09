// Every page and its data are lazy chunks, so the first visit to a page waits on
// a chain of requests (page code, then its data). Once the current page has
// shown, warm the other pages and the selected series' data while the browser
// is idle, so switching pages is instant. import() caches each module, so the
// pages reuse these loads
const idle = cb =>
  'requestIdleCallback' in window
    ? requestIdleCallback(cb, { timeout: 3000 })
    : setTimeout(() => cb(), 1000)

const warmed = new Set()

function warm(key, load) {
  if (warmed.has(key) || navigator.connection?.saveData) {
    return
  }
  warmed.add(key)
  load().catch(() => warmed.delete(key))
}

export function usePrefetch() {
  const router = useRouter()
  const { seriesKey } = useSelectedSeries({ pin: false })

  function prefetchPages() {
    for (const r of router.getRoutes()) {
      const comp = r.components?.default
      if (typeof comp === 'function') {
        warm(`route:${r.path}`, comp)
      }
    }
    warm('card-meta', () => import('$data/card-meta.json'))
    warm('tier-card-ids', () => import('$data/tier-card-ids.json'))
    warm('tier-staples', () => import('$data/tier-staples.json'))
    warm('arch-quadrant', () => import('@/components/archetype/ArchetypeQuadrantChart.vue'))
    warm('card-quadrant', () => import('@/components/chart/CardQuadrantChart.vue'))
  }

  // Data the series pages load first: the card stats (meta), and the first
  // archetype with its previous-series counterpart (analysis)
  function prefetchSeries(key) {
    if (!key) {
      return
    }
    const paths = [
      `/data-processed/archetypes/${key}/_cards.json`,
      `/data-processed/archetypes/${key}/0.json`,
      prevArchetypePath(key, archetypeCombo(key, 0)),
    ]
    for (const path of paths) {
      if (path && archModules[path]) {
        warm(path, archModules[path])
      }
    }
  }

  let started = false
  function start() {
    if (started) {
      return
    }
    started = true
    idle(() => {
      prefetchPages()
      prefetchSeries(seriesKey.value)
    })
    watch(seriesKey, key => idle(() => prefetchSeries(key)))
  }

  return { start }
}
