// Keeps <title>, the meta description and their Open Graph / Twitter copies in step with
// the current route and UI language. Call once from App.vue
const OG_LOCALE = { en: 'en_US', 'zh-HK': 'zh_HK' }
const SITE_URL = import.meta.env.VITE_SITE_URL

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.append(el)
  }
  el.setAttribute('content', content)
}

export function useHeadMeta() {
  const route = useRoute()
  const i18n = useI18n()
  const t = (...args) => i18n.t(...args)

  watchEffect(() => {
    const name = route.name
    const key = name && i18n.te(`head.${String(name)}.title`) ? `head.${String(name)}` : 'head.home'
    const page = t(`${key}.title`)
    const title = key === 'head.home' ? page : t('head.titleFormat', { page })
    const description = t(`${key}.description`)

    document.title = title
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:site_name', t('head.site'))
    const ogLocale = OG_LOCALE[i18n.locale.value] ?? 'en_US'
    setMeta('property', 'og:locale', ogLocale)
    setMeta('property', 'og:locale:alternate', ogLocale === 'en_US' ? 'zh_HK' : 'en_US')
    setMeta('property', 'og:url', `${SITE_URL}${route.fullPath}`)
    setMeta('property', 'og:image:alt', t('head.imageAlt'))
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
  })
}
