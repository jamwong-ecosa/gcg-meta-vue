export function useCardData(selectedKey) {
  const aggregationResult = ref(null)
  const cardMeta = ref([])
  const { start, finish } = useLoadingBar()

  const cardInfoById = computed(() => {
    const map = {}
    for (const card of cardMeta.value) {
      if (card.id) {
        map[card.id] = card
      }
    }
    return map
  })

  async function loadCardMeta() {
    if (cardMeta.value.length) {
      return
    }
    try {
      const mod = await import('$data/card-meta.json')
      cardMeta.value = mod.default ?? []
    } catch {
      cardMeta.value = []
    }
  }

  async function loadCardData(seriesKey) {
    if (!seriesKey) {
      aggregationResult.value = null
      return
    }
    await loadCardMeta()
    start()
    try {
      const result = await aggregateCards(seriesKey)
      aggregationResult.value = result
    } catch {
      aggregationResult.value = null
    } finally {
      finish()
    }
  }

  watch(selectedKey, async val => {
    await loadCardData(val)
  })

  return {
    aggregationResult,
    cardMeta,
    cardInfoById,
    loadCardData,
  }
}
