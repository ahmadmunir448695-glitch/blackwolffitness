<script setup>
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageHeader from '../../components/PageHeader.vue'
import DataTable from '../../components/DataTable.vue'
import Pager from '../../components/Pager.vue'
import SearchBox from '../../components/SearchBox.vue'
import { download } from '../../lib/api.js'
import { fmtDate, humanize } from '../../lib/format.js'
import { toast } from '../../lib/ui.js'
import { useAdminEvents, usePagedList } from './adminShared.js'

const router = useRouter()
const { events } = useAdminEvents()
const { filters, data, loading, sort, setSort } = usePagedList('/admin/athletes', { q: '', eventId: '', gender: '', page: 1, sort: 'name', dir: 'asc' })

const columns = [
  { key: 'name', label: 'Athlete', sortable: true },
  { key: 'dob', label: 'Born', sortable: true },
  { key: 'gender', label: 'Gender' },
  { key: 'belt', label: 'Belt / Dan', sortable: true },
  { key: 'weight', label: 'Weight', sortable: true },
  { key: 'club', label: 'Club / team', sortable: true },
  { key: 'id_number', label: 'ID number' },
  { key: 'entry_count', label: 'Entries', align: 'right' },
]

const exportCsv = () => download('/admin/reports/athletes.csv', { eventId: filters.eventId }, 'athletes.csv').catch(toast.error)
</script>

<template>
  <div>
    <PageHeader eyebrow="Administration" title="All athletes" subtitle="Athletes entered in your championships.">
      <template #actions>
        <BaseButton size="sm" variant="outline" icon="download" :disabled="!filters.eventId" @click="exportCsv">Export athlete list</BaseButton>
      </template>
    </PageHeader>
    <div class="mb-4 flex flex-col gap-2 lg:flex-row">
      <SearchBox v-model="filters.q" placeholder="Name, athlete ID, club, ID number" label="Search athletes" />
      <label class="lg:w-72"><span class="sr-only">Championship</span>
        <select v-model="filters.eventId" class="p-select"><option value="">All championships</option><option v-for="e in events" :key="e.id" :value="String(e.id)">{{ e.name }}</option></select>
      </label>
      <label class="lg:w-40"><span class="sr-only">Gender</span>
        <select v-model="filters.gender" class="p-select"><option value="">All genders</option><option value="male">Male</option><option value="female">Female</option></select>
      </label>
    </div>
    <DataTable :columns="columns" :rows="data.items" :loading="loading" :sort="sort" clickable caption="Athletes" @sort="setSort" @row-click="router.push(`/portal/athletes/${$event.id}`)">
      <template #cell-name="{ row }"><span class="block font-semibold text-bone">{{ row.full_name }}</span><span class="text-xs text-smoke">{{ row.code }}</span></template>
      <template #cell-dob="{ row }">{{ fmtDate(row.dob) }}</template>
      <template #cell-gender="{ row }">{{ humanize(row.gender) }}</template>
      <template #cell-belt="{ row }">{{ row.belt }}</template>
      <template #cell-weight="{ row }">{{ row.weight_kg ? `${row.weight_kg} kg` : '—' }}</template>
      <template #cell-club="{ row }">{{ row.club_name }}<span class="block text-xs text-smoke">{{ row.team_name || 'No team' }}</span></template>
      <template #cell-id_number="{ row }">{{ row.id_number || '—' }}</template>
      <template #empty><p class="px-6 py-10 text-center text-sm text-smoke">No athletes found.</p></template>
    </DataTable>
    <Pager v-model:page="filters.page" :pages="data.pages" :total="data.total" :page-size="data.pageSize" />
  </div>
</template>
