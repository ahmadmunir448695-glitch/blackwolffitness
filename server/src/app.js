import express from 'express'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { config } from './config.js'
import { authenticate, hashPassword } from './lib/auth.js'
import { dirs } from './lib/uploads.js'
import { authRoutes } from './routes/auth.js'
import { clubRoutes } from './routes/club.js'
import { teamRoutes } from './routes/teams.js'
import { athleteRoutes } from './routes/athletes.js'
import { coachRoutes } from './routes/coaches.js'
import { eventRoutes } from './routes/events.js'
import { adminEventRoutes } from './routes/admin-events.js'
import { registrationRoutes } from './routes/registrations.js'
import { documentRoutes } from './routes/documents.js'
import { notificationRoutes } from './routes/notifications.js'
import { adminRoutes } from './routes/admin.js'

/** Create the first super admin from ADMIN_EMAIL / ADMIN_PASSWORD if none exists. */
export function bootstrapAdmin(db) {
  const { email, password, name } = config.bootstrapAdmin
  if (!email || !password) return null
  if (db.get("SELECT 1 AS x FROM users WHERE role = 'super_admin'")) return null
  const existing = db.get('SELECT id FROM users WHERE email = ?', email.toLowerCase())
  if (existing) {
    db.run("UPDATE users SET role = 'super_admin', club_id = NULL WHERE id = ?", existing.id)
    return existing.id
  }
  return db.run("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'super_admin')", [email.toLowerCase(), hashPassword(password), name]).id
}

export function createApp(db) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', config.trustProxy)
  app.set('query parser', 'simple')

  // Security headers for an API that only returns JSON and files.
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff')
    res.set('Referrer-Policy', 'no-referrer')
    res.set('X-Frame-Options', 'DENY')
    res.set('Cross-Origin-Resource-Policy', 'cross-origin')
    if (config.isProd) res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains')
    next()
  })

  // CORS for the website origin(s). Auth uses a Bearer token, never cookies.
  app.use((req, res, next) => {
    const origin = req.get('origin')
    if (origin && (config.corsOrigins.includes(origin) || config.corsOrigins.includes('*'))) {
      res.set('Access-Control-Allow-Origin', origin)
      res.set('Vary', 'Origin')
      res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
      res.set('Access-Control-Expose-Headers', 'Content-Disposition')
      res.set('Access-Control-Max-Age', '600')
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    next()
  })

  app.use(express.json({ limit: '1mb' }))
  app.use(authenticate(db))

  const api = express.Router()
  api.get('/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }))

  // Public uploads (posters, team logos, invitation and rules PDFs).
  api.get('/files/:name', (req, res) => {
    const name = req.params.name
    const file = join(dirs.public, name)
    if (!/^[a-f0-9]{32}\.(jpg|png|webp|pdf)$/.test(name) || !existsSync(file)) return res.status(404).json({ error: 'File not found.' })
    res.set('Cache-Control', 'public, max-age=86400')
    res.set('X-Content-Type-Options', 'nosniff')
    res.sendFile(file)
  })

  api.use('/auth', authRoutes(db))
  api.use('/', eventRoutes(db))
  api.use('/', clubRoutes(db))
  api.use('/teams', teamRoutes(db))
  api.use('/athletes', athleteRoutes(db))
  api.use('/coaches', coachRoutes(db))
  api.use('/registrations', registrationRoutes(db))
  api.use('/documents', documentRoutes(db))
  api.use('/notifications', notificationRoutes(db))
  api.use('/admin/events', adminEventRoutes(db))
  api.use('/admin', adminRoutes(db))
  api.use((_req, res) => res.status(404).json({ error: 'Not found.' }))

  app.use('/api', api)
  app.get('/', (_req, res) => res.json({ name: 'Championship portal API', health: '/api/health' }))

  // Errors: known HTTP errors pass their message; anything else is logged and hidden.
  app.use((err, req, res, _next) => {
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' })
    if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' })
    const status = err?.status && err.status < 500 ? err.status : 500
    if (status === 500) {
      console.error(`[${req.method} ${req.originalUrl}]`, err)
      return res.status(500).json({ error: 'Something went wrong on the server. Please try again.' })
    }
    const body = { error: err.message }
    if (err.fields?.problems) body.problems = err.fields.problems
    else if (err.fields) body.fields = err.fields
    res.status(status).json(body)
  })

  return app
}
