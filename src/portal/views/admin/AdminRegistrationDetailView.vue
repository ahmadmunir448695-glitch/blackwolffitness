<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/forms/FormField.vue'
import PageHeader from '../../components/PageHeader.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import EmptyState from '../../components/EmptyState.vue'
import AuthImage from '../../components/AuthImage.vue'
import { download, http, openFile } from '../../lib/api.js'
import { DISCIPLINE_LABELS, DOC_KINDS, fmtDate, fmtDateTime, fmtMoney, fmtSize, humanize } from '../../lib/format.js'
import { applyFieldErrors, confirmDialog, toast } from '../../lib/ui.js'
import { parseDetails } from './adminShared.js'

const route = useRoute()
const id = route.params.id
const reg = ref(null)
const history = ref([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get(`/admin/registrations/${id}`)
    reg.value = res.registration
    history.value = res.history || []
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function reloadHistory() {
  try {
    history.value = (await http.get(`/admin/registrations/${id}`)).history || []
  } catch {
    /* the entry itself is already up to date */
  }
}

// ---- Review -------------------------------------------------------------------
const ACTIONS = [
  { key: 'start_review', label: 'Start review', from: ['submitted'], icon: 'eye' },
  { key: 'approve', label: 'Approve', from: ['submitted', 'under_review'], icon: 'check', primary: true },
  { key: 'request_correction', label: 'Request correction', from: ['submitted', 'under_review', 'approved'], note: 'What needs to be corrected?', icon: 'edit' },
  { key: 'reject', label: 'Reject', from: ['submitted', 'under_review', 'approved', 'correction_required'], note: 'Reason for rejection', danger: true, icon: 'close' },
  { key: 'reopen', label: 'Reopen for review', from: ['rejected'], icon: 'refresh' },
]
const available = computed(() => ACTIONS.filter((a) => reg.value && a.from.includes(reg.value.status)))
const reviewing = ref('')

async function review(action) {
  let note
  if (action.note) {
    note = await confirmDialog({
      title: `${action.label}: ${reg.value.code}`,
      message: 'The note is sent to the club with the decision.',
      confirmLabel: action.label,
      danger: action.danger,
      input: { label: action.note, required: true },
    })
    if (!note) return
  } else if (!(await confirmDialog({ title: `${action.label}: ${reg.value.code}?`, message: 'The club is notified.', confirmLabel: action.label }))) {
    return
  }
  reviewing.value = action.key
  try {
    const res = await http.post(`/admin/registrations/${id}/review`, { action: action.key, note })
    reg.value = res.registration
    toast.success(`Entry ${reg.value.code}: ${humanize(reg.value.status).toLowerCase()}.`)
    reloadHistory()
  } catch (err) {
    toast.error(err)
  } finally {
    reviewing.value = ''
  }
}

// ---- Payment ------------------------------------------------------------------
const pay = reactive({ payment_status: 'paid', amount: '', method: 'cash', reference: '', note: '' })
const payErrors = reactive({ payment_status: '', amount: '', method: '', reference: '', note: '' })
const paying = ref(false)
const METHODS = { cash: 'Cash', bank_transfer: 'Bank transfer', online: 'Online', waiver: 'Waiver', other: 'Other' }
const PAY_OPTIONS = { paid: 'Paid', waived: 'Waived (no fee)', refunded: 'Refunded', unpaid: 'Unpaid' }

async function savePayment() {
  paying.value = true
  applyFieldErrors(payErrors, null)
  const body = { payment_status: pay.payment_status, note: pay.note || null }
  if (pay.payment_status === 'paid') Object.assign(body, { amount: pay.amount === '' ? null : pay.amount, method: pay.method, reference: pay.reference || null })
  try {
    const res = await http.post(`/admin/registrations/${id}/payment`, body)
    reg.value = res.registration
    toast.success(`Payment marked ${PAY_OPTIONS[pay.payment_status].toLowerCase()}.`)
    Object.assign(pay, { amount: '', reference: '', note: '' })
    reloadHistory()
  } catch (err) {
    applyFieldErrors(payErrors, err)
    toast.error(err)
  } finally {
    paying.value = false
  }
}

// ---- Files --------------------------------------------------------------------
async function view(path) {
  try {
    await openFile(path)
  } catch (err) {
    toast.error(err)
  }
}
async function save(path, name) {
  try {
    await download(path, undefined, name)
  } catch (err) {
    toast.error(err)
  }
}
const athleteName = (aid) => reg.value?.athletes.find((a) => a.id === aid)?.full_name

function detailText(raw) {
  const d = parseDetails(raw)
  if (!d) return ''
  if (typeof d !== 'object') return String(d)
  const parts = []
  if (d.from && d.to) parts.push(`${humanize(d.from)} → ${humanize(d.to)}`)
  if (d.payment_status) parts.push(`Payment: ${humanize(d.payment_status)}`)
  if (d.amount) parts.push(`Amount: ${d.amount}`)
  if (d.method) parts.push(`Method: ${humanize(d.method)}`)
  if (d.reference) parts.push(`Ref: ${d.reference}`)
  if (d.note) parts.push(`“${d.note}”`)
  return parts.join(' · ')
}
</script>

<template>
  <div>
    <div v-if="loading && !reg" aria-busy="true">
      <div class="skeleton mb-3 h-5 w-32" />
      <div class="skeleton mb-8 h-12 w-1/2" />
      <div class="grid gap-6 lg:grid-cols-3"><div class="skeleton h-96 lg:col-span-2" /><div class="skeleton h-96" /></div>
    </div>

    <EmptyState v-else-if="error" icon="alert" title="Could not load this entry" :message="error">
      <BaseButton size="sm" variant="outline" icon="refresh" @click="load">Try again</BaseButton>
      <BaseButton size="sm" variant="outline" to="/portal/admin/registrations">All registrations</BaseButton>
    </EmptyState>

    <template v-else-if="reg">
      <PageHeader back="/portal/admin/registrations" back-label="Registrations" :eyebrow="reg.event?.name" :title="`Entry ${reg.code}`">
        <template #meta>
          <div class="mt-3 flex flex-wrap items-center gap-2 text-sm text-ash">
            <StatusBadge :value="reg.status" />
            <StatusBadge :value="reg.payment_status" kind="payment" />
            <span v-if="reg.submitted_at">Submitted {{ fmtDateTime(reg.submitted_at) }}</span>
          </div>
        </template>
        <template #actions>
          <BaseButton variant="outline" size="sm" icon="download" @click="save(`/registrations/${reg.id}/confirmation.pdf`, `${reg.code}.pdf`)">Confirmation PDF</BaseButton>
        </template>
      </PageHeader>

      <div class="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div class="min-w-0 space-y-6">
          <!-- Review -->
          <section class="p-card p-5 sm:p-6" aria-labelledby="review-title">
            <h2 id="review-title" class="font-display text-xl uppercase tracking-wide text-bone">Review</h2>
            <p v-if="reg.review_note" class="mt-3 border-l-2 border-ember bg-iron px-4 py-3 text-sm text-ash"><span class="font-semibold text-bone">Last note to club:</span> {{ reg.review_note }}</p>
            <p v-if="reg.club_note" class="mt-3 border-l-2 border-line bg-iron px-4 py-3 text-sm text-ash"><span class="font-semibold text-bone">Note from club:</span> {{ reg.club_note }}</p>
            <div v-if="available.length" class="mt-4 flex flex-wrap gap-2">
              <template v-for="a in available" :key="a.key">
                <BaseButton v-if="a.primary" size="sm" :icon="a.icon" :disabled="Boolean(reviewing)" @click="review(a)">{{ reviewing === a.key ? 'Saving…' : a.label }}</BaseButton>
                <button
                  v-else
                  type="button"
                  class="inline-flex h-10 items-center gap-2 border px-4 text-sm font-semibold transition-colors disabled:opacity-50"
                  :class="a.danger ? 'border-danger/60 text-danger hover:bg-danger/10' : 'border-line text-bone hover:border-ember hover:text-ember'"
                  :disabled="Boolean(reviewing)"
                  @click="review(a)"
                >
                  <AppIcon :name="a.icon" class="h-4 w-4" />{{ reviewing === a.key ? 'Saving…' : a.label }}
                </button>
              </template>
            </div>
            <p v-else class="mt-3 text-sm text-smoke">No review actions are available for an entry that is {{ humanize(reg.status).toLowerCase() }}.</p>
          </section>

          <!-- Entry -->
          <section class="p-card p-5 sm:p-6" aria-labelledby="entry-title">
            <h2 id="entry-title" class="font-display text-xl uppercase tracking-wide text-bone">Category</h2>
            <dl class="p-dl mt-4">
              <dt>Championship</dt>
              <dd><RouterLink :to="`/portal/admin/events/${reg.event_id}`" class="p-link">{{ reg.event?.name }}</RouterLink></dd>
              <dt>Category</dt>
              <dd>{{ reg.category?.name }}</dd>
              <dt>Discipline</dt>
              <dd>{{ DISCIPLINE_LABELS[reg.category?.discipline] || reg.category?.discipline }} · {{ humanize(reg.category?.format) }}</dd>
              <template v-if="reg.age_division">
                <dt>Age group</dt>
                <dd>{{ reg.age_division.name }} ({{ reg.age_division.min_age }}–{{ reg.age_division.max_age }})</dd>
              </template>
              <template v-if="reg.weight_division">
                <dt>Weight category</dt>
                <dd>{{ reg.weight_division.name }}</dd>
              </template>
              <dt>Fee</dt>
              <dd>{{ fmtMoney(reg.fee_amount, reg.currency) }}</dd>
            </dl>
          </section>

          <!-- Athletes -->
          <section aria-labelledby="ath-title">
            <h2 id="ath-title" class="mb-3 font-display text-xl uppercase tracking-wide text-bone">Athletes ({{ reg.athletes.length }})</h2>
            <ul class="grid gap-4 md:grid-cols-2">
              <li v-for="a in reg.athletes" :key="a.id" class="p-card p-4">
                <div class="flex gap-4">
                  <AuthImage :src="a.has_photo ? `/athletes/${a.id}/photo` : ''" :name="a.full_name" size-class="h-20 w-16" />
                  <div class="min-w-0">
                    <RouterLink :to="`/portal/athletes/${a.id}`" class="font-semibold text-bone hover:text-ember">{{ a.full_name }}</RouterLink>
                    <p class="text-xs text-smoke">{{ a.code }}<template v-if="a.father_name"> · s/d/o {{ a.father_name }}</template></p>
                    <p v-if="!a.has_photo" class="mt-1 text-xs text-[#f2c94c]">No photo</p>
                  </div>
                </div>
                <dl class="p-dl mt-4 text-sm">
                  <dt>Date of birth</dt>
                  <dd>{{ fmtDate(a.dob) }} <span class="text-smoke">(age {{ a.age }} for this event)</span></dd>
                  <dt>Gender</dt>
                  <dd>{{ humanize(a.gender) }}</dd>
                  <dt>Belt</dt>
                  <dd>{{ a.entry_belt || a.belt || '—' }}</dd>
                  <dt>Weight</dt>
                  <dd>{{ a.entry_weight_kg ?? a.weight_kg ?? '—' }}<template v-if="(a.entry_weight_kg ?? a.weight_kg) != null"> kg</template></dd>
                  <dt>Nationality</dt>
                  <dd>{{ a.nationality || '—' }}</dd>
                  <dt>ID / passport</dt>
                  <dd>{{ a.id_number || '—' }}</dd>
                </dl>
              </li>
            </ul>
          </section>

          <!-- Documents -->
          <section class="p-card overflow-hidden" aria-labelledby="docs-title">
            <h2 id="docs-title" class="px-5 pt-5 font-display text-xl uppercase tracking-wide text-bone sm:px-6">Documents</h2>
            <p v-if="!reg.documents.length" class="px-5 py-6 text-sm text-smoke sm:px-6">No documents uploaded.</p>
            <ul v-else class="mt-3 divide-y divide-line/70 border-t border-line">
              <li v-for="d in reg.documents" :key="d.id" class="flex flex-wrap items-center gap-3 px-5 py-3 sm:px-6">
                <AppIcon name="file" class="h-5 w-5 shrink-0 text-ember" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-bone">{{ DOC_KINDS[d.kind] || humanize(d.kind) }}<span v-if="d.athlete_id" class="font-normal text-smoke"> · {{ athleteName(d.athlete_id) }}</span></p>
                  <p class="truncate text-xs text-smoke">{{ d.original_name }} · {{ fmtSize(d.size) }}</p>
                </div>
                <div class="flex gap-2">
                  <button type="button" class="p-icon-btn" :aria-label="`View ${d.original_name}`" @click="view(`/documents/${d.id}/download`)"><AppIcon name="eye" class="h-4 w-4" /></button>
                  <button type="button" class="p-icon-btn" :aria-label="`Download ${d.original_name}`" @click="save(`/documents/${d.id}/download`, d.original_name)"><AppIcon name="download" class="h-4 w-4" /></button>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <aside class="space-y-6">
          <!-- Team & club -->
          <section class="p-card p-5" aria-labelledby="team-title">
            <h2 id="team-title" class="font-display text-xl uppercase tracking-wide text-bone">Team</h2>
            <p class="mt-3 font-semibold text-bone">{{ reg.team?.name }} <span class="font-mono text-xs font-normal text-smoke">{{ reg.team?.code }}</span></p>
            <dl class="p-dl mt-3 text-sm">
              <dt>Club</dt>
              <dd>{{ reg.club?.name }}</dd>
              <template v-if="reg.club?.city">
                <dt>City</dt>
                <dd>{{ reg.club.city }}</dd>
              </template>
              <template v-if="reg.club?.phone">
                <dt>Phone</dt>
                <dd><a :href="`tel:${reg.club.phone}`" class="hover:text-ember">{{ reg.club.phone }}</a></dd>
              </template>
              <template v-if="reg.club?.email">
                <dt>Email</dt>
                <dd><a :href="`mailto:${reg.club.email}`" class="hover:text-ember">{{ reg.club.email }}</a></dd>
              </template>
              <template v-if="reg.coach">
                <dt>Coach</dt>
                <dd>{{ reg.coach.full_name }}<span v-if="reg.coach.phone" class="block text-smoke">{{ reg.coach.phone }}</span></dd>
              </template>
            </dl>
          </section>

          <!-- Payment -->
          <section class="p-card p-5" aria-labelledby="pay-title">
            <div class="flex items-center justify-between gap-3">
              <h2 id="pay-title" class="font-display text-xl uppercase tracking-wide text-bone">Payment</h2>
              <StatusBadge :value="reg.payment_status" kind="payment" />
            </div>
            <p class="mt-1 text-sm text-smoke">Fee due: <span class="text-bone">{{ fmtMoney(reg.fee_amount, reg.currency) }}</span></p>
            <ul v-if="reg.payments.length" class="mt-4 space-y-2">
              <li v-for="p in reg.payments" :key="p.id" class="border border-line px-3 py-2.5 text-sm">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-semibold text-bone">{{ fmtMoney(p.amount, p.currency) }}</span>
                  <StatusBadge :value="p.status" kind="payment" />
                </div>
                <p class="mt-1 text-xs text-smoke">{{ humanize(p.method) }}<template v-if="p.reference"> · {{ p.reference }}</template> · {{ fmtDate(p.created_at) }}</p>
                <button v-if="p.proof_document_id" type="button" class="mt-1 text-xs font-semibold text-ember hover:underline" @click="view(`/documents/${p.proof_document_id}/download`)">View receipt</button>
              </li>
            </ul>
            <form class="mt-5 space-y-3 border-t border-line pt-4" novalidate @submit.prevent="savePayment">
              <FormField id="pay-status" label="Set payment status" :error="payErrors.payment_status">
                <template #default="{ id: fid, describedby, invalid }">
                  <select :id="fid" v-model="pay.payment_status" class="p-select" :aria-invalid="invalid" :aria-describedby="describedby">
                    <option v-for="(label, key) in PAY_OPTIONS" :key="key" :value="key">{{ label }}</option>
                  </select>
                </template>
              </FormField>
              <template v-if="pay.payment_status === 'paid'">
                <FormField id="pay-amount" label="Amount" optional :hint="`Empty = ${fmtMoney(reg.fee_amount, reg.currency)}`" :error="payErrors.amount">
                  <template #default="{ id: fid, describedby, invalid }">
                    <input :id="fid" v-model.number="pay.amount" type="number" min="0" step="any" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
                  </template>
                </FormField>
                <FormField id="pay-method" label="Method" :error="payErrors.method">
                  <template #default="{ id: fid, describedby, invalid }">
                    <select :id="fid" v-model="pay.method" class="p-select" :aria-invalid="invalid" :aria-describedby="describedby">
                      <option v-for="(label, key) in METHODS" :key="key" :value="key">{{ label }}</option>
                    </select>
                  </template>
                </FormField>
                <FormField id="pay-ref" label="Reference" optional :error="payErrors.reference">
                  <template #default="{ id: fid, describedby, invalid }">
                    <input :id="fid" v-model="pay.reference" class="p-input" maxlength="120" :aria-invalid="invalid" :aria-describedby="describedby" />
                  </template>
                </FormField>
              </template>
              <FormField id="pay-note" label="Note to club" optional :error="payErrors.note">
                <template #default="{ id: fid, describedby, invalid }">
                  <textarea :id="fid" v-model="pay.note" class="p-textarea min-h-[4.5rem]" rows="2" maxlength="500" :aria-invalid="invalid" :aria-describedby="describedby" />
                </template>
              </FormField>
              <p v-if="pay.payment_status === 'paid' && reg.payments.some((p) => p.status === 'pending')" class="text-xs text-smoke">The pending payment reported by the club will be confirmed.</p>
              <BaseButton type="submit" size="sm" block :disabled="paying">{{ paying ? 'Saving…' : 'Update payment' }}</BaseButton>
            </form>
          </section>

          <!-- History -->
          <section class="p-card p-5" aria-labelledby="hist-title">
            <h2 id="hist-title" class="font-display text-xl uppercase tracking-wide text-bone">History</h2>
            <p v-if="!history.length" class="mt-3 text-sm text-smoke">No history yet.</p>
            <ol v-else class="mt-4 space-y-4 border-l border-line pl-4">
              <li v-for="(h, i) in history" :key="i" class="relative">
                <span class="absolute -left-[1.3rem] top-1.5 h-2 w-2 bg-ember" aria-hidden="true" />
                <p class="text-sm font-semibold text-bone">{{ humanize(h.action) }}</p>
                <p v-if="detailText(h.details)" class="text-sm text-ash">{{ detailText(h.details) }}</p>
                <p class="text-xs text-smoke">{{ fmtDateTime(h.created_at) }}<template v-if="h.user_name"> · {{ h.user_name }}</template></p>
              </li>
            </ol>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
