<template>
  <button
    class="z-50 flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:bg-nalika-surface dark:text-nalika-text-muted dark:hover:bg-nalika-bg"
    :title="$t('common.nav.switchTo', { lang: next.label })"
    :aria-label="$t('common.nav.switchTo', { lang: next.label })"
    @click="toggleLocale()"
  >
    {{ next.label }}
  </button>
</template>

<script setup>
const { locale, locales, toggleLocale } = useLocale()

// Show the language a click switches to, like most bilingual sites
const next = computed(() => {
  const i = locales.findIndex(l => l.value === locale.value)
  return locales[(i + 1) % locales.length]
})
</script>
