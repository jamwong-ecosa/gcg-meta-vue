import { useStorage } from '@vueuse/core'

export function useColorFilter() {
  return useStorage('gcg-color-filter', null)
}
