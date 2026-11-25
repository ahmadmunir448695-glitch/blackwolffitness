import { Router } from 'express'
import { hashPassword, requireRole } from '../lib/auth.js'
import { ownedRow, userClubId } from '../lib/access.js'
import { audit } from '../lib/audit.js'
import { badRequest, conflict } from '../lib/http.js'
import { email, id, oneOf, password, phone, str, validate } from '../lib/validate.js'

const coachSchema = {
  full_name: str({ max: 120 }),
  role: oneOf(['head', 'assistant', 'manager'], { required: false }),
  phone: phone(),
  email: email({ required: false }),
  dan_grade: str({ required: false, max: 40 }),
  license_no: str({ required: false, max: 60 }),
  team_id: id({ required: false }),
}

export function coachRoutes(db) {
  const r = Router()
  const clubUser = requireRole('club_manager', 'coach')
  const manager = requireRole('club_manager')

  const withAccount = (c) => ({
    ...c,
    account: c.user_id ? db.get('SELECT id, email, is_active FROM users WHERE id = ?', c.user_id) : null,
    team_name: c.team_id ? db.get('SELECT name FROM teams WHERE id = ?', c.team_id)?.name : null,
    athlete_count: db.get('SELECT COUNT(*) AS n FROM athletes WHERE coach_id = ?', c.id).n,
  })

  function checkTeam(clubId, teamId) {
    if (teamId && !db.get('SELECT 1 AS x FROM teams WHERE id = ? AND club_id = ?', [teamId, clubId])) {
      throw badRequest('Choose one of your teams.', { team_id: 'Choose one of your teams.' })
    }
  }

  r.get('/', clubUser, (req, res) => {
    const clubId = userClubId(req.user)
    const where = ['club_id = ?']
    const params = [clubId]
    if (req.query.teamId) {
      where.push('team_id = ?')
      params.push(Number(req.query.teamId))
    }
    const rows = db.all(`SELECT * FROM coaches WHERE ${where.join(' AND ')} ORDER BY role = 'head' DESC, full_name`, params)
    res.json({ items: rows.map(withAccount) })
  })

  r.post('/', manager, (req, res) => {
    const clubId = userClubId(req.user)
    const data = validate(req.body, coachSchema)
    checkTeam(clubId, data.team_id)
    const { id: newId } = db.run(
      'INSERT INTO coaches (club_id, team_id, full_name, role, phone, email, dan_grade, license_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [clubId, data.team_id, data.full_name, data.role || 'assistant', data.phone, data.email, data.dan_grade, data.license_no],
    )
    audit(db, req, 'create', 'coach', newId, { name: data.full_name })
    res.status(201).json({ coach: withAccount(db.get('SELECT * FROM coaches WHERE id = ?', newId)) })
  })

  r.patch('/:id', manager, (req, res) => {
    const c = ownedRow(db, req.user, 'coaches', req.params.id, 'Coach', { write: true })
    const data = validate(req.body, coachSchema, { partial: true })
    checkTeam(c.club_id, data.team_id)
    if (Object.keys(data).length) {
      db.run(
        `UPDATE coaches SET ${Object.keys(data).map((k) => `${k} = ?`).join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
        [...Object.values(data), c.id],
      )
      audit(db, req, 'update', 'coach', c.id, data)
    }
    res.json({ coach: withAccount(db.get('SELECT * FROM coaches WHERE id = ?', c.id)) })
  })

  r.delete('/:id', manager, (req, res) => {
    const c = ownedRow(db, req.user, 'coaches', req.params.id, 'Coach', { write: true })
    db.transaction(() => {
      if (c.user_id) db.run("UPDATE users SET is_active = 0, token_version = token_version + 1 WHERE id = ? AND role = 'coach'", c.user_id)
      db.run('DELETE FROM coaches WHERE id = ?', c.id)
    })
    audit(db, req, 'delete', 'coach', c.id, { name: c.full_name })
    res.json({ ok: true })
  })

  /** Give a coach a login so they can manage athletes and entries. */
  r.post('/:id/account', manager, (req, res) => {
    const c = ownedRow(db, req.user, 'coaches', req.params.id, 'Coach', { write: true })
    const data = validate(req.body, { email: email(), password: password() })
    if (c.user_id) throw conflict('This coach already has a login.')
    if (db.get('SELECT 1 AS x FROM users WHERE email = ?', data.email)) throw conflict('This email is already registered.', { email: 'Already registered.' })
    const userId = db.transaction(() => {
      const u = db.run("INSERT INTO users (email, password_hash, name, phone, role, club_id) VALUES (?, ?, ?, ?, 'coach', ?)", [
        data.email,
        hashPassword(data.password),
        c.full_name,
        c.phone,
        c.club_id,
      ])
      db.run('UPDATE coaches SET user_id = ?, email = COALESCE(email, ?) WHERE id = ?', [u.id, data.email, c.id])
      return u.id
    })
    audit(db, req, 'create_account', 'coach', c.id, { user_id: userId })
    res.status(201).json({ coach: withAccount(db.get('SELECT * FROM coaches WHERE id = ?', c.id)) })
  })

  /** Turn a coach login on or off. */
  r.post('/:id/account/status', manager, (req, res) => {
    const c = ownedRow(db, req.user, 'coaches', req.params.id, 'Coach', { write: true })
    if (!c.user_id) throw badRequest('This coach has no login.')
    const active = req.body?.active ? 1 : 0
    db.run("UPDATE users SET is_active = ?, token_version = token_version + 1 WHERE id = ? AND role = 'coach'", [active, c.user_id])
    audit(db, req, active ? 'activate' : 'deactivate', 'user', c.user_id)
    res.json({ coach: withAccount(db.get('SELECT * FROM coaches WHERE id = ?', c.id)) })
  })

  return r
}
