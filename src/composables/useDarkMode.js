import { useDark, useToggle } from '@vueuse/core'

export const isDark = useDark({
  storageKey: 'dark-mode',
})

export const toggleDark = useToggle(isDark)
