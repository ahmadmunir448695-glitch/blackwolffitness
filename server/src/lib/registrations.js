import { LIVE_STATUSES, competitionAge, eligibilityProblems, isRegistrationOpen, missingDocuments } from './domain.js'
import { entryFee, presentEvent } from './events.js'
import { publicUrl } from './uploads.js'

const live = LIVE_STATUSES.map((s) => `'${s}'`).join(',')

/** Everything about one entry, in the shape the portal and the PDF use. */
export function loadRegistration(db, id) {
  const r = db.get('SELECT * FROM registrations WHERE id = ?', id)
  if (!r) return null
  const event = db.get('SELECT * FROM events WHERE id = ?', r.event_id)
  const category = db.get('SELECT * FROM event_categories WHERE id = ?', r.category_id)
  const athletes = db.all(
    `SELECT a.*, ra.weight_kg AS entry_weight_kg, ra.belt AS entry_belt FROM registration_athletes ra
     JOIN athletes a ON a.id = ra.athlete_id WHERE ra.registration_id = ? ORDER BY a.full_name`,
    r.id,
  )
  const team = db.get('SELECT * FROM teams WHERE id = ?', r.team_id)
  return {
    ...r,
    event: presentEvent(db, event, { withCounts: false }),
    category,
    age_division: category.age_division_id ? db.get('SELECT * FROM age_divisions WHERE id = ?', category.age_division_id) : null,
    weight_division: r.weight_division_id ? db.get('SELECT * FROM weight_divisions WHERE id = ?', r.weight_division_id) : null,
    team: { ...team, logo_url: publicUrl(team.logo_path) },
    club: db.get('SELECT id, name, country, city, phone, email FROM clubs WHERE id = ?', r.club_id),
    coach: r.coach_id ? db.get('SELECT id, full_name, phone, email, role FROM coaches WHERE id = ?', r.coach_id) : null,
    athletes: athletes.map(({ photo_path, ...a }) => ({ ...a, has_photo: Boolean(photo_path), age: competitionAge(a.dob, event) })),
    documents: db.all(
      `SELECT id, kind, original_name, mime, size, athlete_id, registration_id, created_at FROM documents
       WHERE registration_id = ? OR athlete_id IN (SELECT athlete_id FROM registration_athletes WHERE registration_id = ?)
       ORDER BY created_at DESC`,
      [r.id, r.id],
    ),
    payments: db.all('SELECT * FROM payments WHERE registration_id = ? ORDER BY created_at DESC', r.id),
    can_edit: canClubEdit(r, event),
  }
}

/** Clubs may change an entry while registration is open, or when a correction was requested. */
export function canClubEdit(r, event) {
  if (r.status === 'correction_required') return true
  if (!['draft', 'submitted'].includes(r.status)) return false
  return isRegistrationOpen(event)
}

/**
 * Validate one entry. Returns { problems, missing, category, weightDivision, athletes, fee }.
 * `problems` block saving; `missing` (documents) only block submitting.
 */
