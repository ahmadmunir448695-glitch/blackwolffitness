<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAsync } from '@/composables/useAsync.js'
import AsyncState from '@/components/ui/AsyncState.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/forms/FormField.vue'
import PageHeader from '../components/PageHeader.vue'
import AuthImage from '../components/AuthImage.vue'
import FileDrop from '../components/FileDrop.vue'
import Modal from '../components/Modal.vue'
import StatusBadge from '../components/StatusBadge.vue'
import AthleteFormModal from '../components/AthleteFormModal.vue'
import { download, http, openFile } from '../lib/api.js'
import { DOC_KINDS, fmtDate, fmtDateTime, fmtSize, humanize } from '../lib/format.js'
import { isAdmin, isClubUser, isManager } from '../lib/session.js'
import { applyFieldErrors, confirmDialog, toast } from '../lib/ui.js'

const route = useRoute()
const router = useRouter()
const { data, loading, error, reload } = useAsync(({ signal }) => http.get(`/athletes/${route.params.id}`, null, { signal }), { watch: () => route.params.id })

const a = computed(() => data.value?.athlete)
const canEdit = computed(() => isClubUser.value)
const photoVersion = ref(0)
const photoBusy = ref(false)
const docKind = ref('id_document')
const docBusy = ref(false)
const editing = ref(false)

const back = computed(() => (isAdmin.value ? '/portal/admin/athletes' : '/portal/athletes'))

async function uploadPhoto(file) {
  photoBusy.value = true
  try {
    await http.upload(`/athletes/${a.value.id}/photo`, file)
    photoVersion.value++
    toast.success('Photo updated.')
    reload()
  } catch (err) {
    toast.error(err)
  } finally {
    photoBusy.value = false
  }
}

async function uploadDoc(file) {
  docBusy.value = true
  try {
    await http.upload(`/athletes/${a.value.id}/documents`, file, { fields: { kind: docKind.value } })
    toast.success(`${DOC_KINDS[docKind.value]} uploaded.`)
    reload()
  } catch (err) {
    toast.error(err)
  } finally {
    docBusy.value = false
  }
}

async function removeDoc(doc) {
  if (!(await confirmDialog({ title: 'Delete document?', message: doc.original_name, confirmLabel: 'Delete', danger: true }))) return
  try {
    await http.del(`/documents/${doc.id}`)
    toast.success('Document deleted.')
    reload()
  } catch (err) {
    toast.error(err)
  }
}

const view = (doc) => openFile(`/documents/${doc.id}/download`).catch(toast.error)
const save = (doc) => download(`/documents/${doc.id}/download`, null, doc.original_name).catch(toast.error)

async function removeAthlete() {
  if (!(await confirmDialog({ title: `Delete ${a.value.full_name}?`, message: 'This removes the athlete, photo and documents permanently.', confirmLabel: 'Delete athlete', danger: true }))) return
  try {
    await http.del(`/athletes/${a.value.id}`)
    toast.success('Athlete deleted.')
    router.replace('/portal/athletes')
  } catch (err) {
    toast.error(err)
  }
}

// Athlete login
const accountOpen = ref(false)
const account = reactive({ email: '', password: '' })
const accountErrors = reactive({ email: '', password: '' })
const accountBusy = ref(false)
async function createAccount() {
  accountBusy.value = true
  try {
    await http.post(`/athletes/${a.value.id}/account`, account)
    toast.success('Athlete login created. Share the email and password with the athlete privately.')
    accountOpen.value = false
    reload()
  } catch (err) {
    if (!applyFieldErrors(accountErrors, err)) toast.error(err)
  } finally {
    accountBusy.value = false
  }
}

const kinds = computed(() => new Set((data.value?.documents ?? []).map((d) => d.kind)))
</script>

