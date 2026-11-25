/**
 * Championship portal routes, mounted under /portal by src/router/index.js.
 *
 * meta.auth   sign-in required
 * meta.roles  roles allowed (default: any signed-in user)
 * meta.guest  only for signed-out visitors (sign in / sign up)
 */
import { ensureSession, homeFor, session } from './lib/session.js'

const CLUB = ['club_manager', 'coach']
const ADMIN = ['super_admin', 'organizer']

const view = (name) => () => import(`./views/${name}.vue`)
const admin = (name) => () => import(`./views/admin/${name}.vue`)

export const portalRoutes = [
  {
    path: '/portal',
    component: () => import('./layouts/PortalLayout.vue'),
    meta: { portal: true },
    children: [
      { path: '', name: 'portal-dashboard', component: view('DashboardView'), meta: { auth: true, title: 'Dashboard', roles: [...CLUB, 'athlete'] } },
      { path: 'login', name: 'portal-login', component: view('LoginView'), meta: { guest: true, title: 'Sign in' } },
      { path: 'signup', name: 'portal-signup', component: view('SignupView'), meta: { guest: true, title: 'Create a club account' } },
      { path: 'events', name: 'portal-events', component: view('EventsView'), meta: { title: 'Championships' } },
      { path: 'events/:slug', name: 'portal-event', component: view('EventDetailView'), meta: { title: 'Championship' } },
      { path: 'team', name: 'portal-team', component: view('TeamView'), meta: { auth: true, roles: CLUB, title: 'My Team' } },
      { path: 'team/:id', name: 'portal-team-detail', component: view('TeamDetailView'), meta: { auth: true, roles: CLUB, title: 'Team' } },
      { path: 'register', name: 'portal-register', component: view('RegisterWizardView'), meta: { auth: true, roles: CLUB, title: 'Registration' } },
      { path: 'entries', name: 'portal-entries', component: view('EntriesView'), meta: { auth: true, roles: [...CLUB, 'athlete'], title: 'My Entries' } },
      { path: 'entries/:id', name: 'portal-entry', component: view('EntryDetailView'), meta: { auth: true, roles: [...CLUB, 'athlete'], title: 'Entry' } },
      { path: 'athletes', name: 'portal-athletes', component: view('AthletesView'), meta: { auth: true, roles: CLUB, title: 'Athletes' } },
      { path: 'athletes/:id', name: 'portal-athlete', component: view('AthleteDetailView'), meta: { auth: true, title: 'Athlete' } },
      { path: 'coaches', name: 'portal-coaches', component: view('CoachesView'), meta: { auth: true, roles: CLUB, title: 'Coaches' } },
      { path: 'documents', name: 'portal-documents', component: view('DocumentsView'), meta: { auth: true, roles: [...CLUB, 'athlete'], title: 'Certificates & Documents' } },
      { path: 'notifications', name: 'portal-notifications', component: view('NotificationsView'), meta: { auth: true, title: 'Notifications' } },
      { path: 'profile', name: 'portal-profile', component: view('ProfileView'), meta: { auth: true, title: 'Profile & Settings' } },

      { path: 'admin', name: 'admin-dashboard', component: admin('AdminDashboardView'), meta: { auth: true, roles: ADMIN, title: 'Admin overview' } },
      { path: 'admin/events', name: 'admin-events', component: admin('AdminEventsView'), meta: { auth: true, roles: ADMIN, title: 'Manage championships' } },
      { path: 'admin/events/new', name: 'admin-event-new', component: admin('AdminEventEditView'), meta: { auth: true, roles: ADMIN, title: 'New championship' } },
      { path: 'admin/events/:id', name: 'admin-event', component: admin('AdminEventEditView'), meta: { auth: true, roles: ADMIN, title: 'Edit championship' } },
      { path: 'admin/registrations', name: 'admin-registrations', component: admin('AdminRegistrationsView'), meta: { auth: true, roles: ADMIN, title: 'Registrations' } },
      { path: 'admin/registrations/:id', name: 'admin-registration', component: admin('AdminRegistrationDetailView'), meta: { auth: true, roles: ADMIN, title: 'Review entry' } },
      { path: 'admin/payments', name: 'admin-payments', component: admin('AdminPaymentsView'), meta: { auth: true, roles: ADMIN, title: 'Payments' } },
      { path: 'admin/teams', name: 'admin-teams', component: admin('AdminTeamsView'), meta: { auth: true, roles: ADMIN, title: 'Participating teams' } },
      { path: 'admin/athletes', name: 'admin-athletes', component: admin('AdminAthletesView'), meta: { auth: true, roles: ADMIN, title: 'All athletes' } },
      { path: 'admin/reports', name: 'admin-reports', component: admin('AdminReportsView'), meta: { auth: true, roles: ADMIN, title: 'Reports & exports' } },
      { path: 'admin/users', name: 'admin-users', component: admin('AdminUsersView'), meta: { auth: true, roles: ['super_admin'], title: 'Users' } },
      { path: 'admin/audit', name: 'admin-audit', component: admin('AdminAuditView'), meta: { auth: true, roles: ['super_admin'], title: 'Audit log' } },
      { path: ':pathMatch(.*)*', redirect: '/portal' },
    ],
  },
  { path: '/championships', redirect: '/portal/events' },
]

/** Sign-in and role checks, page title and noindex for portal pages. */
export function installPortalGuards(router) {
  router.beforeEach(async (to) => {
    if (!to.matched.some((r) => r.meta.portal)) return true
    await ensureSession()
    const user = session.user
    if (to.meta.guest && user) return homeFor(user)
    // The Championships menu item lands here; visitors see the event list.
    if (to.name === 'portal-dashboard' && !user) return { name: 'portal-events' }
    if (to.meta.auth && !user) return { name: 'portal-login', query: { redirect: to.fullPath } }
    if (to.meta.roles && user && !to.meta.roles.includes(user.role)) {
      const home = homeFor(user)
      return to.path === home ? '/portal/events' : home
    }
    return true
  })

  router.afterEach((to) => {
    if (!to.matched.some((r) => r.meta.portal)) {
      document.querySelector('meta[name="robots"][data-portal]')?.remove()
      return
    }
    document.title = `${to.meta.title || 'Championship Portal'} · Championship Portal · Black Wolf Fitness Club`
    let robots = document.querySelector('meta[name="robots"][data-portal]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      robots.setAttribute('data-portal', '')
      document.head.appendChild(robots)
    }
    // Championship pages may be indexed; account pages may not.
    robots.setAttribute('content', to.name === 'portal-events' || to.name === 'portal-event' ? 'index, follow' : 'noindex, nofollow')
  })
}
