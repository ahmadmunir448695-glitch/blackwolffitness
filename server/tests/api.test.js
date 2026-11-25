/**
 * End-to-end API tests: a real server on a random port, an in-memory
 * database and a temporary upload folder.
 */
import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const storage = mkdtempSync(join(tmpdir(), 'bw-portal-test-'))
process.env.STORAGE_DIR = storage
process.env.DATABASE_PATH = ':memory:'
process.env.SESSION_SECRET = 'test-secret'
process.env.ADMIN_EMAIL = 'root@test.test'
process.env.ADMIN_PASSWORD = 'RootPass123'

const { openDatabase, migrate } = await import('../src/db.js')
const { createApp, bootstrapAdmin } = await import('../src/app.js')
const { seed, DEMO_USERS } = await import('../src/seed.js')

let server
let base
let db

const PNG = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex')
const PDF = Buffer.from('%PDF-1.4\n%test\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')

async function call(method, path, { token, body, form } = {}) {
  const headers = {}
  if (token) headers.authorization = `Bearer ${token}`
  let payload
  if (form) payload = form
  else if (body !== undefined) {
    headers['content-type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const res = await fetch(base + path, { method, headers, body: payload })
  const type = res.headers.get('content-type') || ''
  const data = type.includes('json') ? await res.json() : await res.arrayBuffer()
  return { status: res.status, data, headers: res.headers }
}

const login = async (email, password) => (await call('POST', '/api/auth/login', { body: { email, password } })).data.token

function fileForm(fields, name, bytes, type, filename) {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) form.append(k, v)
  form.append(name, new Blob([bytes], { type }), filename)
  return form
}

before(async () => {
  db = openDatabase(':memory:')
  migrate(db)
  bootstrapAdmin(db)
  seed(db)
  server = createApp(db).listen(0)
  await new Promise((r) => server.once('listening', r))
  base = `http://127.0.0.1:${server.address().port}`
})

after(() => {
  server?.close()
  db?.close()
  rmSync(storage, { recursive: true, force: true })
})

describe('auth', () => {
  test('signup creates a club manager with a club', async () => {
    const res = await call('POST', '/api/auth/signup', {
      body: { name: 'Second Manager', email: 'second@test.test', password: 'Second123', club_name: 'Second Club', country: 'Pakistan', city: 'Karachi' },
    })
    assert.equal(res.status, 201)
    assert.equal(res.data.user.role, 'club_manager')
    assert.equal(res.data.user.club.name, 'Second Club')
    assert.ok(res.data.token)
  })

  test('signup validates fields and rejects duplicate email', async () => {
    const bad = await call('POST', '/api/auth/signup', { body: { email: 'nope', password: 'short' } })
    assert.equal(bad.status, 400)
    assert.ok(bad.data.fields.email && bad.data.fields.password && bad.data.fields.club_name)
    const dup = await call('POST', '/api/auth/signup', {
      body: { name: 'X', email: DEMO_USERS.club.email, password: 'Abcdefg123', club_name: 'X', country: 'X', city: 'X' },
    })
    assert.equal(dup.status, 409)
  })

  test('wrong password and missing token are rejected', async () => {
    assert.equal((await call('POST', '/api/auth/login', { body: { email: DEMO_USERS.club.email, password: 'wrong-pass1' } })).status, 401)
    assert.equal((await call('GET', '/api/auth/me')).status, 401)
    assert.equal((await call('GET', '/api/auth/me', { token: 'forged.token' })).status, 401)
  })

  test('bootstrap super admin can sign in', async () => {
    const token = await login('root@test.test', 'RootPass123')
    const me = await call('GET', '/api/auth/me', { token })
    assert.equal(me.data.user.role, 'super_admin')
  })

  test('changing password invalidates old tokens', async () => {
    const res = await call('POST', '/api/auth/signup', {
      body: { name: 'Pw', email: 'pw@test.test', password: 'Original123', club_name: 'Pw Club', country: 'PK', city: 'Lahore' },
    })
    const old = res.data.token
    const changed = await call('POST', '/api/auth/change-password', { token: old, body: { current_password: 'Original123', new_password: 'Changed123' } })
    assert.equal(changed.status, 200)
    assert.equal((await call('GET', '/api/auth/me', { token: old })).status, 401)
    assert.equal((await call('GET', '/api/auth/me', { token: changed.data.token })).status, 200)
  })
})

describe('events', () => {
  test('public list shows published events with computed status', async () => {
    const res = await call('GET', '/api/events')
    assert.equal(res.status, 200)
    const statuses = Object.fromEntries(res.data.items.map((e) => [e.name, e.status]))
    assert.equal(statuses['Demo Open Taekwondo Championship'], 'registration_open')
    assert.equal(statuses['Demo Poomsae Festival'], 'upcoming')
    assert.equal(statuses['Demo Autumn Cup'], 'completed')
  })

  test('event details include divisions and categories', async () => {
    const res = await call('GET', '/api/events/1')
    assert.equal(res.status, 200)
    assert.equal(res.data.age_divisions.length, 3)
    assert.ok(res.data.weight_divisions.length > 40)
    assert.ok(res.data.categories.some((c) => c.discipline === 'demonstration'))
  })

  test('unpublished events are hidden from the public', async () => {
    const admin = await login('root@test.test', 'RootPass123')
    const created = await call('POST', '/api/admin/events', {
      token: admin,
      body: { name: 'Hidden Cup', organizer: 'Org', start_date: '2030-05-01', end_date: '2030-05-02', registration_deadline: '2030-04-20' },
    })
    assert.equal(created.status, 201)
    const id = created.data.event.id
    assert.equal((await call('GET', `/api/events/${id}`)).status, 404)
    assert.equal((await call('GET', `/api/events/${id}`, { token: admin })).status, 200)
    // Cannot publish without categories.
    assert.equal((await call('POST', `/api/admin/events/${id}/publish`, { token: admin, body: { published: true } })).status, 400)
  })
})

describe('registration workflow', () => {
  let club
  let event
  let teamId
  let athletes

  before(async () => {
    club = await login(DEMO_USERS.club.email, DEMO_USERS.club.password)
    event = (await call('GET', '/api/events/1')).data
    teamId = (await call('GET', '/api/teams', { token: club })).data.items[0].id
    athletes = (await call('GET', '/api/athletes?pageSize=50', { token: club })).data.items
  })

  const athlete = (name) => athletes.find((a) => a.full_name === name)
  const kyorugi = (gender, ageName) =>
    event.categories.find((c) => c.discipline === 'kyorugi' && c.gender === gender && event.age_divisions.find((a) => a.id === c.age_division_id).name.startsWith(ageName))

  test('eligibility check catches wrong weight and wrong gender', async () => {
    const ali = athlete('Ali Raza') // male cadet, 41.5 kg
    const cat = kyorugi('male', 'Cadet')
    const heavy = event.weight_divisions.find((w) => w.age_division_id === cat.age_division_id && w.gender === 'male' && w.max_kg === 37)
    const res = await call('POST', '/api/registrations/check', {
      token: club,
      body: { event_id: event.event.id, team_id: teamId, category_id: cat.id, weight_division_id: heavy.id, athlete_ids: [ali.id] },
    })
    assert.equal(res.data.eligible, false)
    assert.match(res.data.problems.join(' '), /above/)

    const female = kyorugi('female', 'Cadet')
    const res2 = await call('POST', '/api/registrations/check', {
      token: club,
      body: { event_id: event.event.id, team_id: teamId, category_id: female.id, athlete_ids: [ali.id] },
    })
    assert.match(res2.data.problems.join(' '), /not eligible for a female/)
  })

  test('submission requires documents, then succeeds and blocks duplicates', async () => {
    const ali = athlete('Ali Raza')
    const cat = kyorugi('male', 'Cadet')
    const weight = event.weight_divisions.find((w) => w.age_division_id === cat.age_division_id && w.gender === 'male' && w.max_kg === 45)
    const entry = { category_id: cat.id, weight_division_id: weight.id, athlete_ids: [ali.id] }

    const missing = await call('POST', '/api/registrations', { token: club, body: { event_id: event.event.id, team_id: teamId, submit: true, entries: [entry] } })
    assert.equal(missing.status, 422)
    assert.match(missing.data.problems.join(' '), /photo/)

    // Upload photo, ID and medical certificate.
    assert.equal((await call('POST', `/api/athletes/${ali.id}/photo`, { token: club, form: fileForm({}, 'file', PNG, 'image/png', 'ali.png') })).status, 200)
    assert.equal((await call('POST', `/api/athletes/${ali.id}/documents`, { token: club, form: fileForm({ kind: 'id_document' }, 'file', PDF, 'application/pdf', 'id.pdf') })).status, 201)
    assert.equal((await call('POST', `/api/athletes/${ali.id}/documents`, { token: club, form: fileForm({ kind: 'medical' }, 'file', PDF, 'application/pdf', 'med.pdf') })).status, 201)

    const ok = await call('POST', '/api/registrations', { token: club, body: { event_id: event.event.id, team_id: teamId, submit: true, entries: [entry] } })
    assert.equal(ok.status, 201, JSON.stringify(ok.data))
    const reg = ok.data.items[0]
    assert.equal(reg.status, 'submitted')
    assert.match(reg.code, /^REG-\d\d-[A-Z2-9]{6}$/)
    assert.equal(reg.fee_amount, 3000)
    assert.equal(reg.athletes[0].entry_weight_kg, 41.5)

    const dup = await call('POST', '/api/registrations', { token: club, body: { event_id: event.event.id, team_id: teamId, submit: false, entries: [entry] } })
    assert.equal(dup.status, 422)
    assert.match(dup.data.problems.join(' '), /already entered in this category/)

    // Confirmation PDF downloads.
    const pdf = await call('GET', `/api/registrations/${reg.id}/confirmation.pdf`, { token: club })
    assert.equal(pdf.status, 200)
    assert.equal(pdf.headers.get('content-type'), 'application/pdf')
    assert.equal(Buffer.from(pdf.data).subarray(0, 4).toString(), '%PDF')

    // Notification was created for the club.
    const notes = await call('GET', '/api/notifications', { token: club })
    assert.ok(notes.data.items.some((n) => n.title.includes('submitted')))
  })

  test('rejects uploads whose content does not match the type', async () => {
    const ali = athlete('Ali Raza')
    const fake = await call('POST', `/api/athletes/${ali.id}/documents`, {
      token: club,
      form: fileForm({ kind: 'medical' }, 'file', Buffer.from('MZ not a pdf'), 'application/pdf', 'evil.pdf'),
    })
    assert.equal(fake.status, 400)
    const exe = await call('POST', `/api/athletes/${ali.id}/documents`, {
      token: club,
      form: fileForm({ kind: 'medical' }, 'file', Buffer.from('x'), 'application/x-msdownload', 'evil.exe'),
    })
    assert.equal(exe.status, 400)
  })

  test('drafts can be edited, then submitted; mixed pair needs both genders', async () => {
    const hamza = athlete('Hamza Ali')
    const fatima = athlete('Fatima Noor')
    const pair = event.categories.find((c) => c.format === 'pair')
    const one = await call('POST', '/api/registrations', {
      token: club,
      body: { event_id: event.event.id, team_id: teamId, entries: [{ category_id: pair.id, athlete_ids: [hamza.id] }] },
    })
    assert.equal(one.status, 422)
    assert.match(one.data.problems.join(' '), /exactly 2/)

    const draft = await call('POST', '/api/registrations', {
      token: club,
      body: { event_id: event.event.id, team_id: teamId, entries: [{ category_id: pair.id, athlete_ids: [hamza.id, fatima.id] }] },
    })
    assert.equal(draft.status, 201, JSON.stringify(draft.data))
    const reg = draft.data.items[0]
    assert.equal(reg.status, 'draft')
    assert.equal(reg.fee_amount, 4000)

    const note = await call('PATCH', `/api/registrations/${reg.id}`, { token: club, body: { club_note: 'Pair entry' } })
    assert.equal(note.data.registration.club_note, 'Pair entry')

    const submit = await call('POST', `/api/registrations/${reg.id}/submit`, { token: club })
    assert.equal(submit.status, 422) // documents missing for both athletes
    assert.equal((await call('DELETE', `/api/registrations/${reg.id}`, { token: club })).status, 200)
  })

  test('organizer reviews: correction requested, club resubmits, approved, payment confirmed', async () => {
    const organizer = await login(DEMO_USERS.organizer.email, DEMO_USERS.organizer.password)
    const list = await call('GET', `/api/admin/registrations?eventId=${event.event.id}&status=submitted`, { token: organizer })
    assert.equal(list.status, 200)
    const reg = list.data.items[0]

    assert.equal((await call('POST', `/api/admin/registrations/${reg.id}/review`, { token: organizer, body: { action: 'request_correction' } })).status, 400)
    const corr = await call('POST', `/api/admin/registrations/${reg.id}/review`, { token: organizer, body: { action: 'request_correction', note: 'Upload a clearer ID.' } })
    assert.equal(corr.data.registration.status, 'correction_required')

    const resub = await call('POST', `/api/registrations/${reg.id}/submit`, { token: club })
    assert.equal(resub.data.registration.status, 'submitted')

    const approve = await call('POST', `/api/admin/registrations/${reg.id}/review`, { token: organizer, body: { action: 'approve' } })
    assert.equal(approve.data.registration.status, 'approved')
    assert.equal((await call('POST', `/api/admin/registrations/${reg.id}/review`, { token: organizer, body: { action: 'approve' } })).status, 409)

    const pay = await call('POST', `/api/registrations/${reg.id}/payments`, {
      token: club,
      form: fileForm({ amount: '3000', method: 'bank_transfer', reference: 'TX-1' }, 'proof', PNG, 'image/png', 'receipt.png'),
    })
    assert.equal(pay.status, 201)
    assert.equal(pay.data.registration.payment_status, 'pending')

    const payments = await call('GET', '/api/admin/payments?status=pending', { token: organizer })
    const pid = payments.data.items.find((p) => p.registration_id === reg.id).id
    assert.equal((await call('POST', `/api/admin/payments/${pid}`, { token: organizer, body: { status: 'paid' } })).status, 200)
    const detail = await call('GET', `/api/registrations/${reg.id}`, { token: club })
    assert.equal(detail.data.registration.payment_status, 'paid')

    const csv = await call('GET', `/api/admin/reports/entries.csv?eventId=${event.event.id}`, { token: organizer })
    assert.equal(csv.status, 200)
    assert.match(Buffer.from(csv.data).toString(), /Registration ID/)
    const cats = await call('GET', `/api/admin/reports/categories?eventId=${event.event.id}`, { token: organizer })
    assert.ok(cats.data.categories.some((c) => c.entry_count === 1))
  })
})

describe('permissions', () => {
  test('a club cannot see another club’s teams, athletes or entries', async () => {
    const other = (await call('POST', '/api/auth/signup', {
      body: { name: 'Other', email: 'other@test.test', password: 'Other1234', club_name: 'Other Club', country: 'PK', city: 'Multan' },
    })).data.token
    const club = await login(DEMO_USERS.club.email, DEMO_USERS.club.password)
    const team = (await call('GET', '/api/teams', { token: club })).data.items[0]
    const athleteId = (await call('GET', '/api/athletes', { token: club })).data.items[0].id
    const regId = (await call('GET', '/api/registrations', { token: club })).data.items[0].id

    assert.equal((await call('GET', `/api/teams/${team.id}`, { token: other })).status, 404)
    assert.equal((await call('PATCH', `/api/teams/${team.id}`, { token: other, body: { name: 'Hacked' } })).status, 404)
    assert.equal((await call('GET', `/api/athletes/${athleteId}`, { token: other })).status, 404)
    assert.equal((await call('GET', `/api/athletes/${athleteId}/photo`, { token: other })).status, 404)
    assert.equal((await call('GET', `/api/registrations/${regId}`, { token: other })).status, 404)
    assert.equal((await call('GET', `/api/registrations/${regId}/confirmation.pdf`, { token: other })).status, 404)
    assert.equal((await call('GET', '/api/registrations', { token: other })).data.total, 0)
    // Cannot register someone else's athlete.
    const myTeam = (await call('POST', '/api/teams', { token: other, body: { name: 'O Team', country: 'PK', city: 'Multan' } })).data.team
    const cat = (await call('GET', '/api/events/1')).data.categories.find((c) => c.discipline === 'breaking' && c.gender === 'open')
    const steal = await call('POST', '/api/registrations', { token: other, body: { event_id: 1, team_id: myTeam.id, entries: [{ category_id: cat.id, athlete_ids: [athleteId] }] } })
    assert.equal(steal.status, 422)
    assert.match(steal.data.problems.join(' '), /your own club/)
  })

  test('club users cannot reach the admin API', async () => {
    const club = await login(DEMO_USERS.club.email, DEMO_USERS.club.password)
    assert.equal((await call('GET', '/api/admin/registrations', { token: club })).status, 403)
    assert.equal((await call('POST', '/api/admin/events', { token: club, body: {} })).status, 403)
  })

  test('coach can add athletes but cannot delete teams or create coaches', async () => {
    const coach = await login(DEMO_USERS.coach.email, DEMO_USERS.coach.password)
    const created = await call('POST', '/api/athletes', {
      token: coach,
      body: { full_name: 'New Kid', dob: '2015-02-02', gender: 'male', nationality: 'Pakistani', belt: 'White (10th Gup)', weight_kg: 30 },
    })
    assert.equal(created.status, 201)
    const team = (await call('GET', '/api/teams', { token: coach })).data.items[0]
    assert.equal((await call('DELETE', `/api/teams/${team.id}`, { token: coach })).status, 403)
    assert.equal((await call('POST', '/api/coaches', { token: coach, body: { full_name: 'X' } })).status, 403)
    assert.equal((await call('DELETE', `/api/athletes/${created.data.athlete.id}`, { token: coach })).status, 403)
  })

  test('organizer manages only their own events', async () => {
    const organizer = await login(DEMO_USERS.organizer.email, DEMO_USERS.organizer.password)
    const mine = await call('GET', '/api/admin/events', { token: organizer })
    assert.deepEqual(mine.data.items.map((e) => e.name), ['Demo Open Taekwondo Championship'])
    const festival = (await call('GET', '/api/events')).data.items.find((e) => e.name === 'Demo Poomsae Festival')
    assert.equal((await call('PATCH', `/api/admin/events/${festival.id}`, { token: organizer, body: { name: 'Taken over' } })).status, 403)
    assert.equal((await call('GET', `/api/admin/reports/entries.csv?eventId=${festival.id}`, { token: organizer })).status, 403)
    assert.equal((await call('GET', '/api/admin/users', { token: organizer })).status, 403)
    assert.equal((await call('GET', '/api/admin/audit', { token: organizer })).status, 403)
  })

  test('important admin actions are written to the audit log', async () => {
    const admin = await login('root@test.test', 'RootPass123')
    const log = await call('GET', '/api/admin/audit?pageSize=200', { token: admin })
    const actions = new Set(log.data.items.map((l) => l.action))
    for (const a of ['approve', 'request_correction', 'confirm_payment', 'create']) assert.ok(actions.has(a), `missing ${a}`)
  })
})

describe('admin configuration', () => {
  test('organizer builds a championship: ages, weight ladder, belts, generated categories, publish', async () => {
    const organizer = await login(DEMO_USERS.organizer.email, DEMO_USERS.organizer.password)
    const ev = (await call('POST', '/api/admin/events', {
      token: organizer,
      body: { name: 'Config Cup', organizer: 'Org', start_date: '2031-03-10', end_date: '2031-03-11', registration_deadline: '2031-03-01', base_fee: 1500, currency: 'pkr' },
    })).data
    assert.equal(ev.event.currency, 'PKR')
    const id = ev.event.id
    const bad = await call('POST', `/api/admin/events/${id}/age-divisions`, { token: organizer, body: { name: 'Bad', min_age: 15, max_age: 12 } })
    assert.equal(bad.status, 400)
    let cfg = (await call('POST', `/api/admin/events/${id}/age-divisions`, { token: organizer, body: { name: 'Junior', min_age: 15, max_age: 17 } })).data
    const ageId = cfg.age_divisions[0].id
    cfg = (await call('POST', `/api/admin/events/${id}/weight-divisions/bulk`, { token: organizer, body: { age_division_id: ageId, gender: 'male', limits: '45, 48, 51', add_open_class: true } })).data
    assert.deepEqual(cfg.weight_divisions.map((w) => w.name), ['-45 kg', '-48 kg', '-51 kg', '+51 kg'])
    cfg = (await call('POST', `/api/admin/events/${id}/belt-divisions`, { token: organizer, body: { name: 'Dan', belts: ['1st Dan', '2nd Dan'] } })).data
    const gen = await call('POST', `/api/admin/events/${id}/categories/generate`, {
      token: organizer,
      body: { discipline: 'poomsae', subtype: 'recognized', format: 'individual', genders: ['male', 'female'], age_division_ids: [ageId], belt_division_ids: [cfg.belt_divisions[0].id] },
    })
    assert.equal(gen.data.created, 2)
    const again = await call('POST', `/api/admin/events/${id}/categories/generate`, {
      token: organizer,
      body: { discipline: 'poomsae', subtype: 'recognized', format: 'individual', genders: ['male', 'female'], age_division_ids: [ageId], belt_division_ids: [cfg.belt_divisions[0].id] },
    })
    assert.equal(again.data.created, 0)
    const kyo = await call('POST', `/api/admin/events/${id}/categories`, { token: organizer, body: { discipline: 'kyorugi', gender: 'open', age_division_id: ageId } })
    assert.equal(kyo.status, 400)
    const pub = await call('POST', `/api/admin/events/${id}/publish`, { token: organizer, body: { published: true } })
    assert.equal(pub.data.event.published, true)
    const closed = await call('POST', `/api/admin/events/${id}/status`, { token: organizer, body: { status: 'registration_closed' } })
    assert.equal(closed.data.event.status, 'registration_closed')
    // Copy setup into another event.
    const copy = (await call('POST', '/api/admin/events', {
      token: organizer,
      body: { name: 'Copy Cup', organizer: 'Org', start_date: '2032-03-10', end_date: '2032-03-11', registration_deadline: '2032-03-01' },
    })).data
    const copied = await call('POST', `/api/admin/events/${copy.event.id}/copy-config`, { token: organizer, body: { from_event_id: id } })
    assert.equal(copied.data.categories.length, 2)
    assert.equal(copied.data.weight_divisions.length, 4)
  })

  test('registration is refused when the event is closed', async () => {
    const admin = await login('root@test.test', 'RootPass123')
    await call('POST', '/api/admin/events/1/status', { token: admin, body: { status: 'registration_closed' } })
    const club = await login(DEMO_USERS.club.email, DEMO_USERS.club.password)
    const teamId = (await call('GET', '/api/teams', { token: club })).data.items[0].id
    const res = await call('POST', '/api/registrations', { token: club, body: { event_id: 1, team_id: teamId, entries: [{ category_id: 1, athlete_ids: [1] }] } })
    assert.equal(res.status, 409)
    await call('POST', '/api/admin/events/1/status', { token: admin, body: { status: null } })
  })
})
