<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAsync } from '@/composables/useAsync.js'
import AsyncState from '@/components/ui/AsyncState.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/forms/FormField.vue'
import PageHeader from '../components/PageHeader.vue'
import StatusBadge from '../components/StatusBadge.vue'
import AuthImage from '../components/AuthImage.vue'
import Modal from '../components/Modal.vue'
import FileDrop from '../components/FileDrop.vue'
import { download, http, openFile } from '../lib/api.js'
import { DOC_KINDS, fmtDate, fmtDateTime, fmtMoney, fmtRange, fmtSize, humanize } from '../lib/format.js'
import { isClubUser } from '../lib/session.js'
import { applyFieldErrors, confirmDialog, toast } from '../lib/ui.js'

const route = useRoute()
const router = useRouter()
const { data, loading, error, reload } = useAsync(({ signal }) => http.get(`/registrations/${route.params.id}`, null, { signal }), { watch: () => route.params.id })
const r = computed(() => data.value?.registration)

const busy = ref(false)
async function act(fn, success) {
  busy.value = true
  try {
    const res = await fn()
    if (res?.registration) data.value = { registration: res.registration }
    toast.success(success)
    return true
  } catch (err) {
    toast.error(err.problems?.length ? err.problems.join(' ') : err)
    return false
  } finally {
    busy.value = false
  }
}

const canSubmit = computed(() => isClubUser.value && r.value && ['draft', 'correction_required'].includes(r.value.status) && r.value.can_edit)
const canCancel = computed(() => isClubUser.value && r.value && !['cancelled', 'rejected'].includes(r.value.status))
const canPay = computed(() => isClubUser.value && r.value && r.value.fee_amount > 0 && !['draft', 'cancelled', 'rejected'].includes(r.value.status) && ['unpaid', 'pending'].includes(r.value.payment_status))

const submitEntry = () => act(() => http.post(`/registrations/${r.value.id}/submit`), r.value.status === 'correction_required' ? 'Correction submitted for review.' : 'Entry submitted.')
async function cancelEntry() {
  if (!(await confirmDialog({ title: 'Cancel this entry?', message: 'The athlete is withdrawn from this category. Paid fees are refunded only by the organizer.', confirmLabel: 'Cancel entry', danger: true }))) return
  act(() => http.post(`/registrations/${r.value.id}/cancel`), 'Entry cancelled.')
}
async function deleteDraft() {
  if (!(await confirmDialog({ title: 'Delete draft?', message: 'The draft is removed permanently.', confirmLabel: 'Delete draft', danger: true }))) return
  try {
    await http.del(`/registrations/${r.value.id}`)
    toast.success('Draft deleted.')
    router.replace('/portal/entries')
  } catch (err) {
    toast.error(err)
  }
}
const pdf = () => download(`/registrations/${r.value.id}/confirmation.pdf`, null, `registration-${r.value.code}.pdf`).catch(toast.error)
const viewDoc = (d) => openFile(`/documents/${d.id}/download`).catch(toast.error)

// ---- Edit -------------------------------------------------------------------
const editOpen = ref(false)
const cfg = ref(null)
const clubAthletes = ref([])
const coaches = ref([])
const edit = reactive({ category_id: null, weight_division_id: null, athlete_ids: [], coach_id: '', club_note: '' })
const editProblems = ref([])

