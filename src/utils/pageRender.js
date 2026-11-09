// Pages load their data in an async setup behind App's <Suspense>, so on back or
// forward the saved scroll position only exists once the page has rendered. App
// reports each render (pageRendered) and the router's scrollBehavior waits for
// it (whenPageRendered)
let renderedPath = null
let onRendered = null

export function pageRendered(fullPath) {
  renderedPath = fullPath
  onRendered?.()
}

// A new page is on its way: an earlier render no longer counts
export function pageLeaving() {
  renderedPath = null
}

// Resolves once the page at fullPath has rendered, or after `ms` regardless
export function whenPageRendered(fullPath, ms = 3000) {
  if (renderedPath === fullPath) {
    return Promise.resolve()
  }
  return new Promise(resolve => {
    const done = () => {
      clearTimeout(timer)
      onRendered = null
      resolve()
    }
    const timer = setTimeout(done, ms)
    onRendered = () => {
      if (renderedPath === fullPath) {
        done()
      }
    }
  })
}

// Query params holding the tier page's filters, sort and 0-win list (see
// useTierList). A URL change touching only these keeps the scroll position
export const TIER_STATE_PARAMS = ['q', 'colors', 'sort', 'zero']
