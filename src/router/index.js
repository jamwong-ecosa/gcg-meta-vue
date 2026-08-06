import { createRouter, createWebHistory } from 'vue-router'
import { useLoadingBar } from '@/composables/useLoadingBar'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomePage.vue'),
  },
  {
    path: '/tier',
    name: 'tier',
    component: () => import('@/views/ArchetypeTier.vue'),
  },
  {
    path: '/archetype-analysis',
    name: 'archetype-analysis',
    component: () => import('@/views/ArchetypeAnalysis.vue'),
  },
  {
    path: '/meta',
    name: 'meta',
    component: () => import('@/views/MetaOverview.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

const { start } = useLoadingBar()

router.beforeEach((to, from) => {
  if (to.path !== from.path) {
    start()
  }
})

export default router
