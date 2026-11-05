<template>
  <div class="min-h-screen font-display dark:bg-nalika-bg dark:text-nalika-text-muted">
    <nav
      ref="navRef"
      class="sticky top-0 z-999 w-full border-b border-gray-500/10 bg-white px-4 py-2 dark:bg-nalika-surface"
    >
      <div class="flex items-center">
        <div class="md:flex-1" />
        <div class="flex gap-6 md:gap-16">
          <RouterLink
            :to="{ path: '/' }"
            class="max-sm:text-sm"
            :exact-active-class="tw`font-bold text-ruri dark:text-sora`"
          >
            {{ $t('common.nav.home') }}
          </RouterLink>
          <RouterLink
            :to="{ path: '/tier', query: { series: $route.query.series } }"
            class="max-sm:text-sm"
            :active-class="tw`font-bold text-ruri dark:text-sora`"
          >
            {{ $t('common.nav.tier') }}
          </RouterLink>
          <RouterLink
            :to="{ path: '/archetype-analysis', query: { series: $route.query.series } }"
            class="max-sm:text-sm"
            :exact-active-class="tw`font-bold text-ruri dark:text-sora`"
          >
            {{ $t('common.nav.analysis') }}
          </RouterLink>
          <RouterLink
            :to="{ path: '/meta', query: { series: $route.query.series } }"
            class="max-sm:text-sm"
            :exact-active-class="tw`font-bold text-ruri dark:text-sora`"
          >
            {{ $t('common.nav.meta') }}
          </RouterLink>
        </div>
        <div class="flex min-w-0 flex-1 items-center justify-end gap-4 md:pl-6">
          <UiGeneralDropdown
            v-if="showSeries"
            v-model="seriesKey"
            class="max-w-sm min-w-0 flex-1 max-lg:hidden"
            :options="seriesOptions"
          />
          <div class="flex shrink-0 items-center gap-1">
            <UiLangToggle />
            <UiDarkToggle />
          </div>
        </div>
      </div>
      <UiGeneralDropdown
        v-if="showSeries"
        v-model="seriesKey"
        class="mt-2 lg:hidden"
        :options="seriesOptions"
      />
    </nav>

    <RouterView v-slot="{ Component }">
      <Suspense @resolve="onResolve">
        <component :is="Component" />
        <template #fallback>
          <div class="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
            {{ $t('common.loading') }}
          </div>
        </template>
      </Suspense>
    </RouterView>
  </div>
</template>

<script setup>
import { useElementSize } from '@vueuse/core'

const { finish } = useLoadingBar()

const route = useRoute()
const { loadTierData } = useTierData()
const { seriesOptions, seriesKey } = useSelectedSeries({ pin: false })
const showSeries = computed(() => !!route.meta.series)

loadTierData()

// Pages offset their sticky bars by the nav height, which grows when the
// series dropdown wraps to its own row on smaller screens
const navRef = useTemplateRef('navRef')
const { height: navHeight } = useElementSize(navRef, undefined, { box: 'border-box' })
watchEffect(() => {
  if (navHeight.value) {
    document.documentElement.style.setProperty('--nav-h', `${navHeight.value}px`)
  }
})

function onResolve() {
  finish()
}
</script>
