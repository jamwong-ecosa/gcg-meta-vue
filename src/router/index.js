import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/ArchetypeTier.vue'),
  },
  {
    path: '/archetype-analysis',
    name: 'archetype-analysis',
    component: () => import('@/views/ArchetypeAnalysis.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
