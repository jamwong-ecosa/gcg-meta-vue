import NProgress from 'nprogress'

NProgress.configure({ showSpinner: false })

let count = 0
let timer = null

export function useLoadingBar() {
  return {
    start: () => {
      count++
      if (count === 1) {
        timer = setTimeout(() => NProgress.start(), 200)
      }
    },
    finish: () => {
      count = Math.max(0, count - 1)
      if (count === 0) {
        clearTimeout(timer)
        NProgress.done()
      }
    },
  }
}
