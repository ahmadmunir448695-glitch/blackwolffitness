import { Router } from 'express'
import { requireAuth } from '../lib/auth.js'
import { paged, pagination } from '../lib/http.js'

export function notificationRoutes(db) {
  const r = Router()
  r.use(requireAuth)

  r.get('/', (req, res) => {
    const p = pagination(req.query, { defaultSize: 30 })
    const unreadOnly = req.query.unread === '1'
    const where = `user_id = ?${unreadOnly ? ' AND read_at IS NULL' : ''}`
    const total = db.get(`SELECT COUNT(*) AS n FROM notifications WHERE ${where}`, req.user.id).n
    const items = db.all(`SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`, [req.user.id, p.limit, p.offset])
    const unread = db.get('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL', req.user.id).n
    res.json({ ...paged(items, total, p), unread })
  })

  r.post('/read-all', (req, res) => {
    db.run("UPDATE notifications SET read_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE user_id = ? AND read_at IS NULL", req.user.id)
    res.json({ ok: true, unread: 0 })
  })

  r.post('/:id/read', (req, res) => {
    db.run("UPDATE notifications SET read_at = COALESCE(read_at, strftime('%Y-%m-%dT%H:%M:%fZ','now')) WHERE id = ? AND user_id = ?", [req.params.id, req.user.id])
    const unread = db.get('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL', req.user.id).n
    res.json({ ok: true, unread })
  })

  r.delete('/:id', (req, res) => {
    db.run('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id])
    res.json({ ok: true })
  })

  return r
}
