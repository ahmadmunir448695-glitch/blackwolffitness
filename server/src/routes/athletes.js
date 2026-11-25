import { Router } from 'express'
import { hashPassword, requireAuth, requireRole } from '../lib/auth.js'
import { isClubUser, ownedRow, userClubId } from '../lib/access.js'
import { audit } from '../lib/audit.js'
import { badRequest, conflict, likeTerm, notFound, orderBy, paged, pagination } from '../lib/http.js'
import { today, uniqueCode } from '../lib/ids.js'
import { BELTS, LIVE_STATUSES } from '../lib/domain.js'
import { IMAGE_TYPES, removeFile, requireFile, sendStored, storedPath, uploadOne } from '../lib/uploads.js'
import { date, email, id, num, oneOf, password, str, validate } from '../lib/validate.js'

const live = LIVE_STATUSES.map((s) => `'${s}'`).join(',')

const athleteSchema = {
  full_name: str({ max: 120 }),
  father_name: str({ required: false, max: 120 }),
  dob: (v) => {
    const d = date()(v)
    if (d > today()) throw 'Date of birth cannot be in the future.'
    if (d < '1920-01-01') throw 'Check the year of birth.'
    return d
  },
  gender: oneOf(['male', 'female']),
  nationality: str({ max: 80 }),
  id_number: str({ required: false, max: 40, pattern: /^[A-Za-z0-9 -]+$/, message: 'Use letters, numbers, spaces or dashes.' }),
  belt: oneOf(BELTS),
  weight_kg: num({ required: false, min: 10, max: 200 }),
  height_cm: num({ required: false, min: 50, max: 250 }),
  team_id: id({ required: false }),
  coach_id: id({ required: false }),
}

/** Athlete as sent to the browser: no storage paths. */
export function presentAthlete(a) {
  if (!a) return a
  const { photo_path, ...rest } = a
  return { ...rest, has_photo: Boolean(photo_path) }
}

