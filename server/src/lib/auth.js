import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { config } from '../config.js'
import { forbidden, unauthorized } from './http.js'

const SCRYPT = { N: 16384, r: 8, p: 1 }

export function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64, SCRYPT)
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`
}

export function verifyPassword(password, stored) {
  const [scheme, saltB64, hashB64] = String(stored).split('$')
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false
  const expected = Buffer.from(hashB64, 'base64')
  const actual = scryptSync(String(password), Buffer.from(saltB64, 'base64'), expected.length, SCRYPT)
  return timingSafeEqual(expected, actual)
}

const b64url = (buf) => Buffer.from(buf).toString('base64url')
const sign = (data) => createHmac('sha256', config.sessionSecret).update(data).digest('base64url')

/**
 * Stateless signed token: base64url(payload).signature
 * `v` is the user's token_version; bumping it (password change, deactivation)
 * invalidates every token already issued.
 */
export function issueToken(user) {
  const payload = { uid: user.id, v: user.token_version, exp: Date.now() + config.sessionTtlHours * 3600_000 }
  const body = b64url(JSON.stringify(payload))
  return `${body}.${sign(body)}`
}

export function readToken(token) {
  if (!token || typeof token !== 'string') return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  const expected = Buffer.from(sign(body))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

/** Attach req.user when a valid Bearer token is sent. Never rejects on its own. */
export function authenticate(db) {
  return (req, _res, next) => {
    const header = req.get('authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    const payload = readToken(token)
    if (payload) {
      const user = db.get(
        'SELECT id, email, name, phone, role, club_id, athlete_id, is_active, token_version FROM users WHERE id = ?',
        payload.uid,
      )
      if (user && user.is_active && user.token_version === payload.v) req.user = user
    }
    next()
  }
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized())
  next()
}

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(unauthorized())
    if (!roles.includes(req.user.role)) return next(forbidden())
    next()
  }

export function publicUser(user) {
  if (!user) return null
  const { password_hash: _h, token_version: _v, ...rest } = user
  return { ...rest, is_active: Boolean(rest.is_active) }
}

/** Fixed-window limiter keyed by IP + route, for login and signup. */
export function rateLimit({ windowMs = 15 * 60_000, max = 20 } = {}) {
  const hits = new Map()
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`
    const nowMs = Date.now()
    const entry = hits.get(key)
    if (!entry || entry.reset < nowMs) {
      hits.set(key, { count: 1, reset: nowMs + windowMs })
      if (hits.size > 10_000) for (const [k, e] of hits) if (e.reset < nowMs) hits.delete(k)
      return next()
    }
    entry.count++
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - nowMs) / 1000)))
      return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' })
    }
    next()
  }
}
