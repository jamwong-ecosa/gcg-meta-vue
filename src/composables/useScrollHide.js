import { useScroll } from '@vueuse/core'

// Returns a reactive `hideFilter` ref that hides the filter bar when
// scrolling down past `threshold` px, and shows it after pausing upward
// scroll for `showDelay` ms. The delay resets on every scroll-up event,
// so the bar only reappears when the user stops scrolling upward.
export function useScrollHide(threshold = 120, showDelay = 500) {
  const hideFilter = ref(false)

  let prevY = 0
  let showTimer = null

  useScroll(document, {
    onScroll: () => {
      const currentY = window.scrollY
      if (currentY <= threshold) {
        clearTimer()
        hideFilter.value = false
      } else if (currentY > prevY) {
        // scrolling down → hide immediately, cancel any pending show
        clearTimer()
        hideFilter.value = true
      } else if (currentY < prevY) {
        // scrolling up → restart the show delay
        clearTimer()
        showTimer = setTimeout(() => {
          hideFilter.value = false
          showTimer = null
        }, showDelay)
      }
      prevY = currentY
    },
  })

  function clearTimer() {
    if (showTimer) {
      clearTimeout(showTimer)
      showTimer = null
    }
  }

  return { hideFilter }
}