async function openEdit() {
  editProblems.value = []
  Object.assign(edit, {
    category_id: r.value.category_id,
    weight_division_id: r.value.weight_division_id,
    athlete_ids: r.value.athletes.map((a) => a.id),
    coach_id: r.value.coach_id ?? '',
    club_note: r.value.club_note ?? '',
  })
  editOpen.value = true
  try {
    const [c, a, co] = await Promise.all([http.get(`/events/${r.value.event.slug}`), http.get('/athletes', { pageSize: 100, sort: 'name', dir: 'asc' }), http.get('/coaches')])
    cfg.value = c
    clubAthletes.value = a.items
    coaches.value = co.items
  } catch (err) {
    toast.error(err)
  }
}
const editCategory = computed(() => cfg.value?.categories.find((c) => c.id === Number(edit.category_id)))
const editWeights = computed(() => {
  const c = editCategory.value
  if (!c || c.discipline !== 'kyorugi') return []
  const genders = new Set(clubAthletes.value.filter((a) => edit.athlete_ids.includes(a.id)).map((a) => a.gender))
  return cfg.value.weight_divisions.filter((w) => w.age_division_id === c.age_division_id && (!genders.size || genders.has(w.gender)))
})
function toggleEditAthlete(id) {
  const c = editCategory.value
  const i = edit.athlete_ids.indexOf(id)
  if (i >= 0) edit.athlete_ids.splice(i, 1)
  else if (c?.max_members === 1) edit.athlete_ids = [id]
  else edit.athlete_ids.push(id)
}
async function saveEdit() {
  editProblems.value = []
  const ok = await act(
    () =>
      http.patch(`/registrations/${r.value.id}`, {
        category_id: Number(edit.category_id),
        weight_division_id: editCategory.value?.discipline === 'kyorugi' ? edit.weight_division_id || null : null,
        athlete_ids: edit.athlete_ids,
        coach_id: edit.coach_id || null,
        club_note: edit.club_note || null,
      }),
    'Entry updated.',
  ).catch(() => false)
  if (ok) editOpen.value = false
}

// ---- Payment ------------------------------------------------------------------
const payOpen = ref(false)
const pay = reactive({ amount: '', method: 'bank_transfer', reference: '', note: '' })
const payErrors = reactive({ amount: '', method: '', reference: '', note: '' })
const proof = ref(null)
function openPay() {
  Object.assign(pay, { amount: r.value.fee_amount, method: 'bank_transfer', reference: '', note: '' })
  proof.value = null
  applyFieldErrors(payErrors, null)
  payOpen.value = true
}
async function savePay() {
  busy.value = true
  try {
    const res = await http.upload(`/registrations/${r.value.id}/payments`, proof.value, { fileField: 'proof', fields: pay })
    data.value = { registration: res.registration }
    payOpen.value = false
    toast.success('Payment reported. The organizer will confirm it.')
  } catch (err) {
    if (!applyFieldErrors(payErrors, err)) toast.error(err)
  } finally {
    busy.value = false
  }
}

// ---- Entry document ------------------------------------------------------------
const docKind = ref('other')
const docBusy = ref(false)
async function attach(file) {
  docBusy.value = true
  try {
    const res = await http.upload(`/registrations/${r.value.id}/documents`, file, { fields: { kind: docKind.value } })
    data.value = { registration: res.registration }
    toast.success('Document attached.')
  } catch (err) {
    toast.error(err)
  } finally {
    docBusy.value = false
  }
}

const timeline = computed(() => {
  if (!r.value) return []
  const t = [{ label: 'Created', at: r.value.created_at }]
  if (r.value.submitted_at) t.push({ label: 'Submitted', at: r.value.submitted_at })
  if (r.value.reviewed_at) t.push({ label: `Reviewed: ${humanize(r.value.status)}`, at: r.value.reviewed_at })
  return t
})
</script>

