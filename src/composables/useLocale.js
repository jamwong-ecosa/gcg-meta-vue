import { i18n, LOCALES, LOCALE_STORAGE_KEY } from '@/i18n'

const locale = i18n.global.locale

function applyLocale(value) {
  const entry = LOCALES.find(l => l.value === value) ?? LOCALES[0]
  document.documentElement.lang = entry.htmlLang
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, entry.value)
  } catch {
    // storage blocked: the choice lasts for this visit only
  }
}

applyLocale(locale.value)
watch(locale, applyLocale)

export function useLocale() {
  const toggleLocale = () => {
    const i = LOCALES.findIndex(l => l.value === locale.value)
    locale.value = LOCALES[(i + 1) % LOCALES.length].value
  }
  return { locale, locales: LOCALES, toggleLocale }
}

// For plain JS outside components (utils, module-level constants); reactive
// when called inside a computed or template
export const translate = (...args) => i18n.global.t(...args)

// Display name for a card color key such as 'Blue'
export const colorName = color =>
  i18n.global.te(`common.color.${color}`) ? translate(`common.color.${color}`) : color

// Display name for a card type key such as 'UNIT'
export const cardTypeName = type =>
  i18n.global.te(`common.cardType.${type}`) ? translate(`common.cardType.${type}`) : type

// Display name for a color combo key such as 'Red+White'
export const comboName = combo =>
  (combo ?? '')
    .split('+')
    .map(c => colorName(c.trim()))
    .join('+')
