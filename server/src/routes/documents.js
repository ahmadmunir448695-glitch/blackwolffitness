import { Router } from 'express'
import { requireAuth, requireRole } from '../lib/auth.js'
import { canManageEvent, isClubUser, userClubId } from '../lib/access.js'
import { audit } from '../lib/audit.js'
import { conflict, notFound } from '../lib/http.js'
import { removeFile, sendStored } from '../lib/uploads.js'

export function documentRoutes(db) {
  const r = Router()

  /** Club document library: athlete documents, entry documents and payment receipts. */
  r.get('/', requireAuth, (req, res) => {
    const u = req.user
    let where
    let params
    if (isClubUser(u)) {
      where = 'd.club_id = ?'
      params = [userClubId(u)]
    } else if (u.role === 'athlete') {
      where = 'd.athlete_id = ?'
      params = [u.athlete_id ?? 0]
    } else {
      return res.json({ items: [] })
    }
    if (req.query.kind) {
      where += ' AND d.kind = ?'
      params.push(String(req.query.kind))
    }
    const items = db.all(
      `SELECT d.id, d.kind, d.original_name, d.mime, d.size, d.created_at, d.athlete_id, d.registration_id,
              a.full_name AS athlete_name, a.code AS athlete_code, r.code AS registration_code
       FROM documents d LEFT JOIN athletes a ON a.id = d.athlete_id LEFT JOIN registrations r ON r.id = d.registration_id
       WHERE ${where} ORDER BY d.created_at DESC LIMIT 500`,
      params,
    )
    res.json({ items })
  })

  function visibleDoc(req) {
    const doc = db.get('SELECT * FROM documents WHERE id = ?', req.params.id)
    if (!doc) throw notFound('Document')
    const u = req.user
    if (u.role === 'super_admin') return doc
    if (isClubUser(u) && doc.club_id === u.club_id) return doc
    if (u.role === 'athlete' && doc.athlete_id && doc.athlete_id === u.athlete_id) return doc
    if (u.role === 'organizer') {
      // Organizers see documents of entries in their events, and of athletes in those entries.
      const events = db.all(
        `SELECT DISTINCT r.event_id FROM registrations r
         WHERE r.id = ? OR r.id IN (SELECT registration_id FROM registration_athletes WHERE athlete_id = ?)`,
        [doc.registration_id ?? 0, doc.athlete_id ?? 0],
      )
      if (events.some((e) => canManageEvent(db, u, e.event_id))) return doc
    }
    throw notFound('Document')
  }

  r.get('/:id/download', requireAuth, (req, res) => {
    const doc = visibleDoc(req)
    sendStored(res, doc.file_path, doc.original_name, { inline: req.query.inline === '1' })
  })

  r.delete('/:id', requireRole('club_manager', 'coach'), (req, res) => {
    const doc = visibleDoc(req)
    if (doc.club_id !== req.user.club_id) throw notFound('Document')
    if (doc.kind === 'payment_proof' && db.get("SELECT 1 AS x FROM payments WHERE proof_document_id = ? AND status = 'paid'", doc.id)) {
      throw conflict('This receipt belongs to a confirmed payment and cannot be deleted.')
    }
    db.run('DELETE FROM documents WHERE id = ?', doc.id)
    removeFile(doc.file_path)
    audit(db, req, 'delete', 'document', doc.id, { kind: doc.kind })
    res.json({ ok: true })
  })

  return r
}
