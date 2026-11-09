import { createRouter, createWebHistory } from 'vue-router'
import { useLoadingBar } from '@/composables/useLoadingBar'
import { TIER_STATE_PARAMS, pageLeaving, whenPageRendered } from '@/utils/pageRender'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomePage.vue'),
  },
  {
    path: '/tier',
    name: 'tier',
    meta: { series: true },
    component: () => import('@/views/ArchetypeTier.vue'),
  },
  {
    path: '/archetype-analysis',
    name: 'archetype-analysis',
    meta: { series: true },
    component: () => import('@/views/ArchetypeAnalysis.vue'),
  },
  {
    path: '/meta',
    name: 'meta',
    meta: { series: true },
    component: () => import('@/views/MetaOverview.vue'),
  },
]

// The tier page mirrors its filters into the query; a URL change that only
// touches those stays where it is
function onlyTierStateChanged(to, from) {
  if (to.path !== from.path) {
    return false
  }
  const keys = new Set([...Object.keys(to.query), ...Object.keys(from.query)])
  return [...keys].every(k => TIER_STATE_PARAMS.includes(k) || to.query[k] === from.query[k])
}

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (onlyTierStateChanged(to, from)) {
      return false
    }
    if (!savedPosition) {
      return { top: 0 }
    }
    // Back/forward: the position exists only once the async page has rendered
    return whenPageRendered(to.fullPath).then(() => savedPosition)
  },
})

const { start } = useLoadingBar()

router.beforeEach((to, from) => {
  if (to.path !== from.path) {
    pageLeaving()
  }
  if (to.path !== from.path) {
    start()
  }
})

export default router
