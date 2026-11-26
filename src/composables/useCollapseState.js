const showOther = ref(false)
const showRemoved = ref(false)
const showUnassigned = ref(false)
// Archetype detail's Builds panel and LR units strip
const showBuilds = ref(false)
const showLrMix = ref(false)

// Module-level so a fold stays as left across archetype and series changes
export function useCollapseState() {
  return { showOther, showRemoved, showUnassigned, showBuilds, showLrMix }
}
