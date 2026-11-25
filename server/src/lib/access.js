import { forbidden, notFound } from './http.js'

export const CLUB_ROLES = ['club_manager', 'coach']
export const ADMIN_ROLES = ['super_admin', 'organizer']

export const isSuper = (user) => user?.role === 'super_admin'
export const isAdminUser = (user) => ADMIN_ROLES.includes(user?.role)
export const isClubUser = (user) => CLUB_ROLES.includes(user?.role)

/**
 * Event ids an admin user may manage. `null` means every event (super admin).
 * Organizers manage events they created or were assigned to.
 */
export function managedEventIds(db, user) {
  if (isSuper(user)) return null
  if (user?.role !== 'organizer') return []
  return db
    .all(
      `SELECT id FROM events WHERE created_by = ?
       UNION SELECT event_id AS id FROM event_organizers WHERE user_id = ?`,
      [user.id, user.id],
    )
    .map((r) => r.id)
}

export function canManageEvent(db, user, eventId) {
  const ids = managedEventIds(db, user)
  return ids === null || ids.includes(Number(eventId))
}

export function assertManageEvent(db, user, eventId) {
  const event = db.get('SELECT * FROM events WHERE id = ?', eventId)
  if (!event) throw notFound('Event')
  if (!canManageEvent(db, user, event.id)) throw forbidden('You are not an organizer of this event.')
  return event
}

/** SQL fragment restricting `column` to the user's managed events. */
export function eventScopeSql(db, user, column = 'event_id') {
  const ids = managedEventIds(db, user)
  if (ids === null) return { sql: '1=1', params: [] }
  if (!ids.length) return { sql: '0=1', params: [] }
  return { sql: `${column} IN (${ids.map(() => '?').join(',')})`, params: ids }
}

/** The club a club manager or coach works for. */
export function userClubId(user) {
  if (!isClubUser(user)) throw forbidden('Only club managers and coaches can do this.')
  if (!user.club_id) throw forbidden('Your account is not linked to a club yet.')
  return user.club_id
}

/**
 * Load a club-owned row and make sure the user may see (or change) it.
 * Rows of other clubs answer 404, so ids of other clubs cannot be probed.
 */
export function ownedRow(db, user, table, id, what, { write = false, managerOnly = false } = {}) {
  const row = db.get(`SELECT * FROM ${table} WHERE id = ?`, id)
  if (!row) throw notFound(what)
  if (!write && isSuper(user)) return row
  if (!isClubUser(user) || row.club_id !== user.club_id) throw notFound(what)
  if (managerOnly && user.role !== 'club_manager') throw forbidden('Only the club manager can do this.')
  return row
}
