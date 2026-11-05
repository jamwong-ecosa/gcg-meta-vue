import { createI18n } from 'vue-i18n'
import messages from '@/locales'

export const LOCALES = [
  { value: 'en', label: 'EN', htmlLang: 'en' },
  { value: 'zh-HK', label: '繁中', htmlLang: 'zh-Hant-HK' },
]

export const LOCALE_STORAGE_KEY = 'lang'

function initialLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (LOCALES.some(l => l.value === saved)) {
      return saved
    }
  } catch {
    // storage blocked: fall back to the browser language
  }
  return /^zh/i.test(navigator.language) ? 'zh-HK' : 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'en',
  messages,
})
