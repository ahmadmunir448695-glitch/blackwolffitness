<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'
import PageHeader from '../../components/PageHeader.vue'
import DataTable from '../../components/DataTable.vue'
import Pager from '../../components/Pager.vue'
import SearchBox from '../../components/SearchBox.vue'
import { download } from '../../lib/api.js'
import { toast } from '../../lib/ui.js'
import { useAdminEvents, usePagedList } from './adminShared.js'

const { events } = useAdminEvents()
const { filters, data, loading, sort, setSort } = usePagedList('/admin/teams', { q: '', eventId: '', page: 1, sort: 'name', dir: 'asc' })

const columns = [
  { key: 'code', label: 'Team ID' },
  { key: 'name', label: 'Team', sortable: true },
  { key: 'club', label: 'Club / academy', sortable: true },
  { key: 'city', label: 'Location', sortable: true },
  { key: 'coach', label: 'Head coach' },
  { key: 'athlete_count', label: 'Athletes', align: 'right' },
  { key: 'entry_count', label: 'Entries', align: 'right' },
  { key: 'status', label: 'Status' },
]

const exportCsv = () => download('/admin/reports/teams.csv', { eventId: filters.eventId }, 'teams.csv').catch(toast.error)
</script>

<template>
  <div>
    <PageHeader eyebrow="Administration" title="Participating teams" subtitle="Teams with entries in your championships.">
      <template #actions>
        <BaseButton size="sm" variant="outline" icon="download" :disabled="!filters.eventId" :title="filters.eventId ? '' : 'Choose a championship to export'" @click="exportCsv">Export CSV</BaseButton>
      </template>
    </PageHeader>
    <div class="mb-4 flex flex-col gap-2 lg:flex-row">
      <SearchBox v-model="filters.q" placeholder="Team, ID, club or city" label="Search teams" />
      <label class="lg:w-72"><span class="sr-only">Championship</span>
        <select v-model="filters.eventId" class="p-select"><option value="">All championships</option><option v-for="e in events" :key="e.id" :value="String(e.id)">{{ e.name }}</option></select>
      </label>
    </div>
    <DataTable :columns="columns" :rows="data.items" :loading="loading" :sort="sort" caption="Teams" @sort="setSort">
      <template #cell-code="{ row }"><span class="font-mono text-bone">{{ row.code }}</span></template>
      <template #cell-name="{ row }"><span class="font-semibold text-bone">{{ row.name }}</span></template>
      <template #cell-club="{ row }">{{ row.club_name }}</template>
      <template #cell-city="{ row }">{{ row.city }}, {{ row.country }}</template>
      <template #cell-coach="{ row }">{{ row.head_coach_name || '—' }}<span class="block text-xs text-smoke">{{ [row.coach_phone, row.coach_email].filter(Boolean).join(' · ') }}</span></template>
      <template #cell-status="{ row }"><span class="p-badge" :class="row.status === 'active' ? 'tone-success' : 'tone-muted'">{{ row.status }}</span></template>
      <template #empty><p class="px-6 py-10 text-center text-sm text-smoke">No teams found.</p></template>
    </DataTable>
    <Pager v-model:page="filters.page" :pages="data.pages" :total="data.total" :page-size="data.pageSize" />
  </div>
</template>
