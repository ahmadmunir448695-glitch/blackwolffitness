<script setup>
import { ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageHeader from '../../components/PageHeader.vue'
import DataTable from '../../components/DataTable.vue'
import Pager from '../../components/Pager.vue'
import SearchBox from '../../components/SearchBox.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import EmptyState from '../../components/EmptyState.vue'
import { download, http } from '../../lib/api.js'
import { DISCIPLINE_LABELS, ENTRY_STATUS, PAYMENT_STATUS, fmtDateTime, fmtMoney } from '../../lib/format.js'
import { confirmDialog, toast } from '../../lib/ui.js'
import { useAdminEvents, usePagedList } from './adminShared.js'

const router = useRouter()
const { events } = useAdminEvents()
const list = usePagedList('/admin/registrations', { q: '', eventId: '', status: '', payment: '', discipline: '', page: 1, sort: '', dir: 'desc' })
const { filters, data, loading, sort, setSort } = list

const columns = [
  { key: 'code', label: 'Entry', sortable: true },
  { key: 'event', label: 'Championship', sortable: true },
  { key: 'team', label: 'Team / club', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'athlete', label: 'Athletes', sortable: true },
  { key: 'submitted', label: 'Submitted', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'payment', label: 'Payment', sortable: true },
  { key: 'fee', label: 'Fee', sortable: true, align: 'right' },
]

const selected = ref([])
watch(() => data.value.items, () => (selected.value = []))

const ACTIONS = {
  start_review: { label: 'Start review', note: false },
  approve: { label: 'Approve', note: false },
  request_correction: { label: 'Request correction', note: true },
  reject: { label: 'Reject', note: true, danger: true },
}
const bulkBusy = ref(false)

async function bulk(action) {
  const spec = ACTIONS[action]
  const n = selected.value.length
  const title = `${spec.label}: ${n} entr${n === 1 ? 'y' : 'ies'}`
  let note = null
  if (spec.note) {
    note = await confirmDialog({
      title,
      message: 'The note is sent to each club. Entries that cannot take this decision are skipped.',
      confirmLabel: spec.label,
      danger: spec.danger,
      input: { label: action === 'reject' ? 'Reason for rejection' : 'What needs to be corrected?', required: true },
    })
    if (!note) return
  } else if (!(await confirmDialog({ title, message: 'Clubs are notified. Entries that cannot take this decision are skipped.', confirmLabel: spec.label }))) {
    return
  }
  bulkBusy.value = true
  try {
    const res = await http.post('/admin/registrations/bulk-review', { ids: selected.value, action, note: note || undefined })
    if (res.updated) toast.success(`${res.updated} entr${res.updated === 1 ? 'y' : 'ies'} updated.`)
    if (res.skipped?.length) toast.info(`${res.skipped.length} skipped: ${res.skipped[0].reason}`)
    selected.value = []
    list.load()
  } catch (err) {
    toast.error(err)
  } finally {
    bulkBusy.value = false
  }
}

const exporting = ref(false)
async function exportCsv() {
  exporting.value = true
  try {
    await download('/admin/reports/entries.csv', { eventId: filters.eventId }, 'entries.csv')
  } catch (err) {
    toast.error(err)
  } finally {
    exporting.value = false
  }
}

function clearFilters() {
  Object.assign(filters, { q: '', eventId: '', status: '', payment: '', discipline: '' })
}
const hasFilters = () => filters.q || filters.eventId || filters.status || filters.payment || filters.discipline
</script>

<template>
  <div>
    <PageHeader eyebrow="Administration" title="Registrations" subtitle="Review entries, approve or send them back for correction.">
      <template #actions>
        <BaseButton variant="outline" size="sm" icon="download" :disabled="!filters.eventId || exporting" :title="filters.eventId ? undefined : 'Choose a championship to export'" @click="exportCsv">
          {{ exporting ? 'Exporting…' : 'Export CSV' }}
        </BaseButton>
      </template>
    </PageHeader>

    <div class="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(14rem,1fr)_repeat(4,minmax(9rem,12rem))]">
      <SearchBox v-model="filters.q" label="Search registrations" placeholder="Entry ID, athlete, team, club" class="sm:col-span-2 lg:col-span-1 sm:max-w-none" />
      <div>
        <label for="f-event" class="sr-only">Championship</label>
        <select id="f-event" v-model="filters.eventId" class="p-select">
          <option value="">All championships</option>
          <option v-for="e in events" :key="e.id" :value="String(e.id)">{{ e.name }}</option>
        </select>
      </div>
      <div>
        <label for="f-status" class="sr-only">Status</label>
        <select id="f-status" v-model="filters.status" class="p-select">
          <option value="">Any status</option>
          <option v-for="(s, key) in ENTRY_STATUS" :key="key" :value="key">{{ s.label }}</option>
        </select>
      </div>
      <div>
        <label for="f-payment" class="sr-only">Payment</label>
        <select id="f-payment" v-model="filters.payment" class="p-select">
          <option value="">Any payment</option>
          <option v-for="key in ['unpaid', 'pending', 'paid', 'waived', 'refunded']" :key="key" :value="key">{{ PAYMENT_STATUS[key].label }}</option>
        </select>
      </div>
      <div>
        <label for="f-disc" class="sr-only">Discipline</label>
        <select id="f-disc" v-model="filters.discipline" class="p-select">
          <option value="">All disciplines</option>
          <option v-for="(label, key) in DISCIPLINE_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
    </div>

    <div v-if="selected.length" class="sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-2 border border-ember/50 bg-coal px-4 py-3" role="region" aria-label="Bulk actions">
      <p class="mr-auto text-sm font-semibold text-bone">{{ selected.length }} selected</p>
      <button v-for="(spec, key) in ACTIONS" :key="key" type="button" class="h-9 border px-3 text-sm font-semibold transition-colors disabled:opacity-50" :class="spec.danger ? 'border-danger/60 text-danger hover:bg-danger/10' : 'border-line text-bone hover:border-ember hover:text-ember'" :disabled="bulkBusy" @click="bulk(key)">
        {{ spec.label }}
      </button>
      <button type="button" class="h-9 px-2 text-sm text-smoke hover:text-bone" @click="selected = []">Clear</button>
    </div>

    <DataTable
      v-model:selected="selected"
      :columns="columns"
      :rows="data.items"
      :sort="sort"
      :loading="loading"
      clickable
      selectable
      caption="Registrations"
      @sort="setSort"
      @row-click="(row) => router.push(`/portal/admin/registrations/${row.id}`)"
    >
      <template #cell-code="{ row }">
        <RouterLink :to="`/portal/admin/registrations/${row.id}`" class="font-mono text-sm text-bone hover:text-ember" @click.stop>{{ row.code }}</RouterLink>
      </template>
      <template #cell-event="{ row }"><span class="line-clamp-2 max-w-[14rem]">{{ row.event_name }}</span></template>
      <template #cell-team="{ row }">
        <span class="text-bone">{{ row.team_name }}</span>
        <span class="block text-xs text-smoke">{{ row.club_name }}</span>
      </template>
      <template #cell-category="{ row }">
        <span class="line-clamp-2 max-w-[16rem]">{{ row.category_name }}</span>
        <span v-if="row.weight_name" class="block text-xs text-smoke">{{ row.weight_name }}</span>
      </template>
      <template #cell-athlete="{ row }"><span class="line-clamp-2 max-w-[14rem]">{{ row.athlete_names }}</span></template>
      <template #cell-submitted="{ row }"><span class="whitespace-nowrap">{{ fmtDateTime(row.submitted_at || row.created_at) }}</span></template>
      <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #cell-payment="{ row }"><StatusBadge :value="row.payment_status" kind="payment" /></template>
      <template #cell-fee="{ row }"><span class="whitespace-nowrap">{{ fmtMoney(row.fee_amount, row.currency) }}</span></template>
      <template #empty>
        <EmptyState icon="clipboard" title="No registrations" :message="hasFilters() ? 'No entries match these filters.' : 'Submitted entries will appear here.'" class="border-0">
          <BaseButton v-if="hasFilters()" size="sm" variant="outline" @click="clearFilters">Clear filters</BaseButton>
        </EmptyState>
      </template>
    </DataTable>

    <Pager v-model:page="filters.page" :pages="data.pages" :total="data.total" :page-size="data.pageSize" />
  </div>
</template>
