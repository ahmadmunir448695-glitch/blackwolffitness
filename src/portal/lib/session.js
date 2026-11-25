import { computed, reactive } from 'vue'
import { getToken, http, onUnauthorized, setToken } from './api.js'

/**
 * Signed-in user, shared by every portal page.
 *   session.user        null when signed out
 *   session.ready       true once the stored token has been checked
 */
export const session = reactive({ user: null, ready: false, checking: null })

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  organizer: 'Event Organizer',
  club_manager: 'Club Manager',
  coach: 'Coach',
  athlete: 'Athlete',
}

export const role = computed(() => session.user?.role ?? null)
export const isAdmin = computed(() => role.value === 'super_admin' || role.value === 'organizer')
export const isSuperAdmin = computed(() => role.value === 'super_admin')
export const isClubUser = computed(() => role.value === 'club_manager' || role.value === 'coach')
export const isManager = computed(() => role.value === 'club_manager')

/** Check the stored token once; later calls reuse the same promise. */
export function ensureSession() {
  if (session.ready) return Promise.resolve(session.user)
  if (session.checking) return session.checking
  if (!getToken()) {
    session.ready = true
    return Promise.resolve(null)
  }
  session.checking = http
    .get('/auth/me')
    .then((data) => (session.user = data.user))
    .catch(() => {
      setToken('')
      session.user = null
    })
    .finally(() => {
      session.ready = true
      session.checking = null
    })
  return session.checking
}

function start(data) {
  setToken(data.token)
  session.user = data.user
  session.ready = true
  return data.user
}

export const login = (email, password) => http.post('/auth/login', { email, password }).then(start)
export const signup = (form) => http.post('/auth/signup', form).then(start)
export const changePassword = (body) => http.post('/auth/change-password', body).then(start)

export async function refreshUser() {
  const data = await http.get('/auth/me')
  session.user = data.user
  return data.user
}

export function logout() {
  setToken('')
  session.user = null
}

export function setUnread(n) {
  if (session.user) session.user.unread_notifications = n
}

// Token expired or revoked elsewhere: drop it so guards send the user to sign in.
onUnauthorized(() => logout())

/** Where a user lands after signing in. */
export function homeFor(user) {
  if (!user) return '/portal/events'
  if (user.role === 'super_admin' || user.role === 'organizer') return '/portal/admin'
  return '/portal'
}
