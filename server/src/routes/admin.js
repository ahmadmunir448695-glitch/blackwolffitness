import { Router } from 'express'
import { hashPassword, publicUser, requireRole } from '../lib/auth.js'
import { assertManageEvent, canManageEvent, eventScopeSql, isSuper } from '../lib/access.js'
import { audit } from '../lib/audit.js'
import { badRequest, conflict, forbidden, likeTerm, notFound, orderBy, paged, pagination } from '../lib/http.js'
import { sendCsv } from '../lib/csv.js'
import { LIVE_STATUSES, competitionAge, effectiveStatus } from '../lib/domain.js'
import { ENTRY_LIST_SQL, loadRegistration } from '../lib/registrations.js'
import { notifyClub } from '../lib/notify.js'
import { ENTRY_SORT, entryFilters } from './registrations.js'
import { email, id, ids, num, oneOf, password, phone, str, validate } from '../lib/validate.js'

const live = LIVE_STATUSES.map((s) => `'${s}'`).join(',')
const label = (s) => String(s ?? '').replace(/_/g, ' ')

/** Review decisions: which statuses each action may start from, and where it leads. */
const REVIEW = {
  start_review: { from: ['submitted'], to: 'under_review', verb: 'is under review' },
  approve: { from: ['submitted', 'under_review'], to: 'approved', verb: 'was approved' },
  reject: { from: ['submitted', 'under_review', 'approved', 'correction_required'], to: 'rejected', verb: 'was rejected', note: true },
  request_correction: { from: ['submitted', 'under_review', 'approved'], to: 'correction_required', verb: 'needs a correction', note: true },
  reopen: { from: ['rejected'], to: 'under_review', verb: 'was reopened for review' },
}