export function athleteRoutes(db) {
  const r = Router()
  const clubUser = requireRole('club_manager', 'coach')

  function checkRefs(clubId, data) {
    if (data.team_id && !db.get('SELECT 1 AS x FROM teams WHERE id = ? AND club_id = ?', [data.team_id, clubId])) {
      throw badRequest('Choose one of your teams.', { team_id: 'Choose one of your teams.' })
    }
    if (data.coach_id && !db.get('SELECT 1 AS x FROM coaches WHERE id = ? AND club_id = ?', [data.coach_id, clubId])) {
      throw badRequest('Choose one of your coaches.', { coach_id: 'Choose one of your coaches.' })
    }
    if (data.id_number) {
      const dup = db.get('SELECT id FROM athletes WHERE club_id = ? AND id_number = ? COLLATE NOCASE', [clubId, data.id_number])
      if (dup && dup.id !== data._id) throw conflict('Another athlete in your club has this ID number.', { id_number: 'Already used by another athlete in your club.' })
    }
  }

  /** Signed-in athlete's own profile. */
  r.get('/me', requireRole('athlete'), (req, res) => {
    const a = db.get('SELECT * FROM athletes WHERE id = ?', req.user.athlete_id)
    if (!a) throw notFound('Athlete profile')
    res.json({ athlete: presentAthlete(a) })
  })

  r.get('/', clubUser, (req, res) => {
    const clubId = userClubId(req.user)
    const p = pagination(req.query, { defaultSize: 25 })
    const where = ['a.club_id = ?']
    const params = [clubId]
    if (req.query.teamId) {
      where.push('a.team_id = ?')
      params.push(Number(req.query.teamId))
    }
    if (req.query.gender === 'male' || req.query.gender === 'female') {
      where.push('a.gender = ?')
      params.push(req.query.gender)
    }
    if (req.query.q) {
      where.push("(a.full_name LIKE ? ESCAPE '\\' OR a.code LIKE ? ESCAPE '\\' OR a.id_number LIKE ? ESCAPE '\\')")
      const t = likeTerm(req.query.q)
      params.push(t, t, t)
    }
    const sql = where.join(' AND ')
    const total = db.get(`SELECT COUNT(*) AS n FROM athletes a WHERE ${sql}`, params).n
    const order = orderBy(req.query, { name: 'a.full_name', dob: 'a.dob', weight: 'a.weight_kg', belt: 'a.belt', created: 'a.created_at' }, 'a.full_name ASC')
    const rows = db.all(
      `SELECT a.*, t.name AS team_name, c.full_name AS coach_name,
              (SELECT COUNT(*) FROM registration_athletes ra JOIN registrations rg ON rg.id = ra.registration_id
               WHERE ra.athlete_id = a.id AND rg.status IN (${live})) AS active_entries,
              (SELECT group_concat(DISTINCT kind) FROM documents d WHERE d.athlete_id = a.id) AS document_kinds
       FROM athletes a LEFT JOIN teams t ON t.id = a.team_id LEFT JOIN coaches c ON c.id = a.coach_id
       WHERE ${sql} ORDER BY ${order} LIMIT ? OFFSET ?`,
      [...params, p.limit, p.offset],
    )
    res.json(paged(rows.map(presentAthlete), total, p))
  })

  r.post('/', clubUser, (req, res) => {
    const clubId = userClubId(req.user)
    const data = validate(req.body, athleteSchema)
    checkRefs(clubId, data)
    const code = uniqueCode(db, 'athletes', 'code', 'ATH')
    const { id: newId } = db.run(
      `INSERT INTO athletes (code, club_id, team_id, coach_id, full_name, father_name, dob, gender, nationality, id_number, belt, weight_kg, height_cm)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        clubId,
        data.team_id,
        data.coach_id,
        data.full_name,
        data.father_name,
        data.dob,
        data.gender,
        data.nationality,
        data.id_number,
        data.belt,
        data.weight_kg,
        data.height_cm,
      ],
    )
    audit(db, req, 'create', 'athlete', newId, { name: data.full_name })
    res.status(201).json({ athlete: presentAthlete(db.get('SELECT * FROM athletes WHERE id = ?', newId)) })
  })

  r.get('/:id', requireAuth, (req, res) => {
    const a = loadForRead(req)
    const documents = db.all(
      'SELECT id, kind, original_name, mime, size, registration_id, created_at FROM documents WHERE athlete_id = ? ORDER BY created_at DESC',
      a.id,
    )
    const entries = db.all(
      `SELECT r.id, r.code, r.status, r.payment_status, e.name AS event_name, c.name AS category_name, w.name AS weight_name
       FROM registration_athletes ra JOIN registrations r ON r.id = ra.registration_id
       JOIN events e ON e.id = r.event_id JOIN event_categories c ON c.id = r.category_id
       LEFT JOIN weight_divisions w ON w.id = r.weight_division_id
       WHERE ra.athlete_id = ? ORDER BY r.created_at DESC`,
      a.id,
    )
    const account = db.get("SELECT id, email, is_active FROM users WHERE athlete_id = ? AND role = 'athlete'", a.id)
    res.json({ athlete: presentAthlete(a), documents, entries, account })
  })

  function loadForRead(req) {
    if (req.user.role === 'athlete') {
      if (Number(req.params.id) !== req.user.athlete_id) throw notFound('Athlete')
      return db.get('SELECT * FROM athletes WHERE id = ?', req.user.athlete_id)
    }
    if (isClubUser(req.user)) return ownedRow(db, req.user, 'athletes', req.params.id, 'Athlete')
    // Organizers and admins may see athletes entered in their events.
    const a = db.get('SELECT * FROM athletes WHERE id = ?', req.params.id)
    if (!a) throw notFound('Athlete')
    if (req.user.role === 'super_admin') return a
    if (req.user.role === 'organizer') {
      const ok = db.get(
        `SELECT 1 AS x FROM registration_athletes ra JOIN registrations r ON r.id = ra.registration_id
         WHERE ra.athlete_id = ? AND (r.event_id IN (SELECT event_id FROM event_organizers WHERE user_id = ?)
           OR r.event_id IN (SELECT id FROM events WHERE created_by = ?))`,
        [a.id, req.user.id, req.user.id],
      )
      if (ok) return a
    }
    throw notFound('Athlete')
  }

  r.patch('/:id', clubUser, (req, res) => {
    const a = ownedRow(db, req.user, 'athletes', req.params.id, 'Athlete', { write: true })
    const data = validate(req.body, athleteSchema, { partial: true })
    checkRefs(a.club_id, { ...data, _id: a.id })
    if (Object.keys(data).length) {
      db.run(
        `UPDATE athletes SET ${Object.keys(data).map((k) => `${k} = ?`).join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
        [...Object.values(data), a.id],
      )
      audit(db, req, 'update', 'athlete', a.id, data)
    }
    res.json({ athlete: presentAthlete(db.get('SELECT * FROM athletes WHERE id = ?', a.id)) })
  })

  r.delete('/:id', requireRole('club_manager'), (req, res) => {
    const a = ownedRow(db, req.user, 'athletes', req.params.id, 'Athlete', { write: true })
    const used = db.get('SELECT COUNT(*) AS n FROM registration_athletes WHERE athlete_id = ?', a.id).n
    if (used) throw conflict('This athlete has championship entries and cannot be deleted. Remove them from the team instead.')
    const files = db.all('SELECT file_path FROM documents WHERE athlete_id = ?', a.id)
    db.transaction(() => {
      db.run("DELETE FROM users WHERE athlete_id = ? AND role = 'athlete'", a.id)
      db.run('DELETE FROM athletes WHERE id = ?', a.id)
    })
    removeFile(a.photo_path)
    files.forEach((f) => removeFile(f.file_path))
    audit(db, req, 'delete', 'athlete', a.id, { name: a.full_name })
    res.json({ ok: true })
  })

  r.post('/:id/photo', clubUser, uploadOne('file', { area: 'private', types: IMAGE_TYPES }), (req, res) => {
    const a = ownedRow(db, req.user, 'athletes', req.params.id, 'Athlete', { write: true })
    const file = requireFile(req)
    db.run('UPDATE athletes SET photo_path = ? WHERE id = ?', [storedPath(file, 'private'), a.id])
    removeFile(a.photo_path)
    res.json({ athlete: presentAthlete(db.get('SELECT * FROM athletes WHERE id = ?', a.id)) })
  })

  r.get('/:id/photo', requireAuth, (req, res) => {
    const a = loadForRead(req)
    if (!a.photo_path) throw notFound('Photo')
    sendStored(res, a.photo_path, `${a.code}-photo`)
  })

  r.post('/:id/documents', clubUser, uploadOne('file'), (req, res) => {
    const a = ownedRow(db, req.user, 'athletes', req.params.id, 'Athlete', { write: true })
    const file = requireFile(req)
    let kind
    try {
      kind = validate(req.body, { kind: oneOf(['medical', 'id_document', 'certificate', 'other']) }).kind
    } catch (err) {
      removeFile(file.path)
      throw err
    }
    const { id: docId } = db.run(
      'INSERT INTO documents (club_id, athlete_id, kind, file_path, original_name, mime, size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [a.club_id, a.id, kind, storedPath(file, 'private'), file.originalname.slice(0, 200), file.mimetype, file.size, req.user.id],
    )
    audit(db, req, 'upload', 'document', docId, { athlete_id: a.id, kind })
    res.status(201).json({ document: db.get('SELECT id, kind, original_name, mime, size, created_at FROM documents WHERE id = ?', docId) })
  })

  /** Give an athlete their own read-only login. */
  r.post('/:id/account', requireRole('club_manager'), (req, res) => {
    const a = ownedRow(db, req.user, 'athletes', req.params.id, 'Athlete', { write: true })
    const data = validate(req.body, { email: email(), password: password() })
    if (db.get("SELECT 1 AS x FROM users WHERE athlete_id = ? AND role = 'athlete'", a.id)) throw conflict('This athlete already has a login.')
    if (db.get('SELECT 1 AS x FROM users WHERE email = ?', data.email)) throw conflict('This email is already registered.', { email: 'Already registered.' })
    const { id: userId } = db.run(
      "INSERT INTO users (email, password_hash, name, role, club_id, athlete_id) VALUES (?, ?, ?, 'athlete', NULL, ?)",
      [data.email, hashPassword(data.password), a.full_name, a.id],
    )
    audit(db, req, 'create_account', 'athlete', a.id, { user_id: userId })
    res.status(201).json({ account: { id: userId, email: data.email, is_active: 1 } })
  })

  return r
}