<template>
  <AsyncState :loading="loading" :error="error" error-title="This athlete could not load" @retry="reload">
    <template #loading><div class="skeleton mb-6 h-40" /><div class="skeleton h-80" /></template>
    <div v-if="a">
      <PageHeader :eyebrow="a.code" :title="a.full_name" :back="back" back-label="Athletes">
        <template v-if="canEdit" #actions>
          <BaseButton size="sm" variant="outline" icon="edit" @click="editing = true">Edit details</BaseButton>
          <BaseButton size="sm" icon="clipboard" :to="`/portal/register?athlete=${a.id}${a.team_id ? `&team=${a.team_id}` : ''}`">Register</BaseButton>
        </template>
      </PageHeader>

      <div class="grid gap-6 xl:grid-cols-[22rem_1fr]">
        <aside class="space-y-6">
          <section class="p-card p-5">
            <AuthImage :src="a.has_photo ? `/athletes/${a.id}/photo` : ''" :name="a.full_name" :version="photoVersion" size-class="mb-4 aspect-square w-full max-w-[12rem]" />
            <FileDrop v-if="canEdit" accept="image/jpeg,image/png,image/webp" :label="a.has_photo ? 'Replace photo' : 'Upload photo'" :busy="photoBusy" compact @select="uploadPhoto" />
            <dl class="p-dl mt-5">
              <dt>Father name</dt><dd>{{ a.father_name || '—' }}</dd>
              <dt>Date of birth</dt><dd>{{ fmtDate(a.dob) }}</dd>
              <dt>Gender</dt><dd>{{ humanize(a.gender) }}</dd>
              <dt>Nationality</dt><dd>{{ a.nationality }}</dd>
              <dt>ID / Passport</dt><dd>{{ a.id_number || '—' }}</dd>
              <dt>Belt / Dan</dt><dd>{{ a.belt }}</dd>
              <dt>Weight</dt><dd>{{ a.weight_kg ? `${a.weight_kg} kg` : '—' }}</dd>
              <dt>Height</dt><dd>{{ a.height_cm ? `${a.height_cm} cm` : '—' }}</dd>
            </dl>
          </section>

          <section v-if="isManager" class="p-card p-5">
            <h2 class="mb-2 font-display text-xl uppercase tracking-wide text-bone">Athlete login</h2>
            <p v-if="data.account" class="text-sm text-ash">Signed up as <span class="text-bone">{{ data.account.email }}</span>. The athlete can see their own entries and documents.</p>
            <template v-else>
              <p class="text-sm text-ash">Optional: give the athlete a read-only login to follow their entries.</p>
              <BaseButton class="mt-3" size="sm" variant="outline" @click="accountOpen = true">Create athlete login</BaseButton>
            </template>
          </section>

          <button v-if="isManager" type="button" class="flex items-center gap-2 text-sm text-smoke hover:text-danger" @click="removeAthlete"><AppIcon name="trash" class="h-4 w-4" /> Delete athlete</button>
        </aside>

        <div class="space-y-6">
          <section class="p-card">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
              <h2 class="font-display text-2xl uppercase tracking-wide text-bone">Documents</h2>
              <div class="flex gap-2 text-xs">
                <span class="p-chip" :class="a.has_photo ? 'text-success' : ''">Photo {{ a.has_photo ? '✓' : '—' }}</span>
                <span class="p-chip" :class="kinds.has('id_document') ? 'text-success' : ''">ID {{ kinds.has('id_document') ? '✓' : '—' }}</span>
                <span class="p-chip" :class="kinds.has('medical') ? 'text-success' : ''">Medical {{ kinds.has('medical') ? '✓' : '—' }}</span>
              </div>
            </div>
            <div v-if="canEdit" class="grid gap-3 border-b border-line p-5 sm:grid-cols-[14rem_1fr] sm:items-start">
              <label>
                <span class="p-label">Document type</span>
                <select v-model="docKind" class="p-select">
                  <option value="id_document">ID / Passport</option>
                  <option value="medical">Medical certificate</option>
                  <option value="certificate">Belt / dan certificate</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <div><span class="p-label">File</span><FileDrop :busy="docBusy" label="Upload document" compact @select="uploadDoc" /></div>
            </div>
            <ul class="divide-y divide-line">
              <li v-for="d in data.documents" :key="d.id" class="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="min-w-0">
                  <p class="truncate font-semibold text-bone">{{ DOC_KINDS[d.kind] }}</p>
                  <p class="truncate text-sm text-smoke">{{ d.original_name }} · {{ fmtSize(d.size) }} · {{ fmtDateTime(d.created_at) }}</p>
                </div>
                <div class="flex gap-1.5">
                  <button type="button" class="p-icon-btn" :aria-label="`View ${d.original_name}`" @click="view(d)"><AppIcon name="eye" class="h-4 w-4" /></button>
                  <button type="button" class="p-icon-btn" :aria-label="`Download ${d.original_name}`" @click="save(d)"><AppIcon name="download" class="h-4 w-4" /></button>
                  <button v-if="canEdit" type="button" class="p-icon-btn is-danger" :aria-label="`Delete ${d.original_name}`" @click="removeDoc(d)"><AppIcon name="trash" class="h-4 w-4" /></button>
                </div>
              </li>
              <li v-if="!data.documents.length" class="px-5 py-6 text-sm text-smoke">No documents uploaded yet.</li>
            </ul>
          </section>

          <section class="p-card">
            <h2 class="border-b border-line px-5 py-4 font-display text-2xl uppercase tracking-wide text-bone">Championship entries</h2>
            <ul class="divide-y divide-line">
              <li v-for="e in data.entries" :key="e.id">
                <RouterLink :to="isAdmin ? `/portal/admin/registrations/${e.id}` : `/portal/entries/${e.id}`" class="flex flex-col gap-2 px-5 py-3 hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
                  <span><span class="block font-semibold text-bone">{{ e.event_name }}</span><span class="text-sm text-smoke">{{ e.code }} · {{ e.category_name }}<template v-if="e.weight_name"> · {{ e.weight_name }}</template></span></span>
                  <StatusBadge :value="e.status" />
                </RouterLink>
              </li>
              <li v-if="!data.entries.length" class="px-5 py-6 text-sm text-smoke">Not entered in any championship yet.</li>
            </ul>
          </section>
        </div>
      </div>

      <AthleteFormModal :open="editing" :athlete="a" @close="editing = false" @saved="editing = false; reload()" />

      <Modal :open="accountOpen" title="Create athlete login" :subtitle="a.full_name" size="sm" @close="accountOpen = false">
        <form id="account-form" class="space-y-4" novalidate @submit.prevent="createAccount">
          <FormField id="acc-email" label="Athlete email" :error="accountErrors.email">
            <template #default="{ id, describedby, invalid }"><input :id="id" v-model="account.email" type="email" class="p-input" autocomplete="off" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
          </FormField>
          <FormField id="acc-password" label="Temporary password" :error="accountErrors.password" hint="At least 8 characters with letters and a number. The athlete can change it after signing in.">
            <template #default="{ id, describedby, invalid }"><input :id="id" v-model="account.password" type="password" class="p-input" autocomplete="new-password" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
          </FormField>
        </form>
        <template #footer>
          <BaseButton size="sm" variant="outline" @click="accountOpen = false">Cancel</BaseButton>
          <BaseButton size="sm" type="submit" form="account-form" :disabled="accountBusy">{{ accountBusy ? 'Creating…' : 'Create login' }}</BaseButton>
        </template>
      </Modal>
    </div>
  </AsyncState>
</template>
