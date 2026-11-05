<template>
  <div class="min-h-screen font-display dark:bg-nalika-bg dark:text-nalika-text-muted">
    <!-- Fixed, not sticky: the series row folding away must not change the page's
         layout, or the content jumps, the browser corrects the scroll and that
         reads as a scroll-up that brings the row back. The spacer holds the full
         nav height instead -->
    <div
      aria-hidden="true"
      :style="{ height: navFullHeight ? `${navFullHeight}px` : 'var(--nav-h)' }"
    />
    <nav
      ref="navRef"
      class="fixed inset-x-0 top-0 z-999 w-full border-b border-gray-500/10 bg-white px-4 py-2 dark:bg-nalika-surface"
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
      <!-- Below lg the series picker gets a slim row of its own: a small pill
           sized to its label, not a full-width box. It folds away on scroll-down
           and comes back on scroll-up (unclipped while its menu is open) -->
      <div
        v-if="showSeries"
        ref="seriesTrackRef"
        class="grid transition-[grid-template-rows] duration-300 lg:hidden"
        :class="hideSeries ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'"
      >
        <div class="min-h-0 overflow-hidden has-aria-expanded:overflow-visible">
          <div ref="seriesRowRef" class="flex min-w-0 items-center gap-2 pt-1.5">
            <span class="shrink-0 text-xs text-gray-500 dark:text-gray-400">
              {{ $t('common.nav.series') }}
            </span>
            <UiGeneralDropdown
              v-model="seriesKey"
              class="min-w-0"
              compact
              :options="seriesOptions"
            />
          </div>
        </div>
      </div>
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
const { hideFilter: hideSeries } = useScrollHide()

useHeadMeta()

loadTierData()

// Pages offset their sticky bars by the nav height, which grows when the
// series dropdown wraps to its own row on smaller screens
const navRef = useTemplateRef('navRef')
const { height: navHeight } = useElementSize(navRef, undefined, { box: 'border-box' })

// Spacer height: the nav as if the series row were showing, so folding the row
// never shifts the page (the row keeps its own height inside the 0fr track)
const box = { box: 'border-box' }
const { height: seriesTrackH } = useElementSize(useTemplateRef('seriesTrackRef'), undefined, box)
const { height: seriesRowH } = useElementSize(useTemplateRef('seriesRowRef'), undefined, box)
const navFullHeight = computed(() => navHeight.value - seriesTrackH.value + seriesRowH.value)
watchEffect(() => {
  if (navHeight.value) {
    document.documentElement.style.setProperty('--nav-h', `${navHeight.value}px`)
  }
})

function onResolve() {
  finish()
}
</script>
