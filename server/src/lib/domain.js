/**
 * Championship rules that are the same for every event. Everything
 * event-specific (age groups, weight classes, belt groups, categories, fees,
 * document requirements) lives in the database and is set by organizers.
 */
import { today } from './ids.js'

export const BELTS = [
  'White (10th Gup)',
  'White-Yellow (9th Gup)',
  'Yellow (8th Gup)',
  'Yellow-Green (7th Gup)',
  'Green (6th Gup)',
  'Green-Blue (5th Gup)',
  'Blue (4th Gup)',
  'Blue-Red (3rd Gup)',
  'Red (2nd Gup)',
  'Red-Black (1st Gup)',
  '1st Poom',
  '2nd Poom',
  '3rd Poom',
  '4th Poom',
  '1st Dan',
  '2nd Dan',
  '3rd Dan',
  '4th Dan',
  '5th Dan',
  '6th Dan',
  '7th Dan',
  '8th Dan',
  '9th Dan',
]

export const DISCIPLINES = {
  kyorugi: { label: 'Kyorugi (Sparring)', formats: ['individual'], subtypes: [] },
  poomsae: {
    label: 'Poomsae (Forms)',
    formats: ['individual', 'pair', 'team'],
    subtypes: [
      { value: 'recognized', label: 'Recognized Poomsae' },
      { value: 'freestyle', label: 'Freestyle Poomsae' },
    ],
  },
  breaking: {
    label: 'Breaking',
    formats: ['individual', 'team'],
    subtypes: [
      { value: 'speed', label: 'Speed Breaking' },
      { value: 'power', label: 'Power Breaking' },
      { value: 'technical', label: 'Technical Breaking' },
    ],
  },
  demonstration: {
    label: 'Team Demonstration',
    formats: ['team'],
    subtypes: [
      { value: 'team_performance', label: 'Team Performance' },
      { value: 'group_demonstration', label: 'Group Demonstration' },
    ],
  },
}

export const EVENT_STATUSES = ['upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed']
export const REGISTRATION_STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'correction_required', 'cancelled']
export const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'waived', 'refunded']
/** Entries that still hold a place (used for duplicate and quota checks). */
export const LIVE_STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'correction_required']
/** Entries the club may still change. */
export const EDITABLE_STATUSES = ['draft', 'submitted', 'correction_required']

/** Status shown to users: a manual override wins, otherwise it follows the dates. */
export function effectiveStatus(event, on = today()) {
  if (event.status_override) return event.status_override
  if (on > event.end_date) return 'completed'
  if (on >= event.start_date) return 'ongoing'
  if (on > event.registration_deadline) return 'registration_closed'
  if (event.registration_opens && on < event.registration_opens) return 'upcoming'
  return 'registration_open'
}

export function isRegistrationOpen(event, on = today()) {
  return Boolean(event.published) && effectiveStatus(event, on) === 'registration_open'
}

/** Competition age under the event's rule (World Taekwondo uses birth year). */
export function competitionAge(dob, event) {
  const ref = event.age_reference_date || event.start_date
  const [by, bm, bd] = dob.split('-').map(Number)
  const [ry, rm, rd] = ref.split('-').map(Number)
  if (event.age_method === 'birth_year') return ry - by
  let age = ry - by
  if (rm < bm || (rm === bm && rd < bd)) age--
  return age
}

const norm = (s) => String(s ?? '').trim().toLowerCase()

/**
 * Check athletes against a category. Returns a list of human-readable
 * problems; an empty list means eligible.
 */
export function eligibilityProblems({ event, category, ageDivision, beltDivision, weightDivision, athletes }) {
  const problems = []
  const n = athletes.length
  if (n < category.min_members || n > category.max_members) {
    problems.push(
      category.min_members === category.max_members
        ? `This category needs exactly ${category.min_members} athlete${category.min_members === 1 ? '' : 's'}.`
        : `This category needs ${category.min_members} to ${category.max_members} athletes.`,
    )
  }

  if (category.gender === 'male' || category.gender === 'female') {
    for (const a of athletes) if (a.gender !== category.gender) problems.push(`${a.full_name} is not eligible for a ${category.gender} category.`)
  } else if (category.gender === 'mixed' && n >= 2) {
    const genders = new Set(athletes.map((a) => a.gender))
    if (genders.size < 2) problems.push('A mixed entry needs at least one male and one female athlete.')
  }

  if (ageDivision) {
    for (const a of athletes) {
      const age = competitionAge(a.dob, event)
      if (age < ageDivision.min_age || age > ageDivision.max_age) {
        problems.push(`${a.full_name} is ${age} for this event; ${ageDivision.name} is ages ${ageDivision.min_age}–${ageDivision.max_age}.`)
      }
    }
  }

  if (beltDivision) {
    const allowed = JSON.parse(beltDivision.belts_json || '[]').map(norm)
    if (allowed.length) {
      for (const a of athletes) {
        if (!allowed.includes(norm(a.belt))) problems.push(`${a.full_name}'s belt (${a.belt}) is not part of ${beltDivision.name}.`)
      }
    }
  }

  if (category.discipline === 'kyorugi') {
    if (!weightDivision) {
      problems.push('Choose a weight category.')
    } else {
      if (category.age_division_id && weightDivision.age_division_id !== category.age_division_id) {
        problems.push('That weight category belongs to a different age group.')
      }
      const tolerance = Number(event.weight_tolerance_kg || 0)
      for (const a of athletes) {
        if (a.gender !== weightDivision.gender) problems.push(`${weightDivision.name} is a ${weightDivision.gender} weight category.`)
        if (a.weight_kg === null || a.weight_kg === undefined) {
          problems.push(`Add ${a.full_name}'s weight before choosing a weight category.`)
          continue
        }
        if (weightDivision.min_kg !== null && a.weight_kg <= weightDivision.min_kg) {
          problems.push(`${a.full_name} (${a.weight_kg} kg) is below ${weightDivision.name}.`)
        }
        if (weightDivision.max_kg !== null && a.weight_kg > weightDivision.max_kg + tolerance) {
          problems.push(`${a.full_name} (${a.weight_kg} kg) is above ${weightDivision.name}.`)
        }
      }
    }
  }
  return problems
}

/** Documents an athlete still needs before an entry can be submitted. */
export function missingDocuments(event, athlete, kinds) {
  const missing = []
  if (event.require_photo && !athlete.photo_path) missing.push('athlete photo')
  if (event.require_id_document && !kinds.has('id_document')) missing.push('ID / passport document')
  if (event.require_medical && !kinds.has('medical')) missing.push('medical certificate')
  return missing
}

/** "Kyorugi · Male · Cadet (12–14) · Color belts" style default name. */
export function categoryName({ discipline, subtype, format, gender }, ageDivision, beltDivision) {
  const d = DISCIPLINES[discipline]
  const parts = [d?.subtypes.find((s) => s.value === subtype)?.label || d?.label || discipline]
  if (format && format !== 'individual') parts.push(format === 'pair' ? 'Pair' : 'Team')
  if (gender && gender !== 'open') parts.push(gender[0].toUpperCase() + gender.slice(1))
  if (ageDivision) parts.push(ageDivision.name)
  if (beltDivision) parts.push(beltDivision.name)
  return parts.join(' · ')
}

/** Weight class label from its limits: "-54 kg", "+87 kg", "54–58 kg". */
export function weightName(minKg, maxKg) {
  if (maxKg !== null && maxKg !== undefined) return `-${maxKg} kg`
  if (minKg !== null && minKg !== undefined) return `+${minKg} kg`
  return 'Open weight'
}
