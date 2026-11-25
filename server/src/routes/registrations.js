import { Router } from 'express'
import { requireAuth, requireRole } from '../lib/auth.js'
import { canManageEvent, isClubUser, userClubId } from '../lib/access.js'
import { audit } from '../lib/audit.js'
import { HttpError, badRequest, conflict, forbidden, likeTerm, notFound, orderBy, paged, pagination } from '../lib/http.js'
import { uniqueCode } from '../lib/ids.js'
import { REGISTRATION_STATUSES, isRegistrationOpen } from '../lib/domain.js'
import { ENTRY_LIST_SQL, canClubEdit, checkEntry, loadRegistration, snapshotAthletes } from '../lib/registrations.js'
import { notifyClub, notifyEventAdmins } from '../lib/notify.js'
import { confirmationPdf } from '../lib/pdf.js'
import { removeFile, requireFile, storedPath, uploadOne } from '../lib/uploads.js'
import { bool, id, ids, list, num, oneOf, str, validate } from '../lib/validate.js'

export const ENTRY_SORT = {
  code: 'r.code',
  event: 'e.name',
  team: 't.name',
  category: 'c.name',
  athlete: 'athlete_names',
  created: 'r.created_at',
  submitted: 'r.submitted_at',
  status: 'r.status',
  payment: 'r.payment_status',
  fee: 'r.fee_amount',
}

/** Apply ?q, ?eventId, ?status, ?payment, ?teamId, ?discipline filters. */
export function entryFilters(query, where, params) {
  if (query.eventId) {
    where.push('r.event_id = ?')
    params.push(Number(query.eventId))
  }
  if (query.teamId) {
    where.push('r.team_id = ?')
    params.push(Number(query.teamId))
  }
  if (query.clubId) {
    where.push('r.club_id = ?')
    params.push(Number(query.clubId))
  }
  if (query.categoryId) {
    where.push('r.category_id = ?')
    params.push(Number(query.categoryId))
  }
  if (query.status && REGISTRATION_STATUSES.includes(query.status)) {
    where.push('r.status = ?')
    params.push(query.status)
  }
  if (query.payment) {
    where.push('r.payment_status = ?')
    params.push(String(query.payment))
  }
  if (query.discipline) {
    where.push('c.discipline = ?')
    params.push(String(query.discipline))
  }
  if (query.q) {
    const t = likeTerm(query.q)
    where.push(
      `(r.code LIKE ? ESCAPE '\\' OR t.name LIKE ? ESCAPE '\\' OR cl.name LIKE ? ESCAPE '\\' OR c.name LIKE ? ESCAPE '\\'
        OR r.id IN (SELECT ra.registration_id FROM registration_athletes ra JOIN athletes a ON a.id = ra.athlete_id WHERE a.full_name LIKE ? ESCAPE '\\' OR a.code LIKE ? ESCAPE '\\'))`,
    )
    params.push(t, t, t, t, t, t)
  }
}

const entrySchema = {
  category_id: id(),
  weight_division_id: id({ required: false }),
  athlete_ids: ids({ min: 1, max: 60 }),
}