<template>
  <AsyncState :loading="loading" :error="error" error-title="This entry could not load" @retry="reload">
    <template #loading><div class="skeleton mb-6 h-40" /><div class="skeleton h-96" /></template>
    <div v-if="r">
      <PageHeader :eyebrow="`Registration ${r.code}`" :title="r.athletes.map((a) => a.full_name).join(' & ')" :subtitle="`${r.category.name}${r.weight_division ? ` · ${r.weight_division.name}` : ''}`" back="/portal/entries" back-label="My Entries">
        <template #meta>
          <div class="mt-3 flex flex-wrap gap-2"><StatusBadge :value="r.status" /><StatusBadge :value="r.payment_status" kind="payment" /></div>
        </template>
        <template #actions>
          <BaseButton size="sm" variant="outline" icon="download" @click="pdf">Confirmation PDF</BaseButton>
          <BaseButton v-if="isClubUser && r.can_edit" size="sm" variant="outline" icon="edit" @click="openEdit">Edit entry</BaseButton>
          <BaseButton v-if="canSubmit" size="sm" :disabled="busy" @click="submitEntry">{{ r.status === 'correction_required' ? 'Resubmit' : 'Submit entry' }}</BaseButton>
        </template>
      </PageHeader>

      <div v-if="r.status === 'correction_required'" class="mb-6 border border-[#f2c94c]/50 bg-[#f2c94c]/10 p-5" role="status">
        <p class="flex items-center gap-2 font-semibold text-bone"><AppIcon name="alert" class="h-5 w-5 text-[#f2c94c]" /> The organizer asked for a correction</p>
        <p class="mt-2 whitespace-pre-line text-ash">{{ r.review_note }}</p>
        <p class="mt-3 text-sm text-smoke">Fix the athlete details, documents or the entry itself, then press Resubmit.</p>
      </div>
      <div v-else-if="r.status === 'rejected'" class="mb-6 border border-danger/50 bg-danger/10 p-5" role="status">
        <p class="font-semibold text-bone">This entry was rejected</p>
        <p v-if="r.review_note" class="mt-2 whitespace-pre-line text-ash">{{ r.review_note }}</p>
      </div>
      <div v-else-if="r.status === 'draft'" class="mb-6 border border-line bg-coal p-5 text-sm text-ash">
        This entry is a draft and has not been sent to the organizer. Submit it before {{ fmtDate(r.event.registration_deadline) }}.
      </div>

      <div class="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div class="space-y-6">
          <section class="p-card p-5">
            <h2 class="mb-4 font-display text-2xl uppercase tracking-wide text-bone">Entry</h2>
            <dl class="p-dl">
              <dt>Championship</dt><dd><RouterLink :to="`/portal/events/${r.event.slug}`" class="p-link">{{ r.event.name }}</RouterLink></dd>
              <dt>Dates</dt><dd>{{ fmtRange(r.event.start_date, r.event.end_date) }}</dd>
              <dt>Discipline</dt><dd>{{ humanize(r.category.discipline) }}</dd>
              <dt>Category</dt><dd>{{ r.category.name }}</dd>
              <dt v-if="r.weight_division">Weight category</dt><dd v-if="r.weight_division">{{ r.weight_division.name }}</dd>
              <dt>Team</dt><dd>{{ r.team.name }} <span class="text-smoke">({{ r.team.code }})</span></dd>
              <dt>Club</dt><dd>{{ r.club.name }}</dd>
              <dt>Coach</dt><dd>{{ r.coach?.full_name || '—' }}</dd>
              <dt>Registered</dt><dd>{{ fmtDateTime(r.created_at) }}</dd>
              <dt>Submitted</dt><dd>{{ r.submitted_at ? fmtDateTime(r.submitted_at) : 'Not yet' }}</dd>
              <dt v-if="r.club_note">Your note</dt><dd v-if="r.club_note" class="whitespace-pre-line">{{ r.club_note }}</dd>
              <dt v-if="r.review_note && !['correction_required', 'rejected'].includes(r.status)">Organizer note</dt><dd v-if="r.review_note && !['correction_required', 'rejected'].includes(r.status)">{{ r.review_note }}</dd>
            </dl>
          </section>

          <section class="p-card">
            <h2 class="border-b border-line px-5 py-4 font-display text-2xl uppercase tracking-wide text-bone">{{ r.athletes.length > 1 ? 'Athletes' : 'Athlete' }}</h2>
            <ul class="divide-y divide-line">
              <li v-for="a in r.athletes" :key="a.id" class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <AuthImage :src="a.has_photo ? `/athletes/${a.id}/photo` : ''" :name="a.full_name" size-class="h-16 w-16" />
                <div class="grid flex-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  <p class="font-semibold text-bone sm:col-span-2">
                    <RouterLink v-if="isClubUser" :to="`/portal/athletes/${a.id}`" class="hover:text-ember">{{ a.full_name }}</RouterLink><template v-else>{{ a.full_name }}</template>
                    <span class="ml-2 font-mono text-xs text-smoke">{{ a.code }}</span>
                  </p>
                  <p class="text-ash">Born {{ fmtDate(a.dob) }} · competition age {{ a.age }}</p>
                  <p class="text-ash">{{ humanize(a.gender) }} · {{ a.nationality }}</p>
                  <p class="text-ash">{{ a.entry_belt || a.belt }}</p>
                  <p class="text-ash">{{ (a.entry_weight_kg ?? a.weight_kg) ? `${a.entry_weight_kg ?? a.weight_kg} kg` : 'Weight not set' }}<span v-if="a.entry_weight_kg" class="text-smoke"> (at submission)</span></p>
                </div>
              </li>
            </ul>
          </section>

          <section class="p-card">
            <h2 class="border-b border-line px-5 py-4 font-display text-2xl uppercase tracking-wide text-bone">Documents</h2>
            <ul class="divide-y divide-line">
              <li v-for="d in r.documents" :key="d.id" class="flex items-center justify-between gap-3 px-5 py-3">
                <div class="min-w-0">
                  <p class="truncate font-semibold text-bone">{{ DOC_KINDS[d.kind] }}<span v-if="d.athlete_id" class="font-normal text-smoke"> · {{ r.athletes.find((a) => a.id === d.athlete_id)?.full_name }}</span></p>
                  <p class="truncate text-sm text-smoke">{{ d.original_name }} · {{ fmtSize(d.size) }}</p>
                </div>
                <button type="button" class="p-icon-btn" :aria-label="`View ${d.original_name}`" @click="viewDoc(d)"><AppIcon name="eye" class="h-4 w-4" /></button>
              </li>
              <li v-if="!r.documents.length" class="px-5 py-5 text-sm text-smoke">No documents yet. Upload them on the athlete’s page.</li>
            </ul>
            <div v-if="isClubUser && !['cancelled', 'rejected'].includes(r.status)" class="grid gap-3 border-t border-line p-5 sm:grid-cols-[12rem_1fr] sm:items-end">
              <label><span class="p-label">Attach to this entry</span>
                <select v-model="docKind" class="p-select"><option value="other">Other</option><option value="medical">Medical certificate</option><option value="id_document">ID / Passport</option><option value="certificate">Certificate</option></select>
              </label>
              <FileDrop compact :busy="docBusy" label="Choose file" @select="attach" />
            </div>
          </section>
        </div>

        <aside class="space-y-6">
          <section class="p-card p-5">
            <h2 class="mb-4 font-display text-2xl uppercase tracking-wide text-bone">Payment</h2>
            <p class="font-display text-4xl font-bold text-bone">{{ fmtMoney(r.fee_amount, r.currency) }}</p>
            <div class="mt-2"><StatusBadge :value="r.payment_status" kind="payment" /></div>
            <ul v-if="r.payments.length" class="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <li v-for="p in r.payments" :key="p.id" class="flex justify-between gap-3">
                <span class="text-ash">{{ fmtDate(p.created_at) }} · {{ humanize(p.method) }}<span v-if="p.reference" class="block text-xs text-smoke">Ref {{ p.reference }}</span></span>
                <span class="text-right"><span class="block text-bone">{{ fmtMoney(p.amount, p.currency) }}</span><StatusBadge :value="p.status === 'pending' ? 'pending' : p.status" kind="payment" /></span>
              </li>
            </ul>
            <BaseButton v-if="canPay" class="mt-5" block size="sm" icon="card" @click="openPay">{{ r.payment_status === 'pending' ? 'Report another payment' : 'Report payment' }}</BaseButton>
          </section>

          <section class="p-card p-5">
            <h2 class="mb-4 font-display text-xl uppercase tracking-wide text-bone">Timeline</h2>
            <ol class="space-y-3 border-l border-line pl-4">
              <li v-for="t in timeline" :key="t.label" class="relative text-sm">
                <span class="absolute -left-[1.3rem] top-1.5 h-2 w-2 bg-ember" aria-hidden="true" />
                <p class="text-bone">{{ t.label }}</p>
                <p class="text-xs text-smoke">{{ fmtDateTime(t.at) }}</p>
              </li>
            </ol>
          </section>

          <section v-if="isClubUser" class="space-y-2">
            <button v-if="r.status === 'draft'" type="button" class="flex items-center gap-2 text-sm text-smoke hover:text-danger" @click="deleteDraft"><AppIcon name="trash" class="h-4 w-4" /> Delete draft</button>
            <button v-else-if="canCancel" type="button" class="flex items-center gap-2 text-sm text-smoke hover:text-danger" @click="cancelEntry"><AppIcon name="close" class="h-4 w-4" /> Cancel entry</button>
          </section>
        </aside>
      </div>

      <!-- Edit modal -->
      <Modal :open="editOpen" title="Edit entry" :subtitle="r.code" size="lg" @close="editOpen = false">
        <div v-if="!cfg" class="space-y-3"><div class="skeleton h-12" /><div class="skeleton h-32" /></div>
        <form v-else id="edit-entry" class="space-y-5" novalidate @submit.prevent="saveEdit">
          <label class="block"><span class="p-label">Category</span>
            <select v-model="edit.category_id" class="p-select">
              <option v-for="c in cfg.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </label>
          <label v-if="editCategory?.discipline === 'kyorugi'" class="block"><span class="p-label">Weight category</span>
            <select v-model="edit.weight_division_id" class="p-select">
              <option :value="null" disabled>Choose weight</option>
              <option v-for="w in editWeights" :key="w.id" :value="w.id">{{ w.name }} ({{ w.gender }})</option>
            </select>
          </label>
          <fieldset>
            <legend class="p-label">Athlete{{ editCategory?.max_members > 1 ? 's' : '' }} <span class="font-normal text-smoke">({{ edit.athlete_ids.length }} selected)</span></legend>
            <div class="grid max-h-64 gap-1.5 overflow-y-auto sm:grid-cols-2">
              <label v-for="a in clubAthletes" :key="a.id" class="flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm" :class="edit.athlete_ids.includes(a.id) ? 'border-ember text-bone' : 'border-line text-ash'">
                <input type="checkbox" class="p-check" :checked="edit.athlete_ids.includes(a.id)" @change="toggleEditAthlete(a.id)" />
                {{ a.full_name }} <span class="text-xs text-smoke">{{ a.weight_kg ? `${a.weight_kg} kg` : '' }}</span>
              </label>
            </div>
          </fieldset>
          <label class="block"><span class="p-label">Coach</span>
            <select v-model="edit.coach_id" class="p-select"><option value="">Not specified</option><option v-for="c in coaches" :key="c.id" :value="c.id">{{ c.full_name }}</option></select>
          </label>
          <FormField id="edit-note" label="Note to the organizer" optional>
            <template #default="{ id }"><textarea :id="id" v-model="edit.club_note" class="p-textarea" rows="3" maxlength="1000" /></template>
          </FormField>
          <p class="text-xs text-smoke">Changes are checked against the championship rules again when you save.</p>
        </form>
        <template #footer>
          <BaseButton size="sm" variant="outline" @click="editOpen = false">Cancel</BaseButton>
          <BaseButton size="sm" type="submit" form="edit-entry" :disabled="busy || !cfg">{{ busy ? 'Saving…' : 'Save changes' }}</BaseButton>
        </template>
      </Modal>

      <!-- Payment modal -->
      <Modal :open="payOpen" title="Report a payment" :subtitle="`${r.code} · ${fmtMoney(r.fee_amount, r.currency)} due`" @close="payOpen = false">
        <form id="pay-form" class="grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="savePay">
          <FormField id="pay-amount" :label="`Amount (${r.currency})`" :error="payErrors.amount">
            <template #default="{ id, describedby, invalid }"><input :id="id" v-model="pay.amount" type="number" min="1" step="1" class="p-input" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
          </FormField>
          <FormField id="pay-method" label="Method" :error="payErrors.method">
            <template #default="{ id }">
              <select :id="id" v-model="pay.method" class="p-select"><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="online">Online</option><option value="other">Other</option></select>
            </template>
          </FormField>
          <FormField id="pay-ref" label="Transaction reference" :error="payErrors.reference" optional class="sm:col-span-2">
            <template #default="{ id, describedby, invalid }"><input :id="id" v-model="pay.reference" class="p-input" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
          </FormField>
          <FormField id="pay-note" label="Note" :error="payErrors.note" optional class="sm:col-span-2">
            <template #default="{ id }"><textarea :id="id" v-model="pay.note" class="p-textarea" rows="2" /></template>
          </FormField>
          <div class="sm:col-span-2"><span class="p-label">Receipt <span class="font-normal text-smoke">(recommended)</span></span><FileDrop compact label="Upload receipt" @select="proof = $event" /></div>
        </form>
        <template #footer>
          <BaseButton size="sm" variant="outline" @click="payOpen = false">Cancel</BaseButton>
          <BaseButton size="sm" type="submit" form="pay-form" :disabled="busy">{{ busy ? 'Sending…' : 'Report payment' }}</BaseButton>
        </template>
      </Modal>
    </div>
  </AsyncState>
</template>
