import { Router } from 'express'
import { requireRole } from '../lib/auth.js'
import { assertManageEvent, eventScopeSql, isSuper } from '../lib/access.js'
import { audit } from '../lib/audit.js'
import { badRequest, conflict, forbidden, notFound } from '../lib/http.js'
import { slugify } from '../lib/ids.js'
import { BELTS, DISCIPLINES, EVENT_STATUSES, categoryName, weightName } from '../lib/domain.js'
import { eventConfig, presentEvent } from '../lib/events.js'
import { notifyClub } from '../lib/notify.js'
import { IMAGE_TYPES, removeFile, requireFile, storedPath, uploadOne } from '../lib/uploads.js'
import { bool, date, email, id, ids, list, num, oneOf, phone, str, text, validate } from '../lib/validate.js'

const eventSchema = {
  name: str({ max: 160 }),
  organizer: str({ max: 160 }),
  federation: str({ required: false, max: 160 }),
  summary: str({ required: false, max: 400 }),
  description: text(),
  rules: text(),
  schedule: list({ date: date(), time: str({ required: false, max: 40 }), item: str({ max: 200 }) }, { max: 100 }),
  venue_name: str({ required: false, max: 160 }),
  venue_address: str({ required: false, max: 300 }),
  city: str({ required: false, max: 80 }),
  country: str({ required: false, max: 80 }),
  start_date: date(),
  end_date: date(),
  registration_opens: date({ required: false }),
  registration_deadline: date(),
  currency: str({ required: false, max: 8, pattern: /^[A-Za-z]{3}$/, message: 'Use a 3-letter currency code, e.g. PKR.' }),
  base_fee: num({ required: false, min: 0, max: 10_000_000 }),
  age_method: oneOf(['birth_year', 'exact_date'], { required: false }),
  age_reference_date: date({ required: false }),
  require_medical: bool(),
  require_id_document: bool(),
  require_photo: bool(),
  allow_duplicate_entries: bool(),
  max_categories_per_athlete: num({ required: false, min: 1, max: 20, integer: true }),
  weight_tolerance_kg: num({ required: false, min: 0, max: 5 }),
  contact_email: email({ required: false }),
  contact_phone: phone(),
}

function checkDates(d, existing = {}) {
  const v = { ...existing, ...d }
  const fields = {}
  if (v.end_date < v.start_date) fields.end_date = 'End date must be on or after the start date.'
  if (v.registration_deadline > v.end_date) fields.registration_deadline = 'Deadline must be before the championship ends.'
  if (v.registration_opens && v.registration_opens > v.registration_deadline) fields.registration_opens = 'Registration must open before the deadline.'
  if (Object.keys(fields).length) throw badRequest('Please check the dates.', fields)
}

function toColumns(data) {
  const out = { ...data }
  if ('schedule' in out) {
    out.schedule_json = JSON.stringify(out.schedule ?? [])
    delete out.schedule
  }
  if ('currency' in out && out.currency) out.currency = out.currency.toUpperCase()
  for (const k of ['currency', 'base_fee', 'age_method', 'weight_tolerance_kg']) if (k in out && out[k] === null) delete out[k]
  return out
}

