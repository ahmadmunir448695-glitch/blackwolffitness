import { Router } from 'express'
import { hashPassword, issueToken, publicUser, rateLimit, requireAuth, verifyPassword } from '../lib/auth.js'
import { badRequest, conflict, unauthorized } from '../lib/http.js'
import { email, password, phone, str, validate } from '../lib/validate.js'
import { audit } from '../lib/audit.js'
import { notifyUser } from '../lib/notify.js'

export function authRoutes(db) {
  const r = Router()
  const limiter = rateLimit({ windowMs: 15 * 60_000, max: 20 })

  function session(userId) {
    const user = db.get('SELECT * FROM users WHERE id = ?', userId)
    return { token: issueToken(user), user: profile(user) }
  }

  function profile(user) {
    const club = user.club_id ? db.get('SELECT id, name, country, city FROM clubs WHERE id = ?', user.club_id) : null
    const unread = db.get('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL', user.id).n
    return { ...publicUser(user), club, unread_notifications: unread }
  }

  /** Public sign-up creates a club and its manager account. */
  r.post('/signup', limiter, (req, res) => {
    const data = validate(req.body, {
      name: str({ max: 120 }),
      email: email(),
      phone: phone(),
      password: password(),
      club_name: str({ max: 160 }),
      country: str({ max: 80 }),
      city: str({ max: 80 }),
    })
    if (db.get('SELECT 1 AS x FROM users WHERE email = ?', data.email)) {
      throw conflict('An account with this email already exists.', { email: 'This email is already registered. Sign in instead.' })
    }
    const userId = db.transaction(() => {
      const club = db.run('INSERT INTO clubs (name, country, city, phone, email) VALUES (?, ?, ?, ?, ?)', [
        data.club_name,
        data.country,
        data.city,
        data.phone,
        data.email,
      ])
      const user = db.run(
        "INSERT INTO users (email, password_hash, name, phone, role, club_id) VALUES (?, ?, ?, ?, 'club_manager', ?)",
        [data.email, hashPassword(data.password), data.name, data.phone, club.id],
      )
      db.run('UPDATE clubs SET owner_user_id = ? WHERE id = ?', [user.id, club.id])
      notifyUser(db, user.id, {
        title: 'Welcome to the championship portal',
        body: 'Start by creating your team, then add athletes and register them for a championship.',
        link: '/portal/team',
        kind: 'success',
      })
      return user.id
    })
    req.user = { id: userId }
    audit(db, req, 'signup', 'user', userId)
    res.status(201).json(session(userId))
  })

  r.post('/login', limiter, (req, res) => {
    const data = validate(req.body, { email: email(), password: str({ max: 200 }) })
    const user = db.get('SELECT * FROM users WHERE email = ?', data.email)
    if (!user || !verifyPassword(data.password, user.password_hash)) throw unauthorized('Email or password is incorrect.')
    if (!user.is_active) throw unauthorized('This account has been deactivated. Contact the organizer.')
    db.run("UPDATE users SET last_login_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", user.id)
    res.json(session(user.id))
  })

  r.get('/me', requireAuth, (req, res) => {
    res.json({ user: profile(db.get('SELECT * FROM users WHERE id = ?', req.user.id)) })
  })

  r.patch('/me', requireAuth, (req, res) => {
    const data = validate(req.body, { name: str({ max: 120 }), phone: phone() }, { partial: true })
    if (Object.keys(data).length) {
      const sets = Object.keys(data).map((k) => `${k} = ?`)
      db.run(`UPDATE users SET ${sets.join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`, [
        ...Object.values(data),
        req.user.id,
      ])
    }
    res.json({ user: profile(db.get('SELECT * FROM users WHERE id = ?', req.user.id)) })
  })

  /** Changing the password signs out every other session. */
  r.post('/change-password', requireAuth, limiter, (req, res) => {
    const data = validate(req.body, { current_password: str({ max: 200 }), new_password: password() })
    const user = db.get('SELECT * FROM users WHERE id = ?', req.user.id)
    if (!verifyPassword(data.current_password, user.password_hash)) {
      throw badRequest('Current password is incorrect.', { current_password: 'Current password is incorrect.' })
    }
    db.run('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?', [hashPassword(data.new_password), user.id])
    audit(db, req, 'change_password', 'user', user.id)
    res.json(session(user.id))
  })

  r.post('/logout-all', requireAuth, (req, res) => {
    db.run('UPDATE users SET token_version = token_version + 1 WHERE id = ?', req.user.id)
    res.json({ ok: true })
  })

  return r
}
