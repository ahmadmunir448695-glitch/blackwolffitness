/** Record an important admin or club action. Never throws. */
export function audit(db, req, action, entity, entityId, details) {
  try {
    db.run('INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip) VALUES (?, ?, ?, ?, ?, ?)', [
      req?.user?.id ?? null,
      action,
      entity,
      entityId ?? null,
      details ? JSON.stringify(details) : null,
      req?.ip ?? null,
    ])
  } catch (err) {
    console.error('audit log failed', err)
  }
}
