import { Router } from 'express'
import { requireRole } from '../lib/auth.js'
import { ownedRow, userClubId } from '../lib/access.js'
import { audit } from '../lib/audit.js'
import { conflict } from '../lib/http.js'
import { uniqueCode } from '../lib/ids.js'
import { IMAGE_TYPES, publicUrl, removeFile, requireFile, storedPath, uploadOne } from '../lib/uploads.js'
import { email, oneOf, phone, str, validate } from '../lib/validate.js'
import { LIVE_STATUSES } from '../lib/domain.js'

const live = LIVE_STATUSES.map((s) => `'${s}'`).join(',')

const teamSchema = {
  name: str({ max: 120 }),
  country: str({ max: 80 }),
  city: str({ max: 80 }),
  head_coach_name: str({ required: false, max: 120 }),
  coach_phone: phone(),
  coach_email: email({ required: false }),
  status: oneOf(['active', 'inactive'], { required: false }),
}

export function presentTeam(db, t) {
  return {
    ...t,
    logo_url: publicUrl(t.logo_path),
    club_name: t.club_name ?? db.get('SELECT name FROM clubs WHERE id = ?', t.club_id)?.name,
    total_athletes: db.get('SELECT COUNT(*) AS n FROM athletes WHERE team_id = ?', t.id).n,
    total_coaches: db.get('SELECT COUNT(*) AS n FROM coaches WHERE team_id = ?', t.id).n,
    active_entries: db.get(`SELECT COUNT(*) AS n FROM registrations WHERE team_id = ? AND status IN (${live})`, t.id).n,
  }
}

export function teamRoutes(db) {
  const r = Router()
  const clubUser = requireRole('club_manager', 'coach')
  const manager = requireRole('club_manager')

  r.get('/', clubUser, (req, res) => {
    const clubId = userClubId(req.user)
    const teams = db.all('SELECT * FROM teams WHERE club_id = ? ORDER BY created_at ASC', clubId)
    res.json({ items: teams.map((t) => presentTeam(db, t)) })
  })

  r.post('/', manager, (req, res) => {
    const clubId = userClubId(req.user)
    const data = validate(req.body, teamSchema)
    const code = uniqueCode(db, 'teams', 'code', 'TM')
    const { id } = db.run(
      `INSERT INTO teams (code, club_id, name, country, city, head_coach_name, coach_phone, coach_email, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, clubId, data.name, data.country, data.city, data.head_coach_name, data.coach_phone, data.coach_email, data.status || 'active'],
    )
    audit(db, req, 'create', 'team', id, { name: data.name })
    res.status(201).json({ team: presentTeam(db, db.get('SELECT * FROM teams WHERE id = ?', id)) })
  })

  r.get('/:id', clubUser, (req, res) => {
    const team = ownedRow(db, req.user, 'teams', req.params.id, 'Team')
    const athletes = db.all(
      `SELECT a.*, c.full_name AS coach_name FROM athletes a LEFT JOIN coaches c ON c.id = a.coach_id
       WHERE a.team_id = ? ORDER BY a.full_name`,
      team.id,
    )
    const coaches = db.all('SELECT * FROM coaches WHERE team_id = ? ORDER BY role, full_name', team.id)
    res.json({
      team: presentTeam(db, team),
      athletes: athletes.map((a) => ({ ...a, has_photo: Boolean(a.photo_path), photo_path: undefined })),
      coaches,
    })
  })

  r.patch('/:id', manager, (req, res) => {
    const team = ownedRow(db, req.user, 'teams', req.params.id, 'Team', { write: true })
    const data = validate(req.body, teamSchema, { partial: true })
    if (Object.keys(data).length) {
      db.run(
        `UPDATE teams SET ${Object.keys(data).map((k) => `${k} = ?`).join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
        [...Object.values(data), team.id],
      )
      audit(db, req, 'update', 'team', team.id, data)
    }
    res.json({ team: presentTeam(db, db.get('SELECT * FROM teams WHERE id = ?', team.id)) })
  })

  r.delete('/:id', manager, (req, res) => {
    const team = ownedRow(db, req.user, 'teams', req.params.id, 'Team', { write: true })
    const used = db.get('SELECT COUNT(*) AS n FROM registrations WHERE team_id = ?', team.id).n
    if (used) throw conflict('This team has championship entries. Set it to inactive instead of deleting it.')
    db.run('DELETE FROM teams WHERE id = ?', team.id)
    removeFile(team.logo_path)
    audit(db, req, 'delete', 'team', team.id, { name: team.name })
    res.json({ ok: true })
  })

  r.post('/:id/logo', manager, uploadOne('file', { area: 'public', types: IMAGE_TYPES }), (req, res) => {
    const team = ownedRow(db, req.user, 'teams', req.params.id, 'Team', { write: true })
    const file = requireFile(req)
    db.run('UPDATE teams SET logo_path = ? WHERE id = ?', [storedPath(file, 'public'), team.id])
    removeFile(team.logo_path)
    res.json({ team: presentTeam(db, db.get('SELECT * FROM teams WHERE id = ?', team.id)) })
  })

  return r
}
