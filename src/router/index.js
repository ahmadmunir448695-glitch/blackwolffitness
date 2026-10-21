import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { programSlugs, coachSlugs } from '@/services/catalog.js'
import { isLive } from '@/services/api/config.js'
import { staticPages } from '@/seo/pages.js'
import { applyPageMeta } from '@/seo/usePageMeta.js'

/**
 * Unknown slugs go to the 404 page while data is local. Once a resource is
 * served by the API, new slugs are allowed through and the page itself shows
 * "not found" if the API returns 404.
 */
function guardSlug(resource, knownSlugs) {
  return (to) => {
    if (isLive(resource) || knownSlugs.includes(to.params.slug)) return true
    return { name: 'not-found', params: { pathMatch: to.path.slice(1).split('/') }, query: to.query, hash: to.hash }
  }
}

export const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { page: 'home' } },
  { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue'), meta: { page: 'about' } },
  { path: '/services', name: 'services', component: () => import('@/views/ServicesView.vue'), meta: { page: 'services' } },
  {
    path: '/services/:slug',
    name: 'service',
    component: () => import('@/views/ServiceDetailView.vue'),
    beforeEnter: guardSlug('programs', programSlugs),
    meta: { dynamicMeta: true },
  },
  { path: '/kids', redirect: '/services/special-kids-training' },
  { path: '/special-kids-training', redirect: '/services/special-kids-training' },
  { path: '/coaches', name: 'coaches', component: () => import('@/views/CoachesView.vue'), meta: { page: 'coaches' } },
  {
    path: '/coaches/:slug',
    name: 'coach',
    component: () => import('@/views/CoachProfileView.vue'),
    beforeEnter: guardSlug('coaches', coachSlugs),
    meta: { dynamicMeta: true },
  },
  { path: '/membership', name: 'membership', component: () => import('@/views/MembershipView.vue'), meta: { page: 'membership' } },
  { path: '/contact', name: 'contact', component: () => import('@/views/ContactView.vue'), meta: { page: 'contact' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { page: 'notFound' } },
]

/**
 * VITE_ROUTER_MODE picks how page addresses work:
 *   (unset)  normal URLs like /about — for the real website
 *   hash     #/about — for a single HTML file opened straight from disk
 *   memory   no address changes — for sandboxed previews that block them
 */
function pickHistory(mode) {
  if (mode === 'hash') return createWebHashHistory()
  if (mode === 'memory') return createMemoryHistory()
  return createWebHistory(import.meta.env.BASE_URL)
}

const router = createRouter({
  history: pickHistory(import.meta.env.VITE_ROUTER_MODE),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 88, behavior: 'smooth' }
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const key = to.meta.page
  if (key && staticPages[key]) {
    const page = staticPages[key]
    applyPageMeta({ ...page, path: key === 'notFound' ? undefined : page.path })
  }
})

export default router