export function adminEventRoutes(db) {
  const r = Router()
  r.use(requireRole('super_admin', 'organizer'))

  const full = (eventId) => ({ event: presentEvent(db, db.get('SELECT * FROM events WHERE id = ?', eventId)), ...eventConfig(db, eventId, { includeInactive: true }) })

  r.get('/', (req, res) => {
    const scope = eventScopeSql(db, req.user, 'id')
    const events = db.all(`SELECT * FROM events WHERE ${scope.sql} ORDER BY start_date DESC`, scope.params)
    res.json({ items: events.map((e) => presentEvent(db, e)) })
  })

  r.post('/', (req, res) => {
    const data = toColumns(validate(req.body, eventSchema))
    checkDates(data)
    let slug = slugify(`${data.name}-${data.start_date.slice(0, 4)}`)
    let n = 2
    while (db.get('SELECT 1 AS x FROM events WHERE slug = ?', slug)) slug = `${slugify(data.name)}-${data.start_date.slice(0, 4)}-${n++}`
    const cols = Object.keys(data)
    const { id: eventId } = db.transaction(() => {
      const row = db.run(
        `INSERT INTO events (slug, created_by, ${cols.join(', ')}) VALUES (?, ?, ${cols.map(() => '?').join(', ')})`,
        [slug, req.user.id, ...Object.values(data)],
      )
      if (req.user.role === 'organizer') db.run('INSERT INTO event_organizers (event_id, user_id) VALUES (?, ?)', [row.id, req.user.id])
      return row
    })
    audit(db, req, 'create', 'event', eventId, { name: data.name })
    res.status(201).json(full(eventId))
  })

  r.get('/:id', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const organizers = db.all(
      'SELECT u.id, u.name, u.email FROM event_organizers eo JOIN users u ON u.id = eo.user_id WHERE eo.event_id = ?',
      event.id,
    )
    res.json({ ...full(event.id), organizers })
  })

  r.patch('/:id', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const data = toColumns(validate(req.body, eventSchema, { partial: true }))
    checkDates(data, event)
    if (Object.keys(data).length) {
      db.run(
        `UPDATE events SET ${Object.keys(data).map((k) => `${k} = ?`).join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
        [...Object.values(data), event.id],
      )
      audit(db, req, 'update', 'event', event.id, Object.keys(data))
    }
    res.json(full(event.id))
  })

  r.delete('/:id', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    if (!isSuper(req.user)) throw forbidden('Only a super admin can delete a championship.')
    const used = db.get('SELECT COUNT(*) AS n FROM registrations WHERE event_id = ?', event.id).n
    if (used) throw conflict('This championship has entries. Unpublish or close it instead of deleting it.')
    db.run('DELETE FROM events WHERE id = ?', event.id)
    ;[event.poster_path, event.invitation_pdf_path, event.rules_pdf_path].forEach(removeFile)
    audit(db, req, 'delete', 'event', event.id, { name: event.name })
    res.json({ ok: true })
  })

  r.post('/:id/publish', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const published = req.body?.published ? 1 : 0
    if (published && !db.get('SELECT 1 AS x FROM event_categories WHERE event_id = ? AND active = 1', event.id)) {
      throw badRequest('Add at least one competition category before publishing.')
    }
    db.run('UPDATE events SET published = ? WHERE id = ?', [published, event.id])
    audit(db, req, published ? 'publish' : 'unpublish', 'event', event.id)
    res.json(full(event.id))
  })

  /** Manual status (e.g. close registration early). `null` returns to date-based status. */
  r.post('/:id/status', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const { status } = validate(req.body, { status: oneOf(EVENT_STATUSES, { required: false }) })
    db.run('UPDATE events SET status_override = ? WHERE id = ?', [status, event.id])
    audit(db, req, 'set_status', 'event', event.id, { status: status ?? 'automatic' })
    if (status === 'registration_closed') {
      const clubs = db.all("SELECT DISTINCT club_id FROM registrations WHERE event_id = ? AND status != 'cancelled'", event.id)
      for (const c of clubs) {
        notifyClub(db, c.club_id, { title: `Registration closed: ${event.name}`, body: 'Entries can no longer be changed.', link: `/portal/events/${event.slug}` })
      }
    }
    res.json(full(event.id))
  })

  const FILE_FIELDS = { poster: 'poster_path', invitation: 'invitation_pdf_path', rules: 'rules_pdf_path' }
  r.post('/:id/files/:kind', (req, res, next) => {
    const kind = req.params.kind
    if (!FILE_FIELDS[kind]) return next(notFound('File type'))
    // Check permission before accepting any bytes.
    assertManageEvent(db, req.user, req.params.id)
    const types = kind === 'poster' ? IMAGE_TYPES : ['application/pdf']
    uploadOne('file', { area: 'public', types })(req, res, (err) => {
      if (err) return next(err)
      try {
        const event = assertManageEvent(db, req.user, req.params.id)
        const file = requireFile(req)
        const column = FILE_FIELDS[kind]
        db.run(`UPDATE events SET ${column} = ? WHERE id = ?`, [storedPath(file, 'public'), event.id])
        removeFile(event[column])
        audit(db, req, 'upload', 'event', event.id, { kind })
        res.json(full(event.id))
      } catch (e) {
        if (req.file) removeFile(req.file.path)
        next(e)
      }
    })
  })

  r.delete('/:id/files/:kind', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const column = FILE_FIELDS[req.params.kind]
    if (!column) throw notFound('File type')
    db.run(`UPDATE events SET ${column} = NULL WHERE id = ?`, event.id)
    removeFile(event[column])
    res.json(full(event.id))
  })

  // ---- Age divisions -------------------------------------------------------
  const ageSchema = {
    name: str({ max: 60 }),
    min_age: num({ min: 3, max: 99, integer: true }),
    max_age: num({ min: 3, max: 99, integer: true }),
    sort: num({ required: false, integer: true }),
  }
  const checkAge = (d) => {
    if (d.min_age !== undefined && d.max_age !== undefined && d.max_age < d.min_age) {
      throw badRequest('Check the ages.', { max_age: 'Maximum age must be at least the minimum age.' })
    }
  }

  r.post('/:id/age-divisions', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const d = validate(req.body, ageSchema)
    checkAge(d)
    db.run('INSERT INTO age_divisions (event_id, name, min_age, max_age, sort) VALUES (?, ?, ?, ?, ?)', [event.id, d.name, d.min_age, d.max_age, d.sort ?? 0])
    res.status(201).json(full(event.id))
  })

  r.patch('/:id/age-divisions/:did', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const row = db.get('SELECT * FROM age_divisions WHERE id = ? AND event_id = ?', [req.params.did, event.id])
    if (!row) throw notFound('Age group')
    const d = validate(req.body, ageSchema, { partial: true })
    checkAge({ ...row, ...d })
    if (Object.keys(d).length) db.run(`UPDATE age_divisions SET ${Object.keys(d).map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, [...Object.values(d), row.id])
    res.json(full(event.id))
  })

  r.delete('/:id/age-divisions/:did', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const used = db.get(
      'SELECT COUNT(*) AS n FROM registrations WHERE category_id IN (SELECT id FROM event_categories WHERE age_division_id = ?)',
      req.params.did,
    ).n
    if (used) throw conflict('Entries use this age group. Deactivate its categories instead.')
    db.transaction(() => {
      db.run('DELETE FROM event_categories WHERE age_division_id = ? AND event_id = ?', [req.params.did, event.id])
      db.run('DELETE FROM age_divisions WHERE id = ? AND event_id = ?', [req.params.did, event.id])
    })
    res.json(full(event.id))
  })

  // ---- Weight divisions ------------------------------------------------------
  const weightSchema = {
    age_division_id: id(),
    gender: oneOf(['male', 'female']),
    name: str({ required: false, max: 40 }),
    min_kg: num({ required: false, min: 0, max: 300 }),
    max_kg: num({ required: false, min: 0, max: 300 }),
    sort: num({ required: false, integer: true }),
  }
  const checkAgeOwner = (eventId, ageId) => {
    if (!db.get('SELECT 1 AS x FROM age_divisions WHERE id = ? AND event_id = ?', [ageId, eventId])) {
      throw badRequest('Choose an age group of this championship.', { age_division_id: 'Choose an age group of this championship.' })
    }
  }

  r.post('/:id/weight-divisions', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const d = validate(req.body, weightSchema)
    checkAgeOwner(event.id, d.age_division_id)
    if (d.min_kg === null && d.max_kg === null) throw badRequest('Enter a weight limit.', { max_kg: 'Enter an upper or lower limit.' })
    db.run('INSERT INTO weight_divisions (event_id, age_division_id, gender, name, min_kg, max_kg, sort) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      event.id,
      d.age_division_id,
      d.gender,
      d.name || weightName(d.min_kg, d.max_kg),
      d.min_kg,
      d.max_kg,
      d.sort ?? 0,
    ])
    res.status(201).json(full(event.id))
  })

  /**
   * Create a full weight ladder at once from upper limits, e.g. "45, 48, 51, 55".
   * Each class runs from the previous limit to its own; a final "+last" class is added.
   */
  r.post('/:id/weight-divisions/bulk', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const d = validate(req.body, {
      age_division_id: id(),
      gender: oneOf(['male', 'female']),
      limits: (v) => {
        const nums = String(v ?? '')
          .split(/[,\s]+/)
          .map((s) => s.replace(/^-/, ''))
          .filter(Boolean)
          .map(Number)
        if (!nums.length || nums.some((n) => !Number.isFinite(n) || n <= 0 || n > 300)) throw 'Enter weights separated by commas, e.g. 45, 48, 51.'
        return [...new Set(nums)].sort((a, b) => a - b)
      },
      add_open_class: bool(),
      replace: bool(),
    })
    checkAgeOwner(event.id, d.age_division_id)
    db.transaction(() => {
      if (d.replace) {
        const used = db.get(
          'SELECT COUNT(*) AS n FROM registrations WHERE weight_division_id IN (SELECT id FROM weight_divisions WHERE event_id = ? AND age_division_id = ? AND gender = ?)',
          [event.id, d.age_division_id, d.gender],
        ).n
        if (used) throw conflict('Entries already use these weight categories, so they cannot be replaced.')
        db.run('DELETE FROM weight_divisions WHERE event_id = ? AND age_division_id = ? AND gender = ?', [event.id, d.age_division_id, d.gender])
      }
      let prev = null
      d.limits.forEach((max, i) => {
        db.run('INSERT INTO weight_divisions (event_id, age_division_id, gender, name, min_kg, max_kg, sort) VALUES (?, ?, ?, ?, ?, ?, ?)', [
          event.id,
          d.age_division_id,
          d.gender,
          weightName(prev, max),
          prev,
          max,
          i,
        ])
        prev = max
      })
      if (d.add_open_class) {
        db.run('INSERT INTO weight_divisions (event_id, age_division_id, gender, name, min_kg, max_kg, sort) VALUES (?, ?, ?, ?, ?, NULL, ?)', [
          event.id,
          d.age_division_id,
          d.gender,
          weightName(prev, null),
          prev,
          d.limits.length,
        ])
      }
    })
    audit(db, req, 'configure_weights', 'event', event.id, { age_division_id: d.age_division_id, gender: d.gender })
    res.status(201).json(full(event.id))
  })

  r.patch('/:id/weight-divisions/:wid', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const row = db.get('SELECT * FROM weight_divisions WHERE id = ? AND event_id = ?', [req.params.wid, event.id])
    if (!row) throw notFound('Weight category')
    const d = validate(req.body, weightSchema, { partial: true })
    if (d.age_division_id) checkAgeOwner(event.id, d.age_division_id)
    if (Object.keys(d).length) db.run(`UPDATE weight_divisions SET ${Object.keys(d).map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, [...Object.values(d), row.id])
    res.json(full(event.id))
  })

  r.delete('/:id/weight-divisions/:wid', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const used = db.get('SELECT COUNT(*) AS n FROM registrations WHERE weight_division_id = ?', req.params.wid).n
    if (used) throw conflict('Entries use this weight category, so it cannot be deleted.')
    db.run('DELETE FROM weight_divisions WHERE id = ? AND event_id = ?', [req.params.wid, event.id])
    res.json(full(event.id))
  })

  // ---- Belt divisions ------------------------------------------------------
  const beltSchema = {
    name: str({ max: 60 }),
    belts: (v) => {
      const arr = Array.isArray(v) ? v : []
      if (!arr.length) throw 'Choose at least one belt.'
      const bad = arr.find((b) => !BELTS.includes(b))
      if (bad) throw `Unknown belt: ${bad}`
      return arr
    },
    sort: num({ required: false, integer: true }),
  }

  r.post('/:id/belt-divisions', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const d = validate(req.body, beltSchema)
    db.run('INSERT INTO belt_divisions (event_id, name, belts_json, sort) VALUES (?, ?, ?, ?)', [event.id, d.name, JSON.stringify(d.belts), d.sort ?? 0])
    res.status(201).json(full(event.id))
  })

  r.patch('/:id/belt-divisions/:bid', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const row = db.get('SELECT * FROM belt_divisions WHERE id = ? AND event_id = ?', [req.params.bid, event.id])
    if (!row) throw notFound('Belt group')
    const d = validate(req.body, beltSchema, { partial: true })
    if (d.belts) {
      d.belts_json = JSON.stringify(d.belts)
      delete d.belts
    }
    if (Object.keys(d).length) db.run(`UPDATE belt_divisions SET ${Object.keys(d).map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, [...Object.values(d), row.id])
    res.json(full(event.id))
  })

  r.delete('/:id/belt-divisions/:bid', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const used = db.get(
      'SELECT COUNT(*) AS n FROM registrations WHERE category_id IN (SELECT id FROM event_categories WHERE belt_division_id = ?)',
      req.params.bid,
    ).n
    if (used) throw conflict('Entries use this belt group. Deactivate its categories instead.')
    db.transaction(() => {
      db.run('DELETE FROM event_categories WHERE belt_division_id = ? AND event_id = ?', [req.params.bid, event.id])
      db.run('DELETE FROM belt_divisions WHERE id = ? AND event_id = ?', [req.params.bid, event.id])
    })
    res.json(full(event.id))
  })

  // ---- Categories ----------------------------------------------------------
  const categorySchema = {
    discipline: oneOf(Object.keys(DISCIPLINES)),
    subtype: str({ required: false, max: 40 }),
    format: oneOf(['individual', 'pair', 'team'], { required: false }),
    gender: oneOf(['male', 'female', 'mixed', 'open'], { required: false }),
    age_division_id: id({ required: false }),
    belt_division_id: id({ required: false }),
    min_members: num({ required: false, min: 1, max: 60, integer: true }),
    max_members: num({ required: false, min: 1, max: 60, integer: true }),
    fee: num({ required: false, min: 0, max: 10_000_000 }),
    max_entries_per_team: num({ required: false, min: 1, max: 100, integer: true }),
    name: str({ required: false, max: 160 }),
    notes: str({ required: false, max: 500 }),
    active: (v) => (v === undefined ? undefined : v === false || v === 0 || v === '0' || v === 'false' ? 0 : 1),
    sort: num({ required: false, integer: true }),
  }

  /** Fill format-dependent defaults and check references belong to the event. */
  function normaliseCategory(eventId, d, existing = {}) {
    const v = { ...existing, ...d }
    const spec = DISCIPLINES[v.discipline]
    if (v.subtype && !spec.subtypes.some((s) => s.value === v.subtype)) throw badRequest('Invalid sub-type.', { subtype: 'Choose a valid type for this discipline.' })
    v.format = v.format || spec.formats[0]
    if (!spec.formats.includes(v.format)) throw badRequest('Invalid format.', { format: `${spec.label} supports: ${spec.formats.join(', ')}.` })
    v.gender = v.gender || 'open'
    if (v.format === 'individual') {
      v.min_members = 1
      v.max_members = 1
    } else if (v.format === 'pair') {
      v.min_members = 2
      v.max_members = 2
    } else {
      v.min_members = v.min_members || 3
      v.max_members = v.max_members || Math.max(v.min_members, 5)
      if (v.max_members < v.min_members) throw badRequest('Check team size.', { max_members: 'Maximum must be at least the minimum.' })
    }
    if (v.discipline === 'kyorugi' && !['male', 'female'].includes(v.gender)) {
      throw badRequest('Kyorugi categories are male or female.', { gender: 'Choose male or female for kyorugi.' })
    }
    const age = v.age_division_id ? db.get('SELECT * FROM age_divisions WHERE id = ? AND event_id = ?', [v.age_division_id, eventId]) : null
    if (v.age_division_id && !age) throw badRequest('Invalid age group.', { age_division_id: 'Choose an age group of this championship.' })
    if (v.discipline === 'kyorugi' && !age) throw badRequest('Kyorugi needs an age group.', { age_division_id: 'Kyorugi categories need an age group (weight classes belong to it).' })
    const belt = v.belt_division_id ? db.get('SELECT * FROM belt_divisions WHERE id = ? AND event_id = ?', [v.belt_division_id, eventId]) : null
    if (v.belt_division_id && !belt) throw badRequest('Invalid belt group.', { belt_division_id: 'Choose a belt group of this championship.' })
    if (!d.name && (!existing.name || ['discipline', 'subtype', 'format', 'gender', 'age_division_id', 'belt_division_id'].some((k) => k in d))) {
      v.name = categoryName(v, age, belt)
    }
    return v
  }

  const CATEGORY_COLUMNS = ['discipline', 'subtype', 'format', 'gender', 'age_division_id', 'belt_division_id', 'min_members', 'max_members', 'fee', 'max_entries_per_team', 'name', 'notes', 'active', 'sort']

  function insertCategory(eventId, v) {
    const cols = CATEGORY_COLUMNS.filter((c) => v[c] !== undefined)
    return db.run(`INSERT INTO event_categories (event_id, ${cols.join(', ')}) VALUES (?, ${cols.map(() => '?').join(', ')})`, [eventId, ...cols.map((c) => v[c])])
  }

  r.post('/:id/categories', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const v = normaliseCategory(event.id, validate(req.body, categorySchema))
    insertCategory(event.id, v)
    res.status(201).json(full(event.id))
  })

  /** Create one category per gender × age group × belt group combination. */
  r.post('/:id/categories/generate', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const d = validate(req.body, {
      discipline: oneOf(Object.keys(DISCIPLINES)),
      subtype: str({ required: false, max: 40 }),
      format: oneOf(['individual', 'pair', 'team'], { required: false }),
      genders: (v) => {
        const arr = Array.isArray(v) ? v : []
        if (!arr.length || arr.some((g) => !['male', 'female', 'mixed', 'open'].includes(g))) throw 'Choose at least one gender option.'
        return arr
      },
      age_division_ids: ids({ max: 30 }),
      belt_division_ids: ids({ max: 20 }),
      min_members: num({ required: false, min: 1, max: 60, integer: true }),
      max_members: num({ required: false, min: 1, max: 60, integer: true }),
      fee: num({ required: false, min: 0, max: 10_000_000 }),
    })
    const ages = d.age_division_ids.length ? d.age_division_ids : [null]
    const belts = d.belt_division_ids.length ? d.belt_division_ids : [null]
    let created = 0
    let skipped = 0
    db.transaction(() => {
      for (const gender of d.genders)
        for (const age_division_id of ages)
          for (const belt_division_id of belts) {
            const v = normaliseCategory(event.id, {
              discipline: d.discipline,
              subtype: d.subtype,
              format: d.format,
              gender,
              age_division_id,
              belt_division_id,
              min_members: d.min_members,
              max_members: d.max_members,
              fee: d.fee,
            })
            const exists = db.get(
              `SELECT 1 AS x FROM event_categories WHERE event_id = ? AND discipline = ? AND COALESCE(subtype,'') = COALESCE(?, '')
               AND format = ? AND gender = ? AND COALESCE(age_division_id,0) = COALESCE(?,0) AND COALESCE(belt_division_id,0) = COALESCE(?,0)`,
              [event.id, v.discipline, v.subtype, v.format, v.gender, v.age_division_id, v.belt_division_id],
            )
            if (exists) {
              skipped++
              continue
            }
            insertCategory(event.id, v)
            created++
          }
    })
    audit(db, req, 'generate_categories', 'event', event.id, { discipline: d.discipline, created })
    res.status(201).json({ ...full(event.id), created, skipped })
  })

  r.patch('/:id/categories/:cid', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const row = db.get('SELECT * FROM event_categories WHERE id = ? AND event_id = ?', [req.params.cid, event.id])
    if (!row) throw notFound('Category')
    const d = validate(req.body, categorySchema, { partial: true })
    const structural = ['discipline', 'format', 'gender', 'age_division_id', 'belt_division_id', 'min_members', 'max_members'].some((k) => k in d && d[k] !== row[k])
    if (structural && db.get("SELECT 1 AS x FROM registrations WHERE category_id = ? AND status != 'cancelled'", row.id)) {
      throw conflict('Entries already use this category. You can still change its name, fee, notes or turn it off.')
    }
    const v = normaliseCategory(event.id, d, row)
    const cols = CATEGORY_COLUMNS.filter((c) => v[c] !== undefined && v[c] !== row[c])
    if (cols.length) db.run(`UPDATE event_categories SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`, [...cols.map((c) => v[c]), row.id])
    res.json(full(event.id))
  })

  r.delete('/:id/categories/:cid', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const used = db.get('SELECT COUNT(*) AS n FROM registrations WHERE category_id = ?', req.params.cid).n
    if (used) throw conflict('Entries use this category. Turn it off instead of deleting it.')
    db.run('DELETE FROM event_categories WHERE id = ? AND event_id = ?', [req.params.cid, event.id])
    res.json(full(event.id))
  })

  /** Copy age, weight and belt groups and categories from another championship. */
  r.post('/:id/copy-config', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const { from_event_id } = validate(req.body, { from_event_id: id() })
    const source = assertManageEvent(db, req.user, from_event_id)
    if (source.id === event.id) throw badRequest('Choose a different championship to copy from.')
    if (db.get('SELECT 1 AS x FROM registrations WHERE event_id = ?', event.id)) throw conflict('This championship already has entries; copy the setup into a new championship instead.')
    db.transaction(() => {
      db.run('DELETE FROM event_categories WHERE event_id = ?', event.id)
      db.run('DELETE FROM weight_divisions WHERE event_id = ?', event.id)
      db.run('DELETE FROM age_divisions WHERE event_id = ?', event.id)
      db.run('DELETE FROM belt_divisions WHERE event_id = ?', event.id)
      const ageMap = new Map()
      for (const a of db.all('SELECT * FROM age_divisions WHERE event_id = ?', source.id)) {
        ageMap.set(a.id, db.run('INSERT INTO age_divisions (event_id, name, min_age, max_age, sort) VALUES (?, ?, ?, ?, ?)', [event.id, a.name, a.min_age, a.max_age, a.sort]).id)
      }
      const beltMap = new Map()
      for (const b of db.all('SELECT * FROM belt_divisions WHERE event_id = ?', source.id)) {
        beltMap.set(b.id, db.run('INSERT INTO belt_divisions (event_id, name, belts_json, sort) VALUES (?, ?, ?, ?)', [event.id, b.name, b.belts_json, b.sort]).id)
      }
      for (const w of db.all('SELECT * FROM weight_divisions WHERE event_id = ?', source.id)) {
        db.run('INSERT INTO weight_divisions (event_id, age_division_id, gender, name, min_kg, max_kg, sort) VALUES (?, ?, ?, ?, ?, ?, ?)', [
          event.id,
          ageMap.get(w.age_division_id),
          w.gender,
          w.name,
          w.min_kg,
          w.max_kg,
          w.sort,
        ])
      }
      for (const c of db.all('SELECT * FROM event_categories WHERE event_id = ?', source.id)) {
        insertCategory(event.id, { ...c, age_division_id: c.age_division_id ? ageMap.get(c.age_division_id) : null, belt_division_id: c.belt_division_id ? beltMap.get(c.belt_division_id) : null })
      }
    })
    audit(db, req, 'copy_config', 'event', event.id, { from: source.id })
    res.json(full(event.id))
  })

  // ---- Announcements -------------------------------------------------------
  r.post('/:id/announcements', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    const d = validate(req.body, { title: str({ max: 160 }), body: str({ max: 5000 }), pinned: bool(), notify: bool() })
    const { id: aid } = db.run('INSERT INTO announcements (event_id, title, body, pinned, created_by) VALUES (?, ?, ?, ?, ?)', [event.id, d.title, d.body, d.pinned, req.user.id])
    if (d.notify) {
      const clubs = db.all("SELECT DISTINCT club_id FROM registrations WHERE event_id = ? AND status != 'cancelled'", event.id)
      for (const c of clubs) notifyClub(db, c.club_id, { title: `${event.name}: ${d.title}`, body: d.body.slice(0, 280), link: `/portal/events/${event.slug}`, kind: 'announcement' })
    }
    audit(db, req, 'announce', 'event', event.id, { announcement_id: aid, title: d.title })
    res.status(201).json(full(event.id))
  })

  r.delete('/:id/announcements/:aid', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    db.run('DELETE FROM announcements WHERE id = ? AND event_id = ?', [req.params.aid, event.id])
    res.json(full(event.id))
  })

  // ---- Organizers (super admin) --------------------------------------------
  r.put('/:id/organizers', (req, res) => {
    const event = assertManageEvent(db, req.user, req.params.id)
    if (!isSuper(req.user)) throw forbidden('Only a super admin can assign organizers.')
    const { user_ids } = validate(req.body, { user_ids: ids({ max: 20 }) })
    const valid = user_ids.filter((uid) => db.get("SELECT 1 AS x FROM users WHERE id = ? AND role = 'organizer'", uid))
    db.transaction(() => {
      db.run('DELETE FROM event_organizers WHERE event_id = ?', event.id)
      for (const uid of valid) db.run('INSERT INTO event_organizers (event_id, user_id) VALUES (?, ?)', [event.id, uid])
    })
    audit(db, req, 'assign_organizers', 'event', event.id, { user_ids: valid })
    res.json({ ok: true, user_ids: valid })
  })

  return r
}
