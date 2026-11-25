/**
 * Demo data for local development: one admin, one organizer, one club with a
 * team, coaches and athletes, and three championships with a full category
 * setup. Refuses to run in production.
 *
 *   npm run seed            add demo data to an empty database
 *
 * Demo logins (local only):
 *   admin@demo.test     / DemoAdmin123
 *   organizer@demo.test / DemoOrganizer123
 *   club@demo.test      / DemoClub123
 *   coach@demo.test     / DemoCoach123
 */
import { config } from './config.js'
import { migrate, openDatabase } from './db.js'
import { hashPassword } from './lib/auth.js'
import { BELTS, categoryName, weightName } from './lib/domain.js'
import { uniqueCode } from './lib/ids.js'

export const DEMO_USERS = {
  admin: { email: 'admin@demo.test', password: 'DemoAdmin123' },
  organizer: { email: 'organizer@demo.test', password: 'DemoOrganizer123' },
  club: { email: 'club@demo.test', password: 'DemoClub123' },
  coach: { email: 'coach@demo.test', password: 'DemoCoach123' },
}

const addDays = (base, days) => {
  const d = new Date(`${base}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function seed(db) {
  if (db.get('SELECT 1 AS x FROM events')) return false
  const today = new Date().toISOString().slice(0, 10)

  return db.transaction(() => {
    const user = (role, key, name, extra = {}) =>
      db.run('INSERT INTO users (email, password_hash, name, role, club_id, phone) VALUES (?, ?, ?, ?, ?, ?)', [
        DEMO_USERS[key].email,
        hashPassword(DEMO_USERS[key].password),
        name,
        role,
        extra.club_id ?? null,
        extra.phone ?? null,
      ]).id

    const adminId = db.get("SELECT id FROM users WHERE role = 'super_admin'")?.id ?? user('super_admin', 'admin', 'Portal Admin')
    const organizerId = user('organizer', 'organizer', 'Event Organizer')

    const clubId = db.run("INSERT INTO clubs (name, country, city, phone, email) VALUES ('Demo Taekwondo Academy', 'Pakistan', 'Lahore', '+92 300 0000000', 'club@demo.test')").id
    const managerId = user('club_manager', 'club', 'Club Manager', { club_id: clubId, phone: '+92 300 0000000' })
    db.run('UPDATE clubs SET owner_user_id = ? WHERE id = ?', [managerId, clubId])
    const coachUserId = user('coach', 'coach', 'Demo Coach', { club_id: clubId })

    const teamId = db.run(
      "INSERT INTO teams (code, club_id, name, country, city, head_coach_name, coach_phone, coach_email) VALUES (?, ?, 'Demo Academy A-Team', 'Pakistan', 'Lahore', 'Demo Coach', '+92 300 1111111', 'coach@demo.test')",
      [uniqueCode(db, 'teams', 'code', 'TM'), clubId],
    ).id
    const coachId = db.run("INSERT INTO coaches (club_id, team_id, user_id, full_name, role, phone, email, dan_grade) VALUES (?, ?, ?, 'Demo Coach', 'head', '+92 300 1111111', 'coach@demo.test', '4th Dan')", [
      clubId,
      teamId,
      coachUserId,
    ]).id

    const year = Number(today.slice(0, 4))
    const athletes = [
      ['Ali Raza', 'Raza Ahmed', `${year - 13}-04-12`, 'male', 'Blue (4th Gup)', 41.5],
      ['Ayesha Khan', 'Imran Khan', `${year - 14}-08-02`, 'female', 'Red (2nd Gup)', 46],
      ['Hamza Ali', 'Ali Hassan', `${year - 16}-01-20`, 'male', '1st Poom', 59.2],
      ['Fatima Noor', 'Noor Muhammad', `${year - 16}-11-05`, 'female', '1st Dan', 52],
      ['Usman Tariq', 'Tariq Mehmood', `${year - 22}-06-30`, 'male', '2nd Dan', 73.4],
      ['Zainab Bibi', 'Abdul Rehman', `${year - 21}-03-14`, 'female', '1st Dan', 61],
    ]
    for (const [name, father, dob, gender, belt, weight] of athletes) {
      db.run(
        "INSERT INTO athletes (code, club_id, team_id, coach_id, full_name, father_name, dob, gender, nationality, belt, weight_kg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pakistani', ?, ?)",
        [uniqueCode(db, 'athletes', 'code', 'ATH'), clubId, teamId, coachId, name, father, dob, gender, belt, weight],
      )
    }

    const event = (data) => {
      const cols = Object.keys(data)
      return db.run(`INSERT INTO events (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`, Object.values(data)).id
    }

    const open = event({
      slug: `demo-open-championship-${year + 1}`,
      name: 'Demo Open Taekwondo Championship',
      organizer: 'Demo Organizing Committee',
      federation: 'Demo Taekwondo Association',
      summary: 'Kyorugi, poomsae, breaking and team demonstration for cadets, juniors and seniors.',
      description:
        'A two-day open championship for clubs and academies. Kyorugi uses electronic body protectors; poomsae and breaking are judged on a 10-point scale.\n\nThis is demo data created by the seed script. Edit or delete it from the admin panel.',
      rules:
        '1. Athletes compete in the age group of their birth year.\n2. Weigh-in is the day before competition; athletes must make weight within their category.\n3. Every athlete needs valid ID and a signed medical certificate.\n4. Coaches must wear a tracksuit and carry their coach card.',
      schedule_json: JSON.stringify([
        { date: addDays(today, 51), time: '16:00', item: 'Accreditation and weigh-in' },
        { date: addDays(today, 52), time: '09:00', item: 'Kyorugi preliminaries, poomsae individual' },
        { date: addDays(today, 53), time: '09:00', item: 'Kyorugi finals, breaking, team demonstration' },
        { date: addDays(today, 53), time: '17:00', item: 'Medal ceremony' },
      ]),
      venue_name: 'Demo Sports Complex',
      venue_address: 'Main Boulevard',
      city: 'Lahore',
      country: 'Pakistan',
      start_date: addDays(today, 52),
      end_date: addDays(today, 53),
      registration_opens: addDays(today, -10),
      registration_deadline: addDays(today, 40),
      published: 1,
      currency: 'PKR',
      base_fee: 3000,
      require_medical: 1,
      require_id_document: 1,
      require_photo: 1,
      contact_email: 'organizer@demo.test',
      created_by: organizerId,
    })
    db.run('INSERT INTO event_organizers (event_id, user_id) VALUES (?, ?)', [open, organizerId])

    const configure = (eventId) => {
      const age = (name, min, max, sort) => ({ id: db.run('INSERT INTO age_divisions (event_id, name, min_age, max_age, sort) VALUES (?, ?, ?, ?, ?)', [eventId, name, min, max, sort]).id, name, min_age: min, max_age: max })
      const ages = [age('Cadet (12–14)', 12, 14, 1), age('Junior (15–17)', 15, 17, 2), age('Senior (18+)', 18, 99, 3)]
      const ladders = {
        male: [[33, 37, 41, 45, 49, 53, 57, 61, 65], [45, 48, 51, 55, 59, 63, 68, 73, 78], [54, 58, 63, 68, 74, 80, 87]],
        female: [[29, 33, 37, 41, 44, 47, 51, 55, 59], [42, 44, 46, 49, 52, 55, 59, 63, 68], [46, 49, 53, 57, 62, 67, 73]],
      }
      ages.forEach((a, i) => {
        for (const gender of ['male', 'female']) {
          let prev = null
          ladders[gender][i].forEach((max, s) => {
            db.run('INSERT INTO weight_divisions (event_id, age_division_id, gender, name, min_kg, max_kg, sort) VALUES (?, ?, ?, ?, ?, ?, ?)', [eventId, a.id, gender, weightName(prev, max), prev, max, s])
            prev = max
          })
          db.run('INSERT INTO weight_divisions (event_id, age_division_id, gender, name, min_kg, max_kg, sort) VALUES (?, ?, ?, ?, ?, NULL, 99)', [eventId, a.id, gender, weightName(prev, null), prev])
        }
      })
      const belt = (name, list, sort) => ({ id: db.run('INSERT INTO belt_divisions (event_id, name, belts_json, sort) VALUES (?, ?, ?, ?)', [eventId, name, JSON.stringify(list), sort]).id, name })
      const color = belt('Colour belts', BELTS.slice(0, 10), 1)
      const black = belt('Black belts', BELTS.slice(10), 2)

      const cat = (c, ageDiv, beltDiv, fee = null) =>
        db.run(
          'INSERT INTO event_categories (event_id, discipline, subtype, format, gender, age_division_id, belt_division_id, min_members, max_members, fee, name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [eventId, c.discipline, c.subtype ?? null, c.format, c.gender, ageDiv?.id ?? null, beltDiv?.id ?? null, c.min ?? 1, c.max ?? 1, fee, categoryName(c, ageDiv, beltDiv)],
        )
      for (const a of ages)
        for (const gender of ['male', 'female']) {
          cat({ discipline: 'kyorugi', format: 'individual', gender }, a, null)
          cat({ discipline: 'poomsae', subtype: 'recognized', format: 'individual', gender }, a, color)
          cat({ discipline: 'poomsae', subtype: 'recognized', format: 'individual', gender }, a, black)
        }
      cat({ discipline: 'poomsae', subtype: 'recognized', format: 'pair', gender: 'mixed', min: 2, max: 2 }, ages[1], null, 4000)
      cat({ discipline: 'poomsae', subtype: 'freestyle', format: 'individual', gender: 'open' }, ages[2], black)
      cat({ discipline: 'breaking', subtype: 'power', format: 'individual', gender: 'male' }, ages[2], black)
      cat({ discipline: 'breaking', subtype: 'speed', format: 'individual', gender: 'open' }, null, null)
      cat({ discipline: 'demonstration', subtype: 'team_performance', format: 'team', gender: 'open', min: 5, max: 10 }, null, null, 10000)
    }
    configure(open)
    db.run("INSERT INTO announcements (event_id, title, body, pinned, created_by) VALUES (?, 'Weigh-in times confirmed', 'Weigh-in runs from 16:00 to 19:00 the day before competition at the venue. Bring original ID.', 1, ?)", [open, organizerId])

    const upcoming = event({
      slug: `demo-poomsae-festival-${year + 1}`,
      name: 'Demo Poomsae Festival',
      organizer: 'Demo Organizing Committee',
      summary: 'Recognized and freestyle poomsae for all belts.',
      description: 'A poomsae-only festival. Demo data.',
      city: 'Islamabad',
      country: 'Pakistan',
      venue_name: 'Demo Indoor Arena',
      start_date: addDays(today, 110),
      end_date: addDays(today, 110),
      registration_opens: addDays(today, 60),
      registration_deadline: addDays(today, 100),
      published: 1,
      base_fee: 2000,
      require_medical: 0,
      created_by: adminId,
    })
    const ageAll = db.run("INSERT INTO age_divisions (event_id, name, min_age, max_age) VALUES (?, 'Open age (8+)', 8, 99)", upcoming).id
    for (const gender of ['male', 'female']) {
      db.run(
        "INSERT INTO event_categories (event_id, discipline, subtype, format, gender, age_division_id, name) VALUES (?, 'poomsae', 'recognized', 'individual', ?, ?, ?)",
        [upcoming, gender, ageAll, `Recognized Poomsae · ${gender === 'male' ? 'Male' : 'Female'} · Open age (8+)`],
      )
    }

    const done = event({
      slug: `demo-autumn-cup-${year}`,
      name: 'Demo Autumn Cup',
      organizer: 'Demo Organizing Committee',
      summary: 'Completed championship (demo).',
      city: 'Lahore',
      country: 'Pakistan',
      start_date: addDays(today, -60),
      end_date: addDays(today, -59),
      registration_deadline: addDays(today, -70),
      published: 1,
      created_by: adminId,
    })
    configure(done)
    return true
  })
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  if (config.isProd) {
    console.error('Refusing to seed demo data in production.')
    process.exit(1)
  }
  const db = openDatabase()
  migrate(db)
  console.log(seed(db) ? 'Demo data added. Logins are listed at the top of server/src/seed.js.' : 'Database already has events; nothing added.')
  db.close()
}
