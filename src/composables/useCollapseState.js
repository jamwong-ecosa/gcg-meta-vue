const showOther = ref(false)
const showDeckUrls = ref(false)

export function useCollapseState() {
  return { showOther, showDeckUrls }
}
