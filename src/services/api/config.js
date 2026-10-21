/**
 * API configuration, read from Vite environment variables (see .env.example).
 *
 * Resource switching:
 *   - VITE_API_BASE_URL empty            → every resource uses local mock data;
 *                                          forms cannot send.
 *   - VITE_API_BASE_URL set, no list     → every resource uses the API.
 *   - VITE_API_BASE_URL set + VITE_API_RESOURCES=coaches,contact
 *                                        → only those resources use the API,
 *                                          the rest stay on mock data.
 *
 * Never put secrets in VITE_* variables: they are bundled into public JS.
 */

export const API_RESOURCES = ['programs', 'coaches', 'memberships', 'schedule', 'contact']

const env = import.meta.env ?? {}

function parseList(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

/** Mutable on purpose so tests (and you, while debugging) can override it. */
export const apiConfig = {
  baseUrl: String(env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, ''),
  resources: parseList(env.VITE_API_RESOURCES),
  timeoutMs: Number(env.VITE_API_TIMEOUT_MS) || 12000,
  mockDelayMs: Number(env.VITE_MOCK_DELAY_MS) || 0,
  /**
   * fetch() credentials mode. Use 'include' if your API relies on cookies
   * (for example Django session auth across domains, with CORS configured).
   */
  credentials: 'same-origin',
  /** Extra headers sent with every request (no secrets). */
  headers: {},
}

export function isApiConfigured() {
  return Boolean(apiConfig.baseUrl)
}

/** True when the given resource should be fetched from the real API. */
export function isLive(resource) {
  if (!isApiConfigured()) return false
  if (apiConfig.resources.length === 0) return true
  return apiConfig.resources.includes(resource)
}
