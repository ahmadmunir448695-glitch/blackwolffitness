import { Router } from 'express'
import { canManageEvent } from '../lib/access.js'
import { likeTerm, notFound } from '../lib/http.js'
import { eventConfig, presentEvent } from '../lib/events.js'
import { BELTS, DISCIPLINES, EVENT_STATUSES, PAYMENT_STATUSES, REGISTRATION_STATUSES, effectiveStatus } from '../lib/domain.js'

/** Public championship listing and details (published events only). */
export function eventRoutes(db) {
  const r = Router()

  r.get('/meta', (_req, res) => {
    res.json({
      belts: BELTS,
      disciplines: Object.entries(DISCIPLINES).map(([value, d]) => ({ value, ...d })),
      event_statuses: EVENT_STATUSES,
      registration_statuses: REGISTRATION_STATUSES,
      payment_statuses: PAYMENT_STATUSES,
    })
  })

  r.get('/events', (req, res) => {
    const where = ['published = 1']
    const params = []
    if (req.query.q) {
      where.push("(name LIKE ? ESCAPE '\\' OR city LIKE ? ESCAPE '\\' OR organizer LIKE ? ESCAPE '\\')")
      const t = likeTerm(req.query.q)
      params.push(t, t, t)
    }
    if (req.query.discipline && DISCIPLINES[req.query.discipline]) {
      where.push('id IN (SELECT event_id FROM event_categories WHERE discipline = ? AND active = 1)')
      params.push(req.query.discipline)
    }
    let events = db.all(`SELECT * FROM events WHERE ${where.join(' AND ')} ORDER BY start_date ASC`, params)
    if (req.query.status && EVENT_STATUSES.includes(req.query.status)) {
      events = events.filter((e) => effectiveStatus(e) === req.query.status)
    }
    // Open and upcoming first, finished championships last.
    const rank = { registration_open: 0, upcoming: 1, registration_closed: 2, ongoing: 3, completed: 4 }
    const items = events.map((e) => presentEvent(db, e)).sort((a, b) => rank[a.status] - rank[b.status])
    res.json({ items })
  })

  r.get('/events/:key', (req, res) => {
    const key = req.params.key
    const event = /^\d+$/.test(key) ? db.get('SELECT * FROM events WHERE id = ?', Number(key)) : db.get('SELECT * FROM events WHERE slug = ?', key)
    if (!event) throw notFound('Championship')
    if (!event.published && !(req.user && canManageEvent(db, req.user, event.id))) throw notFound('Championship')
    res.json({ event: presentEvent(db, event), ...eventConfig(db, event.id) })
  })

  return r
}
