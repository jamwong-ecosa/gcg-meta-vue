import { useScroll } from '@vueuse/core'

export function useScrollHide(threshold = 120) {
  const hideFilter = ref(false)
  let prevY = 0
  let pendingShow = false

  const { y } = useScroll(document, {
    onScroll: () => {
      const currentY = y.value
      if (currentY <= threshold) {
        hideFilter.value = false
        pendingShow = false
      } else if (currentY > prevY) {
        hideFilter.value = true
        pendingShow = false
      } else if (currentY < prevY) {
        pendingShow = true
      }
      prevY = currentY
    },
    onStop: () => {
      if (pendingShow) {
        hideFilter.value = false
        pendingShow = false
      }
    },
  })

  return { hideFilter }
}
