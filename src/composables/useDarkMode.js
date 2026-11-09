import { useDark, useToggle } from '@vueuse/core'

export const isDark = useDark({
  storageKey: 'dark-mode',
})

export const toggleDark = useToggle(isDark)

// Browser / installed-app title bar follows the nav bar colour
watchEffect(() => {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', isDark.value ? '#1b2a47' : '#ffffff')
})
