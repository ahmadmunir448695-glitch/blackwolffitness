<script setup>
import { reactive, ref } from 'vue'
import { useAsync } from '@/composables/useAsync.js'
import AsyncState from '@/components/ui/AsyncState.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/forms/FormField.vue'
import PageHeader from '../components/PageHeader.vue'
import EmptyState from '../components/EmptyState.vue'
import Modal from '../components/Modal.vue'
import { http } from '../lib/api.js'
import { humanize } from '../lib/format.js'
import { isManager } from '../lib/session.js'
import { applyFieldErrors, confirmDialog, toast } from '../lib/ui.js'

const { data, loading, error, reload } = useAsync(({ signal }) => http.get('/coaches', null, { signal }).then((d) => d.items), { initial: [] })
const teams = ref([])
http.get('/teams').then((d) => (teams.value = d.items)).catch(() => {})

const KEYS = ['full_name', 'role', 'phone', 'email', 'dan_grade', 'license_no', 'team_id']
const form = reactive({ full_name: '', role: 'assistant', phone: '', email: '', dan_grade: '', license_no: '', team_id: '' })
const errors = reactive(Object.fromEntries(KEYS.map((k) => [k, ''])))
const modal = ref(false)
const editing = ref(null)
const busy = ref(false)

function open(c = null) {
  editing.value = c
  for (const k of KEYS) form[k] = c ? (c[k] ?? '') : k === 'role' ? 'assistant' : ''
  applyFieldErrors(errors, null)
  modal.value = true
}

async function save() {
  busy.value = true
  try {
    const body = Object.fromEntries(KEYS.map((k) => [k, form[k] === '' ? null : form[k]]))
    if (editing.value) await http.patch(`/coaches/${editing.value.id}`, body)
    else await http.post('/coaches', body)
    toast.success(editing.value ? 'Coach updated.' : 'Coach added.')
    modal.value = false
    reload()
  } catch (err) {
    if (!applyFieldErrors(errors, err)) toast.error(err)
  } finally {
    busy.value = false
  }
}

async function remove(c) {
  if (!(await confirmDialog({ title: `Remove ${c.full_name}?`, message: c.account ? 'Their login will be switched off.' : '', confirmLabel: 'Remove coach', danger: true }))) return
  try {
    await http.del(`/coaches/${c.id}`)
    toast.success('Coach removed.')
    reload()
  } catch (err) {
    toast.error(err)
  }
}

const loginFor = ref(null)
const login = reactive({ email: '', password: '' })
const loginErrors = reactive({ email: '', password: '' })
function openLogin(c) {
  loginFor.value = c
  login.email = c.email || ''
  login.password = ''
  applyFieldErrors(loginErrors, null)
}
async function createLogin() {
  busy.value = true
  try {
    await http.post(`/coaches/${loginFor.value.id}/account`, login)
    toast.success('Coach login created. Share the password with the coach privately.')
    loginFor.value = null
    reload()
  } catch (err) {
    if (!applyFieldErrors(loginErrors, err)) toast.error(err)
  } finally {
    busy.value = false
  }
}
async function toggleLogin(c) {
  try {
    await http.post(`/coaches/${c.id}/account/status`, { active: !c.account.is_active })
    toast.success(c.account.is_active ? 'Login switched off.' : 'Login switched on.')
    reload()
  } catch (err) {
    toast.error(err)
  }
}

const fields = [
  { key: 'full_name', label: 'Full name', span: true },
  { key: 'phone', label: 'Phone', type: 'tel', optional: true },
  { key: 'email', label: 'Email', type: 'email', optional: true },
  { key: 'dan_grade', label: 'Dan grade', optional: true },
  { key: 'license_no', label: 'Coach licence no.', optional: true },
]
</script>

