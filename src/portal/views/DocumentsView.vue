<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAsync } from '@/composables/useAsync.js'
import AppIcon from '@/components/ui/AppIcon.vue'
import PageHeader from '../components/PageHeader.vue'
import DataTable from '../components/DataTable.vue'
import SearchBox from '../components/SearchBox.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { download, http, openFile } from '../lib/api.js'
import { DOC_KINDS, fmtDateTime, fmtSize } from '../lib/format.js'
import { isClubUser } from '../lib/session.js'
import { confirmDialog, toast } from '../lib/ui.js'

const kind = ref('')
const q = ref('')
const tab = ref('documents')

const docs = useAsync(({ signal }) => http.get('/documents', { kind: kind.value }, { signal }).then((d) => d.items), { watch: () => kind.value, initial: [] })
const entries = useAsync(({ signal }) => http.get('/registrations', { pageSize: 100 }, { signal }).then((d) => d.items.filter((e) => e.status !== 'draft')), { initial: [] })

const filtered = computed(() => {
  const t = q.value.toLowerCase()
  return docs.data.value.filter((d) => !t || [d.original_name, d.athlete_name, d.registration_code].some((v) => String(v ?? '').toLowerCase().includes(t)))
})

const columns = [
  { key: 'kind', label: 'Type' },
  { key: 'original_name', label: 'File' },
  { key: 'owner', label: 'Athlete / entry' },
  { key: 'created_at', label: 'Uploaded' },
  { key: 'actions', label: '', align: 'right' },
]
const entryColumns = [
  { key: 'code', label: 'Registration ID' },
  { key: 'athlete_names', label: 'Athlete' },
  { key: 'event_name', label: 'Championship' },
  { key: 'status', label: 'Status' },
  { key: 'pdf', label: '', align: 'right' },
]

const view = (d) => openFile(`/documents/${d.id}/download`).catch(toast.error)
const save = (d) => download(`/documents/${d.id}/download`, null, d.original_name).catch(toast.error)
const pdf = (e) => download(`/registrations/${e.id}/confirmation.pdf`, null, `registration-${e.code}.pdf`).catch(toast.error)
async function remove(d) {
  if (!(await confirmDialog({ title: 'Delete document?', message: d.original_name, confirmLabel: 'Delete', danger: true }))) return
  try {
    await http.del(`/documents/${d.id}`)
    toast.success('Document deleted.')
    docs.reload()
  } catch (err) {
    toast.error(err)
  }
}
</script>

<template>
  <div>
    <PageHeader eyebrow="Library" title="Certificates & Documents" subtitle="Athlete documents, payment receipts and registration confirmations in one place." />

    <div class="p-tabs mb-5" role="tablist">
      <button type="button" role="tab" class="p-tab" :aria-selected="tab === 'documents' ? 'true' : 'false'" @click="tab = 'documents'">Uploaded documents</button>
      <button type="button" role="tab" class="p-tab" :aria-selected="tab === 'confirmations' ? 'true' : 'false'" @click="tab = 'confirmations'">Registration confirmations</button>
    </div>

    <template v-if="tab === 'documents'">
      <div class="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchBox v-model="q" placeholder="File, athlete or registration" label="Search documents" />
        <label class="sm:w-56"><span class="sr-only">Type</span>
          <select v-model="kind" class="p-select"><option value="">All types</option><option v-for="(l, k) in DOC_KINDS" :key="k" :value="k">{{ l }}</option></select>
        </label>
      </div>
      <p v-if="docs.error.value" role="alert" class="mb-4 text-sm text-danger">{{ docs.error.value.message }}</p>
      <DataTable :columns="columns" :rows="filtered" :loading="docs.loading.value" caption="Documents">
        <template #cell-kind="{ row }"><span class="font-semibold text-bone">{{ DOC_KINDS[row.kind] }}</span></template>
        <template #cell-original_name="{ row }">{{ row.original_name }}<span class="block text-xs text-smoke">{{ fmtSize(row.size) }}</span></template>
        <template #cell-owner="{ row }">
          <RouterLink v-if="row.athlete_id && isClubUser" :to="`/portal/athletes/${row.athlete_id}`" class="p-link">{{ row.athlete_name }}</RouterLink>
          <span v-else-if="row.athlete_name">{{ row.athlete_name }}</span>
          <RouterLink v-else-if="row.registration_id" :to="`/portal/entries/${row.registration_id}`" class="p-link">{{ row.registration_code }}</RouterLink>
          <span v-else>—</span>
        </template>
        <template #cell-created_at="{ row }">{{ fmtDateTime(row.created_at) }}</template>
        <template #cell-actions="{ row }">
          <div class="flex justify-end gap-1.5">
            <button type="button" class="p-icon-btn" :aria-label="`View ${row.original_name}`" @click="view(row)"><AppIcon name="eye" class="h-4 w-4" /></button>
            <button type="button" class="p-icon-btn" :aria-label="`Download ${row.original_name}`" @click="save(row)"><AppIcon name="download" class="h-4 w-4" /></button>
            <button v-if="isClubUser" type="button" class="p-icon-btn is-danger" :aria-label="`Delete ${row.original_name}`" @click="remove(row)"><AppIcon name="trash" class="h-4 w-4" /></button>
          </div>
        </template>
        <template #empty><p class="px-6 py-10 text-center text-sm text-smoke">No documents yet. Upload them from an athlete’s page or during registration.</p></template>
      </DataTable>
    </template>

    <DataTable v-else :columns="entryColumns" :rows="entries.data.value" :loading="entries.loading.value" caption="Registration confirmations">
      <template #cell-code="{ row }"><RouterLink :to="`/portal/entries/${row.id}`" class="font-mono font-semibold text-bone hover:text-ember">{{ row.code }}</RouterLink></template>
      <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #cell-pdf="{ row }">
        <button type="button" class="inline-flex items-center gap-1.5 border border-line px-3 py-1.5 text-xs font-semibold text-ash hover:border-ember hover:text-ember" @click="pdf(row)"><AppIcon name="download" class="h-4 w-4" /> PDF</button>
      </template>
      <template #empty><p class="px-6 py-10 text-center text-sm text-smoke">Confirmations appear after you submit entries.</p></template>
    </DataTable>
  </div>
</template>
