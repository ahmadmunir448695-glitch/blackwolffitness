<script setup>
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAsync } from '@/composables/useAsync.js'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageHeader from '../components/PageHeader.vue'
import DataTable from '../components/DataTable.vue'
import Pager from '../components/Pager.vue'
import SearchBox from '../components/SearchBox.vue'
import AthleteFormModal from '../components/AthleteFormModal.vue'
import AuthImage from '../components/AuthImage.vue'
import { http } from '../lib/api.js'
import { fmtDate, humanize } from '../lib/format.js'
import { isManager } from '../lib/session.js'
import { confirmDialog, toast } from '../lib/ui.js'

const router = useRouter()
const filters = reactive({ q: '', teamId: '', gender: '', page: 1 })
const sort = ref({ key: 'name', dir: 'asc' })
const teams = ref([])
http.get('/teams').then((d) => (teams.value = d.items)).catch(() => {})

const { data, loading, error, reload } = useAsync(
  ({ signal }) => http.get('/athletes', { ...filters, sort: sort.value.key, dir: sort.value.dir, pageSize: 25 }, { signal }),
  { watch: () => [filters.q, filters.teamId, filters.gender, filters.page, sort.value] },
)
watch(() => [filters.q, filters.teamId, filters.gender], () => (filters.page = 1))

const columns = [
  { key: 'name', label: 'Athlete', sortable: true },
  { key: 'dob', label: 'Born', sortable: true },
  { key: 'gender', label: 'Gender' },
  { key: 'belt', label: 'Belt / Dan', sortable: true },
  { key: 'weight', label: 'Weight', sortable: true },
  { key: 'team_name', label: 'Team' },
  { key: 'docs', label: 'Documents' },
  { key: 'active_entries', label: 'Entries' },
  { key: 'actions', label: '', align: 'right' },
]

const modal = ref(false)
const editing = ref(null)
function open(a = null) {
  editing.value = a
  modal.value = true
}
function saved() {
  modal.value = false
  reload()
}

async function remove(a) {
  if (!(await confirmDialog({ title: `Delete ${a.full_name}?`, message: 'This removes the athlete, their photo and documents permanently. Athletes with championship entries cannot be deleted.', confirmLabel: 'Delete athlete', danger: true }))) return
  try {
    await http.del(`/athletes/${a.id}`)
    toast.success(`${a.full_name} deleted.`)
    reload()
  } catch (err) {
    toast.error(err)
  }
}

const has = (row, kind) => (row.document_kinds || '').split(',').includes(kind)
</script>

<template>
  <div>
    <PageHeader eyebrow="Athletes" title="Athletes" subtitle="Everyone in your club. Keep weight, belt and documents current before you register.">
      <template #actions>
        <BaseButton icon="plus" size="sm" @click="open()">Add athlete</BaseButton>
      </template>
    </PageHeader>

    <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <SearchBox v-model="filters.q" placeholder="Name, athlete ID or ID number" label="Search athletes" />
      <label class="sm:w-48"><span class="sr-only">Team</span>
        <select v-model="filters.teamId" class="p-select"><option value="">All teams</option><option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option></select>
      </label>
      <label class="sm:w-40"><span class="sr-only">Gender</span>
        <select v-model="filters.gender" class="p-select"><option value="">All genders</option><option value="male">Male</option><option value="female">Female</option></select>
      </label>
    </div>

    <p v-if="error" role="alert" class="mb-4 border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger">{{ error.message }} <button type="button" class="ml-2 underline" @click="reload">Try again</button></p>

    <DataTable :columns="columns" :rows="data?.items ?? []" :sort="sort" :loading="loading" clickable caption="Athletes" @sort="sort = $event" @row-click="router.push(`/portal/athletes/${$event.id}`)">
      <template #cell-name="{ row }">
        <span class="flex items-center gap-3">
          <AuthImage :src="row.has_photo ? `/athletes/${row.id}/photo` : ''" :name="row.full_name" size-class="h-10 w-10" />
          <span><span class="block font-semibold text-bone">{{ row.full_name }}</span><span class="text-xs text-smoke">{{ row.code }}</span></span>
        </span>
      </template>
      <template #cell-dob="{ row }">{{ fmtDate(row.dob) }}</template>
      <template #cell-gender="{ row }">{{ humanize(row.gender) }}</template>
      <template #cell-belt="{ row }">{{ row.belt }}</template>
      <template #cell-weight="{ row }">{{ row.weight_kg ? `${row.weight_kg} kg` : '—' }}</template>
      <template #cell-team_name="{ row }">{{ row.team_name || '—' }}</template>
      <template #cell-docs="{ row }">
        <span class="flex gap-1.5 text-xs">
          <span :class="row.has_photo ? 'text-success' : 'text-smoke'" :title="row.has_photo ? 'Photo uploaded' : 'No photo'">Photo</span>
          <span :class="has(row, 'id_document') ? 'text-success' : 'text-smoke'">ID</span>
          <span :class="has(row, 'medical') ? 'text-success' : 'text-smoke'">Medical</span>
        </span>
      </template>
      <template #cell-actions="{ row }">
        <div class="flex justify-end gap-1.5" @click.stop>
          <button type="button" class="p-icon-btn" :aria-label="`Edit ${row.full_name}`" @click="open(row)"><AppIcon name="edit" class="h-4 w-4" /></button>
          <button v-if="isManager" type="button" class="p-icon-btn is-danger" :aria-label="`Delete ${row.full_name}`" @click="remove(row)"><AppIcon name="trash" class="h-4 w-4" /></button>
        </div>
      </template>
      <template #empty>
        <div class="px-6 py-10 text-center">
          <p class="text-sm text-smoke">{{ filters.q || filters.teamId || filters.gender ? 'No athletes match these filters.' : 'No athletes yet.' }}</p>
          <BaseButton v-if="!filters.q" class="mt-4" size="sm" icon="plus" @click="open()">Add athlete</BaseButton>
        </div>
      </template>
    </DataTable>
    <Pager v-if="data" v-model:page="filters.page" :pages="data.pages" :total="data.total" :page-size="data.pageSize" />

    <AthleteFormModal :open="modal" :athlete="editing" @close="modal = false" @saved="saved" />
  </div>
</template>
