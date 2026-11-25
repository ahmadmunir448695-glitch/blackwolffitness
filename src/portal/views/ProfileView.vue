<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/forms/FormField.vue'
import PageHeader from '../components/PageHeader.vue'
import { http } from '../lib/api.js'
import { ROLE_LABELS, changePassword, isManager, logout, refreshUser, session } from '../lib/session.js'
import { applyFieldErrors, confirmDialog, toast } from '../lib/ui.js'

const router = useRouter()

const me = reactive({ name: session.user?.name ?? '', phone: session.user?.phone ?? '' })
const meErrors = reactive({ name: '', phone: '' })
const pw = reactive({ current_password: '', new_password: '' })
const pwErrors = reactive({ current_password: '', new_password: '' })
const club = reactive({ name: '', country: '', city: '', address: '', phone: '', email: '' })
const clubErrors = reactive({ name: '', country: '', city: '', address: '', phone: '', email: '' })
const busy = ref('')

onMounted(async () => {
  if (!isManager.value) return
  try {
    const d = await http.get('/club')
    for (const k of Object.keys(club)) club[k] = d.club[k] ?? ''
  } catch (err) {
    toast.error(err)
  }
})

async function run(key, fn, errors) {
  busy.value = key
  try {
    await fn()
    return true
  } catch (err) {
    if (!applyFieldErrors(errors, err)) toast.error(err)
    return false
  } finally {
    busy.value = ''
  }
}

const saveMe = () => run('me', async () => {
  await http.patch('/auth/me', { name: me.name, phone: me.phone || null })
  await refreshUser()
  toast.success('Profile saved.')
}, meErrors)

const savePw = () => run('pw', async () => {
  await changePassword({ ...pw })
  pw.current_password = ''
  pw.new_password = ''
  toast.success('Password changed. Other devices have been signed out.')
}, pwErrors)

const saveClub = () => run('club', async () => {
  await http.patch('/club', Object.fromEntries(Object.entries(club).map(([k, v]) => [k, v === '' ? null : v])))
  await refreshUser()
  toast.success('Club details saved.')
}, clubErrors)

async function signOutEverywhere() {
  if (!(await confirmDialog({ title: 'Sign out everywhere?', message: 'Every device signed in to this account, including this one, will be signed out.', confirmLabel: 'Sign out everywhere' }))) return
  await http.post('/auth/logout-all').catch(() => {})
  logout()
  router.replace('/portal/login')
}

const clubFields = [
  { key: 'name', label: 'Club / academy name', span: true },
  { key: 'country', label: 'Country' },
  { key: 'city', label: 'City' },
  { key: 'address', label: 'Address', span: true, optional: true },
  { key: 'phone', label: 'Phone', type: 'tel', optional: true },
  { key: 'email', label: 'Email', type: 'email', optional: true },
]
</script>

<template>
  <div>
    <PageHeader eyebrow="Account" title="Profile & Settings" :subtitle="`${ROLE_LABELS[session.user?.role] || ''} · ${session.user?.email || ''}`" />

    <div class="grid gap-6 xl:grid-cols-2">
      <section class="p-card p-6">
        <h2 class="mb-5 font-display text-2xl uppercase tracking-wide text-bone">Your profile</h2>
        <form class="space-y-4" novalidate @submit.prevent="saveMe">
          <FormField id="me-name" label="Full name" :error="meErrors.name">
            <template #default="{ id, describedby, invalid }"><input :id="id" v-model="me.name" class="p-input" autocomplete="name" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
          </FormField>
          <FormField id="me-phone" label="Phone" :error="meErrors.phone" optional>
            <template #default="{ id, describedby, invalid }"><input :id="id" v-model="me.phone" type="tel" class="p-input" autocomplete="tel" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
          </FormField>
          <p class="text-sm text-smoke">Email: <span class="text-ash">{{ session.user?.email }}</span></p>
          <BaseButton type="submit" size="sm" :disabled="busy === 'me'">Save profile</BaseButton>
        </form>
      </section>

      <section class="p-card p-6">
        <h2 class="mb-5 font-display text-2xl uppercase tracking-wide text-bone">Password</h2>
        <form class="space-y-4" novalidate @submit.prevent="savePw">
          <FormField id="pw-current" label="Current password" :error="pwErrors.current_password">
            <template #default="{ id, describedby, invalid }"><input :id="id" v-model="pw.current_password" type="password" class="p-input" autocomplete="current-password" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
          </FormField>
          <FormField id="pw-new" label="New password" :error="pwErrors.new_password" hint="At least 8 characters with letters and a number.">
            <template #default="{ id, describedby, invalid }"><input :id="id" v-model="pw.new_password" type="password" class="p-input" autocomplete="new-password" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
          </FormField>
          <div class="flex flex-wrap items-center gap-4">
            <BaseButton type="submit" size="sm" :disabled="busy === 'pw' || !pw.current_password || !pw.new_password">Change password</BaseButton>
            <button type="button" class="text-sm text-smoke hover:text-danger" @click="signOutEverywhere">Sign out everywhere</button>
          </div>
        </form>
      </section>

      <section v-if="isManager" class="p-card p-6 xl:col-span-2">
        <h2 class="mb-5 font-display text-2xl uppercase tracking-wide text-bone">Club details</h2>
        <form class="grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="saveClub">
          <FormField v-for="f in clubFields" :id="`club-${f.key}`" :key="f.key" :label="f.label" :error="clubErrors[f.key]" :optional="Boolean(f.optional)" :class="f.span ? 'sm:col-span-2' : ''">
            <template #default="{ id, describedby, invalid }"><input :id="id" v-model="club[f.key]" :type="f.type || 'text'" class="p-input" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
          </FormField>
          <div class="sm:col-span-2"><BaseButton type="submit" size="sm" :disabled="busy === 'club'">Save club details</BaseButton></div>
        </form>
      </section>
    </div>
  </div>
</template>
