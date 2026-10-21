/**
 * Every API path in one place. Paths are relative to VITE_API_BASE_URL.
 * Change these to match your existing API — the rest of the app does not
 * need to know. Trailing slashes follow Django REST Framework defaults.
 */
const encode = (value) => encodeURIComponent(String(value))

export const endpoints = {
  programs: {
    list: '/programs/',
    detail: (slug) => `/programs/${encode(slug)}/`,
  },
  coaches: {
    list: '/coaches/',
    detail: (slug) => `/coaches/${encode(slug)}/`,
  },
  memberships: {
    plans: '/membership-plans/',
  },
  schedule: {
    list: '/schedule/',
  },
  contact: {
    message: '/contact/',
    trial: '/trial-requests/',
  },
}
