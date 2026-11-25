import { DISCIPLINES, LIVE_STATUSES, effectiveStatus, isRegistrationOpen } from './domain.js'
import { publicUrl } from './uploads.js'

const live = LIVE_STATUSES.map((s) => `'${s}'`).join(',')

function parseJson(value, fallback) {
  try {
    return JSON.parse(value ?? '')
  } catch {
    return fallback
  }
}

/** Event as sent to the browser (status computed, file paths turned into URLs). */
export function presentEvent(db, e, { withCounts = true } = {}) {
  const { poster_path, invitation_pdf_path, rules_pdf_path, schedule_json, ...rest } = e
  const disciplines = db
    .all('SELECT DISTINCT discipline FROM event_categories WHERE event_id = ? AND active = 1', e.id)
    .map((r) => r.discipline)
  const out = {
    ...rest,
    published: Boolean(e.published),
    require_medical: Boolean(e.require_medical),
    require_id_document: Boolean(e.require_id_document),
    require_photo: Boolean(e.require_photo),
    allow_duplicate_entries: Boolean(e.allow_duplicate_entries),
    schedule: parseJson(schedule_json, []),
    status: effectiveStatus(e),
    registration_open: isRegistrationOpen(e),
    poster_url: publicUrl(poster_path),
    invitation_pdf_url: publicUrl(invitation_pdf_path),
    rules_pdf_url: publicUrl(rules_pdf_path),
    disciplines: disciplines.map((d) => ({ value: d, label: DISCIPLINES[d]?.label ?? d })),
  }
  if (withCounts) {
    out.category_count = db.get('SELECT COUNT(*) AS n FROM event_categories WHERE event_id = ? AND active = 1', e.id).n
    out.entry_count = db.get(`SELECT COUNT(*) AS n FROM registrations WHERE event_id = ? AND status IN (${live}) AND status != 'draft'`, e.id).n
    out.team_count = db.get(
      `SELECT COUNT(DISTINCT team_id) AS n FROM registrations WHERE event_id = ? AND status IN (${live}) AND status != 'draft'`,
      e.id,
    ).n
  }
  return out
}

/** Divisions, categories and announcements of an event. */
export function eventConfig(db, eventId, { includeInactive = false } = {}) {
  const ages = db.all('SELECT * FROM age_divisions WHERE event_id = ? ORDER BY sort, min_age', eventId)
  const weights = db.all('SELECT * FROM weight_divisions WHERE event_id = ? ORDER BY age_division_id, gender, sort, COALESCE(max_kg, 999)', eventId)
  const belts = db
    .all('SELECT * FROM belt_divisions WHERE event_id = ? ORDER BY sort, id', eventId)
    .map(({ belts_json, ...b }) => ({ ...b, belts: parseJson(belts_json, []) }))
  const categories = db.all(
    `SELECT c.*, (SELECT COUNT(*) FROM registrations r WHERE r.category_id = c.id AND r.status IN (${live}) AND r.status != 'draft') AS entry_count
     FROM event_categories c WHERE c.event_id = ? ${includeInactive ? '' : 'AND c.active = 1'}
     ORDER BY CASE c.discipline WHEN 'kyorugi' THEN 1 WHEN 'poomsae' THEN 2 WHEN 'breaking' THEN 3 ELSE 4 END, c.sort, c.id`,
    eventId,
  )
  const announcements = db.all('SELECT * FROM announcements WHERE event_id = ? ORDER BY pinned DESC, created_at DESC', eventId)
  return {
    age_divisions: ages,
    weight_divisions: weights,
    belt_divisions: belts,
    categories: categories.map((c) => ({ ...c, active: Boolean(c.active), fee_effective: c.fee ?? null })),
    announcements: announcements.map((a) => ({ ...a, pinned: Boolean(a.pinned) })),
  }
}

/** Fee for one entry in a category: the category's own fee, else the event's base fee. */
export function entryFee(event, category) {
  return category.fee ?? event.base_fee ?? 0
}
