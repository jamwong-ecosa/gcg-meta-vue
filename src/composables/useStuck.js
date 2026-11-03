export function useStuck() {
  const stuckIds = ref(new Set())
  let observer = null

  function register(el, id) {
    // Function refs run on every re-render; only add one sentinel per element
    if (!el || !observer || el._stuckRegistered) {
      return
    }
    el._stuckRegistered = true
    const sentinel = document.createElement('div')
    sentinel.style.height = '1px'
    sentinel.style.marginBottom = '-1px'
    sentinel.setAttribute('aria-hidden', 'true')
    el.parentNode.insertBefore(sentinel, el)
    sentinel._targetId = id
    observer.observe(sentinel)
  }

  onMounted(() => {
    observer = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          const id = e.target._targetId
          if (e.isIntersecting) {
            stuckIds.value.delete(id)
          } else {
            stuckIds.value.add(id)
          }
        }
        stuckIds.value = new Set(stuckIds.value)
      },
      { threshold: 0 },
    )
  })

  onUnmounted(() => observer?.disconnect())

  return { stuckIds, register }
}