export function adminRoutes(db) {
  const r = Router()
  r.use(requireRole('super_admin', 'organizer'))
  const superOnly = requireRole('super_admin')

  // ---- Dashboard ---------------------------------------------------------
  r.get('/stats', (req, res) => {
    const scope = eventScopeSql(db, req.user, 'r.event_id')
    const evScope = eventScopeSql(db, req.user, 'id')
    const events = db.all(`SELECT * FROM events WHERE ${evScope.sql} ORDER BY start_date DESC`, evScope.params)
    const byStatus = Object.fromEntries(db.all(`SELECT r.status, COUNT(*) AS n FROM registrations r WHERE ${scope.sql} GROUP BY r.status`, scope.params).map((x) => [x.status, x.n]))
    const byPayment = Object.fromEntries(
      db.all(`SELECT r.payment_status, COUNT(*) AS n, SUM(r.fee_amount) AS amount FROM registrations r WHERE ${scope.sql} AND r.status IN (${live}) AND r.status != 'draft' GROUP BY r.payment_status`, scope.params).map((x) => [x.payment_status, { count: x.n, amount: x.amount }]),
    )
    const byDiscipline = db.all(
      `SELECT c.discipline, COUNT(*) AS n FROM registrations r JOIN event_categories c ON c.id = r.category_id
       WHERE ${scope.sql} AND r.status IN (${live}) AND r.status != 'draft' GROUP BY c.discipline`,
      scope.params,
    )
    const totals = db.get(
      `SELECT COUNT(DISTINCT r.team_id) AS teams, COUNT(DISTINCT r.club_id) AS clubs, COUNT(DISTINCT ra.athlete_id) AS athletes
       FROM registrations r JOIN registration_athletes ra ON ra.registration_id = r.id
       WHERE ${scope.sql} AND r.status IN (${live}) AND r.status != 'draft'`,
      scope.params,
    )
    const pendingPayments = db.get(
      `SELECT COUNT(*) AS n FROM payments p JOIN registrations r ON r.id = p.registration_id WHERE p.status = 'pending' AND ${scope.sql}`,
      scope.params,
    ).n
    const recent = db.all(`${ENTRY_LIST_SQL} WHERE ${scope.sql} AND r.status != 'draft' ORDER BY COALESCE(r.submitted_at, r.created_at) DESC LIMIT 8`, scope.params)
    res.json({
      events: {
        total: events.length,
        published: events.filter((e) => e.published).length,
        open: events.filter((e) => e.published && effectiveStatus(e) === 'registration_open').length,
      },
      registrations: { by_status: byStatus, by_payment: byPayment, by_discipline: byDiscipline, awaiting_review: (byStatus.submitted || 0) + (byStatus.under_review || 0) },
      participants: totals,
      pending_payments: pendingPayments,
      recent_entries: recent,
      users: isSuper(req.user) ? Object.fromEntries(db.all('SELECT role, COUNT(*) AS n FROM users GROUP BY role').map((x) => [x.role, x.n])) : undefined,
    })
  })

  // ---- Registrations -----------------------------------------------------
  function scopedEntries(req, { includeDrafts = false } = {}) {
    const scope = eventScopeSql(db, req.user, 'r.event_id')
    const where = [scope.sql]
    const params = [...scope.params]
    if (!includeDrafts && req.query.status !== 'draft') where.push("r.status != 'draft'")
    entryFilters(req.query, where, params)
    return { where: where.join(' AND '), params }
  }

  r.get('/registrations', (req, res) => {
    const { where, params } = scopedEntries(req)
    const p = pagination(req.query, { defaultSize: 25 })
    const base = `${ENTRY_LIST_SQL} WHERE ${where}`
    const total = db.get(`SELECT COUNT(*) AS n FROM (${base})`, params).n
    const rows = db.all(`${base} ORDER BY ${orderBy(req.query, ENTRY_SORT, 'COALESCE(r.submitted_at, r.created_at) DESC')} LIMIT ? OFFSET ?`, [...params, p.limit, p.offset])
    res.json(paged(rows, total, p))
  })

  function loadManaged(req, regId) {
    const row = db.get('SELECT * FROM registrations WHERE id = ?', regId)
    if (!row || !canManageEvent(db, req.user, row.event_id)) throw notFound('Entry')
    return row
  }

  r.get('/registrations/:id', (req, res) => {
    const row = loadManaged(req, req.params.id)
    const history = db.all(
      `SELECT l.action, l.details, l.created_at, u.name AS user_name FROM audit_logs l LEFT JOIN users u ON u.id = l.user_id
       WHERE l.entity = 'registration' AND l.entity_id = ? ORDER BY l.created_at DESC`,
      row.id,
    )
    res.json({ registration: loadRegistration(db, row.id), history })
  })

  function review(req, row, action, note) {
    const rule = REVIEW[action]
    if (!rule) throw badRequest('Unknown action.')
    if (!rule.from.includes(row.status)) throw conflict(`An entry that is ${label(row.status)} cannot be ${label(rule.to)}.`)
    if (rule.note && !note) throw badRequest('Add a note explaining the decision to the club.', { note: 'Required for this decision.' })
    db.run(
      `UPDATE registrations SET status = ?, review_note = COALESCE(?, review_note), reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'),
         reviewed_by = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
      [rule.to, note || null, req.user.id, row.id],
    )
    audit(db, req, action, 'registration', row.id, { from: row.status, to: rule.to, note })
    const event = db.get('SELECT name FROM events WHERE id = ?', row.event_id)
    notifyClub(db, row.club_id, {
      title: `Entry ${row.code} ${rule.verb}`,
      body: [event.name, note].filter(Boolean).join(' — '),
      link: `/portal/entries/${row.id}`,
      kind: rule.to === 'approved' ? 'success' : rule.to === 'rejected' || rule.to === 'correction_required' ? 'warning' : 'info',
    })
  }

  const reviewSchema = { action: oneOf(Object.keys(REVIEW)), note: str({ required: false, max: 1000 }) }

  r.post('/registrations/:id/review', (req, res) => {
    const row = loadManaged(req, req.params.id)
    const d = validate(req.body, reviewSchema)
    db.transaction(() => review(req, row, d.action, d.note))
    res.json({ registration: loadRegistration(db, row.id) })
  })

  r.post('/registrations/bulk-review', (req, res) => {
    const d = validate(req.body, { ...reviewSchema, ids: ids({ min: 1, max: 200 }) })
    const results = { updated: 0, skipped: [] }
    db.transaction(() => {
      for (const regId of d.ids) {
        try {
          review(req, loadManaged(req, regId), d.action, d.note)
          results.updated++
        } catch (err) {
          if (!err.status) throw err
          results.skipped.push({ id: regId, reason: err.message })
        }
      }
    })
    res.json(results)
  })

  /** Record a payment directly, or change the payment status (waive, refund…). */
  r.post('/registrations/:id/payment', (req, res) => {
    const row = loadManaged(req, req.params.id)
    const d = validate(req.body, {
      payment_status: oneOf(['unpaid', 'paid', 'waived', 'refunded']),
      amount: num({ required: false, min: 0, max: 10_000_000 }),
      method: oneOf(['cash', 'bank_transfer', 'online', 'waiver', 'other'], { required: false }),
      reference: str({ required: false, max: 120 }),
      note: str({ required: false, max: 500 }),
    })
    db.transaction(() => {
      if (d.payment_status === 'paid') {
        const pending = db.get("SELECT * FROM payments WHERE registration_id = ? AND status = 'pending' ORDER BY created_at DESC", row.id)
        if (pending) {
          db.run("UPDATE payments SET status = 'paid', confirmed_by = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [req.user.id, pending.id])
        } else {
          db.run("INSERT INTO payments (registration_id, amount, currency, method, reference, status, note, recorded_by, confirmed_by) VALUES (?, ?, ?, ?, ?, 'paid', ?, ?, ?)", [
            row.id,
            d.amount ?? row.fee_amount,
            row.currency,
            d.method || 'cash',
            d.reference,
            d.note,
            req.user.id,
            req.user.id,
          ])
        }
      }
      if (d.payment_status === 'refunded') db.run("UPDATE payments SET status = 'refunded', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE registration_id = ? AND status = 'paid'", row.id)
      if (d.payment_status === 'unpaid') db.run("UPDATE payments SET status = 'rejected', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE registration_id = ? AND status = 'pending'", row.id)
      db.run("UPDATE registrations SET payment_status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [d.payment_status, row.id])
    })
    audit(db, req, 'payment_status', 'registration', row.id, d)
    notifyClub(db, row.club_id, { title: `Payment for ${row.code}: ${label(d.payment_status)}`, body: d.note || null, link: `/portal/entries/${row.id}` })
    res.json({ registration: loadRegistration(db, row.id) })
  })

  // ---- Payments ----------------------------------------------------------
  r.get('/payments', (req, res) => {
    const scope = eventScopeSql(db, req.user, 'r.event_id')
    const where = [scope.sql]
    const params = [...scope.params]
    if (req.query.status) {
      where.push('p.status = ?')
      params.push(String(req.query.status))
    }
    if (req.query.eventId) {
      where.push('r.event_id = ?')
      params.push(Number(req.query.eventId))
    }
    if (req.query.q) {
      const t = likeTerm(req.query.q)
      where.push("(r.code LIKE ? ESCAPE '\\' OR cl.name LIKE ? ESCAPE '\\' OR p.reference LIKE ? ESCAPE '\\')")
      params.push(t, t, t)
    }
    const p = pagination(req.query, { defaultSize: 25 })
    const base = `FROM payments p JOIN registrations r ON r.id = p.registration_id JOIN clubs cl ON cl.id = r.club_id JOIN events e ON e.id = r.event_id
                  LEFT JOIN users u ON u.id = p.recorded_by WHERE ${where.join(' AND ')}`
    const total = db.get(`SELECT COUNT(*) AS n ${base}`, params).n
    const items = db.all(
      `SELECT p.*, r.code AS registration_code, r.fee_amount, r.payment_status, cl.name AS club_name, e.name AS event_name, u.name AS recorded_by_name
       ${base} ORDER BY p.status = 'pending' DESC, p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, p.limit, p.offset],
    )
    const totals = db.get(`SELECT COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount END), 0) AS paid, COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount END), 0) AS pending ${base}`, params)
    res.json({ ...paged(items, total, p), totals })
  })

  r.post('/payments/:pid', (req, res) => {
    const pay = db.get('SELECT * FROM payments WHERE id = ?', req.params.pid)
    if (!pay) throw notFound('Payment')
    const row = loadManaged(req, pay.registration_id)
    const d = validate(req.body, { status: oneOf(['paid', 'rejected']), note: str({ required: false, max: 500 }) })
    if (pay.status !== 'pending') throw conflict('Only pending payments can be confirmed or rejected.')
    db.transaction(() => {
      db.run("UPDATE payments SET status = ?, note = COALESCE(?, note), confirmed_by = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [d.status, d.note, req.user.id, pay.id])
      const stillPending = db.get("SELECT 1 AS x FROM payments WHERE registration_id = ? AND status = 'pending'", row.id)
      const next = d.status === 'paid' ? 'paid' : stillPending ? 'pending' : 'unpaid'
      db.run("UPDATE registrations SET payment_status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [next, row.id])
    })
    audit(db, req, d.status === 'paid' ? 'confirm_payment' : 'reject_payment', 'payment', pay.id, { registration_id: row.id })
    notifyClub(db, row.club_id, {
      title: d.status === 'paid' ? `Payment confirmed for ${row.code}` : `Payment not accepted for ${row.code}`,
      body: d.note || (d.status === 'paid' ? 'Thank you, your payment has been received.' : 'Please check the details and report the payment again.'),
      link: `/portal/entries/${row.id}`,
      kind: d.status === 'paid' ? 'success' : 'warning',
    })
    res.json({ ok: true })
  })

  // ---- Teams, clubs, athletes --------------------------------------------
  /** Teams with entries in managed events; super admins also see teams without entries. */
  r.get('/teams', (req, res) => {
    const p = pagination(req.query, { defaultSize: 25 })
    const scope = eventScopeSql(db, req.user, 'r.event_id')
    const where = []
    const params = []
    if (req.query.eventId) {
      where.push(`t.id IN (SELECT r.team_id FROM registrations r WHERE r.event_id = ? AND r.status IN (${live}) AND r.status != 'draft' AND ${scope.sql})`)
      params.push(Number(req.query.eventId), ...scope.params)
    } else if (!isSuper(req.user)) {
      where.push(`t.id IN (SELECT r.team_id FROM registrations r WHERE r.status != 'draft' AND ${scope.sql})`)
      params.push(...scope.params)
    }
    if (req.query.q) {
      const t = likeTerm(req.query.q)
      where.push("(t.name LIKE ? ESCAPE '\\' OR t.code LIKE ? ESCAPE '\\' OR cl.name LIKE ? ESCAPE '\\' OR t.city LIKE ? ESCAPE '\\')")
      params.push(t, t, t, t)
    }
    const sql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const base = `FROM teams t JOIN clubs cl ON cl.id = t.club_id ${sql}`
    const total = db.get(`SELECT COUNT(*) AS n ${base}`, params).n
    const order = orderBy(req.query, { name: 't.name', club: 'cl.name', city: 't.city', created: 't.created_at' }, 't.name ASC')
    const items = db.all(
      `SELECT t.id, t.code, t.name, t.country, t.city, t.status, t.head_coach_name, t.coach_phone, t.coach_email, t.created_at, cl.name AS club_name, cl.id AS club_id,
              (SELECT COUNT(*) FROM athletes a WHERE a.team_id = t.id) AS athlete_count,
              (SELECT COUNT(*) FROM registrations r WHERE r.team_id = t.id AND r.status IN (${live}) AND r.status != 'draft') AS entry_count
       ${base} ORDER BY ${order} LIMIT ? OFFSET ?`,
      [...params, p.limit, p.offset],
    )
    res.json(paged(items, total, p))
  })

  r.get('/athletes', (req, res) => {
    const p = pagination(req.query, { defaultSize: 25 })
    const scope = eventScopeSql(db, req.user, 'r.event_id')
    const where = []
    const params = []
    const inEntries = (extra = '') => `a.id IN (SELECT ra.athlete_id FROM registration_athletes ra JOIN registrations r ON r.id = ra.registration_id WHERE r.status IN (${live}) AND r.status != 'draft' AND ${scope.sql}${extra})`
    if (req.query.eventId) {
      where.push(inEntries(' AND r.event_id = ?'))
      params.push(...scope.params, Number(req.query.eventId))
    } else if (!isSuper(req.user)) {
      where.push(inEntries())
      params.push(...scope.params)
    }
    if (req.query.gender === 'male' || req.query.gender === 'female') {
      where.push('a.gender = ?')
      params.push(req.query.gender)
    }
    if (req.query.q) {
      const t = likeTerm(req.query.q)
      where.push("(a.full_name LIKE ? ESCAPE '\\' OR a.code LIKE ? ESCAPE '\\' OR cl.name LIKE ? ESCAPE '\\' OR a.id_number LIKE ? ESCAPE '\\')")
      params.push(t, t, t, t)
    }
    const sql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const base = `FROM athletes a JOIN clubs cl ON cl.id = a.club_id LEFT JOIN teams t ON t.id = a.team_id ${sql}`
    const total = db.get(`SELECT COUNT(*) AS n ${base}`, params).n
    const order = orderBy(req.query, { name: 'a.full_name', club: 'cl.name', dob: 'a.dob', weight: 'a.weight_kg', belt: 'a.belt' }, 'a.full_name ASC')
    const items = db.all(
      `SELECT a.id, a.code, a.full_name, a.father_name, a.dob, a.gender, a.nationality, a.id_number, a.belt, a.weight_kg, a.height_cm,
              cl.name AS club_name, t.name AS team_name,
              (SELECT COUNT(*) FROM registration_athletes ra JOIN registrations r ON r.id = ra.registration_id WHERE ra.athlete_id = a.id AND r.status IN (${live}) AND r.status != 'draft') AS entry_count
       ${base} ORDER BY ${order} LIMIT ? OFFSET ?`,
      [...params, p.limit, p.offset],
    )
    res.json(paged(items, total, p))
  })

  r.get('/clubs', superOnly, (req, res) => {
    const items = db.all(
      `SELECT cl.*, u.name AS manager_name, u.email AS manager_email,
              (SELECT COUNT(*) FROM teams t WHERE t.club_id = cl.id) AS team_count,
              (SELECT COUNT(*) FROM athletes a WHERE a.club_id = cl.id) AS athlete_count
       FROM clubs cl LEFT JOIN users u ON u.id = cl.owner_user_id ORDER BY cl.name`,
    )
    res.json({ items })
  })

  // ---- Reports -------------------------------------------------------------
  function reportEvent(req) {
    const { eventId } = validate(req.query, { eventId: id() })
    return assertManageEvent(db, req.user, eventId)
  }

  /** Category-wise breakdown: every category with its entries and athletes. */
  r.get('/reports/categories', (req, res) => {
    const event = reportEvent(req)
    const statuses = req.query.approvedOnly === '1' ? "('approved')" : `(${live.replace("'draft',", '')})`
    const categories = db.all('SELECT * FROM event_categories WHERE event_id = ? ORDER BY discipline, sort, id', event.id)
    const out = categories.map((c) => {
      const entries = db.all(
        `SELECT r.id, r.code, r.status, r.payment_status, t.name AS team_name, cl.name AS club_name, w.name AS weight_name, w.id AS weight_id
         FROM registrations r JOIN teams t ON t.id = r.team_id JOIN clubs cl ON cl.id = r.club_id LEFT JOIN weight_divisions w ON w.id = r.weight_division_id
         WHERE r.category_id = ? AND r.status IN ${statuses} ORDER BY w.sort, t.name`,
        c.id,
      ).map((e) => ({
        ...e,
        athletes: db.all(
          `SELECT a.id, a.code, a.full_name, a.gender, a.dob, COALESCE(ra.belt, a.belt) AS belt, COALESCE(ra.weight_kg, a.weight_kg) AS weight_kg
           FROM registration_athletes ra JOIN athletes a ON a.id = ra.athlete_id WHERE ra.registration_id = ?`,
          e.id,
        ).map((a) => ({ ...a, age: competitionAge(a.dob, event) })),
      }))
      return { ...c, entry_count: entries.length, entries }
    })
    res.json({ event: { id: event.id, name: event.name, slug: event.slug }, categories: out })
  })

  r.get('/reports/:kind.csv', (req, res) => {
    const event = reportEvent(req)
    const kind = req.params.kind
    const slug = event.slug
    const notDraft = `r.status IN (${live}) AND r.status != 'draft'`
    if (kind === 'entries') {
      const rows = db.all(`${ENTRY_LIST_SQL} WHERE r.event_id = ? ORDER BY c.discipline, c.name, w.sort, t.name`, event.id)
      return sendCsv(res, `${slug}-entries.csv`, [
        { label: 'Registration ID', key: 'code' },
        { label: 'Status', value: (x) => label(x.status) },
        { label: 'Payment', value: (x) => label(x.payment_status) },
        { label: 'Fee', key: 'fee_amount' },
        { label: 'Currency', key: 'currency' },
        { label: 'Discipline', key: 'discipline' },
        { label: 'Category', key: 'category_name' },
        { label: 'Weight', key: 'weight_name' },
        { label: 'Athletes', key: 'athlete_names' },
        { label: 'Team', key: 'team_name' },
        { label: 'Team ID', key: 'team_code' },
        { label: 'Club', key: 'club_name' },
        { label: 'Submitted', key: 'submitted_at' },
      ], rows)
    }
    if (kind === 'athletes') {
      const rows = db.all(
        `SELECT a.code, a.full_name, a.father_name, a.dob, a.gender, a.nationality, a.id_number, COALESCE(ra.belt, a.belt) AS belt,
                COALESCE(ra.weight_kg, a.weight_kg) AS weight_kg, a.height_cm, t.name AS team_name, cl.name AS club_name,
                r.code AS reg_code, r.status, c.name AS category_name, w.name AS weight_name
         FROM registration_athletes ra JOIN registrations r ON r.id = ra.registration_id JOIN athletes a ON a.id = ra.athlete_id
         JOIN teams t ON t.id = r.team_id JOIN clubs cl ON cl.id = r.club_id JOIN event_categories c ON c.id = r.category_id
         LEFT JOIN weight_divisions w ON w.id = r.weight_division_id
         WHERE r.event_id = ? AND ${notDraft} ORDER BY cl.name, a.full_name`,
        event.id,
      )
      return sendCsv(res, `${slug}-athletes.csv`, [
        { label: 'Athlete ID', key: 'code' },
        { label: 'Full name', key: 'full_name' },
        { label: 'Father name', key: 'father_name' },
        { label: 'Date of birth', key: 'dob' },
        { label: 'Age (event rule)', value: (x) => competitionAge(x.dob, event) },
        { label: 'Gender', key: 'gender' },
        { label: 'Nationality', key: 'nationality' },
        { label: 'ID / Passport', key: 'id_number' },
        { label: 'Belt / Dan', key: 'belt' },
        { label: 'Weight (kg)', key: 'weight_kg' },
        { label: 'Height (cm)', key: 'height_cm' },
        { label: 'Team', key: 'team_name' },
        { label: 'Club', key: 'club_name' },
        { label: 'Registration ID', key: 'reg_code' },
        { label: 'Category', key: 'category_name' },
        { label: 'Weight category', key: 'weight_name' },
        { label: 'Status', value: (x) => label(x.status) },
      ], rows)
    }
    if (kind === 'teams') {
      const rows = db.all(
        `SELECT t.code, t.name, cl.name AS club_name, t.city, t.country, t.head_coach_name, t.coach_phone, t.coach_email,
                COUNT(DISTINCT r.id) AS entries, COUNT(DISTINCT ra.athlete_id) AS athletes,
                SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) AS approved,
                SUM(r.fee_amount) AS fees, SUM(CASE WHEN r.payment_status IN ('paid','waived') THEN r.fee_amount ELSE 0 END) AS paid
         FROM registrations r JOIN teams t ON t.id = r.team_id JOIN clubs cl ON cl.id = r.club_id
         JOIN registration_athletes ra ON ra.registration_id = r.id
         WHERE r.event_id = ? AND ${notDraft} GROUP BY t.id ORDER BY t.name`,
        event.id,
      )
      return sendCsv(res, `${slug}-teams.csv`, [
        { label: 'Team ID', key: 'code' },
        { label: 'Team', key: 'name' },
        { label: 'Club / Academy', key: 'club_name' },
        { label: 'City', key: 'city' },
        { label: 'Country', key: 'country' },
        { label: 'Head coach', key: 'head_coach_name' },
        { label: 'Coach phone', key: 'coach_phone' },
        { label: 'Coach email', key: 'coach_email' },
        { label: 'Entries', key: 'entries' },
        { label: 'Approved entries', key: 'approved' },
        { label: 'Athletes', key: 'athletes' },
        { label: 'Fees due', key: 'fees' },
        { label: 'Fees paid', key: 'paid' },
      ], rows)
    }
    if (kind === 'categories') {
      const rows = db.all(
        `SELECT c.discipline, c.name, w.name AS weight_name, COUNT(r.id) AS entries,
                SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) AS approved
         FROM event_categories c LEFT JOIN registrations r ON r.category_id = c.id AND ${notDraft}
         LEFT JOIN weight_divisions w ON w.id = r.weight_division_id
         WHERE c.event_id = ? GROUP BY c.id, w.id ORDER BY c.discipline, c.sort, c.id, w.sort`,
        event.id,
      )
      return sendCsv(res, `${slug}-categories.csv`, [
        { label: 'Discipline', key: 'discipline' },
        { label: 'Category', key: 'name' },
        { label: 'Weight category', key: 'weight_name' },
        { label: 'Entries', key: 'entries' },
        { label: 'Approved', key: 'approved' },
      ], rows)
    }
    throw notFound('Report')
  })

  // ---- Users (super admin) -----------------------------------------------
  r.get('/users', superOnly, (req, res) => {
    const p = pagination(req.query, { defaultSize: 25 })
    const where = []
    const params = []
    if (req.query.role) {
      where.push('u.role = ?')
      params.push(String(req.query.role))
    }
    if (req.query.q) {
      const t = likeTerm(req.query.q)
      where.push("(u.name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')")
      params.push(t, t)
    }
    const sql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const total = db.get(`SELECT COUNT(*) AS n FROM users u ${sql}`, params).n
    const items = db.all(
      `SELECT u.id, u.email, u.name, u.phone, u.role, u.club_id, u.athlete_id, u.is_active, u.last_login_at, u.created_at, cl.name AS club_name
       FROM users u LEFT JOIN clubs cl ON cl.id = u.club_id ${sql} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [...params, p.limit, p.offset],
    )
    res.json(paged(items.map((u) => ({ ...u, is_active: Boolean(u.is_active) })), total, p))
  })

  r.post('/users', superOnly, (req, res) => {
    const d = validate(req.body, {
      name: str({ max: 120 }),
      email: email(),
      phone: phone(),
      password: password(),
      role: oneOf(['super_admin', 'organizer']),
      event_ids: ids({ max: 50 }),
    })
    if (db.get('SELECT 1 AS x FROM users WHERE email = ?', d.email)) throw conflict('This email is already registered.', { email: 'Already registered.' })
    const userId = db.transaction(() => {
      const u = db.run('INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)', [d.email, hashPassword(d.password), d.name, d.phone, d.role])
      if (d.role === 'organizer') for (const eid of d.event_ids) if (db.get('SELECT 1 AS x FROM events WHERE id = ?', eid)) db.run('INSERT INTO event_organizers (event_id, user_id) VALUES (?, ?)', [eid, u.id])
      return u.id
    })
    audit(db, req, 'create', 'user', userId, { role: d.role, email: d.email })
    res.status(201).json({ user: publicUser(db.get('SELECT * FROM users WHERE id = ?', userId)) })
  })

  r.patch('/users/:uid', superOnly, (req, res) => {
    const user = db.get('SELECT * FROM users WHERE id = ?', req.params.uid)
    if (!user) throw notFound('User')
    const d = validate(req.body, { name: str({ max: 120 }), phone: phone(), is_active: (v) => (v === undefined ? undefined : v ? 1 : 0), password: password() }, { partial: true })
    if (user.id === req.user.id && d.is_active === 0) throw forbidden('You cannot deactivate your own account.')
    const sets = []
    const params = []
    for (const k of ['name', 'phone', 'is_active']) {
      if (k in d) {
        sets.push(`${k} = ?`)
        params.push(d[k])
      }
    }
    if (d.password) {
      sets.push('password_hash = ?')
      params.push(hashPassword(d.password))
    }
    if (d.password || d.is_active === 0) sets.push('token_version = token_version + 1')
    if (sets.length) db.run(`UPDATE users SET ${sets.join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`, [...params, user.id])
    audit(db, req, d.password ? 'reset_password' : 'update', 'user', user.id, { ...d, password: d.password ? '***' : undefined })
    res.json({ user: publicUser(db.get('SELECT * FROM users WHERE id = ?', user.id)) })
  })

  // ---- Audit log (super admin) -------------------------------------------
  r.get('/audit', superOnly, (req, res) => {
    const p = pagination(req.query, { defaultSize: 50 })
    const where = []
    const params = []
    if (req.query.entity) {
      where.push('l.entity = ?')
      params.push(String(req.query.entity))
    }
    if (req.query.q) {
      const t = likeTerm(req.query.q)
      where.push("(l.action LIKE ? ESCAPE '\\' OR u.name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\' OR l.details LIKE ? ESCAPE '\\')")
      params.push(t, t, t, t)
    }
    const sql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const base = `FROM audit_logs l LEFT JOIN users u ON u.id = l.user_id ${sql}`
    const total = db.get(`SELECT COUNT(*) AS n ${base}`, params).n
    const items = db.all(`SELECT l.*, u.name AS user_name, u.email AS user_email, u.role AS user_role ${base} ORDER BY l.id DESC LIMIT ? OFFSET ?`, [...params, p.limit, p.offset])
    res.json(paged(items, total, p))
  })

  return r
}
