/**
 * Client for the championship portal API (server/ in this repo).
 *
 * VITE_PORTAL_API_URL  where the API lives, e.g. https://api.example.com/api
 *                      Defaults to /api (proxied to the local server by Vite in dev).
 *
 * Auth is a Bearer token kept in localStorage; it is never put in a URL.
 */
const RAW = String(import.meta.env.VITE_PORTAL_API_URL ?? '').trim()
export const API_ROOT = (RAW || '/api').replace(/\/+$/, '')
const TOKEN_KEY = 'bw.portal.token'

let token = readToken()
const listeners = new Set()

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function getToken() {
  return token
}

export function setToken(value) {
  token = value || ''
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable: keep the token in memory for this tab */
  }
}

/** Called with the error when the server says the session is no longer valid. */
export function onUnauthorized(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export class ApiError extends Error {
  constructor(message, { status = 0, fields = null, problems = null, code = '' } = {}) {
    super(message)
    this.status = status
    this.fields = fields
    this.problems = problems
    this.code = code
  }
}

function buildUrl(path, query) {
  const url = `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue
    params.set(k, String(v))
  }
  const s = params.toString()
  return s ? `${url}?${s}` : url
}

async function request(method, path, { query, body, form, raw = false, signal } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let payload
  if (form) payload = form
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(buildUrl(path, query), { method, headers, body: payload, signal })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    throw new ApiError('Could not reach the championship server. Check your connection and try again.', { code: 'network' })
  }

  if (res.ok && raw) return res
  const type = res.headers.get('content-type') || ''
  const data = type.includes('application/json') ? await res.json().catch(() => null) : null

  if (!res.ok) {
    const message = data?.error || (res.status >= 500 ? 'The server had a problem. Please try again.' : `Request failed (${res.status}).`)
    const error = new ApiError(message, { status: res.status, fields: data?.fields ?? null, problems: data?.problems ?? null })
    if (res.status === 401 && token) listeners.forEach((fn) => fn(error))
    throw error
  }
  return data
}

export const http = {
  get: (path, query, opts) => request('GET', path, { query, ...opts }),
  post: (path, body, opts) => request('POST', path, { body, ...opts }),
  patch: (path, body) => request('PATCH', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  del: (path) => request('DELETE', path),
  /** multipart upload: fields + one file under `fileField`. */
  upload(path, file, { fileField = 'file', fields = {} } = {}) {
    const form = new FormData()
    for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== null && v !== '') form.append(k, v)
    if (file) form.append(fileField, file)
    return request('POST', path, { form })
  },
}

/** Download an authenticated file (PDF, CSV, document) and hand it to the browser. */
export async function download(path, query, fallbackName = 'download') {
  const res = await request('GET', path, { query, raw: true })
  const blob = await res.blob()
  const disposition = res.headers.get('content-disposition') || ''
  const name = /filename="?([^";]+)"?/i.exec(disposition)?.[1] || fallbackName
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Open an authenticated file (e.g. a PDF or image) in a new tab. */
export async function openFile(path) {
  const win = window.open('', '_blank')
  try {
    const res = await request('GET', path, { query: { inline: 1 }, raw: true })
    const url = URL.createObjectURL(await res.blob())
    if (win) win.location.href = url
    else window.location.href = url
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    win?.close()
    throw err
  }
}

/** Fetch an authenticated image as an object URL (for athlete photos). */
export async function imageUrl(path) {
  const res = await request('GET', path, { raw: true })
  return URL.createObjectURL(await res.blob())
}

/** Public file URLs from the API ("/api/files/…") resolved against API_ROOT. */
export function fileUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return API_ROOT + path.replace(/^\/api/, '')
}