<template>
  <div>
    <PageHeader eyebrow="Coaches" title="Coaches" subtitle="Coaches and team officials. Give a coach a login so they can add athletes and register entries.">
      <template v-if="isManager" #actions><BaseButton size="sm" icon="plus" @click="open()">Add coach</BaseButton></template>
    </PageHeader>

    <AsyncState :loading="loading" :error="error" :empty="!data.length" error-title="Coaches could not load" @retry="reload">
      <template #loading><div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><div v-for="n in 3" :key="n" class="skeleton h-48" /></div></template>
      <template #empty>
        <EmptyState icon="user" title="No coaches yet" message="Add your head coach and assistants. They appear on entries and the confirmation PDF.">
          <BaseButton v-if="isManager" size="sm" icon="plus" @click="open()">Add coach</BaseButton>
        </EmptyState>
      </template>
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="c in data" :key="c.id" class="p-card flex flex-col p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-ember">{{ humanize(c.role) }}</p>
              <h2 class="mt-1 truncate font-display text-2xl uppercase tracking-wide text-bone">{{ c.full_name }}</h2>
              <p class="text-sm text-smoke">{{ c.team_name || 'No team assigned' }}</p>
            </div>
            <div v-if="isManager" class="flex gap-1.5">
              <button type="button" class="p-icon-btn" :aria-label="`Edit ${c.full_name}`" @click="open(c)"><AppIcon name="edit" class="h-4 w-4" /></button>
              <button type="button" class="p-icon-btn is-danger" :aria-label="`Remove ${c.full_name}`" @click="remove(c)"><AppIcon name="trash" class="h-4 w-4" /></button>
            </div>
          </div>
          <dl class="p-dl mt-4 text-sm">
            <dt>Dan grade</dt><dd>{{ c.dan_grade || '—' }}</dd>
            <dt>Licence</dt><dd>{{ c.license_no || '—' }}</dd>
            <dt>Phone</dt><dd>{{ c.phone || '—' }}</dd>
            <dt>Email</dt><dd>{{ c.email || '—' }}</dd>
            <dt>Athletes</dt><dd>{{ c.athlete_count }}</dd>
          </dl>
          <div class="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
            <span v-if="c.account" class="flex items-center gap-2" :class="c.account.is_active ? 'text-success' : 'text-smoke'">
              <AppIcon :name="c.account.is_active ? 'check' : 'close'" class="h-4 w-4" /> {{ c.account.is_active ? 'Login active' : 'Login off' }}
            </span>
            <span v-else class="text-smoke">No login</span>
            <template v-if="isManager">
              <button v-if="!c.account" type="button" class="p-link" @click="openLogin(c)">Create login</button>
              <button v-else type="button" class="p-link" @click="toggleLogin(c)">{{ c.account.is_active ? 'Switch off' : 'Switch on' }}</button>
            </template>
          </div>
        </article>
      </div>
    </AsyncState>

    <Modal :open="modal" :title="editing ? 'Edit coach' : 'Add coach'" @close="modal = false">
      <form id="coach-form" class="grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="save">
        <FormField v-for="f in fields" :id="`coach-${f.key}`" :key="f.key" :label="f.label" :error="errors[f.key]" :optional="Boolean(f.optional)" :class="f.span ? 'sm:col-span-2' : ''">
          <template #default="{ id, describedby, invalid }"><input :id="id" v-model="form[f.key]" :type="f.type || 'text'" class="p-input" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
        </FormField>
        <FormField id="coach-role" label="Role" :error="errors.role">
          <template #default="{ id }"><select :id="id" v-model="form.role" class="p-select"><option value="head">Head coach</option><option value="assistant">Assistant coach</option><option value="manager">Team manager</option></select></template>
        </FormField>
        <FormField id="coach-team" label="Team" :error="errors.team_id" optional>
          <template #default="{ id }"><select :id="id" v-model="form.team_id" class="p-select"><option value="">No team</option><option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option></select></template>
        </FormField>
      </form>
      <template #footer>
        <BaseButton size="sm" variant="outline" @click="modal = false">Cancel</BaseButton>
        <BaseButton size="sm" type="submit" form="coach-form" :disabled="busy">{{ busy ? 'Saving…' : editing ? 'Save changes' : 'Add coach' }}</BaseButton>
      </template>
    </Modal>

    <Modal :open="Boolean(loginFor)" title="Create coach login" :subtitle="loginFor?.full_name" size="sm" @close="loginFor = null">
      <form id="coach-login" class="space-y-4" novalidate @submit.prevent="createLogin">
        <p class="text-sm text-ash">Coaches can add and edit athletes and register entries. They cannot delete teams or manage other coaches.</p>
        <FormField id="cl-email" label="Email" :error="loginErrors.email">
          <template #default="{ id, describedby, invalid }"><input :id="id" v-model="login.email" type="email" class="p-input" autocomplete="off" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
        </FormField>
        <FormField id="cl-password" label="Temporary password" :error="loginErrors.password" hint="At least 8 characters with letters and a number.">
          <template #default="{ id, describedby, invalid }"><input :id="id" v-model="login.password" type="password" class="p-input" autocomplete="new-password" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
        </FormField>
      </form>
      <template #footer>
        <BaseButton size="sm" variant="outline" @click="loginFor = null">Cancel</BaseButton>
        <BaseButton size="sm" type="submit" form="coach-login" :disabled="busy">Create login</BaseButton>
      </template>
    </Modal>
  </div>
</template>
