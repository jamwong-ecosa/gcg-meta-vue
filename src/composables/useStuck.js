export function useStuck() {
  const stuckIds = ref(new Set())
  const entries = []
  let frame = 0

  // Stuck = the sentinel above the element has scrolled past the element's
  // sticky `top`. Read live because --nav-h is measured after mount and
  // changes when the nav wraps, so a fixed IntersectionObserver margin goes stale
  function update() {
    frame = 0
    const next = new Set()
    // Drop headers removed by filtering/regrouping; a re-added one registers anew
    for (let i = entries.length - 1; i >= 0; i--) {
      if (!entries[i].el.isConnected) {
        entries[i].sentinel.remove()
        entries.splice(i, 1)
      }
    }
    for (const { el, sentinel, id } of entries) {
      const top = parseFloat(getComputedStyle(el).top) || 0
      if (sentinel.getBoundingClientRect().top < top) {
        next.add(id)
      }
    }
    if (next.size !== stuckIds.value.size || [...next].some(id => !stuckIds.value.has(id))) {
      stuckIds.value = next
    }
  }

  function schedule() {
    frame ||= requestAnimationFrame(update)
  }

  function register(el, id) {
    // Function refs run on every re-render; only add one sentinel per element
    if (!el || el._stuckRegistered) {
      return
    }
    el._stuckRegistered = true
    const sentinel = document.createElement('div')
    sentinel.style.height = '1px'
    sentinel.style.marginBottom = '-1px'
    sentinel.setAttribute('aria-hidden', 'true')
    el.parentNode.insertBefore(sentinel, el)
    entries.push({ el, sentinel, id })
    schedule()
  }

  onMounted(() => {
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    cancelAnimationFrame(frame)
  })

  return { stuckIds, register }
}
