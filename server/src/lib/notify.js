/**
 * In-app notifications. `notifyClub` reaches the club manager and every coach
 * with a login in that club.
 */
export function notifyUser(db, userId, { title, body = null, link = null, kind = 'info' }) {
  if (!userId) return
  db.run('INSERT INTO notifications (user_id, kind, title, body, link) VALUES (?, ?, ?, ?, ?)', [userId, kind, title, body, link])
}

export function notifyClub(db, clubId, message) {
  const users = db.all(
    "SELECT id FROM users WHERE club_id = ? AND role IN ('club_manager','coach') AND is_active = 1",
    clubId,
  )
  for (const u of users) notifyUser(db, u.id, message)
}

export function notifyEventAdmins(db, eventId, message) {
  const users = db.all(
    `SELECT DISTINCT u.id FROM users u
     WHERE u.is_active = 1 AND (
       u.role = 'super_admin'
       OR u.id IN (SELECT user_id FROM event_organizers WHERE event_id = ?)
       OR u.id = (SELECT created_by FROM events WHERE id = ?)
     )`,
    [eventId, eventId],
  )
  for (const u of users) notifyUser(db, u.id, message)
}