export function checkEntry(db, { event, clubId, teamId, categoryId, weightDivisionId, athleteIds, excludeId = null }) {
  const problems = []
  const team = db.get('SELECT * FROM teams WHERE id = ? AND club_id = ?', [teamId, clubId])
  if (!team) problems.push('Choose one of your teams.')
  else if (team.status !== 'active') problems.push('This team is inactive. Activate it before registering.')

  const category = db.get('SELECT * FROM event_categories WHERE id = ? AND event_id = ?', [categoryId, event.id])
  if (!category || !category.active) return { problems: [...problems, 'Choose an available category of this championship.'], missing: [] }

  const weightDivision = weightDivisionId ? db.get('SELECT * FROM weight_divisions WHERE id = ? AND event_id = ?', [weightDivisionId, event.id]) : null
  if (weightDivisionId && !weightDivision) problems.push('Choose a weight category of this championship.')
  if (category.discipline !== 'kyorugi' && weightDivisionId) problems.push('Only kyorugi entries have a weight category.')

  const athletes = athleteIds.map((aid) => db.get('SELECT * FROM athletes WHERE id = ? AND club_id = ?', [aid, clubId])).filter(Boolean)
  if (athletes.length !== athleteIds.length) problems.push('Choose athletes from your own club.')

  problems.push(
    ...eligibilityProblems({
      event,
      category,
      ageDivision: category.age_division_id ? db.get('SELECT * FROM age_divisions WHERE id = ?', category.age_division_id) : null,
      beltDivision: category.belt_division_id ? db.get('SELECT * FROM belt_divisions WHERE id = ?', category.belt_division_id) : null,
      weightDivision: category.discipline === 'kyorugi' ? weightDivision : null,
      athletes,
    }),
  )

  const exclude = excludeId ?? 0
  for (const a of athletes) {
    if (!event.allow_duplicate_entries) {
      const dup = db.get(
        `SELECT r.code FROM registrations r JOIN registration_athletes ra ON ra.registration_id = r.id
         WHERE ra.athlete_id = ? AND r.event_id = ? AND r.category_id = ? AND r.status IN (${live}) AND r.id != ?`,
        [a.id, event.id, category.id, exclude],
      )
      if (dup) problems.push(`${a.full_name} is already entered in this category (${dup.code}).`)
    }
    if (event.max_categories_per_athlete) {
      const n = db.get(
        `SELECT COUNT(DISTINCT r.category_id) AS n FROM registrations r JOIN registration_athletes ra ON ra.registration_id = r.id
         WHERE ra.athlete_id = ? AND r.event_id = ? AND r.status IN (${live}) AND r.id != ? AND r.category_id != ?`,
        [a.id, event.id, exclude, category.id],
      ).n
      if (n >= event.max_categories_per_athlete) {
        problems.push(`${a.full_name} has reached the limit of ${event.max_categories_per_athlete} categor${event.max_categories_per_athlete === 1 ? 'y' : 'ies'} for this championship.`)
      }
    }
  }

  if (category.max_entries_per_team && team) {
    const n = db.get(`SELECT COUNT(*) AS n FROM registrations WHERE team_id = ? AND category_id = ? AND status IN (${live}) AND id != ?`, [team.id, category.id, exclude]).n
    if (n >= category.max_entries_per_team) problems.push(`Your team already has the maximum of ${category.max_entries_per_team} entr${category.max_entries_per_team === 1 ? 'y' : 'ies'} in this category.`)
  }

  const missing = []
  for (const a of athletes) {
    const kinds = new Set(db.all('SELECT kind FROM documents WHERE athlete_id = ?', a.id).map((d) => d.kind))
    const m = missingDocuments(event, a, kinds)
    if (m.length) missing.push(`${a.full_name}: ${m.join(', ')}`)
  }

  return { problems: [...new Set(problems)], missing, category, weightDivision, athletes, team, fee: entryFee(event, category) }
}

/** Store weight and belt as they were when the entry was submitted. */
export function snapshotAthletes(db, registrationId) {
  db.run(
    `UPDATE registration_athletes SET
       weight_kg = (SELECT weight_kg FROM athletes WHERE athletes.id = registration_athletes.athlete_id),
       belt = (SELECT belt FROM athletes WHERE athletes.id = registration_athletes.athlete_id)
     WHERE registration_id = ?`,
    registrationId,
  )
}

/** List columns shared by the club and admin entry tables. */
export const ENTRY_LIST_SQL = `
  SELECT r.id, r.code, r.status, r.payment_status, r.fee_amount, r.currency, r.created_at, r.submitted_at, r.updated_at,
         r.event_id, e.name AS event_name, e.slug AS event_slug, r.team_id, t.name AS team_name, t.code AS team_code,
         r.club_id, cl.name AS club_name, r.category_id, c.name AS category_name, c.discipline, w.name AS weight_name,
         (SELECT group_concat(a.full_name, ', ') FROM registration_athletes ra JOIN athletes a ON a.id = ra.athlete_id WHERE ra.registration_id = r.id) AS athlete_names
  FROM registrations r
  JOIN events e ON e.id = r.event_id
  JOIN teams t ON t.id = r.team_id
  JOIN clubs cl ON cl.id = r.club_id
  JOIN event_categories c ON c.id = r.category_id
  LEFT JOIN weight_divisions w ON w.id = r.weight_division_id`
