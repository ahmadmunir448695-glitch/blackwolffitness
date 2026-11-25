<script setup>
import { ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import DataTable from '../../components/DataTable.vue'
import Pager from '../../components/Pager.vue'
import SearchBox from '../../components/SearchBox.vue'
import { fmtDateTime, humanize } from '../../lib/format.js'
import { ROLE_LABELS } from '../../lib/session.js'
import { parseDetails, usePagedList } from './adminShared.js'

const { filters, data, loading } = usePagedList('/admin/audit', { q: '', entity: '', page: 1 })
const expanded = ref(null)

const columns = [
  { key: 'created_at', label: 'When' },
  { key: 'user', label: 'User' },
  { key: 'action', label: 'Action' },
  { key: 'entity', label: 'Record' },
  { key: 'details', label: 'Details' },
]
const entities = ['registration', 'event', 'payment', 'user', 'team', 'athlete', 'coach', 'club', 'document']
const pretty = (d) => {
  const v = parseDetails(d)
  return typeof v === 'string' ? v : JSON.stringify(v, null, 2)
}
</script>

<template>
  <div>
    <PageHeader eyebrow="Super Admin" title="Audit log" subtitle="Every important change: who did it, when, and from where." />
    <div class="mb-4 flex flex-col gap-2 sm:flex-row">
      <SearchBox v-model="filters.q" placeholder="Action, user or detail" label="Search audit log" />
      <label class="sm:w-52"><span class="sr-only">Record type</span>
        <select v-model="filters.entity" class="p-select"><option value="">All records</option><option v-for="e in entities" :key="e" :value="e">{{ humanize(e) }}</option></select>
      </label>
    </div>
    <DataTable :columns="columns" :rows="data.items" :loading="loading" caption="Audit log">
      <template #cell-created_at="{ row }"><span class="whitespace-nowrap">{{ fmtDateTime(row.created_at) }}</span><span v-if="row.ip" class="block text-xs text-smoke">{{ row.ip }}</span></template>
      <template #cell-user="{ row }"><span class="block text-bone">{{ row.user_name || 'System' }}</span><span class="text-xs text-smoke">{{ ROLE_LABELS[row.user_role] || '' }}</span></template>
      <template #cell-action="{ row }"><span class="font-semibold text-bone">{{ humanize(row.action) }}</span></template>
      <template #cell-entity="{ row }">{{ humanize(row.entity) }}<span v-if="row.entity_id" class="text-smoke"> #{{ row.entity_id }}</span></template>
      <template #cell-details="{ row }">
        <template v-if="row.details">
          <button type="button" class="p-link text-xs" :aria-expanded="expanded === row.id ? 'true' : 'false'" @click="expanded = expanded === row.id ? null : row.id">{{ expanded === row.id ? 'Hide' : 'Show' }}</button>
          <pre v-if="expanded === row.id" class="mt-2 max-w-md overflow-x-auto whitespace-pre-wrap bg-ink p-2 text-xs text-ash">{{ pretty(row.details) }}</pre>
        </template>
        <span v-else class="text-smoke">—</span>
      </template>
    </DataTable>
    <Pager v-model:page="filters.page" :pages="data.pages" :total="data.total" :page-size="data.pageSize" />
  </div>
</template>
