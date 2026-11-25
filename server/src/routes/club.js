import { Router } from 'express'
import { requireRole } from '../lib/auth.js'
import { userClubId } from '../lib/access.js'
import { audit } from '../lib/audit.js'
import { email, phone, str, validate } from '../lib/validate.js'
import { LIVE_STATUSES } from '../lib/domain.js'
import { effectiveStatus } from '../lib/domain.js'

const live = LIVE_STATUSES.map((s) => `'${s}'`).join(',')

/** The signed-in user's club, plus the club dashboard. */
export function clubRoutes(db) {
  const r = Router()
  const clubUser = requireRole('club_manager', 'coach')

  r.get('/club', clubUser, (req, res) => {
    res.json({ club: db.get('SELECT * FROM clubs WHERE id = ?', userClubId(req.user)) })
  })

  r.patch('/club', requireRole('club_manager'), (req, res) => {
    const clubId = userClubId(req.user)
    const data = validate(
      req.body,
      {
        name: str({ max: 160 }),
        country: str({ max: 80 }),
        city: str({ max: 80 }),
        address: str({ required: false, max: 300 }),
        phone: phone(),
        email: email({ required: false }),
      },
      { partial: true },
    )
    if (Object.keys(data).length) {
      db.run(
        `UPDATE clubs SET ${Object.keys(data).map((k) => `${k} = ?`).join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
        [...Object.values(data), clubId],
      )
      audit(db, req, 'update', 'club', clubId, data)
    }
    res.json({ club: db.get('SELECT * FROM clubs WHERE id = ?', clubId) })
  })

  r.get('/dashboard', clubUser, (req, res) => {
    const clubId = userClubId(req.user)
    const count = (sql, p = clubId) => db.get(sql, p).n
    const byStatus = Object.fromEntries(
      db.all('SELECT status, COUNT(*) AS n FROM registrations WHERE club_id = ? GROUP BY status', clubId).map((r) => [r.status, r.n]),
    )
    const openEvents = db
      .all('SELECT * FROM events WHERE published = 1 ORDER BY start_date ASC')
      .map((e) => ({ ...e, status: effectiveStatus(e) }))
      .filter((e) => e.status === 'registration_open' || e.status === 'upcoming')
      .slice(0, 4)
      .map((e) => ({
        id: e.id,
        slug: e.slug,
        name: e.name,
        city: e.city,
        country: e.country,
        start_date: e.start_date,
        registration_deadline: e.registration_deadline,
        status: e.status,
        my_entries: db.get(`SELECT COUNT(*) AS n FROM registrations WHERE event_id = ? AND club_id = ? AND status IN (${live})`, [e.id, clubId]).n,
      }))
    const recent = db.all(
      `SELECT r.id, r.code, r.status, r.payment_status, r.created_at, e.name AS event_name, c.name AS category_name,
              (SELECT group_concat(a.full_name, ', ') FROM registration_athletes ra JOIN athletes a ON a.id = ra.athlete_id WHERE ra.registration_id = r.id) AS athlete_names
       FROM registrations r JOIN events e ON e.id = r.event_id JOIN event_categories c ON c.id = r.category_id
       WHERE r.club_id = ? ORDER BY r.updated_at DESC LIMIT 6`,
      clubId,
    )
    const unpaid = db.get(
      `SELECT COALESCE(SUM(fee_amount), 0) AS total, COUNT(*) AS n FROM registrations
       WHERE club_id = ? AND payment_status IN ('unpaid','pending') AND status IN ('submitted','under_review','approved','correction_required') AND fee_amount > 0`,
      clubId,
    )
    res.json({
      stats: {
        teams: count('SELECT COUNT(*) AS n FROM teams WHERE club_id = ?'),
        athletes: count('SELECT COUNT(*) AS n FROM athletes WHERE club_id = ?'),
        coaches: count('SELECT COUNT(*) AS n FROM coaches WHERE club_id = ?'),
        entries: Object.values(byStatus).reduce((a, b) => a + b, 0),
        by_status: byStatus,
        unpaid_total: unpaid.total,
        unpaid_entries: unpaid.n,
      },
      open_events: openEvents,
      recent_entries: recent,
    })
  })

  return r
}
