import manifest from '$data/archetypes/index.json'

// Data file of the same archetype (by combo) in the series that ended just
// before `seriesVal` started, or null when there isn't one
export function prevArchetypePath(seriesVal, combo) {
  const currentEntry = manifest.find(s => s.value === seriesVal)
  if (!currentEntry?.eventMinDate) {
    return null
  }
  const prevEntry = manifest
    .filter(
      s => s.value !== seriesVal && s.eventMaxDate && s.eventMaxDate < currentEntry.eventMinDate,
    )
    .sort((a, b) => b.eventMaxDate.localeCompare(a.eventMaxDate))[0]
  if (!prevEntry) {
    return null
  }
  const prevIdx = prevEntry.archetypes.findIndex(a => a.combo === combo)
  if (prevIdx < 0) {
    return null
  }
  return `/data-processed/archetypes/${prevEntry.value}/${prevIdx}.json`
}

// Combo of an archetype by its index in a series, straight from the manifest
export function archetypeCombo(seriesVal, archIdx) {
  return manifest.find(s => s.value === seriesVal)?.archetypes[archIdx]?.combo ?? null
}
