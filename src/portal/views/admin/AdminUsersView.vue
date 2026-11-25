<script setup>
import { reactive, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/forms/FormField.vue'
import PageHeader from '../../components/PageHeader.vue'
import DataTable from '../../components/DataTable.vue'
import Pager from '../../components/Pager.vue'
import SearchBox from '../../components/SearchBox.vue'
import Modal from '../../components/Modal.vue'
import { http } from '../../lib/api.js'
import { fmtDateTime } from '../../lib/format.js'
import { ROLE_LABELS, session } from '../../lib/session.js'
import { applyFieldErrors, confirmDialog, toast } from '../../lib/ui.js'
import { useAdminEvents, usePagedList } from './adminShared.js'

const { events } = useAdminEvents()
const { filters, data, loading, load } = usePagedList('/admin/users', { q: '', role: '', page: 1 })

const columns = [
  { key: 'name', label: 'User' },
  { key: 'role', label: 'Role' },
  { key: 'club_name', label: 'Club' },
  { key: 'last_login_at', label: 'Last sign-in' },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: '', align: 'right' },
]

const modal = ref(false)
const form = reactive({ name: '', email: '', phone: '', password: '', role: 'organizer', event_ids: [] })
const errors = reactive({ name: '', email: '', phone: '', password: '', role: '', event_ids: '' })
const busy = ref(false)

function openCreate() {
  Object.assign(form, { name: '', email: '', phone: '', password: '', role: 'organizer', event_ids: [] })
  applyFieldErrors(errors, null)
  modal.value = true
}
async function create() {
  busy.value = true
  try {
    await http.post('/admin/users', { ...form, phone: form.phone || null })
    toast.success('User created. Share the password with them privately.')
    modal.value = false
    load()
  } catch (err) {
    if (!applyFieldErrors(errors, err)) toast.error(err)
  } finally {
    busy.value = false
  }
}

async function toggleActive(u) {
  const off = u.is_active
  if (!(await confirmDialog({ title: `${off ? 'Deactivate' : 'Activate'} ${u.name}?`, message: off ? 'They are signed out and cannot sign in until reactivated.' : '', confirmLabel: off ? 'Deactivate' : 'Activate', danger: off }))) return
  try {
    await http.patch(`/admin/users/${u.id}`, { is_active: !off })
    toast.success(off ? 'User deactivated.' : 'User activated.')
    load()
  } catch (err) {
    toast.error(err)
  }
}
async function resetPassword(u) {
  const pw = await confirmDialog({ title: `Reset password for ${u.name}`, message: 'At least 8 characters with letters and a number. All their sessions are signed out.', confirmLabel: 'Set password', input: { label: 'New password', required: true } })
  if (!pw) return
  try {
    await http.patch(`/admin/users/${u.id}`, { password: pw })
    toast.success('Password reset.')
  } catch (err) {
    toast.error(err.fields?.password || err)
  }
}
</script>

<template>
  <div>
    <PageHeader eyebrow="Super Admin" title="Users" subtitle="Every account in the portal. Create organizer accounts and assign them to championships.">
      <template #actions><BaseButton size="sm" icon="plus" @click="openCreate">New organizer / admin</BaseButton></template>
    </PageHeader>
    <div class="mb-4 flex flex-col gap-2 sm:flex-row">
      <SearchBox v-model="filters.q" placeholder="Name or email" label="Search users" />
      <label class="sm:w-52"><span class="sr-only">Role</span>
        <select v-model="filters.role" class="p-select"><option value="">All roles</option><option v-for="(l, k) in ROLE_LABELS" :key="k" :value="k">{{ l }}</option></select>
      </label>
    </div>
    <DataTable :columns="columns" :rows="data.items" :loading="loading" caption="Users">
      <template #cell-name="{ row }"><span class="block font-semibold text-bone">{{ row.name }}</span><span class="text-xs text-smoke">{{ row.email }}</span></template>
      <template #cell-role="{ row }">{{ ROLE_LABELS[row.role] }}</template>
      <template #cell-club_name="{ row }">{{ row.club_name || '—' }}</template>
      <template #cell-last_login_at="{ row }">{{ row.last_login_at ? fmtDateTime(row.last_login_at) : 'Never' }}</template>
      <template #cell-is_active="{ row }"><span class="p-badge" :class="row.is_active ? 'tone-success' : 'tone-muted'">{{ row.is_active ? 'Active' : 'Inactive' }}</span></template>
      <template #cell-actions="{ row }">
        <div v-if="row.id !== session.user?.id" class="flex justify-end gap-1.5">
          <button type="button" class="p-icon-btn" :aria-label="`Reset password for ${row.name}`" title="Reset password" @click="resetPassword(row)"><AppIcon name="shield" class="h-4 w-4" /></button>
          <button type="button" class="p-icon-btn" :class="row.is_active ? 'is-danger' : ''" :aria-label="`${row.is_active ? 'Deactivate' : 'Activate'} ${row.name}`" @click="toggleActive(row)"><AppIcon :name="row.is_active ? 'close' : 'check'" class="h-4 w-4" /></button>
        </div>
      </template>
    </DataTable>
    <Pager v-model:page="filters.page" :pages="data.pages" :total="data.total" :page-size="data.pageSize" />

    <Modal :open="modal" title="New organizer or admin" @close="modal = false">
      <form id="user-form" class="grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="create">
        <FormField id="u-name" label="Full name" :error="errors.name" class="sm:col-span-2">
          <template #default="{ id, describedby, invalid }"><input :id="id" v-model="form.name" class="p-input" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
        </FormField>
        <FormField id="u-email" label="Email" :error="errors.email">
          <template #default="{ id, describedby, invalid }"><input :id="id" v-model="form.email" type="email" class="p-input" autocomplete="off" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
        </FormField>
        <FormField id="u-phone" label="Phone" :error="errors.phone" optional>
          <template #default="{ id, describedby, invalid }"><input :id="id" v-model="form.phone" type="tel" class="p-input" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
        </FormField>
        <FormField id="u-password" label="Temporary password" :error="errors.password" hint="8+ characters, letters and a number.">
          <template #default="{ id, describedby, invalid }"><input :id="id" v-model="form.password" type="password" class="p-input" autocomplete="new-password" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
        </FormField>
        <FormField id="u-role" label="Role" :error="errors.role">
          <template #default="{ id }"><select :id="id" v-model="form.role" class="p-select"><option value="organizer">Event Organizer</option><option value="super_admin">Super Admin</option></select></template>
        </FormField>
        <fieldset v-if="form.role === 'organizer'" class="sm:col-span-2">
          <legend class="p-label">Championships they can manage</legend>
          <div class="grid max-h-48 gap-1.5 overflow-y-auto sm:grid-cols-2">
            <label v-for="e in events" :key="e.id" class="flex items-center gap-2 border border-line px-3 py-2 text-sm text-ash"><input v-model="form.event_ids" type="checkbox" :value="e.id" class="p-check" /> {{ e.name }}</label>
          </div>
          <p class="mt-1 text-xs text-smoke">Organizers also manage every championship they create themselves.</p>
        </fieldset>
      </form>
      <template #footer>
        <BaseButton size="sm" variant="outline" @click="modal = false">Cancel</BaseButton>
        <BaseButton size="sm" type="submit" form="user-form" :disabled="busy">{{ busy ? 'Creating…' : 'Create user' }}</BaseButton>
      </template>
    </Modal>
  </div>
</template>
