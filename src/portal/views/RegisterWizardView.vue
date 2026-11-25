<script setup>
/**
 * Athlete registration wizard:
 *  1 Championship → 2 Team → 3 Athletes → 4 Athlete details → 5 Categories
 *  → 6 Documents → 7 Review → 8 Submitted (confirmation)
 * Eligibility is pre-filtered here and checked again by the server.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageHeader from '../components/PageHeader.vue'
import EmptyState from '../components/EmptyState.vue'
import AuthImage from '../components/AuthImage.vue'
import FileDrop from '../components/FileDrop.vue'
import StatusBadge from '../components/StatusBadge.vue'
import AthleteFormModal from '../components/AthleteFormModal.vue'
import TeamFormModal from '../components/TeamFormModal.vue'
import { download, fileUrl, http } from '../lib/api.js'
import { DISCIPLINE_LABELS, competitionAge, fmtDate, fmtMoney, fmtRange, humanize } from '../lib/format.js'
import { isManager } from '../lib/session.js'
import { toast } from '../lib/ui.js'

const route = useRoute()

const STEPS = ['Championship', 'Team', 'Athletes', 'Details', 'Categories', 'Documents', 'Review', 'Submitted']
const step = ref(1)
const loadError = ref('')

// ---- Data -------------------------------------------------------------------
const events = ref([])
const eventsLoading = ref(true)
const cfg = ref(null) // { event, age_divisions, weight_divisions, belt_divisions, categories }
const teams = ref([])
const coaches = ref([])
const athletes = ref([])
const athletesLoading = ref(false)
const docsByAthlete = reactive({}) // id → Set(kind)

const state = reactive({
  eventSlug: '',
  teamId: null,
  athleteIds: [],
  entries: [], // { key, category_id, weight_division_id, athlete_ids }
  coachId: '',
  note: '',
  showAllAthletes: false,
  confirmed: false,
})

onMounted(async () => {
  try {
    const [ev, tm, co] = await Promise.all([http.get('/events', { status: 'registration_open' }), http.get('/teams'), http.get('/coaches')])
    events.value = ev.items
    teams.value = tm.items.filter((t) => t.status === 'active')
    coaches.value = co.items
    if (teams.value.length === 1) state.teamId = teams.value[0].id
    const q = route.query
    if (q.team && teams.value.some((t) => t.id === Number(q.team))) state.teamId = Number(q.team)
    if (q.event) {
      await chooseEvent(String(q.event))
      if (cfg.value?.event.registration_open) step.value = state.teamId ? 3 : 2
    }
    if (q.athlete) state.athleteIds = [Number(q.athlete)]
  } catch (err) {
    loadError.value = err.message
  } finally {
    eventsLoading.value = false
  }
})

async function chooseEvent(slug) {
  if (state.eventSlug === slug && cfg.value) return
  try {
    cfg.value = await http.get(`/events/${slug}`)
    state.eventSlug = slug
    state.entries = []
  } catch (err) {
    toast.error(err)
  }
}

async function loadAthletes() {
  if (!state.teamId) return
  athletesLoading.value = true
  try {
    const res = await http.get('/athletes', { pageSize: 100, teamId: state.showAllAthletes ? '' : state.teamId, sort: 'name', dir: 'asc' })
    athletes.value = res.items
    for (const a of res.items) docsByAthlete[a.id] = new Set((a.document_kinds || '').split(',').filter(Boolean))
  } catch (err) {
    toast.error(err)
  } finally {
    athletesLoading.value = false
  }
}
watch(() => [state.teamId, state.showAllAthletes], loadAthletes)
watch(() => state.teamId, (id) => {
  const team = teams.value.find((t) => t.id === id)
  const head = coaches.value.find((c) => c.team_id === id && c.role === 'head')
  if (team && head && !state.coachId) state.coachId = head.id
})

const event = computed(() => cfg.value?.event)
const team = computed(() => teams.value.find((t) => t.id === state.teamId))
const selected = computed(() => state.athleteIds.map((id) => athletes.value.find((a) => a.id === id)).filter(Boolean))
const athleteById = (id) => athletes.value.find((a) => a.id === id)

// ---- Eligibility helpers -----------------------------------------------------
const ageDiv = (id) => cfg.value?.age_divisions.find((a) => a.id === id)
const beltDiv = (id) => cfg.value?.belt_divisions.find((b) => b.id === id)

function fitsCategory(a, c) {
  if ((c.gender === 'male' || c.gender === 'female') && a.gender !== c.gender) return false
  const age = ageDiv(c.age_division_id)
  if (age) {
    const v = competitionAge(a.dob, event.value)
    if (v < age.min_age || v > age.max_age) return false
  }
  const belt = beltDiv(c.belt_division_id)
  if (belt && belt.belts.length && !belt.belts.includes(a.belt)) return false
  return true
}

function weightOptions(c, a) {
  return (cfg.value?.weight_divisions ?? []).filter((w) => w.age_division_id === c.age_division_id && w.gender === a.gender)
}

function suggestWeight(c, a) {
  if (a.weight_kg === null || a.weight_kg === undefined) return null
  const tol = Number(event.value.weight_tolerance_kg || 0)
  return weightOptions(c, a).find((w) => (w.min_kg === null || a.weight_kg > w.min_kg) && (w.max_kg === null || a.weight_kg <= w.max_kg + tol))?.id ?? null
}

const individualCats = computed(() => (cfg.value?.categories ?? []).filter((c) => c.format === 'individual'))
const groupCats = computed(() => (cfg.value?.categories ?? []).filter((c) => c.format !== 'individual'))

function eligibleFor(a) {
  return individualCats.value.filter((c) => fitsCategory(a, c))
}

function entryFor(athleteId, categoryId) {
  return state.entries.find((e) => e.category_id === categoryId && e.athlete_ids.length === 1 && e.athlete_ids[0] === athleteId && !e.group)
}

let keySeq = 1
function toggleIndividual(a, c) {
  const existing = entryFor(a.id, c.id)
  if (existing) {
    state.entries.splice(state.entries.indexOf(existing), 1)
    return
  }
  state.entries.push({ key: keySeq++, category_id: c.id, weight_division_id: c.discipline === 'kyorugi' ? suggestWeight(c, a) : null, athlete_ids: [a.id] })
}

function addGroupEntry() {
  state.entries.push({ key: keySeq++, group: true, category_id: '', weight_division_id: null, athlete_ids: [] })
}
function removeEntry(e) {
  state.entries.splice(state.entries.indexOf(e), 1)
}
function toggleMember(e, id) {
  const i = e.athlete_ids.indexOf(id)
  i >= 0 ? e.athlete_ids.splice(i, 1) : e.athlete_ids.push(id)
}

const categoryById = (id) => cfg.value?.categories.find((c) => c.id === Number(id))
const fee = (c) => (c ? c.fee ?? event.value.base_fee ?? 0 : 0)
const total = computed(() => state.entries.reduce((sum, e) => sum + fee(categoryById(e.category_id)), 0))

// Drop entries for athletes who are no longer selected.
watch(
  () => [...state.athleteIds],
  (ids) => {
    state.entries = state.entries.filter((e) => e.group || ids.includes(e.athlete_ids[0]))
    for (const e of state.entries) if (e.group) e.athlete_ids = e.athlete_ids.filter((id) => ids.includes(id))
  },
)

// ---- Documents -----------------------------------------------------------------
function missingDocs(a) {
  if (!event.value) return []
  const kinds = docsByAthlete[a.id] ?? new Set()
  const m = []
  if (event.value.require_photo && !a.has_photo) m.push('photo')
  if (event.value.require_id_document && !kinds.has('id_document')) m.push('id_document')
  if (event.value.require_medical && !kinds.has('medical')) m.push('medical')
  return m
}
const enteredAthletes = computed(() => {
  const ids = new Set(state.entries.flatMap((e) => e.athlete_ids))
  return selected.value.filter((a) => ids.has(a.id))
})
const uploading = ref('')

async function uploadDoc(a, kind, file) {
  uploading.value = `${a.id}:${kind}`
  try {
    if (kind === 'photo') await http.upload(`/athletes/${a.id}/photo`, file)
    else await http.upload(`/athletes/${a.id}/documents`, file, { fields: { kind } })
    if (kind === 'photo') a.has_photo = true
    else (docsByAthlete[a.id] ||= new Set()).add(kind)
    toast.success(`${kind === 'photo' ? 'Photo' : kind === 'medical' ? 'Medical certificate' : 'ID document'} uploaded for ${a.full_name}.`)
  } catch (err) {
    toast.error(err)
  } finally {
    uploading.value = ''
  }
}

// ---- Review & submit -------------------------------------------------------------
const checks = ref({}) // entry key → { problems, missing }
const checking = ref(false)

async function runChecks() {
  checking.value = true
  const out = {}
  await Promise.all(
    state.entries.map(async (e) => {
      try {
        const r = await http.post('/registrations/check', {
          event_id: event.value.id,
          team_id: state.teamId,
          category_id: Number(e.category_id),
          weight_division_id: e.weight_division_id || null,
          athlete_ids: e.athlete_ids,
        })
        out[e.key] = { problems: r.problems, missing: r.missing_documents }
      } catch (err) {
        out[e.key] = { problems: err.fields ? Object.values(err.fields) : [err.message], missing: [] }
      }
    }),
  )
  checks.value = out
  checking.value = false
}

const allProblems = computed(() => Object.values(checks.value).flatMap((c) => c.problems))
const allMissing = computed(() => [...new Set(Object.values(checks.value).flatMap((c) => c.missing))])

const submitting = ref(false)
const submitError = ref([])
const created = ref([])

async function submit(final) {
  submitting.value = true
  submitError.value = []
  try {
    const res = await http.post('/registrations', {
      event_id: event.value.id,
      team_id: state.teamId,
      coach_id: state.coachId || null,
      club_note: state.note || null,
      submit: final,
      entries: state.entries.map((e) => ({ category_id: Number(e.category_id), weight_division_id: e.weight_division_id || null, athlete_ids: e.athlete_ids })),
    })
    created.value = res.items
    step.value = 8
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err) {
    submitError.value = err.problems || [err.message]
    toast.error(err)
  } finally {
    submitting.value = false
  }
}

function registerMore() {
  created.value = []
  state.athleteIds = []
  state.entries = []
  checks.value = {}
  step.value = 3
  loadAthletes()
}

const pdf = (r) => download(`/registrations/${r.id}/confirmation.pdf`, null, `registration-${r.code}.pdf`).catch(toast.error)

// ---- Step gating ---------------------------------------------------------------
const stepError = computed(() => {
  switch (step.value) {
    case 1:
      return !event.value ? 'Choose a championship.' : !event.value.registration_open ? 'Registration for this championship is not open.' : ''
    case 2:
      return state.teamId ? '' : 'Choose a team.'
    case 3:
      return state.athleteIds.length ? '' : 'Select at least one athlete.'
    case 4:
      return ''
    case 5: {
      if (!state.entries.length) return 'Choose at least one category.'
      for (const e of state.entries) {
        const c = categoryById(e.category_id)
        if (!c) return 'Choose a category for every pair or team entry.'
        if (c.discipline === 'kyorugi' && !e.weight_division_id) return `Choose a weight category for ${athleteById(e.athlete_ids[0])?.full_name}.`
        if (e.athlete_ids.length < c.min_members || e.athlete_ids.length > c.max_members) return `${c.name} needs ${c.min_members === c.max_members ? c.min_members : `${c.min_members}–${c.max_members}`} athletes.`
      }
      return ''
    }
    default:
      return ''
  }
})
const showStepError = ref(false)

function next() {
  if (stepError.value) {
    showStepError.value = true
    return
  }
  showStepError.value = false
  step.value++
  // Documents may have been uploaded elsewhere (athlete page, another tab).
  if (step.value === 6) loadAthletes()
  if (step.value === 7) runChecks()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function back() {
  showStepError.value = false
  step.value = Math.max(1, step.value - 1)
}
function goTo(n) {
  if (n < step.value && step.value < 8) step.value = n
}

// ---- Modals --------------------------------------------------------------------
const athleteModal = ref(false)
const editAthlete = ref(null)
const teamModal = ref(false)

function newAthlete() {
  editAthlete.value = null
  athleteModal.value = true
}
function editDetails(a) {
  editAthlete.value = a
  athleteModal.value = true
}
async function athleteSaved(a) {
  athleteModal.value = false
  await loadAthletes()
  if (!state.athleteIds.includes(a.id)) state.athleteIds.push(a.id)
  // Weight may have changed: refresh kyorugi suggestions for this athlete.
  for (const e of state.entries) {
    const c = categoryById(e.category_id)
    if (c?.discipline === 'kyorugi' && e.athlete_ids[0] === a.id) e.weight_division_id = suggestWeight(c, athleteById(a.id)) ?? e.weight_division_id
  }
}
async function teamSaved(t) {
  teamModal.value = false
  teams.value = (await http.get('/teams')).items.filter((x) => x.status === 'active')
  state.teamId = t.id
}

function detailWarnings(a) {
  const w = []
  if (!a.weight_kg) w.push('No weight recorded (required for kyorugi)')
  if (!a.id_number) w.push('No ID / passport number')
  if (!a.has_photo && event.value?.require_photo) w.push('No photo')
  return w
}
</script>

<template>
  <div>
    <PageHeader eyebrow="Registration" title="Register athletes" subtitle="Enter your athletes in a championship. Every step is checked against the event’s rules." />

    <p v-if="loadError" role="alert" class="mb-6 border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger">{{ loadError }}</p>

    <!-- Stepper -->
    <ol class="mb-8 flex gap-1 overflow-x-auto pb-1" aria-label="Registration steps">
      <li v-for="(s, i) in STEPS" :key="s" class="min-w-[6.5rem] flex-1">
        <button
          type="button"
          class="group w-full text-left"
          :disabled="i + 1 >= step || step === 8"
          :aria-current="step === i + 1 ? 'step' : undefined"
          @click="goTo(i + 1)"
        >
          <span class="block h-1 transition-colors" :class="i + 1 < step ? 'bg-ember' : i + 1 === step ? 'bg-ember-hi' : 'bg-iron'" />
          <span class="mt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]" :class="i + 1 <= step ? 'text-bone' : 'text-smoke'">
            <span class="flex h-5 w-5 shrink-0 items-center justify-center text-[0.7rem]" :class="i + 1 < step ? 'bg-ember text-ink' : i + 1 === step ? 'border border-ember text-ember' : 'border border-line'">
              <AppIcon v-if="i + 1 < step" name="check" class="h-3 w-3" /><template v-else>{{ i + 1 }}</template>
            </span>
            <span class="truncate group-enabled:group-hover:text-ember">{{ s }}</span>
          </span>
        </button>
      </li>
    </ol>

    <!-- Context bar -->
    <div v-if="event && step > 1 && step < 8" class="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-l-2 border-ember bg-coal px-4 py-3 text-sm">
      <span><span class="text-smoke">Championship:</span> <span class="font-semibold text-bone">{{ event.name }}</span></span>
      <span v-if="team && step > 2"><span class="text-smoke">Team:</span> <span class="font-semibold text-bone">{{ team.name }}</span></span>
      <span v-if="state.athleteIds.length && step > 3"><span class="text-smoke">Athletes:</span> <span class="font-semibold text-bone">{{ state.athleteIds.length }}</span></span>
      <span v-if="state.entries.length && step > 5"><span class="text-smoke">Entries:</span> <span class="font-semibold text-bone">{{ state.entries.length }} · {{ fmtMoney(total, event.currency) }}</span></span>
    </div>

    <!-- STEP 1: Championship -->
    <section v-if="step === 1" aria-labelledby="s1">
      <h2 id="s1" class="mb-4 font-display text-2xl uppercase tracking-wide text-bone">1. Select championship</h2>
      <div v-if="eventsLoading" class="grid gap-4 md:grid-cols-2"><div v-for="n in 2" :key="n" class="skeleton h-32" /></div>
      <EmptyState v-else-if="!events.length" icon="trophy" title="No championship is open" message="When an organizer opens registration, it will appear here.">
        <BaseButton to="/portal/events" size="sm" variant="outline">Browse all championships</BaseButton>
      </EmptyState>
      <div v-else class="grid gap-4 md:grid-cols-2" role="radiogroup" aria-label="Championship">
        <label v-for="e in events" :key="e.id" class="p-card p-card-hover flex cursor-pointer gap-4 p-4" :class="state.eventSlug === e.slug ? 'border-ember bg-ember/5' : ''">
          <input type="radio" name="event" class="p-check mt-1" :checked="state.eventSlug === e.slug" @change="chooseEvent(e.slug)" />
          <span class="hidden h-20 w-20 shrink-0 overflow-hidden bg-iron sm:block">
            <img v-if="e.poster_url" :src="fileUrl(e.poster_url)" alt="" class="h-full w-full object-cover" />
            <span v-else class="flex h-full items-center justify-center"><AppIcon name="trophy" class="h-8 w-8 text-ember" /></span>
          </span>
          <span class="min-w-0">
            <span class="block font-display text-xl uppercase leading-tight tracking-wide text-bone">{{ e.name }}</span>
            <span class="mt-1 block text-sm text-ash">{{ fmtRange(e.start_date, e.end_date) }} · {{ [e.city, e.country].filter(Boolean).join(', ') }}</span>
            <span class="mt-1 block text-sm text-smoke">Deadline {{ fmtDate(e.registration_deadline) }} · {{ e.category_count }} categories</span>
          </span>
        </label>
      </div>
    </section>

    <!-- STEP 2: Team -->
    <section v-else-if="step === 2" aria-labelledby="s2">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="s2" class="font-display text-2xl uppercase tracking-wide text-bone">2. Select team</h2>
        <BaseButton v-if="isManager" size="sm" variant="outline" icon="plus" @click="teamModal = true">Create team</BaseButton>
      </div>
      <EmptyState v-if="!teams.length" icon="users" title="No active team" message="Entries are made for a team. Create one first.">
        <BaseButton v-if="isManager" size="sm" icon="plus" @click="teamModal = true">Create team</BaseButton>
      </EmptyState>
      <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="Team">
        <label v-for="t in teams" :key="t.id" class="p-card p-card-hover flex cursor-pointer items-center gap-4 p-4" :class="state.teamId === t.id ? 'border-ember bg-ember/5' : ''">
          <input v-model="state.teamId" type="radio" name="team" :value="t.id" class="p-check" />
          <span class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-line bg-iron">
            <img v-if="t.logo_url" :src="fileUrl(t.logo_url)" alt="" class="h-full w-full object-cover" />
            <AppIcon v-else name="shield" class="h-6 w-6 text-ember" />
          </span>
          <span class="min-w-0">
            <span class="block truncate font-semibold text-bone">{{ t.name }}</span>
            <span class="text-sm text-smoke">{{ t.code }} · {{ t.total_athletes }} athletes</span>
          </span>
        </label>
      </div>
    </section>

    <!-- STEP 3: Athletes -->
    <section v-else-if="step === 3" aria-labelledby="s3">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="s3" class="font-display text-2xl uppercase tracking-wide text-bone">3. Select athletes</h2>
        <div class="flex flex-wrap items-center gap-3">
          <label class="flex items-center gap-2 text-sm text-ash"><input v-model="state.showAllAthletes" type="checkbox" class="p-check" /> Show all club athletes</label>
          <BaseButton size="sm" icon="plus" @click="newAthlete">Add new athlete</BaseButton>
        </div>
      </div>
      <div v-if="athletesLoading && !athletes.length" class="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><div v-for="n in 6" :key="n" class="skeleton h-20" /></div>
      <EmptyState v-else-if="!athletes.length" icon="kick" title="No athletes in this team" message="Add an athlete now, or show all club athletes.">
        <BaseButton size="sm" icon="plus" @click="newAthlete">Add new athlete</BaseButton>
      </EmptyState>
      <template v-else>
        <p class="mb-3 text-sm text-smoke">{{ state.athleteIds.length }} selected. Age shown is the competition age for this championship.</p>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label v-for="a in athletes" :key="a.id" class="p-card p-card-hover flex cursor-pointer items-center gap-3 p-3" :class="state.athleteIds.includes(a.id) ? 'border-ember bg-ember/5' : ''">
            <input v-model="state.athleteIds" type="checkbox" :value="a.id" class="p-check" />
            <AuthImage :src="a.has_photo ? `/athletes/${a.id}/photo` : ''" :name="a.full_name" size-class="h-11 w-11" />
            <span class="min-w-0">
              <span class="block truncate font-semibold text-bone">{{ a.full_name }}</span>
              <span class="block truncate text-xs text-smoke">{{ humanize(a.gender) }} · age {{ competitionAge(a.dob, event) }} · {{ a.belt }}{{ a.weight_kg ? ` · ${a.weight_kg} kg` : '' }}</span>
              <span v-if="a.team_id !== state.teamId" class="text-xs text-ember">{{ a.team_name ? `In ${a.team_name}` : 'No team yet — joins this team' }}</span>
            </span>
          </label>
        </div>
      </template>
    </section>

    <!-- STEP 4: Details -->
    <section v-else-if="step === 4" aria-labelledby="s4">
      <h2 id="s4" class="mb-1 font-display text-2xl uppercase tracking-wide text-bone">4. Confirm athlete details</h2>
      <p class="mb-4 text-sm text-ash">Eligibility uses these details. They must match the athlete’s ID document and weigh-in.</p>
      <div class="grid gap-4 lg:grid-cols-2">
        <article v-for="a in selected" :key="a.id" class="p-card p-5">
          <div class="flex items-start gap-4">
            <AuthImage :src="a.has_photo ? `/athletes/${a.id}/photo` : ''" :name="a.full_name" size-class="h-16 w-16" />
            <div class="min-w-0 flex-1">
              <h3 class="font-display text-xl uppercase tracking-wide text-bone">{{ a.full_name }}</h3>
              <p class="text-sm text-smoke">{{ a.code }}</p>
            </div>
            <button type="button" class="p-icon-btn" :aria-label="`Edit ${a.full_name}`" @click="editDetails(a)"><AppIcon name="edit" class="h-4 w-4" /></button>
          </div>
          <dl class="p-dl mt-4">
            <dt>Father name</dt><dd>{{ a.father_name || '—' }}</dd>
            <dt>Date of birth</dt><dd>{{ fmtDate(a.dob) }} <span class="text-smoke">(competition age {{ competitionAge(a.dob, event) }})</span></dd>
            <dt>Gender</dt><dd>{{ humanize(a.gender) }}</dd>
            <dt>Nationality</dt><dd>{{ a.nationality }}</dd>
            <dt>Passport / ID</dt><dd>{{ a.id_number || '—' }}</dd>
            <dt>Belt / Dan</dt><dd>{{ a.belt }}</dd>
            <dt>Weight</dt><dd>{{ a.weight_kg ? `${a.weight_kg} kg` : '—' }}</dd>
            <dt>Height</dt><dd>{{ a.height_cm ? `${a.height_cm} cm` : '—' }}</dd>
            <dt>Coach</dt><dd>{{ a.coach_name || '—' }}</dd>
          </dl>
          <ul v-if="detailWarnings(a).length" class="mt-4 space-y-1 text-sm text-[#f2c94c]">
            <li v-for="w in detailWarnings(a)" :key="w" class="flex items-start gap-2"><AppIcon name="alert" class="mt-0.5 h-4 w-4 shrink-0" />{{ w }}</li>
          </ul>
        </article>
      </div>
    </section>

    <!-- STEP 5: Categories -->
    <section v-else-if="step === 5" aria-labelledby="s5">
      <h2 id="s5" class="mb-1 font-display text-2xl uppercase tracking-wide text-bone">5. Select competition categories</h2>
      <p class="mb-5 text-sm text-ash">Only categories each athlete is eligible for are listed. An athlete can enter several categories.</p>

      <div class="space-y-4">
        <article v-for="a in selected" :key="a.id" class="p-card">
          <header class="flex items-center gap-3 border-b border-line px-5 py-3">
            <AuthImage :src="a.has_photo ? `/athletes/${a.id}/photo` : ''" :name="a.full_name" size-class="h-9 w-9" />
            <div>
              <h3 class="font-semibold text-bone">{{ a.full_name }}</h3>
              <p class="text-xs text-smoke">{{ humanize(a.gender) }} · age {{ competitionAge(a.dob, event) }} · {{ a.belt }}{{ a.weight_kg ? ` · ${a.weight_kg} kg` : '' }}</p>
            </div>
          </header>
          <div class="p-5">
            <p v-if="!eligibleFor(a).length" class="text-sm text-smoke">No individual category matches this athlete’s age, gender and belt.</p>
            <ul class="grid gap-2 md:grid-cols-2">
              <li v-for="c in eligibleFor(a)" :key="c.id" class="border p-3 transition-colors" :class="entryFor(a.id, c.id) ? 'border-ember bg-ember/5' : 'border-line'">
                <label class="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" class="p-check mt-0.5" :checked="Boolean(entryFor(a.id, c.id))" @change="toggleIndividual(a, c)" />
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-semibold text-bone">{{ c.name }}</span>
                    <span class="text-xs text-smoke">{{ DISCIPLINE_LABELS[c.discipline] }} · {{ fmtMoney(fee(c), event.currency) }}</span>
                  </span>
                </label>
                <label v-if="c.discipline === 'kyorugi' && entryFor(a.id, c.id)" class="mt-3 block pl-7">
                  <span class="mb-1 block text-xs font-semibold text-ash">Weight category</span>
                  <select v-model="entryFor(a.id, c.id).weight_division_id" class="p-select" :aria-invalid="!entryFor(a.id, c.id).weight_division_id">
                    <option :value="null" disabled>Choose weight</option>
                    <option v-for="w in weightOptions(c, a)" :key="w.id" :value="w.id">{{ w.name }}</option>
                  </select>
                  <span v-if="!a.weight_kg" class="mt-1 block text-xs text-[#f2c94c]">Add this athlete’s weight so the right class is suggested.</span>
                </label>
              </li>
            </ul>
          </div>
        </article>

        <article v-if="groupCats.length" class="p-card">
          <header class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
            <div>
              <h3 class="font-semibold text-bone">Pair, team and demonstration entries</h3>
              <p class="text-xs text-smoke">Choose the category, then its members from the selected athletes.</p>
            </div>
            <BaseButton size="sm" variant="outline" icon="plus" @click="addGroupEntry">Add pair / team entry</BaseButton>
          </header>
          <div class="space-y-4 p-5">
            <p v-if="!state.entries.some((e) => e.group)" class="text-sm text-smoke">No pair or team entries.</p>
            <div v-for="e in state.entries.filter((x) => x.group)" :key="e.key" class="border border-line p-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label class="flex-1">
                  <span class="p-label">Category</span>
                  <select v-model="e.category_id" class="p-select">
                    <option value="" disabled>Choose a pair or team category</option>
                    <option v-for="c in groupCats" :key="c.id" :value="c.id">{{ c.name }} ({{ c.min_members === c.max_members ? c.min_members : `${c.min_members}–${c.max_members}` }} athletes · {{ fmtMoney(fee(c), event.currency) }})</option>
                  </select>
                </label>
                <button type="button" class="flex h-11 items-center gap-1.5 px-2 text-sm text-smoke hover:text-danger" @click="removeEntry(e)"><AppIcon name="trash" class="h-4 w-4" /> Remove</button>
              </div>
              <fieldset v-if="e.category_id" class="mt-4">
                <legend class="p-label">Members <span class="font-normal text-smoke">({{ e.athlete_ids.length }} chosen)</span></legend>
                <div class="flex flex-wrap gap-2">
                  <label v-for="a in selected" :key="a.id" class="flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm" :class="[e.athlete_ids.includes(a.id) ? 'border-ember text-bone' : 'border-line text-ash', fitsCategory(a, categoryById(e.category_id)) ? '' : 'opacity-50']">
                    <input type="checkbox" class="p-check" :checked="e.athlete_ids.includes(a.id)" @change="toggleMember(e, a.id)" />
                    {{ a.full_name }}
                    <span v-if="!fitsCategory(a, categoryById(e.category_id))" class="text-xs text-[#f2c94c]">(not eligible)</span>
                  </label>
                </div>
              </fieldset>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- STEP 6: Documents -->
    <section v-else-if="step === 6" aria-labelledby="s6">
      <h2 id="s6" class="mb-1 font-display text-2xl uppercase tracking-wide text-bone">6. Upload required documents</h2>
      <p class="mb-5 text-sm text-ash">
        This championship requires:
        <template v-if="event.require_photo">a photo</template><template v-if="event.require_id_document">, ID / passport</template><template v-if="event.require_medical">, medical certificate</template>.
        You can save entries as drafts and upload later, but they can only be submitted once documents are complete.
      </p>
      <div class="grid gap-4 lg:grid-cols-2">
        <article v-for="a in enteredAthletes" :key="a.id" class="p-card p-5">
          <div class="mb-4 flex items-center gap-3">
            <AuthImage :src="a.has_photo ? `/athletes/${a.id}/photo` : ''" :name="a.full_name" :version="a.has_photo ? 1 : 0" size-class="h-12 w-12" />
            <div class="flex-1">
              <h3 class="font-semibold text-bone">{{ a.full_name }}</h3>
              <p class="text-xs" :class="missingDocs(a).length ? 'text-[#f2c94c]' : 'text-success'">{{ missingDocs(a).length ? `${missingDocs(a).length} missing` : 'All documents uploaded' }}</p>
            </div>
          </div>
          <div class="space-y-3">
            <div v-if="event.require_photo">
              <p class="mb-1 flex items-center gap-2 text-sm font-semibold" :class="a.has_photo ? 'text-success' : 'text-bone'"><AppIcon :name="a.has_photo ? 'check' : 'alert'" class="h-4 w-4" /> Athlete photo</p>
              <FileDrop v-if="!a.has_photo" accept="image/jpeg,image/png,image/webp" label="Upload photo" compact :busy="uploading === `${a.id}:photo`" @select="uploadDoc(a, 'photo', $event)" />
            </div>
            <div v-if="event.require_id_document">
              <p class="mb-1 flex items-center gap-2 text-sm font-semibold" :class="docsByAthlete[a.id]?.has('id_document') ? 'text-success' : 'text-bone'"><AppIcon :name="docsByAthlete[a.id]?.has('id_document') ? 'check' : 'alert'" class="h-4 w-4" /> ID / passport document</p>
              <FileDrop v-if="!docsByAthlete[a.id]?.has('id_document')" label="Upload ID / passport" compact :busy="uploading === `${a.id}:id_document`" @select="uploadDoc(a, 'id_document', $event)" />
            </div>
            <div v-if="event.require_medical">
              <p class="mb-1 flex items-center gap-2 text-sm font-semibold" :class="docsByAthlete[a.id]?.has('medical') ? 'text-success' : 'text-bone'"><AppIcon :name="docsByAthlete[a.id]?.has('medical') ? 'check' : 'alert'" class="h-4 w-4" /> Medical certificate</p>
              <FileDrop v-if="!docsByAthlete[a.id]?.has('medical')" label="Upload medical certificate" compact :busy="uploading === `${a.id}:medical`" @select="uploadDoc(a, 'medical', $event)" />
            </div>
            <p v-if="!event.require_photo && !event.require_id_document && !event.require_medical" class="text-sm text-smoke">No documents are required for this championship.</p>
          </div>
        </article>
      </div>
    </section>

    <!-- STEP 7: Review -->
    <section v-else-if="step === 7" aria-labelledby="s7">
      <h2 id="s7" class="mb-4 font-display text-2xl uppercase tracking-wide text-bone">7. Review registration</h2>
      <div class="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div class="space-y-3">
          <article v-for="e in state.entries" :key="e.key" class="p-card p-4" :class="checks[e.key]?.problems.length ? 'border-danger/60' : ''">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <p class="font-semibold text-bone">{{ e.athlete_ids.map((id) => athleteById(id)?.full_name).join(', ') }}</p>
                <p class="text-sm text-ash">{{ categoryById(e.category_id)?.name }}<template v-if="e.weight_division_id"> · {{ cfg.weight_divisions.find((w) => w.id === e.weight_division_id)?.name }}</template></p>
              </div>
              <span class="shrink-0 font-semibold text-bone">{{ fmtMoney(fee(categoryById(e.category_id)), event.currency) }}</span>
            </div>
            <p v-if="checking && !checks[e.key]" class="mt-2 text-xs text-smoke">Checking eligibility…</p>
            <ul v-else-if="checks[e.key]?.problems.length" class="mt-3 space-y-1 text-sm text-danger" role="alert">
              <li v-for="p in checks[e.key].problems" :key="p" class="flex gap-2"><AppIcon name="alert" class="mt-0.5 h-4 w-4 shrink-0" />{{ p }}</li>
            </ul>
            <p v-else-if="checks[e.key]" class="mt-2 flex items-center gap-1.5 text-xs text-success"><AppIcon name="check" class="h-4 w-4" /> Eligible</p>
          </article>
        </div>

        <aside class="space-y-4">
          <div class="p-card p-5">
            <dl class="p-dl">
              <dt>Championship</dt><dd>{{ event.name }}</dd>
              <dt>Team</dt><dd>{{ team?.name }} ({{ team?.code }})</dd>
              <dt>Entries</dt><dd>{{ state.entries.length }}</dd>
              <dt>Athletes</dt><dd>{{ enteredAthletes.length }}</dd>
              <dt>Total fee</dt><dd class="font-display text-2xl font-bold text-ember">{{ fmtMoney(total, event.currency) }}</dd>
            </dl>
            <label class="mt-5 block">
              <span class="p-label">Responsible coach</span>
              <select v-model="state.coachId" class="p-select">
                <option value="">Not specified</option>
                <option v-for="c in coaches" :key="c.id" :value="c.id">{{ c.full_name }}{{ c.team_name ? ` · ${c.team_name}` : '' }}</option>
              </select>
            </label>
            <label class="mt-4 block">
              <span class="p-label">Note to the organizer <span class="font-normal text-smoke">(optional)</span></span>
              <textarea v-model="state.note" class="p-textarea" rows="3" maxlength="1000" />
            </label>
          </div>

          <div v-if="allMissing.length" class="border border-[#f2c94c]/50 bg-[#f2c94c]/10 p-4 text-sm text-bone">
            <p class="mb-2 font-semibold">Documents missing</p>
            <ul class="list-disc space-y-1 pl-5 text-ash"><li v-for="m in allMissing" :key="m">{{ m }}</li></ul>
            <button type="button" class="p-link mt-2" @click="step = 6">Upload documents</button>
          </div>
          <div v-if="submitError.length" class="border border-danger/50 bg-danger/10 p-4 text-sm text-danger" role="alert">
            <ul class="list-disc space-y-1 pl-5"><li v-for="p in submitError" :key="p">{{ p }}</li></ul>
          </div>

          <label class="flex items-start gap-3 text-sm text-ash">
            <input v-model="state.confirmed" type="checkbox" class="p-check mt-0.5" />
            I confirm the details are correct and the athletes agree to the championship rules.
          </label>
          <div class="flex flex-col gap-2">
            <BaseButton block :disabled="submitting || checking || allProblems.length > 0 || allMissing.length > 0 || !state.confirmed" icon-right="arrowRight" @click="submit(true)">
              {{ submitting ? 'Submitting…' : 'Submit entries' }}
            </BaseButton>
            <BaseButton block variant="outline" :disabled="submitting || checking || allProblems.length > 0" @click="submit(false)">Save as draft</BaseButton>
          </div>
          <p v-if="allProblems.length" class="text-xs text-danger">Fix the eligibility problems above before saving.</p>
        </aside>
      </div>
    </section>

    <!-- STEP 8: Confirmation -->
    <section v-else-if="step === 8" aria-labelledby="s8">
      <div class="p-card cut-corner-lg relative overflow-hidden p-6 sm:p-10">
        <div class="pointer-events-none absolute -right-10 -top-10 h-56 w-56 glow-ember opacity-60" aria-hidden="true" />
        <span class="flex h-14 w-14 items-center justify-center bg-ember text-ink"><AppIcon name="check" class="h-8 w-8" /></span>
        <h2 id="s8" class="mt-5 font-display text-[2.4rem] uppercase leading-none tracking-wide text-bone">{{ created[0]?.status === 'draft' ? 'Saved as draft' : 'Registration submitted' }}</h2>
        <p class="mt-3 max-w-2xl text-ash">
          <template v-if="created[0]?.status === 'draft'">Your entries are saved but not yet sent. Submit them from My Entries once documents are complete, before {{ fmtDate(event.registration_deadline) }}.</template>
          <template v-else>The organizer of {{ event.name }} has your entries and will review them. You’ll get a notification for every decision.</template>
        </p>

        <ul class="mt-8 divide-y divide-line border-y border-line">
          <li v-for="r in created" :key="r.id" class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <p class="font-mono text-lg font-bold text-ember">{{ r.code }}</p>
              <p class="text-bone">{{ r.athletes.map((x) => x.full_name).join(', ') }}</p>
              <p class="text-sm text-smoke">{{ r.category.name }}<template v-if="r.weight_division"> · {{ r.weight_division.name }}</template> · {{ fmtMoney(r.fee_amount, r.currency) }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <StatusBadge :value="r.status" />
              <button type="button" class="inline-flex h-9 items-center gap-1.5 border border-line px-3 text-sm font-semibold text-ash hover:border-ember hover:text-ember" @click="pdf(r)"><AppIcon name="download" class="h-4 w-4" /> Confirmation PDF</button>
            </div>
          </li>
        </ul>

        <div class="mt-8 flex flex-wrap gap-2">
          <BaseButton to="/portal/entries" icon-right="arrowRight">Go to My Entries</BaseButton>
          <BaseButton variant="outline" @click="registerMore">Register more athletes</BaseButton>
        </div>
      </div>
    </section>

    <!-- Navigation -->
    <div v-if="step < 7" class="sticky bottom-0 z-10 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-line bg-ink/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
      <BaseButton v-if="step > 1" variant="outline" size="sm" @click="back">Back</BaseButton>
      <RouterLink v-else to="/portal/events" class="text-sm text-smoke hover:text-ember">Cancel</RouterLink>
      <div class="flex items-center gap-3">
        <p v-if="showStepError && stepError" role="alert" class="text-right text-sm text-danger">{{ stepError }}</p>
        <BaseButton size="sm" icon-right="arrowRight" @click="next">Continue</BaseButton>
      </div>
    </div>
    <div v-else-if="step === 7" class="mt-6">
      <BaseButton variant="outline" size="sm" @click="back">Back</BaseButton>
    </div>

    <AthleteFormModal :open="athleteModal" :athlete="editAthlete" :team-id="state.teamId" @close="athleteModal = false" @saved="athleteSaved" />
    <TeamFormModal :open="teamModal" @close="teamModal = false" @saved="teamSaved" />
  </div>
</template>
