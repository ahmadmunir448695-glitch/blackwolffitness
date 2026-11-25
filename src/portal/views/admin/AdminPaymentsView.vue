<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import PageHeader from '../../components/PageHeader.vue'
import DataTable from '../../components/DataTable.vue'
import Pager from '../../components/Pager.vue'
import SearchBox from '../../components/SearchBox.vue'
import StatCard from '../../components/StatCard.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import { http, openFile } from '../../lib/api.js'
import { fmtDateTime, fmtMoney, humanize } from '../../lib/format.js'
import { confirmDialog, toast } from '../../lib/ui.js'
import { useAdminEvents, usePagedList } from './adminShared.js'

const { events } = useAdminEvents()
const { filters, data, loading, load } = usePagedList('/admin/payments', { q: '', status: 'pending', eventId: '', page: 1 })

const columns = [
  { key: 'registration_code', label: 'Entry' },
  { key: 'club_name', label: 'Club' },
  { key: 'event_name', label: 'Championship' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'method', label: 'Method' },
  { key: 'created_at', label: 'Reported' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', align: 'right' },
]

const busy = ref(0)
async function decide(p, status) {
  let note = null
  if (status === 'rejected') {
    note = await confirmDialog({ title: 'Reject payment?', message: `${p.registration_code} · ${fmtMoney(p.amount, p.currency)}`, confirmLabel: 'Reject payment', danger: true, input: { label: 'Reason (sent to the club)', required: true } })
    if (!note) return
  } else if (!(await confirmDialog({ title: 'Confirm payment received?', message: `${fmtMoney(p.amount, p.currency)} from ${p.club_name} for ${p.registration_code}.`, confirmLabel: 'Confirm paid' }))) return
  busy.value = p.id
  try {
    await http.post(`/admin/payments/${p.id}`, { status, note })
    toast.success(status === 'paid' ? 'Payment confirmed.' : 'Payment rejected.')
    load()
  } catch (err) {
    toast.error(err)
  } finally {
    busy.value = 0
  }
}
const receipt = (p) => openFile(`/documents/${p.proof_document_id}/download`).catch(toast.error)
</script>

<template>
  <div>
    <PageHeader eyebrow="Administration" title="Payments" subtitle="Payments reported by clubs. Confirm them once the money has arrived." />

    <div class="mb-6 grid gap-4 sm:grid-cols-2">
      <StatCard label="Confirmed (this view)" :value="fmtMoney(data.totals?.paid ?? 0)" icon="check" />
      <StatCard label="Waiting for confirmation" :value="fmtMoney(data.totals?.pending ?? 0)" icon="clock" accent />
    </div>

    <div class="mb-4 flex flex-col gap-2 lg:flex-row">
      <SearchBox v-model="filters.q" placeholder="Entry, club or reference" label="Search payments" />
      <label class="lg:w-48"><span class="sr-only">Status</span>
        <select v-model="filters.status" class="p-select"><option value="">All statuses</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="rejected">Rejected</option><option value="refunded">Refunded</option></select>
      </label>
      <label class="lg:w-64"><span class="sr-only">Championship</span>
        <select v-model="filters.eventId" class="p-select"><option value="">All championships</option><option v-for="e in events" :key="e.id" :value="String(e.id)">{{ e.name }}</option></select>
      </label>
    </div>

    <DataTable :columns="columns" :rows="data.items" :loading="loading" caption="Payments">
      <template #cell-registration_code="{ row }"><RouterLink :to="`/portal/admin/registrations/${row.registration_id}`" class="font-mono font-semibold text-bone hover:text-ember">{{ row.registration_code }}</RouterLink></template>
      <template #cell-amount="{ row }"><span class="font-semibold text-bone">{{ fmtMoney(row.amount, row.currency) }}</span><span class="block text-xs text-smoke">fee {{ fmtMoney(row.fee_amount, row.currency) }}</span></template>
      <template #cell-method="{ row }">{{ humanize(row.method) }}<span v-if="row.reference" class="block text-xs text-smoke">Ref {{ row.reference }}</span></template>
      <template #cell-created_at="{ row }">{{ fmtDateTime(row.created_at) }}<span v-if="row.recorded_by_name" class="block text-xs text-smoke">by {{ row.recorded_by_name }}</span></template>
      <template #cell-status="{ row }"><StatusBadge :value="row.status" kind="payment" /></template>
      <template #cell-actions="{ row }">
        <div class="flex justify-end gap-1.5">
          <button v-if="row.proof_document_id" type="button" class="p-icon-btn" aria-label="View receipt" title="View receipt" @click="receipt(row)"><AppIcon name="eye" class="h-4 w-4" /></button>
          <template v-if="row.status === 'pending'">
            <button type="button" class="h-9 bg-success/90 px-3 text-xs font-semibold text-ink hover:bg-success" :disabled="busy === row.id" @click="decide(row, 'paid')">Confirm</button>
            <button type="button" class="h-9 border border-danger/60 px-3 text-xs font-semibold text-danger hover:bg-danger/10" :disabled="busy === row.id" @click="decide(row, 'rejected')">Reject</button>
          </template>
        </div>
      </template>
      <template #empty><p class="px-6 py-10 text-center text-sm text-smoke">No payments match these filters.</p></template>
    </DataTable>
    <Pager v-model:page="filters.page" :pages="data.pages" :total="data.total" :page-size="data.pageSize" />
  </div>
</template>
