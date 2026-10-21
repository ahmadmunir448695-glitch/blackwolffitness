import { apiConfig } from './config.js'

/**
 * A normalised error every API function throws, so the UI can show one
 * consistent message whatever the backend returns.
 *
 *  code: 'not_configured' | 'network' | 'timeout' | 'http' | 'not_found' | 'invalid_response'
 */
export class ApiError extends Error {
  constructor(message, { status = 0, code = 'http', details = null, fieldErrors = {}, cause } = {}) {
    super(message, cause ? { cause } : undefined)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.fieldErrors = fieldErrors
  }
}

export class ApiNotConfiguredError extends ApiError {
  constructor(resource = 'api') {
    super(`The ${resource} API is not connected yet.`, { code: 'not_configured' })
    this.name = 'ApiNotConfiguredError'
    this.resource = resource
  }
}

function buildUrl(path, query) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${apiConfig.baseUrl}${cleanPath}`)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
    })
  }
  return url.toString()
}

async function parseBody(response) {
  if (response.status === 204) return null
  const type = response.headers.get('content-type') || ''
  if (type.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      throw new ApiError('The server sent a response that could not be read.', { status: response.status, code: 'invalid_response' })
    }
  }
  const text = await response.text()
  return text || null
}

/**
 * Pull a readable message and per-field errors out of common error formats:
 *   { detail: '…' }                       Django REST Framework
 *   { message: '…' } / { error: '…' }     generic
 *   { email: ['Enter a valid email.'] }   DRF field validation
 */
function extractErrors(body) {
  const fieldErrors = {}
  let message = ''
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    message = body.detail || body.message || (typeof body.error === 'string' ? body.error : '') || ''
    const fields = body.errors && typeof body.errors === 'object' ? body.errors : body
    Object.entries(fields).forEach(([key, value]) => {
      if (['detail', 'message', 'error', 'errors', 'status', 'code'].includes(key)) return
      if (Array.isArray(value) && typeof value[0] === 'string') fieldErrors[key] = value[0]
      else if (typeof value === 'string') fieldErrors[key] = value
    })
    if (!message && Array.isArray(body.non_field_errors)) message = body.non_field_errors[0]
  } else if (typeof body === 'string' && body.length < 200) {
    message = body
  }
  return { message, fieldErrors }
}

/**
 * Low-level JSON request. Throws ApiError on any failure.
 * @param {string} path      Endpoint path (see endpoints.js)
 * @param {object} [options] { method, body, query, headers, signal, timeoutMs }
 */
export async function request(path, { method = 'GET', body, query, headers = {}, signal, timeoutMs } = {}) {
  if (!apiConfig.baseUrl) throw new ApiNotConfiguredError()

  const controller = new AbortController()
  const limit = timeoutMs ?? apiConfig.timeoutMs
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, limit)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })

  let response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...apiConfig.headers,
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: apiConfig.credentials,
      signal: controller.signal,
    })
  } catch (cause) {
    if (timedOut) throw new ApiError('The server took too long to respond.', { code: 'timeout', cause })
    if (signal?.aborted) throw cause
    throw new ApiError('Could not reach the server. Check your connection and try again.', { code: 'network', cause })
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }

  const data = await parseBody(response)
  if (!response.ok) {
    const { message, fieldErrors } = extractErrors(data)
    throw new ApiError(message || `The server returned an error (${response.status}).`, {
      status: response.status,
      code: response.status === 404 ? 'not_found' : 'http',
      details: data,
      fieldErrors,
    })
  }
  return data
}

/** Accepts arrays, DRF pagination ({ results }) and { data } / { items } envelopes. */
export function unwrapList(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  if (data && Array.isArray(data.data)) return data.data
  if (data && Array.isArray(data.items)) return data.items
  throw new ApiError('The server response was not a list.', { code: 'invalid_response', details: data })
}

/** Accepts a bare object or a { data } envelope. */
export function unwrapItem(data) {
  if (data && typeof data === 'object' && data.data && typeof data.data === 'object' && !Array.isArray(data.data)) return data.data
  return data
}

/**
 * Resolve local mock data the same way an API call would: asynchronously,
 * as a fresh copy (so pages cannot mutate the source), with an optional delay.
 */
export function fromMock(value) {
  const copy = value === undefined ? undefined : structuredClone(value)
  const delay = apiConfig.mockDelayMs
  if (!delay) return Promise.resolve(copy)
  return new Promise((resolve) => setTimeout(() => resolve(copy), delay))
}

export function notFound(what) {
  return new ApiError(`${what} could not be found.`, { status: 404, code: 'not_found' })
}
