const tierData = ref([])
const tierDataLoaded = ref(false)
let loading = null

export function useTierData() {
  async function loadTierData() {
    if (tierDataLoaded.value) {
      return
    }
    if (loading) {
      return loading
    }
    loading = (async () => {
      try {
        const mod = await import('$data/tiers.json')
        tierData.value = mod.default ?? []
        tierDataLoaded.value = true
      } catch {
        tierData.value = []
        tierDataLoaded.value = true
      }
    })()
    return loading
  }

  return { tierData, tierDataLoaded, loadTierData }
}