export function registrationRoutes(db) {
  const r = Router()
  const clubUser = requireRole('club_manager', 'coach')

  function loadEvent(eventId) {
    const event = db.get('SELECT * FROM events WHERE id = ? AND published = 1', eventId)
    if (!event) throw notFound('Championship')
    return event
  }

  /** Load an entry the user may see. Club users: own club. Athletes: entries they are in. Admins: managed events. */
  function visible(req, regId) {
    const row = db.get('SELECT * FROM registrations WHERE id = ?', regId)
    if (!row) throw notFound('Entry')
    const u = req.user
    if (isClubUser(u) && row.club_id === u.club_id) return row
    if (u.role === 'athlete' && db.get('SELECT 1 AS x FROM registration_athletes WHERE registration_id = ? AND athlete_id = ?', [row.id, u.athlete_id])) return row
    if ((u.role === 'super_admin' || u.role === 'organizer') && canManageEvent(db, u, row.event_id)) return row
    throw notFound('Entry')
  }

  function editable(req, regId) {
    const row = visible(req, regId)
    if (!isClubUser(req.user)) throw forbidden('Only the club can change its entries.')
    return row
  }

  function checkCoach(clubId, coachId) {
    if (coachId && !db.get('SELECT 1 AS x FROM coaches WHERE id = ? AND club_id = ?', [coachId, clubId])) {
      throw badRequest('Choose one of your coaches.', { coach_id: 'Choose one of your coaches.' })
    }
  }

  r.get('/', requireAuth, (req, res) => {
    const u = req.user
    const where = []
    const params = []
    if (isClubUser(u)) {
      where.push('r.club_id = ?')
      params.push(userClubId(u))
    } else if (u.role === 'athlete') {
      where.push('r.id IN (SELECT registration_id FROM registration_athletes WHERE athlete_id = ?)')
      params.push(u.athlete_id ?? 0)
    } else {
      throw forbidden('Use the admin entries page.')
    }
    entryFilters(req.query, where, params)
    const p = pagination(req.query, { defaultSize: 25 })
    const sql = where.join(' AND ')
    const base = ENTRY_LIST_SQL + ` WHERE ${sql}`
    const total = db.get(`SELECT COUNT(*) AS n FROM (${base})`, params).n
    const rows = db.all(`${base} ORDER BY ${orderBy(req.query, ENTRY_SORT, 'r.created_at DESC')} LIMIT ? OFFSET ?`, [...params, p.limit, p.offset])
    res.json(paged(rows, total, p))
  })

  /** Live eligibility check for the registration wizard. Saves nothing. */
  r.post('/check', clubUser, (req, res) => {
    const clubId = userClubId(req.user)
    const d = validate(req.body, { event_id: id(), team_id: id(), ...entrySchema })
    const event = loadEvent(d.event_id)
    const result = checkEntry(db, {
      event,
      clubId,
      teamId: d.team_id,
      categoryId: d.category_id,
      weightDivisionId: d.weight_division_id,
      athleteIds: d.athlete_ids,
      excludeId: Number(req.body.exclude_id) || null,
    })
    res.json({ eligible: result.problems.length === 0, problems: result.problems, missing_documents: result.missing, fee: result.fee ?? 0, currency: event.currency })
  })

  /**
   * Create one or more entries for a championship in one go.
   * Every entry is validated first; nothing is saved unless all pass.
   */
  r.post('/', clubUser, (req, res) => {
    const clubId = userClubId(req.user)
    const d = validate(req.body, {
      event_id: id(),
      team_id: id(),
      coach_id: id({ required: false }),
      club_note: str({ required: false, max: 1000 }),
      submit: bool(),
      entries: list(entrySchema, { max: 40 }),
    })
    if (!d.entries.length) throw badRequest('Add at least one category entry.', { entries: 'Add at least one category entry.' })
    const event = loadEvent(d.event_id)
    if (!isRegistrationOpen(event)) throw conflict('Registration for this championship is not open.')
    checkCoach(clubId, d.coach_id)

    // Two entries in the same request cannot put an athlete in one category twice.
    const seen = new Set()
    for (const e of d.entries) {
      for (const a of e.athlete_ids) {
        const key = `${a}:${e.category_id}`
        if (seen.has(key) && !event.allow_duplicate_entries) throw conflict('The same athlete is entered twice in one category.')
        seen.add(key)
      }
    }

    const checks = d.entries.map((e) =>
      checkEntry(db, { event, clubId, teamId: d.team_id, categoryId: e.category_id, weightDivisionId: e.weight_division_id, athleteIds: e.athlete_ids }),
    )
    const problems = checks.flatMap((c, i) => c.problems.map((p) => (d.entries.length > 1 ? `Entry ${i + 1}: ${p}` : p)))
    if (problems.length) throw new HttpError(422, problems[0], { problems })
    if (d.submit) {
      const missing = [...new Set(checks.flatMap((c) => c.missing))]
      if (missing.length) throw new HttpError(422, `Required documents are missing — ${missing[0]}`, { problems: missing.map((m) => `Missing documents — ${m}`) })
    }

    const status = d.submit ? 'submitted' : 'draft'
    const created = db.transaction(() =>
      d.entries.map((e, i) => {
        const c = checks[i]
        const code = uniqueCode(db, 'registrations', 'code', `REG-${event.start_date.slice(2, 4)}`)
        const row = db.run(
          `INSERT INTO registrations (code, event_id, club_id, team_id, category_id, weight_division_id, coach_id, status, fee_amount, currency,
             payment_status, club_note, submitted_at, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            code,
            event.id,
            clubId,
            d.team_id,
            e.category_id,
            c.category.discipline === 'kyorugi' ? e.weight_division_id : null,
            d.coach_id,
            status,
            c.fee,
            event.currency,
            c.fee > 0 ? 'unpaid' : 'waived',
            d.club_note,
            d.submit ? new Date().toISOString() : null,
            req.user.id,
          ],
        )
        for (const a of e.athlete_ids) db.run('INSERT INTO registration_athletes (registration_id, athlete_id) VALUES (?, ?)', [row.id, a])
        // An athlete without a team joins the team they are entered for.
        db.run('UPDATE athletes SET team_id = ? WHERE team_id IS NULL AND id IN (SELECT athlete_id FROM registration_athletes WHERE registration_id = ?)', [d.team_id, row.id])
        if (d.submit) snapshotAthletes(db, row.id)
        return { id: row.id, code }
      }),
    )

    audit(db, req, d.submit ? 'submit' : 'save_draft', 'registration', created[0].id, { event_id: event.id, codes: created.map((c) => c.code) })
    if (d.submit) {
      notifyClub(db, clubId, {
        title: `${created.length} entr${created.length === 1 ? 'y' : 'ies'} submitted for ${event.name}`,
        body: `Registration ID${created.length === 1 ? '' : 's'}: ${created.map((c) => c.code).join(', ')}. The organizer will review ${created.length === 1 ? 'it' : 'them'} and you will be notified of the decision.`,
        link: '/portal/entries',
        kind: 'success',
      })
      notifyEventAdmins(db, event.id, {
        title: `New entries: ${event.name}`,
        body: `${db.get('SELECT name FROM clubs WHERE id = ?', clubId).name} submitted ${created.length} entr${created.length === 1 ? 'y' : 'ies'}.`,
        link: `/portal/admin/registrations?eventId=${event.id}&status=submitted`,
      })
    }
    res.status(201).json({ items: created.map((c) => loadRegistration(db, c.id)) })
  })

  r.get('/:id', requireAuth, (req, res) => {
    const row = visible(req, req.params.id)
    res.json({ registration: loadRegistration(db, row.id) })
  })

  r.patch('/:id', clubUser, (req, res) => {
    const row = editable(req, req.params.id)
    const event = db.get('SELECT * FROM events WHERE id = ?', row.event_id)
    if (!canClubEdit(row, event)) throw conflict('This entry can no longer be changed. The deadline has passed or it is already being reviewed.')
    const d = validate(req.body, { ...entrySchema, team_id: id({ required: false }), coach_id: id({ required: false }), club_note: str({ required: false, max: 1000 }) }, { partial: true })
    checkCoach(row.club_id, d.coach_id)
    const currentAthletes = db.all('SELECT athlete_id FROM registration_athletes WHERE registration_id = ?', row.id).map((a) => a.athlete_id)
    const next = {
      team_id: d.team_id ?? row.team_id,
      category_id: d.category_id ?? row.category_id,
      weight_division_id: 'weight_division_id' in d ? d.weight_division_id : row.weight_division_id,
      athlete_ids: d.athlete_ids ?? currentAthletes,
    }
    const c = checkEntry(db, {
      event,
      clubId: row.club_id,
      teamId: next.team_id,
      categoryId: next.category_id,
      weightDivisionId: next.weight_division_id,
      athleteIds: next.athlete_ids,
      excludeId: row.id,
    })
    if (c.problems.length) throw new HttpError(422, c.problems[0], { problems: c.problems })
    db.transaction(() => {
      db.run(
        `UPDATE registrations SET team_id = ?, category_id = ?, weight_division_id = ?, coach_id = ?, club_note = ?, fee_amount = ?,
           payment_status = CASE WHEN payment_status IN ('paid','pending') THEN payment_status WHEN ? > 0 THEN 'unpaid' ELSE 'waived' END,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
        [
          next.team_id,
          next.category_id,
          c.category.discipline === 'kyorugi' ? next.weight_division_id : null,
          'coach_id' in d ? d.coach_id : row.coach_id,
          'club_note' in d ? d.club_note : row.club_note,
          c.fee,
          c.fee,
          row.id,
        ],
      )
      if (d.athlete_ids) {
        db.run('DELETE FROM registration_athletes WHERE registration_id = ?', row.id)
        for (const a of d.athlete_ids) db.run('INSERT INTO registration_athletes (registration_id, athlete_id) VALUES (?, ?)', [row.id, a])
      }
      if (row.status !== 'draft') snapshotAthletes(db, row.id)
    })
    audit(db, req, 'update', 'registration', row.id, Object.keys(d))
    res.json({ registration: loadRegistration(db, row.id) })
  })

  /** Submit a draft, or resubmit after a requested correction. */
  r.post('/:id/submit', clubUser, (req, res) => {
    const row = editable(req, req.params.id)
    const event = db.get('SELECT * FROM events WHERE id = ?', row.event_id)
    if (!['draft', 'correction_required'].includes(row.status)) throw conflict('Only drafts and entries needing correction can be submitted.')
    if (!canClubEdit(row, event)) throw conflict('Registration for this championship is closed.')
    const athleteIds = db.all('SELECT athlete_id FROM registration_athletes WHERE registration_id = ?', row.id).map((a) => a.athlete_id)
    const c = checkEntry(db, { event, clubId: row.club_id, teamId: row.team_id, categoryId: row.category_id, weightDivisionId: row.weight_division_id, athleteIds, excludeId: row.id })
    const problems = [...c.problems, ...c.missing.map((m) => `Missing documents — ${m}`)]
    if (problems.length) throw new HttpError(422, problems[0], { problems })
    const wasCorrection = row.status === 'correction_required'
    db.transaction(() => {
      db.run("UPDATE registrations SET status = 'submitted', submitted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", row.id)
      snapshotAthletes(db, row.id)
    })
    audit(db, req, wasCorrection ? 'resubmit' : 'submit', 'registration', row.id)
    notifyClub(db, row.club_id, { title: `Entry ${row.code} ${wasCorrection ? 'resubmitted' : 'submitted'}`, body: `${event.name}. You will be notified when it is reviewed.`, link: `/portal/entries/${row.id}`, kind: 'success' })
    notifyEventAdmins(db, event.id, { title: `${wasCorrection ? 'Corrected entry' : 'New entry'} ${row.code}`, body: event.name, link: `/portal/admin/registrations/${row.id}` })
    res.json({ registration: loadRegistration(db, row.id) })
  })

  r.post('/:id/cancel', clubUser, (req, res) => {
    const row = editable(req, req.params.id)
    const event = db.get('SELECT * FROM events WHERE id = ?', row.event_id)
    if (['cancelled', 'rejected'].includes(row.status)) throw conflict('This entry is already closed.')
    if (new Date().toISOString().slice(0, 10) >= event.start_date) throw conflict('The championship has started; contact the organizer to withdraw.')
    db.run("UPDATE registrations SET status = 'cancelled', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", row.id)
    audit(db, req, 'cancel', 'registration', row.id)
    if (row.status !== 'draft') notifyEventAdmins(db, event.id, { title: `Entry ${row.code} withdrawn`, body: event.name, link: `/portal/admin/registrations/${row.id}` })
    res.json({ registration: loadRegistration(db, row.id) })
  })

  /** Permanently remove a draft that was never submitted. */
  r.delete('/:id', clubUser, (req, res) => {
    const row = editable(req, req.params.id)
    if (row.status !== 'draft') throw conflict('Only drafts can be deleted. Cancel submitted entries instead.')
    db.run('DELETE FROM registrations WHERE id = ?', row.id)
    audit(db, req, 'delete_draft', 'registration', row.id, { code: row.code })
    res.json({ ok: true })
  })

  r.get('/:id/confirmation.pdf', requireAuth, (req, res) => {
    const row = visible(req, req.params.id)
    confirmationPdf(res, loadRegistration(db, row.id))
  })

  /** Club reports a payment (e.g. bank transfer with a receipt). The organizer confirms it. */
  r.post('/:id/payments', clubUser, uploadOne('proof'), (req, res) => {
    try {
      const row = editable(req, req.params.id)
      if (['cancelled', 'rejected', 'draft'].includes(row.status)) throw conflict('Submit the entry before reporting a payment.')
      if (row.payment_status === 'paid' || row.payment_status === 'waived') throw conflict('This entry is already settled.')
      const d = validate(req.body, {
        amount: num({ min: 1, max: 10_000_000 }),
        method: oneOf(['bank_transfer', 'cash', 'online', 'other']),
        reference: str({ required: false, max: 120 }),
        note: str({ required: false, max: 500 }),
      })
      const result = db.transaction(() => {
        let proofId = null
        if (req.file) {
          proofId = db.run(
            "INSERT INTO documents (club_id, registration_id, kind, file_path, original_name, mime, size, uploaded_by) VALUES (?, ?, 'payment_proof', ?, ?, ?, ?, ?)",
            [row.club_id, row.id, storedPath(req.file, 'private'), req.file.originalname.slice(0, 200), req.file.mimetype, req.file.size, req.user.id],
          ).id
        }
        const p = db.run(
          "INSERT INTO payments (registration_id, amount, currency, method, reference, status, proof_document_id, note, recorded_by) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)",
          [row.id, d.amount, row.currency, d.method, d.reference, proofId, d.note, req.user.id],
        )
        db.run("UPDATE registrations SET payment_status = 'pending', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", row.id)
        return p.id
      })
      audit(db, req, 'report_payment', 'payment', result, { registration_id: row.id, amount: d.amount })
      notifyEventAdmins(db, row.event_id, { title: `Payment reported for ${row.code}`, body: `${row.currency} ${d.amount} by ${d.method.replace('_', ' ')}`, link: `/portal/admin/payments` })
      res.status(201).json({ registration: loadRegistration(db, row.id) })
    } catch (err) {
      if (req.file) removeFile(req.file.path)
      throw err
    }
  })

  /** Attach a document to one entry (e.g. a team list for a demonstration). */
  r.post('/:id/documents', clubUser, uploadOne('file'), (req, res) => {
    try {
      const row = editable(req, req.params.id)
      const file = requireFile(req)
      const { kind } = validate(req.body, { kind: oneOf(['medical', 'id_document', 'certificate', 'other']) })
      db.run('INSERT INTO documents (club_id, registration_id, kind, file_path, original_name, mime, size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
        row.club_id,
        row.id,
        kind,
        storedPath(file, 'private'),
        file.originalname.slice(0, 200),
        file.mimetype,
        file.size,
        req.user.id,
      ])
      res.status(201).json({ registration: loadRegistration(db, row.id) })
    } catch (err) {
      if (req.file) removeFile(req.file.path)
      throw err
    }
  })

  return r
}
