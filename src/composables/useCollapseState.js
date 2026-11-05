const showOther = ref(false)
const showRemoved = ref(false)
const showUnassigned = ref(false)

export function useCollapseState() {
  return { showOther, showRemoved, showUnassigned }
}
